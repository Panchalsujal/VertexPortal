import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
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

// Protected Route Wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Layout Wrapper to conditionally show Navbar & Footer
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:userId/:token" element={<VerifyEmail />} />

            {/* Student Protected Routes */}
            <Route path="/my-learning" element={
              <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
                <MyLearning />
              </ProtectedRoute>
            } />
            <Route path="/learn/:courseId" element={
              <ProtectedRoute allowedRoles={['student', 'instructor', 'admin']}>
                <CoursePlayer />
              </ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Cart />
              </ProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Wishlist />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* Instructor Routes */}
            <Route path="/instructor/dashboard" element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <InstructorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/instructor/courses/new" element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <CourseForm />
              </ProtectedRoute>
            } />
            <Route path="/instructor/courses/:courseId/edit" element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <CourseForm />
              </ProtectedRoute>
            } />
            <Route path="/instructor/courses/:courseId/curriculum" element={
              <ProtectedRoute allowedRoles={['instructor', 'admin']}>
                <Curriculum />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}
