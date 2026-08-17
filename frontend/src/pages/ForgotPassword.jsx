import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ArrowLeft,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Lock,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { forgotPassword } from '../api/auth.api';
import toast from 'react-hot-toast';

const SECURITY_PERKS = [
  { icon: KeyRound, title: 'One-Time Recovery Link', desc: 'Secure cryptographic token expires automatically in 60 minutes.' },
  { icon: ShieldCheck, title: 'End-to-End Encryption', desc: 'Protected by salted bcrypt hashing and TLS transport security.' },
  { icon: Clock, title: 'Instant Delivery', desc: 'Verification and reset links dispatched within seconds.' },
  { icon: HelpCircle, title: '24/7 Account Support', desc: 'Need help? Our dedicated support team is always available.' },
];

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword({ email: email.trim() });
      setSubmitted(true);
      toast.success(res.data?.message || 'Password reset link sent to your email!');
      startCooldown();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    try {
      const res = await forgotPassword({ email: email.trim() });
      toast.success(res.data?.message || 'New reset link sent!');
      startCooldown();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-[Inter,sans-serif] text-slate-900 dark:text-slate-100">
      
      {/* ══ LEFT: Forgot Password Form ══ */}
      <div className="flex flex-col justify-between min-h-screen p-6 sm:p-10 lg:p-12 xl:p-16 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 z-10">
        
        {/* Top Bar with Logo & Switch to Login */}
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
            <span className="hidden sm:inline">Remember password?</span>
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 transition shadow-xs whitespace-nowrap"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Center Main Content */}
        <div className="max-w-md w-full mx-auto my-auto py-6">
          {!submitted ? (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-3">
                  <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Account Recovery
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif] mb-2">
                  Forgot Password? 🔑
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Enter your registered email address below. We'll send you secure instructions to reset your password.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3.5 px-4 rounded-xl text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Reset Instructions</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            /* Email Sent State */
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif] mb-2">
                  Check Your Inbox 📬
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  We've sent a password reset link to:
                </p>
                <p className="mt-2 inline-block px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/50 text-xs font-bold font-mono text-purple-700 dark:text-purple-300 max-w-full truncate">
                  {email}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-left text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                  <span>The reset link is active for <strong>60 minutes</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Don't see it? Check your Spam, Junk, or Promotions tab.</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 disabled:opacity-50 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend link in ${resendCooldown}s` : 'Resend reset link'}
                </button>

                <div className="flex items-center justify-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
                  >
                    Change email address
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <Link
                    to="/login"
                    className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security / Privacy Trust Badge */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-2xl p-3 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-white">Encrypted & Secure.</span>{' '}
              Protected by TLS encryption and SHA-256 salted single-use recovery tokens.
            </p>
          </div>
        </div>
      </div>

      {/* ══ RIGHT: Immersive Showcase (Desktop Only) ══ */}
      <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-gradient-to-br from-purple-700 via-indigo-700 to-slate-950 text-white select-none">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Top Branding Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide text-purple-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Secure Password Recovery</span>
          </div>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 max-w-lg mx-auto w-full space-y-8 my-auto">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Protecting Your Account
            </h2>
            <p className="text-purple-200 text-sm leading-relaxed max-w-md mx-auto">
              Your security and privacy are our top priority. We use industry-standard encryption protocols to keep your learning credentials safe.
            </p>
          </div>

          {/* Perks Grid */}
          <div className="grid grid-cols-2 gap-3">
            {SECURITY_PERKS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-2 rounded-2xl p-4 bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
                  <Icon className="w-4 h-4 text-white" />
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

          {/* Security Notice Card */}
          <div className="rounded-2xl p-4 bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="text-xs text-purple-100 leading-relaxed">
              Never share your reset link with anyone. VertexPortal staff will never ask for your password.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-purple-200/80">
          <span>© {new Date().getFullYear()} VertexPortal LMS</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
          </div>
        </div>
      </div>

    </div>
  );
}
