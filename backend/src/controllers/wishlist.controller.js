import mongoose from "mongoose";

import Course from "../models/course.model.js";
import Wishlist from "../models/wishlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addToWishlistController = asyncHandler(
  async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const session = await mongoose.startSession();

    let wishlistItem;

    try {
      await session.withTransaction(async () => {
        const course = await Course.findOne({
          _id: courseId,
          status: "published",
          isPublished: true,
          isActive: true,
        }).session(session);

        if (!course) {
          const error = new Error(
            "Course not found or unavailable",
          );
          error.statusCode = 404;
          throw error;
        }

        if (
          course.instructor.toString() ===
          studentId.toString()
        ) {
          const error = new Error(
            "Instructor cannot wishlist their own course",
          );
          error.statusCode = 403;
          throw error;
        }

        const existingWishlist =
          await Wishlist.findOne({
            student: studentId,
            course: courseId,
          }).session(session);

        if (existingWishlist) {
          const error = new Error(
            "Course is already in your wishlist",
          );
          error.statusCode = 409;
          throw error;
        }

        const createdWishlist =
          await Wishlist.create(
            [
              {
                student: studentId,
                course: courseId,
              },
            ],
            {
              session,
            },
          );

        wishlistItem = createdWishlist[0];

        await Course.updateOne(
          {
            _id: courseId,
          },
          {
            $inc: {
              wishlistCount: 1,
            },
          },
          {
            session,
          },
        );
      });

      return res.status(201).json({
        success: true,
        message: "Course added to wishlist",
        wishlist: wishlistItem,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message:
            "Course is already in your wishlist",
        });
      }

      throw error;
    } finally {
      await session.endSession();
    }
  },
);

export const removeFromWishlistController =
  asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const wishlistItem =
          await Wishlist.findOne({
            student: studentId,
            course: courseId,
          }).session(session);

        if (!wishlistItem) {
          const error = new Error(
            "Course is not in your wishlist",
          );
          error.statusCode = 404;
          throw error;
        }

        await wishlistItem.deleteOne({
          session,
        });

        await Course.updateOne(
          {
            _id: courseId,
            wishlistCount: {
              $gt: 0,
            },
          },
          {
            $inc: {
              wishlistCount: -1,
            },
          },
          {
            session,
          },
        );
      });

      return res.status(200).json({
        success: true,
        message:
          "Course removed from wishlist",
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      throw error;
    } finally {
      await session.endSession();
    }
  });

export const getMyWishlistController = asyncHandler(
  async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      50,
    );

    const skip = (page - 1) * limit;

    const filter = {
      student: req.user.id,
    };

    const [wishlistItems, totalItems] =
      await Promise.all([
        Wishlist.find(filter)
          .populate({
            path: "course",
            match: {
              isActive: true,
              isPublished: true,
              status: "published",
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
          .skip(skip)
          .limit(limit)
          .lean(),

        Wishlist.countDocuments(filter),
      ]);

    const wishlist = wishlistItems.filter(
      (item) => item.course,
    );

    const totalPages = Math.ceil(
      totalItems / limit,
    );

    return res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      wishlist,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  },
);

export const getWishlistStatusController =
  asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const wishlistItem = await Wishlist.exists({
      student: req.user.id,
      course: courseId,
    });

    return res.status(200).json({
      success: true,
      isWishlisted: Boolean(wishlistItem),
    });
  });