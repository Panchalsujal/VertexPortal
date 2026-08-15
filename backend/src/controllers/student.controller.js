import { asyncHandler } from "../utils/asyncHandler.js";
import { randomBytes } from "node:crypto";
import User from "../models/user.model.js";
import { recordStudentActivity } from "../service/gamification.service.js";

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

export const getGamificationController = asyncHandler(async (req, res) => {
  const gamificationData = await recordStudentActivity(req.user.id);

  return res.status(200).json({
    success: true,
    message: "Gamification data fetched successfully",
    data: gamificationData || {
      streak: req.user.learningStreak || { currentStreak: 1, longestStreak: 1 },
      badges: req.user.badges || [],
    },
  });
});

export const getReferralController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!user.referralCode) {
    user.referralCode = "VP-" + randomBytes(3).toString("hex").toUpperCase();
    await user.save();
  }

  return res.status(200).json({
    success: true,
    message: "Referral data fetched successfully",
    data: {
      referralCode: user.referralCode,
      referralStats: user.referralStats || { totalReferrals: 0, rewardPoints: 0 },
    },
  });
});
