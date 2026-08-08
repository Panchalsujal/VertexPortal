import mongoose from "mongoose";

import Quiz from "../models/quiz.model.js";
import Course from "../models/course.model.js";
import CourseModule from "../models/courseModule.model.js";
import Lecture from "../models/lecture.model.js";
import Enrollment from "../models/enrollment.model.js";
import QuizAttempt from "../models/quizAttempt.model.js";
import QuizQuestion from "../models/quizQuestion.model.js";
import QuizAnswer from "../models/quizAnswer.model.js";
import User from "../models/user.model.js";

import {
  parseBooleanQuery,
  parseNumberQuery,
  parseEnumQuery,
  parseSortQuery,
  parseDateRange,
} from "../utils/queryParser.js";

import { escapeRegex } from "../utils/search.js";
import { validateObjectId } from "../utils/validator.js";
import { ApiError } from "../utils/ApiError.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";
import { buildSearchFilter } from "../utils/search.js";
import { randomBytes } from "node:crypto";
import { shuffleWithSeed } from "../utils/shuffle.js";

export async function createQuiz({ instructorId, payload }) {
  validateObjectId(instructorId, "instructor ID");

  const {
    courseId,
    moduleId = null,
    lectureId = null,
    title,
    description = "",
    instructions = "",
    durationInMinutes = null,
    passingPercentage = 40,
    maxAttempts = 1,
    availableFrom = null,
    availableUntil = null,
    shuffleQuestions = false,
    shuffleOptions = false,
    showResultImmediately = true,
    showCorrectAnswers = false,
  } = payload || {};

  if (!courseId) {
    throw new ApiError(400, "Course ID is required");
  }

  validateObjectId(courseId, "course ID");

  if (moduleId) {
    validateObjectId(moduleId, "module ID");
  }

  if (lectureId) {
    validateObjectId(lectureId, "lecture ID");
  }

  const normalizedTitle = String(title || "").trim();

  if (normalizedTitle.length < 3) {
    throw new ApiError(400, "Quiz title must be at least 3 characters");
  }

  if (normalizedTitle.length > 150) {
    throw new ApiError(400, "Quiz title cannot exceed 150 characters");
  }

  const parsedDuration =
    durationInMinutes === null ||
    durationInMinutes === undefined ||
    durationInMinutes === ""
      ? null
      : parseNumberQuery(durationInMinutes, {
          fieldName: "Duration in minutes",
          min: 1,
          max: 600,
          integer: true,
        });

  const parsedPassingPercentage =
    parseNumberQuery(passingPercentage, {
      fieldName: "Passing percentage",
      min: 0,
      max: 100,
    }) ?? 40;

  const parsedMaxAttempts =
    parseNumberQuery(maxAttempts, {
      fieldName: "Maximum attempts",
      min: 1,
      max: 100,
      integer: true,
    }) ?? 1;

  const parsedShuffleQuestions =
    typeof shuffleQuestions === "boolean"
      ? shuffleQuestions
      : parseBooleanQuery(shuffleQuestions, "shuffleQuestions");

  const parsedShuffleOptions =
    typeof shuffleOptions === "boolean"
      ? shuffleOptions
      : parseBooleanQuery(shuffleOptions, "shuffleOptions");

  const parsedShowResultImmediately =
    typeof showResultImmediately === "boolean"
      ? showResultImmediately
      : parseBooleanQuery(showResultImmediately, "showResultImmediately");

  const parsedShowCorrectAnswers =
    typeof showCorrectAnswers === "boolean"
      ? showCorrectAnswers
      : parseBooleanQuery(showCorrectAnswers, "showCorrectAnswers");

  let parsedAvailableFrom = null;
  let parsedAvailableUntil = null;

  if (availableFrom) {
    parsedAvailableFrom = new Date(availableFrom);

    if (Number.isNaN(parsedAvailableFrom.getTime())) {
      throw new ApiError(400, "Invalid available from date");
    }
  }

  if (availableUntil) {
    parsedAvailableUntil = new Date(availableUntil);

    if (Number.isNaN(parsedAvailableUntil.getTime())) {
      throw new ApiError(400, "Invalid available until date");
    }
  }

  if (
    parsedAvailableFrom &&
    parsedAvailableUntil &&
    parsedAvailableUntil <= parsedAvailableFrom
  ) {
    throw new ApiError(
      400,
      "Available until date must be after available from date",
    );
  }

  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  const instructorObjectId = new mongoose.Types.ObjectId(instructorId);

  const course = await Course.findOne({
    _id: courseObjectId,
    instructor: instructorObjectId,
    isActive: true,
  })
    .select("title status isPublished isActive instructor")
    .lean();

  if (!course) {
    throw new ApiError(
      404,
      "Course not found or you are not the course instructor",
    );
  }

  let module = null;

  if (moduleId) {
    module = await CourseModule.findOne({
      _id: moduleId,
      course: courseObjectId,
      isActive: true,
    })
      .select("title course isPublished isActive")
      .lean();

    if (!module) {
      throw new ApiError(404, "Module not found in this course");
    }
  }

  let lecture = null;

  if (lectureId) {
    lecture = await Lecture.findOne({
      _id: lectureId,
      course: courseObjectId,
      isActive: true,
    })
      .select("title course module isPublished isActive")
      .lean();

    if (!lecture) {
      throw new ApiError(404, "Lecture not found in this course");
    }

    if (moduleId && lecture.module?.toString() !== moduleId.toString()) {
      throw new ApiError(400, "Lecture does not belong to the selected module");
    }
  }

  const quiz = await Quiz.create({
    course: courseObjectId,

    module: module ? module._id : null,

    lecture: lecture ? lecture._id : null,

    instructor: instructorObjectId,

    title: normalizedTitle,

    description: String(description || "").trim(),

    instructions: String(instructions || "").trim(),

    durationInMinutes: parsedDuration,

    passingPercentage: parsedPassingPercentage,

    maxAttempts: parsedMaxAttempts,

    availableFrom: parsedAvailableFrom,

    availableUntil: parsedAvailableUntil,

    shuffleQuestions: parsedShuffleQuestions ?? false,

    shuffleOptions: parsedShuffleOptions ?? false,

    showResultImmediately: parsedShowResultImmediately ?? true,

    showCorrectAnswers: parsedShowCorrectAnswers ?? false,

    status: "draft",

    isPublished: false,

    publishedAt: null,

    isActive: true,
  });

  return quiz;
}

export async function addQuizQuestion({ instructorId, quizId, payload }) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(quizId, "quiz ID");

  const {
    questionText,
    questionType,
    options = [],
    acceptedAnswers = [],
    marks = 1,
    negativeMarks = 0,
    explanation = "",
    difficulty = "medium",
    isRequired = true,
    order = null,
  } = payload || {};

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
    isActive: true,
  });

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  if (quiz.status === "archived") {
    throw new ApiError(400, "Archived quiz cannot be modified");
  }

  const normalizedQuestionText = String(questionText || "").trim();

  if (normalizedQuestionText.length < 3) {
    throw new ApiError(400, "Question text must be at least 3 characters");
  }

  const parsedQuestionType = parseEnumQuery(
    questionType,
    ["single_choice", "multiple_choice", "true_false", "short_answer"],
    "Question type",
  );

  const parsedMarks =
    parseNumberQuery(marks, {
      fieldName: "Marks",
      min: 0.5,
      max: 100,
    }) ?? 1;

  const parsedNegativeMarks =
    parseNumberQuery(negativeMarks, {
      fieldName: "Negative marks",
      min: 0,
      max: parsedMarks,
    }) ?? 0;

  const parsedDifficulty =
    parseEnumQuery(difficulty, ["easy", "medium", "hard"], "Difficulty") ??
    "medium";

  const parsedIsRequired =
    typeof isRequired === "boolean"
      ? isRequired
      : parseBooleanQuery(isRequired, "isRequired");

  let selectedOrder;

  if (order !== null && order !== undefined && order !== "") {
    selectedOrder = parseNumberQuery(order, {
      fieldName: "Question order",
      min: 1,
      max: 10000,
      integer: true,
    });
  } else {
    const lastQuestion = await QuizQuestion.findOne({
      quiz: quiz._id,
    })
      .sort({
        order: -1,
      })
      .select("order")
      .lean();

    selectedOrder = (lastQuestion?.order ?? 0) + 1;
  }

  const duplicateOrder = await QuizQuestion.exists({
    quiz: quiz._id,
    order: selectedOrder,
  });

  if (duplicateOrder) {
    throw new ApiError(
      409,
      `Question order ${selectedOrder} already exists in this quiz`,
    );
  }

  const normalizedOptions = Array.isArray(options)
    ? options.map((option) => ({
        text: String(option?.text || "").trim(),

        isCorrect: option?.isCorrect === true,

        explanation: String(option?.explanation || "").trim(),
      }))
    : [];

  const normalizedAcceptedAnswers = Array.isArray(acceptedAnswers)
    ? acceptedAnswers
        .map((answer) =>
          String(answer || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean)
    : [];

  const question = await QuizQuestion.create({
    quiz: quiz._id,
    course: quiz.course,
    instructor: instructorId,

    questionText: normalizedQuestionText,

    questionType: parsedQuestionType,

    options: normalizedOptions,

    acceptedAnswers: normalizedAcceptedAnswers,

    marks: parsedMarks,

    negativeMarks: parsedNegativeMarks,

    explanation: String(explanation || "").trim(),

    order: selectedOrder,

    difficulty: parsedDifficulty,

    isRequired: parsedIsRequired ?? true,

    isActive: true,
  });

  const totalsResult = await QuizQuestion.aggregate([
    {
      $match: {
        quiz: quiz._id,
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,

        totalQuestions: {
          $sum: 1,
        },

        totalMarks: {
          $sum: "$marks",
        },
      },
    },
  ]);

  quiz.totalQuestions = totalsResult[0]?.totalQuestions ?? 0;

  quiz.totalMarks = totalsResult[0]?.totalMarks ?? 0;

  await quiz.save();

  return {
    question,
    quiz: {
      id: quiz._id,
      totalQuestions: quiz.totalQuestions,
      totalMarks: quiz.totalMarks,
    },
  };
}

export async function getInstructorQuizById({ instructorId, quizId }) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(quizId, "quiz ID");

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  })
    .populate({
      path: "course",
      select: `
        title
        slug
        thumbnailUrl
        status
        isPublished
        isActive
      `,
    })
    .populate({
      path: "module",
      select: `
        title
        description
        order
        isPublished
        isActive
      `,
    })
    .populate({
      path: "lecture",
      select: `
        title
        type
        order
        durationInSeconds
        isPublished
        isActive
      `,
    })
    .lean();

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  const [questions, attemptStatsResult, recentAttempts] = await Promise.all([
    QuizQuestion.find({
      quiz: quizId,
    })
      /*
       * Instructor ko hidden fields bhi chahiye.
       */
      .select(
        `
        +correctAnswerText
        +acceptedAnswers
        quiz
        course
        instructor
        questionText
        questionType
        options
        marks
        negativeMarks
        explanation
        order
        difficulty
        isRequired
        isActive
        createdAt
        updatedAt
      `,
      )
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean(),

    QuizAttempt.aggregate([
      {
        $match: {
          quiz: new mongoose.Types.ObjectId(quizId),
        },
      },
      {
        $group: {
          _id: null,

          totalAttempts: {
            $sum: 1,
          },

          inProgressAttempts: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "in_progress"],
                },
                1,
                0,
              ],
            },
          },

          submittedAttempts: {
            $sum: {
              $cond: [
                {
                  $in: ["$status", ["submitted", "evaluated"]],
                },
                1,
                0,
              ],
            },
          },

          evaluatedAttempts: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "evaluated"],
                },
                1,
                0,
              ],
            },
          },

          passedAttempts: {
            $sum: {
              $cond: [
                {
                  $eq: ["$isPassed", true],
                },
                1,
                0,
              ],
            },
          },

          failedAttempts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$status", "evaluated"],
                    },
                    {
                      $eq: ["$isPassed", false],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          averagePercentage: {
            $avg: "$percentage",
          },

          averageMarks: {
            $avg: "$obtainedMarks",
          },

          highestPercentage: {
            $max: "$percentage",
          },

          lowestPercentage: {
            $min: "$percentage",
          },

          uniqueStudents: {
            $addToSet: "$student",
          },
        },
      },
      {
        $addFields: {
          uniqueStudentCount: {
            $size: "$uniqueStudents",
          },
        },
      },
    ]),

    QuizAttempt.find({
      quiz: quizId,
    })
      .select(
        `
        student
        attemptNumber
        status
        startedAt
        submittedAt
        evaluatedAt
        totalQuestions
        attemptedQuestions
        correctAnswers
        incorrectAnswers
        skippedQuestions
        totalMarks
        obtainedMarks
        percentage
        isPassed
        timeSpentInSeconds
        autoSubmitted
        submissionReason
        createdAt
      `,
      )
      .populate({
        path: "student",
        select: "fullName email avatarUrl status isActive",
      })
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .lean(),
  ]);

  const attemptStats = attemptStatsResult[0] ?? {
    totalAttempts: 0,
    inProgressAttempts: 0,
    submittedAttempts: 0,
    evaluatedAttempts: 0,
    passedAttempts: 0,
    failedAttempts: 0,
    averagePercentage: 0,
    averageMarks: 0,
    highestPercentage: 0,
    lowestPercentage: 0,
    uniqueStudentCount: 0,
  };

  const passRate =
    attemptStats.evaluatedAttempts > 0
      ? Number(
          (
            (attemptStats.passedAttempts / attemptStats.evaluatedAttempts) *
            100
          ).toFixed(2),
        )
      : 0;

  return {
    quiz,

    questions,

    summary: {
      totalQuestions: quiz.totalQuestions ?? questions.length,

      totalMarks: quiz.totalMarks ?? 0,

      totalAttempts: attemptStats.totalAttempts ?? 0,

      uniqueStudents: attemptStats.uniqueStudentCount ?? 0,

      inProgressAttempts: attemptStats.inProgressAttempts ?? 0,

      submittedAttempts: attemptStats.submittedAttempts ?? 0,

      evaluatedAttempts: attemptStats.evaluatedAttempts ?? 0,

      passedAttempts: attemptStats.passedAttempts ?? 0,

      failedAttempts: attemptStats.failedAttempts ?? 0,

      passRate,

      averagePercentage: Number(
        (attemptStats.averagePercentage ?? 0).toFixed(2),
      ),

      averageMarks: Number((attemptStats.averageMarks ?? 0).toFixed(2)),

      highestPercentage: Number(
        (attemptStats.highestPercentage ?? 0).toFixed(2),
      ),

      lowestPercentage: Number((attemptStats.lowestPercentage ?? 0).toFixed(2)),
    },

    recentAttempts,
  };
}

