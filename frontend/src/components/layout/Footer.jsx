import { useState } from 'react';
import { Link } from 'react-router-dom';
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

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      return toast.error('Please enter a valid email address');
    }
    toast.success('Subscribed to NavGujarat Academy updates!');
    setEmail('');
  };

  return (
    <footer className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 border-t border-gray-200/90 dark:border-slate-800/90 relative overflow-hidden font-[Inter,sans-serif] transition-colors duration-200">
      {/* Subtle Top Gradient Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-purple-600/40 via-indigo-500 to-purple-600/40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Brand & Description */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group no-underline">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  NavGujarat<span className="text-purple-600 dark:text-purple-400">Academy</span>
                </span>
                <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest">
                  Online Learning
                </span>
              </div>
            </Link>

            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-sm">
              Empowering learners worldwide with interactive courses, AI tutor assistants, real-time live classes, and industry-recognized certificates.
            </p>

            {/* Platform Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
              <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
                className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600/40 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 flex items-center justify-center transition-all duration-200"
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
                className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600/40 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 flex items-center justify-center transition-all duration-200 cursor-pointer"
                title="Share Portal"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <Link
                to="/discussions"
                className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600/40 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 flex items-center justify-center transition-all duration-200"
                title="Community Discussions"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Learn Column */}
          <div className="sm:col-span-1 lg:col-span-2 space-y-3.5">
            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" /> Learn
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/courses"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-flex items-center transition-all duration-200"
                >
                  All Courses
                </Link>
              </li>
              <li>
                <Link
                  to="/courses?sort=popular"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-flex items-center transition-all duration-200"
                >
                  Popular Masterclasses
                </Link>
              </li>
              <li>
                <Link
                  to="/courses?sort=newest"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-flex items-center transition-all duration-200"
                >
                  Newly Added
                </Link>
              </li>
              <li>
                <Link
                  to="/playground"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap"
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
            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" /> Platform
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  to="/ai-chat"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-flex items-center gap-1.5 transition-all duration-200 whitespace-nowrap"
                >
                  <span>AI Study Assistant</span>
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                </Link>
              </li>
              <li>
                <Link
                  to="/discussions"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-flex items-center transition-all duration-200"
                >
                  Discussion Forum
                </Link>
              </li>
              <li>
                <Link
                  to="/certificates"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-flex items-center transition-all duration-200"
                >
                  Verified Certificates
                </Link>
              </li>
              <li>
                <Link
                  to="/student/notes"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-flex items-center transition-all duration-200"
                >
                  Study Notes
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-3.5">
            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-3.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" /> Stay Updated
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Subscribe for new course releases, workshops, and platform updates.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
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
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-xs cursor-pointer"
              >
                <span>Subscribe Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Sub-footer Bar */}
        <div className="border-t border-gray-200/90 dark:border-slate-800/90 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 dark:text-slate-400 gap-4 text-center sm:text-left">
          <div>
            <p>© {new Date().getFullYear()} NavGujarat Academy. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6 font-medium">
            <Link to="/privacy" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
              Terms of Service
            </Link>
            <Link to="/help" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
              Help Center
            </Link>
            <Link to="/status" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
              Platform Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
