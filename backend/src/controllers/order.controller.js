import { createHmac } from "node:crypto";
import mongoose from "mongoose";

import Order from "../models/order.model.js";
import Enrollment from "../models/enrollment.model.js";
import CartItem from "../models/cartItem.model.js";
import Coupon from "../models/coupon.model.js";
import CouponUsage from "../models/couponUsage.model.js";
import Course from "../models/course.model.js";
import razorpay from "../service/razorpay.service.js";

import { config } from "../config/config.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { validateCheckout } from "../service/checkout.service.js";

export const createPaymentOrderController = asyncHandler(async (req, res) => {
  const { couponCode = null } = req.body || {};

  /*
   * Step 1
   * Validate complete checkout
   */
  const checkout = await validateCheckout({
    studentId: req.user.id,
    couponCode,
  });

  const { courses, pricing, coupon, invalidCartItemIds, priceChanges } =
    checkout;

  /*
   * Step 2
   * Free order not supported yet
   */
  if (pricing.totalAmount <= 0) {
    throw new ApiError(400, "This order does not require payment");
  }

  /*
   * Step 3
   * Create Database Order
   */

  const order = await Order.create({
    student: req.user.id,

    courses,

    subtotal: pricing.subtotal,
    discountAmount: pricing.discountAmount,
    totalAmount: pricing.totalAmount,

    coupon: coupon?.id || null,

    orderStatus: "pending",

    paymentStatus: "pending",

    paymentMethod: "razorpay",
  });

  /*
   * Step 4
   * Currently just return database order.
   *
   * Razorpay integration next step.
   */

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(pricing.totalAmount * 100), // Razorpay amount paise me leta hai

    currency: "INR",

    receipt: order._id.toString(),

    notes: {
      studentId: req.user.id.toString(),

      orderId: order._id.toString(),
    },
  });

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

      status: order.orderStatus,
    },

    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,

      orderId: razorpayOrder.id,

      amount: razorpayOrder.amount,

      currency: razorpayOrder.currency,
    },

    invalidCartItemIds,

    priceChanges,
  });
});

export const verifyPaymentController = asyncHandler(async (req, res) => {
  const {
    databaseOrderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body || {};

  if (
    !databaseOrderId ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    throw new ApiError(400, "Payment verification details are required");
  }

  if (!mongoose.Types.ObjectId.isValid(databaseOrderId)) {
    throw new ApiError(400, "Invalid database order ID");
  }

  const order = await Order.findOne({
    _id: databaseOrderId,
    student: req.user.id,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  /*
   * Idempotency:
   * Same successful verification request dobara aaye,
   * to duplicate enrollment/coupon usage create nahi hoga.
   */
  if (order.paymentStatus === "paid") {
    return res.status(200).json({
      success: true,
      message: "Payment is already verified",
      order,
    });
  }

  if (order.razorpayOrderId !== razorpay_order_id) {
    throw new ApiError(400, "Razorpay order ID does not match");
  }

  /*
   * Signature:
   * razorpay_order_id|razorpay_payment_id
   */
  const expectedSignature = createHmac("sha256", config.RAZORPAY_SECRET_ID

  )
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Payment signature verification failed");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const transactionOrder = await Order.findOne({
        _id: databaseOrderId,
        student: req.user.id,
      }).session(session);

      if (!transactionOrder) {
        throw new ApiError(404, "Order not found");
      }

      /*
       * Transaction ke andar dobara check.
       * Concurrent verification requests se protection.
       */
      if (transactionOrder.paymentStatus === "paid") {
        return;
      }

      transactionOrder.orderStatus = "paid";
      transactionOrder.paymentStatus = "paid";
      transactionOrder.razorpayPaymentId = razorpay_payment_id;
      transactionOrder.razorpaySignature = razorpay_signature;
      transactionOrder.paidAt = new Date();

      await transactionOrder.save({ session });

      const newlyEnrolledCourseIds = [];

      for (const item of transactionOrder.courses) {
        const existingEnrollment = await Enrollment.findOne({
          student: req.user.id,
          course: item.course,
        }).session(session);

        if (existingEnrollment) {
          if (
            existingEnrollment.status === "cancelled" ||
            existingEnrollment.status === "expired"
          ) {
            existingEnrollment.status = "active";
            existingEnrollment.enrolledAt = new Date();
            existingEnrollment.expiresAt = null;

            await existingEnrollment.save({
              session,
            });

            newlyEnrolledCourseIds.push(item.course);
          }

          continue;
        }

        await Enrollment.create(
          [
            {
              student: req.user.id,
              course: item.course,
              status: "active",
            },
          ],
          { session },
        );

        newlyEnrolledCourseIds.push(item.course);
      }

      /*
       * Course enrollment count sirf new/reactivated
       * enrollments ke liye increment hoga.
       */
      if (newlyEnrolledCourseIds.length > 0) {
        await Course.updateMany(
          {
            _id: {
              $in: newlyEnrolledCourseIds,
            },
          },
          {
            $inc: {
              enrolledStudentsCount: 1,
            },
          },
          {
            session,
          },
        );
      }

      /*
       * Coupon usage
       */
      if (transactionOrder.coupon) {
        const coupon = await Coupon.findOne({
          _id: transactionOrder.coupon,
          isDeleted: false,
        }).session(session);

        if (!coupon) {
          throw new ApiError(400, "Coupon linked with order was not found");
        }

        const existingUsage = await CouponUsage.exists({
          order: transactionOrder._id,
        }).session(session);

        if (!existingUsage) {
          const studentUsageCount = await CouponUsage.countDocuments({
            coupon: coupon._id,
            student: req.user.id,
          }).session(session);

          const perUserLimit = Number(coupon.perUserLimit) || 1;

          if (studentUsageCount >= perUserLimit) {
            throw new ApiError(
              400,
              "Coupon per-user usage limit has been reached",
            );
          }

          if (
            coupon.usageLimit !== null &&
            coupon.usageCount >= coupon.usageLimit
          ) {
            throw new ApiError(400, "Coupon usage limit has been reached");
          }

          await CouponUsage.create(
            [
              {
                coupon: coupon._id,
                student: req.user.id,
                order: transactionOrder._id,
                discountAmount: transactionOrder.discountAmount,
              },
            ],
            { session },
          );

          coupon.usageCount += 1;

          await coupon.save({ session });
        }
      }

      /*
       * Purchased courses cart se remove.
       */
      const purchasedCourseIds = transactionOrder.courses.map(
        (item) => item.course,
      );

      await CartItem.deleteMany(
        {
          student: req.user.id,
          course: {
            $in: purchasedCourseIds,
          },
        },
        {
          session,
        },
      );
    });
  } finally {
    await session.endSession();
  }

  const paidOrder = await Order.findById(databaseOrderId)
    .populate({
      path: "courses.course",
      select: "title slug thumbnailUrl instructor",
    })
    .populate({
      path: "coupon",
      select: "code discountType discountValue",
    })
    .lean();

  return res.status(200).json({
    success: true,
    message: "Payment verified and enrollment completed successfully",
    order: paidOrder,
  });
});
