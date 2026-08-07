import mongoose from "mongoose";

const courseReviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

courseReviewSchema.index(
  {
    student: 1,
    course: 1,
  },
  {
    unique: true,
  },
);

courseReviewSchema.index({
  course: 1,
  rating: 1,
});

export default mongoose.model(
  "CourseReview",
  courseReviewSchema,
);