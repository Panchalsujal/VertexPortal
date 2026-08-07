import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
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

    questionOrder: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuizQuestion",
      },
    ],

    shuffleSeed: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["in_progress", "submitted", "evaluated", "expired", "cancelled"],
      default: "in_progress",
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    evaluatedAt: {
      type: Date,
      default: null,
    },

    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    attemptedQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    incorrectAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },

    skippedQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    obtainedMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    negativeMarksDeducted: {
      type: Number,
      default: 0,
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    passingPercentage: {
      type: Number,
      default: 40,
      min: 0,
      max: 100,
    },

    isPassed: {
      type: Boolean,
      default: false,
    },

    timeSpentInSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    autoSubmitted: {
      type: Boolean,
      default: false,
    },

    submissionReason: {
      type: String,
      enum: ["manual", "time_expired", "admin_submitted", "system", null],
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

quizAttemptSchema.index(
  {
    quiz: 1,
    student: 1,
    attemptNumber: 1,
  },
  {
    unique: true,
  },
);

quizAttemptSchema.index({
  student: 1,
  status: 1,
  createdAt: -1,
});

quizAttemptSchema.index({
  quiz: 1,
  status: 1,
  submittedAt: -1,
});

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

export default QuizAttempt;
