import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Globe,
  Share2,
  MessageSquare,
  Mail,
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpen,
  Video,
  Award,
  FileText,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      return toast.error('Please enter a valid email address');
    }
    toast.success('Subscribed to VertexPortal updates!');
    setEmail('');
  };

  return (
    <footer className="bg-white dark:bg-slate-950 text-gray-700 dark:text-slate-300 border-t border-gray-200/90 dark:border-slate-800/90 relative overflow-hidden font-[Inter,sans-serif] transition-colors duration-200">
      {/* Decorative Top Gradient Highlight */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand & Description */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform duration-200">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Vertex<span className="text-purple-600 dark:text-purple-400">Portal</span>
                </span>
                <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest">
                  Next-Gen LMS
                </span>
              </div>
            </Link>

            <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-sm">
              Empowering learners worldwide with interactive courses, AI tutor assistants, real-time live classes, and industry-recognized certificates.
            </p>

            {/* Platform Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold pt-1">
              <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Verified Certificates
              </div>
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> AI-Powered Learning
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600/40 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 flex items-center justify-center transition-all duration-200"
                title="Global Site"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600/40 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 flex items-center justify-center transition-all duration-200"
                title="Share Portal"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-600/40 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 flex items-center justify-center transition-all duration-200"
                title="Community Chat"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Learn Column */}
          <div>
            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-600" /> Learn
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/courses"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link
                  to="/my-learning"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  My Learning Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/discussions"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Discussions & Q&A
                </Link>
              </li>
              <li>
                <Link
                  to="/ai-chat"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  AI Tutor Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Platform
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/student/live-classes"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Live Interactive Classes
                </Link>
              </li>
              <li>
                <Link
                  to="/student/quizzes"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Quizzes & Tests
                </Link>
              </li>
              <li>
                <Link
                  to="/student/assignments"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Assignments
                </Link>
              </li>
              <li>
                <Link
                  to="/certificates"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Verified Certificates
                </Link>
              </li>
              <li>
                <Link
                  to="/student/notes"
                  className="text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Study Notes
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Stay Updated
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              Subscribe for new course releases, workshops, and platform updates.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition shadow-sm cursor-pointer"
              >
                Subscribe Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Sub-footer Bar */}
        <div className="border-t border-gray-200/90 dark:border-slate-800/90 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 dark:text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <p>© {new Date().getFullYear()} VertexPortal LMS. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
              Help Center
            </a>
            <a href="#" className="hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
              Platform Status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
