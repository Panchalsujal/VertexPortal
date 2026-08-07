import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
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

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "expired"],
      default: "active",
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedLecturesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastWatchedLecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    certificateStatus: {
      type: String,
      enum: ["not_eligible", "pending", "issued", "failed"],
      default: "not_eligible",
      index: true,
    },

    certificateIssuedAt: {
      type: Date,
      default: null,
    },

    certificateIssueError: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    certificateIssueAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastWatchedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

enrollmentSchema.index(
  {
    student: 1,
    course: 1,
  },
  {
    unique: true,
    name: "student_1_course_1",
  },
);

enrollmentSchema.index({
  student: 1,
  status: 1,
});

enrollmentSchema.index({
  course: 1,
  status: 1,
});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
