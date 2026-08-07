import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getMyCourses,
  getContinueLearning,
  getResumeLearning,
  getCoursePlayer,
} from "../service/student.service.js";

import {
  getStudentAssignments,
  getStudentAssignmentById,
} from "../service/assignment.service.js";

import {
  getStudentQuizzes,
  getStudentQuizById,
} from "../service/quiz.service.js";

export const getMyCoursesController = asyncHandler(async (req, res) => {
  const courses = await getMyCourses(req.user.id);

  return res.status(200).json({
    success: true,
    message: "My courses fetched successfully",
    count: courses.length,
    courses,
  });
});

export const getContinueLearningController = asyncHandler(async (req, res) => {
  const courses = await getContinueLearning(req.user.id);

  return res.status(200).json({
    success: true,
    message: "Continue learning courses fetched successfully",
    count: courses.length,
    courses,
  });
});

export const getResumeLearningController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const resumeData = await getResumeLearning({
    studentId: req.user.id,
    courseId,
  });

  return res.status(200).json({
    success: true,
    message: "Resume learning data fetched successfully",
    resume: resumeData,
  });
});

export const getCoursePlayerController = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const playerData = await getCoursePlayer({
    studentId: req.user.id,
    courseId,
  });

  return res.status(200).json({
    success: true,
    message: "Course player data fetched successfully",
    data: playerData,
  });
});


