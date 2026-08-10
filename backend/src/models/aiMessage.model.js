import mongoose from "mongoose";

const aiSourceSchema =
  new mongoose.Schema(
    {
      resourceType: {
        type:
          String,

        enum: [
          "course",
          "module",
          "lecture",
          "document",
          "note",
        ],

        required:
          true,
      },

      resourceId: {
        type:
          mongoose.Schema.Types.ObjectId,

        required:
          true,
      },

      title: {
        type:
          String,

        trim:
          true,

        default:
          "",
      },

      excerpt: {
        type:
          String,

        trim:
          true,

        default:
          "",

        maxlength:
          2000,
      },

      score: {
        type:
          Number,

        default:
          null,
      },
    },
    {
      _id:
        false,
    },
  );

const aiMessageSchema =
  new mongoose.Schema(
    {
      conversation: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "AiConversation",

        required:
          true,

        index:
          true,
      },

      user: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,

        index:
          true,
      },

      course: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref:
          "Course",

        default:
          null,

        index:
          true,
      },

      role: {
        type:
          String,

        enum: [
          "user",
          "assistant",
          "system",
        ],

        required:
          true,

        index:
          true,
      },

      content: {
        type:
          String,

        required:
          true,

        trim:
          true,

        maxlength:
          50000,
      },

      sources: {
        type:
          [aiSourceSchema],

        default:
          [],
      },

      metadata: {
        type:
          mongoose.Schema.Types.Mixed,

        default:
          null,
      },

      isActive: {
        type:
          Boolean,

        default:
          true,

        index:
          true,
      },
    },
    {
      timestamps:
        true,

      versionKey:
        false,
    },
  );

aiMessageSchema.index({
  conversation:
    1,

  createdAt:
    1,
});

const AiMessage =
  mongoose.model(
    "AiMessage",
    aiMessageSchema,
  );

export default AiMessage;