export async function getInstructorQuizzes({ instructorId, query = {} }) {
  validateObjectId(instructorId, "instructor ID");

  const {
    search,
    course,
    module,
    lecture,
    status,
    isPublished,
    isActive,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const filter = {
    instructor: instructorId,
  };

  const searchFilter = buildSearchFilter(search, [
    "title",
    "description",
    "instructions",
  ]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  if (course) {
    validateObjectId(course, "course ID");
    filter.course = course;
  }

  if (module) {
    validateObjectId(module, "module ID");
    filter.module = module;
  }

  if (lecture) {
    validateObjectId(lecture, "lecture ID");
    filter.lecture = lecture;
  }

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "published", "archived"],
    "Quiz status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedIsPublished = parseBooleanQuery(isPublished, "isPublished");

  if (parsedIsPublished !== undefined) {
    filter.isPublished = parsedIsPublished;
  }

  const parsedIsActive = parseBooleanQuery(isActive, "isActive");

  if (parsedIsActive !== undefined) {
    filter.isActive = parsedIsActive;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "createdAt",
      "updatedAt",
      "title",
      "publishedAt",
      "availableFrom",
      "availableUntil",
      "totalQuestions",
      "totalMarks",
      "passingPercentage",
    ],
    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  const [quizzes, totalRecords] = await Promise.all([
    Quiz.find(filter)
      .select(
        `
          course
          module
          lecture
          instructor
          title
          description
          instructions
          durationInMinutes
          passingPercentage
          totalQuestions
          totalMarks
          maxAttempts
          availableFrom
          availableUntil
          shuffleQuestions
          shuffleOptions
          showResultImmediately
          showCorrectAnswers
          status
          isPublished
          publishedAt
          isActive
          createdAt
          updatedAt
        `,
      )
      .populate({
        path: "course",
        select: `
            title
            slug
            thumbnailUrl
            status
            isPublished
            isActive
          `,
      })
      .populate({
        path: "module",
        select: `
            title
            order
            isPublished
            isActive
          `,
      })
      .populate({
        path: "lecture",
        select: `
            title
            type
            order
            isPublished
            isActive
          `,
      })
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Quiz.countDocuments(filter),
  ]);

  return {
    quizzes,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
      skip,
    }),

    filters: {
      search: search?.trim() || null,
      course: course || null,
      module: module || null,
      lecture: lecture || null,
      status: parsedStatus ?? null,
      isPublished: parsedIsPublished ?? null,
      isActive: parsedIsActive ?? null,
      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}
export async function updateQuiz({ instructorId, quizId, payload }) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(quizId, "quiz ID");

  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "At least one field is required for update");
  }

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  });

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  if (quiz.status === "archived") {
    throw new ApiError(400, "Archived quiz cannot be updated");
  }

  /*
   * Course ownership quiz create hote waqt fix ho chuki hai.
   * Update ke through course change allow nahi karenge.
   */
  if (payload.courseId !== undefined || payload.course !== undefined) {
    throw new ApiError(400, "Quiz course cannot be changed");
  }

  const before = {
    module: quiz.module,
    lecture: quiz.lecture,
    title: quiz.title,
    description: quiz.description,
    instructions: quiz.instructions,
    durationInMinutes: quiz.durationInMinutes,
    passingPercentage: quiz.passingPercentage,
    maxAttempts: quiz.maxAttempts,
    availableFrom: quiz.availableFrom,
    availableUntil: quiz.availableUntil,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
    showResultImmediately: quiz.showResultImmediately,
    showCorrectAnswers: quiz.showCorrectAnswers,
  };

  /*
   * Module and lecture resolution.
   *
   * Undefined means existing value preserve.
   * Null/empty string means relation remove.
   */
  let selectedModuleId = quiz.module?.toString() ?? null;

  let selectedLectureId = quiz.lecture?.toString() ?? null;

  if (payload.moduleId !== undefined) {
    if (payload.moduleId === null || payload.moduleId === "") {
      selectedModuleId = null;
    } else {
      validateObjectId(payload.moduleId, "module ID");

      selectedModuleId = String(payload.moduleId);
    }
  }

  if (payload.lectureId !== undefined) {
    if (payload.lectureId === null || payload.lectureId === "") {
      selectedLectureId = null;
    } else {
      validateObjectId(payload.lectureId, "lecture ID");

      selectedLectureId = String(payload.lectureId);
    }
  }

  let selectedModule = null;

  if (selectedModuleId) {
    selectedModule = await CourseModule.findOne({
      _id: selectedModuleId,
      course: quiz.course,
      isActive: true,
    })
      .select("title course isPublished isActive")
      .lean();

    if (!selectedModule) {
      throw new ApiError(404, "Module not found in this quiz course");
    }
  }

  let selectedLecture = null;

  if (selectedLectureId) {
    selectedLecture = await Lecture.findOne({
      _id: selectedLectureId,
      course: quiz.course,
      isActive: true,
    })
      .select("title course module isPublished isActive")
      .lean();

    if (!selectedLecture) {
      throw new ApiError(404, "Lecture not found in this quiz course");
    }

    /*
     * Lecture select hai aur module explicitly nahi diya,
     * to lecture ka module automatically set karenge.
     */
    if (!selectedModuleId) {
      selectedModuleId = selectedLecture.module?.toString() ?? null;
    }

    if (
      selectedModuleId &&
      selectedLecture.module?.toString() !== selectedModuleId
    ) {
      throw new ApiError(400, "Lecture does not belong to the selected module");
    }
  }

  if (payload.title !== undefined) {
    const normalizedTitle = String(payload.title || "").trim();

    if (normalizedTitle.length < 3) {
      throw new ApiError(400, "Quiz title must be at least 3 characters");
    }

    if (normalizedTitle.length > 150) {
      throw new ApiError(400, "Quiz title cannot exceed 150 characters");
    }

    quiz.title = normalizedTitle;
  }

  if (payload.description !== undefined) {
    const description = String(payload.description || "").trim();

    if (description.length > 1000) {
      throw new ApiError(400, "Quiz description cannot exceed 1000 characters");
    }

    quiz.description = description;
  }

  if (payload.instructions !== undefined) {
    const instructions = String(payload.instructions || "").trim();

    if (instructions.length > 2000) {
      throw new ApiError(
        400,
        "Quiz instructions cannot exceed 2000 characters",
      );
    }

    quiz.instructions = instructions;
  }

  if (payload.durationInMinutes !== undefined) {
    if (
      payload.durationInMinutes === null ||
      payload.durationInMinutes === ""
    ) {
      quiz.durationInMinutes = null;
    } else {
      quiz.durationInMinutes = parseNumberQuery(payload.durationInMinutes, {
        fieldName: "Duration in minutes",
        min: 1,
        max: 600,
        integer: true,
      });
    }
  }

  if (payload.passingPercentage !== undefined) {
    quiz.passingPercentage = parseNumberQuery(payload.passingPercentage, {
      fieldName: "Passing percentage",
      min: 0,
      max: 100,
    });
  }

  if (payload.maxAttempts !== undefined) {
    quiz.maxAttempts = parseNumberQuery(payload.maxAttempts, {
      fieldName: "Maximum attempts",
      min: 1,
      max: 100,
      integer: true,
    });
  }

  let nextAvailableFrom = quiz.availableFrom;

  let nextAvailableUntil = quiz.availableUntil;

  if (payload.availableFrom !== undefined) {
    if (payload.availableFrom === null || payload.availableFrom === "") {
      nextAvailableFrom = null;
    } else {
      nextAvailableFrom = new Date(payload.availableFrom);

      if (Number.isNaN(nextAvailableFrom.getTime())) {
        throw new ApiError(400, "Invalid available from date");
      }
    }
  }

  if (payload.availableUntil !== undefined) {
    if (payload.availableUntil === null || payload.availableUntil === "") {
      nextAvailableUntil = null;
    } else {
      nextAvailableUntil = new Date(payload.availableUntil);

      if (Number.isNaN(nextAvailableUntil.getTime())) {
        throw new ApiError(400, "Invalid available until date");
      }
    }
  }

  if (
    nextAvailableFrom &&
    nextAvailableUntil &&
    nextAvailableUntil <= nextAvailableFrom
  ) {
    throw new ApiError(
      400,
      "Available until date must be after available from date",
    );
  }

  quiz.availableFrom = nextAvailableFrom;

  quiz.availableUntil = nextAvailableUntil;

  const booleanFields = [
    "shuffleQuestions",
    "shuffleOptions",
    "showResultImmediately",
    "showCorrectAnswers",
  ];

  for (const field of booleanFields) {
    if (payload[field] !== undefined) {
      quiz[field] =
        typeof payload[field] === "boolean"
          ? payload[field]
          : parseBooleanQuery(payload[field], field);
    }
  }

  quiz.module = selectedModuleId;
  quiz.lecture = selectedLectureId;

  await quiz.save();

  const after = {
    module: quiz.module,
    lecture: quiz.lecture,
    title: quiz.title,
    description: quiz.description,
    instructions: quiz.instructions,
    durationInMinutes: quiz.durationInMinutes,
    passingPercentage: quiz.passingPercentage,
    maxAttempts: quiz.maxAttempts,
    availableFrom: quiz.availableFrom,
    availableUntil: quiz.availableUntil,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
    showResultImmediately: quiz.showResultImmediately,
    showCorrectAnswers: quiz.showCorrectAnswers,
  };

  const changed = JSON.stringify(before) !== JSON.stringify(after);

  return {
    quiz,
    before,
    after,
    changed,
    message: changed
      ? "Quiz updated successfully"
      : "No quiz changes were detected",
  };
}

export async function updateQuizStatus({ instructorId, quizId, status }) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(quizId, "quiz ID");

  const parsedStatus = parseEnumQuery(
    status,
    ["draft", "published", "archived"],
    "Quiz status",
  );

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  });

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  const before = {
    status: quiz.status,
    isPublished: quiz.isPublished,
    publishedAt: quiz.publishedAt,
    isActive: quiz.isActive,
  };

  if (quiz.status === parsedStatus) {
    return {
      quiz,
      before,
      after: before,
      changed: false,
      message: `Quiz is already ${parsedStatus}`,
    };
  }

  const allowedTransitions = {
    draft: ["published", "archived"],
    published: ["draft", "archived"],
    archived: ["draft"],
  };

  const allowedNextStatuses = allowedTransitions[quiz.status] ?? [];

  if (!allowedNextStatuses.includes(parsedStatus)) {
    throw new ApiError(
      400,
      `Quiz status cannot change from ${quiz.status} to ${parsedStatus}`,
    );
  }

  if (parsedStatus === "published") {
    const course = await Course.findOne({
      _id: quiz.course,
      instructor: instructorId,
      status: "published",
      isPublished: true,
      isActive: true,
    })
      .select("_id title")
      .lean();

    if (!course) {
      throw new ApiError(
        400,
        "Course must be published and active before publishing the quiz",
      );
    }

    if (quiz.module) {
      const moduleExists = await CourseModule.exists({
        _id: quiz.module,
        course: quiz.course,
        isActive: true,
        isPublished: true,
      });

      if (!moduleExists) {
        throw new ApiError(
          400,
          "Selected module must be published and active before publishing the quiz",
        );
      }
    }

    if (quiz.lecture) {
      const lectureExists = await Lecture.exists({
        _id: quiz.lecture,
        course: quiz.course,
        isActive: true,
        isPublished: true,
      });

      if (!lectureExists) {
        throw new ApiError(
          400,
          "Selected lecture must be published and active before publishing the quiz",
        );
      }
    }

    const questionStats = await QuizQuestion.aggregate([
      {
        $match: {
          quiz: quiz._id,
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,

          totalQuestions: {
            $sum: 1,
          },

          totalMarks: {
            $sum: "$marks",
          },
        },
      },
    ]);

    const totalQuestions = questionStats[0]?.totalQuestions ?? 0;

    const totalMarks = questionStats[0]?.totalMarks ?? 0;

    if (totalQuestions < 1) {
      throw new ApiError(
        400,
        "At least one active question is required before publishing the quiz",
      );
    }

    if (totalMarks <= 0) {
      throw new ApiError(
        400,
        "Quiz total marks must be greater than zero before publishing",
      );
    }

    quiz.totalQuestions = totalQuestions;

    quiz.totalMarks = totalMarks;

    quiz.status = "published";
    quiz.isPublished = true;
    quiz.isActive = true;

    quiz.publishedAt = quiz.publishedAt ?? new Date();
  }

  if (parsedStatus === "draft") {
    quiz.status = "draft";
    quiz.isPublished = false;
    quiz.isActive = true;
    quiz.publishedAt = null;
  }

  if (parsedStatus === "archived") {
    quiz.status = "archived";
    quiz.isPublished = false;
    quiz.isActive = false;
    quiz.publishedAt = null;
  }

  await quiz.save();

  const after = {
    status: quiz.status,
    isPublished: quiz.isPublished,
    publishedAt: quiz.publishedAt,
    isActive: quiz.isActive,
  };

  return {
    quiz,
    before,
    after,
    changed: true,
    message: `Quiz status updated to ${parsedStatus}`,
  };
}

