import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseModule",
      default: null,
      index: true,
    },

    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      default: null,
      index: true,
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000,
    },

    instructions: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },

    attachmentUrl: {
      type: String,
      trim: true,
      default: null,
    },

    attachmentFileId: {
      type: String,
      trim: true,
      default: null,
    },

    attachmentName: {
      type: String,
      trim: true,
      default: null,
    },

    attachmentMimeType: {
      type: String,
      trim: true,
      default: null,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 1,
      max: 1000,
      default: 100,
    },

    passingMarks: {
      type: Number,
      required: true,
      min: 0,
      default: 40,
    },

    maxAttempts: {
      type: Number,
      min: 1,
      max: 100,
      default: 1,
    },

    availableFrom: {
      type: Date,
      default: null,
    },

    dueAt: {
      type: Date,
      required: true,
      index: true,
    },

    allowLateSubmission: {
      type: Boolean,
      default: false,
    },

    lateSubmissionUntil: {
      type: Date,
      default: null,
    },

    allowedSubmissionTypes: {
      type: [
        {
          type: String,
          enum: ["text", "file", "link"],
        },
      ],
      default: ["file"],
    },

    allowedFileTypes: {
      type: [String],
      default: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/zip",
      ],
    },

    maxFileSizeInBytes: {
      type: Number,
      min: 1,
      default: 10 * 1024 * 1024,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

assignmentSchema.index({
  course: 1,
  module: 1,
  createdAt: -1,
});

assignmentSchema.index({
  instructor: 1,
  status: 1,
  dueAt: 1,
});

assignmentSchema.pre("validate", function (next) {
  if (this.availableFrom && this.dueAt && this.dueAt <= this.availableFrom) {
    return next(
      new Error("Assignment due date must be after available from date"),
    );
  }

  if (this.passingMarks > this.totalMarks) {
    return next(new Error("Passing marks cannot be greater than total marks"));
  }

  if (this.allowLateSubmission && !this.lateSubmissionUntil) {
    return next(
      new Error(
        "Late submission deadline is required when late submission is enabled",
      ),
    );
  }

  if (
    this.lateSubmissionUntil &&
    this.dueAt &&
    this.lateSubmissionUntil <= this.dueAt
  ) {
    return next(
      new Error("Late submission deadline must be after assignment due date"),
    );
  }

  if (
    !Array.isArray(this.allowedSubmissionTypes) ||
    this.allowedSubmissionTypes.length === 0
  ) {
    return next(
      new Error("At least one assignment submission type is required"),
    );
  }

  if (this.status === "published") {
    this.isPublished = true;
    this.isActive = true;
    this.publishedAt = this.publishedAt ?? new Date();
  }

  if (this.status === "draft") {
    this.isPublished = false;
    this.isActive = true;
    this.publishedAt = null;
  }

  if (this.status === "archived") {
    this.isPublished = false;
    this.isActive = false;
    this.publishedAt = null;
  }
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
