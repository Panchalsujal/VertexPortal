import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/Toast';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchMe, selectUser, selectAuthLoading } from './store/slices/authSlice';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { PageLoader } from './components/ui/Spinner';
import { CookieConsent } from './components/common/PrivacyBanner';

// Eager Main Landing Page
import Home from './pages/Home';

// Lazy Loaded Pages (Code Splitting for Optimal Performance)
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const MyLearning = lazy(() => import('./pages/MyLearning'));
const CoursePlayer = lazy(() => import('./pages/CoursePlayer'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Profile = lazy(() => import('./pages/Profile'));
const InstructorDashboard = lazy(() => import('./pages/instructor/Dashboard'));
const CourseForm = lazy(() => import('./pages/instructor/CourseForm'));
const Curriculum = lazy(() => import('./pages/instructor/Curriculum'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));

const Notifications = lazy(() => import('./pages/Notifications'));
const Certificates = lazy(() => import('./pages/Certificates'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate'));
const StudentQuizzes = lazy(() => import('./pages/StudentQuizzes'));
const StudentAssignments = lazy(() => import('./pages/StudentAssignments'));
const StudentAnnouncements = lazy(() => import('./pages/StudentAnnouncements'));
const StudentLiveClasses = lazy(() => import('./pages/StudentLiveClasses'));
const InstructorQuizzes = lazy(() => import('./pages/instructor/InstructorQuizzes'));
const InstructorAssignments = lazy(() => import('./pages/instructor/InstructorAssignments'));
const InstructorLiveClasses = lazy(() => import('./pages/instructor/InstructorLiveClasses'));
const InstructorAnnouncements = lazy(() => import('./pages/instructor/InstructorAnnouncements'));
const LiveClassRoom = lazy(() => import('./pages/LiveClassRoom'));

const Discussions = lazy(() => import('./pages/Discussions'));
const StudentNotes = lazy(() => import('./pages/StudentNotes'));
const AiChat = lazy(() => import('./pages/AiChat'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminNotes = lazy(() => import('./pages/admin/AdminNotes'));
const AdminLiveAttendance = lazy(() => import('./pages/admin/AdminLiveAttendance'));
const CodePlayground = lazy(() => import('./pages/CodePlayground'));
const LegalPrivacy = lazy(() => import('./pages/LegalPrivacy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const PlatformStatus = lazy(() => import('./pages/PlatformStatus'));

// ─── Protected Route ─────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user || user.status === 'suspended' || user.status === 'inactive' || user.isActive === false) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ─── Layout ───────────────────────────────────────────────────────────────────
function Layout({ children }) {
  const location = useLocation();

  // Pages that use their own standalone layout (no shared navbar)
  const hideNavbar = (
    location.pathname.startsWith('/learn/') ||
    location.pathname.startsWith('/live-class') ||
    location.pathname === '/dashboard' ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/reset-password')
  );

  // Footer is shown ONLY on the Home / landing page ('/')
  const isFooterPage = location.pathname === '/';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className={`w-full overflow-x-hidden ${hideNavbar ? '' : 'min-h-[80vh]'}`}>{children}</main>
      {isFooterPage && <Footer />}
    </>
  );
}

// ─── Scroll To Top On Navigation / Reload ────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

// ─── Root ────────────────────────────────────────────────────────────────────
function AppRoot() {
  const dispatch = useAppDispatch();
  useEffect(() => { dispatch(fetchMe()); }, [dispatch]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster />
      <CookieConsent />
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            <Route path="/playground" element={<CodePlayground />} />
            <Route path="/privacy" element={<LegalPrivacy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/status" element={<PlatformStatus />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:userId/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:userId/:token" element={<VerifyEmail />} />
            <Route path="/verify-certificate/:verificationCode" element={<VerifyCertificate />} />
            <Route path="/certificates/verify/:verificationCode" element={<VerifyCertificate />} />

            {/* Student Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />

            {/* Feature Routes */}
            <Route path="/discussions" element={<ProtectedRoute><Discussions /></ProtectedRoute>} />
            <Route path="/student/notes" element={<ProtectedRoute allowedRoles={['student']}><StudentNotes /></ProtectedRoute>} />
            <Route path="/ai-chat" element={<ProtectedRoute><AiChat /></ProtectedRoute>} />

            {/* General Protected */}
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/certificates" element={<ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}><Certificates /></ProtectedRoute>} />

            {/* Student */}
            <Route path="/my-learning" element={<ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}><MyLearning /></ProtectedRoute>} />
            <Route path="/student/quizzes" element={<ProtectedRoute allowedRoles={['student']}><StudentQuizzes /></ProtectedRoute>} />
            <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={['student']}><StudentAssignments /></ProtectedRoute>} />
            <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['student']}><StudentAnnouncements /></ProtectedRoute>} />
            <Route path="/student/live-classes" element={<ProtectedRoute allowedRoles={['student']}><StudentLiveClasses /></ProtectedRoute>} />
            <Route path="/live-class/:liveClassId" element={<ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}><LiveClassRoom /></ProtectedRoute>} />
            <Route path="/live-class/stream/:liveClassId" element={<ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}><LiveClassRoom /></ProtectedRoute>} />
            <Route path="/learn/:courseId" element={<ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}><CoursePlayer /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute allowedRoles={['student']}><Cart /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute allowedRoles={['student']}><Wishlist /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Instructor */}
            <Route path="/instructor/dashboard" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><InstructorDashboard /></ProtectedRoute>} />
            <Route path="/instructor/quizzes" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><InstructorQuizzes /></ProtectedRoute>} />
            <Route path="/instructor/assignments" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><InstructorAssignments /></ProtectedRoute>} />
            <Route path="/instructor/live-classes" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><InstructorLiveClasses /></ProtectedRoute>} />
            <Route path="/instructor/announcements" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><InstructorAnnouncements /></ProtectedRoute>} />
            <Route path="/instructor/courses/new" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><CourseForm /></ProtectedRoute>} />
            <Route path="/instructor/courses/:courseId/edit" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><CourseForm /></ProtectedRoute>} />
            <Route path="/instructor/courses/:courseId/curriculum" element={<ProtectedRoute allowedRoles={['instructor', 'admin']}><Curriculum /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/panel" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/panel?tab=categories" replace /></ProtectedRoute>} />
            <Route path="/admin/coupons" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/panel?tab=coupons" replace /></ProtectedRoute>} />
            <Route path="/admin/certificates" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/panel?tab=certificates" replace /></ProtectedRoute>} />
            <Route path="/admin/instructors" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/users?role=instructor" replace /></ProtectedRoute>} />
            <Route path="/admin/enrollments" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/orders" replace /></ProtectedRoute>} />
            <Route path="/admin/lectures" element={<ProtectedRoute allowedRoles={['admin']}><Navigate to="/admin/courses" replace /></ProtectedRoute>} />
            <Route path="/admin/live-classes" element={<ProtectedRoute allowedRoles={['admin']}><InstructorLiveClasses /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin']}><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['admin']}><AdminAuditLogs /></ProtectedRoute>} />
            <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['admin']}><AdminReviews /></ProtectedRoute>} />
            <Route path="/admin/discussions" element={<ProtectedRoute allowedRoles={['admin']}><Discussions /></ProtectedRoute>} />
            <Route path="/admin/notes" element={<ProtectedRoute allowedRoles={['admin']}><AdminNotes /></ProtectedRoute>} />
            <Route path="/admin/live-attendance" element={<ProtectedRoute allowedRoles={['admin', 'instructor']}><AdminLiveAttendance /></ProtectedRoute>} />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default AppRoot;
