import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    type: {
      type: String,
      enum: ["video", "text", "document", "quiz", "live"],
      default: "video",
      required: true,
    },

    videoUrl: {
      type: String,
      default: null,
    },

    videoFileId: {
      type: String,
      default: null,
    },

    documentUrl: {
      type: String,
      default: null,
    },

    documentFileId: {
      type: String,
      default: null,
    },

    content: {
      type: String,
      default: "",
    },

    durationInSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    order: {
      type: Number,
      default: null,
      required: function () {
        return this.isActive;
      },
    },

    isPreview: {
      type: Boolean,
      default: false,
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

lectureSchema.index(
  {
    module: 1,
    order: 1,
  },
  {
    name: "module_1_order_1",
    unique: true,
    partialFilterExpression: {
      isActive: true,
      order: {
        $type: "number",
      },
    },
  },
);

lectureSchema.index({
  course: 1,
  module: 1,
  isActive: 1,
});

const Lecture = mongoose.model("Lecture", lectureSchema);

export default Lecture;