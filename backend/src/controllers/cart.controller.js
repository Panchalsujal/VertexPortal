import mongoose from "mongoose";

import Course from "../models/course.model.js";
import CartItem from "../models/cartItem.model.js";
import Enrollment from "../models/enrollment.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";

export const addToCartController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      status: "published",
      isPublished: true,
      isActive: true,
    }).select(
      "title instructor price discountPrice",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or unavailable",
      });
    }

    if (
      course.instructor.toString() ===
      studentId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Instructor cannot add their own course to cart",
      });
    }

    const enrollment = await Enrollment.exists({
      student: studentId,
      course: courseId,
      status: {
        $in: ["active", "completed"],
      },
    });

    if (enrollment) {
      return res.status(409).json({
        success: false,
        message:
          "You are already enrolled in this course",
      });
    }

    const existingCartItem = await CartItem.exists({
      student: studentId,
      course: courseId,
    });

    if (existingCartItem) {
      return res.status(409).json({
        success: false,
        message: "Course is already in your cart",
      });
    }

    const effectivePrice =
      course.discountPrice ?? course.price;

    const cartItem = await CartItem.create({
      student: studentId,
      course: courseId,
      addedPrice: effectivePrice,
    });

    return res.status(201).json({
      success: true,
      message: "Course added to cart successfully",
      cartItem,
    });
  },
);

export const getMyCartController = asyncHandler(
  async (req, res) => {
    const studentId = req.user.id;

    const cartItems = await CartItem.find({
      student: studentId,
    })
      .populate({
        path: "course",
        match: {
          status: "published",
          isPublished: true,
          isActive: true,
        },
        select:
          "title slug subtitle thumbnailUrl instructor category level language price discountPrice averageRating totalRatings totalLectures totalDurationInSeconds",
        populate: [
          {
            path: "instructor",
            select: "fullName avatarUrl",
          },
          {
            path: "category",
            select: "name slug",
          },
        ],
      })
      .sort({
        createdAt: -1,
      })
      .lean();

    const validCartItems = cartItems
      .filter((item) => item.course)
      .map((item) => {
        const currentPrice =
          item.course.discountPrice ??
          item.course.price;

        const priceChanged =
          currentPrice !== item.addedPrice;

        return {
          _id: item._id,
          addedAt: item.createdAt,
          addedPrice: item.addedPrice,
          currentPrice,
          priceChanged,
          priceDifference:
            currentPrice - item.addedPrice,
          course: item.course,
        };
      });

    const subtotal = validCartItems.reduce(
      (total, item) =>
        total + item.currentPrice,
      0,
    );

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      cart: {
        items: validCartItems,
        itemCount: validCartItems.length,
        subtotal,
        total: subtotal,
      },
    });
  },
);


export const removeFromCartController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const deletedItem = await CartItem.findOneAndDelete({
      student: req.user.id,
      course: courseId,
    });

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "Course is not in your cart",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course removed from cart successfully",
    });
  },
);


export const getCartStatusController =
  asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const exists = await CartItem.exists({
      student: req.user.id,
      course: courseId,
    });

    return res.status(200).json({
      success: true,
      isInCart: Boolean(exists),
    });
  });

export const clearCartController = asyncHandler(
  async (req, res) => {
    await CartItem.deleteMany({
      student: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  },
);