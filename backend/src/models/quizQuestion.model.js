import mongoose from "mongoose";

const quizOptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    isCorrect: {
      type: Boolean,
      default: false,
    },

    explanation: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  {
    _id: true,
    versionKey: false,
  },
);

const quizQuestionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    questionText: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 2000,
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
      index: true,
    },

    options: {
      type: [quizOptionSchema],
      default: [],
    },

    correctAnswerText: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
      select: false,
    },

    acceptedAnswers: {
      type: [String],
      default: [],
      select: false,
    },

    marks: {
      type: Number,
      required: true,
      min: 0.5,
      default: 1,
    },

    negativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    explanation: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },

    order: {
      type: Number,
      required: true,
      min: 1,
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      index: true,
    },

    isRequired: {
      type: Boolean,
      default: true,
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

quizQuestionSchema.index(
  {
    quiz: 1,
    order: 1,
  },
  {
    unique: true,
  },
);

quizQuestionSchema.index({
  quiz: 1,
  isActive: 1,
  order: 1,
});

quizQuestionSchema.pre("validate", function (next) {
  const activeOptions = this.options ?? [];

  if (this.questionType === "single_choice") {
    if (activeOptions.length < 2) {
      return next(
        new Error(
          "Single choice question requires at least two options",
        ),
      );
    }

    const correctOptionsCount = activeOptions.filter(
      (option) => option.isCorrect,
    ).length;

    if (correctOptionsCount !== 1) {
      return next(
        new Error(
          "Single choice question must have exactly one correct option",
        ),
      );
    }

    this.correctAnswerText = "";
    this.acceptedAnswers = [];
  }

  if (this.questionType === "multiple_choice") {
    if (activeOptions.length < 2) {
      return next(
        new Error(
          "Multiple choice question requires at least two options",
        ),
      );
    }

    const correctOptionsCount = activeOptions.filter(
      (option) => option.isCorrect,
    ).length;

    if (correctOptionsCount < 1) {
      return next(
        new Error(
          "Multiple choice question requires at least one correct option",
        ),
      );
    }

    this.correctAnswerText = "";
    this.acceptedAnswers = [];
  }

  if (this.questionType === "true_false") {
    if (activeOptions.length !== 2) {
      return next(
        new Error(
          "True/false question must have exactly two options",
        ),
      );
    }

    const normalizedOptions = activeOptions.map(
      (option) => option.text.trim().toLowerCase(),
    );

    const hasTrue = normalizedOptions.includes("true");
    const hasFalse = normalizedOptions.includes("false");

    if (!hasTrue || !hasFalse) {
      return next(
        new Error(
          'True/false question options must be "True" and "False"',
        ),
      );
    }

    const correctOptionsCount = activeOptions.filter(
      (option) => option.isCorrect,
    ).length;

    if (correctOptionsCount !== 1) {
      return next(
        new Error(
          "True/false question must have exactly one correct option",
        ),
      );
    }

    this.correctAnswerText = "";
    this.acceptedAnswers = [];
  }

  if (this.questionType === "short_answer") {
    if (
      !Array.isArray(this.acceptedAnswers) ||
      this.acceptedAnswers.length === 0
    ) {
      return next(
        new Error(
          "Short answer question requires at least one accepted answer",
        ),
      );
    }

    this.options = [];

    this.acceptedAnswers = [
      ...new Set(
        this.acceptedAnswers
          .map((answer) =>
            String(answer || "")
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean),
      ),
    ];

    if (this.acceptedAnswers.length === 0) {
      return next(
        new Error(
          "Short answer question requires a valid accepted answer",
        ),
      );
    }

    this.correctAnswerText =
      this.acceptedAnswers[0];
  }

  if (
    this.negativeMarks >
    this.marks
  ) {
    return next(
      new Error(
        "Negative marks cannot be greater than question marks",
      ),
    );
  }

  
});

const QuizQuestion = mongoose.model(
  "QuizQuestion",
  quizQuestionSchema,
);

export default QuizQuestion;