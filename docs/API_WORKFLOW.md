# NavGujarat Academy — API Workflows & Data Pipelines

This document details the step-by-step internal workflow for the core APIs in the backend. It traces the journey of a request from the client, through the middlewares, into the controller logic, database interactions, and the final response.

---

## 1. Authentication & Security Workflow

### 1.1 User Registration (`POST /api/auth/register`)
**Trigger:** User submits the registration form on the frontend.
**Workflow:**
1. **Middleware (`registerValidator`):** Validates input format (email regex, password strength).
2. **Controller (`registerController`):**
   - Checks if a user with the normalized email already exists (`User.findOne`).
   - Hashes the password using `bcryptjs` (salt rounds: 12).
   - Generates a random `emailVerificationToken` and hashes it (SHA256) for DB storage.
   - Generates a unique referral code.
   - Saves the user to MongoDB (`User.create`) with `isEmailVerified: false` and `role: "student"`.
3. **External Service:** Calls `sendVerificationEmail` (via Nodemailer/Resend) to send the verification link to the user.
4. **Response:** Returns `201 Created` with a success message (excluding sensitive data).

### 1.2 User Login (`POST /api/auth/login`)
**Trigger:** User submits login credentials.
**Workflow:**
1. **Middleware:** Rate limiter (`authLimiter`) prevents brute-force attacks.
2. **Controller (`loginController`):**
   - Finds user by email, explicitly selecting hidden fields like `password`, `loginAttempts`, `lockoutUntil`, and `knownIPs`.
   - **Layer 1 Security (Account Lockout):** Checks if `lockoutUntil` is in the future. If yes, blocks access (`423 Locked`).
   - Compares the password hash using `bcrypt.compare`.
   - If incorrect: Increments `loginAttempts`. If attempts reach `MAX_LOGIN_ATTEMPTS`, sets `lockoutUntil` for 15 minutes. Returns `401 Unauthorized`.
   - If correct: Checks `isEmailVerified` and `isActive`.
   - **Layer 3 Security (IP Anomaly):** Extracts client IP. If the IP is not in `knownIPs`, adds it. If the user is an Admin/Instructor logging in from a new IP, fires an asynchronous alert email (`sendAdminLoginAlertEmail`).
   - Resets `loginAttempts` and `lockoutUntil`. Updates `lastLoginAt`.
3. **Session Generation:**
   - Generates a JWT (`generateToken`).
   - If Admin/Instructor, generates a second elevated JWT (`generateElevatedToken`).
4. **Response:** Attaches HTTP-Only, Secure cookies (`token`, `admin_session`) and returns `200 OK` with the user profile.

---

## 2. Course & Curriculum Workflow

### 2.1 Course Creation (`POST /api/courses`)
**Trigger:** Instructor/Admin creates a new course draft.
**Workflow:**
1. **Middleware:** `authMiddleware` (validates JWT), `roleMiddleware(['instructor', 'admin'])`.
2. **Controller (`createCourseController`):**
   - Validates required fields (title, category).
   - Generates a URL-friendly unique slug from the title using the `slugify` library.
   - Saves the course to MongoDB (`Course.create`) linking it to the instructor's `_id`. Default status is 'draft'.
3. **Response:** Returns `201 Created` with the new course object.

### 2.2 Adding Lectures with Video Upload (`POST /api/lectures/:moduleId/create-lecture` & `PATCH /api/lectures/:lectureId/upload-video`)
**Trigger:** Instructor adds a lecture and uploads a video file.
**Workflow:**
1. **Middleware:** `authMiddleware`, `roleMiddleware`. For the upload route, `multer` processes the `multipart/form-data`.
2. **Controller:**
   - Validates ownership (instructor must own the parent course).
   - The video is processed. The backend may stream the upload directly to ImageKit or a cloud bucket via `imagekit.js` service.
   - Upon successful upload, the returned URL and fileId are saved to the lecture document.
3. **Response:** Returns `200 OK` with the updated lecture object.

---

## 3. Order & Enrollment Workflow

### 3.1 Checkout Initialization (`POST /api/checkout/create-order`)
**Trigger:** Student initiates checkout from the cart.
**Workflow:**
1. **Middleware:** `authMiddleware`, `orderLimiter` (prevents spamming order creations).
2. **Controller (`createOrderController`):**
   - Retrieves the user's cart from DB.
   - Calculates total price. If a `couponCode` is provided, fetches it, validates applicability (expiry, usage limits, minimum spend), and applies the discount.
   - **Payment Gateway Integration:** Calls `razorpay.orders.create` with the final amount (in paise).
   - Creates a pending `Order` document in MongoDB storing the Razorpay Order ID and cart snapshot.
3. **Response:** Returns `200 OK` with Razorpay credentials (key, orderId) to open the frontend payment modal.

