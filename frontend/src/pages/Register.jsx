import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, Tag } from 'lucide-react';
import {
  MailIcon,
  LockIcon,
  UserIcon,
  ArrowRightIcon,
  CircleCheckIcon,
  SparklesIcon,
  VideoIcon,
  BookOpenIcon,
  ShieldCheckIcon,
} from '@animateicons/react/lucide';
import { register as registerApi, googleAuth } from '../api/auth.api';
import { useAuth } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const PERKS = [
  { icon: SparklesIcon, title: 'AI Tutor Included', desc: 'Ask your personal AI tutor anything, 24/7.' },
  { icon: VideoIcon, title: 'Live Classes', desc: 'Real-time WebRTC live sessions with experts.' },
  { icon: BookOpenIcon, title: '200+ Courses', desc: 'Expert-curated learning paths in tech and AI.' },
  { icon: CircleCheckIcon, title: 'Verified Certificates', desc: 'Industry-recognized credentials upon completion.' },
];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCodeFromUrl = searchParams.get('ref') || '';
  const { login } = useAuth();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: refCodeFromUrl,
  });
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showRefInput, setShowRefInput] = useState(Boolean(refCodeFromUrl));
  const [loading, setLoading] = useState(false);

  const googleBtnRef = useRef(null);
  const gsiInitializedRef = useRef(false);

  const handleGoogleSuccess = async (credential) => {
    setLoading(true);
    try {
      const res = await googleAuth({
        credential,
        referralCode: form.referralCode || refCodeFromUrl,
      });
      const userData = res.data.data.user;
      if (res.data.data?.token) {
        localStorage.setItem('token', res.data.data.token);
      }
      login(userData);
      toast.success(`Welcome to VertexPortal, ${userData.fullName.split(' ')[0]}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '437241590710-ce84o2fcqnbg1esivhsbgcdr8cpfs0m3.apps.googleusercontent.com';

    const setupGsi = () => {
      if (!window.google?.accounts?.id || gsiInitializedRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              handleGoogleSuccess(response.credential);
            }
          },
          use_fedcm_for_prompt: true,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
          });
        }

        gsiInitializedRef.current = true;
      } catch (err) {
        console.warn('GSI Init Error:', err);
      }
    };

    if (window.google?.accounts?.id) {
      setupGsi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = setupGsi;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleAuth = () => {
    if (googleBtnRef.current) {
      const btn = googleBtnRef.current.querySelector('div[role=button]');
      if (btn) {
        btn.click();
        return;
      }
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google service is loading, please try again.');
    }
  };

  const strength = (() => {
    const pw = form.password;
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  })();

  const strengthMeta = [
    null,
    { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' },
    { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' },
    { label: 'Good', color: 'bg-emerald-500', text: 'text-emerald-500' },
    { label: 'Strong', color: 'bg-purple-600', text: 'text-purple-600' },
  ][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!agreed) {
      toast.error('Please agree to the Terms of Service & Privacy Policy');
      return;
    }
    setLoading(true);
    try {
      await registerApi({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        referralCode: form.referralCode,
      });
      toast.success('Account created successfully! Please log in.', { duration: 5000 });
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-[Inter,sans-serif] text-slate-900 dark:text-slate-100">
      {/* ══ LEFT: Authentication Form ══ */}
      <div className="flex flex-col justify-between min-h-screen p-6 sm:p-10 lg:p-12 xl:p-16 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 z-10">
        {/* Top bar with Logo & Switch to Login */}
        <div className="flex items-center justify-between gap-4 pb-6">
          <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0 group">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-tr from-purple-600 to-indigo-500 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900 dark:text-white leading-none font-['Plus_Jakarta_Sans',sans-serif]">
                VertexPortal
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mt-0.5">
                LMS Platform
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Already registered?</span>
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 transition shadow-xs whitespace-nowrap"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Center Main Form */}
        <div className="max-w-md w-full mx-auto my-auto py-4">
          <div className="space-y-6">
            {/* Header Greeting */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif] mb-2">
                Create Your Account 🚀
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Join 50,000+ students mastering real-world skills with expert mentors.
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <UserIcon size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <MailIcon size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <LockIcon size={16} />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-500 transition p-1"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {form.password && (
                  <div className="space-y-1 pt-1">
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 rounded-full overflow-hidden">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-full rounded-full transition-all duration-300 ${
                            strength >= level ? strengthMeta?.color || 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    {strengthMeta && (
                      <p className={`text-[10px] font-bold ${strengthMeta.text} text-right`}>
                        Strength: {strengthMeta.label}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <LockIcon size={16} />
                  </span>
                  <input
                    type={showCp ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCp((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-500 transition p-1"
                  >
                    {showCp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Referral Code (Optional Accordion) */}
              <div>
                {!showRefInput ? (
                  <button
                    type="button"
                    onClick={() => setShowRefInput(true)}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Have a referral or invite code?</span>
                  </button>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Referral Code (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <Tag className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. VERTEX2026"
                        value={form.referralCode}
                        onChange={(e) => setForm((f) => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                    I agree to the{' '}
                    <span className="font-semibold text-purple-600 dark:text-purple-400">Terms of Service</span> and{' '}
                    <span className="font-semibold text-purple-600 dark:text-purple-400">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3.5 px-4 rounded-xl text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRightIcon size={16} color="white" />
                  </>
                )}
              </button>
            </form>

            {/* Social Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider text-[11px]">
                or sign up with
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => toast('GitHub sign-up is enabled via standard registration', { icon: '⚡' })}
                className="flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </button>
            </div>
            <div ref={googleBtnRef} className="hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Security / Privacy Trust Badge */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-2xl p-3 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40">
            <ShieldCheckIcon size={18} color="#8b5cf6" className="shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white">Your privacy matters.</span>{' '}
              We never share your personal details. Free forever plan available.
            </p>
          </div>
        </div>
      </div>

      {/* ══ RIGHT: Immersive Platform Showcase (Desktop Only) ══ */}
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-gradient-to-br from-purple-700 via-indigo-700 to-slate-950 text-white select-none">
        {/* Ambient background glow orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Top Branding Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide text-purple-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Interactive Learning Platform</span>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 max-w-lg mx-auto w-full space-y-8 my-auto">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Start Learning Today
            </h2>
            <p className="text-purple-200 text-sm leading-relaxed max-w-md mx-auto">
              Join thousands of students and engineers learning with modern hands-on labs, AI tutors, and interactive live classes.
            </p>
          </div>

          {/* Perks Grid */}
          <div className="grid grid-cols-2 gap-3">
            {PERKS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-2 rounded-2xl p-4 bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
                  <Icon size={16} color="white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] mb-0.5">
                    {title}
                  </p>
                  <p className="text-[11px] text-purple-200/90 leading-snug">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Real Student Testimonial */}
          <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-md border border-white/15 space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-xs text-purple-100 italic leading-relaxed">
              "Creating an account on VertexPortal was the best decision for my software engineering prep. The live interactive classes make all the difference!"
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-indigo-500 shadow-xs">
                AK
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-white leading-none">Aman Kumar</p>
                <p className="text-[10px] text-purple-200">Software Developer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-purple-200/80 pt-4 border-t border-white/10">
          <span>© 2026 VertexPortal Inc.</span>
          <span>Terms & Privacy</span>
        </div>
      </div>
    </div>
  );
}
