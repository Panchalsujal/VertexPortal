import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Eye, EyeOff, GraduationCap, Mail as MailIcon, Lock as LockIcon, ArrowRight as ArrowRightIcon } from 'lucide-react';
import { login as loginApi, googleAuth } from '../api/auth.api';
import { useAuth } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { initGoogleAuth, triggerGoogleLogin } from '../utils/googleAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (authPayload) => {
    setLoading(true);
    try {
      const payload = typeof authPayload === 'string' ? { credential: authPayload } : authPayload;
      const res = await googleAuth(payload);
      const userData = res.data.data.user;
      if (res.data.data?.token) {
        localStorage.setItem('token', res.data.data.token);
      }
      login(userData);
      toast.success(`Welcome back, ${userData.fullName.split(' ')[0]}! 👋`);
      if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'instructor') navigate('/instructor/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initGoogleAuth(handleGoogleSuccess);
  }, []);

  const handleGoogleAuth = () => {
    triggerGoogleLogin();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi(form);
      const userData = res.data.data.user;
      if (res.data.data?.token) {
        localStorage.setItem('token', res.data.data.token);
      }
      login(userData);
      toast.success(`Welcome back, ${userData.fullName.split(' ')[0]}! 👋`);
      if (userData.role === 'admin') navigate('/admin');
      else if (userData.role === 'instructor') navigate('/instructor/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In to Your Account — NavGujarat Academy</title>
        <meta name="description" content="Log in to NavGujarat Academy to continue learning, access your courses, interact with the AI tutor, join live classes, and track your certificates." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-neutral-950 font-sans text-gray-900 dark:text-gray-100">
        <div className="max-w-[420px] w-full">
          {/* Top Brand */}
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex flex-col items-center gap-3 no-underline group">
              <div className="w-10 h-10 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center transition-transform group-hover:scale-105">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-none">
                  NavGujarat Academy
                </h1>
              </div>
            </Link>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Welcome Back</h2>
              <p className="text-sm text-gray-500 dark:text-neutral-400">Log in to access your courses.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Email</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <MailIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <LockIcon className="w-4 h-4" />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition p-1"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-white focus:ring-gray-900 dark:focus:ring-white bg-white dark:bg-neutral-900 cursor-pointer"
                />
                <label htmlFor="remember" className="text-xs font-medium text-gray-600 dark:text-neutral-400 cursor-pointer">
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 px-4 rounded-lg text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 dark:border-gray-900/30 border-t-white dark:border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-neutral-800" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-neutral-800" />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 px-4 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-neutral-400">
              New here? <Link to="/register" className="font-medium text-gray-900 dark:text-white hover:underline">Create an account</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