async function recalculateQuizTotals({ quizId, session = null }) {
  const aggregate = QuizQuestion.aggregate([
    {
      $match: {
        quiz: new mongoose.Types.ObjectId(quizId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: null,

        totalQuestions: {
          $sum: 1,
        },

        totalMarks: {
          $sum: "$marks",
        },
      },
    },
  ]);

  if (session) {
    aggregate.session(session);
  }

  const result = await aggregate;

  const totalQuestions = result[0]?.totalQuestions ?? 0;

  const totalMarks = result[0]?.totalMarks ?? 0;

  const updateOptions = {
    new: true,
  };

  if (session) {
    updateOptions.session = session;
  }

  const quiz = await Quiz.findByIdAndUpdate(
    quizId,
    {
      $set: {
        totalQuestions,
        totalMarks,
      },
    },
    updateOptions,
  );

  return {
    quiz,
    totalQuestions,
    totalMarks,
  };
}

export async function updateQuizQuestion({
  instructorId,
  quizId,
  questionId,
  payload,
}) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(quizId, "quiz ID");

  validateObjectId(questionId, "question ID");

  if (!payload || Object.keys(payload).length === 0) {
    throw new ApiError(400, "At least one field is required for update");
  }

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  });

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  if (quiz.status === "archived") {
    throw new ApiError(400, "Archived quiz questions cannot be updated");
  }

  const question = await QuizQuestion.findOne({
    _id: questionId,
    quiz: quizId,
    instructor: instructorId,
  }).select(
    `
      +correctAnswerText
      +acceptedAnswers
      `,
  );

  if (!question) {
    throw new ApiError(404, "Quiz question not found");
  }

  /*
   * Published quiz me attempts start ho chuke hon to
   * scoring-related question changes block karenge.
   */
  if (quiz.status === "published") {
    const attemptExists = await QuizAttempt.exists({
      quiz: quiz._id,
    });

    if (attemptExists) {
      const protectedFields = [
        "questionType",
        "options",
        "acceptedAnswers",
        "marks",
        "negativeMarks",
        "order",
      ];

      const attemptedProtectedFields = protectedFields.filter(
        (field) => payload[field] !== undefined,
      );

      if (attemptedProtectedFields.length > 0) {
        throw new ApiError(
          409,
          `Quiz attempts already exist. These fields cannot be updated: ${attemptedProtectedFields.join(
            ", ",
          )}`,
        );
      }
    }
  }

  const before = {
    questionText: question.questionText,

    questionType: question.questionType,

    options: question.options.map((option) => ({
      _id: option._id,
      text: option.text,
      isCorrect: option.isCorrect,
      explanation: option.explanation,
    })),

    correctAnswerText: question.correctAnswerText,

    acceptedAnswers: question.acceptedAnswers,

    marks: question.marks,

    negativeMarks: question.negativeMarks,

    explanation: question.explanation,

    order: question.order,

    difficulty: question.difficulty,

    isRequired: question.isRequired,

    isActive: question.isActive,
  };

  if (payload.questionText !== undefined) {
    const normalizedQuestionText = String(payload.questionText || "").trim();

    if (normalizedQuestionText.length < 3) {
      throw new ApiError(400, "Question text must be at least 3 characters");
    }

    if (normalizedQuestionText.length > 2000) {
      throw new ApiError(400, "Question text cannot exceed 2000 characters");
    }

    question.questionText = normalizedQuestionText;
  }

  if (payload.questionType !== undefined) {
    question.questionType = parseEnumQuery(
      payload.questionType,
      ["single_choice", "multiple_choice", "true_false", "short_answer"],
      "Question type",
    );
  }

  if (payload.options !== undefined) {
    if (!Array.isArray(payload.options)) {
      throw new ApiError(400, "Options must be an array");
    }

    question.options = payload.options.map((option) => ({
      text: String(option?.text || "").trim(),

      isCorrect: option?.isCorrect === true,

      explanation: String(option?.explanation || "").trim(),
    }));
  }

  if (payload.acceptedAnswers !== undefined) {
    if (!Array.isArray(payload.acceptedAnswers)) {
      throw new ApiError(400, "Accepted answers must be an array");
    }

    question.acceptedAnswers = [
      ...new Set(
        payload.acceptedAnswers
          .map((answer) =>
            String(answer || "")
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean),
      ),
    ];
  }

  if (payload.marks !== undefined) {
    question.marks = parseNumberQuery(payload.marks, {
      fieldName: "Marks",
      min: 0.5,
      max: 100,
    });
  }

  if (payload.negativeMarks !== undefined) {
    question.negativeMarks = parseNumberQuery(payload.negativeMarks, {
      fieldName: "Negative marks",

      min: 0,

      max: payload.marks !== undefined ? question.marks : question.marks,
    });
  }

  if (question.negativeMarks > question.marks) {
    throw new ApiError(
      400,
      "Negative marks cannot be greater than question marks",
    );
  }

  if (payload.explanation !== undefined) {
    const normalizedExplanation = String(payload.explanation || "").trim();

    if (normalizedExplanation.length > 2000) {
      throw new ApiError(
        400,
        "Question explanation cannot exceed 2000 characters",
      );
    }

    question.explanation = normalizedExplanation;
  }

  if (payload.order !== undefined) {
    const selectedOrder = parseNumberQuery(payload.order, {
      fieldName: "Question order",
      min: 1,
      max: 10000,
      integer: true,
    });

    if (selectedOrder !== question.order) {
      const duplicateOrder = await QuizQuestion.exists({
        quiz: quiz._id,
        order: selectedOrder,

        _id: {
          $ne: question._id,
        },
      });

      if (duplicateOrder) {
        throw new ApiError(
          409,
          `Question order ${selectedOrder} already exists in this quiz`,
        );
      }

      question.order = selectedOrder;
    }
  }

  if (payload.difficulty !== undefined) {
    question.difficulty = parseEnumQuery(
      payload.difficulty,
      ["easy", "medium", "hard"],
      "Difficulty",
    );
  }

  if (payload.isRequired !== undefined) {
    question.isRequired =
      typeof payload.isRequired === "boolean"
        ? payload.isRequired
        : parseBooleanQuery(payload.isRequired, "isRequired");
  }

  if (payload.isActive !== undefined) {
    question.isActive =
      typeof payload.isActive === "boolean"
        ? payload.isActive
        : parseBooleanQuery(payload.isActive, "isActive");
  }

  /*
   * Model pre-validation hook type-specific rules
   * validate karega:
   *
   * single choice → exactly one correct
   * multiple choice → at least one correct
   * true/false → true and false options
   * short answer → accepted answers
   */
  await question.save();

  const totals = await recalculateQuizTotals({
    quizId: quiz._id,
  });

  const after = {
    questionText: question.questionText,

    questionType: question.questionType,

    options: question.options.map((option) => ({
      _id: option._id,
      text: option.text,
      isCorrect: option.isCorrect,
      explanation: option.explanation,
    })),

    correctAnswerText: question.correctAnswerText,

    acceptedAnswers: question.acceptedAnswers,

    marks: question.marks,

    negativeMarks: question.negativeMarks,

    explanation: question.explanation,

    order: question.order,

    difficulty: question.difficulty,

    isRequired: question.isRequired,

    isActive: question.isActive,
  };

  const changed = JSON.stringify(before) !== JSON.stringify(after);

  return {
    question,

    quiz: {
      id: totals.quiz._id,

      totalQuestions: totals.totalQuestions,

      totalMarks: totals.totalMarks,
    },

    before,
    after,
    changed,

    message: changed
      ? "Quiz question updated successfully"
      : "No question changes were detected",
  };
}

export async function deleteQuizQuestion({ instructorId, quizId, questionId }) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(quizId, "quiz ID");

  validateObjectId(questionId, "question ID");

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  });

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  if (quiz.status === "archived") {
    throw new ApiError(400, "Archived quiz questions cannot be deleted");
  }

  const question = await QuizQuestion.findOne({
    _id: questionId,
    quiz: quizId,
    instructor: instructorId,
  }).select(
    `
      +correctAnswerText
      +acceptedAnswers
      `,
  );

  if (!question) {
    throw new ApiError(404, "Quiz question not found");
  }

  const before = {
    isActive: question.isActive,
    order: question.order,
    marks: question.marks,
  };

  if (!question.isActive) {
    return {
      question,
      before,
      after: before,
      changed: false,

      quiz: {
        id: quiz._id,
        totalQuestions: quiz.totalQuestions,
        totalMarks: quiz.totalMarks,
      },

      message: "Quiz question is already deleted",
    };
  }

  /*
   * Existing attempts ke baad question structure
   * change nahi karenge.
   */
  const attemptExists = await QuizAttempt.exists({
    quiz: quiz._id,
  });

  if (attemptExists) {
    throw new ApiError(
      409,
      "Quiz attempts already exist. Question cannot be deleted",
    );
  }

  question.isActive = false;

  await question.save();

  const totals = await recalculateQuizTotals({
    quizId: quiz._id,
  });

  const after = {
    isActive: question.isActive,
    order: question.order,
    marks: question.marks,
  };

  return {
    question,
    before,
    after,
    changed: true,

    quiz: {
      id: totals.quiz._id,
      totalQuestions: totals.totalQuestions,
      totalMarks: totals.totalMarks,
    },

    message: "Quiz question deleted successfully",
  };
}

export async function restoreQuizQuestion({
  instructorId,
  quizId,
  questionId,
}) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(quizId, "quiz ID");

  validateObjectId(questionId, "question ID");

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  });

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  if (quiz.status === "archived") {
    throw new ApiError(400, "Archived quiz questions cannot be restored");
  }

  const question = await QuizQuestion.findOne({
    _id: questionId,
    quiz: quizId,
    instructor: instructorId,
  }).select(`
      +correctAnswerText
      +acceptedAnswers
    `);

  if (!question) {
    throw new ApiError(404, "Quiz question not found");
  }

  const before = {
    isActive: question.isActive,
    order: question.order,
    marks: question.marks,
  };

  if (question.isActive) {
    return {
      question,

      before,

      after: before,

      changed: false,

      quiz: {
        id: quiz._id,
        totalQuestions: quiz.totalQuestions,
        totalMarks: quiz.totalMarks,
      },

      message: "Quiz question is already active",
    };
  }

  /*
   * Existing attempts ke baad deleted question restore
   * karne se attempt structure change ho jayega.
   */
  const attemptExists = await QuizAttempt.exists({
    quiz: quiz._id,
  });

  if (attemptExists) {
    throw new ApiError(
      409,
      "Quiz attempts already exist. Question cannot be restored",
    );
  }

  /*
   * Same order kisi active question ne use kar liya ho
   * to restore nahi karenge.
   */
  const duplicateOrder = await QuizQuestion.exists({
    quiz: quiz._id,
    order: question.order,
    isActive: true,

    _id: {
      $ne: question._id,
    },
  });

  if (duplicateOrder) {
    throw new ApiError(
      409,
      `Question order ${question.order} is already used by another active question`,
    );
  }

  question.isActive = true;

  await question.save();

  const totals = await recalculateQuizTotals({
    quizId: quiz._id,
  });

  const after = {
    isActive: question.isActive,
    order: question.order,
    marks: question.marks,
  };

  return {
    question,

    before,

    after,

    changed: true,

    quiz: {
      id: totals.quiz._id,

      totalQuestions: totals.totalQuestions,

      totalMarks: totals.totalMarks,
    },

    message: "Quiz question restored successfully",
  };
}

