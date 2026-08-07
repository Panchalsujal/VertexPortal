import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      unique: true,
      index: true,
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },

    instructorName: {
      type: String,
      trim: true,
      default: "",
    },

    completionPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },

    completedAt: {
      type: Date,
      required: true,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    certificateUrl: {
      type: String,
      default: null,
      trim: true,
    },

    certificateFileId: {
      type: String,
      default: null,
      trim: true,
    },

    verificationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["issued", "revoked"],
      default: "issued",
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    revocationReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

certificateSchema.index(
  {
    student: 1,
    course: 1,
  },
  {
    unique: true,
  },
);

const Certificate = mongoose.model(
  "Certificate",
  certificateSchema,
);

export default Certificate;