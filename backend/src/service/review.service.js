import Course from "../models/course.model.js";
import CourseReview from "../models/courseReview.model.js";

export async function recalculateCourseRating(
  courseId,
  session = null,
) {
  const aggregate = CourseReview.aggregate([
    {
      $match: {
        course: courseId,
        isPublished: true,
      },
    },
    {
      $group: {
        _id: "$course",

        averageRating: {
          $avg: "$rating",
        },

        totalRatings: {
          $sum: 1,
        },

        totalReviews: {
          $sum: 1,
        },

        oneStar: {
          $sum: {
            $cond: [{ $eq: ["$rating", 1] }, 1, 0],
          },
        },

        twoStars: {
          $sum: {
            $cond: [{ $eq: ["$rating", 2] }, 1, 0],
          },
        },

        threeStars: {
          $sum: {
            $cond: [{ $eq: ["$rating", 3] }, 1, 0],
          },
        },

        fourStars: {
          $sum: {
            $cond: [{ $eq: ["$rating", 4] }, 1, 0],
          },
        },

        fiveStars: {
          $sum: {
            $cond: [{ $eq: ["$rating", 5] }, 1, 0],
          },
        },
      },
    },
  ]);

  if (session) {
    aggregate.session(session);
  }

  const [stats] = await aggregate;

  if (!stats) {
    const update = {
      averageRating: 0,
      totalRatings: 0,
      totalReviews: 0,

      ratingDistribution: {
        oneStar: 0,
        twoStars: 0,
        threeStars: 0,
        fourStars: 0,
        fiveStars: 0,
      },
    };

    if (session) {
      await Course.findByIdAndUpdate(
        courseId,
        update,
        { session },
      );
    } else {
      await Course.findByIdAndUpdate(
        courseId,
        update,
      );
    }

    return;
  }

  const update = {
    averageRating: Number(
      stats.averageRating.toFixed(2),
    ),

    totalRatings: stats.totalRatings,

    totalReviews: stats.totalReviews,

    ratingDistribution: {
      oneStar: stats.oneStar,
      twoStars: stats.twoStars,
      threeStars: stats.threeStars,
      fourStars: stats.fourStars,
      fiveStars: stats.fiveStars,
    },
  };

  if (session) {
    await Course.findByIdAndUpdate(
      courseId,
      update,
      { session },
    );
  } else {
    await Course.findByIdAndUpdate(
      courseId,
      update,
    );
  }
}