export async function getStudentQuizzes({ studentId, query = {} }) {
  validateObjectId(studentId, "student ID");

  const {
    search,
    course,
    availability = "available",
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  /*
   * Student ke valid enrollments fetch karenge.
   */
  const enrollments = await Enrollment.find({
    student: studentId,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select("course")
    .lean();

  const enrolledCourseIds = enrollments.map((enrollment) => enrollment.course);

  if (enrolledCourseIds.length === 0) {
    return {
      quizzes: [],

      pagination: buildPaginationMeta({
        page,
        limit,
        totalRecords: 0,
      }),

      filters: {
        search: search?.trim() || null,
        course: course || null,
        availability,
        sortBy: "createdAt",
        order: "desc",
      },
    };
  }

  const filter = {
    course: {
      $in: enrolledCourseIds,
    },

    status: "published",
    isPublished: true,
    isActive: true,
  };

  if (course) {
    validateObjectId(course, "course ID");

    const isEnrolledInCourse = enrolledCourseIds.some(
      (courseId) => courseId.toString() === String(course),
    );

    if (!isEnrolledInCourse) {
      throw new ApiError(403, "You are not enrolled in this course");
    }

    filter.course = course;
  }

  const searchFilter = buildSearchFilter(search, [
    "title",
    "description",
    "instructions",
  ]);

  if (searchFilter) {
    filter.$or = searchFilter;
  }

  const parsedAvailability =
    parseEnumQuery(
      availability,
      ["available", "upcoming", "expired", "all"],
      "Quiz availability",
    ) ?? "available";

  const now = new Date();

  if (parsedAvailability === "available") {
    filter.$and = [
      {
        $or: [
          {
            availableFrom: null,
          },
          {
            availableFrom: {
              $lte: now,
            },
          },
        ],
      },
      {
        $or: [
          {
            availableUntil: null,
          },
          {
            availableUntil: {
              $gt: now,
            },
          },
        ],
      },
    ];
  }

  if (parsedAvailability === "upcoming") {
    filter.availableFrom = {
      $gt: now,
    };
  }

  if (parsedAvailability === "expired") {
    filter.availableUntil = {
      $ne: null,
      $lte: now,
    };
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "createdAt",
      "publishedAt",
      "availableFrom",
      "availableUntil",
      "title",
      "totalQuestions",
      "totalMarks",
      "durationInMinutes",
    ],
    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  const [quizzes, totalRecords] = await Promise.all([
    Quiz.find(filter)
      .select(
        `
          course
          module
          lecture
          title
          description
          instructions
          durationInMinutes
          passingPercentage
          totalQuestions
          totalMarks
          maxAttempts
          availableFrom
          availableUntil
          shuffleQuestions
          shuffleOptions
          showResultImmediately
          showCorrectAnswers
          publishedAt
          createdAt
        `,
      )
      .populate({
        path: "course",
        select: "title slug thumbnailUrl",
      })
      .populate({
        path: "module",
        select: "title order",
      })
      .populate({
        path: "lecture",
        select: "title type order",
      })
      .sort({
        [selectedSortField]: sortOrder,

        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Quiz.countDocuments(filter),
  ]);

  const quizIds = quizzes.map((quiz) => quiz._id);

  /*
   * Har quiz ke student attempts ek query me fetch.
   */
  const attemptStats =
    quizIds.length > 0
      ? await QuizAttempt.aggregate([
          {
            $match: {
              student: new mongoose.Types.ObjectId(studentId),

              quiz: {
                $in: quizIds,
              },
            },
          },
          {
            $group: {
              _id: "$quiz",

              attemptsUsed: {
                $sum: 1,
              },

              bestPercentage: {
                $max: "$percentage",
              },

              passed: {
                $max: {
                  $cond: [
                    {
                      $eq: ["$isPassed", true],
                    },
                    1,
                    0,
                  ],
                },
              },

              inProgressAttemptId: {
                $max: {
                  $cond: [
                    {
                      $eq: ["$status", "in_progress"],
                    },
                    "$_id",
                    null,
                  ],
                },
              },
            },
          },
        ])
      : [];

  const attemptMap = new Map(
    attemptStats.map((item) => [item._id.toString(), item]),
  );

  const formattedQuizzes = quizzes.map((quiz) => {
    const stats = attemptMap.get(quiz._id.toString());

    const attemptsUsed = stats?.attemptsUsed ?? 0;

    const attemptsRemaining = Math.max(
      (quiz.maxAttempts ?? 1) - attemptsUsed,
      0,
    );

    const hasInProgressAttempt = Boolean(stats?.inProgressAttemptId);

    return {
      ...quiz,

      attemptSummary: {
        attemptsUsed,

        attemptsRemaining,

        bestPercentage: Number((stats?.bestPercentage ?? 0).toFixed(2)),

        isPassed: stats?.passed === 1,

        hasInProgressAttempt,

        inProgressAttemptId: stats?.inProgressAttemptId ?? null,

        canStart: hasInProgressAttempt || attemptsRemaining > 0,
      },
    };
  });

  return {
    quizzes: formattedQuizzes,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,
      course: course || null,

      availability: parsedAvailability,

      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getStudentQuizById({ studentId, quizId }) {
  validateObjectId(studentId, "student ID");
  validateObjectId(quizId, "quiz ID");

  const now = new Date();

  const quiz = await Quiz.findOne({
    _id: quizId,
    status: "published",
    isPublished: true,
    isActive: true,
  })
    .select(
      `
      course
      module
      lecture
      title
      description
      instructions
      durationInMinutes
      passingPercentage
      totalQuestions
      totalMarks
      maxAttempts
      availableFrom
      availableUntil
      shuffleQuestions
      shuffleOptions
      showResultImmediately
      showCorrectAnswers
      publishedAt
      createdAt
      updatedAt
    `,
    )
    .populate({
      path: "course",
      select: `
        title
        slug
        thumbnailUrl
        instructor
        status
        isPublished
        isActive
      `,
      populate: {
        path: "instructor",
        select: "fullName avatarUrl",
      },
    })
    .populate({
      path: "module",
      select: `
        title
        description
        order
        isPublished
        isActive
      `,
    })
    .populate({
      path: "lecture",
      select: `
        title
        type
        order
        durationInSeconds
        isPublished
        isActive
      `,
    })
    .lean();

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  /*
   * Student ko course enrollment required hai.
   */
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: quiz.course._id,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select(
      `
      status
      progressPercentage
      enrolledAt
      expiresAt
    `,
    )
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  if (
    enrollment.expiresAt &&
    new Date(enrollment.expiresAt).getTime() <= now.getTime()
  ) {
    throw new ApiError(403, "Your course enrollment has expired");
  }

  /*
   * Quiz availability state.
   */
  let availabilityStatus = "available";

  if (
    quiz.availableFrom &&
    new Date(quiz.availableFrom).getTime() > now.getTime()
  ) {
    availabilityStatus = "upcoming";
  }

  if (
    quiz.availableUntil &&
    new Date(quiz.availableUntil).getTime() <= now.getTime()
  ) {
    availabilityStatus = "expired";
  }

  /*
   * Student ke attempts fetch karenge.
   */
  const attempts = await QuizAttempt.find({
    quiz: quizId,
    student: studentId,
  })
    .select(
      `
      attemptNumber
      status
      startedAt
      expiresAt
      submittedAt
      evaluatedAt
      totalQuestions
      attemptedQuestions
      correctAnswers
      incorrectAnswers
      skippedQuestions
      totalMarks
      obtainedMarks
      negativeMarksDeducted
      percentage
      isPassed
      timeSpentInSeconds
      autoSubmitted
      submissionReason
      createdAt
    `,
    )
    .sort({
      attemptNumber: -1,
    })
    .lean();

  const inProgressAttempt =
    attempts.find((attempt) => attempt.status === "in_progress") ?? null;

  const evaluatedAttempts = attempts.filter(
    (attempt) => attempt.status === "evaluated",
  );

  const attemptsUsed = attempts.length;

  const attemptsRemaining = Math.max((quiz.maxAttempts ?? 1) - attemptsUsed, 0);

  const bestAttempt =
    evaluatedAttempts.length > 0
      ? evaluatedAttempts.reduce((best, attempt) =>
          attempt.percentage > best.percentage ? attempt : best,
        )
      : null;

  /*
   * Questions safe format me fetch honge.
   *
   * options.isCorrect ko manually remove karna important hai.
   */
  const questions = await QuizQuestion.find({
    quiz: quizId,
    isActive: true,
  })
    .select(
      `
      questionText
      questionType
      options
      marks
      negativeMarks
      order
      difficulty
      isRequired
    `,
    )
    .sort({
      order: 1,
      createdAt: 1,
    })
    .lean();

  const safeQuestions = questions.map((question) => ({
    _id: question._id,

    questionText: question.questionText,

    questionType: question.questionType,

    options: question.options.map((option) => ({
      _id: option._id,
      text: option.text,
    })),

    marks: question.marks,

    negativeMarks: question.negativeMarks,

    order: question.order,

    difficulty: question.difficulty,

    isRequired: question.isRequired,
  }));

  const canStartNewAttempt =
    availabilityStatus === "available" &&
    !inProgressAttempt &&
    attemptsRemaining > 0;

  const canContinueAttempt =
    availabilityStatus === "available" && Boolean(inProgressAttempt);

  return {
    quiz: {
      ...quiz,

      availabilityStatus,

      isAvailable: availabilityStatus === "available",
    },

    enrollment,

    questions: safeQuestions,

    attemptSummary: {
      attemptsUsed,

      maxAttempts: quiz.maxAttempts ?? 1,

      attemptsRemaining,

      hasInProgressAttempt: Boolean(inProgressAttempt),

      inProgressAttemptId: inProgressAttempt?._id ?? null,

      canStartNewAttempt,

      canContinueAttempt,

      bestAttempt: bestAttempt
        ? {
            attemptId: bestAttempt._id,

            attemptNumber: bestAttempt.attemptNumber,

            obtainedMarks: bestAttempt.obtainedMarks,

            totalMarks: bestAttempt.totalMarks,

            percentage: bestAttempt.percentage,

            isPassed: bestAttempt.isPassed,

            submittedAt: bestAttempt.submittedAt,

            evaluatedAt: bestAttempt.evaluatedAt,
          }
        : null,
    },

    previousAttempts: attempts,
  };
}

function formatAttemptQuestions({ questions, quiz, shuffleSeed }) {
  let orderedQuestions = [...questions];

  if (quiz.shuffleQuestions) {
    orderedQuestions = shuffleWithSeed(
      orderedQuestions,
      `${shuffleSeed}:questions`,
    );
  }

  return orderedQuestions.map((question) => {
    let safeOptions = question.options.map((option) => ({
      _id: option._id,
      text: option.text,
    }));

    if (quiz.shuffleOptions && safeOptions.length > 1) {
      safeOptions = shuffleWithSeed(
        safeOptions,
        `${shuffleSeed}:question:${question._id}:options`,
      );
    }

    return {
      _id: question._id,
      questionText: question.questionText,
      questionType: question.questionType,
      options: safeOptions,
      marks: question.marks,
      negativeMarks: question.negativeMarks,
      difficulty: question.difficulty,
      isRequired: question.isRequired,
    };
  });
}

export async function startQuizAttempt({ studentId, quizId }) {
  validateObjectId(studentId, "student ID");

  validateObjectId(quizId, "quiz ID");

  const now = new Date();

  const quiz = await Quiz.findOne({
    _id: quizId,
    status: "published",
    isPublished: true,
    isActive: true,
  }).lean();

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  /*
   * Availability validation
   */
  if (
    quiz.availableFrom &&
    new Date(quiz.availableFrom).getTime() > now.getTime()
  ) {
    throw new ApiError(400, "Quiz is not available yet");
  }

  if (
    quiz.availableUntil &&
    new Date(quiz.availableUntil).getTime() <= now.getTime()
  ) {
    throw new ApiError(400, "Quiz availability has expired");
  }

  /*
   * Enrollment validation
   */
  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: quiz.course,

    status: {
      $in: ["active", "completed"],
    },
  })
    .select(
      `
        student
        course
        status
        expiresAt
      `,
    )
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  if (
    enrollment.expiresAt &&
    new Date(enrollment.expiresAt).getTime() <= now.getTime()
  ) {
    throw new ApiError(403, "Your course enrollment has expired");
  }

  /*
   * Existing in-progress attempt resume hoga.
   */
  const existingAttempt = await QuizAttempt.findOne({
    quiz: quizId,
    student: studentId,
    status: "in_progress",
  }).sort({
    attemptNumber: -1,
  });

  if (existingAttempt) {
    /*
     * Timer expire ho chuka ho to attempt expire mark
     * karke new attempt validation continue karenge.
     */
    if (
      existingAttempt.expiresAt &&
      new Date(existingAttempt.expiresAt).getTime() <= now.getTime()
    ) {
      existingAttempt.status = "expired";
      existingAttempt.autoSubmitted = true;
      existingAttempt.submissionReason = "time_expired";
      existingAttempt.submittedAt = now;

      existingAttempt.timeSpentInSeconds = Math.max(
        0,
        Math.floor(
          (now.getTime() - new Date(existingAttempt.startedAt).getTime()) /
            1000,
        ),
      );

      await existingAttempt.save();
    } else {
      const existingQuestions = await QuizQuestion.find({
        _id: {
          $in: existingAttempt.questionOrder,
        },
        quiz: quizId,
        isActive: true,
      })
        .select(
          `
            questionText
            questionType
            options
            marks
            negativeMarks
            difficulty
            isRequired
          `,
        )
        .lean();

      const questionMap = new Map(
        existingQuestions.map((question) => [
          question._id.toString(),
          question,
        ]),
      );

      const orderedQuestions = existingAttempt.questionOrder
        .map((questionId) => questionMap.get(questionId.toString()))
        .filter(Boolean);

      const safeQuestions = formatAttemptQuestions({
        questions: orderedQuestions,
        quiz: {
          ...quiz,
          shuffleQuestions: false,
        },
        shuffleSeed: existingAttempt.shuffleSeed,
      });

      const savedAnswers = await QuizAnswer.find({
        attempt: existingAttempt._id,
      })
        .select(
          `
            question
            selectedOptionIds
            answerText
            isAnswered
            updatedAt
          `,
        )
        .lean();

      return {
        attempt: existingAttempt,
        questions: safeQuestions,
        savedAnswers,
        resumed: true,
        message: "Existing quiz attempt resumed",
      };
    }
  }

  /*
   * Max attempt validation
   */
  const attemptsUsed = await QuizAttempt.countDocuments({
    quiz: quizId,
    student: studentId,
  });

  if (attemptsUsed >= (quiz.maxAttempts ?? 1)) {
    throw new ApiError(403, "Maximum quiz attempts reached");
  }

  /*
   * Questions snapshot
   */
  const questions = await QuizQuestion.find({
    quiz: quizId,
    isActive: true,
  })
    .select(
      `
        questionText
        questionType
        options
        marks
        negativeMarks
        order
        difficulty
        isRequired
      `,
    )
    .sort({
      order: 1,
      createdAt: 1,
    })
    .lean();

  if (questions.length === 0) {
    throw new ApiError(400, "Quiz has no active questions");
  }

  const calculatedTotalMarks = questions.reduce(
    (total, question) => total + Number(question.marks || 0),
    0,
  );

  const attemptNumber = attemptsUsed + 1;

  const shuffleSeed = randomBytes(16).toString("hex");

  let orderedQuestions = [...questions];

  if (quiz.shuffleQuestions) {
    orderedQuestions = shuffleWithSeed(
      orderedQuestions,
      `${shuffleSeed}:questions`,
    );
  }

  const questionOrder = orderedQuestions.map((question) => question._id);

  let expiresAt = null;

  if (quiz.durationInMinutes) {
    expiresAt = new Date(now.getTime() + quiz.durationInMinutes * 60 * 1000);

    /*
     * Quiz availability end timer se pehle aa raha ho
     * to earlier date use karenge.
     */
    if (
      quiz.availableUntil &&
      new Date(quiz.availableUntil).getTime() < expiresAt.getTime()
    ) {
      expiresAt = new Date(quiz.availableUntil);
    }
  } else if (quiz.availableUntil) {
    expiresAt = new Date(quiz.availableUntil);
  }

  let attempt;

  try {
    attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: studentId,
      course: quiz.course,
      enrollment: enrollment._id,

      attemptNumber,

      questionOrder,
      shuffleSeed,

      status: "in_progress",

      startedAt: now,
      expiresAt,

      totalQuestions: questions.length,

      attemptedQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      skippedQuestions: questions.length,

      totalMarks: calculatedTotalMarks,

      obtainedMarks: 0,

      negativeMarksDeducted: 0,

      percentage: 0,

      passingPercentage: quiz.passingPercentage,

      isPassed: false,

      timeSpentInSeconds: 0,

      autoSubmitted: false,

      submissionReason: null,
    });
  } catch (error) {
    /*
     * Concurrent start requests me unique attempt number
     * conflict aa sakta hai.
     */
    if (error?.code === 11000) {
      const activeAttempt = await QuizAttempt.findOne({
        quiz: quizId,
        student: studentId,
        status: "in_progress",
      }).sort({
        attemptNumber: -1,
      });

      if (activeAttempt) {
        throw new ApiError(
          409,
          "Quiz attempt already started. Please resume the existing attempt",
        );
      }
    }

    throw error;
  }

  const safeQuestions = formatAttemptQuestions({
    questions: orderedQuestions,

    quiz: {
      ...quiz,

      /*
       * Questions already shuffled above.
       */
      shuffleQuestions: false,
    },

    shuffleSeed,
  });

  return {
    attempt,
    questions: safeQuestions,
    savedAnswers: [],
    resumed: false,
    message: "Quiz attempt started successfully",
  };
}

function normalizeAnswerText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

export async function saveQuizAnswer({
  studentId,
  quizId,
  attemptId,
  questionId,
  payload,
}) {
  validateObjectId(studentId, "student ID");
  validateObjectId(quizId, "quiz ID");
  validateObjectId(attemptId, "attempt ID");
  validateObjectId(questionId, "question ID");

  const { selectedOptionIds = [], answerText = "" } = payload || {};

  const now = new Date();

  /*
   * Attempt ownership aur state validation.
   */
  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    quiz: quizId,
    student: studentId,
  });

  if (!attempt) {
    throw new ApiError(404, "Quiz attempt not found");
  }

  if (attempt.status !== "in_progress") {
    throw new ApiError(
      409,
      `Answers cannot be updated because attempt is ${attempt.status}`,
    );
  }

  /*
   * Timer expire ho gaya ho to answer save block karenge.
   * Final auto-submit next submit helper se karenge.
   */
  if (
    attempt.expiresAt &&
    new Date(attempt.expiresAt).getTime() <= now.getTime()
  ) {
    throw new ApiError(409, "Quiz attempt time has expired");
  }

  /*
   * Question attempt ke original snapshot ka part hona chahiye.
   */
  const questionExistsInAttempt = attempt.questionOrder.some(
    (storedQuestionId) => storedQuestionId.toString() === questionId,
  );

  if (!questionExistsInAttempt) {
    throw new ApiError(400, "Question does not belong to this quiz attempt");
  }

  /*
   * Correct answers bhi fetch honge, lekin response me expose nahi karenge.
   */
  const question = await QuizQuestion.findOne({
    _id: questionId,
    quiz: quizId,
  }).select(`
    +correctAnswerText
    +acceptedAnswers
    questionText
    questionType
    options
    marks
    negativeMarks
    isRequired
    isActive
  `);

  if (!question) {
    throw new ApiError(404, "Quiz question not found");
  }

  /*
   * Original attempt start hone ke baad question inactive ho jaye,
   * tab bhi existing attempt ka answer accept karenge.
   *
   * Isliye yahan isActive:true condition intentionally nahi lagayi.
   */

  let normalizedSelectedOptionIds = [];
  let normalizedAnswerText = "";

  /*
   * Choice-based question validation.
   */
  if (
    ["single_choice", "multiple_choice", "true_false"].includes(
      question.questionType,
    )
  ) {
    if (!Array.isArray(selectedOptionIds)) {
      throw new ApiError(400, "selectedOptionIds must be an array");
    }

    normalizedSelectedOptionIds = [
      ...new Set(
        selectedOptionIds
          .map((optionId) => String(optionId || "").trim())
          .filter(Boolean),
      ),
    ];

    for (const optionId of normalizedSelectedOptionIds) {
      validateObjectId(optionId, "selected option ID");
    }

    const validOptionIds = new Set(
      question.options.map((option) => option._id.toString()),
    );

    const invalidOptionId = normalizedSelectedOptionIds.find(
      (optionId) => !validOptionIds.has(optionId),
    );

    if (invalidOptionId) {
      throw new ApiError(
        400,
        "One or more selected options do not belong to this question",
      );
    }

    if (
      ["single_choice", "true_false"].includes(question.questionType) &&
      normalizedSelectedOptionIds.length > 1
    ) {
      throw new ApiError(
        400,
        `${question.questionType} question accepts only one selected option`,
      );
    }

    /*
     * Empty array allowed hai.
     * Student answer clear bhi kar sakta hai.
     */
    normalizedAnswerText = "";
  }

  /*
   * Short-answer validation.
   */
  if (question.questionType === "short_answer") {
    if (
      selectedOptionIds !== undefined &&
      Array.isArray(selectedOptionIds) &&
      selectedOptionIds.length > 0
    ) {
      throw new ApiError(
        400,
        "Short answer question does not accept selected options",
      );
    }

    normalizedSelectedOptionIds = [];

    normalizedAnswerText = normalizeAnswerText(answerText);

    if (normalizedAnswerText.length > 2000) {
      throw new ApiError(400, "Answer text cannot exceed 2000 characters");
    }
  }

  const isAnswered =
    question.questionType === "short_answer"
      ? normalizedAnswerText.length > 0
      : normalizedSelectedOptionIds.length > 0;

  /*
   * Auto-save stage par evaluation nahi karenge.
   * Scoring quiz submit hote waqt hogi.
   */
  const answer = await QuizAnswer.findOneAndUpdate(
    {
      attempt: attempt._id,
      question: question._id,
    },
    {
      $set: {
        quiz: attempt.quiz,
        student: attempt.student,
        questionType: question.questionType,

        selectedOptionIds: normalizedSelectedOptionIds,

        answerText: normalizedAnswerText,

        isAnswered,

        /*
         * Submit se pehle result reset rahega.
         */
        isCorrect: null,
        marksAwarded: 0,
        negativeMarksDeducted: 0,

        maxMarks: question.marks,

        evaluationType:
          question.questionType === "short_answer" ? "automatic" : "automatic",

        evaluatedAt: null,
        evaluatedBy: null,
        evaluatorComment: "",
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  /*
   * Attempt progress summary recalculate.
   */
  const attemptedQuestions = await QuizAnswer.countDocuments({
    attempt: attempt._id,
    isAnswered: true,
  });

  attempt.attemptedQuestions = attemptedQuestions;

  attempt.skippedQuestions = Math.max(
    attempt.totalQuestions - attemptedQuestions,
    0,
  );

  attempt.timeSpentInSeconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000),
  );

  await attempt.save();

  return {
    answer: {
      _id: answer._id,
      attempt: answer.attempt,
      question: answer.question,
      questionType: answer.questionType,
      selectedOptionIds: answer.selectedOptionIds,
      answerText: answer.answerText,
      isAnswered: answer.isAnswered,
      updatedAt: answer.updatedAt,
    },

    attemptProgress: {
      attemptId: attempt._id,
      attemptedQuestions: attempt.attemptedQuestions,
      skippedQuestions: attempt.skippedQuestions,
      totalQuestions: attempt.totalQuestions,
      timeSpentInSeconds: attempt.timeSpentInSeconds,
      expiresAt: attempt.expiresAt,
    },

    message: isAnswered
      ? "Quiz answer saved successfully"
      : "Quiz answer cleared successfully",
  };
}

function normalizeShortAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function areObjectIdSetsEqual(firstIds = [], secondIds = []) {
  if (firstIds.length !== secondIds.length) {
    return false;
  }

  const firstSet = new Set(firstIds.map((id) => String(id)));

  return secondIds.every((id) => firstSet.has(String(id)));
}

function evaluateQuizAnswer({ question, answer }) {
  const isAnswered = Boolean(answer?.isAnswered);

  if (!isAnswered) {
    return {
      isCorrect: false,
      marksAwarded: 0,
      negativeMarksDeducted: 0,
    };
  }

  if (["single_choice", "true_false"].includes(question.questionType)) {
    const correctOption = question.options.find((option) => option.isCorrect);

    const selectedOptionId = answer.selectedOptionIds?.[0];

    const isCorrect =
      Boolean(correctOption) &&
      Boolean(selectedOptionId) &&
      correctOption._id.toString() === selectedOptionId.toString();

    return {
      isCorrect,

      marksAwarded: isCorrect ? question.marks : 0,

      negativeMarksDeducted: isCorrect ? 0 : question.negativeMarks,
    };
  }

  if (question.questionType === "multiple_choice") {
    const correctOptionIds = question.options
      .filter((option) => option.isCorrect)
      .map((option) => option._id);

    const selectedOptionIds = answer.selectedOptionIds ?? [];

    const isCorrect = areObjectIdSetsEqual(selectedOptionIds, correctOptionIds);

    return {
      isCorrect,

      marksAwarded: isCorrect ? question.marks : 0,

      negativeMarksDeducted: isCorrect ? 0 : question.negativeMarks,
    };
  }

  if (question.questionType === "short_answer") {
    const normalizedAnswer = normalizeShortAnswer(answer.answerText);

    const acceptedAnswers = question.acceptedAnswers.map(normalizeShortAnswer);

    const isCorrect = acceptedAnswers.includes(normalizedAnswer);

    return {
      isCorrect,

      marksAwarded: isCorrect ? question.marks : 0,

      negativeMarksDeducted: isCorrect ? 0 : question.negativeMarks,
    };
  }

  return {
    isCorrect: false,
    marksAwarded: 0,
    negativeMarksDeducted: 0,
  };
}

export async function submitQuizAttempt({
  studentId,
  quizId,
  attemptId,
  submissionReason = "manual",
}) {
  validateObjectId(studentId, "student ID");

  validateObjectId(quizId, "quiz ID");

  validateObjectId(attemptId, "attempt ID");

  const parsedSubmissionReason =
    parseEnumQuery(
      submissionReason,
      ["manual", "time_expired", "admin_submitted", "system"],
      "Submission reason",
    ) ?? "manual";

  const now = new Date();

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    quiz: quizId,
    student: studentId,
  });

  if (!attempt) {
    throw new ApiError(404, "Quiz attempt not found");
  }

  if (["submitted", "evaluated"].includes(attempt.status)) {
    return {
      attempt,
      result: await buildStudentQuizResult({
        attempt,
        quizId,
        studentId,
      }),
      alreadySubmitted: true,
      message: "Quiz attempt has already been submitted",
    };
  }

  if (["cancelled", "expired"].includes(attempt.status)) {
    throw new ApiError(409, `Quiz attempt is ${attempt.status}`);
  }

  if (attempt.status !== "in_progress") {
    throw new ApiError(409, "Quiz attempt cannot be submitted");
  }

  const quiz = await Quiz.findOne({
    _id: quizId,
    isActive: true,
  }).lean();

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  const hasExpired =
    Boolean(attempt.expiresAt) &&
    new Date(attempt.expiresAt).getTime() <= now.getTime();

  const finalSubmissionReason = hasExpired
    ? "time_expired"
    : parsedSubmissionReason;

  const questionIds = attempt.questionOrder ?? [];

  const questions = await QuizQuestion.find({
    _id: {
      $in: questionIds,
    },
    quiz: quizId,
  })
    .select(
      `
        +acceptedAnswers
        +correctAnswerText
        questionText
        questionType
        options
        marks
        negativeMarks
        order
        isRequired
      `,
    )
    .lean();

  if (questions.length === 0) {
    throw new ApiError(400, "Quiz attempt has no valid questions");
  }

  const questionMap = new Map(
    questions.map((question) => [question._id.toString(), question]),
  );

  const answers = await QuizAnswer.find({
    attempt: attempt._id,
    student: studentId,
  });

  const answerMap = new Map(
    answers.map((answer) => [answer.question.toString(), answer]),
  );

  let attemptedQuestions = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let skippedQuestions = 0;

  let grossMarks = 0;
  let totalNegativeMarks = 0;

  const answerWriteOperations = [];

  for (const questionId of questionIds) {
    const question = questionMap.get(questionId.toString());

    if (!question) {
      continue;
    }

    const answer = answerMap.get(question._id.toString());

    if (!answer?.isAnswered) {
      skippedQuestions += 1;

      if (answer) {
        answerWriteOperations.push({
          updateOne: {
            filter: {
              _id: answer._id,
            },

            update: {
              $set: {
                isCorrect: false,
                marksAwarded: 0,
                negativeMarksDeducted: 0,
                evaluatedAt: now,
                evaluationType: "automatic",
              },
            },
          },
        });
      }

      continue;
    }

    attemptedQuestions += 1;

    const evaluation = evaluateQuizAnswer({
      question,
      answer,
    });

    if (evaluation.isCorrect) {
      correctAnswers += 1;
    } else {
      incorrectAnswers += 1;
    }

    grossMarks += evaluation.marksAwarded;

    totalNegativeMarks += evaluation.negativeMarksDeducted;

    answerWriteOperations.push({
      updateOne: {
        filter: {
          _id: answer._id,
        },

        update: {
          $set: {
            isCorrect: evaluation.isCorrect,

            marksAwarded: evaluation.marksAwarded,

            negativeMarksDeducted: evaluation.negativeMarksDeducted,

            evaluatedAt: now,

            evaluationType: "automatic",
          },
        },
      },
    });
  }

  if (answerWriteOperations.length > 0) {
    await QuizAnswer.bulkWrite(answerWriteOperations);
  }

  const totalMarks = questions.reduce(
    (total, question) => total + Number(question.marks || 0),
    0,
  );

  const obtainedMarks = Math.max(
    Number((grossMarks - totalNegativeMarks).toFixed(2)),
    0,
  );

  const percentage =
    totalMarks > 0
      ? Math.min(100, Number(((obtainedMarks / totalMarks) * 100).toFixed(2)))
      : 0;

  const passingPercentage =
    attempt.passingPercentage ?? quiz.passingPercentage ?? 40;

  const isPassed = percentage >= passingPercentage;

  const startedAtTime = new Date(attempt.startedAt).getTime();

  const effectiveEndTime =
    hasExpired && attempt.expiresAt
      ? new Date(attempt.expiresAt).getTime()
      : now.getTime();

  const timeSpentInSeconds = Math.max(
    0,
    Math.floor((effectiveEndTime - startedAtTime) / 1000),
  );

  attempt.status = "evaluated";
  attempt.submittedAt = now;
  attempt.evaluatedAt = now;

  attempt.attemptedQuestions = attemptedQuestions;

  attempt.correctAnswers = correctAnswers;

  attempt.incorrectAnswers = incorrectAnswers;

  attempt.skippedQuestions = skippedQuestions;

  attempt.totalQuestions = questions.length;

  attempt.totalMarks = totalMarks;

  attempt.obtainedMarks = obtainedMarks;

  attempt.negativeMarksDeducted = Number(totalNegativeMarks.toFixed(2));

  attempt.percentage = percentage;
  attempt.passingPercentage = passingPercentage;

  attempt.isPassed = isPassed;

  attempt.timeSpentInSeconds = timeSpentInSeconds;

  attempt.autoSubmitted = finalSubmissionReason === "time_expired";

  attempt.submissionReason = finalSubmissionReason;

  await attempt.save();

  const result = await buildStudentQuizResult({
    attempt,
    quizId,
    studentId,
  });

  return {
    attempt,
    result,
    alreadySubmitted: false,

    message:
      finalSubmissionReason === "time_expired"
        ? "Quiz attempt auto-submitted because time expired"
        : "Quiz attempt submitted successfully",
  };
}
async function buildStudentQuizResult({ attempt, quizId, studentId }) {
  const quiz = await Quiz.findById(quizId)
    .select(
      `
      title
      showResultImmediately
      showCorrectAnswers
      passingPercentage
    `,
    )
    .lean();

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  const baseResult = {
    attemptId: attempt._id,
    attemptNumber: attempt.attemptNumber,

    status: attempt.status,

    totalQuestions: attempt.totalQuestions,

    attemptedQuestions: attempt.attemptedQuestions,

    correctAnswers: attempt.correctAnswers,

    incorrectAnswers: attempt.incorrectAnswers,

    skippedQuestions: attempt.skippedQuestions,

    totalMarks: attempt.totalMarks,

    obtainedMarks: attempt.obtainedMarks,

    negativeMarksDeducted: attempt.negativeMarksDeducted,

    percentage: attempt.percentage,

    passingPercentage: attempt.passingPercentage,

    isPassed: attempt.isPassed,

    timeSpentInSeconds: attempt.timeSpentInSeconds,

    startedAt: attempt.startedAt,

    submittedAt: attempt.submittedAt,

    evaluatedAt: attempt.evaluatedAt,

    autoSubmitted: attempt.autoSubmitted,

    submissionReason: attempt.submissionReason,
  };

  if (!quiz.showResultImmediately) {
    return {
      resultVisible: false,

      result: {
        attemptId: attempt._id,

        status: attempt.status,

        submittedAt: attempt.submittedAt,

        message: "Quiz result will be available later",
      },
    };
  }

  if (!quiz.showCorrectAnswers) {
    return {
      resultVisible: true,
      showCorrectAnswers: false,
      result: baseResult,
      answers: null,
    };
  }

  const answers = await QuizAnswer.find({
    attempt: attempt._id,
    student: studentId,
  })
    .populate({
      path: "question",

      select: `
        +acceptedAnswers
        +correctAnswerText
        questionText
        questionType
        options
        marks
        negativeMarks
        explanation
      `,
    })
    .sort({
      createdAt: 1,
    })
    .lean();

  const formattedAnswers = answers.map((answer) => {
    const question = answer.question;

    const correctOptionIds =
      question?.options
        ?.filter((option) => option.isCorrect)
        .map((option) => option._id) ?? [];

    return {
      questionId: question?._id ?? answer.question,

      questionText: question?.questionText ?? "",

      questionType: answer.questionType,

      selectedOptionIds: answer.selectedOptionIds,

      answerText: answer.answerText,

      isAnswered: answer.isAnswered,

      isCorrect: answer.isCorrect,

      marksAwarded: answer.marksAwarded,

      negativeMarksDeducted: answer.negativeMarksDeducted,

      maxMarks: answer.maxMarks,

      correctOptionIds,

      acceptedAnswers:
        question?.questionType === "short_answer"
          ? question.acceptedAnswers
          : [],

      explanation: question?.explanation ?? "",
    };
  });

  return {
    resultVisible: true,
    showCorrectAnswers: true,
    result: baseResult,
    answers: formattedAnswers,
  };
}

