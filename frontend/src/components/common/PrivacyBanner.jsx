import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, X } from 'lucide-react';

// Renamed from CookieConsent to avoid ad-blocker false positives (ERR_BLOCKED_BY_CLIENT)
export function PrivacyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('vp_cookie_consent');
      if (!consent) {
        // Show after a brief delay for smooth appearance
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  const handleAccept = (type) => {
    try {
      localStorage.setItem('vp_cookie_consent', JSON.stringify({ type, timestamp: new Date().toISOString() }));
    } catch (_) {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Privacy Preferences"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl text-gray-800 dark:text-slate-200">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>Privacy Preferences</span>
              </h3>
              <button
                onClick={() => handleAccept('essential')}
                aria-label="Close privacy banner"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 -mr-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
              We use essential cookies for session authentication, theme persistence, and learning progress. By continuing, you agree to our{' '}
              <Link to="/privacy" className="text-purple-600 dark:text-purple-400 font-medium underline hover:text-purple-700">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/terms" className="text-purple-600 dark:text-purple-400 font-medium underline hover:text-purple-700">
                Terms of Service
              </Link>.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
              <button
                onClick={() => handleAccept('all')}
                className="flex-1 min-w-[120px] px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accept All</span>
              </button>
              <button
                onClick={() => handleAccept('essential')}
                className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Essential Only
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Also export as CookieConsent for backward compatibility
export { PrivacyBanner as CookieConsent };
export default PrivacyBanner;
