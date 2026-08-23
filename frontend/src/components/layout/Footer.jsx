import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  ShieldCheck,
  Zap,
  MessageSquare,
  BookOpen,
  Video,
  Sparkles,
  GraduationCap,
  Globe,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function Footer() {
  const [email, setEmail] = useState('');
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      return toast.error('Please enter a valid email address');
    }
    toast.success('Subscribed to NavGujarat Academy updates!');
    setEmail('');
  };

  return (
    <footer className="bg-white dark:bg-neutral-950 text-gray-700 dark:text-neutral-300 border-t border-gray-200 dark:border-neutral-800 relative overflow-hidden font-sans transition-colors duration-200">
      <div className="h-[1px] w-full bg-gray-200 dark:bg-neutral-800" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Brand & Description */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group no-underline">
              <div className="w-10 h-10 rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
                <GraduationCap className="w-5 h-5 text-current" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                  NavGujarat Academy
                </span>
                <span className="block text-[10px] text-gray-500 dark:text-neutral-400 font-bold uppercase tracking-widest">
                  Online Learning
                </span>
              </div>
            </Link>

            <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed max-w-sm">
              Empowering learners worldwide with interactive courses, AI tutor assistants, real-time live classes, and industry-recognized certificates.
            </p>

            {/* Platform Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <ShieldCheck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span>Verified Certificates</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>AI-Powered Learning</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-1">
              <Link
                to="/courses"
                className="w-9 h-9 rounded-md bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600/40 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-all duration-200"
                title="Browse All Courses"
              >
                <Globe className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  toast.success('NavGujarat Academy link copied to clipboard!');
                }}
                className="w-9 h-9 rounded-md bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600/40 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Share Portal"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <Link
                to="/discussions"
                className="w-9 h-9 rounded-md bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600/40 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white flex items-center justify-center transition-all duration-200"
                title="Community Discussions"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Learn Column */}
          <div className="sm:col-span-1 lg:col-span-2 space-y-3.5">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-900 shrink-0" /> Learn
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/courses"
                  className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:tranneutral-x-1 inline-flex items-center transition-all duration-200"
                >
                  All Courses
                </Link>
              </li>
              <li>
                <Link
                  to="/courses?sort=popular"
                  className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:tranneutral-x-1 inline-flex items-center transition-all duration-200"
                >
                  Popular Masterclasses
                </Link>
              </li>
              <li>
                <Link
                  to="/courses?sort=newest"
                  className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:tranneutral-x-1 inline-flex items-center transition-all duration-200"
                >
                  Newly Added
                </Link>
              </li>
              <li>
                <Link
                  to="/playground"
                  className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:tranneutral-x-1 inline-flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap"
                >
                  <span>Code Playground</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    Live
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Column */}
          <div className="sm:col-span-1 lg:col-span-3 space-y-3.5">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" /> Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/ai-chat"
                  className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:tranneutral-x-1 inline-flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap"
                >
                  <span>AI Study Assistant</span>
                  <Sparkles className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 shrink-0" />
                </Link>
              </li>
              <li>
                <Link
                  to="/discussions"
                  className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:tranneutral-x-1 inline-flex items-center transition-all duration-200"
                >
                  Discussion Forum
                </Link>
              </li>
              <li>
                <Link
                  to="/certificates"
                  className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:tranneutral-x-1 inline-flex items-center transition-all duration-200"
                >
                  Verified Certificates
                </Link>
              </li>
              <li>
                <Link
                  to="/student/notes"
                  className="text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:tranneutral-x-1 inline-flex items-center transition-all duration-200"
                >
                  Study Notes
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-3.5">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" /> Stay Updated
            </h4>
            <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
              Subscribe for new course releases, workshops, and platform updates.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -tranneutral-y-1/2 pointer-events-none text-gray-400">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  id="footer-newsletter-email"
                  name="subscriberEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-md text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold py-3 px-3 rounded-lg transition shadow-sm cursor-pointer"
              >
                <span>Subscribe Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Sub-footer Bar */}
        <div className="border-t border-gray-200/90 dark:border-neutral-800/90 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 dark:text-neutral-400 gap-4 text-center sm:text-left">
          <div>
            <p>© {new Date().getFullYear()} NavGujarat Academy. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 font-medium">
            <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link to="/help" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Help Center
            </Link>
            <Link to="/status" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Platform Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