export async function getStudentQuizAttemptResult({
  studentId,
  quizId,
  attemptId,
}) {
  validateObjectId(studentId, "student ID");
  validateObjectId(quizId, "quiz ID");
  validateObjectId(attemptId, "attempt ID");

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    quiz: quizId,
    student: studentId,
  });

  if (!attempt) {
    throw new ApiError(404, "Quiz attempt not found");
  }

  if (attempt.status === "in_progress") {
    throw new ApiError(409, "Quiz attempt has not been submitted yet");
  }

  if (["cancelled", "expired"].includes(attempt.status)) {
    throw new ApiError(409, `Quiz attempt is ${attempt.status}`);
  }

  const result = await buildStudentQuizResult({
    attempt,
    quizId,
    studentId,
  });

  return {
    attempt: {
      id: attempt._id,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      submittedAt: attempt.submittedAt,
      evaluatedAt: attempt.evaluatedAt,
      autoSubmitted: attempt.autoSubmitted,
      submissionReason: attempt.submissionReason,
    },

    ...result,
  };
}

export async function getStudentQuizAttempts({
  studentId,
  quizId,
  query = {},
}) {
  validateObjectId(studentId, "student ID");
  validateObjectId(quizId, "quiz ID");

  const { status, sortBy = "attemptNumber", order = "desc" } = query;

  const { page, limit, skip } = getPagination(query);

  const quiz = await Quiz.findOne({
    _id: quizId,
    status: "published",
    isPublished: true,
    isActive: true,
  })
    .select(
      `
      title
      course
      maxAttempts
      passingPercentage
      showResultImmediately
      showCorrectAnswers
    `,
    )
    .lean();

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  const enrollment = await Enrollment.findOne({
    student: studentId,
    course: quiz.course,
    status: {
      $in: ["active", "completed"],
    },
  })
    .select("_id status expiresAt")
    .lean();

  if (!enrollment) {
    throw new ApiError(403, "You are not enrolled in this course");
  }

  const filter = {
    quiz: quizId,
    student: studentId,
  };

  const parsedStatus = parseEnumQuery(
    status,
    ["in_progress", "submitted", "evaluated", "expired", "cancelled"],
    "Attempt status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,
    allowedFields: [
      "attemptNumber",
      "startedAt",
      "submittedAt",
      "evaluatedAt",
      "percentage",
      "obtainedMarks",
      "timeSpentInSeconds",
      "createdAt",
    ],
    defaultField: "attemptNumber",
    defaultOrder: "desc",
  });

  const [attempts, totalRecords] = await Promise.all([
    QuizAttempt.find(filter)
      .select(
        `
          attemptNumber
          status
          startedAt
          expiresAt
          submittedAt
          evaluatedAt
          totalQuestions
          attemptedQuestions
          correctAnswers
          incorrectAnswers
          skippedQuestions
          totalMarks
          obtainedMarks
          negativeMarksDeducted
          percentage
          passingPercentage
          isPassed
          timeSpentInSeconds
          autoSubmitted
          submissionReason
          createdAt
          updatedAt
        `,
      )
      .sort({
        [selectedSortField]: sortOrder,
        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    QuizAttempt.countDocuments(filter),
  ]);

  const allEvaluatedAttempts = await QuizAttempt.find({
    quiz: quizId,
    student: studentId,
    status: "evaluated",
  })
    .select(
      `
        attemptNumber
        obtainedMarks
        totalMarks
        percentage
        isPassed
        submittedAt
        evaluatedAt
      `,
    )
    .lean();

  const bestAttempt =
    allEvaluatedAttempts.length > 0
      ? allEvaluatedAttempts.reduce((best, current) =>
          current.percentage > best.percentage ? current : best,
        )
      : null;

  const passedAttempts = allEvaluatedAttempts.filter(
    (attempt) => attempt.isPassed,
  ).length;

  const failedAttempts = allEvaluatedAttempts.length - passedAttempts;

  const attemptsUsed = await QuizAttempt.countDocuments({
    quiz: quizId,
    student: studentId,
  });

  const attemptsRemaining = Math.max((quiz.maxAttempts ?? 1) - attemptsUsed, 0);

  const formattedAttempts = attempts.map((attempt) => ({
    ...attempt,

    resultAvailable:
      attempt.status === "evaluated" && quiz.showResultImmediately,

    resultUrl:
      attempt.status === "evaluated"
        ? `/api/student/quizzes/${quizId}/attempts/${attempt._id}/result`
        : null,

    canResume:
      attempt.status === "in_progress" &&
      (!attempt.expiresAt ||
        new Date(attempt.expiresAt).getTime() > Date.now()),
  }));

  return {
    quiz: {
      id: quiz._id,
      title: quiz.title,
      maxAttempts: quiz.maxAttempts ?? 1,
      passingPercentage: quiz.passingPercentage,
    },

    summary: {
      attemptsUsed,
      attemptsRemaining,

      evaluatedAttempts: allEvaluatedAttempts.length,

      passedAttempts,
      failedAttempts,

      hasPassed: passedAttempts > 0,

      bestAttempt: bestAttempt
        ? {
            attemptId: bestAttempt._id,

            attemptNumber: bestAttempt.attemptNumber,

            obtainedMarks: bestAttempt.obtainedMarks,

            totalMarks: bestAttempt.totalMarks,

            percentage: bestAttempt.percentage,

            isPassed: bestAttempt.isPassed,

            submittedAt: bestAttempt.submittedAt,

            evaluatedAt: bestAttempt.evaluatedAt,
          }
        : null,
    },

    attempts: formattedAttempts,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      status: parsedStatus ?? null,

      sortBy: selectedSortField,

      order: normalizedOrder,
    },
  };
}

