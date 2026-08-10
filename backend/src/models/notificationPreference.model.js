import mongoose from "mongoose";

const notificationPreferenceSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },

      inApp: {
        announcement: {
          type: Boolean,
          default: true,
        },

        assignment: {
          type: Boolean,
          default: true,
        },

        assignment_graded: {
          type: Boolean,
          default: true,
        },

        assignment_returned: {
          type: Boolean,
          default: true,
        },

        quiz: {
          type: Boolean,
          default: true,
        },

        quiz_result: {
          type: Boolean,
          default: true,
        },

        certificate: {
          type: Boolean,
          default: true,
        },

        live_class: {
          type: Boolean,
          default: true,
        },

        course_update: {
          type: Boolean,
          default: true,
        },

        /*
         * Discussion notifications
         */
        discussion: {
          type: Boolean,
          default: true,
        },

        discussion_reply: {
          type: Boolean,
          default: true,
        },

        answer_accepted: {
          type: Boolean,
          default: true,
        },

        system: {
          type: Boolean,
          default: true,
        },
      },

      email: {
        announcement: {
          type: Boolean,
          default: false,
        },

        assignment: {
          type: Boolean,
          default: true,
        },

        assignment_graded: {
          type: Boolean,
          default: true,
        },

        assignment_returned: {
          type: Boolean,
          default: true,
        },

        quiz: {
          type: Boolean,
          default: false,
        },

        quiz_result: {
          type: Boolean,
          default: true,
        },

        certificate: {
          type: Boolean,
          default: true,
        },

        live_class: {
          type: Boolean,
          default: true,
        },

        course_update: {
          type: Boolean,
          default: false,
        },

        /*
         * Discussion emails
         */
        discussion: {
          type: Boolean,
          default: false,
        },

        discussion_reply: {
          type: Boolean,
          default: false,
        },

        answer_accepted: {
          type: Boolean,
          default: true,
        },

        system: {
          type: Boolean,
          default: true,
        },
      },
    },
    {
      timestamps: true,
      versionKey: false,
    },
  );

const NotificationPreference =
  mongoose.model(
    "NotificationPreference",
    notificationPreferenceSchema,
  );

export default NotificationPreference;