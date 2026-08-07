import mongoose from "mongoose";

const submissionFileSchema = new mongoose.Schema(
  {
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },

    fileId: {
      type: String,
      required: true,
      trim: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
      trim: true,
    },

    fileSizeInBytes: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  {
    _id: true,
    versionKey: false,
  },
);

const assignmentSubmissionSchema =
  new mongoose.Schema(
    {
      assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: true,
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
        index: true,
      },

      attemptNumber: {
        type: Number,
        required: true,
        min: 1,
      },

      textAnswer: {
        type: String,
        trim: true,
        default: "",
        maxlength: 10000,
      },

      linkAnswer: {
        type: String,
        trim: true,
        default: "",
        maxlength: 2000,
      },

      files: {
        type: [submissionFileSchema],
        default: [],
      },

      status: {
        type: String,
        enum: [
          "draft",
          "submitted",
          "under_review",
          "graded",
          "returned",
          "cancelled",
        ],
        default: "draft",
        index: true,
      },

      isLate: {
        type: Boolean,
        default: false,
        index: true,
      },

      submittedAt: {
        type: Date,
        default: null,
        index: true,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      gradedAt: {
        type: Date,
        default: null,
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      marksAwarded: {
        type: Number,
        default: null,
        min: 0,
      },

      totalMarks: {
        type: Number,
        required: true,
        min: 1,
      },

      percentage: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },

      isPassed: {
        type: Boolean,
        default: null,
      },

      feedback: {
        type: String,
        trim: true,
        default: "",
        maxlength: 5000,
      },

      privateNote: {
        type: String,
        trim: true,
        default: "",
        maxlength: 5000,
        select: false,
      },

      returnedAt: {
        type: Date,
        default: null,
      },

      returnReason: {
        type: String,
        trim: true,
        default: "",
        maxlength: 2000,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

assignmentSubmissionSchema.index(
  {
    assignment: 1,
    student: 1,
    attemptNumber: 1,
  },
  {
    unique: true,
  },
);

assignmentSubmissionSchema.index({
  assignment: 1,
  status: 1,
  submittedAt: -1,
});

assignmentSubmissionSchema.index({
  student: 1,
  course: 1,
  createdAt: -1,
});

assignmentSubmissionSchema.pre(
  "validate",
  function (next) {
    const hasText =
      Boolean(this.textAnswer?.trim());

    const hasLink =
      Boolean(this.linkAnswer?.trim());

    const hasFiles =
      Array.isArray(this.files) &&
      this.files.length > 0;

    if (
      ["submitted", "under_review", "graded"].includes(
        this.status,
      ) &&
      !hasText &&
      !hasLink &&
      !hasFiles
    ) {
      return next(
        new Error(
          "Assignment submission requires text, link, or at least one file",
        ),
      );
    }

    if (
      this.marksAwarded !== null &&
      this.marksAwarded > this.totalMarks
    ) {
      return next(
        new Error(
          "Awarded marks cannot be greater than total marks",
        ),
      );
    }

    if (this.status === "graded") {
      if (this.marksAwarded === null) {
        return next(
          new Error(
            "Marks are required before grading the submission",
          ),
        );
      }

      this.percentage = Number(
        (
          (this.marksAwarded /
            this.totalMarks) *
          100
        ).toFixed(2),
      );

      this.gradedAt =
        this.gradedAt ?? new Date();
    }

    if (this.status === "returned") {
      if (!this.returnReason?.trim()) {
        return next(
          new Error(
            "Return reason is required when submission is returned",
          ),
        );
      }

      this.returnedAt =
        this.returnedAt ?? new Date();
    }
  },
);

const AssignmentSubmission =
  mongoose.model(
    "AssignmentSubmission",
    assignmentSubmissionSchema,
  );

export default AssignmentSubmission;