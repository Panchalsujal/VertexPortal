import nodemailer from "nodemailer";
import { config } from "../config/config.js";

const createTransporter = () => {
  // Option 1: Custom SMTP (e.g. Brevo, SendGrid, Mailgun on port 587 or 2525)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER || config.EMAIL_USER,
        pass: process.env.SMTP_PASS,
      },
      family: 4,
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
    });
  }

  // Option 2: Gmail with App Password (if EMAIL_PASS is provided)
  if (process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: config.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      family: 4,
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
    });
  }

  // Option 3: Gmail with OAuth2
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      type: "OAuth2",
      user: config.EMAIL_USER,
      clientId: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      refreshToken: config.GOOGLE_REFRESH_TOKEN,
    },
    family: 4,
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 4000,
  });
};

const transporter = createTransporter();

// Non-blocking verification check (skip in production or when DISABLE_EMAIL_VERIFY=true)
if (process.env.DISABLE_EMAIL_VERIFY !== "true" && process.env.NODE_ENV !== "production") {
  transporter.verify((error) => {
    if (error) {
      console.warn(
        "ℹ️ Email verification note:",
        error.message || error
      );
      return;
    }

    console.log("Email server is ready to send messages");
  });
}

/*
 * Generic reusable email sender.
 */
export async function sendEmail({
  to,
  subject,
  text = "",
  html = "",
  replyTo = null,
}) {
  if (!to) {
    throw new Error(
      "Email recipient is required",
    );
  }

  if (!subject) {
    throw new Error(
      "Email subject is required",
    );
  }

  if (!text && !html) {
    throw new Error(
      "Email text or HTML content is required",
    );
  }

  // Skip email if disabled via environment variable (e.g. Render free tier)
  if (process.env.DISABLE_EMAIL === "true" || process.env.DISABLE_EMAIL_NOTIFICATIONS === "true") {
    console.log(`[EMAIL-MOCK] Skipped (${process.env.DISABLE_EMAIL ? 'DISABLE_EMAIL' : 'DISABLE_EMAIL_NOTIFICATIONS'}=true) to ${to}: ${subject}`);
    return { messageId: "mock-" + Date.now(), skipped: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Vertex LMS" <${config.EMAIL_USER}>`,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
      ...(replyTo ? { replyTo } : {}),
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.warn(
      `[EMAIL] Failed to deliver to ${to} (${error.code || error.message}) - outbound SMTP may be restricted on cloud host`
    );
    return { messageId: null, failed: true, error: error.message };
  }
}

/*
 * Existing verification email.
 */
export async function sendVerificationEmail({
  user,
  verificationLink,
}) {
  const subject =
    "Verify your email address";

  const text =
    `Hi ${user.fullName}, verify your email by opening this link: ${verificationLink}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          Verify Your Email
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
          style="
            padding:40px 15px;
            background:#f4f4f7;
          "
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
                  box-shadow:0 4px 20px rgba(0,0,0,0.08);
                "
              >

                <tr>
                  <td
                    align="center"
                    style="
                      background:#111827;
                      padding:35px 20px;
                    "
                  >
                    <h1
                      style="
                        margin:0;
                        color:#ffffff;
                        font-size:28px;
                      "
                    >
                      LMS AI
                    </h1>

                    <p
                      style="
                        margin:10px 0 0;
                        color:#d1d5db;
                        font-size:14px;
                      "
                    >
                      Learn Smarter with AI
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding:40px 30px;
                    "
                  >
                    <h2
                      style="
                        margin:0 0 20px;
                        color:#111827;
                        font-size:22px;
                      "
                    >
                      Verify your email
                    </h2>

                    <p
                      style="
                        margin:0 0 16px;
                        color:#4b5563;
                        line-height:1.7;
                      "
                    >
                      Hi
                      <strong>
                        ${user.fullName}
                      </strong>,
                    </p>

                    <p
                      style="
                        margin:0 0 20px;
                        color:#4b5563;
                        line-height:1.7;
                      "
                    >
                      Thanks for creating your LMS AI account.
                      Please verify your email address by clicking
                      the button below.
                    </p>

                    <div
                      style="
                        text-align:center;
                        margin:35px 0;
                      "
                    >
                      <a
                        href="${verificationLink}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                          display:inline-block;
                          background:#2563eb;
                          color:#ffffff;
                          text-decoration:none;
                          padding:15px 35px;
                          border-radius:8px;
                          font-size:16px;
                          font-weight:bold;
                        "
                      >
                        Verify Email
                      </a>
                    </div>

                    <p
                      style="
                        margin:0 0 12px;
                        color:#4b5563;
                        line-height:1.7;
                      "
                    >
                      If the button does not work,
                      copy and paste this link into your browser:
                    </p>

                    <p
                      style="
                        margin:0;
                        word-break:break-all;
                        line-height:1.6;
                      "
                    >
                      <a
                        href="${verificationLink}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                          color:#2563eb;
                          text-decoration:none;
                        "
                      >
                        ${verificationLink}
                      </a>
                    </p>

                    <p
                      style="
                        margin:30px 0 0;
                        color:#6b7280;
                        font-size:14px;
                        line-height:1.6;
                      "
                    >
                      This verification link will expire in
                      <strong>24 hours</strong>.
                    </p>

                    <p
                      style="
                        margin:12px 0 0;
                        color:#6b7280;
                        font-size:14px;
                        line-height:1.6;
                      "
                    >
                      If you did not create this account,
                      you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="
                      padding:20px;
                      background:#f9fafb;
                      border-top:1px solid #e5e7eb;
                    "
                  >
                    <p
                      style="
                        margin:0;
                        color:#9ca3af;
                        font-size:12px;
                      "
                    >
                      © ${new Date().getFullYear()} LMS AI.
                      All rights reserved.
                    </p>

                    <p
                      style="
                        margin:6px 0 0;
                        color:#9ca3af;
                        font-size:11px;
                      "
                    >
                      This is an automated email.
                      Please do not reply.
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

  console.log(
    `[EMAIL] Verification Link for ${user.email}: ${verificationLink}`
  );

  return sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
}

export default transporter;