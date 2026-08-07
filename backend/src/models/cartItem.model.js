import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
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

    addedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

cartItemSchema.index(
  {
    student: 1,
    course: 1,
  },
  {
    unique: true,
    name: "student_1_course_1",
  },
);

cartItemSchema.index({
  student: 1,
  createdAt: -1,
});

const CartItem = mongoose.model(
  "CartItem",
  cartItemSchema,
);

export default CartItem;