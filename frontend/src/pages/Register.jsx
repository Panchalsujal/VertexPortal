import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, UserCheck } from 'lucide-react';
import { register as registerApi } from '../api/auth.api';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'student' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await registerApi(form);
      toast.success('Registration successful! Please check your email to verify your account.', { duration: 6000 });
      navigate('/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', filter: 'blur(80px)', top: -100, left: -100 }} className="auth-orb" />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', filter: 'blur(80px)', bottom: -50, right: -50 }} className="auth-orb" />

      <div className="auth-card animate-fade-in-up">
        <Link to="/" className="auth-logo">
          <div style={{ width: 40, height: 40, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} color="white" />
          </div>
          <span className="gradient-text">Vertex Portal</span>
        </Link>

        <h2 className="auth-title">Create your account</h2>
        <p className="auth-subtitle">Join 50,000+ learners worldwide</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="input-group">
            <label className="input-label" htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              className="input-field"
              placeholder="John Doe"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              required
              autoFocus
            />
          </div>

          {/* Email */}
          <div className="input-group">
            <label className="input-label" htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <label className="input-label" htmlFor="reg-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reg-password"
                type={showPw ? 'text' : 'password'}
                className="input-field"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ paddingRight: 44 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none' }}
                id="reg-toggle-pw"
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="input-group">
            <label className="input-label" htmlFor="reg-role">I want to</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[
                { value: 'student', label: 'Learn', desc: 'Take courses' },
                { value: 'instructor', label: 'Teach', desc: 'Create courses' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, role: opt.value }))}
                  style={{
                    flex: 1, padding: '0.875rem', borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${form.role === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: form.role === opt.value ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                    color: form.role === opt.value ? 'var(--color-primary-light)' : 'var(--text-secondary)',
                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  id={`role-${opt.value}-btn`}
                >
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{opt.label}</div>
                  <div style={{ fontSize: '0.8125rem', opacity: 0.7 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} id="reg-submit-btn" style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="spinner spinner-sm" /> Creating account…
              </span>
            ) : (
              <><UserCheck size={18} /> Create Account</>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
