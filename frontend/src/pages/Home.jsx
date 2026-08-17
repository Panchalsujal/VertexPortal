import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, FreeMode } from 'swiper/modules';

// Swiper core styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/free-mode';

import {
  Sparkles, ArrowRight, Play, CheckCircle2, Star, Users, Trophy,
  BookOpen, Code2, Brain, ShieldCheck, Flame, Search, ChevronRight,
  ChevronLeft, Terminal, Layers, Award, Laptop, Mail, MessageSquare,
  GraduationCap, Globe, Check, ArrowUpRight, Zap, CheckCircle,
  Phone, Clock, Headphones, Compass, Heart, Grid, ListFilter
} from 'lucide-react';
import { getAllCourses } from '../api/course.api';
import { getAllCategories } from '../api/category.api';
import { CourseCard } from '../components/course/CourseCard';
import { ButtonGroup, ButtonGroupItem, ConnectedButtonGroup } from '../components/ui/ButtonGroup';

// ── Organic Doodles & SVGs (EduLe Inspired) ──
function DoodleUnderline() {
  return (
    <svg className="absolute -bottom-2.5 left-0 w-full h-3.5 text-purple-500/80 dark:text-purple-400/90 pointer-events-none" viewBox="0 0 250 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 14C55 4 150 2 247 11C190 6 95 10 12 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// ── Hero Interactive Vector IDE Component ──
function HeroInteractiveWorkspace() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none select-none">
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-indigo-500/15 to-transparent rounded-3xl blur-3xl -z-10" />

      {/* Floating Pill Badge 1 */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
        className="absolute -top-5 -left-4 z-20 bg-white dark:bg-[#161928] border border-gray-200 dark:border-[#2a2f4e] rounded-2xl p-3 shadow-xl flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-black text-gray-900 dark:text-white leading-tight">200+ Video Courses</p>
          <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">Updated for 2026</p>
        </div>
      </motion.div>

      {/* Floating Pill Badge 2 */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -bottom-4 -right-3 z-20 bg-white dark:bg-[#161928] border border-gray-200 dark:border-[#2a2f4e] rounded-2xl p-3 shadow-xl flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-black text-gray-900 dark:text-white">4.9 / 5.0</span>
            <span className="text-[10px] text-emerald-600 font-bold">★ Verified</span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-slate-400">10,000+ Enrolled Students</p>
        </div>
      </motion.div>

      {/* Main Glassmorphic Card */}
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-[#161928] border border-gray-200/90 dark:border-[#2a2f4e] rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400 inline-block shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-2xs" />
            <span className="text-[11px] font-mono font-bold text-gray-500 dark:text-slate-400 ml-2">
              VertexPortal • Studio Live
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE SANDBOX
          </span>
        </div>

        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-950 rounded-2xl p-4 text-white space-y-3 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Active Curriculum</p>
                <h4 className="text-sm font-extrabold text-white">Full-Stack MERN Architect 2026</h4>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-purple-200 bg-white/10 px-2.5 py-1 rounded-lg">
              Module 5 / 12
            </span>
          </div>

          <div className="space-y-1 relative z-10">
            <div className="flex justify-between text-[11px] text-purple-200 font-medium">
              <span>Overall Completion</span>
              <span className="font-bold text-white">82% (Verified)</span>
            </div>
            <div className="w-full h-2.5 bg-purple-950/80 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full w-[82%]" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-slate-900/90 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 font-mono text-xs text-gray-800 dark:text-slate-300 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500 mb-1 font-sans">
            <span className="flex items-center gap-1 font-mono text-purple-600 dark:text-purple-400">
              <Terminal className="w-3.5 h-3.5" /> app.controller.js
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Redis Tier: L2 Active</span>
          </div>
          <p><span className="text-purple-600 dark:text-purple-400">const</span> response = <span className="text-blue-600 dark:text-blue-400">await</span> cache.<span className="text-amber-600 dark:text-amber-300">getOrRender</span>(&#123;</p>
          <p className="pl-4">key: <span className="text-emerald-600 dark:text-emerald-400">'course:complete-mern-2026'</span>,</p>
          <p className="pl-4">renderFn: <span className="text-blue-600 dark:text-blue-400">async</span> () =&gt; fetchCourseBySlug(slug)</p>
          <p>&#125;);</p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300">
            <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <span>AI Tutor: Ready to assist</span>
          </div>
          <Link to="/ai-chat" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
            Ask Tutor <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ── Certificate Vector Badge Component ──
function CertificateSealVector() {
  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
      <motion.div
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl bg-gradient-to-br from-purple-500/30 to-indigo-500/20 border-2 border-purple-400/50 p-5 shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden backdrop-blur-md"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-950 flex items-center justify-center shadow-lg">
          <Award className="w-7 h-7" />
        </div>

        <div className="space-y-1.5 w-full">
          <div className="h-2.5 w-3/4 bg-white/80 rounded-full mx-auto" />
          <div className="h-2 w-1/2 bg-white/50 rounded-full mx-auto" />
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 rounded-full text-[10px] font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>CRYPTOGRAPHIC VERIFIED</span>
        </div>
      </motion.div>
    </div>
  );
}

const TECH_STACK = [
  { name: 'React 19', color: 'from-cyan-500/20 to-blue-500/10', border: 'border-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400' },
  { name: 'Next.js 15', color: 'from-slate-500/20 to-slate-800/10', border: 'border-slate-500/30', text: 'text-slate-700 dark:text-slate-300' },
  { name: 'Node.js', color: 'from-emerald-500/20 to-green-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'TypeScript', color: 'from-blue-500/20 to-indigo-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400' },
  { name: 'Python & AI', color: 'from-amber-500/20 to-yellow-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
  { name: 'Docker & DevOps', color: 'from-sky-500/20 to-cyan-500/10', border: 'border-sky-500/30', text: 'text-sky-600 dark:text-sky-400' },
  { name: 'Redis & Caching', color: 'from-rose-500/20 to-red-500/10', border: 'border-rose-500/30', text: 'text-rose-600 dark:text-rose-400' },
  { name: 'MongoDB', color: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400' },
];

const CAREER_ROADMAPS = [
  {
    title: 'Full-Stack MERN Architect',
    level: 'Beginner to Advanced',
    duration: '16 Weeks',
    desc: 'Master MongoDB, Express, React, Node.js, JWT, Redis caching, microservices, and cloud deployments.',
    tag: 'Most Popular',
    link: '/courses',
  },
  {
    title: 'AI & Full-Stack Engineer',
    level: 'Intermediate',
    duration: '12 Weeks',
    desc: 'Build RAG applications, integrate LLMs, function calling, vector databases, and real-time AI agents.',
    tag: 'Hot Track',
    link: '/courses',
  },
  {
    title: 'Frontend & UI Systems Pro',
    level: 'All Levels',
    duration: '10 Weeks',
    desc: 'Deep dive into Next.js App Router, Tailwind, motion animations, state management, and web performance.',
    tag: 'High Demand',
    link: '/courses',
  },
];

const PLATFORM_FEATURES = [
  {
    icon: Code2,
    title: 'Interactive Code Playground',
    desc: 'Write, execute, and test JavaScript, React, and Python directly in your browser with zero setup.',
    badge: 'Hands-on',
    link: '/playground',
  },
  {
    icon: Brain,
    title: '24/7 AI Tutor & Code Assistant',
    desc: 'Stuck on a bug? Your personal Mistral AI tutor explains complex topics and fixes errors instantly.',
    badge: 'AI Powered',
    link: '/ai-chat',
  },
  {
    icon: Award,
    title: 'Tamper-Evident Certificates',
    desc: 'Earn digitally signed, verifiable certificates of completion with unique cryptographic IDs.',
    badge: 'Verified',
    link: '/certificates',
  },
  {
    icon: Users,
    title: 'Peer Discussion & Community',
    desc: 'Collaborate with fellow developers, participate in code reviews, and get mentor assistance.',
    badge: 'Collaborative',
    link: '/discussions',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Full-Stack Developer',
    company: 'TechCorp India',
    text: 'VertexPortal completely changed how I learn. The AI tutor explains complex topics instantly, and live classes feel genuinely interactive. Got my dream job in 5 months.',
    avatar: 'https://ik.imagekit.io/Sujalpanchal/default.avif',
    rating: 5,
  },
  {
    name: 'Arjun Mehta',
    role: 'Backend & Cloud Engineer',
    company: 'Analytics Labs',
    text: 'The course structure and Redis/SSR architecture lessons are top notch. I went from basics to production deployments. The verified certificates gave my resume a major boost!',
    avatar: 'https://ik.imagekit.io/Sujalpanchal/default.avif',
    rating: 5,
  },
  {
    name: 'Neha Gupta',
    role: 'Frontend Specialist',
    company: 'Creative Labs',
    text: 'The integrated code playground, clean UI, and structured roadmaps make learning so frictionless. Best learning experience by far!',
    avatar: 'https://ik.imagekit.io/Sujalpanchal/default.avif',
    rating: 5,
  },
  {
    name: 'Rohan Verma',
    role: 'Software Engineer',
    company: 'CloudScale Technologies',
    text: 'Hands down the best full-stack learning platform. The roadmaps are practical, exercises are real-world, and the community is supportive!',
    avatar: 'https://ik.imagekit.io/Sujalpanchal/default.avif',
    rating: 5,
  },
];

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllCourses({ limit: 12, sort: 'popular', status: 'published' }),
      getAllCategories(),
    ])
      .then(([cr, catr]) => {
        setCourses(cr.data.courses || cr.data.data?.courses || cr.data.data || []);
        setCategories(catr.data.categories || catr.data.data?.categories || catr.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchCat =
        selectedCategory === 'all' ||
        c.category?._id === selectedCategory ||
        c.category?.slug === selectedCategory ||
        c.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [courses, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0f1a] text-gray-900 dark:text-gray-100 font-[Inter,sans-serif] selection:bg-purple-500 selection:text-white transition-colors duration-200">
      
      {/* ══════════════════════════════════════════════════════════
          HERO SECTION (EduLe & ChaiCode Style)
      ══════════════════════════════════════════════════════════ */}
      <section className="relative pt-8 pb-16 lg:pt-14 lg:pb-24 overflow-hidden bg-gradient-to-b from-purple-50/70 via-white to-[#f8fafc] dark:from-[#131628] dark:via-[#0f1222] dark:to-[#0d0f1a] border-b border-gray-200/70 dark:border-slate-800/80">
        
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-20 right-10 w-[500px] h-[350px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 space-y-7 text-center lg:text-left"
            >
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 text-xs font-bold shadow-2xs">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Start your favorite course</span>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="hidden sm:inline text-purple-600 dark:text-purple-400">Cohort 2026</span>
              </div>

              <div className="relative">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.14]">
                  Now learning from anywhere, and build your{' '}
                  <span className="relative inline-block text-purple-600 dark:text-purple-400">
                    bright career.
                    <DoodleUnderline />
                  </span>
                </h1>
              </div>

              <p className="text-base sm:text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Step-by-step full-stack roadmaps, built-in interactive playgrounds, 24/7 AI tutor assistance, and industry-recognized verified certificates.
              </p>

              {/* Search Bar */}
              <div className="max-w-xl mx-auto lg:mx-0 relative">
                <div className="flex items-center bg-white dark:bg-[#161928] border border-gray-200 dark:border-[#2a2f4e] rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500 transition-all">
                  <Search className="w-5 h-5 text-gray-400 dark:text-slate-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search your course (e.g. MERN Stack, React, Python)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none"
                  />
                  <Link
                    to={`/courses${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition shrink-0 inline-flex items-center gap-1.5"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Shadcn-Style Connected Button Group for Primary Actions */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1">
                <ConnectedButtonGroup className="border border-purple-600/30 dark:border-purple-500/30 shadow-lg shadow-purple-600/20">
                  <Link
                    to="/courses"
                    className="px-7 py-3.5 rounded-l-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm transition-all inline-flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Start A Course</span>
                  </Link>
                  <Link
                    to="/playground"
                    className="px-6 py-3.5 rounded-r-2xl bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border-l border-purple-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 font-bold text-sm transition-all inline-flex items-center gap-2"
                  >
                    <Code2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Playground</span>
                  </Link>
                </ConnectedButtonGroup>

                <Link
                  to="/ai-chat"
                  className="px-5 py-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 font-bold text-sm transition-all inline-flex items-center gap-2"
                >
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>AI Tutor 24/7</span>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-2 border-t border-gray-200/60 dark:border-slate-800 text-xs text-gray-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['#6C5CE7', '#0984e3', '#00b894', '#fdcb6e'].map((color, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-white dark:border-[#0d0f1a] flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                        style={{ backgroundColor: color }}
                      >
                        {['SP', 'AK', 'NG', 'RJ'][i]}
                      </div>
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">10,000+ Enrolled Learners</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">4.9 / 5.0</span>
                  <span>(2.4k+ Reviews)</span>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              <HeroInteractiveWorkspace />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TECH STACK MATRIX
      ══════════════════════════════════════════════════════════ */}
      <section className="py-8 bg-white dark:bg-[#101322] border-b border-gray-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 mb-5">
            Learn Industry-Standard Production Technologies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {TECH_STACK.map((tech) => (
              <motion.div
                key={tech.name}
                whileHover={{ scale: 1.05 }}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${tech.color} border ${tech.border} text-xs font-bold ${tech.text} shadow-2xs flex items-center gap-2 cursor-default`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{tech.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          ALL COURSES SHOWCASE (With Shadcn ButtonGroup & Swiper.js)
      ══════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title and Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2">
              <Sparkles className="w-4 h-4" /> Explore Catalog
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              All Courses of VertexPortal
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Curated, project-oriented courses taught by industry veterans.
            </p>
          </div>

          {/* Shadcn Connected Button Group for Swiper Controls */}
          <div className="flex items-center gap-3">
            <ConnectedButtonGroup className="border border-gray-200 dark:border-slate-800">
              <button
                id="course-prev-btn"
                className="w-10 h-10 rounded-l-2xl bg-white dark:bg-[#161928] text-gray-700 dark:text-slate-300 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                aria-label="Previous Course"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                id="course-next-btn"
                className="w-10 h-10 rounded-r-2xl bg-white dark:bg-[#161928] border-l border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                aria-label="Next Course"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </ConnectedButtonGroup>

            <Link
              to="/courses"
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline ml-2"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Shadcn ButtonGroup for Category Selection */}
        <div className="mb-8 overflow-x-auto pb-2 no-scrollbar">
          <ButtonGroup className="gap-1 min-w-full sm:min-w-0">
            <ButtonGroupItem
              active={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>All Courses</span>
            </ButtonGroupItem>
            {categories.map((cat) => (
              <ButtonGroupItem
                key={cat._id}
                active={selectedCategory === cat._id}
                onClick={() => setSelectedCategory(cat._id)}
              >
                <span>{cat.name}</span>
              </ButtonGroupItem>
            ))}
          </ButtonGroup>
        </div>

        {/* Swiper Courses Carousel */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#161928] rounded-3xl border border-gray-200 dark:border-slate-800 p-4 space-y-4 animate-pulse">
                <div className="aspect-video w-full rounded-2xl bg-gray-200 dark:bg-slate-800" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation={{
              prevEl: '#course-prev-btn',
              nextEl: '#course-next-btn',
            }}
            pagination={{ clickable: true, dynamicBullets: true }}
            spaceBetween={24}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 20 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
              1280: { slidesPerView: 4, spaceBetween: 24 },
            }}
            className="!pb-12"
          >
            {filteredCourses.map((course) => (
              <SwiperSlide key={course._id} className="h-auto">
                <CourseCard course={course} />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-[#161928] border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-gray-400" />
            <h4 className="text-base font-bold text-gray-900 dark:text-white">No Courses Found</h4>
            <p className="text-xs text-gray-500 dark:text-slate-400">Try selecting another category or clear your search filter.</p>
          </div>
        )}

        {/* Center CTA Button */}
        <div className="text-center mt-6">
          <Link
            to="/courses"
            className="px-8 py-3.5 rounded-2xl bg-white dark:bg-[#161928] border border-gray-200 dark:border-slate-800 hover:border-purple-500 text-purple-600 dark:text-purple-400 font-extrabold text-xs sm:text-sm shadow-2xs hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Explore All Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CAREER ROADMAPS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-b from-white via-gray-50 to-white dark:from-[#101322] dark:via-[#0e1020] dark:to-[#101322] border-y border-gray-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
              Structured Career Tracks
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Guided Paths to Land High-Paying Roles
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Follow curated sequential curricula designed to take you from foundational basics to system architect level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CAREER_ROADMAPS.map((track) => (
              <motion.div
                key={track.title}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-2xs hover:shadow-xl transition-all duration-300 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-3 py-1 bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800/60">
                      {track.tag}
                    </span>
                    <span className="text-xs font-medium text-gray-400 dark:text-slate-500">
                      {track.duration}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                    {track.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                    {track.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                    {track.level}
                  </span>
                  <Link
                    to={track.link}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:underline"
                  >
                    <span>View Roadmap</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          WHY CHOOSE VERTEXPORTAL
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
            Platform Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Built from the Ground Up for Modern Learners
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Everything you need to practice, build, collaborate, and get certified.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLATFORM_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-3xl p-6 space-y-4 shadow-2xs hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/60">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
                <Link
                  to={feat.link}
                  className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline pt-1"
                >
                  Explore <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          VERIFIED SKILLS CERTIFICATE BANNER (EduAll Photo 2 Inspiration)
      ══════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          whileHover={{ scale: 1.005 }}
          className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 border border-purple-800/40 p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/10 px-3.5 py-1.5 rounded-full text-purple-200 backdrop-blur-md border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Credentials &amp; Tamper-Evident Proof
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight">
                Get Quality Skills Certificate From the VertexPortal
              </h3>
              <p className="text-sm text-purple-200/90 leading-relaxed max-w-xl">
                Every completed curriculum awards a verified cryptographic digital credential with instant public verification URL for LinkedIn and resumes.
              </p>
              
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <Link
                  to="/certificates"
                  className="px-7 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Verify a Certificate</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/courses"
                  className="px-7 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/15 transition-all inline-flex items-center gap-2"
                >
                  <span>Start A Course</span>
                </Link>
              </div>
            </div>

            <div className="md:col-span-4 flex items-center justify-center">
              <CertificateSealVector />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STUDENT TESTIMONIALS (With Swiper Autoplay Slider)
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">
            Student Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Loved by Thousands of Developers
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Real outcomes from students who transformed their engineering careers with VertexPortal.
          </p>
        </div>

        {/* Swiper Testimonials Slider */}
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          spaceBetween={24}
          slidesPerView={1}
          breakpoints={{
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="!pb-12"
        >
          {TESTIMONIALS.map((testi) => (
            <SwiperSlide key={testi.name} className="h-auto">
              <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xs hover:shadow-lg transition-all h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(testi.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed italic">
                    "{testi.text}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <img
                    src={testi.avatar}
                    alt={testi.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{testi.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{testi.role} • {testi.company}</p>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CONTACT & HELP CALLOUT (EduAll Photo 2)
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white dark:bg-[#101322] border-t border-gray-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#161928] border border-gray-200/70 dark:border-slate-800 space-y-2 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto sm:mx-0">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Global Community</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400">Join learners across 40+ countries on Discord and live forums.</p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#161928] border border-gray-200/70 dark:border-slate-800 space-y-2 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto sm:mx-0">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">AI-Powered Support</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400">Instant answers to code doubts, syntax explanations, and exercises.</p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#161928] border border-gray-200/70 dark:border-slate-800 space-y-2 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto sm:mx-0">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Verified Career Proof</h4>
              <p className="text-xs text-gray-500 dark:text-slate-400">Showcase your verified certificates and projects directly to recruiters.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