export async function getStudentQuizAttemptById({
  studentId,
  quizId,
  attemptId,
}) {
  validateObjectId(studentId, "student ID");
  validateObjectId(quizId, "quiz ID");
  validateObjectId(attemptId, "attempt ID");

  const now = new Date();

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    quiz: quizId,
    student: studentId,
  });

  if (!attempt) {
    throw new ApiError(404, "Quiz attempt not found");
  }

  const quiz = await Quiz.findById(quizId)
    .select(
      `
      title
      course
      durationInMinutes
      shuffleQuestions
      shuffleOptions
      showResultImmediately
      showCorrectAnswers
      status
      isPublished
      isActive
    `,
    )
    .lean();

  if (!quiz) {
    throw new ApiError(404, "Quiz not found");
  }

  /*
   * Submitted/evaluated attempt ko resume nahi karenge.
   */
  if (["submitted", "evaluated"].includes(attempt.status)) {
    return {
      attempt: {
        id: attempt._id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        submittedAt: attempt.submittedAt,
        evaluatedAt: attempt.evaluatedAt,
        autoSubmitted: attempt.autoSubmitted,
        submissionReason: attempt.submissionReason,
      },

      quiz: {
        id: quiz._id,
        title: quiz.title,
      },

      questions: [],
      savedAnswers: [],

      timer: {
        remainingTimeInSeconds: 0,
        isExpired: false,
      },

      canResume: false,

      resultUrl: `/api/student/quizzes/${quizId}/attempts/${attemptId}/result`,

      message: "Quiz attempt has already been submitted",
    };
  }

  if (["cancelled", "expired"].includes(attempt.status)) {
    throw new ApiError(409, `Quiz attempt is ${attempt.status}`);
  }

  if (attempt.status !== "in_progress") {
    throw new ApiError(409, "Quiz attempt cannot be resumed");
  }

  /*
   * Timer calculate karenge.
   */
  let remainingTimeInSeconds = null;
  let isExpired = false;

  if (attempt.expiresAt) {
    remainingTimeInSeconds = Math.max(
      0,
      Math.floor(
        (new Date(attempt.expiresAt).getTime() - now.getTime()) / 1000,
      ),
    );

    isExpired = remainingTimeInSeconds <= 0;
  }

  /*
   * Time expire hone par attempt ko evaluated submit
   * endpoint ke through finalize karna better hai.
   */
  if (isExpired) {
    return {
      attempt: {
        id: attempt._id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
      },

      quiz: {
        id: quiz._id,
        title: quiz.title,
      },

      questions: [],
      savedAnswers: [],

      timer: {
        remainingTimeInSeconds: 0,
        isExpired: true,
      },

      canResume: false,

      submitUrl: `/api/student/quizzes/${quizId}/attempts/${attemptId}/submit`,

      message: "Quiz attempt time has expired and must be submitted",
    };
  }

  /*
   * Attempt ke saved question snapshot ke order me
   * questions fetch karenge.
   */
  const questions = await QuizQuestion.find({
    _id: {
      $in: attempt.questionOrder,
    },
    quiz: quizId,
  })
    .select(
      `
      questionText
      questionType
      options
      marks
      negativeMarks
      difficulty
      isRequired
    `,
    )
    .lean();

  const questionMap = new Map(
    questions.map((question) => [question._id.toString(), question]),
  );

  const orderedQuestions = attempt.questionOrder
    .map((questionId) => questionMap.get(questionId.toString()))
    .filter(Boolean);

  /*
   * Question order attempt snapshot me already stored hai.
   * Isliye shuffleQuestions false pass karenge.
   */
  const safeQuestions = formatAttemptQuestions({
    questions: orderedQuestions,

    quiz: {
      ...quiz,
      shuffleQuestions: false,
    },

    shuffleSeed: attempt.shuffleSeed,
  });

  const savedAnswers = await QuizAnswer.find({
    attempt: attempt._id,
    student: studentId,
  })
    .select(
      `
      question
      questionType
      selectedOptionIds
      answerText
      isAnswered
      createdAt
      updatedAt
    `,
    )
    .lean();

  const attemptedQuestions = savedAnswers.filter(
    (answer) => answer.isAnswered,
  ).length;

  const skippedQuestions = Math.max(
    attempt.totalQuestions - attemptedQuestions,
    0,
  );

  /*
   * Attempt summary stale ho to sync karenge.
   */
  if (
    attempt.attemptedQuestions !== attemptedQuestions ||
    attempt.skippedQuestions !== skippedQuestions
  ) {
    attempt.attemptedQuestions = attemptedQuestions;

    attempt.skippedQuestions = skippedQuestions;

    attempt.timeSpentInSeconds = Math.max(
      0,
      Math.floor(
        (now.getTime() - new Date(attempt.startedAt).getTime()) / 1000,
      ),
    );

    await attempt.save();
  }

  return {
    attempt: {
      id: attempt._id,

      attemptNumber: attempt.attemptNumber,

      status: attempt.status,

      startedAt: attempt.startedAt,

      expiresAt: attempt.expiresAt,

      totalQuestions: attempt.totalQuestions,

      attemptedQuestions: attempt.attemptedQuestions,

      skippedQuestions: attempt.skippedQuestions,

      totalMarks: attempt.totalMarks,

      timeSpentInSeconds: attempt.timeSpentInSeconds,
    },

    quiz: {
      id: quiz._id,
      title: quiz.title,
      durationInMinutes: quiz.durationInMinutes,
    },

    questions: safeQuestions,

    savedAnswers,

    timer: {
      remainingTimeInSeconds,
      isExpired: false,
    },

    canResume: true,

    message: "Quiz attempt fetched successfully",
  };
}

