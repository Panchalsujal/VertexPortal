# NavGujarat Academy — Technical Requirements Document (TRD)

**Document Version:** 2.0.0  
**Target System:** NavGujarat Academy Micro-Monorepo Architecture  
**Owner:** Principal System Architect & Engineering Leads  
**Status:** Approved for Production  

---

## 1. System Architecture Overview

NavGujarat Academy is designed as a decoupled client-server architecture with an asynchronous event-driven service layer and specialized edge integrations for video WebRTC and AI processing.

```
                                  +---------------------------------------+
                                  |         Client Applications           |
                                  |   (React 19 / Vite SPA, Responsive)  |
                                  +-------------------+-------------------+
                                                      |
                                      HTTPS / WSS / REST API (JWT HttpOnly)
                                                      |
                                  +-------------------v-------------------+
                                  |          Express 5.2 API Server       |
                                  |  (Security: Helmet, HPP, Sanitizers)  |
                                  +-------------------+-------------------+
                                                      |
                   +----------------------------------+----------------------------------+
                   |                                  |                                  |
         +---------v---------+              +---------v---------+              +---------v---------+
         |  Business Logic   |              | Background Jobs   |              |  Real-Time & Edge |
         |  Services Layer   |              |  (Cron Schedulers)|              |  Integration Hub  |
         +---------+---------+              +---------+---------+              +---------+---------+
                   |                                  |                                  |
     +-------------+-------------+                    |                    +-------------+-------------+
     |             |             |                    |                    |             |             |
+----v----+   +----v----+   +----v----+          +----v----+          +----v----+   +----v----+   +----v----+
| Mongo   |   | ImageKit|   | Razorpay|          | Class   |          | Stream  |   | Mistral |   | PDFKit  |
| DB Atlas|   | Media   |   | Gateway |          | Reminder|          | WebRTC  |   | AI RAG  |   | / QRCode|
+---------+   +---------+   +---------+          +---------+          +---------+   +---------+   +---------+
```

---

## 2. Frontend Technical Architecture

### 2.1 Core Framework & Tooling
- **React 19.2.8 & Vite 8.2.0:** Utilizing modern JSX runtime, Suspense boundaries, and zero-bundle-overhead development server with ES Modules (ESM).
- **React Router DOM 7.18.2:** Client-side route tree featuring declarative layout wrappers and route guards (`ProtectedRoute`).
- **TailwindCSS v4.3.3 & CSS Variables:** Next-gen CSS-first Tailwind engine with CSS custom properties (`--vp-primary`, `--vp-bg`, `--vp-surface`) powering uniform design tokens.

### 2.2 State Management Pattern (Redux Toolkit 2.12.0)
- The global store is partitioned into domain-specific slices:
  - `authSlice`: Handles user credentials, login/register thunks, and auto-session verification (`fetchMe`).
  - `coursesSlice`: Caches public and enrolled course catalogs, active filters, and search results.
  - `discussionsSlice`: Handles Q&A threads, live upvoting, pagination, and comment submissions.
  - `notesSlice`: Manages lecture timestamped notes with optimistic state updates.
  - `aiSlice`: Manages multi-turn conversation states, active course context, and streaming response buffers.
  - Domain sub-slices: `instructor/*`, `student/*`, and `admin/*`.

### 2.3 Network Layer & Axios Interceptors (`frontend/src/api/axios.js`)
- Single pre-configured Axios instance with `baseURL: import.meta.env.VITE_API_URL || '/api'` and `withCredentials: true`.
- **Response Interceptor:** Automatically catches `401 Unauthorized` responses and cleans auth state, redirecting to `/login` when token expires.

---

## 3. Backend Technical Architecture

### 3.1 Server & Routing Pattern (Express 5.2.1)
- **Native Async Error Handling:** Express 5 eliminates the need for async-wrap boilerplate; thrown errors automatically propagate to the global error middleware.
- **Route Mounting Hierarchy:** Specific administrative sub-routes (e.g., `/api/admin/dashboard`, `/api/admin/users`, `/api/admin/orders`) are mounted before wildcard `/api/admin` routes to prevent route collisions.

