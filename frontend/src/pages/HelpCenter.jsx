import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  ArrowLeft,
  BookOpen,
  Brain,
  Award,
  Video,
  CreditCard,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Mail,
  Sparkles,
} from 'lucide-react';

const FAQS = [
  {
    category: 'Courses & Learning',
    icon: BookOpen,
    questions: [
      {
        q: 'How do I access my purchased courses?',
        a: 'After enrolling or purchasing a course, head over to "My Learning" from the navigation bar. All your active curriculums and module progress are saved automatically in real-time.',
      },
      {
        q: 'Can I download lessons for offline viewing?',
        a: 'Yes, video lectures and exercise notebooks are accessible on all modern desktop and mobile browsers. You can also export code snippets directly from the built-in Code Playground.',
      },
      {
        q: 'How do course quizzes and assignments work?',
        a: 'Quizzes provide immediate automated grading and answer explanations. Assignments can be submitted as GitHub links or code files and are reviewed by your instructor or auto-graded.',
      },
    ],
  },
  {
    category: 'AI Tutor & Playground',
    icon: Brain,
    questions: [
      {
        q: 'What is the AI Tutor and how does it help?',
        a: 'Vertex AI Tutor is an integrated LLM assistant that uses Retrieval-Augmented Generation (RAG) mapped directly to your course knowledge base. You can ask code doubts, request syntax debugging, or get step-by-step logic explanations 24/7.',
      },
      {
        q: 'What languages are supported in the Code Playground?',
        a: 'The interactive playground supports JavaScript (Node & ES6+), React components with instant live sandbox preview, HTML/CSS canvas, and Python data algorithms with zero local install needed.',
      },
    ],
  },
  {
    category: 'Certificates & Credentials',
    icon: Award,
    questions: [
      {
        q: 'How do I claim my certificate of completion?',
        a: 'Once all course lectures, quizzes, and project milestones are marked complete (100% completion), a cryptographic certificate is automatically minted. You can view, download, or share it from the "My Certificates" portal.',
      },
      {
        q: 'How do employers verify my certificate?',
        a: 'Every certificate comes with a unique tamper-evident verification ID and public URL (e.g. vertexportal.dev/verify-certificate/CODE). Anyone can verify the authenticity and issue timestamp in seconds.',
      },
    ],
  },
  {
    category: 'Live Classes & Community',
    icon: Video,
    questions: [
      {
        q: 'How do I join live scheduled classes?',
        a: 'Navigate to "Live Classes" in your student menu. You will see upcoming cohort live streams with countdown timers and calendar reminders. Click "Join Live Stream" when the instructor goes live.',
      },
      {
        q: 'Where can I ask general programming questions?',
        a: 'Visit the "Discussions" board to collaborate with thousands of fellow developers, post code snippets, vote on helpful answers, and get instructor guidance.',
      },
    ],
  },
];

export default function HelpCenter() {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState({});

  const toggle = (catIdx, qIdx) => {
    const key = `${catIdx}-${qIdx}`;
    setOpenIndex(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaqs = FAQS.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      item =>
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0f1a] text-gray-900 dark:text-gray-100 font-[Inter,sans-serif] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#161928] text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 shadow-2xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Help &amp; Support Hub
          </span>
        </div>

        {/* Hero Header with Search */}
        <div className="rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 dark:from-[#151230] dark:via-[#1a1540] dark:to-[#0f0d22] border border-purple-400/40 dark:border-purple-600/30 p-8 sm:p-10 text-white shadow-xl relative overflow-hidden text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 dark:bg-purple-900/60 text-white dark:text-purple-200 text-xs font-bold backdrop-blur-md mx-auto">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Knowledge Base &amp; FAQs</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            How can we help you today?
          </h1>

          <div className="max-w-lg mx-auto relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              id="help-search-input"
              name="helpTopicSearch"
              type="text"
              placeholder="Search help topics (e.g. certificates, AI tutor, live class)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#161928] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 rounded-2xl shadow-md border border-gray-200 dark:border-[#2a2f4e] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            />
          </div>
        </div>

        {/* Quick Help Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/ai-chat"
            className="p-4 rounded-2xl bg-white dark:bg-[#161928] border border-gray-200/90 dark:border-slate-800 hover:border-purple-500 text-center space-y-2 shadow-2xs hover:shadow-md transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">Ask AI Tutor</p>
          </Link>

          <Link
            to="/discussions"
            className="p-4 rounded-2xl bg-white dark:bg-[#161928] border border-gray-200/90 dark:border-slate-800 hover:border-purple-500 text-center space-y-2 shadow-2xs hover:shadow-md transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">Community Forum</p>
          </Link>

          <Link
            to="/certificates"
            className="p-4 rounded-2xl bg-white dark:bg-[#161928] border border-gray-200/90 dark:border-slate-800 hover:border-purple-500 text-center space-y-2 shadow-2xs hover:shadow-md transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">Verify Credentials</p>
          </Link>

          <Link
            to="/status"
            className="p-4 rounded-2xl bg-white dark:bg-[#161928] border border-gray-200/90 dark:border-slate-800 hover:border-purple-500 text-center space-y-2 shadow-2xs hover:shadow-md transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">Platform Status</p>
          </Link>
        </div>

        {/* FAQs List */}
        <div className="space-y-6">
          {filteredFaqs.map((cat, catIdx) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.category}
                className="bg-white dark:bg-[#161928] border border-gray-200/90 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    {cat.category}
                  </h2>
                </div>

                <div className="space-y-3">
                  {cat.questions.map((faq, qIdx) => {
                    const isOpen = !!openIndex[`${catIdx}-${qIdx}`];
                    return (
                      <div
                        key={faq.q}
                        className="rounded-2xl border border-gray-100 dark:border-slate-800/80 bg-gray-50/70 dark:bg-slate-900/50 overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => toggle(catIdx, qIdx)}
                          className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between text-left gap-3 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer"
                        >
                          <span>{faq.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 sm:px-5 pb-4 pt-1 text-xs sm:text-sm text-gray-600 dark:text-slate-400 leading-relaxed border-t border-gray-100 dark:border-slate-800/80">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
