import { asyncHandler } from "../utils/asyncHandler.js";

import { getAdminDashboard } from "../service/adminDashboard.service.js";

export const getAdminDashboardController = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;

  const dashboard = await getAdminDashboard({
    period,
  });

  return res.status(200).json({
    success: true,

    message: "Admin dashboard fetched successfully",

    dashboard,
  });
});