### 3.2 Security Pipeline (`backend/src/middlewares/`)
1. **`helmet`**: Sets secure HTTP response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`).
2. **`cors`**: Dynamic origin resolver validating against whitelist and regex matching Vercel preview environments.
3. **`express-rate-limit`**:
   - `globalLimiter`: 300 requests per 15 minutes per IP.
   - `authLimiter`: 15 requests per 15 minutes per IP (protects `/login` and `/register`).
   - `aiLimiter`: 30 requests per minute per IP (protects LLM endpoints from token exhaustion).
   - `orderLimiter`: 20 requests per 15 minutes per IP (prevents payment spam).
4. **`hpp`**: Protects against HTTP Parameter Pollution.
5. **`sanitizeInput`**: Recursively removes `$`, `.`, and MongoDB query operators from `req.body`, `req.query`, and `req.params`.
6. **`auth.middleware.js`**: Extracts JWT from `req.cookies.token` or `Bearer` header, verifies signature, and attaches `req.user`.
7. **`authorize.middleware.js` & `role.middleware.js`**: Enforces role access (`student`, `instructor`, `admin`).

---

## 4. Specialized Subsystem Engineering

### 4.1 Live WebRTC Classroom (Stream.io Integration)
- **Token Generation:** `stream.service.js` generates cryptographically signed user tokens using `StreamClient(STREAM_API_KEY, STREAM_API_SECRET)`.
- **Channel Provisioning:** Automatic creation of audio/video rooms with call types `default` or `livestream`.
- **Attendance Worker:** Tracks client join/leave events, computes participant active duration, and marks attendance status.

### 4.2 Multimodal AI & RAG Engine (Mistral AI)
- **Audio Extraction & Transcription:** Uploaded lecture videos are processed using `ffmpeg-static` to isolate 16kHz mono audio streams. The audio is transcribed using Mistral's Voxtral model.
- **Document Text Extraction:** Lecture PDF attachments are parsed using `unpdf` to extract raw text pages.
- **Chunking & Vectorization:** Text is segmented into 500-token chunks with 50-token overlap. Vector embeddings are generated using Mistral Embedding API (`mistral-embed`) and stored in the `ragchunks` MongoDB collection.
- **Context Retrieval & Generation:** Queries calculate Cosine Similarity between the prompt vector and indexed chunks. The top-k matching chunks are injected into the system prompt for high-precision, hallucination-free answers.

### 4.3 Payment & Invoicing Pipeline (Razorpay)
- **Order Creation:** Verifies course pricing, validates active coupon discounts, calculates total payable amount, and generates Razorpay Order ID.
- **Signature Verification:** Computes HMAC SHA-256 signature using `RAZORPAY_SECRET_ID` to verify payment authenticity before creating `Order` and `Enrollment` records.

### 4.4 Automated PDF Certificate & QR Verification
- **Dynamic Vector Engine:** Uses `pdfkit` to render vector certificates containing student name, course title, completion date, and instructor signatures.
- **QR Code Generation:** Generates high-density QR code via `qrcode` that resolves directly to `https://<domain>/verify-certificate/<verificationCode>`.

---

## 5. Standardized API Response Protocol

All API responses follow a strict envelope structure:

### Success Response (`200`, `201`)
```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Error Response (`400`, `401`, `403`, `404`, `422`, `500`)
```json
{
  "success": false,
  "message": "Detailed error message explaining the failure",
  "errors": [
    {
      "field": "email",
      "message": "Email is already registered"
    }
  ]
}
```

---

## 6. Environment & Configuration Specifications

| Key | Description | Required Environment |
|---|---|---|
| `MONGO_URI` | MongoDB Connection URI (Atlas / Local) | Backend |
| `JWT_SECRET` | Secret key for signing JWT tokens | Backend |
| `JWT_EXPIRES_IN` | Token lifespan (e.g., `7d`) | Backend |
| `EMAIL_USER` | Gmail/SMTP email address for notifications | Backend |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` | Google OAuth2 credentials for transactional emails | Backend |
| `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_PRIVATE_KEY` / `IMAGEKIT_URL_ENDPOINT` | ImageKit CDN media storage | Backend |
| `RAZORPAY_KEY_ID` / `RAZORPAY_SECRET_ID` | Razorpay payment credentials | Backend |
| `MISTRAL_API_KEY` | Mistral AI API key for embeddings, chat, and transcription | Backend |
| `STREAM_API_KEY` / `STREAM_API_SECRET` | Stream.io credentials for live WebRTC video | Backend |
| `VITE_API_URL` | Base API URL pointing to Express backend | Frontend |
| `VITE_STREAM_API_KEY` | Public Stream.io key for client video SDK | Frontend |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay key ID for checkout modal | Frontend |
