import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchMyCertificates,
  selectMyCertificates,
  selectCertificatesLoading,
} from '../store/slices/certificatesSlice';
import { downloadMyCertificate } from '../api/certificate.api';
import { Spinner } from '../components/ui/Spinner';
import { Award, Download, ExternalLink, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Certificates() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const certificates = useAppSelector(selectMyCertificates);
  const loading = useAppSelector(selectCertificatesLoading);

  useEffect(() => {
    dispatch(fetchMyCertificates());
  }, [dispatch]);

  const handleDownload = async (certId, title) => {
    try {
      const res = await downloadMyCertificate(certId);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Certificate-${title || certId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Certificate downloaded!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Download failed');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => {
              if (window.history.length > 1 && window.history.state?.idx > 0) {
                navigate(-1);
              } else {
                navigate('/dashboard');
              }
            }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Award size={28} color="var(--color-primary-light)" /> My Certificates
            </h1>
            <p>View and download your earned course completion certificates</p>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Spinner /></div>
        ) : certificates.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {certificates.map(cert => (
              <div key={cert._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', marginBottom: '0.75rem', fontWeight: 600 }}>
                    <ShieldCheck size={18} /> Verified Certificate
                  </div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                    {cert.course?.title || cert.courseTitle || 'Course Completion Certificate'}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Issued on: {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Code: <code style={{ color: 'var(--color-primary-light)' }}>{cert.verificationCode || cert._id}</code>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleDownload(cert._id, cert.course?.title)}>
                    <Download size={14} /> Download PDF
                  </button>
                  {cert.verificationCode && (
                    <a href={`/verify-certificate/${cert.verificationCode}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" title="Verify Certificate">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Award size={48} /></div>
            <h3>No certificates earned yet</h3>
            <p>Complete 100% of your course modules to earn your certificates!</p>
          </div>
        )}
      </div>
    </div>
  );
}
