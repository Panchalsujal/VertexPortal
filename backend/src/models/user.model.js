import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: false,
      select: false,
    },

    googleId: {
      type: String,
      default: null,
      sparse: true,
      index: true,
    },

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    referralStats: {
      totalReferrals: { type: Number, default: 0 },
      rewardPoints: { type: Number, default: 0 },
    },

    avatarUrl: {
      type: String,
      default: "https://ik.imagekit.io/Sujalpanchal/default.avif",
    },
    avatarFileId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      select: false,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    // ─── Layer 1: Brute-Force Account Lockout ───────────────────────────────
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    lockoutUntil: {
      type: Date,
      default: null,
      select: false,
    },

    // ─── Layer 3: IP Anomaly Detection ──────────────────────────────────────
    lastLoginIP: {
      type: String,
      default: null,
    },

    knownIPs: {
      type: [String],
      default: [],
      select: false,
    },

    // ─── Layer 10: Password History (Admin/Instructor reuse prevention) ──────
    passwordHistory: {
      type: [String],
      default: [],
      select: false,
    },

    learningStreak: {
      currentStreak: { type: Number, default: 1 },
      longestStreak: { type: Number, default: 1 },
      lastActiveDate: { type: Date, default: Date.now },
    },

    badges: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: "" },
        icon: { type: String, default: "award" },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
