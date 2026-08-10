import { asyncHandler } from "../utils/asyncHandler.js";

import {
  createDiscussionReport,
  getMyDiscussionReports,
  getAdminDiscussionReports,
  getAdminDiscussionReportById,
  startDiscussionReportReview,
  resolveDiscussionReport,
} from "../service/discussionReport.service.js";

/*
 * ---------------------------------
 * User create report
 * ---------------------------------
 */
export const createDiscussionReportController = asyncHandler(
  async (req, res) => {
    const result = await createDiscussionReport({
      userId: req.user.id,

      userRole: req.user.role,

      payload: req.body,
    });

    return res.status(201).json({
      success: true,

      message: result.message,

      report: result.report,
    });
  },
);

/*
 * ---------------------------------
 * User own reports
 * ---------------------------------
 */
export const getMyDiscussionReportsController = asyncHandler(
  async (req, res) => {
    const result = await getMyDiscussionReports({
      userId: req.user.id,

      query: req.query,
    });

    return res.status(200).json({
      success: true,

      message: "Your discussion reports fetched successfully",

      ...result,
    });
  },
);

/*
 * ---------------------------------
 * Admin reports listing
 * ---------------------------------
 */
export const getAdminDiscussionReportsController = asyncHandler(
  async (req, res) => {
    const result = await getAdminDiscussionReports({
      query: req.query,
    });

    return res.status(200).json({
      success: true,

      message: "Discussion reports fetched successfully",

      ...result,
    });
  },
);

/*
 * ---------------------------------
 * Admin report details
 * ---------------------------------
 */
export const getAdminDiscussionReportByIdController = asyncHandler(
  async (req, res) => {
    const { reportId } = req.params;

    const result = await getAdminDiscussionReportById({
      reportId,
    });

    return res.status(200).json({
      success: true,

      message: "Discussion report fetched successfully",

      ...result,
    });
  },
);

/*
 * ---------------------------------
 * Admin start review
 * ---------------------------------
 */
export const startDiscussionReportReviewController = asyncHandler(
  async (req, res) => {
    const { reportId } = req.params;

    const result = await startDiscussionReportReview({
      adminId: req.user.id,

      reportId,
    });

    return res.status(200).json({
      success: true,

      message: result.message,

      report: result.report,
    });
  },
);

/*
 * ---------------------------------
 * Admin resolve/reject
 * ---------------------------------
 */
export const resolveDiscussionReportController = asyncHandler(
  async (req, res) => {
    const { reportId } = req.params;

    const result = await resolveDiscussionReport({
      adminId: req.user.id,

      reportId,

      payload: req.body,
    });

    return res.status(200).json({
      success: true,

      message: result.message,

      report: result.report,
    });
  },
);
