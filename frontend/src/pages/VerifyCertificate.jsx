import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyCertificate } from '../api/certificate.api';
import { Spinner } from '../components/ui/Spinner';
import { ShieldCheck, XCircle, User, BookOpen, Calendar, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyCertificate() {
  const { verificationCode } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [isValid, setIsValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(verificationCode || '');

  useEffect(() => {
    async function check() {
      if (!verificationCode) return;
      setLoading(true);
      setError(null);
      try {
        const res = await verifyCertificate(verificationCode);
        const certObj = res.data.certificate || res.data.data?.certificate || res.data;
        setCert(certObj);
        setIsValid(res.data.valid !== false && certObj?.status !== 'revoked');
      } catch (err) {
        setError(err.message || 'Invalid or expired certificate code');
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [verificationCode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    navigate(`/verify-certificate/${searchInput.trim()}`);
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: 650 }}>
        {/* Search Bar for manual verification */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Enter Certificate Code, Number (e.g. CERT-2026-...) or ID"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            <Search size={16} /> Verify
          </button>
        </form>

        {!verificationCode && !loading && !cert && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <ShieldCheck size={56} color="var(--color-primary-light)" style={{ margin: '0 auto 1rem' }} />
            <h2>Verify Credential</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Enter a certificate verification code or certificate number above to verify its authenticity.
            </p>
          </div>
        )}

        {loading ? (
          <div className="glass-card animate-pulse" style={{ padding: '3rem', maxWidth: 640, margin: '0 auto' }}>
            <div style={{ height: 28, background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)', width: '60%', margin: '0 auto 1.5rem' }} />
            <div style={{ height: 20, background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)', width: '80%', margin: '0 auto 1rem' }} />
            <div style={{ height: 20, background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-sm)', width: '50%', margin: '0 auto' }} />
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <XCircle size={56} color="var(--color-error)" style={{ margin: '0 auto 1rem' }} />
            <h2>Certificate Not Found</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{error}</p>
          </div>
        ) : cert ? (
          <div className="glass-card" style={{ padding: '2.5rem', border: `1px solid ${isValid ? 'var(--color-success)' : 'var(--color-error)'}` }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {isValid ? (
                <>
                  <ShieldCheck size={56} color="var(--color-success)" style={{ margin: '0 auto 1rem' }} />
                  <span className="badge badge-success" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Authentic & Verified</span>
                </>
              ) : (
                <>
                  <XCircle size={56} color="var(--color-error)" style={{ margin: '0 auto 1rem' }} />
                  <span className="badge badge-danger" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Certificate Revoked</span>
                </>
              )}
              <h1 style={{ fontSize: '1.75rem', marginTop: '1rem' }}>Certificate of Completion</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>VertexPortal LMS Credential Verification</p>
            </div>

            <div style={{ background: 'var(--color-bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User color="var(--color-primary-light)" size={20} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Issued To</span>
                  <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{cert.studentName || cert.student?.fullName || 'Learner'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BookOpen color="var(--color-primary-light)" size={20} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Course</span>
                  <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{cert.courseTitle || cert.course?.title}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar color="var(--color-primary-light)" size={20} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completion Date</span>
                  <p style={{ fontWeight: 600 }}>{new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Verification Code: <code style={{ color: 'var(--color-primary-light)' }}>{verificationCode || cert.verificationCode}</code>
              {cert.certificateNumber && <div style={{ marginTop: 4 }}>Certificate No: <strong>{cert.certificateNumber}</strong></div>}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
