import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, BookOpen, BarChart2,
  Award, Users, ShieldCheck, GraduationCap
} from 'lucide-react';
import { login as loginApi } from '../api/auth.api';
import { useAuth } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const features = [
  { icon: BookOpen,   label: 'Learn Anytime',  sub: 'Access courses anytime, anywhere.' },
  { icon: BarChart2,  label: 'Track Progress', sub: 'Track achievements in real-time.' },
  { icon: Award,      label: 'Get Certified',  sub: 'Earn certificates for your career.' },
  { icon: Users,      label: 'Join Community', sub: 'Learn with thousands of students.' },
];

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPw, setShowPw]     = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res      = await loginApi(form);
      const userData = res.data.data.user;
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

  return (
    <div className="vp-auth-root">
      <style>{`
        * { box-sizing: border-box; }
        @keyframes vp-spin { to { transform: rotate(360deg); } }

        .vp-auth-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #fff;
          font-family: 'Inter', 'Plus Jakarta Sans', sans-serif;
        }
        .vp-auth-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          border-bottom: 1px solid #f0f0f5;
          background: #fff;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .vp-auth-logo { display: flex; align-items: center; gap: 0.625rem; text-decoration: none; }
        .vp-auth-logo-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(108,92,231,0.35);
        }
        .vp-auth-logo-text { font-size: 0.9rem; font-weight: 800; color: #1a1d2e; line-height: 1.2; }
        .vp-auth-logo-sub  { font-size: 0.6rem; font-weight: 600; color: #6C5CE7; margin-top: 1px; }
        .vp-auth-header-link { font-size: 0.8125rem; color: #636e8a; margin: 0; }
        .vp-auth-header-link a { color: #6C5CE7; font-weight: 700; text-decoration: none; }

        .vp-auth-body { flex: 1; display: flex; overflow: hidden; }

        /* Left form panel */
        .vp-auth-form-panel {
          flex: 0 0 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 3.5rem;
          background: #fff;
          overflow-y: auto;
        }
        .vp-auth-form-inner { width: 100%; max-width: 380px; }

        /* Right illustration panel */
        .vp-auth-illus-panel {
          flex: 0 0 50%;
          background: radial-gradient(ellipse at 60% 50%, #ddd6fe 0%, #ede9fe 40%, #f3f1ff 70%, #faf9ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 2rem;
        }
        .vp-illus-blob1 {
          position: absolute; top: 10%; right: 10%;
          width: 180px; height: 180px; border-radius: 50%;
          background: radial-gradient(circle, rgba(108,92,231,0.2) 0%, transparent 70%);
        }
        .vp-illus-blob2 {
          position: absolute; bottom: 15%; left: 8%;
          width: 120px; height: 120px; border-radius: 50%;
          background: radial-gradient(circle, rgba(162,155,254,0.25) 0%, transparent 70%);
        }
        .vp-illus-img-wrap {
          position: relative; z-index: 2; border-radius: 24px;
          overflow: hidden; max-width: 380px;
          box-shadow: 0 30px 80px rgba(108,92,231,0.2), 0 10px 30px rgba(0,0,0,0.08);
        }
        .vp-illus-img-wrap img { width: 100%; height: auto; display: block; }
        .vp-illus-badge {
          position: absolute; background: #fff; border-radius: 12px;
          padding: 0.625rem 0.875rem; z-index: 3;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          display: flex; align-items: center; gap: 0.5rem;
        }
        .vp-illus-badge-title { font-size: 0.75rem; font-weight: 700; color: #6C5CE7; }
        .vp-illus-badge-sub   { font-size: 0.6875rem; color: #636e8a; }
        .vp-badge-top    { top: 22%; left: 12%; }
        .vp-badge-bottom { bottom: 22%; right: 10%; }

        /* Form elements */
        .vp-form-title { font-size: 1.875rem; font-weight: 800; color: #1a1d2e; margin: 0 0 0.375rem; letter-spacing: -0.03em; }
        .vp-form-sub   { font-size: 0.875rem; color: #636e8a; margin: 0 0 2rem; }
        .vp-field      { margin-bottom: 1.25rem; }
        .vp-label      { display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem; font-weight: 600; color: #1a1d2e; margin-bottom: 0.5rem; }
        .vp-label a    { font-size: 0.75rem; font-weight: 600; color: #6C5CE7; text-decoration: none; }
        .vp-input-wrap { position: relative; }
        .vp-input-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #a0a8c0; pointer-events: none; }
        .vp-input {
          width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem;
          font-size: 0.875rem; color: #1a1d2e;
          border: 1.5px solid #e8eaf0; border-radius: 10px;
          outline: none; background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .vp-input::placeholder { color: #a0a8c0; }
        .vp-input:focus { border-color: #6C5CE7; box-shadow: 0 0 0 3px rgba(108,92,231,0.12); }
        .vp-input-pr { padding-right: 2.75rem; }
        .vp-eye-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #a0a8c0;
          display: flex; align-items: center; padding: 0;
        }
        .vp-check-row   { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 1.5rem; cursor: pointer; }
        .vp-check-box {
          width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; cursor: pointer;
        }
        .vp-check-label { font-size: 0.875rem; color: #636e8a; user-select: none; }
        .vp-btn-primary {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.875rem 1.5rem; border-radius: 12px;
          background: linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%);
          color: #fff; font-size: 0.9375rem; font-weight: 700;
          border: none; cursor: pointer;
          box-shadow: 0 6px 20px rgba(108,92,231,0.4);
          transition: opacity 0.2s, transform 0.2s;
          font-family: inherit;
        }
        .vp-btn-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .vp-btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .vp-spin { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: vp-spin 0.7s linear infinite; display: inline-block; }
        .vp-divider { display: flex; align-items: center; gap: 0.75rem; margin: 1.5rem 0; }
        .vp-divider-line { flex: 1; height: 1px; background: #f0f0f5; }
        .vp-divider-text { font-size: 0.75rem; color: #a0a8c0; font-weight: 500; white-space: nowrap; }
        .vp-social-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .vp-social-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.6875rem 0.75rem;
          border: 1.5px solid #e8eaf0; border-radius: 10px;
          background: #fff; font-size: 0.8125rem; font-weight: 600;
          color: #1a1d2e; cursor: pointer; transition: background 0.15s;
          font-family: inherit;
        }
        .vp-social-btn:hover { background: #f7f8fc; }
        .vp-trust-box {
          display: flex; align-items: flex-start; gap: 0.75rem;
          margin-top: 1.5rem; padding: 0.875rem 1rem;
          background: #f7f8fc; border-radius: 10px; border: 1px solid #f0f0f5;
        }
        .vp-trust-title { font-size: 0.8125rem; font-weight: 700; color: #1a1d2e; margin: 0 0 0.125rem; }
        .vp-trust-sub   { font-size: 0.75rem; color: #636e8a; margin: 0; line-height: 1.5; }

        /* Footer feature strip */
        .vp-auth-footer { border-top: 1px solid #f0f0f5; background: #fff; padding: 1.5rem 2.5rem; }
        .vp-feature-grid { max-width: 800px; margin: 0 auto; display: grid; grid-template-columns: repeat(4,1fr); gap: 1.5rem; }
        .vp-feature-item { display: flex; align-items: flex-start; gap: 0.75rem; }
        .vp-feature-icon {
          width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; margin-top: 2px;
          background: rgba(108,92,231,0.08);
          display: flex; align-items: center; justify-content: center;
        }
        .vp-feature-title { font-size: 0.75rem; font-weight: 700; color: #1a1d2e; margin: 0 0 0.125rem; }
        .vp-feature-sub   { font-size: 0.6875rem; color: #636e8a; margin: 0; line-height: 1.5; }
        .vp-footer-copy   { text-align: center; font-size: 0.6875rem; color: #a0a8c0; margin-top: 1.25rem; margin-bottom: 0; }

        /* ── RESPONSIVE ───────────────────────────────── */
        @media (max-width: 1023px) {
          .vp-auth-illus-panel { display: none; }
          .vp-auth-form-panel  { flex: 0 0 100%; padding: 2rem 1.5rem; }
          .vp-feature-grid     { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 639px) {
          .vp-auth-header       { padding: 0.875rem 1rem; }
          .vp-auth-header-link  { display: none; }
          .vp-auth-form-panel   { padding: 1.5rem 1rem; align-items: flex-start; padding-top: 2rem; }
          .vp-form-title        { font-size: 1.5rem; }
          .vp-social-grid       { grid-template-columns: 1fr; }
          .vp-feature-grid      { grid-template-columns: 1fr 1fr; gap: 1rem; }
          .vp-auth-footer       { padding: 1.25rem 1rem; }
          .vp-social-btn        { font-size: 0.75rem; }
        }
        @media (max-width: 400px) {
          .vp-feature-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <header className="vp-auth-header">
        <Link to="/" className="vp-auth-logo">
          <div className="vp-auth-logo-icon">
            <GraduationCap size={18} color="#fff" />
          </div>
          <div>
            <div className="vp-auth-logo-text">VertexPortal</div>
            <div className="vp-auth-logo-sub">LMS</div>
          </div>
        </Link>
        <p className="vp-auth-header-link">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </header>

      {/* Body */}
      <div className="vp-auth-body">
        {/* Left — Form */}
        <div className="vp-auth-form-panel">
          <div className="vp-auth-form-inner">
            <h1 className="vp-form-title">Welcome Back! 👋</h1>
            <p className="vp-form-sub">Login to continue your learning journey.</p>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="vp-field">
                <div className="vp-label"><span>Email Address</span></div>
                <div className="vp-input-wrap">
                  <Mail size={15} className="vp-input-icon" />
                  <input
                    className="vp-input" type="email" required autoComplete="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="vp-field">
                <div className="vp-label">
                  <span>Password</span>
                  <Link to="/forgot-password">Forgot Password?</Link>
                </div>
                <div className="vp-input-wrap">
                  <Lock size={15} className="vp-input-icon" />
                  <input
                    className={`vp-input vp-input-pr`}
                    type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button type="button" className="vp-eye-btn" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="vp-check-row" onClick={() => setRemember(!remember)}>
                <div className="vp-check-box" style={{
                  border: `2px solid ${remember ? '#6C5CE7' : '#d1d5db'}`,
                  backgroundColor: remember ? '#6C5CE7' : '#fff',
                }}>
                  {remember && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="vp-check-label">Remember me</span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="vp-btn-primary">
                {loading ? <><span className="vp-spin" /> Signing in...</> : <>Login <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="vp-divider">
              <div className="vp-divider-line" />
              <span className="vp-divider-text">or continue with</span>
              <div className="vp-divider-line" />
            </div>

            <div className="vp-social-grid">
              <button type="button" className="vp-social-btn">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <button type="button" className="vp-social-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#24292e"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                Continue with GitHub
              </button>
            </div>

            <div className="vp-trust-box">
              <ShieldCheck size={18} color="#6C5CE7" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="vp-trust-title">Your data is safe with us</p>
                <p className="vp-trust-sub">We use industry standard security to keep your information safe.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Illustration (hidden on mobile/tablet) */}
        <div className="vp-auth-illus-panel">
          <div className="vp-illus-blob1" />
          <div className="vp-illus-blob2" />
          <div className="vp-illus-img-wrap">
            <img
              src="https://lh3.googleusercontent.com/aida/AP1WRLuipHTX_HPFvDbGqriIYgvJTY2FyvjSSFrZJftQ-Hj6YQha6vSCXsF_K5SpnkPZF5weoZbEcnT9mGFoxe11XapuQ4j1Ww40bzj_iGlOv4tJStVtP_j_xLp2oYOXd5B-oq_0sh47s7m2XKCye4ESldSVE50dczZkRIJJ8pj4Ct72YBvajWOc-2TRiARJfNe35hxNV1TKbOj0oehr4X-fyCfUOrFfeAfQAzmaobHCY2mrkZmjrnI4HaPxbJVW"
              alt="Student learning online"
            />
          </div>
          <div className="vp-illus-badge vp-badge-top">
            <span style={{ fontSize: '1.1rem' }}>⭐</span>
            <div><div className="vp-illus-badge-title">4.9 Rating</div><div className="vp-illus-badge-sub">50K+ students</div></div>
          </div>
          <div className="vp-illus-badge vp-badge-bottom">
            <span style={{ fontSize: '1.1rem' }}>🎓</span>
            <div><div className="vp-illus-badge-title">Certified</div><div className="vp-illus-badge-sub">1000+ courses</div></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="vp-auth-footer">
        <div className="vp-feature-grid">
          {features.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="vp-feature-item">
              <div className="vp-feature-icon"><Icon size={15} color="#6C5CE7" /></div>
              <div>
                <p className="vp-feature-title">{label}</p>
                <p className="vp-feature-sub">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="vp-footer-copy">© 2025 VertexPortal LMS. All rights reserved.</p>
      </footer>
    </div>
  );
}
