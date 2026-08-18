# NavGujarat Academy — Product Requirements Document (PRD)

**Document Version:** 2.0.0  
**Target Product:** NavGujarat Academy Next-Gen LMS Platform  
**Owner:** Product & Engineering Teams  
**Status:** Approved for Production  

---

## 1. Product Overview & Vision

NavGujarat Academy is a modern, full-lifecycle Learning Management System (LMS) designed to deliver interactive, community-driven, and AI-powered education. Unlike traditional LMS platforms, NavGujarat Academy bridges asynchronous recorded video courses, synchronous live WebRTC streaming classrooms, conversational AI tutoring backed by Retrieval-Augmented Generation (RAG), gamified progress tracking, and instant verifiable credentialing.

---

## 2. Target User Personas

| Persona | Role | Key Objectives & Pain Points | Primary Features Used |
|---|---|---|---|
| **Learner (Student)** | End-User Student / Professional | Wants self-paced learning, interactive quizzes, instant AI clarification when stuck on code/concepts, live mentor sessions, verifiable certificates, and bookmarkable notes. | Course Player, AI Tutor Chat, Quizzes/Assignments, Live Classroom, Code Playground, Notes, Certificate Verification. |
| **Instructor (Creator)** | Course Author / Live Mentor | Wants intuitive course builder, video lecture uploads, auto-transcription, quiz/assignment authoring, live class scheduling with attendance tracking, student analytics, and announcement broadcasting. | Instructor Dashboard, Curriculum Builder, Quiz & Assignment Manager, Live Class Host Portal, Announcement Center. |
| **Administrator** | Platform Operator / Superuser | Requires complete oversight of users, revenue, transactions, refund requests, course approvals, platform-wide announcements, coupon promotions, moderation of discussion reports, and immutable audit logs. | Admin Dashboard, User Management, Course Moderation, Financial & Order Analytics, Audit Logs, Coupon Engine, Dispute Moderation. |

---

## 3. Core Feature Pillars & Functional Scope

### Pillar 1: Identity, Authentication & Role-Based Access Control (RBAC)
- **Email & Password Authentication:** Secure registration, bcrypt password hashing, JWT authentication stored in HttpOnly cookies, email verification workflows with expiring tokens.
- **Session & Profile Management:** Profile avatar uploads via ImageKit, password updates, biographical info, multi-device session revocation, account deactivation/suspension.
- **Role Enforcement:** Strict three-tier RBAC (`student`, `instructor`, `admin`) with middleware guards on API routes and client-side router navigation guards.

### Pillar 2: Course Catalog, Content Authoring & Curriculum Management
- **Hierarchical Curriculum:** Course -> Modules -> Lectures.
- **Rich Media Support:** Video streaming (HLS/MP4), downloadable PDF resources, lecture text descriptions, previewable trial lessons.
- **Course Discovery & Filtering:** Full-text search, multi-category taxonomy filters, difficulty filters (Beginner, Intermediate, Advanced), price sorting, and rating aggregations.
- **Instructor Curriculum Builder:** Drag-and-drop or sequential reordering of modules/lectures, bulk uploads, draft/publish lifecycle states.

### Pillar 3: Interactive Video Player & Learning Progression
- **Distraction-Free Course Player:** Fullscreen video player with playback rate controls, picture-in-picture, keyboard shortcuts, module drawer, and active lecture highlight.
- **Granular Progress Tracking:** Auto-saved progress percentages, resume-from-last-watched position, automated completion triggers when 100% of lectures are viewed.
- **Timestamped Student Notes:** Ability for students to capture private or public notes tied to exact video timestamps, exportable as Markdown/PDF.

### Pillar 4: Assessment & Evaluation Engine
- **Quizzes:** Timed assessments with multiple-choice, multiple-answer, true/false, and short-answer questions. Automated grading, immediate score computation, detailed answer explanations, and attempt limits.
- **Assignments:** Instructors define homework tasks with rubric criteria and deadline dates. Students upload submission files (PDF, ZIP, DOCX); instructors grade with qualitative feedback.
- **AI Quiz Generation:** One-click automated quiz generation from lecture transcripts using Mistral AI.

