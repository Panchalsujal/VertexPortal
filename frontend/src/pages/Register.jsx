import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import {
  MailIcon,
  LockIcon,
  UserIcon,
  ArrowRightIcon,
  CircleCheckIcon,
  SparklesIcon,
  BrainIcon,
  VideoIcon,
  BookOpenIcon,
} from '@animateicons/react/lucide';
import { register as registerApi, googleAuth } from '../api/auth.api';
import { useAuth } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const PERKS = [
  { icon: SparklesIcon,    title: 'AI Tutor Included',    desc: 'Ask your AI tutor anything, anytime.' },
  { icon: VideoIcon,       title: 'Live Classes',          desc: 'Real-time WebRTC sessions with instructors.' },
  { icon: BookOpenIcon,    title: '200+ Courses',          desc: 'Expert-curated learning paths.' },
  { icon: CircleCheckIcon, title: 'Verified Certificates', desc: 'Industry-recognised on completion.' },
];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCodeFromUrl = searchParams.get('ref') || '';
  const { login } = useAuth();

  const [form, setForm]       = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: refCodeFromUrl,
  });
  const [showPw, setShowPw]   = useState(false);
  const [showCp, setShowCp]   = useState(false);
  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleGoogleAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error('Google Client ID is not configured in .env');
      return;
    }

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (response?.credential) {
                handleGoogleSuccess(response.credential);
              }
            },
            cancel_on_tap_outside: false,
          });

          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
              const reason = notification.getNotDisplayedReason();
              console.warn('Google Prompt Not Displayed:', reason);
              if (reason === 'suppressed_by_user' || reason === 'opt_out_or_nested_iframe') {
                toast('Please enable third-party cookies or popups for Google sign-in', { icon: 'ℹ️' });
              }
            } else if (notification.isSkippedMoment()) {
              console.warn('Google Prompt Skipped:', notification.getSkippedReason());
            }
          });
        } catch (e) {
          console.error('Google Auth Init Error:', e);
          toast.error('Google Sign-In initialization failed');
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    }
  };

  const strength = (() => {
    const pw = form.password;
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)           s++;
    if (/[A-Z]/.test(pw))         s++;
    if (/[0-9]/.test(pw))         s++;
    if (/[^A-Za-z0-9]/.test(pw))  s++;
    return s;
  })();
  const strengthMeta = [null,
    { label: 'Weak',   color: '#d63031' },
    { label: 'Fair',   color: '#fdcb6e' },
    { label: 'Good',   color: '#00b894' },
    { label: 'Strong', color: '#6C5CE7' },
  ][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) { toast.error('Please fill in all fields'); return; }
    if (form.password.length < 8)                         { toast.error('Password must be at least 8 characters'); return; }
    if (form.password !== form.confirmPassword)           { toast.error('Passwords do not match'); return; }
    if (!agreed)                                          { toast.error('Please agree to the Terms of Service'); return; }
    setLoading(true);
    try {
      await registerApi({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        referralCode: form.referralCode,
      });
      toast.success('Account created! Please check your email to verify.', { duration: 6000 });
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (e) => { e.target.style.borderColor = '#6C5CE7'; e.target.style.boxShadow = '0 0 0 3px rgba(108,92,231,0.12)'; };
  const blurStyle  = (e) => { e.target.style.borderColor = '#e8eaf0'; e.target.style.boxShadow = 'none'; };
  const inputCls   = 'w-full py-2.5 text-sm rounded-xl border bg-[#f7f8fc] dark:bg-slate-800 text-[#1a1d2e] dark:text-white placeholder-[#a0a8c0] outline-none transition-all';

  return (
    /*
      h-screen + overflow-hidden = zero page scroll.
      Left panel scrolls internally via overflow-y-auto.
    */
    <div
      className="h-screen overflow-hidden flex flex-col bg-[#f7f8fc] dark:bg-slate-950"
      style={{ fontFamily: "'Inter','Plus Jakarta Sans',sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-[#e8eaf0] dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 py-3">
        <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow"
            style={{ background: 'linear-gradient(135deg,#6C5CE7,#a29bfe)' }}>
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-[#1a1d2e] dark:text-white leading-none"
              style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>VertexPortal</p>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#6C5CE7' }}>LMS</p>
          </div>
        </Link>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 shrink-0">
          <span className="hidden sm:inline">Already have an account?</span>
          <Link
            to="/login"
            className="px-3 sm:px-4 py-1.5 rounded-xl font-bold text-xs bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-all shadow-xs whitespace-nowrap"
          >
            Log in
          </Link>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ══ LEFT — Form (scrolls internally) ══ */}
        <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0 overflow-y-auto bg-white dark:bg-slate-900 border-r border-[#e8eaf0] dark:border-slate-800">
          <div className="px-8 sm:px-12 py-8">
            <div className="max-w-[340px] w-full mx-auto space-y-5">

              {/* Heading */}
              <div>
                <h1 className="text-2xl font-extrabold text-[#1a1d2e] dark:text-white mb-1"
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.025em' }}>
                  Create Account 🚀
                </h1>
                <p className="text-sm text-[#636e8a] dark:text-slate-400">
                  Free to start — no credit card required.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a1d2e] dark:text-slate-300 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <UserIcon size={14} color="#a0a8c0" />
                    </span>
                    <input type="text" required placeholder="Your full name"
                      value={form.fullName}
                      onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                      className={`${inputCls} pl-9 pr-3`} style={{ borderColor: '#e8eaf0' }}
                      onFocus={focusStyle} onBlur={blurStyle}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a1d2e] dark:text-slate-300 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <MailIcon size={14} color="#a0a8c0" />
                    </span>
                    <input type="email" required placeholder="Enter your email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={`${inputCls} pl-9 pr-3`} style={{ borderColor: '#e8eaf0' }}
                      onFocus={focusStyle} onBlur={blurStyle}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a1d2e] dark:text-slate-300 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <LockIcon size={14} color="#a0a8c0" />
                    </span>
                    <input type={showPw ? 'text' : 'password'} required placeholder="Create a password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className={`${inputCls} pl-9 pr-10`} style={{ borderColor: '#e8eaf0' }}
                      onFocus={focusStyle} onBlur={blurStyle}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a8c0] hover:text-[#6C5CE7] transition-colors">
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {/* Strength meter */}
                  {form.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all"
                            style={{ background: i <= strength ? strengthMeta?.color : '#e8eaf0' }} />
                        ))}
                      </div>
                      {strengthMeta && (
                        <p className="text-[11px] font-semibold" style={{ color: strengthMeta.color }}>
                          {strengthMeta.label} password
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a1d2e] dark:text-slate-300 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <LockIcon size={14} color="#a0a8c0" />
                    </span>
                    <input type={showCp ? 'text' : 'password'} required placeholder="Confirm your password"
                      value={form.confirmPassword}
                      onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      className={`${inputCls} pl-9 pr-10`}
                      style={{ borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#d63031' : '#e8eaf0' }}
                      onFocus={focusStyle}
                      onBlur={e => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = form.confirmPassword && form.confirmPassword !== form.password ? '#d63031' : '#e8eaf0'; }}
                    />
                    <button type="button" onClick={() => setShowCp(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a8c0] hover:text-[#6C5CE7] transition-colors">
                      {showCp ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {form.confirmPassword && form.confirmPassword !== form.password && (
                    <p className="text-[11px] font-semibold" style={{ color: '#d63031' }}>Passwords do not match</p>
                  )}
                </div>

                {/* Optional Referral Code */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a1d2e] dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Referral Code</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VP-A8F2"
                    value={form.referralCode}
                    onChange={e => setForm(f => ({ ...f, referralCode: e.target.value.toUpperCase() }))}
                    className={`${inputCls} px-3 uppercase tracking-wider font-mono`}
                    style={{ borderColor: '#e8eaf0' }}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="sr-only" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                  <div className="w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all"
                    style={{ background: agreed ? '#6C5CE7' : 'transparent', borderColor: agreed ? '#6C5CE7' : '#d1d5db' }}>
                    {agreed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-[#636e8a] dark:text-slate-400 leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="font-semibold" style={{ color: '#6C5CE7' }}>Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="font-semibold" style={{ color: '#6C5CE7' }}>Privacy Policy</Link>
                  </span>
                </label>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: 'linear-gradient(135deg,#6C5CE7,#5046d4)', boxShadow: '0 6px 20px -4px rgba(108,92,231,0.4)' }}>
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Create Account</span> <ArrowRightIcon size={14} color="white" /></>
                  }
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#e8eaf0] dark:bg-slate-800" />
                <span className="text-xs text-[#a0a8c0]">or sign up with</span>
                <div className="flex-1 h-px bg-[#e8eaf0] dark:bg-slate-800" />
              </div>

              {/* OAuth */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Google', onClick: handleGoogleAuth, svg: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
                  { label: 'GitHub', onClick: () => toast('GitHub signup coming soon', { icon: '⚡' }), svg: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> },
                ].map(({ label, onClick, svg }) => (
                  <button key={label} type="button" onClick={onClick}
                    className="flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl border border-[#e8eaf0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#1a1d2e] dark:text-white hover:border-[#6C5CE7] hover:bg-[#f3f1ff] dark:hover:bg-purple-950/30 transition-all cursor-pointer">
                    {svg} {label}
                  </button>
                ))}
              </div>

              {/* Info */}
              <div className="flex items-start gap-3 rounded-2xl p-3.5"
                style={{ background: '#f3f1ff', border: '1px solid #ddd6fe' }}>
                <BrainIcon size={15} color="#6C5CE7" className="shrink-0 mt-0.5" />
                <p className="text-xs text-[#636e8a] leading-relaxed">
                  You'll be registered as a <strong className="text-[#1a1d2e]">student by default</strong>.
                  Instructors &amp; admins are assigned by the platform admin.
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ══ RIGHT — Brand panel ══ */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
          style={{ background: 'linear-gradient(150deg,#6C5CE7 0%,#5046d4 50%,#4338ca 100%)' }}>
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: '#a29bfe' }} />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ background: '#4338ca' }} />

          <div className="relative z-10 w-full max-w-sm px-10 space-y-7">
            {/* Headline */}
            <div className="space-y-3 text-center">
              <div className="w-14 h-14 rounded-3xl mx-auto flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)' }}>
                <SparklesIcon size={24} color="white" />
              </div>
              <h2 className="text-2xl font-extrabold text-white"
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.025em' }}>
                Start Learning for Free
              </h2>
              <p className="text-[#c4b5fd] text-sm leading-relaxed">
                AI-powered courses, live classes, and certificates — all in one beautifully designed platform.
              </p>
            </div>

            {/* Perks */}
            <div className="space-y-2.5">
              {PERKS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(6px)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Icon size={16} color="white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-none mb-0.5"
                      style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{title}</p>
                    <p className="text-[11px] text-[#c4b5fd]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { value: '50K+', label: 'Students' },
                { value: '4.8★', label: 'Rating' },
                { value: '95%', label: 'Completion' },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-2xl py-3.5 text-center"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.14)' }}>
                  <p className="text-base font-extrabold text-white leading-none mb-0.5"
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{value}</p>
                  <p className="text-[10px] text-[#c4b5fd] font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
