import mongoose from "mongoose";

const liveClassSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },

    lecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      default: null,
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

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 5000,
    },

    provider: {
      type: String,
      enum: ["google_meet", "zoom", "livekit", "custom"],
      default: "google_meet",
      index: true,
    },

    meetingUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    meetingId: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    meetingPassword: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
      select: false,
    },

    startsAt: {
      type: Date,
      required: true,
      index: true,
    },

    endsAt: {
      type: Date,
      required: true,
      index: true,
    },

    timezone: {
      type: String,
      trim: true,
      default: "Asia/Kolkata",
      maxlength: 100,
    },

    durationInMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 1440,
    },

    allowEarlyJoinMinutes: {
      type: Number,
      default: 10,
      min: 0,
      max: 120,
    },

    maxParticipants: {
      type: Number,
      default: null,
      min: 1,
    },

    recordingEnabled: {
      type: Boolean,
      default: false,
    },

    reminders: {
      reminder24HoursSent: {
        type: Boolean,
        default: false,
      },

      reminder1HourSent: {
        type: Boolean,
        default: false,
      },

      reminder10MinutesSent: {
        type: Boolean,
        default: false,
      },
    },

    recordingUrl: {
      type: String,
      trim: true,
      default: null,
    },

    notesUrl: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "scheduled",
        "live",
        "completed",
        "cancelled",
        "archived",
      ],
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

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    startedAtActual: {
      type: Date,
      default: null,
    },

    endedAtActual: {
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

liveClassSchema.index({
  course: 1,
  startsAt: 1,
  status: 1,
});

liveClassSchema.index({
  instructor: 1,
  startsAt: -1,
});

liveClassSchema.pre("validate", function (next) {
  if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
    return next(new Error("Live class end time must be after start time"));
  }

  if (this.startsAt && this.endsAt) {
    this.durationInMinutes = Math.ceil(
      (this.endsAt.getTime() - this.startsAt.getTime()) / (1000 * 60),
    );
  }

  if (this.status === "scheduled") {
    this.isPublished = true;
    this.isActive = true;
    this.publishedAt = this.publishedAt ?? new Date();
  }

  if (this.status === "draft") {
    this.isPublished = false;
    this.isActive = true;
    this.publishedAt = null;
  }

  if (this.status === "cancelled") {
    this.isPublished = false;
    this.cancelledAt = this.cancelledAt ?? new Date();
  }

  if (this.status === "archived") {
    this.isPublished = false;
    this.isActive = false;
  }
});

const LiveClass = mongoose.model("LiveClass", liveClassSchema);

export default LiveClass;