### Pillar 5: Real-Time Live Classroom (WebRTC Streaming)
- **Live Video Broadcasting:** Powered by Stream.io Video SDK for high-definition, low-latency audio/video communication.
- **Interactive Classroom Tools:** Screen sharing, live chat, hand raising, mic/camera controls, and participant roster.
- **Attendance & Reminders:** Automated attendance tracking (join time, duration, completion status) and background cron email reminders sent 15 minutes before scheduled start time.

### Pillar 6: AI Tutor & Multimodal RAG Assistant
- **Context-Aware AI Tutor:** Chat interface integrated into every course with Mistral AI integration.
- **Multimodal RAG Pipeline:** Automatically indexes PDF documents and lecture video transcripts into vector embeddings. When a student asks a question, the engine retrieves the most relevant lecture timestamps and context to generate accurate answers with citations.
- **Interactive Code Playground:** In-browser code editor with syntax highlighting, multi-language support (JavaScript, Python, HTML/CSS), and live execution preview.

### Pillar 7: Social Community, Discussions & Gamification
- **Course & Platform Discussions:** Nested thread discussions, code snippet formatting, upvoting, "Accepted Answer" designation by instructors.
- **Moderation Engine:** Community reporting system with reason classification (spam, offensive, plagiarism) and admin review workflows.
- **Gamification & Badges:** Learning streaks, points for lecture completions, quiz excellence badges, and leaderboards.

### Pillar 8: E-Commerce, Checkout & Automated Invoicing
- **Shopping Cart & Wishlist:** Multi-item cart, cross-device persistence, saved wishlist with instant move-to-cart.
- **Dynamic Coupon Engine:** Percentage or flat-rate discounts, minimum spend thresholds, usage limits, user-specific eligibility, and real-time coupon validation.
- **Razorpay Payment Gateway:** Secure checkout modal, signature verification, webhook reconciliation, and automated digital receipts.

### Pillar 9: Verifiable PDF Certificates
- **Automated Issuance:** Triggered upon 100% course completion and meeting minimum passing scores on required assessments.
- **Cryptographic Verification:** Each certificate has a unique UUID verification code and embedded QR code pointing to public verification URL (`/verify-certificate/:code`).
- **High-Resolution PDF Generation:** Programmatically generated vector certificates using PDFKit with stylized borders and instructor signatures.

### Pillar 10: Admin Command Center & Business Intelligence
- **Executive Analytics:** Total platform revenue, active student count, course enrollment velocity, instructor earnings breakdown, and churn trends.
- **User & Content Governance:** User role elevation/demotion, account ban/unban, course approval/rejection, review moderation.
- **Immutable Audit Trail:** Comprehensive event logging recording administrative actions, source IPs, affected documents, and timestamped diffs.

---

## 4. Non-Functional Requirements (NFRs)

| Attribute | Specification & Acceptance Criteria |
|---|---|
| **Performance** | API response times `< 200ms` for 95th percentile requests (excluding AI generation and video transcoding). Page load Time-to-Interactive (TTI) `< 1.8s`. |
| **Scalability** | Stateless Express backend capable of horizontal auto-scaling behind reverse proxies; MongoDB replica sets with read-write separation. |
| **Security & Privacy** | OWASP Top 10 compliance: Bcrypt hashing, HttpOnly secure cookies, parameterized queries to prevent NoSQL injection, HPP protection, CORS restrictions, rate limiting on sensitive routes. |
| **Availability & Reliability** | 99.9% uptime SLA. Graceful fallback on AI service timeouts or payment gateway failures. |
| **Responsive Design** | 100% fluid responsive UI across Mobile (320px+), Tablet (768px+), Laptop (1024px+), and Desktop (1440px+). |
| **Accessibility (a11y)** | WCAG 2.1 AA compliance: Semantic HTML5 landmarks, keyboard navigation, color contrast ratios `>= 4.5:1`, screen-reader aria attributes. |

---

## 5. Success Metrics & Key Performance Indicators (KPIs)

- **Course Completion Rate:** Target `> 65%` (industry average is ~15%).
- **AI Tutor Resolution Rate:** `> 80%` student queries answered without needing instructor intervention.
- **Checkout Conversion Rate:** `> 85%` of initiated cart checkouts successfully completed.
- **Live Class Attendance:** `> 75%` registered student attendance rate driven by automated cron reminders.
