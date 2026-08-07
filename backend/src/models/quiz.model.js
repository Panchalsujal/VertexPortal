import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
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
      trim: true,
      default: "",
      maxlength: 1000,
    },

    instructions: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    durationInMinutes: {
      type: Number,
      default: null,
      min: 1,
      max: 600,
    },

    passingPercentage: {
      type: Number,
      default: 40,
      min: 0,
      max: 100,
    },

    totalQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxAttempts: {
      type: Number,
      default: 1,
      min: 1,
      max: 100,
    },

    availableFrom: {
      type: Date,
      default: null,
    },

    availableUntil: {
      type: Date,
      default: null,
    },

    shuffleQuestions: {
      type: Boolean,
      default: false,
    },

    shuffleOptions: {
      type: Boolean,
      default: false,
    },

    showResultImmediately: {
      type: Boolean,
      default: true,
    },

    showCorrectAnswers: {
      type: Boolean,
      default: false,
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

quizSchema.index({
  course: 1,
  module: 1,
  createdAt: -1,
});

quizSchema.index({
  instructor: 1,
  status: 1,
  createdAt: -1,
});

quizSchema.pre("validate", function (next) {
  if (
    this.availableFrom &&
    this.availableUntil &&
    this.availableUntil <= this.availableFrom
  ) {
    return next(
      new Error("Quiz available until date must be after available from date"),
    );
  }

  if (this.isPublished && this.status !== "published") {
    this.status = "published";
  }

  if (this.status === "published") {
    this.isPublished = true;
    this.publishedAt = this.publishedAt ?? new Date();
  }

  if (this.status === "draft" || this.status === "archived") {
    this.isPublished = false;
  }
});

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