### 3.2 Payment Verification & Enrollment (`POST /api/checkout/verify-payment`)
**Trigger:** Razorpay triggers the success callback on the frontend, which calls this API.
**Workflow:**
1. **Middleware:** `authMiddleware`.
2. **Controller (`verifyPaymentController`):**
   - Verifies the HMAC SHA256 signature using the Razorpay API secret to ensure the payload wasn't tampered with.
   - Finds the corresponding `Order` in DB and updates its status to `completed`.
   - Iterates through the ordered courses and creates `Enrollment` documents for the student.
   - If a coupon was used, increments its `usageCount`.
   - Emits a notification to the student ("Course Purchased Successfully").
3. **Response:** Returns `200 OK`. The frontend redirects the user to the "My Learning" dashboard.

---

## 4. Learning Progress & Certification Workflow

### 4.1 Tracking Lecture Progress (`POST /api/lecture-progress/update` & `complete`)
**Trigger:** Video player sends heartbeat requests every X seconds, or when the video finishes.
**Workflow:**
1. **Middleware:** `authMiddleware`.
2. **Controller (`updateLectureProgressController`):**
   - Upserts a `LectureProgress` document for the specific student and lecture, updating `watchTime`.
   - When marked `complete`, the system triggers an asynchronous recalculation of the total course progress.
   - It counts completed lectures vs total published lectures in the course.
   - Updates the `progressPercentage` on the `Enrollment` document.
3. **Certificate Check:** If `progressPercentage` reaches 100%, the system automatically flags the enrollment as completed.

### 4.2 Certificate Generation (`GET /api/certificates/:courseId/download`)
**Trigger:** Student clicks "Download Certificate".
**Workflow:**
1. **Middleware:** `authMiddleware`.
2. **Controller (`downloadCertificateController`):**
   - Verifies the enrollment is 100% complete.
   - Uses `pdfkit` (Certificate Service) to generate a PDF certificate on the fly.
   - Embeds a unique verification QR Code generated via the `qrcode` library.
   - Streams the PDF buffer directly back to the client as a downloadable file, or uploads it to storage and returns the URL.

---

## 5. AI Assistant & RAG (Retrieval-Augmented Generation) Workflow

### 5.1 RAG Document Indexing (`POST /api/ai/indexing/process`)
**Trigger:** Admin/Instructor uploads a transcript or PDF for the AI to learn.
**Workflow:**
1. **Data Parsing:** `unpdf` extracts text from PDFs, or `ffmpeg` + Mistral extracts audio transcripts.
2. **Chunking:** Text is broken into ~500 token chunks with overlap.
3. **Embedding:** Chunks are sent to the Mistral Embeddings API (`mistral-embed`) to generate vector arrays.
4. **Vector Storage:** The vectors and metadata (courseId, timestamps) are stored in MongoDB.

### 5.2 AI Chat Query (`POST /api/ai/rag/query`)
**Trigger:** Student asks a question in the AI Chat pane.
**Workflow:**
1. **Middleware:** `authMiddleware`, `aiLimiter` (strict rate limiting to prevent API abuse).
2. **Controller (`ragQueryController`):**
   - Generates an embedding vector for the user's prompt using Mistral API.
   - Performs a Cosine Similarity Vector Search in MongoDB against the chunks related to the current course.
   - Retrieves the top 5 most relevant context chunks.
   - Assembles a system prompt: *"You are an AI tutor... Use this context to answer... [Context Data]"*.
   - Sends the assembled prompt to the Mistral LLM endpoint.
3. **Response:** The LLM's response is optionally streamed back to the client, complete with markdown formatting and timestamp citations linked to the exact video frame.

---

## 6. Live Class (WebRTC) Workflow

### 6.1 Starting a Live Class (`GET /api/instructor/live-classes/:id/join-token`)
**Trigger:** Instructor clicks "Start Class".
**Workflow:**
1. **Middleware:** `authMiddleware`, `roleMiddleware(['instructor'])`.
2. **Controller:**
   - Validates the class belongs to the instructor.
   - Calls the `Stream.io SDK` to generate an Admin Token for the specific call/room ID.
   - Updates the LiveClass document status to `live`.
3. **Response:** Returns the `streamToken`, which the React client uses to initialize the WebRTC publisher connection.

### 6.2 Student Joining (`GET /api/student/live-classes/:id/join-token`)
**Trigger:** Student enters the live class room.
**Workflow:**
1. **Middleware:** `authMiddleware`.
2. **Controller:**
   - Verifies the student is enrolled in the associated course.
   - Generates a Participant/Viewer Token via `Stream.io SDK`.
   - Creates a `LiveClassAttendance` record indicating join time.
3. **Response:** Returns the token allowing the student client to subscribe to the WebRTC video/audio tracks.
