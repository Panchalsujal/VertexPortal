import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, GraduationCap } from 'lucide-react';

export default function VerifyEmail() {
  const { userId, token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/auth/verify-email/${userId}/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not connect. Please try again.');
      });
  }, [userId, token]);

  return (
    <div className="auth-page">
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', filter: 'blur(80px)', top: -80, left: -80 }} />
      <div className="auth-card" style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 48, height: 48, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <GraduationCap size={24} color="white" />
        </div>

        {status === 'loading' && (
          <>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <h3>Verifying your email…</h3>
            <p>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '0.5rem' }}>Email Verified!</h2>
            <p style={{ marginBottom: '2rem' }}>{message}</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex' }} id="verify-login-btn">
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} color="var(--color-error)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '0.5rem' }}>Verification Failed</h2>
            <p style={{ marginBottom: '2rem' }}>{message}</p>
            <Link to="/register" className="btn btn-secondary" style={{ display: 'inline-flex' }} id="verify-retry-btn">
              Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
