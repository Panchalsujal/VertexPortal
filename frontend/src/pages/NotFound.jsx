import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Compass,
  ArrowLeft,
  Home,
  BookOpen,
  Code2,
  HelpCircle,
  Search,
  Sparkles,
  MessageSquare,
  Activity,
  GraduationCap
} from 'lucide-react';

const QUICK_LINKS = [
  {
    title: 'Browse Courses',
    desc: 'Explore 200+ full-stack, AI, and cloud masterclasses',
    to: '/courses',
    icon: BookOpen,
    color: 'from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Code Playground',
    desc: 'Run JS, test HTML & debug in the browser sandbox',
    to: '/playground',
    icon: Code2,
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'Community Discussions',
    desc: 'Ask questions, solve doubts, and discuss code',
    to: '/discussions',
    icon: MessageSquare,
    color: 'from-blue-500/20 to-sky-500/20 text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Help Center & FAQs',
    desc: 'Find instant answers, support guides, and tutorials',
    to: '/help',
    icon: HelpCircle,
    color: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400',
  },
];

export default function NotFound() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>404 — Page Not Found | NavGujarat Academy</title>
        <meta
          name="description"
          content="The page you are looking for does not exist or has been moved. Explore NavGujarat Academy online courses, AI tutor, live classrooms, and coding playground."
        />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-gray-900 dark:text-slate-100 font-[Inter,sans-serif] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-600/15 via-indigo-500/10 to-pink-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-3xl w-full mx-auto text-center space-y-8 relative z-10">
          
          {/* Animated 404 Hero Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative inline-flex flex-col items-center justify-center"
          >
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100/90 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-bold shadow-xs mb-4">
              <Compass className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Error 404 • Destination Lost in Orbit</span>
            </div>

            {/* Giant 404 Typography */}
            <h1 className="text-8xl sm:text-9xl md:text-[140px] font-black tracking-tighter leading-none bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-800 bg-clip-text text-transparent drop-shadow-sm select-none">
              404
            </h1>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Oops! Page not found
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              The URL you visited might have been relocated, removed, or simply mistyped. Let&apos;s get you back on track!
            </p>
          </motion.div>

          {/* Quick Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-md mx-auto"
          >
            <form onSubmit={handleSearch} className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search courses, topics, tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-3 bg-white dark:bg-[#13192b] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 text-xs sm:text-sm rounded-2xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm transition"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Search
              </button>
            </form>
          </motion.div>

          {/* Primary Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white dark:bg-[#13192b] border border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-200 font-bold text-xs sm:text-sm hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/30 transition hover:scale-105 active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </Link>
          </motion.div>

          {/* Popular Portals Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="pt-6 border-t border-gray-200/80 dark:border-slate-800/80"
          >
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">
              Explore Popular Portals
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#13192b] border border-gray-200/90 dark:border-slate-800/90 hover:border-purple-500/80 dark:hover:border-purple-500/80 flex items-center gap-3.5 shadow-2xs hover:shadow-md transition group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition truncate">
                        {link.title}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">
                        {link.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
