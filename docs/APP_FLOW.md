# NavGujarat Academy — Application Flows & User Journeys

**Document Version:** 2.0.0  
**Target:** Visual & Architectural User Flows across All Roles  
**Status:** Approved for Production  

---

## 1. Overall System Architecture & Role Navigation Map

```mermaid
flowchart TD
    User([Visitor / User]) --> AuthDecision{Authenticated?}
    
    AuthDecision -- No --> PublicPages[Public Catalog / Course Details / Landing Page]
    PublicPages --> AuthModal[Register / Login / Verify Email]
    
    AuthDecision -- Yes --> RoleCheck{User Role}
    
    RoleCheck -- Student --> StudentHub[Student Dashboard]
    StudentHub --> EnrolledCourses[My Learning / Course Player]
    StudentHub --> LiveClasses[Live WebRTC Classes]
    StudentHub --> AIPlayground[AI Tutor & Code Playground]
    StudentHub --> Assessments[Quizzes & Assignments]
    StudentHub --> Certs[My Certificates / Verification]
    StudentHub --> Discussions[Community Discussions]
    StudentHub --> Notes[Timestamped Notes]
    
    RoleCheck -- Instructor --> InstructorHub[Instructor Dashboard]
    InstructorHub --> CourseBuilder[Create / Edit Course & Curriculum]
    InstructorHub --> HostLive[Schedule & Host Live Class]
    InstructorHub --> QuizBuilder[Author & Review Quizzes]
    InstructorHub --> GradeAssignments[Grade Student Submissions]
    InstructorHub --> Broadcasts[Course Announcements]
    
    RoleCheck -- Admin --> AdminHub[Admin Command Center]
    AdminHub --> UserManagement[Manage Users & Roles]
    AdminHub --> FinancialAnalytics[Orders, Revenue & Coupons]
    AdminHub --> CourseModeration[Course Approvals & Categories]
    AdminHub --> AuditLogs[System Audit Trail]
    AdminHub --> DiscussionModeration[Handle Reports & Flagged Posts]
```

---

## 2. Authentication & Email Verification Journey

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Student/Instructor)
    participant Client as React Client
    participant API as Express Auth API
    participant DB as MongoDB
    participant Mailer as Google OAuth Mailer

    User->>Client: Enters Name, Email, Password, Role
    Client->>API: POST /api/auth/register
    API->>DB: Check if email exists
    DB-->>API: Email available
    API->>API: Hash password (Bcrypt) + Generate Verification Token
    API->>DB: Save User (isActive=true, isEmailVerified=false)
    API->>Mailer: Send Verification Email with Link
    API-->>Client: 201 Created ("Please verify your email")
    
    User->>User: Opens Email & Clicks Verification Link
    User->>Client: Navigates to /verify-email/:userId/:token
    Client->>API: POST /api/auth/verify-email
    API->>DB: Find user & validate token
    API->>DB: Update isEmailVerified = true
    API-->>Client: 200 Success
    
    User->>Client: Submits Login Credentials
    Client->>API: POST /api/auth/login
    API->>DB: Verify credentials & role status
    API->>API: Generate JWT Token
    API-->>Client: Sets HttpOnly `token` cookie + Returns User Profile
    Client->>Client: Dispatches `fetchMe` & redirects to role dashboard
```

---

## 3. Course Enrollment, Coupon & Razorpay Checkout Flow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant Client as React Client (Cart/Checkout)
    participant API as Express Order API
    participant Razorpay as Razorpay Gateway
    participant DB as MongoDB

    Student->>Client: Adds Course to Cart & Proceeds to Checkout
    Student->>Client: Enters Coupon Code (Optional)
    Client->>API: POST /api/coupons/validate
    API->>DB: Check coupon validity, min spend, expiry, usage limit
    API-->>Client: Coupon applied with discounted total
    
    Client->>API: POST /api/checkout/create-order
    API->>DB: Calculate final pricing
    API->>Razorpay: razorpay.orders.create({ amount, currency: "INR" })
    Razorpay-->>API: Returns Razorpay Order ID
    API->>DB: Create Pending Order Record
    API-->>Client: Returns Order ID, Amount, Key ID
    
    Client->>Student: Opens Razorpay Checkout Modal
    Student->>Razorpay: Completes Payment (UPI / Card / NetBanking)
    Razorpay-->>Client: Returns payment_id, order_id, signature
    
    Client->>API: POST /api/checkout/verify-payment
    API->>API: Verify HMAC SHA-256 Signature
    API->>DB: Update Order (status: "completed")
    API->>DB: Create/Update Enrollment records
    API->>DB: Record Coupon Usage (if applied)
    API-->>Client: 200 Payment Verified
    Client->>Student: Redirects to /my-learning with enrolled course unlocked
```

---

