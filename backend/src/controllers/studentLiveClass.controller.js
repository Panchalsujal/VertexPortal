import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getStudentLiveClasses,
  getStudentLiveClassById,
  joinStudentLiveClass,
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
    liveClassId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    liveClass: result.liveClass,
    meeting: result.meeting,
    joinWindow: result.joinWindow,
  });
});
