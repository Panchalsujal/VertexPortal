# NavGujarat Academy — Frontend Client Workflows

This document outlines the core client-side logic, React component lifecycles, and data-flow for major features in the NavGujarat Academy frontend. It acts as the frontend counterpart to `API_WORKFLOW.md`.

---

## 1. Authentication & Session Management

### 1.1 Initial App Load & Session Restoration
**Workflow:**
1. **App Mount:** The `AppRoot` component mounts.
2. **Global Hook:** A `useEffect` inside `AppRoot` dispatches the `fetchMe()` Redux thunk.
3. **API Call:** The Axios instance makes a `GET /api/auth/me` request. The browser automatically attaches the `token` HTTP-Only cookie.
4. **State Update:** 
   - If successful, the `authSlice` is populated with the user profile (`user` object), and `loading` is set to `false`.
   - If it fails (401 Unauthorized), the `authSlice` clears the user state.
5. **Route Protection:** Components wrapped in `<ProtectedRoute>` observe the `authSlice`. If `loading` is false and no user exists, they trigger a `<Navigate>` redirect to `/login`, preserving the attempted URL in the router's `state.from` property.

### 1.2 Login Execution
**Workflow:**
1. **Form Submission:** User submits credentials in the `Login.jsx` component.
2. **API Call:** An Axios `POST` request is sent to `/api/auth/login`.
3. **Success Handling:**
   - The API returns a 200 OK and sets the cookie natively via the HTTP response headers.
   - The frontend dispatches `fetchMe()` immediately to fetch and store the new user profile in Redux.
   - Using React Router's `useNavigate`, the user is redirected to either their intended destination (`state.from`) or their role-specific dashboard (e.g., `/dashboard` for students).

---

## 2. E-Commerce & Checkout Flow

### 2.1 Cart Management (`Cart.jsx`)
**Workflow:**
1. **Local vs API State:** The cart is strictly synced with the backend. When a user clicks "Add to Cart", an API call is made. 
2. **Coupon Application:** Users can enter a coupon code in the Cart UI. This triggers a validation API call. If valid, the discounted total is stored in the component's local state to update the UI instantly.

### 2.2 Razorpay Integration Flow
**Workflow:**
1. **Initiate Checkout:** User clicks "Checkout". The frontend calls `POST /api/checkout/create-order`.
2. **API Response:** Receives a Razorpay `order_id` and the total `amount`.
3. **Load SDK:** The frontend dynamically injects the Razorpay checkout script (`checkout.js`) into the DOM if it isn't already loaded.
4. **Open Modal:** The `Razorpay` object is initialized with the backend `order_id`, API Key, and a `handler` callback function, opening the Razorpay UI overlay.
5. **Payment Completion:** Upon successful payment, Razorpay invokes the frontend `handler` with a `payment_id` and `signature`.
6. **Verification:** The frontend immediately sends these details to `POST /api/checkout/verify-payment`.
7. **Success:** Upon HTTP 200, a success Toast (`react-hot-toast`) is shown, and the user is redirected to `/my-learning`.

---

## 3. Course Player & Progress Tracking (`CoursePlayer.jsx`)

### 3.1 Layout & Content Rendering
**Workflow:**
1. **Initialization:** Component mounts and reads the `courseId` from the URL parameters.
2. **Data Fetching:** Fetches the complete course hierarchy (modules and nested lectures) and stores it in local component state.
3. **UI Split:** 
   - **Left Pane:** Video player (rendering HTML5 `<video>` or iframe depending on the source).
   - **Right Pane:** Accordion menu listing modules and lectures.

### 3.2 Progress Heartbeat
**Workflow:**
1. **Video Event Listeners:** The video player attaches listeners to the `timeupdate` and `ended` events.
2. **Throttled Updates:** As the user watches, a debounced/throttled API call (`POST /api/lecture-progress/update`) is fired (e.g., every 10-15 seconds) to persist watch time.
3. **Lecture Completion:** When the video reaches the end (or > 90% watched), a `complete` API call is fired. 
4. **UI Update:** The checkmark next to the lecture in the right pane turns green. If the course overall progress reaches 100%, a modal or banner is triggered allowing the student to view/download their certificate.

---

## 4. AI Assistant Chat (`AiChat.jsx`)

### 4.1 Chat Interface & Streaming
**Workflow:**
1. **UI Layout:** A standard chat interface with a message history array stored in local state (`useState`).
2. **Prompt Submission:** User sends a query. The message is immediately appended to the UI with a "user" role. A temporary "AI typing..." placeholder is added.
3. **API Request (RAG):** The frontend sends the query and the current `courseId` context to `POST /api/ai/rag/query`.
4. **Response Parsing:** 
   - If the backend uses Server-Sent Events (SSE) or chunked streaming, the frontend reads the stream via the Fetch API `ReadableStream` interface.
   - It incrementally updates the "AI typing..." message state in real-time as chunks arrive.
5. **Markdown Rendering:** The final AI response string is passed into the `react-markdown` component, which parses the markdown and renders HTML, properly formatting code blocks (`remark-gfm`), bold text, and lists.

---

## 5. Live Classes via WebRTC (`LiveClassRoom.jsx`)

### 5.1 Stream.io Video React SDK Integration
**Workflow:**
1. **Entry Point:** Instructor or Student navigates to `/live-class/:liveClassId`.
2. **Token Fetching:** A `useEffect` hook requests a join token from the backend (`GET /api/.../live-classes/:id/join-token`).
3. **Client Initialization:** The frontend initializes a `StreamVideoClient` instance using the returned token and the application's Stream API Key.
4. **Call Joining:** The `client.call('default', callId).join()` method is invoked.
5. **UI Rendering:** 
   - The component is wrapped in `<StreamVideo client={client}>` and `<StreamCall call={call}>` context providers.
   - Pre-built UI components from `@stream-io/video-react-sdk` (like `<SpeakerLayout />`, `<CallControls />`) are rendered to handle the complex video grid, screen sharing, and audio/video toggles natively.
6. **Cleanup:** When the component unmounts (user leaves the page), `call.leave()` is triggered to safely disconnect from the WebRTC mesh.
