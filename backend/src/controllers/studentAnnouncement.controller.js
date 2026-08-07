import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getStudentAnnouncements,
  getStudentAnnouncementById,
  markAnnouncementAsRead,
  markAllAnnouncementsAsRead,
} from "../service/announcement.service.js";

export const getStudentAnnouncementsController =
  asyncHandler(async (req, res) => {
    const result =
      await getStudentAnnouncements({
        studentId: req.user.id,
        query: req.query,
      });

    return res.status(200).json({
      success: true,
      message:
        "Announcements fetched successfully",
      ...result,
    });
  });

export const getStudentAnnouncementByIdController =
  asyncHandler(async (req, res) => {
    const { announcementId } =
      req.params;

    const result =
      await getStudentAnnouncementById({
        studentId: req.user.id,
        announcementId,
      });

    return res.status(200).json({
      success: true,
      message:
        "Announcement fetched successfully",
      ...result,
    });
  });

export const markAnnouncementAsReadController =
  asyncHandler(async (req, res) => {
    const { announcementId } =
      req.params;

    const result =
      await markAnnouncementAsRead({
        studentId: req.user.id,
        announcementId,
      });

    return res.status(200).json({
      success: true,
      message: result.message,
      readAt:
        result.readRecord.readAt,
    });
  });

export const markAllAnnouncementsAsReadController =
  asyncHandler(async (req, res) => {
    const { courseId } =
      req.body || {};

    const result =
      await markAllAnnouncementsAsRead({
        studentId: req.user.id,
        courseId,
      });

    return res.status(200).json({
      success: true,
      message: result.message,
      markedCount:
        result.markedCount,
    });
  });