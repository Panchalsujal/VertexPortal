import mongoose from "mongoose";

const aiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Course",

      default: null,

      index: true,
    },

    title: {
      type: String,

      trim: true,

      default: "New conversation",

      maxlength: 200,
    },

    messageCount: {
      type: Number,

      default: 0,

      min: 0,
    },

    lastMessageAt: {
      type: Date,

      default: Date.now,

      index: true,
    },

    isArchived: {
      type: Boolean,

      default: false,

      index: true,
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

aiConversationSchema.index({
  user: 1,

  isArchived: 1,

  lastMessageAt: -1,
});

aiConversationSchema.index({
  user: 1,

  course: 1,

  lastMessageAt: -1,
});

const AiConversation = mongoose.model("AiConversation", aiConversationSchema);

export default AiConversation;
