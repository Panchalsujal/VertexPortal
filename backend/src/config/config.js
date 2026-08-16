import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined in the environment variables");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

if (!process.env.JWT_EXPIRES_IN) {
  throw new Error("JWT_EXPIRES_IN is not defined in the environment variables");
}

// Email configuration: At least RESEND_API_KEY, GOOGLE OAuth, or SMTP is recommended.
if (!process.env.RESEND_API_KEY && !process.env.GOOGLE_CLIENT_ID && !process.env.EMAIL_USER && !process.env.SMTP_HOST) {
  console.warn("[CONFIG-WARNING] No email provider configured (RESEND_API_KEY, GOOGLE OAuth, or SMTP). Email sending will fallback to mock/logging.");
}
if (!process.env.API_URL) {
  throw new Error("API_URL is not defined in the environment variables");
}

if (!process.env.IMAGEKIT_PUBLIC_KEY) {
  throw new Error(
    "IMAGEKIT_PUBLIC_KEY is not defined in the environment variables",
  );
}

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
  throw new Error(
    "IMAGEKIT_PRIVATE_KEY is not defined in the environment variables",
  );
}
if (!process.env.IMAGEKIT_URL_ENDPOINT) {
  throw new Error(
    "IMAGEKIT_URL_ENDPOINT is not defined in the environment variables",
  );
}

if (!process.env.RAZORPAY_KEY_ID) {
  throw new Error(
    "RAZORPAY_KEY_ID is not defined in the environment variables",
  );
}

if (!process.env.RAZORPAY_SECRET_ID) {
  throw new Error(
    "RAZORPAY_SECRET_ID is not defined in the environment variables",
  );
}

if (!process.env.FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not defined in the environment variables");
}

if (!process.env.PORT) {
  throw new Error("PORT is not defined in the environment variables");
}

if (!process.env.MISTRAL_API_KEY) {
  throw new Error(
    "MISTRAL_API_KEY is not defined in the environment variables",
  );
}

if (!process.env.MISTRAL_CHAT_MODEL) {
  throw new Error(
    "MISTRAL_CHAT_MODEL is not defined in the environment variables",
  );
}

if (!process.env.MISTRAL_TRANSCRIPTION_MODEL) {
  throw new Error(
    "MISTRAL_TRANSCRIPTION_MODEL is not defined in the environment variables",
  );
}

if (!process.env.STREAM_API_KEY) {
  throw new Error("STREAM_API_KEY is not defined in the environment variables");
}

if (!process.env.STREAM_API_SECRET) {
  throw new Error(
    "STREAM_API_SECRET is not defined in the environment variables",
  );
}

export const config = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  EMAIL_USER: process.env.EMAIL_USER,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || (process.env.EMAIL_USER ? `"Vertex LMS" <${process.env.EMAIL_USER}>` : "Vertex LMS <onboarding@resend.dev>"),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  API_URL: process.env.API_URL,
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY?.trim(),
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY?.trim(),
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT?.trim(),
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_SECRET_ID: process.env.RAZORPAY_SECRET_ID,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  PORT: process.env.PORT || 3000,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  MISTRAL_CHAT_MODEL: process.env.MISTRAL_CHAT_MODEL || "mistral-large-latest",
  MISTRAL_TRANSCRIPTION_MODEL:
    process.env.MISTRAL_TRANSCRIPTION_MODEL || "voxtral-mini-latest",
  STREAM_API_KEY: process.env.STREAM_API_KEY,
  STREAM_API_SECRET: process.env.STREAM_API_SECRET,
};
