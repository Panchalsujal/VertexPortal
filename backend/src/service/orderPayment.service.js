import mongoose from "mongoose";

import Order from "../models/order.model.js";
import Enrollment from "../models/enrollment.model.js";
import CartItem from "../models/cartItem.model.js";
import Coupon from "../models/coupon.model.js";
import CouponUsage from "../models/couponUsage.model.js";
import Course from "../models/course.model.js";

import { ApiError } from "../utils/ApiError.js";
import { executeChunkedBulkWrite } from "../utils/bulkWriteHelper.js";

/*
 * =========================================================
 * COMPLETE PAID ORDER
 * =========================================================
 *
 * Is function ko dono jagah use karenge:
 *
 * 1. Client payment verification
 * 2. Razorpay webhook
 *
 * Function idempotent hai:
 *
 * paid order dobara aaye
 * → duplicate enrollment nahi
 * → duplicate coupon usage nahi
 * → duplicate course count increment nahi
 */
export async function completePaidOrder({
  orderId = null,
  razorpayOrderId = null,
  razorpayPaymentId = null,
  razorpaySignature = null,
}) {
  /*
   * Kam se kam ek identifier required.
   */
  if (!orderId && !razorpayOrderId) {
    throw new ApiError(
      400,
      "Order identifier is required",
    );
  }

  const session =
    await mongoose.startSession();

  let finalOrderId = null;

  try {
    await session.withTransaction(
      async () => {
        /*
         * =========================================
         * FIND ORDER
         * =========================================
         */

        const filter = {};

        if (orderId) {
          if (
            !mongoose.Types.ObjectId.isValid(
              orderId,
            )
          ) {
            throw new ApiError(
              400,
              "Invalid order ID",
            );
          }

          filter._id = orderId;
        } else {
          filter.razorpayOrderId =
            razorpayOrderId;
        }

        const order =
          await Order.findOne(
            filter,
          ).session(session);

        if (!order) {
          throw new ApiError(
            404,
            "Order not found",
          );
        }

        finalOrderId =
          order._id;

        /*
         * =========================================
         * RAZORPAY ORDER VALIDATION
         * =========================================
         */

        if (
          razorpayOrderId &&
          order.razorpayOrderId !==
            razorpayOrderId
        ) {
          throw new ApiError(
            400,
            "Razorpay order ID does not match",
          );
        }

        /*
         * =========================================
         * IDEMPOTENCY
         * =========================================
         *
         * Already paid hai to fulfillment
         * dobara execute nahi karenge.
         */

        if (
          order.paymentStatus ===
            "paid" &&
          order.orderStatus ===
            "paid"
        ) {
          return;
        }

        /*
         * Cancelled/refunded order ko silently
         * paid nahi karenge.
         */
        if (
          order.orderStatus ===
          "refunded"
        ) {
          throw new ApiError(
            409,
            "Refunded order cannot be marked as paid",
          );
        }

        /*
         * =========================================
         * MARK ORDER PAID
         * =========================================
         */

        order.orderStatus =
          "paid";

        order.paymentStatus =
          "paid";

        if (
          razorpayPaymentId
        ) {
          order.razorpayPaymentId =
            razorpayPaymentId;
        }

        /*
         * Client verification ke case me
         * signature save hogi.
         *
         * Webhook ke case me checkout signature
         * nahi hoti, so optional rakhenge.
         */
        if (
          razorpaySignature
        ) {
          order.razorpaySignature =
            razorpaySignature;
        }

        order.paidAt =
          order.paidAt ||
          new Date();

        await order.save({
          session,
        });

        /*
         * =========================================
         * ENROLLMENTS (BATCHED BULK WRITE)
         * =========================================
         */

        const courseIdsInOrder = order.courses.map((item) => item.course);
        const existingEnrollments = await Enrollment.find({
          student: order.student,
          course: { $in: courseIdsInOrder },
        }).session(session);

        const existingEnrollmentMap = new Map(
          existingEnrollments.map((enr) => [enr.course.toString(), enr])
        );

        const newlyActivatedCourseIds = [];
        const enrollmentBulkOperations = [];
        const now = new Date();

        for (const item of order.courses) {
          const courseIdStr = item.course.toString();
          const enrollment = existingEnrollmentMap.get(courseIdStr);

          if (enrollment) {
            if (
              enrollment.status === "active" ||
              enrollment.status === "completed"
            ) {
              continue;
            }

            // Reactivate cancelled / expired enrollment
            enrollmentBulkOperations.push({
              updateOne: {
                filter: { _id: enrollment._id },
                update: {
                  $set: {
                    status: "active",
                    enrolledAt: now,
                    expiresAt: null,
                    progressPercentage: 0,
                    completedLecturesCount: 0,
                    lastWatchedLecture: null,
                    lastWatchedAt: null,
                    completedAt: null,
                    certificateStatus: "not_eligible",
                    certificateIssuedAt: null,
                    certificateIssueError: "",
                    certificateIssueAttempts: 0,
                  },
                },
              },
            });

            newlyActivatedCourseIds.push(item.course);
          } else {
            // New enrollment
            enrollmentBulkOperations.push({
              insertOne: {
                document: {
                  student: order.student,
                  course: item.course,
                  status: "active",
                  enrolledAt: now,
                },
              },
            });

            newlyActivatedCourseIds.push(item.course);
          }
        }

        if (enrollmentBulkOperations.length > 0) {
          await executeChunkedBulkWrite(Enrollment, enrollmentBulkOperations, {
            chunkSize: 500,
            session,
            ordered: false,
          });
        }

        /*
         * =========================================
         * COURSE ENROLLMENT COUNT
         * =========================================
         *
         * Sirf new/reactivated enrollment
         * increment karega.
         */

        if (
          newlyActivatedCourseIds.length >
          0
        ) {
          await Course.updateMany(
            {
              _id: {
                $in:
                  newlyActivatedCourseIds,
              },
            },

            {
              $inc: {
                enrolledStudentsCount:
                  1,
              },
            },

            {
              session,
            },
          );
        }

        /*
         * =========================================
         * COUPON USAGE
         * =========================================
         */

        if (order.coupon) {
          const coupon =
            await Coupon.findOne({
              _id:
                order.coupon,

              isDeleted:
                false,
            }).session(session);

          if (!coupon) {
            throw new ApiError(
              400,
              "Coupon linked with order was not found",
            );
          }

          /*
           * order field CouponUsage me unique hai.
           */
          const existingUsage =
            await CouponUsage.findOne({
              order:
                order._id,
            })
              .select("_id")
              .session(session);

          if (!existingUsage) {
            /*
             * -------------------------------------
             * PER USER LIMIT
             * -------------------------------------
             */

            const studentUsageCount =
              await CouponUsage.countDocuments({
                coupon:
                  coupon._id,

                student:
                  order.student,
              }).session(session);

            const perUserLimit =
              Number(
                coupon.perUserLimit,
              ) || 1;

            if (
              studentUsageCount >=
              perUserLimit
            ) {
              throw new ApiError(
                400,
                "Coupon per-user usage limit has been reached",
              );
            }

            /*
             * -------------------------------------
             * GLOBAL LIMIT
             * -------------------------------------
             */

            if (
              coupon.usageLimit !==
                null &&
              coupon.usageCount >=
                coupon.usageLimit
            ) {
              throw new ApiError(
                400,
                "Coupon usage limit has been reached",
              );
            }

            await CouponUsage.create(
              [
                {
                  coupon:
                    coupon._id,

                  student:
                    order.student,

                  order:
                    order._id,

                  discountAmount:
                    order.discountAmount,
                },
              ],
              {
                session,
              },
            );

            coupon.usageCount +=
              1;

            await coupon.save({
              session,
            });
          }
        }

        /*
         * =========================================
         * REMOVE PURCHASED COURSES FROM CART
         * =========================================
         */

        const purchasedCourseIds =
          order.courses.map(
            (item) =>
              item.course,
          );

        if (
          purchasedCourseIds.length >
          0
        ) {
          await CartItem.deleteMany(
            {
              student:
                order.student,

              course: {
                $in:
                  purchasedCourseIds,
              },
            },
            {
              session,
            },
          );
        }
      },
    );
  } finally {
    await session.endSession();
  }

  /*
   * =========================================
   * FINAL ORDER RESPONSE
   * =========================================
   */

  const order =
    await Order.findById(
      finalOrderId,
    )
      .populate({
        path:
          "courses.course",

        select:
          "title slug thumbnailUrl instructor",
      })
      .populate({
        path:
          "coupon",

        select:
          "code discountType discountValue",
      })
      .lean();

  if (!order) {
    throw new ApiError(
      404,
      "Order not found after payment completion",
    );
  }

  return order;
}

/*
 * =========================================================
 * MARK PAYMENT FAILED
 * =========================================================
 *
 * payment.failed webhook ke liye.
 *
 * Important:
 * Agar order already paid ho chuka hai,
 * stale/out-of-order failed webhook usko
 * failed nahi bana sakta.
 */
export async function markOrderPaymentFailed({
  razorpayOrderId,
  razorpayPaymentId = null,
}) {
  if (!razorpayOrderId) {
    throw new ApiError(
      400,
      "Razorpay order ID is required",
    );
  }

  const order =
    await Order.findOne({
      razorpayOrderId,
    });

  if (!order) {
    throw new ApiError(
      404,
      "Order not found",
    );
  }

  /*
   * Webhooks out of order aa sakte hain.
   * Paid status ko downgrade nahi karna.
   */
  if (
    order.paymentStatus ===
    "paid"
  ) {
    return order;
  }

  order.paymentStatus =
    "failed";

  order.orderStatus =
    "failed";

  if (razorpayPaymentId) {
    order.razorpayPaymentId =
      razorpayPaymentId;
  }

  await order.save();

  return order;
}