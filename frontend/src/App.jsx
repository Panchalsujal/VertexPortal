import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchMe, selectUser, selectAuthLoading } from './store/slices/authSlice';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { PageLoader } from './components/ui/Spinner';

// Existing Pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import MyLearning from './pages/MyLearning';
import CoursePlayer from './pages/CoursePlayer';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import InstructorDashboard from './pages/instructor/Dashboard';
import CourseForm from './pages/instructor/CourseForm';
import Curriculum from './pages/instructor/Curriculum';
import AdminPanel from './pages/admin/AdminPanel';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';

import Notifications from './pages/Notifications';
import Certificates from './pages/Certificates';
import VerifyCertificate from './pages/VerifyCertificate';
import StudentQuizzes from './pages/StudentQuizzes';
import StudentAssignments from './pages/StudentAssignments';
import StudentAnnouncements from './pages/StudentAnnouncements';
import StudentLiveClasses from './pages/StudentLiveClasses';
import InstructorQuizzes from './pages/instructor/InstructorQuizzes';
import InstructorAssignments from './pages/instructor/InstructorAssignments';
import InstructorLiveClasses from './pages/instructor/InstructorLiveClasses';
import InstructorAnnouncements from './pages/instructor/InstructorAnnouncements';
import LiveClassRoom from './pages/LiveClassRoom';

// NEW PAGES (Sections 32-43)
import Discussions from './pages/Discussions';
import StudentNotes from './pages/StudentNotes';
import AiChat from './pages/AiChat';
import AdminUsers from './pages/admin/AdminUsers';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCourses from './pages/admin/AdminCourses';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminReviews from './pages/admin/AdminReviews';
import AdminNotes from './pages/admin/AdminNotes';
import AdminLiveAttendance from './pages/admin/AdminLiveAttendance';
import CodePlayground from './pages/CodePlayground';

// ─── Protected Route ─────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const user    = useAppSelector(selectUser);
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
    location.pathname === '/register'
  );

  // Footer is ONLY visible on the Landing Page ('/')
  const isLandingPage = location.pathname === '/';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className={`w-full overflow-x-hidden ${hideNavbar ? '' : 'min-h-[80vh]'}`}>{children}</main>
      {isLandingPage && <Footer />}
    </>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
function AppRoot() {
  const dispatch = useAppDispatch();
  useEffect(() => { dispatch(fetchMe()); }, [dispatch]);

  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            fontSize: '0.875rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          },
        }}
      />
      <Layout>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/playground" element={<CodePlayground />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email/:userId/:token" element={<VerifyEmail />} />
          <Route path="/verify-certificate/:verificationCode" element={<VerifyCertificate />} />
          <Route path="/certificates/verify/:verificationCode" element={<VerifyCertificate />} />

          {/* Student Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />

          {/* New Feature Routes */}
          <Route path="/discussions" element={<ProtectedRoute><Discussions /></ProtectedRoute>} />
          <Route path="/student/notes" element={<ProtectedRoute allowedRoles={['student']}><StudentNotes /></ProtectedRoute>} />
          <Route path="/ai-chat" element={<ProtectedRoute><AiChat /></ProtectedRoute>} />

          {/* General Protected */}
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute allowedRoles={['student','instructor','admin']}><Certificates /></ProtectedRoute>} />

          {/* Student */}
          <Route path="/my-learning" element={<ProtectedRoute allowedRoles={['student','instructor','admin']}><MyLearning /></ProtectedRoute>} />
          <Route path="/student/quizzes" element={<ProtectedRoute allowedRoles={['student']}><StudentQuizzes /></ProtectedRoute>} />
          <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={['student']}><StudentAssignments /></ProtectedRoute>} />
          <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['student']}><StudentAnnouncements /></ProtectedRoute>} />
          <Route path="/student/live-classes" element={<ProtectedRoute allowedRoles={['student']}><StudentLiveClasses /></ProtectedRoute>} />
          <Route path="/live-class/:liveClassId" element={<ProtectedRoute allowedRoles={['student','instructor','admin']}><LiveClassRoom /></ProtectedRoute>} />
          <Route path="/live-class/stream/:liveClassId" element={<ProtectedRoute allowedRoles={['student','instructor','admin']}><LiveClassRoom /></ProtectedRoute>} />
          <Route path="/learn/:courseId" element={<ProtectedRoute allowedRoles={['student','instructor','admin']}><CoursePlayer /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute allowedRoles={['student']}><Cart /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute allowedRoles={['student']}><Wishlist /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Instructor */}
          <Route path="/instructor/dashboard" element={<ProtectedRoute allowedRoles={['instructor','admin']}><InstructorDashboard /></ProtectedRoute>} />
          <Route path="/instructor/quizzes" element={<ProtectedRoute allowedRoles={['instructor','admin']}><InstructorQuizzes /></ProtectedRoute>} />
          <Route path="/instructor/assignments" element={<ProtectedRoute allowedRoles={['instructor','admin']}><InstructorAssignments /></ProtectedRoute>} />
          <Route path="/instructor/live-classes" element={<ProtectedRoute allowedRoles={['instructor','admin']}><InstructorLiveClasses /></ProtectedRoute>} />
          <Route path="/instructor/announcements" element={<ProtectedRoute allowedRoles={['instructor','admin']}><InstructorAnnouncements /></ProtectedRoute>} />
          <Route path="/instructor/courses/new" element={<ProtectedRoute allowedRoles={['instructor','admin']}><CourseForm /></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/edit" element={<ProtectedRoute allowedRoles={['instructor','admin']}><CourseForm /></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId/curriculum" element={<ProtectedRoute allowedRoles={['instructor','admin']}><Curriculum /></ProtectedRoute>} />

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
          <Route path="/admin/live-attendance" element={<ProtectedRoute allowedRoles={['admin','instructor']}><AdminLiveAttendance /></ProtectedRoute>} />

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default AppRoot;
