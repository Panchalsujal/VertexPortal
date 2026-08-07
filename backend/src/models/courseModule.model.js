import mongoose from "mongoose";

const courseModuleSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    order: {
      type: Number,
      default: null,
      required: function () {
        return this.isActive;
      },
    },
    totalLectures: {
      type: Number,
      default: 0,
    },

    totalDurationInSeconds: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

courseModuleSchema.index(
  {
    course: 1,
    order: 1,
  },
  {
    name: "course_1_order_1",
    unique: true,
    partialFilterExpression: {
      isActive: true,
      order: {
        $type: "number",
      },
    },
  },
);

const CourseModule = mongoose.model("CourseModule", courseModuleSchema);

export default CourseModule;
