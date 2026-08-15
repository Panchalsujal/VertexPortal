import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import {
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  BookOpenIcon,
  StarIcon,
  UsersIcon,
  CircleCheckIcon,
  ShieldCheckIcon,
} from '@animateicons/react/lucide';
import { login as loginApi } from '../api/auth.api';
import { useAuth } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const PERKS = [
  { icon: BookOpenIcon,    title: '200+ Courses',         desc: 'Expert-curated paths across tech & design' },
  { icon: StarIcon,        title: '4.8★ Rated Platform',  desc: 'Loved by 50,000+ learners worldwide' },
  { icon: UsersIcon,       title: 'Live Classes',          desc: 'Real-time WebRTC sessions with instructors' },
  { icon: CircleCheckIcon, title: 'Verified Certificates', desc: 'Industry-recognised on completion' },
];

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res      = await loginApi(form);
      const userData = res.data.data.user;
      if (res.data.data?.token) {
        localStorage.setItem('token', res.data.data.token);
      }
      login(userData);
      toast.success(`Welcome back, ${userData.fullName.split(' ')[0]}! 👋`);
      if (userData.role === 'admin')           navigate('/admin');
      else if (userData.role === 'instructor') navigate('/instructor/dashboard');
      else                                      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const focusStyle  = (e) => { e.target.style.borderColor = '#6C5CE7'; e.target.style.boxShadow = '0 0 0 3px rgba(108,92,231,0.12)'; };
  const blurStyle   = (e) => { e.target.style.borderColor = '#e8eaf0'; e.target.style.boxShadow = 'none'; };
  const inputCls = 'w-full py-2.5 text-sm rounded-xl border bg-[#f7f8fc] dark:bg-slate-800 text-[#1a1d2e] dark:text-white placeholder-[#a0a8c0] outline-none transition-all';

  return (
    /* 
      h-screen + overflow-hidden = page never scrolls.
      The left form column overflows internally via overflow-y-auto.
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
          <span className="hidden sm:inline">New to VertexPortal?</span>
          <Link
            to="/register"
            className="px-3 sm:px-4 py-1.5 rounded-xl font-bold text-xs bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-all shadow-xs whitespace-nowrap"
          >
            Create Account
          </Link>
        </div>
      </header>

      {/* ── Body: fills remaining height ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ══ LEFT — Form ══ */}
        <div className="w-full lg:w-[440px] xl:w-[480px] shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-[#e8eaf0] dark:border-slate-800 overflow-y-auto">
          <div className="flex flex-col justify-center flex-1 px-8 sm:px-12 py-8">
            <div className="max-w-[340px] w-full mx-auto space-y-5">

              {/* Greeting */}
              <div>
                <h1 className="text-2xl font-extrabold text-[#1a1d2e] dark:text-white mb-1"
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.025em' }}>
                  Welcome Back! 👋
                </h1>
                <p className="text-sm text-[#636e8a] dark:text-slate-400">
                  Log in to continue your learning journey.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#1a1d2e] dark:text-slate-300 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <MailIcon size={14} color="#a0a8c0" />
                    </span>
                    <input type="email" required placeholder="Enter your email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={`${inputCls} pl-9 pr-3`}
                      style={{ borderColor: '#e8eaf0' }}
                      onFocus={focusStyle} onBlur={blurStyle}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#1a1d2e] dark:text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs font-semibold" style={{ color: '#6C5CE7' }}>
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <LockIcon size={14} color="#a0a8c0" />
                    </span>
                    <input type={showPw ? 'text' : 'password'} required placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className={`${inputCls} pl-9 pr-10`}
                      style={{ borderColor: '#e8eaf0' }}
                      onFocus={focusStyle} onBlur={blurStyle}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a8c0] hover:text-[#6C5CE7] transition-colors">
                      {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Remember */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="sr-only" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  <div className="w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all"
                    style={{ background: remember ? '#6C5CE7' : 'transparent', borderColor: remember ? '#6C5CE7' : '#d1d5db' }}>
                    {remember && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-[#636e8a] dark:text-slate-400">Remember me</span>
                </label>

                {/* Submit */}
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg,#6C5CE7,#5046d4)', boxShadow: '0 6px 20px -4px rgba(108,92,231,0.4)' }}>
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Login</span> <ArrowRightIcon size={14} color="white" /></>
                  }
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#e8eaf0] dark:bg-slate-800" />
                <span className="text-xs text-[#a0a8c0]">or continue with</span>
                <div className="flex-1 h-px bg-[#e8eaf0] dark:bg-slate-800" />
              </div>

              {/* OAuth */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Google', svg: <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> },
                  { label: 'GitHub',  svg: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> },
                ].map(({ label, svg }) => (
                  <button key={label} type="button"
                    className="flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl border border-[#e8eaf0] dark:border-slate-700 bg-white dark:bg-slate-800 text-[#1a1d2e] dark:text-white hover:border-[#6C5CE7] hover:bg-[#f3f1ff] transition-all">
                    {svg} {label}
                  </button>
                ))}
              </div>

              {/* Security note */}
              <div className="flex items-center gap-3 rounded-2xl p-3.5"
                style={{ background: '#f3f1ff', border: '1px solid #ddd6fe' }}>
                <ShieldCheckIcon size={15} color="#6C5CE7" className="shrink-0" />
                <p className="text-xs text-[#636e8a] leading-relaxed">
                  <span className="font-bold text-[#1a1d2e]">Your data is safe.</span>{' '}
                  Industry-standard encryption keeps your info secure.
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
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-white"
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.025em' }}>
                Unlock Your Potential
              </h2>
              <p className="text-[#c4b5fd] text-sm leading-relaxed">
                50,000+ learners building real-world skills with AI-powered courses and live expert sessions.
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

            {/* Testimonial */}
            <div className="rounded-2xl px-4 py-4 space-y-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.14)' }}>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3 h-3" fill="#fbbf24" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="text-xs text-[#e0d9ff] leading-relaxed italic">
                "VertexPortal's AI tutor is a game-changer. I landed my first developer job in 5 months."
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: '#00b894' }}>PS</div>
                <div>
                  <p className="text-[11px] font-bold text-white leading-none">Priya Sharma</p>
                  <p className="text-[10px] text-[#c4b5fd]">Full-Stack Developer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
