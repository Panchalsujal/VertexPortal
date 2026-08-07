import mongoose from "mongoose";

const announcementReadSchema = new mongoose.Schema(
  {
    announcement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Announcement",
      required: true,
      index: true,
    },

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

    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

announcementReadSchema.index(
  {
    announcement: 1,
    student: 1,
  },
  {
    unique: true,
  },
);

announcementReadSchema.index({
  student: 1,
  course: 1,
  readAt: -1,
});

const AnnouncementRead = mongoose.model(
  "AnnouncementRead",
  announcementReadSchema,
);

export default AnnouncementRead;
