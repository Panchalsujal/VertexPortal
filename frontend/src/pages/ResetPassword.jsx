import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  GraduationCap,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  KeyRound,
  Check,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { verifyResetToken, resetPassword } from '../api/auth.api';
import toast from 'react-hot-toast';

const SECURITY_PERKS = [
  { icon: KeyRound, title: 'Zero-Knowledge Security', desc: 'Passwords are irreversibly hashed using salted bcrypt.' },
  { icon: ShieldCheck, title: 'Session Invalidation', desc: 'All previous sessions are secured upon updating your password.' },
  { icon: Clock, title: 'Instant Activation', desc: 'Your new credentials take effect across all devices immediately.' },
  { icon: HelpCircle, title: '24/7 Account Protection', desc: 'Automated monitoring prevents unauthorized access attempts.' },
];

export default function ResetPassword() {
  const { userId, token } = useParams();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function checkToken() {
      try {
        const res = await verifyResetToken(userId, token);
        if (res.data?.success) {
          setTokenValid(true);
          setUserEmail(res.data?.data?.email || '');
        } else {
          setTokenValid(false);
          setErrorMessage(res.data?.message || 'Invalid or expired password reset link.');
        }
      } catch (err) {
        setTokenValid(false);
        setErrorMessage(
          err.response?.data?.message ||
            'This password reset link is invalid or has expired. Please request a new one.'
        );
      } finally {
        setVerifying(false);
      }
    }

    if (userId && token) {
      checkToken();
    } else {
      setVerifying(false);
      setTokenValid(false);
      setErrorMessage('Invalid password reset link.');
    }
  }, [userId, token]);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase & lowercase letters', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword(userId, token, {
        newPassword: password,
        confirmPassword,
      });
      setSuccess(true);
      toast.success(res.data?.message || 'Password reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset Your Password — VertexPortal</title>
        <meta
          name="description"
          content="Choose a new secure password for your VertexPortal account."
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://vertex-mu-eight.vercel.app/reset-password" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="VertexPortal" />
        <meta property="og:title" content="Reset Your Password — VertexPortal" />
        <meta property="og:description" content="Choose a new secure password for your VertexPortal account." />
        <meta property="og:url" content="https://vertex-mu-eight.vercel.app/reset-password" />
        <meta property="og:image" content="https://vertex-mu-eight.vercel.app/og-image.png" />
      </Helmet>

      <div className="min-h-[100dvh] w-full grid lg:grid-cols-2 bg-white dark:bg-slate-950 font-[Inter,sans-serif] text-slate-900 dark:text-slate-100 overflow-x-hidden">
      
      {/* ══ LEFT: Reset Password Form ══ */}
      <div className="flex flex-col justify-between min-h-[100dvh] p-4 sm:p-8 lg:p-12 xl:p-16 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 z-10">
        
        {/* Top Bar with Logo & Switch to Login */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 pb-4 sm:pb-6 border-b sm:border-b-0 border-slate-100 dark:border-slate-800/60">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 no-underline shrink-0 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-tr from-purple-600 to-indigo-500 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-none font-['Plus_Jakarta_Sans',sans-serif]">
                VertexPortal
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mt-0.5">
                LMS Platform
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link
              to="/login"
              className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl font-bold text-xs bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 transition shadow-xs whitespace-nowrap"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Center Main Content */}
        <div className="max-w-md w-full mx-auto my-auto py-6 sm:py-8">
          {verifying ? (
            /* Verifying Link */
            <div className="text-center py-10 space-y-4">
              <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Verifying Security Link...
              </h3>
              <p className="text-xs text-slate-500">Checking token authenticity with the server.</p>
            </div>
          ) : !tokenValid ? (
            /* Token Invalid / Expired */
            <div className="text-center space-y-4 sm:space-y-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 shadow-inner">
                <XCircle className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif] mb-1.5 sm:mb-2">
                  Link Expired or Invalid
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <div className="space-y-3 pt-1 sm:pt-2">
                <Link
                  to="/forgot-password"
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3.5 px-4 rounded-xl text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition cursor-pointer"
                >
                  Request a New Link
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="block text-xs font-semibold text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : success ? (
            /* Reset Success */
            <div className="text-center space-y-4 sm:space-y-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 shadow-inner">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif] mb-1.5 sm:mb-2">
                  Password Updated! 🎉
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your new password has been saved securely. You can now log into your VertexPortal account.
                </p>
              </div>
              <div className="pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3.5 px-4 rounded-xl text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition cursor-pointer"
                >
                  <span>Log In to Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Reset Password Form */
            <div className="space-y-5 sm:space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-2.5 sm:mb-3">
                  <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Create New Password
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif] mb-1">
                  Reset Password 🔒
                </h1>
                {userEmail && (
                  <p className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 mb-1.5">
                    {userEmail}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Choose a strong, unique password to secure your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 sm:py-3.5 text-base sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPw((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-500 transition p-1"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      required
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-11 py-3 sm:py-3.5 text-base sm:text-sm rounded-xl border ${
                        confirmPassword && !passwordsMatch
                          ? 'border-rose-400 dark:border-rose-500'
                          : 'border-slate-200 dark:border-slate-700/80'
                      } bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPw((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-500 transition p-1"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-[11px] font-medium text-rose-500">Passwords do not match</p>
                  )}
                </div>

                {/* Password Criteria Checklist */}
                <div className="p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  {passwordRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          req.met
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className={req.met ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !allRequirementsMet || !passwordsMatch}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3.5 px-4 rounded-xl text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-1 sm:pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Cancel and Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Security / Privacy Trust Badge */}
        <div className="pt-4 sm:pt-6 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl p-2.5 sm:p-3 bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
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
            <span>Secure Credential Update</span>
          </div>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 max-w-lg mx-auto w-full space-y-8 my-auto">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center bg-white/15 backdrop-blur-xl border border-white/25 shadow-xl">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Maximum Account Protection
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
  </>
);
}
