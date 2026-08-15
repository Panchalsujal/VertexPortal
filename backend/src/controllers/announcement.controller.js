import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createAnnouncement,
  getInstructorAnnouncements,
  getInstructorAnnouncementById,
  updateAnnouncement,
  updateAnnouncementStatus,
  deleteAnnouncement,
} from "../service/announcement.service.js";

export const createAnnouncementController = asyncHandler(async (req, res) => {
  const announcement = await createAnnouncement({
    instructorId: req.user.id,
    userRole: req.user.role,
    payload: req.body,
  });

  return res.status(201).json({
    success: true,
    message: "Announcement created successfully",
    announcement,
  });
});

export const getInstructorAnnouncementsController = asyncHandler(
  async (req, res) => {
    const result = await getInstructorAnnouncements({
      instructorId: req.user.id,
      userRole: req.user.role,
      query: req.query,
    });

    return res.status(200).json({
      success: true,
      message: "Announcements fetched successfully",
      ...result,
    });
  },
);

export const getInstructorAnnouncementByIdController = asyncHandler(
  async (req, res) => {
    const { announcementId } = req.params;

    const announcement = await getInstructorAnnouncementById({
      instructorId: req.user.id,
      userRole: req.user.role,
      announcementId,
    });

    return res.status(200).json({
      success: true,
      message: "Announcement fetched successfully",
      announcement,
    });
  },
);

export const updateAnnouncementController = asyncHandler(async (req, res) => {
  const { announcementId } = req.params;

  const result = await updateAnnouncement({
    instructorId: req.user.id,
    userRole: req.user.role,
    announcementId,
    payload: req.body,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    announcement: result.announcement,
  });
});

export const updateAnnouncementStatusController = asyncHandler(
  async (req, res) => {
    const { announcementId } = req.params;

    const { status } = req.body || {};

    const result = await updateAnnouncementStatus({
      instructorId: req.user.id,
      userRole: req.user.role,
      announcementId,
      status,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      announcement: result.announcement,
    });
  },
);

export const deleteAnnouncementController = asyncHandler(async (req, res) => {
  const { announcementId } = req.params;

  const result = await deleteAnnouncement({
    instructorId: req.user.id,
    userRole: req.user.role,
    announcementId,
  });

  return res.status(200).json({
    success: true,
    message: result.message,
    announcementId: result.announcementId,
  });
});

