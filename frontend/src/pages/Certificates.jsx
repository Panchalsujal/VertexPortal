import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchMyCertificates,
  selectMyCertificates,
  selectCertificatesLoading,
} from '../store/slices/certificatesSlice';
import { downloadMyCertificate } from '../api/certificate.api';
import { SkeletonFeed } from '../components/ui/Spinner';
import { Award, Download, ExternalLink, ShieldCheck, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
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
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Download failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#0b0f17] font-[Inter,sans-serif] py-6 sm:py-10 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                My Certificates <Sparkles className="w-5 h-5 text-sky-500" />
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Official verified certificates of completion for your completed courses
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Grid */}
        <div>
          {loading ? (
            <SkeletonFeed count={3} />
          ) : certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((cert) => {
                const courseTitle = cert.course?.title || cert.courseTitle || 'Course Completion Certificate';
                const certCode = cert.verificationCode || cert.certificateNumber || cert._id;
                const formattedDate = new Date(cert.issuedAt || cert.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={cert._id}
                    className="relative bg-white dark:bg-gray-900 border border-sky-200 dark:border-sky-900/40 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Top-Right Decorative Geometric Polygons */}
                    <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none opacity-20 dark:opacity-30 group-hover:opacity-40 transition-opacity">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <polygon points="100,0 0,0 60,60" fill="#0284c7" />
                        <polygon points="100,0 100,100 40,40" fill="#38bdf8" />
                        <polygon points="60,60 100,100 40,80" fill="#7dd3fc" />
                      </svg>
                    </div>

                    <div>
                      {/* Badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mb-4">
                        <ShieldCheck className="w-4 h-4 text-sky-500" />
                        <span>Verified Credential</span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-snug mb-2 line-clamp-2">
                        {courseTitle}
                      </h3>

                      {/* Metadata */}
                      <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-6">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Issued on {formattedDate}</span>
                        </div>
                        <div className="font-mono text-[11px] text-gray-400">
                          ID: <span className="text-gray-700 dark:text-gray-300 font-semibold">{cert.certificateNumber || certCode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <button
                        onClick={() => handleDownload(cert._id, courseTitle)}
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>

                      {cert.verificationCode && (
                        <a
                          href={`/verify-certificate/${cert.verificationCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-gray-600 dark:text-gray-300 hover:text-sky-600 rounded-xl transition"
                          title="Verify Certificate"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center mx-auto mb-4 text-sky-600 dark:text-sky-400 shadow-sm">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                No certificates earned yet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                Complete 100% of lectures in any course to automatically generate and unlock your verified certificate of completion!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
