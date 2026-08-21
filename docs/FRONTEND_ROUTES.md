# NavGujarat Academy — Frontend Routes & Structure

This document outlines the React-based frontend architecture, including the routing configuration, component structure, and state management strategies used across the application.

---

## 1. Core Architecture

The frontend is built using **Vite + React 19** with **Tailwind CSS** for styling.

- **Routing:** Handled by `react-router-dom` using `BrowserRouter`.
- **State Management:** **Redux Toolkit** is used for global state (e.g., Auth state, Cart), while local state is managed via React hooks (`useState`, `useReducer`).
- **Code Splitting:** All major page components are lazily loaded using `React.lazy()` and wrapped in a `<Suspense>` boundary with a `<PageLoader />` fallback to minimize the initial JS payload.
- **Animations:** Powered by **GSAP** and **Framer Motion** for smooth transitions and scroll effects.

---

## 2. Route Configuration (`src/App.jsx`)

The application routes are wrapped in a shared `<Layout />` component that conditionally renders the `<Navbar />` and `<Footer />` based on the current path (e.g., hiding navigation in the Course Player or Login screens).

### 2.1 Public Routes
Accessible to unauthenticated visitors.

| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `Home` | Landing page (Pre-fetched immediately). |
| `/courses` | `Courses` | Public course catalog with filtering. |
| `/courses/:slug` | `CourseDetail` | Detailed landing page for a specific course. |
| `/playground` | `CodePlayground` | Public/Interactive code playground. |
| `/privacy`, `/terms`, `/help` | `LegalPrivacy`, etc. | Static content and support pages. |
| `/status` | `PlatformStatus` | System uptime and health status. |

### 2.2 Authentication Routes
Handled publicly, but redirects authenticated users away from them if already logged in.

| Path | Component | Description |
| :--- | :--- | :--- |
| `/login` | `Login` | Email/Password and Google OAuth login. |
| `/register` | `Register` | New account creation. |
| `/forgot-password` | `ForgotPassword` | Request password reset email. |
| `/reset-password/:userId/:token` | `ResetPassword` | Set new password. |
| `/verify-email/:userId/:token` | `VerifyEmail` | Account verification via email link. |

### 2.3 General Protected Routes
Require a valid JWT session. Accessible via the `<ProtectedRoute>` wrapper.

| Path | Component | Description |
| :--- | :--- | :--- |
| `/profile` | `Profile` | User account settings and avatar upload. |
| `/discussions` | `Discussions` | Community forum. |
| `/ai-chat` | `AiChat` | RAG-powered AI Assistant UI. |
| `/notifications` | `Notifications` | In-app notification center. |

### 2.4 Student-Specific Routes
Requires the `student` role (or higher).

| Path | Component | Description |
| :--- | :--- | :--- |
| `/dashboard` | `StudentDashboard` | Overview of progress and upcoming classes. |
| `/my-learning` | `MyLearning` | Enrolled courses grid. |
| `/learn/:courseId` | `CoursePlayer` | Core video playback and module navigation. |
| `/cart` / `/wishlist` | `Cart`, `Wishlist` | E-commerce purchasing workflows. |
| `/student/quizzes` | `StudentQuizzes` | Active and past quiz attempts. |
| `/student/assignments` | `StudentAssignments` | Submissions and grades. |
| `/live-class/:liveClassId` | `LiveClassRoom` | WebRTC participant view via Stream.io. |
| `/student/notes` | `StudentNotes` | Time-stamped video notes. |

### 2.5 Instructor Routes
Requires the `instructor` or `admin` role.

| Path | Component | Description |
| :--- | :--- | :--- |
| `/instructor/dashboard` | `InstructorDashboard` | Revenue, enrollment analytics. |
| `/instructor/courses/new` | `CourseForm` | Draft a new course. |
| `/instructor/courses/:courseId/edit` | `CourseForm` | Update course metadata. |
| `/instructor/courses/:courseId/curriculum`| `Curriculum` | Build modules and upload lecture videos. |
| `/instructor/live-classes` | `InstructorLiveClasses` | Schedule and host WebRTC sessions. |
| `/instructor/quizzes` | `InstructorQuizzes` | Author assessments. |
| `/instructor/assignments` | `InstructorAssignments` | Grade student submissions. |

### 2.6 Admin Routes
Requires the `admin` role. Most admin routes load within a shared dashboard shell (`AdminPanel`).

| Path | Internal View / Component | Description |
| :--- | :--- | :--- |
| `/admin` | `AdminDashboard` | Platform-wide analytics and metrics. |
| `/admin/users` | `AdminUsers` | User management and ban/suspend controls. |
| `/admin/orders` | `AdminOrders` | Financial transactions and refunds. |
| `/admin/courses` | `AdminCourses` | Approve/Reject instructor courses. |
| `/admin/audit` | `AdminAuditLogs` | System activity monitoring. |
| `/admin/discussion-reports` | `AdminDiscussionReports`| Moderation queue for flagged content. |

---

## 3. Global State & API Integration

### 3.1 Redux Store (`src/store`)
- **`authSlice`**: Stores the current authenticated user's profile (`selectUser`), session loading state (`selectAuthLoading`), and handles asynchronous thunks like `fetchMe()`.

### 3.2 API Layer (`src/api`)
- All backend HTTP requests are centralized in the `src/api/` directory (e.g., `auth.api.js`, `course.api.js`).
- Uses `axios` with an interceptor (`axios.js`) configured to automatically attach credentials (cookies) and handle global error responses (like 401 Unauthorized redirecting to `/login`).

### 3.3 UI Components (`src/components`)
- **`ui/`**: Reusable base components (Buttons, Inputs, Modals, Spinners, Toast).
- **`layout/`**: `Navbar`, `Footer`, Sidebar menus.
- **`common/`**: `PrivacyBanner`, Error boundaries.
