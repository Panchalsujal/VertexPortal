import { asyncHandler } from "../utils/asyncHandler.js";

import {
  getAdminOrders,
  getAdminOrderById,
  cancelAdminOrder,
  markAdminOrderFailed,
  markAdminOrderRefunded,
  getAdminOrderAnalytics,
} from "../service/adminOrder.service.js";

/*
 * All orders
 */
export const getAdminOrdersController = asyncHandler(async (req, res) => {
  const result = await getAdminOrders({
    query: req.query,
  });

  return res.status(200).json({
    success: true,

    message: "Orders fetched successfully",

    ...result,
  });
});

/*
 * Analytics
 */
export const getAdminOrderAnalyticsController = asyncHandler(
  async (req, res) => {
    const { period = "30d" } = req.query;

    const analytics = await getAdminOrderAnalytics({
      period,
    });

    return res.status(200).json({
      success: true,

      message: "Order analytics fetched successfully",

      analytics,
    });
  },
);

/*
 * Single order
 */
export const getAdminOrderByIdController = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await getAdminOrderById({
    orderId,
  });

  return res.status(200).json({
    success: true,

    message: "Order fetched successfully",

    order,
  });
});

/*
 * Cancel pending/unpaid order
 */
export const cancelAdminOrderController = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const result = await cancelAdminOrder({
    orderId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    changed: result.changed,

    order: result.order,
  });
});

/*
 * Mark failed
 */
export const markAdminOrderFailedController = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const result = await markAdminOrderFailed({
    orderId,
  });

  return res.status(200).json({
    success: true,

    message: result.message,

    changed: result.changed,

    order: result.order,
  });
});

/*
 * Mark refunded after external
 * Razorpay refund has succeeded.
 */
export const markAdminOrderRefundedController = asyncHandler(
  async (req, res) => {
    const { orderId } = req.params;

    const result = await markAdminOrderRefunded({
      orderId,
    });

    return res.status(200).json({
      success: true,

      message: result.message,

      changed: result.changed,

      order: result.order,
    });
  },
);
