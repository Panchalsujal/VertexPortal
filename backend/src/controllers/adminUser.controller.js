import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getAdminUsers,
  getAdminUserById,
  updateAdminUserStatus,
  activateUser,
  deactivateUser,
  suspendUser,
  updateAdminUserRole,
  getAdminUserAnalytics,
} from "../service/adminUser.service.js";

/*
 * Get users
 */
export const getAdminUsersController = asyncHandler(async (req, res) => {
  const result = await getAdminUsers({
    adminId: req.user.id,

    query: req.query,
  });

  return res.status(200).json({
    success: true,

    message: "Users fetched successfully",

    ...result,
  });
});

/*
 * User details
 */
export const getAdminUserByIdController = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await getAdminUserById({
    adminId: req.user.id,

    userId,
  });

  return res.status(200).json({
    success: true,

    message: "User fetched successfully",

    ...result,
  });
});

/*
 * Generic status update
 */
export const updateAdminUserStatusController = asyncHandler(
  async (req, res) => {
    const { userId } = req.params;

    const { status } = req.body || {};

    const result = await updateAdminUserStatus({
      adminId: req.user.id,

      userId,

      status,
    });

    return res.status(200).json({
      success: true,

      message: result.message,

      changed: result.changed,

      user: result.user,
    });
  },
);

/*
 * Activate
 */
export const activateUserController = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await activateUser({
    adminId: req.user.id,

    userId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    changed: result.changed,

    user: result.user,
  });
});

/*
 * Deactivate
 */
export const deactivateUserController = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await deactivateUser({
    adminId: req.user.id,

    userId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    changed: result.changed,

    user: result.user,
  });
});

/*
 * Suspend
 */
export const suspendUserController = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const result = await suspendUser({
    adminId: req.user.id,

    userId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    changed: result.changed,

    user: result.user,
  });
});

/*
 * Role update
 */
export const updateAdminUserRoleController = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const { role } = req.body || {};

  const result = await updateAdminUserRole({
    adminId: req.user.id,

    userId,

    role,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    changed: result.changed,

    user: result.user,
  });
});

/*
 * Analytics
 */
export const getAdminUserAnalyticsController = asyncHandler(
  async (req, res) => {
    const analytics = await getAdminUserAnalytics();

    return res.status(200).json({
      success: true,

      message: "User analytics fetched successfully",

      analytics,
    });
  },
);
