import NotificationPreference from "../models/notificationPreference.model.js";
import User from "../models/user.model.js";

import { sendEmail } from "./mail.service.js";

import { validateObjectId } from "../utils/validator.js";
import { ApiError } from "../utils/ApiError.js";

const EMAIL_NOTIFICATION_TYPES = [
  "announcement",
  "assignment",
  "assignment_graded",
  "assignment_returned",
  "quiz",
  "quiz_result",
  "certificate",
  "live_class",
  "course_update",
  "system",
];

function buildNotificationEmailHtml({
  userName,
  title,
  message,
  actionUrl = "",
}) {
  const button = actionUrl
    ? `
      <div style="text-align:center;margin:30px 0;">
        <a
          href="${actionUrl}"
          target="_blank"
          rel="noopener noreferrer"
          style="
            display:inline-block;
            padding:14px 28px;
            background:#2563eb;
            color:#ffffff;
            text-decoration:none;
            border-radius:8px;
            font-weight:600;
          "
        >
          View Details
        </a>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          ${title}
        </title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f4f4f7;
          font-family:Arial,sans-serif;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          role="presentation"
          style="padding:40px 15px;"
        >
          <tr>
            <td align="center">

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
                style="
                  max-width:600px;
                  background:#ffffff;
                  border-radius:12px;
                  overflow:hidden;
                "
              >

                <tr>
                  <td
                    style="
                      padding:30px;
                      background:#111827;
                      color:#ffffff;
                    "
                  >
                    <h2 style="margin:0;">
                      LMS AI
                    </h2>
                  </td>
                </tr>

                <tr>
                  <td style="padding:30px;">

                    <p>
                      Hi
                      <strong>
                        ${userName || "there"}
                      </strong>,
                    </p>

                    <h3>
                      ${title}
                    </h3>

                    <p
                      style="
                        color:#4b5563;
                        line-height:1.7;
                      "
                    >
                      ${message}
                    </p>

                    ${button}

                    <p
                      style="
                        margin-top:30px;
                        color:#9ca3af;
                        font-size:12px;
                      "
                    >
                      This is an automated email from LMS AI.
                    </p>

                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendNotificationEmail({
  userId,
  type,
  title,
  message,
  actionUrl = "",
}) {
  validateObjectId(
    userId,
    "user ID",
  );

  if (
    !EMAIL_NOTIFICATION_TYPES.includes(
      type,
    )
  ) {
    throw new ApiError(
      400,
      "Invalid email notification type",
    );
  }

  const [user, preferences] =
    await Promise.all([
      User.findById(userId)
        .select(
          "fullName email",
        )
        .lean(),

      NotificationPreference.findOne({
        user: userId,
      })
        .select(
          `email.${type}`,
        )
        .lean(),
    ]);

  if (!user) {
    throw new ApiError(
      404,
      "Notification user not found",
    );
  }

  const emailEnabled =
    preferences ? (preferences?.email?.[type] ?? true) : true;

  if (!emailEnabled) {
    return {
      skipped: true,
      sent: false,

      reason:
        "Email notification disabled by user preference",
    };
  }

  if (!user.email) {
    return {
      skipped: true,
      sent: false,

      reason:
        "User email is not available",
    };
  }

  const html =
    buildNotificationEmailHtml({
      userName: user.fullName,
      title,
      message,
      actionUrl,
    });

  await sendEmail({
    to: user.email,

    subject: title,

    text: message,

    html,
  });

  return {
    skipped: false,
    sent: true,
    reason: null,
  };
}