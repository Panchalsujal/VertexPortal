import mongoose from "mongoose";

const studentNoteSchema = new mongoose.Schema(
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

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseModule",
      default: null,
      index: true,
    },

    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      default: "",
      maxlength: 200,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20000,
    },

    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    timestampInSeconds: {
      type: Number,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/*
 * Student ke lecture notes efficiently fetch karne ke liye.
 */
studentNoteSchema.index({
  student: 1,
  lecture: 1,
  isActive: 1,
  createdAt: -1,
});

/*
 * Course ke saare student notes.
 */
studentNoteSchema.index({
  student: 1,
  course: 1,
  isActive: 1,
  updatedAt: -1,
});

/*
 * Pinned notes ko priority se fetch karne ke liye.
 */
studentNoteSchema.index({
  student: 1,
  course: 1,
  isPinned: -1,
  updatedAt: -1,
});

const StudentNote = mongoose.model("StudentNote", studentNoteSchema);

export default StudentNote;
