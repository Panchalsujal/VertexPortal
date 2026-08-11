import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight,
  GraduationCap, Clock, Award, Users2
} from 'lucide-react';
import { register as registerApi } from '../api/auth.api';
import toast from 'react-hot-toast';

const features = [
  { icon: GraduationCap, label: 'Personalized Learning', sub: 'Get personalized recommendations.' },
  { icon: Users2,        label: 'Expert Instructors',    sub: 'Learn from industry experts.' },
  { icon: Clock,         label: 'Flexible Learning',     sub: 'Learn at your own pace.' },
  { icon: Award,         label: 'Certificates',          sub: 'Earn recognized certificates.' },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw]   = useState(false);
  const [showCp, setShowCp]   = useState(false);
  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);

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
      await registerApi({ fullName: form.fullName, email: form.email, password: form.password });
      toast.success('Account created! Please check your email to verify.', { duration: 6000 });
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vpr-root">
      <style>{`
        * { box-sizing: border-box; }
        @keyframes vpr-spin { to { transform: rotate(360deg); } }

        .vpr-root {
          min-height: 100vh; display: flex; flex-direction: column;
          background: #fff; font-family: 'Inter','Plus Jakarta Sans',sans-serif;
        }
        .vpr-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 2rem; border-bottom: 1px solid #f0f0f5;
          background: #fff; position: sticky; top: 0; z-index: 10;
        }
        .vpr-logo { display: flex; align-items: center; gap: 0.625rem; text-decoration: none; }
        .vpr-logo-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(108,92,231,0.35);
        }
        .vpr-logo-text { font-size: 0.9rem; font-weight: 800; color: #1a1d2e; line-height: 1.2; }
        .vpr-logo-sub  { font-size: 0.6rem; font-weight: 600; color: #6C5CE7; margin-top: 1px; }
        .vpr-header-note { font-size: 0.8125rem; color: #636e8a; margin: 0; }
        .vpr-header-note a { color: #6C5CE7; font-weight: 700; text-decoration: none; }

        .vpr-body { flex: 1; display: flex; overflow: hidden; }

        .vpr-form-panel {
          flex: 0 0 50%; display: flex; align-items: center; justify-content: center;
          padding: 2rem 3.5rem; background: #fff; overflow-y: auto;
        }
        .vpr-form-inner { width: 100%; max-width: 380px; }

        .vpr-illus-panel {
          flex: 0 0 50%;
          background: radial-gradient(ellipse at 40% 50%, #ddd6fe 0%, #ede9fe 40%, #f3f1ff 70%, #faf9ff 100%);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden; padding: 2rem;
        }
        .vpr-blob1 { position: absolute; top: 10%; left: 10%; width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, rgba(108,92,231,0.2) 0%, transparent 70%); }
        .vpr-blob2 { position: absolute; bottom: 15%; right: 8%; width: 120px; height: 120px; border-radius: 50%; background: radial-gradient(circle, rgba(162,155,254,0.25) 0%, transparent 70%); }
        .vpr-img-wrap {
          position: relative; z-index: 2; border-radius: 24px; overflow: hidden; max-width: 380px;
          box-shadow: 0 30px 80px rgba(108,92,231,0.2), 0 10px 30px rgba(0,0,0,0.08);
        }
        .vpr-img-wrap img { width: 100%; height: auto; display: block; }
        .vpr-badge {
          position: absolute; background: #fff; border-radius: 12px;
          padding: 0.625rem 0.875rem; z-index: 3;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          display: flex; align-items: center; gap: 0.5rem;
        }
        .vpr-badge-tr { top: 22%; right: 12%; }
        .vpr-badge-bl { bottom: 22%; left: 10%; }
        .vpr-badge-title { font-size: 0.75rem; font-weight: 700; color: #6C5CE7; }
        .vpr-badge-sub   { font-size: 0.6875rem; color: #636e8a; }

        /* Form */
        .vpr-title  { font-size: 1.875rem; font-weight: 800; color: #1a1d2e; margin: 0 0 0.375rem; letter-spacing: -0.03em; }
        .vpr-sub    { font-size: 0.875rem; color: #636e8a; margin: 0 0 1.75rem; }
        .vpr-field  { margin-bottom: 1.125rem; }
        .vpr-label  { display: block; font-size: 0.8125rem; font-weight: 600; color: #1a1d2e; margin-bottom: 0.5rem; }
        .vpr-iw     { position: relative; }
        .vpr-icon   { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: #a0a8c0; pointer-events: none; }
        .vpr-input  {
          width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem;
          font-size: 0.875rem; color: #1a1d2e;
          border: 1.5px solid #e8eaf0; border-radius: 10px;
          outline: none; background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .vpr-input::placeholder { color: #a0a8c0; }
        .vpr-input:focus { border-color: #6C5CE7; box-shadow: 0 0 0 3px rgba(108,92,231,0.12); }
        .vpr-input-pr { padding-right: 2.75rem; }
        .vpr-eye { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #a0a8c0; display: flex; padding: 0; }
        .vpr-strength-bars { display: flex; gap: 4px; margin-top: 8px; margin-bottom: 4px; }
        .vpr-strength-bar  { flex: 1; height: 4px; border-radius: 999px; transition: background-color 0.3s; }
        .vpr-strength-label { font-size: 0.6875rem; font-weight: 600; }
        .vpr-input-hint   { font-size: 0.6875rem; color: #a0a8c0; margin: 0.375rem 0 0; }
        .vpr-terms-row    { display: flex; align-items: flex-start; gap: 0.625rem; margin-bottom: 1.25rem; cursor: pointer; }
        .vpr-checkbox     { width: 18px; height: 18px; border-radius: 5px; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; cursor: pointer; }
        .vpr-terms-text   { font-size: 0.875rem; color: #636e8a; line-height: 1.5; user-select: none; }
        .vpr-terms-text a { color: #6C5CE7; font-weight: 700; text-decoration: none; }
        .vpr-submit {
          width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.875rem 1.5rem; border-radius: 12px;
          background: linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%);
          color: #fff; font-size: 0.9375rem; font-weight: 700;
          border: none; cursor: pointer;
          box-shadow: 0 6px 20px rgba(108,92,231,0.4);
          transition: opacity 0.2s, transform 0.2s;
          font-family: inherit;
        }
        .vpr-submit:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        .vpr-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        .vpr-spin { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: vpr-spin 0.7s linear infinite; display: inline-block; }
        .vpr-divider { display: flex; align-items: center; gap: 0.75rem; margin: 1.25rem 0; }
        .vpr-line { flex: 1; height: 1px; background: #f0f0f5; }
        .vpr-divider-txt { font-size: 0.75rem; color: #a0a8c0; font-weight: 500; white-space: nowrap; }
        .vpr-social { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .vpr-social-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.6875rem 0.75rem;
          border: 1.5px solid #e8eaf0; border-radius: 10px;
          background: #fff; font-size: 0.8125rem; font-weight: 600;
          color: #1a1d2e; cursor: pointer; transition: background 0.15s;
          font-family: inherit;
        }
        .vpr-social-btn:hover { background: #f7f8fc; }
        .vpr-student-notice {
          display: flex; align-items: flex-start; gap: 0.75rem;
          margin-top: 1.25rem; padding: 0.875rem 1rem;
          background: linear-gradient(135deg, #f3f1ff 0%, #ede9fe 100%);
          border-radius: 10px; border: 1px solid #ddd6fe;
        }
        .vpr-student-notice p { font-size: 0.75rem; color: #5b4fcf; margin: 0; line-height: 1.6; }

        /* Footer */
        .vpr-footer { border-top: 1px solid #f0f0f5; background: #fff; padding: 1.5rem 2.5rem; }
        .vpr-feat-grid { max-width: 800px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        .vpr-feat-item { display: flex; align-items: flex-start; gap: 0.75rem; }
        .vpr-feat-icon { width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; margin-top: 2px; background: rgba(108,92,231,0.08); display: flex; align-items: center; justify-content: center; }
        .vpr-feat-name { font-size: 0.75rem; font-weight: 700; color: #1a1d2e; margin: 0 0 0.125rem; }
        .vpr-feat-desc { font-size: 0.6875rem; color: #636e8a; margin: 0; line-height: 1.5; }
        .vpr-copy { text-align: center; font-size: 0.6875rem; color: #a0a8c0; margin-top: 1.25rem; margin-bottom: 0; }

        /* ── RESPONSIVE ─────────────────────────────── */
        @media (max-width: 1023px) {
          .vpr-illus-panel  { display: none; }
          .vpr-form-panel   { flex: 0 0 100%; padding: 2rem 1.5rem; }
          .vpr-feat-grid    { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 639px) {
          .vpr-header       { padding: 0.875rem 1rem; }
          .vpr-header-note  { display: none; }
          .vpr-form-panel   { padding: 1.5rem 1rem; align-items: flex-start; padding-top: 1.75rem; }
          .vpr-title        { font-size: 1.5rem; }
          .vpr-social       { grid-template-columns: 1fr; }
          .vpr-feat-grid    { grid-template-columns: 1fr 1fr; gap: 1rem; }
          .vpr-footer       { padding: 1.25rem 1rem; }
          .vpr-social-btn   { font-size: 0.75rem; }
        }
        @media (max-width: 400px) {
          .vpr-feat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <header className="vpr-header">
        <Link to="/" className="vpr-logo">
          <div className="vpr-logo-icon"><GraduationCap size={18} color="#fff" /></div>
          <div>
            <div className="vpr-logo-text">VertexPortal</div>
            <div className="vpr-logo-sub">LMS</div>
          </div>
        </Link>
        <p className="vpr-header-note">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </header>

      {/* Body */}
      <div className="vpr-body">
        {/* Left — Form */}
        <div className="vpr-form-panel">
          <div className="vpr-form-inner">
            <h1 className="vpr-title">Create Your Account 🚀</h1>
            <p className="vpr-sub">Join VertexPortal LMS and start your learning journey.</p>

            <form onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="vpr-field">
                <label className="vpr-label">Full Name</label>
                <div className="vpr-iw">
                  <User size={15} className="vpr-icon" />
                  <input className="vpr-input" type="text" required autoComplete="name" placeholder="Enter your full name"
                    value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                </div>
              </div>

              {/* Email */}
              <div className="vpr-field">
                <label className="vpr-label">Email Address</label>
                <div className="vpr-iw">
                  <Mail size={15} className="vpr-icon" />
                  <input className="vpr-input" type="email" required autoComplete="email" placeholder="Enter your email"
                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>

              {/* Password */}
              <div className="vpr-field">
                <label className="vpr-label">Password</label>
                <div className="vpr-iw">
                  <Lock size={15} className="vpr-icon" />
                  <input className="vpr-input vpr-input-pr"
                    type={showPw ? 'text' : 'password'} required autoComplete="new-password" placeholder="Create a password"
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                  <button type="button" className="vpr-eye" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.password && (
                  <div>
                    <div className="vpr-strength-bars">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="vpr-strength-bar"
                          style={{ backgroundColor: i <= strength ? strengthMeta?.color : '#f0f0f5' }} />
                      ))}
                    </div>
                    <span className="vpr-strength-label" style={{ color: strengthMeta?.color }}>{strengthMeta?.label}</span>
                  </div>
                )}
                <p className="vpr-input-hint">Password must be at least 8 characters long.</p>
              </div>

              {/* Confirm Password */}
              <div className="vpr-field">
                <label className="vpr-label">Confirm Password</label>
                <div className="vpr-iw">
                  <Lock size={15} className="vpr-icon" />
                  <input className="vpr-input vpr-input-pr"
                    type={showCp ? 'text' : 'password'} required autoComplete="new-password" placeholder="Confirm your password"
                    value={form.confirmPassword}
                    onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    style={{ borderColor: form.confirmPassword && form.password !== form.confirmPassword ? '#d63031' : '' }}
                  />
                  <button type="button" className="vpr-eye" onClick={() => setShowCp(!showCp)}>
                    {showCp ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="vpr-terms-row" onClick={() => setAgreed(!agreed)}>
                <div className="vpr-checkbox" style={{
                  border: `2px solid ${agreed ? '#6C5CE7' : '#d1d5db'}`,
                  backgroundColor: agreed ? '#6C5CE7' : '#fff',
                }}>
                  {agreed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="vpr-terms-text">
                  I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                </span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="vpr-submit">
                {loading ? <><span className="vpr-spin" /> Creating Account...</> : <>Create Account <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="vpr-divider">
              <div className="vpr-line" />
              <span className="vpr-divider-txt">or sign up with</span>
              <div className="vpr-line" />
            </div>

            <div className="vpr-social">
              <button type="button" className="vpr-social-btn">
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </button>
              <button type="button" className="vpr-social-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#24292e"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                Continue with GitHub
              </button>
            </div>

            <div className="vpr-student-notice">
              <GraduationCap size={16} color="#6C5CE7" style={{ flexShrink: 0, marginTop: 2 }} />
              <p>
                By creating an account, you will be registered{' '}
                <strong>as a student by default.</strong>{' '}
                Instructors and admins are assigned by the platform administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Right — Illustration (hidden on mobile/tablet) */}
        <div className="vpr-illus-panel">
          <div className="vpr-blob1" /><div className="vpr-blob2" />
          <div className="vpr-img-wrap">
            <img
              src="https://lh3.googleusercontent.com/aida/AP1WRLvdjjDXZQciRzfNOj5ANQ_ysdqBWLSnd7labDiffVy1l9sG1OMHABChl-kMwyrcwRM-y-nspFgMHT88flRfZpCTigxD_aE3cNVruP5NuRjRKzpUsmVV_9oLj8TYSIFb7rZW_iAfva0GcpjqMt5jGvY2BduYHLO_Jr8TmHkXV6tExhkYFk4oG6QZcNa6Epb7YhHRhMxPt9PWlVjc8Kcmc2gwqDde1nLrHsOKWD4hiaUyVPKH-dsigTs3UKE"
              alt="Student registering online"
            />
          </div>
          <div className="vpr-badge vpr-badge-tr">
            <span style={{ fontSize: '1.1rem' }}>📚</span>
            <div><div className="vpr-badge-title">1000+ Courses</div><div className="vpr-badge-sub">Start learning</div></div>
          </div>
          <div className="vpr-badge vpr-badge-bl">
            <span style={{ fontSize: '1.1rem' }}>🏆</span>
            <div><div className="vpr-badge-title">Get Certified</div><div className="vpr-badge-sub">Industry recognized</div></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="vpr-footer">
        <div className="vpr-feat-grid">
          {features.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="vpr-feat-item">
              <div className="vpr-feat-icon"><Icon size={15} color="#6C5CE7" /></div>
              <div>
                <p className="vpr-feat-name">{label}</p>
                <p className="vpr-feat-desc">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="vpr-copy">© 2025 VertexPortal LMS. All rights reserved.</p>
      </footer>
    </div>
  );
}
