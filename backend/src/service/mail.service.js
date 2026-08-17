import { Resend } from "resend";
import nodemailer from "nodemailer";
import { config } from "../config/config.js";
import { circuitBreakers } from "../utils/circuitBreaker.js";

// Initialize Resend client if API key is provided
const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null;

// Cached Google OAuth2 Access Token for HTTPS requests
let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Send email via Resend REST API over HTTPS (Port 443)
 * Best for Vercel, Render, AWS, and serverless environments.
 */
async function sendViaResend({ to, subject, text = "", html = "", replyTo = null }) {
  if (!resend) {
    throw new Error("Resend is not initialized (RESEND_API_KEY missing)");
  }

  const { data, error } = await resend.emails.send({
    from: config.EMAIL_FROM || "Vertex LMS <onboarding@resend.dev>",
    to: Array.isArray(to) ? to : [to],
    subject,
    text: text || undefined,
    html: html || undefined,
    ...(replyTo ? { reply_to: replyTo } : {}),
  });

  if (error) {
    throw new Error(error.message || "Failed to send email via Resend");
  }

  console.log(`[EMAIL-RESEND] Email delivered successfully to ${to} (ID: ${data?.id})`);
  return { messageId: data?.id };
}

/**
 * Fetch / refresh Google OAuth2 Access Token over HTTPS (Port 443)
 */
async function getGoogleAccessToken() {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID,
      client_secret: config.GOOGLE_CLIENT_SECRET,
      refresh_token: config.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Failed to refresh Google OAuth token");
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  return cachedAccessToken;
}

/**
 * Send email via Google Gmail REST API over HTTPS (Port 443)
 * Bypasses all cloud host SMTP port restrictions permanently.
 */
async function sendViaGmailRestApi({ to, subject, text = "", html = "", replyTo = null }) {
  const accessToken = await getGoogleAccessToken();

  const utf8Subject = `=?utf-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
  const messageParts = [
    `From: ${config.EMAIL_FROM || `"Vertex LMS" <${config.EMAIL_USER}>`}`,
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    `MIME-Version: 1.0`,
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
  ];

  if (html) {
    messageParts.push(
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(html, "utf-8").toString("base64")
    );
  } else {
    messageParts.push(
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: base64`,
      ``,
      Buffer.from(text, "utf-8").toString("base64")
    );
  }

  const rawMessage = messageParts.join("\r\n");
  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Failed to send email via Gmail REST API");
  }

  console.log(`[EMAIL-HTTPS] Email delivered successfully to ${to} (ID: ${result.id})`);
  return { messageId: result.id };
}

// Fallback SMTP Transporter (for custom SMTP hosts like Brevo, SendGrid, etc.)
const createTransporter = () => {
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
      socketTimeout: 4000,
    });
  }

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
      socketTimeout: 4000,
    });
  }

  return null;
};

const fallbackTransporter = createTransporter();

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
    throw new Error("Email recipient is required");
  }

  if (!subject) {
    throw new Error("Email subject is required");
  }

  if (!text && !html) {
    throw new Error("Email text or HTML content is required");
  }

  return await circuitBreakers.mail.fire(
    async () => {
      // 1. Primary: Send via Resend REST API over HTTPS (Port 443)
      if (resend) {
        try {
          return await sendViaResend({ to, subject, text, html, replyTo });
        } catch (resendError) {
          console.warn(`[EMAIL-RESEND] Resend delivery warning: ${resendError.message}. Attempting fallback...`);
        }
      }

      // 2. Secondary: Send via Google Gmail REST API over HTTPS (Port 443)
      if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_REFRESH_TOKEN) {
        try {
          return await sendViaGmailRestApi({ to, subject, text, html, replyTo });
        } catch (apiError) {
          console.warn(`[EMAIL-API] Gmail REST API warning: ${apiError.message}. Attempting fallback...`);
        }
      }

      // 3. Tertiary: Fallback SMTP if configured
      if (fallbackTransporter) {
        try {
          const info = await fallbackTransporter.sendMail({
            from: config.EMAIL_FROM || `"Vertex LMS" <${config.EMAIL_USER}>`,
            to,
            subject,
            text: text || undefined,
            html: html || undefined,
            ...(replyTo ? { replyTo } : {}),
          });
          console.log("[EMAIL-SMTP] Email sent via SMTP:", info.messageId);
          return info;
        } catch (smtpError) {
          console.warn(`[EMAIL-SMTP] SMTP delivery warning: ${smtpError.message}`);
        }
      }

      console.log(`[EMAIL-LOG] Email to ${to}: ${subject}`);
      return { messageId: "logged-" + Date.now() };
    },
    {
      fallback: (error) => {
        console.warn(`[EMAIL-CIRCUIT-FALLBACK] Email service degraded (${error?.message}). Logging email to console:`, { to, subject });
        return {
          messageId: "circuit-fallback-" + Date.now(),
          degraded: true,
          error: error?.message,
        };
      },
    }
  );
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

export default fallbackTransporter;