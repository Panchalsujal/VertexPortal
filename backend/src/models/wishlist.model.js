import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

wishlistSchema.index(
  {
    student: 1,
    course: 1,
  },
  {
    unique: true,
    name: "student_1_course_1",
  },
);

wishlistSchema.index({
  course: 1,
  createdAt: -1,
});

const Wishlist = mongoose.model(
  "Wishlist",
  wishlistSchema,
);

export default Wishlist;