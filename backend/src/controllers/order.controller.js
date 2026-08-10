import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import mongoose from "mongoose";

import Order from "../models/order.model.js";
import razorpay from "../service/razorpay.service.js";

import {
  completePaidOrder,
} from "../service/orderPayment.service.js";

import { validateCheckout } from "../service/checkout.service.js";
import { config } from "../config/config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
/*
 * =========================================================
 * SAFE SIGNATURE COMPARISON
 * =========================================================
 */
function signaturesMatch(expected, received) {
  const expectedBuffer = Buffer.from(String(expected || ""), "utf8");

  const receivedBuffer = Buffer.from(String(received || ""), "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

/*
 * =========================================================
 * CREATE RAZORPAY PAYMENT ORDER
 * =========================================================
 *
 * POST /api/orders/create
 */
export const createPaymentOrderController = asyncHandler(async (req, res) => {
  const { couponCode = null } = req.body || {};

  /*
   * -----------------------------------------
   * 1. Validate checkout
   * -----------------------------------------
   */
  const checkout = await validateCheckout({
    studentId: req.user.id,

    couponCode,
  });

  const { courses, pricing, coupon, invalidCartItemIds, priceChanges } =
    checkout;

  /*
   * -----------------------------------------
   * 2. Free order currently unsupported
   * -----------------------------------------
   */
  if (pricing.totalAmount <= 0) {
    throw new ApiError(400, "This order does not require payment");
  }

  /*
   * -----------------------------------------
   * 3. Create local database order
   * -----------------------------------------
   */
  const order = await Order.create({
    student: req.user.id,

    courses,

    subtotal: pricing.subtotal,

    discountAmount: pricing.discountAmount,

    totalAmount: pricing.totalAmount,

    coupon: coupon?.id ?? null,

    orderStatus: "pending",

    paymentStatus: "pending",

    paymentMethod: "razorpay",
  });

  let razorpayOrder;

  try {
    /*
     * ---------------------------------------
     * 4. Create Razorpay order
     * ---------------------------------------
     */
    razorpayOrder = await razorpay.orders.create({
      amount: Math.round(pricing.totalAmount * 100),

      currency: "INR",

      receipt: order._id.toString(),

      notes: {
        studentId: req.user.id.toString(),

        databaseOrderId: order._id.toString(),
      },
    });
  } catch (error) {
    /*
     * Razorpay order create fail ho gaya,
     * to local order ko failed mark karo.
     */
    order.orderStatus = "failed";

    order.paymentStatus = "failed";

    await order.save();

    console.error("Razorpay order creation failed:", error);

    throw new ApiError(502, "Failed to create payment order");
  }

  /*
   * -----------------------------------------
   * 5. Save Razorpay order id
   * -----------------------------------------
   */
  order.razorpayOrderId = razorpayOrder.id;

  await order.save();

  return res.status(201).json({
    success: true,

    message: "Payment order created successfully",

    order: {
      id: order._id,

      subtotal: order.subtotal,

      discountAmount: order.discountAmount,

      totalAmount: order.totalAmount,

      orderStatus: order.orderStatus,

      paymentStatus: order.paymentStatus,
    },

    razorpay: {
      keyId: config.RAZORPAY_KEY_ID,

      orderId: razorpayOrder.id,

      amount: razorpayOrder.amount,

      currency: razorpayOrder.currency,
    },

    invalidCartItemIds,

    priceChanges,
  });
});

/*
 * =========================================================
 * VERIFY CHECKOUT PAYMENT
 * =========================================================
 *
 * POST /api/orders/verify
 *
 * Body:
 * {
 *   databaseOrderId,
 *   razorpay_order_id,
 *   razorpay_payment_id,
 *   razorpay_signature
 * }
 */
export const verifyPaymentController = asyncHandler(async (req, res) => {
  const {
    databaseOrderId,

    razorpay_order_id,

    razorpay_payment_id,

    razorpay_signature,
  } = req.body || {};

  /*
   * -----------------------------------------
   * 1. Required fields
   * -----------------------------------------
   */
  if (
    !databaseOrderId ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    throw new ApiError(400, "Payment verification details are required");
  }

  /*
   * -----------------------------------------
   * 2. Validate local order id
   * -----------------------------------------
   */
  if (!mongoose.Types.ObjectId.isValid(databaseOrderId)) {
    throw new ApiError(400, "Invalid database order ID");
  }

  /*
   * -----------------------------------------
   * 3. Find student's local order
   * -----------------------------------------
   */
  const order = await Order.findOne({
    _id: databaseOrderId,

    student: req.user.id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  /*
   * -----------------------------------------
   * 4. Already paid = idempotent success
   * -----------------------------------------
   */
  if (order.paymentStatus === "paid") {
    return res.status(200).json({
      success: true,

      message: "Payment is already verified",

      order,
    });
  }

  /*
   * -----------------------------------------
   * 5. Razorpay order ID must match
   * -----------------------------------------
   */
  if (order.razorpayOrderId !== razorpay_order_id) {
    throw new ApiError(400, "Razorpay order ID does not match");
  }

  /*
   * Razorpay requires signature generation
   * using the order id stored on the server
   * + payment id.
   */
  const expectedSignature = createHmac("sha256", config.RAZORPAY_SECRET_ID)
    .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
    .digest("hex");

  if (!signaturesMatch(expectedSignature, razorpay_signature)) {
    throw new ApiError(400, "Payment signature verification failed");
  }

  /*
   * -----------------------------------------
   * 6. Shared fulfillment
   * -----------------------------------------
   */
  const paidOrder = await completePaidOrder({
    orderId: order._id,

    razorpayOrderId: order.razorpayOrderId,

    razorpayPaymentId: razorpay_payment_id,

    razorpaySignature: razorpay_signature,
  });

  return res.status(200).json({
    success: true,

    message: "Payment verified and enrollment completed successfully",

    order: paidOrder,
  });
});