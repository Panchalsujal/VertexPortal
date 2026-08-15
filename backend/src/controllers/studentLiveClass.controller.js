import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getStudentLiveClasses,
  getStudentLiveClassById,
  joinStudentLiveClass,
  leaveLiveClassAttendance,
  getInstructorLiveClassAttendance,
  getInstructorLiveClassAttendanceAnalytics,
  getStudentLiveClassAttendanceHistory,
  getStudentLiveClassResources,
} from "../service/liveClass.service.js";

export const getStudentLiveClassesController = asyncHandler(
  async (req, res) => {
    const result = await getStudentLiveClasses({
      studentId: req.user.id,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Live classes fetched successfully",
      ...result,
    });
  },
);

export const getStudentLiveClassByIdController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;

    const result = await getStudentLiveClassById({
      studentId: req.user.id,
      userRole: req.user.role,
      liveClassId,
    });

    return res.status(200).json({
      success: true,
      message: "Live class fetched successfully",
      ...result,
    });
  },
);

export const joinStudentLiveClassController = asyncHandler(async (req, res) => {
  const { liveClassId } = req.params;

  const result = await joinStudentLiveClass({
    studentId: req.user.id,
    userRole: req.user.role,
    liveClassId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    liveClass: result.liveClass,
    meeting: result.meeting,
    stream: result.stream,
    joinWindow: result.joinWindow,
    attendance: result.attendance,
  });
});

export const leaveStudentLiveClassController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;

    const result = await leaveLiveClassAttendance({
      studentId: req.user.id,
      userRole: req.user.role,
      liveClassId,
    });

    return res.status(200).json({
      success: true,
      message: result.message,

      attendance: result.attendance
        ? {
            id: result.attendance._id,
            totalDurationInSeconds: result.attendance.totalDurationInSeconds,
            attendancePercentage: result.attendance.attendancePercentage,
            joinCount: result.attendance.joinCount,
            status: result.attendance.status,
          }
        : null,
    });
  },
);

export const getInstructorLiveClassAttendanceController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;

    const result = await getInstructorLiveClassAttendance({
      instructorId: req.user.id,
      liveClassId,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Live class attendance fetched successfully",
      ...result,
    });
  },
);

export const getInstructorLiveClassAttendanceAnalyticsController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;

    const analytics = await getInstructorLiveClassAttendanceAnalytics({
      instructorId: req.user.id,
      liveClassId,
    });

    return res.status(200).json({
      success: true,
      message: "Live class attendance analytics fetched successfully",
      analytics,
    });
  },
);

export const getStudentLiveClassAttendanceHistoryController = asyncHandler(
  async (req, res) => {
    const result = await getStudentLiveClassAttendanceHistory({
      studentId: req.user.id,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Live class attendance history fetched successfully",
      ...result,
    });
  },
);

export const getStudentLiveClassResourcesController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;

    const result = await getStudentLiveClassResources({
      studentId: req.user.id,

      liveClassId,
    });

    return res.status(200).json({
      success: true,

      message: "Live class resources fetched successfully",

      ...result,
    });
  },
);
