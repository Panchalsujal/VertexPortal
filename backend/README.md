# NavGujarat Academy — Backend API Service

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.2.1-lightgrey.svg)](https://expressjs.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-v9.8.0-red.svg)](https://mongoosejs.com/)
[![Mistral AI](https://img.shields.io/badge/Mistral_AI-2.6.1-purple.svg)](https://mistral.ai/)
[![Stream.io](https://img.shields.io/badge/Stream.io_SDK-0.7.63-005fff.svg)](https://getstream.io/)

The backend service for NavGujarat Academy is an enterprise-grade RESTful API built on **Node.js (ESM)** and **Express 5.2**, powered by **MongoDB / Mongoose 9**, featuring integrated **WebRTC Live Classrooms (Stream.io)**, **Multimodal AI & RAG Search (Mistral AI)**, **Payment Processing (Razorpay)**, and **Verifiable PDF Generation (PDFKit & QRCode)**.

---

## 🛠️ Architecture & Structure

```
backend/
├── server.js                   # Server lifecycle, Mongo connection, cron initialization
└── src/
    ├── app.js                  # Express app setup, security middlewares, route mounting
    ├── config/
    │   ├── config.js           # Strict environment variable validation & export
    │   └── db.js               # MongoDB Mongoose connection handler
    ├── constants/              # System constants and enum definitions
    ├── controllers/            # 43 REST API controllers handling req/res cycles
    ├── jobs/                   # Background cron jobs (e.g. liveClassReminder.job.js)
    ├── middlewares/            # Auth, RBAC, Helmet, CORS, Rate Limiters, Sanitizers, Multer
    ├── models/                 # 36 Mongoose schema definitions with indexes and hooks
    ├── routes/                 # 44 Modular route groups
    ├── service/                # 50 Core business services (AI, Stream, Payment, PDF, etc.)
    ├── utils/                  # Utility helpers, response formatters, error classes
    └── validators/             # Request payload schemas (Zod & express-validator)
```

---

## 🔑 Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/navgujaratacademy?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5173

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Google OAuth2 / SMTP Email Service
EMAIL_USER=your_email@gmail.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
API_URL=http://localhost:3000

# ImageKit CDN
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_endpoint/

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_SECRET_ID=your_razorpay_secret_id

# Mistral AI (LLM, Embeddings & Audio Transcription)
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_CHAT_MODEL=mistral-large-latest
MISTRAL_TRANSCRIPTION_MODEL=voxtral-mini-latest

# Stream.io WebRTC Live Video SDK
STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server with auto-reload (Nodemon)
npm run dev

# Run production server
npm start
```

---

## 🔒 Security Features Implemented

1. **HttpOnly Cookie JWT Authentication:** Protects against client-side script token theft (XSS).
2. **MongoDB Operator Sanitization (`sanitizeInput`):** Recursively strips `$gt`, `$ne`, and regex query injection payloads.
3. **HTTP Parameter Pollution Protection (`hpp`):** Normalizes duplicated query params to prevent array spoofing.
4. **Rate Limiting Protection (`express-rate-limit`):**
   - Global: 300 req / 15 min
   - Auth (`/api/auth/*`): 15 req / 15 min
   - AI (`/api/ai/*`): 30 req / 1 min
   - Orders (`/api/checkout/*`, `/api/orders/*`): 20 req / 15 min
5. **Helmet Security Headers:** Content security and cross-origin resource isolation.

---

## 📑 API Endpoints Summary

See [`Apis.md`](../Apis.md) and [`docs/BACKEND_SCHEMA.md`](../docs/BACKEND_SCHEMA.md) for full API contracts and data models.
