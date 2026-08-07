import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 10000,
    },

    type: {
      type: String,
      enum: [
        "general",
        "important",
        "course_update",
        "assignment",
        "quiz",
        "live_class",
      ],
      default: "general",
      index: true,
    },

    relatedResourceType: {
      type: String,
      enum: ["assignment", "quiz", "lecture", "live_class", null],
      default: null,
    },

    relatedResourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    publishAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
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

announcementSchema.index({
  course: 1,
  isPublished: 1,
  publishAt: -1,
});

announcementSchema.index({
  instructor: 1,
  status: 1,
  createdAt: -1,
});

announcementSchema.pre("validate", function (next) {
  if (this.publishAt && this.expiresAt && this.expiresAt <= this.publishAt) {
    return next(
      new Error("Announcement expiry date must be after publish date"),
    );
  }

  if (this.status === "published") {
    this.isPublished = true;

    this.publishedAt = this.publishedAt ?? new Date();

    this.isActive = true;
  }

  if (this.status === "draft") {
    this.isPublished = false;
    this.publishedAt = null;
    this.isActive = true;
  }

  if (this.status === "archived") {
    this.isPublished = false;
    this.isActive = false;
  }
});

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