## 4. Course Player, Granular Progress & Certificate Issuance

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student
    participant Player as React CoursePlayer
    participant API as Express API
    participant DB as MongoDB
    participant CertService as PDFKit & QR Engine

    Student->>Player: Plays Video Lecture
    Player->>Player: Periodic heartbeat (every 10s of playback)
    Player->>API: POST /api/lecture-progress/update
    API->>DB: Upsert LectureProgress (watchTime, isCompleted)
    
    Player->>Player: Video reaches 90% or completes
    Player->>API: POST /api/lecture-progress/complete
    API->>DB: Mark lecture completed
    API->>API: Recalculate Course Enrollment Completion %
    
    alt Course Progress Reaches 100%
        API->>DB: Mark Enrollment as Completed
        API->>CertService: Generate Certificate PDF with QR Code
        CertService->>DB: Save Certificate (Unique verificationCode, pdfUrl)
        API->>DB: Send in-app Notification ("Certificate Issued!")
        API-->>Player: Return updated progress + Certificate Available
        Player->>Student: Confetti animation + "Download Certificate" banner
    end
```

---

## 5. Multimodal AI Assistant & RAG Knowledge Search

```mermaid
flowchart TD
    subgraph Ingestion [Background Ingestion Pipeline]
        Upload[Instructor Uploads Video/PDF] --> Transcribe[FFmpeg extracts audio -> Mistral Voxtral transcribes]
        Upload --> ParsePDF[Unpdf extracts text pages]
        Transcribe & ParsePDF --> Chunker[Segment into 500-token chunks with 50-token overlap]
        Chunker --> Embedder[Mistral Embeddings API: mistral-embed]
        Embedder --> VectorDB[(MongoDB: ragchunks collection)]
    end

    subgraph Query [Student Query Flow]
        StudentPrompt[Student types query in AI Chat / Course Player] --> PromptEmbed[Generate Vector for Prompt]
        PromptEmbed --> VectorSearch[Cosine Similarity Search against Course RAG Chunks]
        VectorDB --> VectorSearch
        VectorSearch --> TopChunks[Retrieve Top-5 Relevant Chunks + Timestamps]
        TopChunks --> PromptConstructor[Assemble System Prompt + Context Chunks + Conversation History]
        PromptConstructor --> MistralLLM[Mistral Large Latest Model]
        MistralLLM --> StreamResponse[Stream Markdown Response to Student UI with Citations & Timestamp Links]
    end
```

---

## 6. Real-Time Live WebRTC Classroom Flow

```mermaid
sequenceDiagram
    autonumber
    actor Instructor as Instructor (Host)
    actor Student as Student (Participant)
    participant Client as React Client (@stream-io/video-react-sdk)
    participant API as Express Live Class API
    participant Stream as Stream.io Edge Video Network
    participant DB as MongoDB

    Instructor->>API: POST /api/instructor/live-classes (Title, Course, StartTime)
    API->>Stream: Create Call Channel (type: 'default', callId: roomId)
    API->>DB: Save LiveClass (status: 'scheduled')
    
    Note over API: Cron Job runs every minute -> Sends email reminders 15m prior
    
    Instructor->>Client: Enters /live-class/:id (Starts Class)
    Client->>API: GET /api/live-classes/:id/join-token
    API->>Stream: Generate Host Token with Admin permissions
    API-->>Client: Returns Stream Token & Call Config
    Client->>Stream: Join Call & Start Publishing Video/Audio
    
    Student->>Client: Enters /live-class/:id
    Client->>API: GET /api/live-classes/:id/join-token
    API->>Stream: Generate Participant Token
    API->>DB: Record LiveClassAttendance (joinedAt: now)
    API-->>Client: Returns Stream Token
    Client->>Stream: Join Call as Viewer/Participant
    
    Instructor->>Client: Ends Call
    Client->>API: POST /api/instructor/live-classes/:id/end
    API->>Stream: Terminate Call Session
    API->>DB: Update LiveClass (status: 'completed', endedAt: now)
    API->>DB: Calculate duration for all attendance records
```

---

## 7. Assessment Engine & Grading Lifecycle

```mermaid
flowchart TD
    Start([Instructor Creates Assessment]) --> TypeDecision{Assessment Type}
    
    TypeDecision -- Quiz --> QuizConfig[Set Questions, Multiple Choices, Pass Score, Timer]
    QuizConfig --> AIQuizOpt{Use AI Quiz Gen?}
    AIQuizOpt -- Yes --> AIQuizService[Mistral AI reads lecture transcripts & creates 10 questions]
    AIQuizOpt -- No --> ManualQuiz[Manual question authoring]
    AIQuizService & ManualQuiz --> PublishQuiz[Publish Quiz to Course Module]
    
    PublishQuiz --> StudentAttempt[Student starts Quiz Attempt]
    StudentAttempt --> TimedSession[Timer countdown runs in client]
    TimedSession --> SubmitAnswers[Student Submits Answers]
    SubmitAnswers --> AutoGrade[Backend compares answers with answer keys]
    AutoGrade --> PassCheck{Score >= Passing Score?}
    PassCheck -- Yes --> PassOutcome[Quiz Marked Passed + Progress Updated]
    PassCheck -- No --> FailOutcome[Quiz Marked Failed + Retake Allowed if attempts remain]
    
    TypeDecision -- Assignment --> AssignConfig[Define Task, Rubrics, Due Date & Attachments]
    AssignConfig --> PublishAssign[Publish Assignment]
    PublishAssign --> StudentSubmit[Student uploads submission file: PDF/ZIP]
    StudentSubmit --> InstructorReview[Instructor reviews submission file in Dashboard]
    InstructorReview --> EnterGrade[Instructor provides Grade & Feedback]
    EnterGrade --> NotifyStudent[Student receives Grade Notification]
```