export async function getInstructorQuizAttempts({
  instructorId,
  quizId,
  query = {},
}) {
  validateObjectId(instructorId, "instructor ID");

  validateObjectId(quizId, "quiz ID");

  const {
    search,
    status,
    result,
    submissionReason,
    from,
    to,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const { page, limit, skip } = getPagination(query);

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  })
    .select(
      `
      title
      course
      totalQuestions
      totalMarks
      passingPercentage
      maxAttempts
      status
      isPublished
      isActive
    `,
    )
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .lean();

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  const filter = {
    quiz: quizId,
  };

  const parsedStatus = parseEnumQuery(
    status,
    ["in_progress", "submitted", "evaluated", "expired", "cancelled"],
    "Attempt status",
  );

  if (parsedStatus !== undefined) {
    filter.status = parsedStatus;
  }

  const parsedResult = parseEnumQuery(
    result,
    ["passed", "failed"],
    "Attempt result",
  );

  if (parsedResult === "passed") {
    filter.status = "evaluated";
    filter.isPassed = true;
  }

  if (parsedResult === "failed") {
    filter.status = "evaluated";
    filter.isPassed = false;
  }

  const parsedSubmissionReason = parseEnumQuery(
    submissionReason,
    ["manual", "time_expired", "admin_submitted", "system"],
    "Submission reason",
  );

  if (parsedSubmissionReason !== undefined) {
    filter.submissionReason = parsedSubmissionReason;
  }

  /*
   * Student name/email search.
   */
  if (search?.trim()) {
    const searchText = search.trim();
    const escapedSearchText = escapeRegex(searchText);

    const matchingStudents = await User.find({
      role: "student",

      $or: [
        {
          fullName: {
            $regex: escapedSearchText,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapedSearchText,
            $options: "i",
          },
        },
      ],
    })
      .select("_id")
      .lean();

    const studentIds = matchingStudents.map((student) => student._id);

    filter.student = {
      $in: studentIds,
    };
  }

  const dateRange = parseDateRange({
    from,
    to,
    fieldName: "Attempt created date",
  });

  if (dateRange) {
    filter.createdAt = dateRange;
  }

  const {
    sortBy: selectedSortField,
    sortOrder,
    order: normalizedOrder,
  } = parseSortQuery({
    sortBy,
    order,

    allowedFields: [
      "attemptNumber",
      "startedAt",
      "submittedAt",
      "evaluatedAt",
      "percentage",
      "obtainedMarks",
      "timeSpentInSeconds",
      "createdAt",
      "updatedAt",
    ],

    defaultField: "createdAt",
    defaultOrder: "desc",
  });

  const [attempts, totalRecords] = await Promise.all([
    QuizAttempt.find(filter)
      .select(
        `
          student
          enrollment
          attemptNumber
          status
          startedAt
          expiresAt
          submittedAt
          evaluatedAt
          totalQuestions
          attemptedQuestions
          correctAnswers
          incorrectAnswers
          skippedQuestions
          totalMarks
          obtainedMarks
          negativeMarksDeducted
          percentage
          passingPercentage
          isPassed
          timeSpentInSeconds
          autoSubmitted
          submissionReason
          createdAt
          updatedAt
        `,
      )
      .populate({
        path: "student",
        select: `
            fullName
            email
            avatarUrl
            status
            isActive
          `,
      })
      .sort({
        [selectedSortField]: sortOrder,

        _id: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    QuizAttempt.countDocuments(filter),
  ]);

  const summaryResult = await QuizAttempt.aggregate([
    {
      $match: {
        quiz: new mongoose.Types.ObjectId(quizId),
      },
    },

    {
      $group: {
        _id: null,

        totalAttempts: {
          $sum: 1,
        },

        uniqueStudents: {
          $addToSet: "$student",
        },

        inProgressAttempts: {
          $sum: {
            $cond: [
              {
                $eq: ["$status", "in_progress"],
              },
              1,
              0,
            ],
          },
        },

        evaluatedAttempts: {
          $sum: {
            $cond: [
              {
                $eq: ["$status", "evaluated"],
              },
              1,
              0,
            ],
          },
        },

        passedAttempts: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $eq: ["$status", "evaluated"],
                  },
                  {
                    $eq: ["$isPassed", true],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },

        failedAttempts: {
          $sum: {
            $cond: [
              {
                $and: [
                  {
                    $eq: ["$status", "evaluated"],
                  },
                  {
                    $eq: ["$isPassed", false],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },

        averagePercentage: {
          $avg: {
            $cond: [
              {
                $eq: ["$status", "evaluated"],
              },
              "$percentage",
              null,
            ],
          },
        },

        averageMarks: {
          $avg: {
            $cond: [
              {
                $eq: ["$status", "evaluated"],
              },
              "$obtainedMarks",
              null,
            ],
          },
        },

        highestPercentage: {
          $max: {
            $cond: [
              {
                $eq: ["$status", "evaluated"],
              },
              "$percentage",
              null,
            ],
          },
        },

        lowestPercentage: {
          $min: {
            $cond: [
              {
                $eq: ["$status", "evaluated"],
              },
              "$percentage",
              null,
            ],
          },
        },
      },
    },

    {
      $addFields: {
        uniqueStudentCount: {
          $size: "$uniqueStudents",
        },
      },
    },
  ]);

  const summary = summaryResult[0] ?? {
    totalAttempts: 0,
    uniqueStudentCount: 0,
    inProgressAttempts: 0,
    evaluatedAttempts: 0,
    passedAttempts: 0,
    failedAttempts: 0,
    averagePercentage: 0,
    averageMarks: 0,
    highestPercentage: 0,
    lowestPercentage: 0,
  };

  const passRate =
    summary.evaluatedAttempts > 0
      ? Number(
          ((summary.passedAttempts / summary.evaluatedAttempts) * 100).toFixed(
            2,
          ),
        )
      : 0;

  return {
    quiz,

    summary: {
      totalAttempts: summary.totalAttempts ?? 0,

      uniqueStudents: summary.uniqueStudentCount ?? 0,

      inProgressAttempts: summary.inProgressAttempts ?? 0,

      evaluatedAttempts: summary.evaluatedAttempts ?? 0,

      passedAttempts: summary.passedAttempts ?? 0,

      failedAttempts: summary.failedAttempts ?? 0,

      passRate,

      averagePercentage: Number((summary.averagePercentage ?? 0).toFixed(2)),

      averageMarks: Number((summary.averageMarks ?? 0).toFixed(2)),

      highestPercentage: Number((summary.highestPercentage ?? 0).toFixed(2)),

      lowestPercentage: Number((summary.lowestPercentage ?? 0).toFixed(2)),
    },

    attempts,

    pagination: buildPaginationMeta({
      page,
      limit,
      totalRecords,
    }),

    filters: {
      search: search?.trim() || null,
      status: parsedStatus ?? null,
      result: parsedResult ?? null,

      submissionReason: parsedSubmissionReason ?? null,

      from: from || null,
      to: to || null,

      sortBy: selectedSortField,
      order: normalizedOrder,
    },
  };
}

export async function getInstructorQuizAttemptById({
  instructorId,
  quizId,
  attemptId,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(quizId, "quiz ID");
  validateObjectId(attemptId, "attempt ID");

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  })
    .select(
      `
      title
      course
      totalQuestions
      totalMarks
      passingPercentage
      showResultImmediately
      showCorrectAnswers
      status
    `,
    )
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .lean();

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    quiz: quizId,
  })
    .populate({
      path: "student",
      select: `
        fullName
        email
        avatarUrl
        status
        isActive
      `,
    })
    .populate({
      path: "enrollment",
      select: `
        status
        progressPercentage
        enrolledAt
        completedAt
      `,
    })
    .lean();

  if (!attempt) {
    throw new ApiError(404, "Quiz attempt not found");
  }

  const answers = await QuizAnswer.find({
    attempt: attemptId,
  })
    .populate({
      path: "question",
      select: `
        +acceptedAnswers
        +correctAnswerText
        questionText
        questionType
        options
        marks
        negativeMarks
        explanation
        order
        difficulty
        isRequired
      `,
    })
    .populate({
      path: "evaluatedBy",
      select: "fullName email avatarUrl role",
    })
    .lean();

  const answerMap = new Map(
    answers.map((answer) => [
      answer.question?._id?.toString() ?? answer.question?.toString(),
      answer,
    ]),
  );

  const orderedAnswers = (attempt.questionOrder ?? [])
    .map((questionId) => answerMap.get(questionId.toString()))
    .filter(Boolean)
    .map((answer) => {
      const question = answer.question;

      return {
        _id: answer._id,

        question: {
          _id: question._id,
          questionText: question.questionText,
          questionType: question.questionType,
          options: question.options,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          explanation: question.explanation,
          order: question.order,
          difficulty: question.difficulty,
          isRequired: question.isRequired,

          acceptedAnswers:
            question.questionType === "short_answer"
              ? question.acceptedAnswers
              : [],

          correctOptionIds:
            question.options
              ?.filter((option) => option.isCorrect)
              .map((option) => option._id) ?? [],
        },

        response: {
          selectedOptionIds: answer.selectedOptionIds,

          answerText: answer.answerText,

          isAnswered: answer.isAnswered,
        },

        evaluation: {
          isCorrect: answer.isCorrect,

          marksAwarded: answer.marksAwarded,

          negativeMarksDeducted: answer.negativeMarksDeducted,

          maxMarks: answer.maxMarks,

          evaluationType: answer.evaluationType,

          evaluatedAt: answer.evaluatedAt,

          evaluatedBy: answer.evaluatedBy,

          evaluatorComment: answer.evaluatorComment,
        },
      };
    });

  const pendingManualEvaluationCount = answers.filter(
    (answer) =>
      answer.questionType === "short_answer" &&
      answer.isAnswered &&
      answer.evaluatedAt === null,
  ).length;

  return {
    quiz,

    attempt,

    answers: orderedAnswers,

    evaluationSummary: {
      requiresManualEvaluation: pendingManualEvaluationCount > 0,

      pendingManualEvaluationCount,
    },
  };
}

export async function evaluateQuizAnswerManually({
  instructorId,
  quizId,
  attemptId,
  answerId,
  payload,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(quizId, "quiz ID");
  validateObjectId(attemptId, "attempt ID");
  validateObjectId(answerId, "answer ID");

  const { marksAwarded, isCorrect, evaluatorComment = "" } = payload || {};

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  }).lean();

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    quiz: quizId,
  });

  if (!attempt) {
    throw new ApiError(404, "Quiz attempt not found");
  }

  if (!["submitted", "evaluated"].includes(attempt.status)) {
    throw new ApiError(
      409,
      "Attempt must be submitted before manual evaluation",
    );
  }

  const answer = await QuizAnswer.findOne({
    _id: answerId,
    attempt: attemptId,
    quiz: quizId,
  }).populate({
    path: "question",
    select: `
      questionText
      questionType
      marks
      negativeMarks
    `,
  });

  if (!answer) {
    throw new ApiError(404, "Quiz answer not found");
  }

  const parsedMarks = parseNumberQuery(marksAwarded, {
    fieldName: "Marks awarded",
    min: 0,
    max: answer.maxMarks,
  });

  const parsedIsCorrect =
    typeof isCorrect === "boolean"
      ? isCorrect
      : parseBooleanQuery(isCorrect, "isCorrect");

  const normalizedComment = String(evaluatorComment || "").trim();

  if (normalizedComment.length > 1000) {
    throw new ApiError(400, "Evaluator comment cannot exceed 1000 characters");
  }

  answer.marksAwarded = parsedMarks;

  answer.isCorrect = parsedIsCorrect ?? parsedMarks === answer.maxMarks;

  answer.negativeMarksDeducted = 0;

  answer.evaluationType = "manual";
  answer.evaluatedAt = new Date();
  answer.evaluatedBy = instructorId;
  answer.evaluatorComment = normalizedComment;

  await answer.save();

  await recalculateQuizAttemptScore({
    attemptId: attempt._id,
  });

  const updatedAttempt = await QuizAttempt.findById(attempt._id);

  return {
    answer,
    attempt: updatedAttempt,
    message: "Quiz answer evaluated successfully",
  };
}

