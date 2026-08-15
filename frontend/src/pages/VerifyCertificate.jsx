import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyCertificate } from '../api/certificate.api';
import { ShieldCheck, XCircle, User, BookOpen, Calendar, Search, ArrowLeft, CheckCircle2, Sparkles, Award } from 'lucide-react';

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
        setError(err.response?.data?.message || err.message || 'Invalid or expired certificate code');
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
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#0b0f17] font-[Inter,sans-serif] py-8 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Certificate Code or Number (e.g. CERT-2026-...)"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>
          </form>
        </div>

        {!verificationCode && !loading && !cert && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center mx-auto mb-4 text-sky-600 dark:text-sky-400 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verify Certificate Credential</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
              Enter any VertexPortal certificate verification code or certificate number above to verify authenticity against the immutable database records.
            </p>
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center animate-pulse space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-800 mx-auto" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-48 mx-auto" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full w-64 mx-auto" />
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-red-200 dark:border-red-900/40 p-10 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400 shadow-sm">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Certificate Not Found</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{error}</p>
          </div>
        ) : cert ? (
          /* Geometric Certificate Card (Photo 4 Match) */
          <div className="relative bg-white dark:bg-gray-900 border-2 border-sky-300 dark:border-sky-800 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden">
            {/* Top-Right Polygons */}
            <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-30 dark:opacity-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="100,0 0,0 60,60" fill="#0284c7" />
                <polygon points="100,0 100,100 40,40" fill="#38bdf8" />
                <polygon points="60,60 100,100 40,80" fill="#7dd3fc" />
              </svg>
            </div>

            {/* Bottom-Left Polygons */}
            <div className="absolute bottom-0 left-0 w-36 h-36 pointer-events-none opacity-30 dark:opacity-40">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon points="0,100 100,100 40,40" fill="#0284c7" />
                <polygon points="0,100 0,0 60,60" fill="#38bdf8" />
                <polygon points="40,40 0,0 60,20" fill="#7dd3fc" />
              </svg>
            </div>

            <div className="relative z-10 text-center space-y-6">
              {/* Top Verified Pill */}
              <div>
                {isValid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Official & Verified Credential</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Certificate Revoked</span>
                  </span>
                )}
              </div>

              {/* Brand Header */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">VERTEXPORTAL</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                  Certificate of Completion
                </h1>
              </div>

              {/* Student Name */}
              <div className="py-2">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Proudly Presented To</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                  {cert.studentName || cert.student?.fullName || 'Student'}
                </h2>
                <div className="w-24 h-0.5 bg-sky-500 mx-auto mt-2 rounded-full" />
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
                for successfully completing the comprehensive professional program on{' '}
                <strong className="text-gray-900 dark:text-white font-bold">
                  {cert.courseTitle || cert.course?.title || 'Advanced Course'}
                </strong>{' '}
                demonstrating exemplary dedication and proficiency.
              </p>

              {/* Signatures & Date Grid */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4 max-w-md mx-auto text-xs">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">Hitesh Choudhary</p>
                  <p className="text-[11px] text-gray-400">Founder & CEO, VertexPortal</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-[11px] text-gray-400">Date of Certification</p>
                </div>
              </div>

              {/* Meta ID */}
              <div className="text-[11px] text-gray-400 font-mono pt-2">
                Certificate ID: <strong className="text-gray-700 dark:text-gray-300">{cert.certificateNumber || verificationCode || cert.verificationCode}</strong>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
