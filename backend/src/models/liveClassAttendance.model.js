import mongoose from "mongoose";

const attendanceSessionSchema = new mongoose.Schema(
  {
    joinedAt: {
      type: Date,
      required: true,
    },

    leftAt: {
      type: Date,
      default: null,
    },

    durationInSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: true,
    versionKey: false,
  },
);

const liveClassAttendanceSchema = new mongoose.Schema(
  {
    liveClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveClass",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
      index: true,
    },

    sessions: {
      type: [attendanceSessionSchema],
      default: [],
    },

    firstJoinedAt: {
      type: Date,
      default: null,
    },

    lastJoinedAt: {
      type: Date,
      default: null,
    },

    lastLeftAt: {
      type: Date,
      default: null,
    },

    totalDurationInSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    joinCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    attendancePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    isPresent: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: ["not_joined", "present", "left", "completed"],
      default: "not_joined",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

liveClassAttendanceSchema.index(
  {
    liveClass: 1,
    student: 1,
  },
  {
    unique: true,
  },
);

liveClassAttendanceSchema.index({
  liveClass: 1,
  isPresent: 1,
});

const LiveClassAttendance = mongoose.model(
  "LiveClassAttendance",
  liveClassAttendanceSchema,
);

export default LiveClassAttendance;
