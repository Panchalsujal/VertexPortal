import mongoose from "mongoose";

const quizAnswerSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizAttempt",
      required: true,
      index: true,
    },

    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizQuestion",
      required: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    questionType: {
      type: String,
      enum: [
        "single_choice",
        "multiple_choice",
        "true_false",
        "short_answer",
      ],
      required: true,
    },

    selectedOptionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],

    answerText: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    isAnswered: {
      type: Boolean,
      default: false,
    },

    isCorrect: {
      type: Boolean,
      default: null,
    },

    marksAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },

    negativeMarksDeducted: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxMarks: {
      type: Number,
      required: true,
      min: 0,
    },

    evaluationType: {
      type: String,
      enum: ["automatic", "manual"],
      default: "automatic",
    },

    evaluatedAt: {
      type: Date,
      default: null,
    },

    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    evaluatorComment: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

quizAnswerSchema.index(
  {
    attempt: 1,
    question: 1,
  },
  {
    unique: true,
  },
);

quizAnswerSchema.index({
  quiz: 1,
  student: 1,
  createdAt: -1,
});

const QuizAnswer = mongoose.model(
  "QuizAnswer",
  quizAnswerSchema,
);

export default QuizAnswer;