import mongoose from "mongoose";

const lectureProgressSchema = new mongoose.Schema(
  {
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },

    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },

    watchedDurationInSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

lectureProgressSchema.index(
  {
    enrollment: 1,
    lecture: 1,
  },
  {
    unique: true,
    name: "enrollment_1_lecture_1",
  },
);

const LectureProgress = mongoose.model(
  "LectureProgress",
  lectureProgressSchema,
);

export default LectureProgress;