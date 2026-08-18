# NavGujarat Academy — Frontend Client Application

[![React](https://img.shields.io/badge/React-v19.2.8-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8.2.0-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.3.3-38bdf8.svg)](https://tailwindcss.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-v2.12.0-764ABC.svg)](https://redux-toolkit.js.org/)
[![Stream Video SDK](https://img.shields.io/badge/Stream_Video_React-v1.40.2-005fff.svg)](https://getstream.io/video/)

The frontend client for NavGujarat Academy is a modern Single Page Application (SPA) built on **React 19**, **Vite 8**, **TailwindCSS v4**, and **Redux Toolkit 2.12**, featuring interactive video learning, real-time WebRTC live classes, an in-browser code execution playground, and conversational AI tutoring.

---

## 🛠️ Project Structure

```
frontend/
├── index.html                  # HTML entry with font preconnects
├── vite.config.js              # Vite bundler & TailwindCSS v4 plugin config
└── src/
    ├── App.jsx                 # Route definitions, layout logic & ProtectedRoute guards
    ├── main.jsx                # React root mount with Redux Provider
    ├── index.css               # LearnOVA design system CSS variables & base styles
    ├── api/                    # Axios API client instances and endpoint helpers
    ├── components/
    │   ├── admin/              # Admin dashboard cards, data tables, modal dialogs
    │   ├── course/             # Course card, filter bar, search drawer
    │   ├── layout/             # Navbar, Footer, Sidebar, Page wrappers
    │   ├── ui/                 # Buttons, Loaders, Modal dialogs, Badges
    │   └── MarkdownRenderer.jsx# Streaming Markdown & syntax highlighter
    ├── hooks/                  # Custom React hooks (e.g. useDebounce, useAuth)
    ├── pages/                  # 24+ Top-level page views
    │   ├── admin/              # Admin Panel, Analytics, Users, Orders, Audit Logs
    │   ├── instructor/         # Dashboard, CourseForm, Curriculum, Live Classes, Quizzes
    │   ├── CoursePlayer.jsx    # Immersive video player with notes, Q&A, and AI tutor
    │   ├── CodePlayground.jsx  # Interactive multi-language coding sandbox
    │   ├── LiveClassRoom.jsx   # Stream.io WebRTC live classroom
    │   ├── StudentDashboard.jsx# Student learning hub, stats, and course carousel
    │   └── ...                 # Auth, Catalog, Cart, Wishlist, Notifications, etc.
    └── store/
        ├── index.js            # Redux store configuration
        ├── hooks.js            # Typed `useAppDispatch` & `useAppSelector`
        └── slices/             # 17 domain-specific Redux Toolkit slices
```

---

## 🔑 Environment Configuration

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_STREAM_API_KEY=your_stream_api_key
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start Vite dev server with Hot Module Replacement (HMR)
npm run dev

# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🎨 Design System & Customization

The design system is centered around the **LearnOVA Design Language System (DLS)** defined in [`src/index.css`](./src/index.css) and documented in [`docs/UI_UX_DESIGN_BRIEF.md`](../docs/UI_UX_DESIGN_BRIEF.md).

- **Primary Accent:** `--vp-primary: #6C5CE7`
- **Backgrounds:** `--vp-bg: #f7f8fc` (Light) / `--vp-bg: #0f111a` (Dark)
- **Typography:** `Plus Jakarta Sans` for headers, `Inter` for body.
- **Components:** Fully responsive, accessible, and animated with micro-transitions.
