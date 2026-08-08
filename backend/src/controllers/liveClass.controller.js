import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createLiveClass,
  getInstructorLiveClasses,
  getInstructorLiveClassById,
  updateLiveClass,
  updateLiveClassStatus,
  cancelLiveClass,
} from "../service/liveClass.service.js";

export const createLiveClassController = asyncHandler(async (req, res) => {
  const liveClass = await createLiveClass({
    instructorId: req.user.id,
    userRole: req.user.role,
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
      userRole: req.user.role,
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
      userRole: req.user.role,
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
    liveClass: result.liveClass,
  });
});

export const updateLiveClassStatusController = asyncHandler(
  async (req, res) => {
    const { liveClassId } = req.params;

    const { status } = req.body || {};

    const result = await updateLiveClassStatus({
      instructorId: req.user.id,
      userRole: req.user.role,
      liveClassId,
      status,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      liveClass: result.liveClass,
    });
  },
);

export const cancelLiveClassController = asyncHandler(async (req, res) => {
  const { liveClassId } = req.params;

  const { reason } = req.body || {};

  const result = await cancelLiveClass({
    instructorId: req.user.id,
    userRole: req.user.role,
    liveClassId,
    reason,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    liveClass: result.liveClass,
  });
});
