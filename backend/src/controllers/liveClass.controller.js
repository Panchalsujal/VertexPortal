import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createLiveClass,
  getInstructorLiveClasses,
  getInstructorLiveClassById,
  updateLiveClass,
  updateLiveClassStatus,
  cancelLiveClass,
  getInstructorLiveClassAttendance,
  getInstructorLiveClassAttendanceAnalytics,
  updateLiveClassResources,
  getLiveClassAnalytics,
} from "../service/liveClass.service.js";

export const createLiveClassController = asyncHandler(async (req, res) => {
  const liveClass = await createLiveClass({
    instructorId: req.user.id,
    payload: req.body,
  });

  return res.status(201).json({
    success: true,
    message: "Live class created successfully",
    liveClass,
  });
});

export const getInstructorLiveClassesController = asyncHandler(
  async (req, res) => {
    const result = await getInstructorLiveClasses({
      instructorId: req.user.id,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Live classes fetched successfully",
      ...result,
    });
  },
);

export const getInstructorLiveClassByIdController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;

    const liveClass = await getInstructorLiveClassById({
      instructorId: req.user.id,
      liveClassId,
    });

    return res.status(200).json({
      success: true,
      message: "Live class fetched successfully",
      liveClass,
    });
  },
);

export const updateLiveClassController = asyncHandler(async (req, res) => {
  const { liveClassId } = req.params;

  const result = await updateLiveClass({
    instructorId: req.user.id,
    userRole: req.user.role,
    liveClassId,
    payload: req.body,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    scheduleChanged: result.scheduleChanged,
    liveClass: result.liveClass,
  });
});

export const updateLiveClassStatusController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;
    const { status } = req.body || {};

    const result = await updateLiveClassStatus({
      instructorId: req.user.id,
      liveClassId,
      status,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      liveClass: result.liveClass,
      attendanceFinalization: result.attendanceFinalization ?? null,
      notificationResult: result.notificationResult ?? null,
    });
  },
);

export const cancelLiveClassController = asyncHandler(async (req, res) => {
  const { liveClassId } = req.params;
  const { reason } = req.body || {};

  const result = await cancelLiveClass({
    instructorId: req.user.id,
    liveClassId,
    reason,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    liveClass: result.liveClass,
    notificationResult: result.notificationResult ?? null,
  });
});

/*
 * Attendance list
 */
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

/*
 * Attendance analytics
 */
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

export const updateLiveClassResourcesController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;

    const result = await updateLiveClassResources({
      instructorId: req.user.id,

      userRole: req.user.role,

      liveClassId,

      payload: req.body,
    });

    return res.status(200).json({
      success: true,

      message: result.message,

      liveClass: result.liveClass,

      notificationResult: result.notificationResult,
    });
  },
);

export const getLiveClassAnalyticsController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;

    const analytics = await getLiveClassAnalytics({
      instructorId: req.user.id,

      userRole: req.user.role,

      liveClassId,
    });

    return res.status(200).json({
      success: true,

      message: "Live class analytics fetched successfully",

      analytics,
    });
  },
);