async function recalculateQuizAttemptScore({ attemptId }) {
  const attempt = await QuizAttempt.findById(attemptId);

  if (!attempt) {
    throw new ApiError(404, "Quiz attempt not found");
  }

  const answers = await QuizAnswer.find({
    attempt: attemptId,
  }).lean();

  const attemptedQuestions = answers.filter(
    (answer) => answer.isAnswered,
  ).length;

  const correctAnswers = answers.filter(
    (answer) => answer.isAnswered && answer.isCorrect === true,
  ).length;

  const incorrectAnswers = answers.filter(
    (answer) => answer.isAnswered && answer.isCorrect === false,
  ).length;

  const skippedQuestions = Math.max(
    attempt.totalQuestions - attemptedQuestions,
    0,
  );

  const grossMarks = answers.reduce(
    (total, answer) => total + Number(answer.marksAwarded || 0),
    0,
  );

  const negativeMarksDeducted = answers.reduce(
    (total, answer) => total + Number(answer.negativeMarksDeducted || 0),
    0,
  );

  const obtainedMarks = Math.max(
    Number((grossMarks - negativeMarksDeducted).toFixed(2)),
    0,
  );

  const percentage =
    attempt.totalMarks > 0
      ? Number(((obtainedMarks / attempt.totalMarks) * 100).toFixed(2))
      : 0;

  const pendingManualEvaluation = answers.some(
    (answer) =>
      answer.questionType === "short_answer" &&
      answer.isAnswered &&
      answer.evaluatedAt === null,
  );

  attempt.attemptedQuestions = attemptedQuestions;

  attempt.correctAnswers = correctAnswers;

  attempt.incorrectAnswers = incorrectAnswers;

  attempt.skippedQuestions = skippedQuestions;

  attempt.obtainedMarks = obtainedMarks;

  attempt.negativeMarksDeducted = Number(negativeMarksDeducted.toFixed(2));

  attempt.percentage = Math.min(percentage, 100);

  attempt.isPassed = attempt.percentage >= attempt.passingPercentage;

  if (!pendingManualEvaluation) {
    attempt.status = "evaluated";
    attempt.evaluatedAt = attempt.evaluatedAt ?? new Date();
  } else {
    attempt.status = "submitted";
  }

  await attempt.save();

  return attempt;
}

export async function instructorSubmitQuizAttempt({
  instructorId,
  quizId,
  attemptId,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(quizId, "quiz ID");
  validateObjectId(attemptId, "attempt ID");

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  }).lean();

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  const attempt = await QuizAttempt.findOne({
    _id: attemptId,
    quiz: quizId,
  });

  if (!attempt) {
    throw new ApiError(404, "Quiz attempt not found");
  }

  if (["submitted", "evaluated"].includes(attempt.status)) {
    return {
      attempt,
      changed: false,
      message: "Quiz attempt is already submitted",
    };
  }

  if (attempt.status !== "in_progress") {
    throw new ApiError(409, `Quiz attempt is ${attempt.status}`);
  }

  const result = await submitQuizAttempt({
    studentId: attempt.student,
    quizId,
    attemptId,
    submissionReason: "admin_submitted",
  });

  return {
    attempt: result.attempt,
    changed: true,
    message: "Quiz attempt submitted successfully by instructor",
  };
}

export async function updateQuizResultSettings({
  instructorId,
  quizId,
  payload,
}) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(quizId, "quiz ID");

  const { showResultImmediately, showCorrectAnswers } = payload || {};

  if (showResultImmediately === undefined && showCorrectAnswers === undefined) {
    throw new ApiError(400, "At least one result setting is required");
  }

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  });

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  if (showResultImmediately !== undefined) {
    quiz.showResultImmediately =
      typeof showResultImmediately === "boolean"
        ? showResultImmediately
        : parseBooleanQuery(showResultImmediately, "showResultImmediately");
  }

  if (showCorrectAnswers !== undefined) {
    quiz.showCorrectAnswers =
      typeof showCorrectAnswers === "boolean"
        ? showCorrectAnswers
        : parseBooleanQuery(showCorrectAnswers, "showCorrectAnswers");
  }

  await quiz.save();

  return quiz;
}

export async function deleteQuiz({ instructorId, quizId }) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(quizId, "quiz ID");

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  });

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  if (quiz.status === "archived" && quiz.isActive === false) {
    return {
      quiz,
      changed: false,
      message: "Quiz is already archived",
    };
  }

  quiz.status = "archived";
  quiz.isPublished = false;
  quiz.isActive = false;
  quiz.publishedAt = null;

  await quiz.save();

  return {
    quiz,
    changed: true,
    message: "Quiz archived successfully",
  };
}

export async function restoreQuiz({ instructorId, quizId }) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(quizId, "quiz ID");

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  });

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  if (quiz.status === "draft" && quiz.isActive === true) {
    return {
      quiz,
      changed: false,
      message: "Quiz is already active",
    };
  }

  quiz.status = "draft";
  quiz.isPublished = false;
  quiz.isActive = true;
  quiz.publishedAt = null;

  await quiz.save();

  return {
    quiz,
    changed: true,
    message: "Quiz restored successfully",
  };
}

export async function getQuizAnalytics({ instructorId, quizId }) {
  validateObjectId(instructorId, "instructor ID");
  validateObjectId(quizId, "quiz ID");

  const quiz = await Quiz.findOne({
    _id: quizId,
    instructor: instructorId,
  })
    .select(
      `
      title
      course
      totalQuestions
      totalMarks
      passingPercentage
      maxAttempts
      status
      isPublished
    `,
    )
    .populate({
      path: "course",
      select: "title slug thumbnailUrl",
    })
    .lean();

  if (!quiz) {
    throw new ApiError(
      404,
      "Quiz not found or you are not the quiz instructor",
    );
  }

  const [attemptStatsResult, questionStats, topAttempts] = await Promise.all([
    QuizAttempt.aggregate([
      {
        $match: {
          quiz: new mongoose.Types.ObjectId(quizId),
        },
      },
      {
        $group: {
          _id: null,

          totalAttempts: {
            $sum: 1,
          },

          uniqueStudents: {
            $addToSet: "$student",
          },

          evaluatedAttempts: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "evaluated"],
                },
                1,
                0,
              ],
            },
          },

          passedAttempts: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$status", "evaluated"],
                    },
                    {
                      $eq: ["$isPassed", true],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },

          averagePercentage: {
            $avg: {
              $cond: [
                {
                  $eq: ["$status", "evaluated"],
                },
                "$percentage",
                null,
              ],
            },
          },

          averageTimeSpent: {
            $avg: "$timeSpentInSeconds",
          },

          highestPercentage: {
            $max: "$percentage",
          },

          lowestPercentage: {
            $min: "$percentage",
          },
        },
      },
      {
        $addFields: {
          uniqueStudentCount: {
            $size: "$uniqueStudents",
          },
        },
      },
    ]),

    QuizAnswer.aggregate([
      {
        $match: {
          quiz: new mongoose.Types.ObjectId(quizId),

          evaluatedAt: {
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: "$question",

          totalResponses: {
            $sum: 1,
          },

          correctResponses: {
            $sum: {
              $cond: [
                {
                  $eq: ["$isCorrect", true],
                },
                1,
                0,
              ],
            },
          },

          incorrectResponses: {
            $sum: {
              $cond: [
                {
                  $eq: ["$isCorrect", false],
                },
                1,
                0,
              ],
            },
          },

          averageMarks: {
            $avg: "$marksAwarded",
          },
        },
      },
      {
        $lookup: {
          from: "quizquestions",
          localField: "_id",
          foreignField: "_id",
          as: "question",
        },
      },
      {
        $unwind: "$question",
      },
      {
        $project: {
          questionId: "$_id",
          _id: 0,

          questionText: "$question.questionText",

          questionType: "$question.questionType",

          marks: "$question.marks",

          order: "$question.order",

          totalResponses: 1,
          correctResponses: 1,
          incorrectResponses: 1,
          averageMarks: 1,

          accuracyRate: {
            $cond: [
              {
                $gt: ["$totalResponses", 0],
              },
              {
                $multiply: [
                  {
                    $divide: ["$correctResponses", "$totalResponses"],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: {
          order: 1,
        },
      },
    ]),

    QuizAttempt.find({
      quiz: quizId,
      status: "evaluated",
    })
      .select(
        `
        student
        attemptNumber
        obtainedMarks
        totalMarks
        percentage
        isPassed
        timeSpentInSeconds
        submittedAt
      `,
      )
      .populate({
        path: "student",
        select: "fullName email avatarUrl",
      })
      .sort({
        percentage: -1,
        obtainedMarks: -1,
      })
      .limit(10)
      .lean(),
  ]);

  const stats = attemptStatsResult[0] ?? {
    totalAttempts: 0,
    uniqueStudentCount: 0,
    evaluatedAttempts: 0,
    passedAttempts: 0,
    averagePercentage: 0,
    averageTimeSpent: 0,
    highestPercentage: 0,
    lowestPercentage: 0,
  };

  const failedAttempts = Math.max(
    (stats.evaluatedAttempts ?? 0) - (stats.passedAttempts ?? 0),
    0,
  );

  const passRate =
    stats.evaluatedAttempts > 0
      ? Number(
          ((stats.passedAttempts / stats.evaluatedAttempts) * 100).toFixed(2),
        )
      : 0;

  return {
    quiz,

    summary: {
      totalAttempts: stats.totalAttempts ?? 0,

      uniqueStudents: stats.uniqueStudentCount ?? 0,

      evaluatedAttempts: stats.evaluatedAttempts ?? 0,

      passedAttempts: stats.passedAttempts ?? 0,

      failedAttempts,

      passRate,

      averagePercentage: Number((stats.averagePercentage ?? 0).toFixed(2)),

      averageTimeSpentInSeconds: Number(
        (stats.averageTimeSpent ?? 0).toFixed(2),
      ),

      highestPercentage: Number((stats.highestPercentage ?? 0).toFixed(2)),

      lowestPercentage: Number((stats.lowestPercentage ?? 0).toFixed(2)),
    },

    questionAnalytics: questionStats.map((question) => ({
      ...question,

      averageMarks: Number((question.averageMarks ?? 0).toFixed(2)),

      accuracyRate: Number((question.accuracyRate ?? 0).toFixed(2)),
    })),

    topAttempts,
  };
}
