import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Globe, Share2, MessageSquare, Mail, ArrowRight,
  ShieldCheck, Zap
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
    <footer className="bg-slate-950 text-slate-200 border-t border-slate-800/80 relative overflow-hidden font-[Inter,sans-serif]">
      {/* Decorative Top Glow Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">

          {/* Brand & Description */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-950/50 group-hover:scale-105 transition-transform duration-200">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-white tracking-tight">
                  Vertex<span className="text-purple-400">Portal</span>
                </span>
                <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-widest">
                  Next-Gen LMS
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Empowering learners worldwide with world-class interactive courses, AI tutor assistants, live classes, and verified certificates.
            </p>

            {/* Platform Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 pt-1">
              <div className="flex items-center gap-1.5 text-purple-400">
                <ShieldCheck className="w-4 h-4 text-purple-400" /> 100% Verified Certificates
              </div>
              <div className="flex items-center gap-1.5 text-blue-400">
                <Zap className="w-4 h-4 text-blue-400" /> AI-Powered Learning
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-2">
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-purple-600/20 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200" title="Global Site">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-purple-600/20 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200" title="Share Portal">
                <Share2 className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 hover:bg-purple-600/20 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200" title="Community Chat">
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Learn Column */}
          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Learn
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/courses" className="text-slate-300 hover:text-purple-400 hover:translate-x-1 inline-block transition-all duration-200">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link to="/my-learning" className="text-slate-300 hover:text-purple-400 hover:translate-x-1 inline-block transition-all duration-200">
                  My Learning Portal
                </Link>
              </li>
              <li>
                <Link to="/discussions" className="text-slate-300 hover:text-purple-400 hover:translate-x-1 inline-block transition-all duration-200">
                  Discussions & Q&A
                </Link>
              </li>
              <li>
                <Link to="/ai-chat" className="text-slate-300 hover:text-purple-400 hover:translate-x-1 inline-block transition-all duration-200">
                  AI Tutor Assistant
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Platform
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/student/live-classes" className="text-slate-300 hover:text-purple-400 hover:translate-x-1 inline-block transition-all duration-200">
                  Live Interactive Classes
                </Link>
              </li>
              <li>
                <Link to="/student/quizzes" className="text-slate-300 hover:text-purple-400 hover:translate-x-1 inline-block transition-all duration-200">
                  Quizzes & Assessments
                </Link>
              </li>
              <li>
                <Link to="/student/assignments" className="text-slate-300 hover:text-purple-400 hover:translate-x-1 inline-block transition-all duration-200">
                  Assignments
                </Link>
              </li>
              <li>
                <Link to="/certificates" className="text-slate-300 hover:text-purple-400 hover:translate-x-1 inline-block transition-all duration-200">
                  Verified Certificates
                </Link>
              </li>
              <li>
                <Link to="/student/notes" className="text-slate-300 hover:text-purple-400 hover:translate-x-1 inline-block transition-all duration-200">
                  Study Notes
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Stay Updated
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Subscribe for new course releases, live workshop invitations, and platform updates.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition shadow-md shadow-purple-950/40 cursor-pointer"
              >
                Subscribe Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Sub-footer Bar */}
        <div className="border-t border-slate-800/80 mt-14 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <p>© {new Date().getFullYear()} VertexPortal LMS. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400 font-medium">
            <a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Help Center</a>
            <a href="#" className="hover:text-purple-400 transition-colors">Status</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
