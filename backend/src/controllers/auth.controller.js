import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken, generateElevatedToken } from "../utils/generateToken.js";
import { sendVerificationEmail, sendPasswordResetEmail, sendAdminLoginAlertEmail } from "../service/mail.service.js";
import { config } from "../config/config.js";
import imagekit from "../service/imagekit.js";

// ─── Security Constants ────────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;       // Layer 1: Account lockout after N failures
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const PASSWORD_HISTORY_LIMIT = 5;   // Layer 10: Prevent reuse of last 5 passwords
const MAX_KNOWN_IPS = 10;           // Layer 3: Max IPs stored per user

/**
 * Helper: returns the real client IP respecting proxy headers.
 */
function getClientIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

/**
 * Helper: build the cookie options object once.
 */
function buildCookieOptions(req, maxAgeMs) {
  const isSecureCookie =
    process.env.NODE_ENV === "production" ||
    req.secure ||
    req.headers["x-forwarded-proto"] === "https" ||
    (req.headers.origin && req.headers.origin.startsWith("https://"));

  return {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: isSecureCookie ? "none" : "lax",
    maxAge: maxAgeMs,
  };
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export const registerController = asyncHandler(async (req, res) => {
  try {
    // Role is intentionally ignored on public registration — always 'student'.
  // Admins can promote users via the Admin Panel.
  const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationToken = randomBytes(32).toString("hex");

    const hashedVerificationToken = createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const generatedReferralCode = "VP-" + randomBytes(3).toString("hex").toUpperCase();
    let referrer = null;
    if (req.body.referralCode || req.body.ref) {
      const code = (req.body.referralCode || req.body.ref).toString().trim().toUpperCase();
      referrer = await User.findOne({ referralCode: code });
    }

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "student",
      isEmailVerified: false,
      referralCode: generatedReferralCode,
      referredBy: referrer ? referrer._id : null,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      passwordHistory: [hashedPassword], // Layer 10: initialize history
    });

    if (referrer) {
      await User.findByIdAndUpdate(referrer._id, {
        $inc: { "referralStats.totalReferrals": 1, "referralStats.rewardPoints": 50 },
      });
    }

    const frontendBase = config.FRONTEND_URL
      ? config.FRONTEND_URL.split(",")[0].trim()
      : "https://navgujaratacademy.online";
    const verificationLink = `${frontendBase}/verify-email/${user._id}/${verificationToken}`;

    try {
      await sendVerificationEmail({
        user,
        verificationLink,
      });
      console.log(`[AUTH] Verification email dispatched to ${user.email}`);
    } catch (emailError) {
      console.error("Verification email error:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email to log in.",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          status: user.status,
          isActive: user.isActive,
          isEmailVerified: false,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Register controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export const loginController = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Layer 1: Fetch lockout + login attempt fields ──────────────────────
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password +loginAttempts +lockoutUntil +knownIPs +passwordHistory");

    if (!user) {
      // Generic response — don't reveal whether email exists
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ── Layer 1: Account lockout check ────────────────────────────────────
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
        code: "ACCOUNT_LOCKED",
        retryAfter: user.lockoutUntil,
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      // ── Layer 1: Increment failed attempts & possibly lock account ───────
      const newAttempts = (user.loginAttempts || 0) + 1;
      const updateData = { loginAttempts: newAttempts };

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        updateData.loginAttempts = 0;
        console.warn(`[SECURITY] Account LOCKED: ${user.email} after ${newAttempts} failed attempts`);
      }

      await User.findByIdAndUpdate(user._id, updateData);

      const attemptsLeft = MAX_LOGIN_ATTEMPTS - newAttempts;
      return res.status(401).json({
        success: false,
        message: newAttempts >= MAX_LOGIN_ATTEMPTS
          ? "Account temporarily locked after too many failed attempts. Try again in 15 minutes."
          : `Invalid email or password. ${attemptsLeft > 0 ? `${attemptsLeft} attempt(s) remaining before lockout.` : ""}`,
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    if (!user.isActive || user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive or suspended",
      });
    }

    // ── Layer 1: Reset lockout on successful login ─────────────────────────
    const clientIP = getClientIP(req);

    // ── Layer 3: IP Anomaly Detection ─────────────────────────────────────
    const isKnownIP = user.knownIPs?.includes(clientIP);
    const knownIPs = user.knownIPs || [];

    if (!isKnownIP) {
      // Store new IP (cap to MAX_KNOWN_IPS)
      const updatedIPs = [clientIP, ...knownIPs].slice(0, MAX_KNOWN_IPS);

      if (["admin", "instructor"].includes(user.role)) {
        // Fire alert email for privileged accounts from unknown IPs (non-blocking)
        sendAdminLoginAlertEmail({
          user,
          ip: clientIP,
          userAgent: req.headers["user-agent"],
          loginAt: new Date(),
        }).catch((err) => console.error("[SECURITY] IP alert email failed:", err.message));

        console.warn(
          `[SECURITY] Admin/Instructor ${user.email} logged in from NEW IP: ${clientIP}`
        );
      }

      await User.findByIdAndUpdate(user._id, {
        $set: {
          loginAttempts: 0,
          lockoutUntil: null,
          lastLoginAt: new Date(),
          lastLoginIP: clientIP,
          knownIPs: updatedIPs,
        },
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          loginAttempts: 0,
          lockoutUntil: null,
          lastLoginAt: new Date(),
          lastLoginIP: clientIP,
        },
      });
    }

    // ── Standard token (7 days) ────────────────────────────────────────────
    const token = generateToken({ id: user._id });
    const cookieOpts7d = buildCookieOptions(req, 7 * 24 * 60 * 60 * 1000);
    res.cookie("token", token, cookieOpts7d);

    // ── Layer 2: Elevated session token (1h) for admin/instructor ──────────
    if (["admin", "instructor"].includes(user.role)) {
      const elevatedToken = generateElevatedToken({ id: user._id, role: user.role });
      const elevatedOpts = buildCookieOptions(req, 60 * 60 * 1000); // 1 hour
      res.cookie("admin_session", elevatedToken, elevatedOpts);
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          lastLoginIP: clientIP,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          avatarUrl: user.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error("Login controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ─── GET ME ───────────────────────────────────────────────────────────────────

export const getMeController = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: {
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        avatarUrl: req.user.avatarUrl,
        isEmailVerified: req.user.isEmailVerified,
        isActive: req.user.isActive,
        lastLoginAt: req.user.lastLoginAt,
        lastLoginIP: req.user.lastLoginIP,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    },
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

export const logoutController = asyncHandler(async (req, res) => {
  const isSecureCookie =
    process.env.NODE_ENV === "production" ||
    req.secure ||
    req.headers["x-forwarded-proto"] === "https" ||
    (req.headers.origin && req.headers.origin.startsWith("https://"));

  const clearOpts = {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: isSecureCookie ? "none" : "lax",
  };

  res.clearCookie("token", clearOpts);
  res.clearCookie("admin_session", clearOpts); // Layer 2: clear elevated session

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────

export const verifyEmailController = asyncHandler(async (req, res) => {
  try {
    const { userId, token } = req.params;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const hashedToken = createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      _id: userId,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: {
        $gt: new Date(),
      },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Verification link is invalid or expired",
      });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: "Email is already verified",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      },
    });
  } catch (error) {
    console.error("Verify email controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ─── RESEND VERIFICATION ──────────────────────────────────────────────────────

export const resendVerificationController = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "This account is already verified. Please log in.",
      });
    }

    const verificationToken = randomBytes(32).toString("hex");
    const hashedVerificationToken = createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    user.emailVerificationToken = hashedVerificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const frontendBase = config.FRONTEND_URL
      ? config.FRONTEND_URL.split(",")[0].trim()
      : "https://navgujaratacademy.online";
    const verificationLink = `${frontendBase}/verify-email/${user._id}/${verificationToken}`;

    await sendVerificationEmail({
      user,
      verificationLink,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ─── GOOGLE AUTH ──────────────────────────────────────────────────────────────

export const googleAuthController = asyncHandler(async (req, res) => {
  try {
    const { credential, accessToken, referralCode, ref } = req.body;
    if (!credential && !accessToken) {
      return res.status(400).json({
        success: false,
        message: "Google credential token or access token is required",
      });
    }

    let payload = null;

    // 1. If accessToken provided (OAuth2 Token Client flow), fetch profile directly from Google
    if (accessToken) {
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          payload = await userInfoRes.json();
        }
      } catch (err) {
        console.error("Google userinfo fetch failed:", err);
      }
    }

    // 2. If credential (ID token) provided (Google One-Tap / GSI button flow)
    if (!payload && credential) {
      try {
        const googleRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        if (googleRes.ok) {
          payload = await googleRes.json();
        }
      } catch {
        // Fallback to JWT payload decode
      }

      if (!payload || !payload.email) {
        try {
          const parts = credential.split(".");
          if (parts.length === 3) {
            const raw = Buffer.from(parts[1], "base64").toString("utf8");
            payload = JSON.parse(raw);
          }
        } catch {
          return res.status(400).json({
            success: false,
            message: "Invalid Google credential format",
          });
        }
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: "Unable to retrieve email from Google authentication",
      });
    }

    const email = payload.email.toLowerCase().trim();
    const fullName = payload.name || payload.given_name || email.split("@")[0];
    const googleId = payload.sub;
    const avatarUrl = payload.picture || "https://ik.imagekit.io/Sujalpanchal/default.avif";

    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    }).select("+knownIPs");

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (!user.isEmailVerified) user.isEmailVerified = true;
      if (!user.avatarUrl || user.avatarUrl.includes("default.avif")) {
        user.avatarUrl = avatarUrl;
      }
      user.lastLoginAt = new Date();

      // ── Layer 3: Google OAuth IP tracking ─────────────────────────────
      const clientIP = getClientIP(req);
      const isKnownIP = user.knownIPs?.includes(clientIP);
      if (!isKnownIP) {
        user.knownIPs = [clientIP, ...(user.knownIPs || [])].slice(0, MAX_KNOWN_IPS);
        user.lastLoginIP = clientIP;

        if (["admin", "instructor"].includes(user.role)) {
          sendAdminLoginAlertEmail({
            user,
            ip: clientIP,
            userAgent: req.headers["user-agent"],
            loginAt: new Date(),
          }).catch((err) => console.error("[SECURITY] Google OAuth IP alert failed:", err.message));
        }
      } else {
        user.lastLoginIP = clientIP;
      }

      await user.save();
    } else {
      const generatedReferralCode = "VP-" + randomBytes(3).toString("hex").toUpperCase();
      let referrer = null;
      const refCode = referralCode || ref;
      if (refCode) {
        const code = refCode.toString().trim().toUpperCase();
        referrer = await User.findOne({ referralCode: code });
      }

      const clientIP = getClientIP(req);

      user = await User.create({
        fullName,
        email,
        googleId,
        avatarUrl,
        role: "student",
        isEmailVerified: true,
        isActive: true,
        status: "active",
        referralCode: generatedReferralCode,
        referredBy: referrer ? referrer._id : null,
        lastLoginAt: new Date(),
        lastLoginIP: clientIP,
        knownIPs: [clientIP],
      });

      if (referrer) {
        await User.findByIdAndUpdate(referrer._id, {
          $inc: { "referralStats.totalReferrals": 1, "referralStats.rewardPoints": 50 },
        });
      }
    }

    if (!user.isActive || user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive or suspended",
      });
    }

    const token = generateToken({ id: user._id });
    const cookieOpts7d = buildCookieOptions(req, 7 * 24 * 60 * 60 * 1000);
    res.cookie("token", token, cookieOpts7d);

    // ── Layer 2: Elevated session for admin/instructor via Google OAuth ────
    if (["admin", "instructor"].includes(user.role)) {
      const elevatedToken = generateElevatedToken({ id: user._id, role: user.role });
      const elevatedOpts = buildCookieOptions(req, 60 * 60 * 1000);
      res.cookie("admin_session", elevatedToken, elevatedOpts);
    }

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          status: user.status,
          avatarUrl: user.avatarUrl,
          isEmailVerified: user.isEmailVerified,
          learningStreak: user.learningStreak,
          referralCode: user.referralCode,
          referralStats: user.referralStats,
        },
      },
    });
  } catch (error) {
    console.error("Google auth controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Google authentication failed",
    });
  }
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

