import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { randomBytes, createHash } from "node:crypto";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import { sendVerificationEmail } from "../service/mail.service.js";
import { config } from "../config/config.js";
import imagekit from "../service/imagekit.js";

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

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "student",
      isEmailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const frontendBase = config.FRONTEND_URL
      ? config.FRONTEND_URL.split(",")[0].trim()
      : "https://vertex-mu-eight.vercel.app";
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

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
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

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken({
      id: user._id,
    });

    const isSecureCookie =
      process.env.NODE_ENV === "production" ||
      req.secure ||
      req.headers["x-forwarded-proto"] === "https" ||
      (req.headers.origin && req.headers.origin.startsWith("https://"));

    res.cookie("token", token, {
      httpOnly: true,
      secure: isSecureCookie,
      sameSite: isSecureCookie ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
    });

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
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt,
      },
    },
  });
});

export const logoutController = asyncHandler(async (req, res) => {
  const isSecureCookie =
    process.env.NODE_ENV === "production" ||
    req.secure ||
    req.headers["x-forwarded-proto"] === "https" ||
    (req.headers.origin && req.headers.origin.startsWith("https://"));

  res.clearCookie("token", {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: isSecureCookie ? "none" : "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

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
      : "https://vertex-mu-eight.vercel.app";
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

