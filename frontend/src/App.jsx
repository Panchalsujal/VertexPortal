import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { fetchMe, selectUser, selectAuthLoading } from './store/slices/authSlice';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { PageLoader } from './components/ui/Spinner';

// Pages
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

// New Pages
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

// ─── Protected Route ─────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const user    = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ─── Layout ───────────────────────────────────────────────────────────────────
function Layout({ children }) {
  const location = useLocation();
  const hideHeaderFooter = location.pathname.startsWith('/learn/');
  return (
    <>
      {!hideHeaderFooter && <Navbar />}
      <main>{children}</main>
      {!hideHeaderFooter && <Footer />}
    </>
  );
}

// ─── Root — bootstraps auth on mount ─────────────────────────────────────────
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
            color: 'var(--text-primary)',
            border: '1px solid var(--color-border)',
            fontSize: '0.9375rem',
          },
        }}
      />
      <Layout>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email/:userId/:token" element={<VerifyEmail />} />
          <Route path="/verify-certificate/:verificationCode" element={<VerifyCertificate />} />

          {/* General Protected */}
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute allowedRoles={['student','instructor','admin']}><Certificates /></ProtectedRoute>} />

          {/* Student */}
          <Route path="/my-learning" element={<ProtectedRoute allowedRoles={['student','instructor','admin']}><MyLearning /></ProtectedRoute>} />
          <Route path="/student/quizzes" element={<ProtectedRoute allowedRoles={['student']}><StudentQuizzes /></ProtectedRoute>} />
          <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={['student']}><StudentAssignments /></ProtectedRoute>} />
          <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['student']}><StudentAnnouncements /></ProtectedRoute>} />
          <Route path="/student/live-classes" element={<ProtectedRoute allowedRoles={['student']}><StudentLiveClasses /></ProtectedRoute>} />
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

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default AppRoot;