export const forgotPasswordController = asyncHandler(async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    const resetToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const frontendBase = config.FRONTEND_URL
      ? config.FRONTEND_URL.split(",")[0].trim()
      : "http://localhost:5173";
    const resetLink = `${frontendBase}/reset-password/${user._id}/${resetToken}`;

    try {
      await sendPasswordResetEmail({
        user,
        resetLink,
      });
    } catch (emailErr) {
      console.error("Failed to send password reset email:", emailErr);
    }

    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ─── VERIFY RESET TOKEN ───────────────────────────────────────────────────────

export const verifyResetTokenController = asyncHandler(async (req, res) => {
  try {
    const { userId, token } = req.params;
    if (!userId || !token || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset link",
      });
    }

    const hashedToken = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      _id: userId,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid or has expired.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    console.error("Verify reset token controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

export const resetPasswordController = asyncHandler(async (req, res) => {
  try {
    const { userId, token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!userId || !token || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset link",
      });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const hashedToken = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      _id: userId,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires +password +passwordHistory");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid or has expired.",
      });
    }

    // ── Layer 10: Password history check for admin/instructor ─────────────
    if (["admin", "instructor"].includes(user.role) && user.passwordHistory?.length) {
      for (const oldHash of user.passwordHistory) {
        const isReused = await bcrypt.compare(newPassword, oldHash);
        if (isReused) {
          return res.status(400).json({
            success: false,
            message: `Password cannot be one of your last ${PASSWORD_HISTORY_LIMIT} passwords. Please choose a different password.`,
          });
        }
      }
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    // ── Layer 10: Update password history ─────────────────────────────────
    const updatedHistory = [newHash, ...(user.passwordHistory || [])].slice(
      0,
      PASSWORD_HISTORY_LIMIT
    );

    user.password = newHash;
    user.passwordHistory = updatedHistory;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // ── Layer 1: Also clear any active lockout on password reset ──────────
    user.loginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
