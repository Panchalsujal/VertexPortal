# VertexPortal LMS — Next-Generation Learning Management System

<div align="center">

![VertexPortal Banner](https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop)

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.2.1-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v19.2.8-blue.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.3.3-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47a248.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**A high-performance, enterprise-ready LMS featuring real-time WebRTC live classrooms, multimodal AI tutor (RAG), automated PDF certificate generation with QR verification, gamified learning, and comprehensive e-commerce checkout.**

[Documentation Hub](#-documentation-hub) • [Key Features](#-key-features) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [API Overview](#-api-overview)

</div>

---

## 📚 Documentation Hub

Complete technical and product documentation is available in the [`docs/`](./docs) directory:

| Document | Description |
|---|---|
| 🔍 [**Comprehensive System Audit**](./docs/AUDIT.md) | Exhaustive step-by-step audit of all backend and frontend components, routes, security, and performance. |
| 📋 [**Product Requirements Document (PRD)**](./docs/PRD.md) | High-level product vision, user personas, functional specifications, and success KPIs. |
| 🏗️ [**Technical Requirements Document (TRD)**](./docs/TRD.md) | Low-level system architecture, protocols, data flows, and infrastructure specifications. |
| 🔄 [**Application Flows & User Journeys**](./docs/APP_FLOW.md) | Visual Mermaid flow diagrams covering Student, Instructor, Admin, AI, and Payment lifecycles. |
| 🎨 [**UI / UX Design Brief & Design System**](./docs/UI_UX_DESIGN_BRIEF.md) | Complete design token catalog, typography scales, color palettes, and component guidelines. |
| 🗄️ [**Backend Database Schema Reference**](./docs/BACKEND_SCHEMA.md) | Complete breakdown of all 36 Mongoose collections, field constraints, relationships, and ERD. |
| 🚀 [**Master Implementation Plan**](./docs/IMPLEMENTATION_PLAN.md) | Engineering roadmap, milestone timelines, testing strategy, and deployment topologies. |
| 📡 [**Full API Documentation**](./Apis.md) | Comprehensive 5,000+ line REST API endpoint catalog with request/response schemas. |

---

## ✨ Key Features

### 🎓 1. Student Experience
- **Distraction-Free Course Player:** Fullscreen video player with module navigation, playback speed controls, and active lecture highlight.
- **Granular Progress Tracking:** Heartbeat progress synchronization, resume-from-last-watched position, and automated completion computation.
- **Multimodal AI Tutor & RAG Search:** AI assistant powered by Mistral AI, answering questions using lecture video transcripts and attached PDF documents.
- **Live WebRTC Streaming Classrooms:** Ultra-low latency interactive classes powered by Stream.io with screen sharing and chat.
- **Assessments & Quizzes:** Timed assessments with automated grading, instant score breakdown, and attempt histories.
- **Assignments & Homework:** Upload student submissions (PDF/ZIP) with instructor grading and rubric feedback.
- **Timestamped Notes:** Create private or shared notes tied to exact video timestamps.
- **Verifiable PDF Certificates:** Automatically issued on course completion with unique QR codes for instant verification.
- **Interactive Code Playground:** In-browser coding sandbox supporting HTML/CSS/JS and multi-language execution.

### 👨‍🏫 2. Instructor Studio
- **Course & Curriculum Builder:** Drag-and-drop course, module, and lecture creation with video upload support.
- **AI Quiz Generator:** Automatically generates 10+ questions directly from lecture transcripts with one click.
- **Live Class Host Portal:** Schedule, manage, and host live video sessions with real-time participant attendance tracking.
- **Assignment Grading Studio:** Review student files, assign grades, and provide contextual feedback.
- **Broadcast Announcements:** Send course-wide updates with read-receipt tracking.

### 🛡️ 3. Admin Command Center
- **Executive Analytics:** Total platform revenue, active student count, course velocity, and instructor payouts.
- **User & Content Governance:** User role elevation/demotion, account ban/unban, course review and approval workflows.
- **Financial & Order Management:** Comprehensive order logs, coupon creation engine, and refund tracking.
- **Immutable Audit Trail:** Log of all administrative actions with actor IP, timestamp, and document diffs.
- **Dispute Moderation:** Handle community reports for flagged discussions and inappropriate comments.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                                  Frontend Tier                                    |
|              React 19.2 + Vite 8 + Redux Toolkit 2.12 + TailwindCSS v4            |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / REST / WSS (HttpOnly JWT)
+-----------------------------------------v-----------------------------------------+
|                                  Backend Tier                                     |
|         Node.js ESM + Express 5.2 (Security: Helmet, Rate Limiters, HPP)          |
+-----+-------------------+-------------------+-------------------+-----------------+
      |                   |                   |                   |
+-----v-----+       +-----v-----+       +-----v-----+       +-----v-----+
|  MongoDB  |       | Stream.io |       |  Mistral  |       | Razorpay  |
|   Atlas   |       |  WebRTC   |       |  AI RAG   |       | Payments  |
+-----------+       +-----------+       +-----------+       +-----------+
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** `v20.0.0` or higher
- **npm:** `v10.0.0` or higher
- **MongoDB:** Local instance or MongoDB Atlas Connection String
- **API Keys:** Stream.io, Mistral AI, Razorpay, ImageKit, Google OAuth (for Email)

### 1. Clone & Configure Environment Variables

```bash
# Clone the repository
git clone https://github.com/Panchalsujal/VertexPortal.git
cd VertexPortal

# Configure Backend Environment
cp backend/.env.example backend/.env
# (Fill in MONGO_URI, JWT_SECRET, STREAM_API_KEY, MISTRAL_API_KEY, RAZORPAY_KEY_ID, etc.)

# Configure Frontend Environment
cp frontend/.env.example frontend/.env
# (Set VITE_API_URL=http://localhost:3000/api)
```

### 2. Install Dependencies & Run Locally

#### Start Backend Server:
```bash
cd backend
npm install
npm run dev
# Server will run on http://localhost:3000
```

#### Start Frontend Client:
```bash
cd frontend
npm install
npm run dev
# Client will run on http://localhost:5173
```

---

## 📁 Repository Structure

```
VertexPortal/
├── docs/                      # Comprehensive Architecture & Project Docs
│   ├── AUDIT.md               # Step-by-step System Audit
│   ├── PRD.md                 # Product Requirements Document
│   ├── TRD.md                 # Technical Requirements Document
│   ├── APP_FLOW.md            # Mermaid App Flows & User Journeys
│   ├── UI_UX_DESIGN_BRIEF.md  # UI/UX Design System Brief
│   ├── BACKEND_SCHEMA.md      # Database Schema Reference (36 Models)
│   └── IMPLEMENTATION_PLAN.md # Engineering Roadmap & QA Strategy
├── backend/                   # Node.js / Express 5 API Server
│   ├── server.js              # Server entry point & cron jobs
│   ├── src/
│   │   ├── app.js             # Express app & security pipeline
│   │   ├── config/            # Database & env configuration
│   │   ├── controllers/       # 43 REST API Controllers
│   │   ├── jobs/              # Background cron schedulers
│   │   ├── middlewares/       # Auth, RBAC, rate-limiting, uploaders
│   │   ├── models/            # 36 Mongoose Models
│   │   ├── routes/            # 44 Modular Route files
│   │   ├── service/           # 50 Core Business Services
│   │   ├── utils/             # Helper utilities & PDF generators
│   │   └── validators/        # Zod & Express-validator schemas
├── frontend/                  # React 19 / Vite SPA
│   ├── src/
│   │   ├── App.jsx            # Route tree & navigation guards
│   │   ├── main.jsx           # Entry point
│   │   ├── index.css          # Design system tokens & base CSS
│   │   ├── api/               # Axios API client modules
│   │   ├── components/        # Layout, UI, Course, Admin components
│   │   ├── pages/             # 24+ Page Views (Student, Instructor, Admin)
│   │   └── store/             # Redux Toolkit store & slices
└── Apis.md                    # Complete 5000+ line API documentation
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
