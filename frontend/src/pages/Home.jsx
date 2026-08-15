import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Animated icons (hover-animated via @animateicons/react)
import {
  ArrowRightIcon,
  StarIcon,
  ZapIcon,
  BookOpenIcon,
  MessageSquareIcon,
  VideoIcon,
  CircleCheckIcon,
  UsersIcon,
  SparklesIcon,
  ChevronRightIcon,
  ClockIcon,
  LayersIcon,
  PlayIcon,
  FlameIcon,
  TrendingUpIcon,
  BrainIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from '@animateicons/react/lucide';
// Static icons not in animateicons package
import {
  Award as AwardStatic,
  GraduationCap as GraduationCapStatic,
  Trophy as TrophyStatic,
  Target as TargetStatic,
  CheckCircle2 as CheckCircle2Static,
  BarChart3 as BarChart3Static,
  Shield as ShieldStatic,
  Bot as BotStatic,
} from 'lucide-react';
import { getAllCourses } from '../api/course.api';
import { getAllCategories } from '../api/category.api';
import { CourseCard } from '../components/course/CourseCard';

const STATS = [
  { value: '50K+', label: 'Active Students', icon: UsersIcon },
  { value: '200+', label: 'Expert Courses', icon: BookOpenIcon },
  { value: '4.8★', label: 'Average Rating', icon: StarIcon },
  { value: '95%', label: 'Completion Rate', icon: TrophyStatic },
];

const FEATURES = [
  {
    icon: BrainIcon,
    title: 'AI Tutor Assistant',
    desc: 'Powered by Mistral LLM with RAG — answers any question from within your course context, 24/7.',
    tag: 'AI-Powered',
  },
  {
    icon: VideoIcon,
    title: 'Live Interactive Classes',
    desc: 'Real-time WebRTC video sessions with instructors — join from anywhere with a single click.',
    tag: 'Live WebRTC',
  },
  {
    icon: MessageSquareIcon,
    title: 'Community Discussions',
    desc: 'Threaded Q&A, peer collaboration, and instructor responses all in one organized space.',
    tag: 'Collaborative',
  },
  {
    icon: AwardStatic,
    title: 'Verified Certificates',
    desc: 'Earn industry-recognized digital certificates automatically upon completing any course.',
    tag: 'Verified',
  },
  {
    icon: ZapIcon,
    title: 'Quizzes & Assessments',
    desc: 'Auto-graded quizzes, structured assignments, and real-time progress dashboards built in.',
    tag: 'Auto-graded',
  },
  {
    icon: ChartBarIcon,
    title: 'Learning Analytics',
    desc: 'Track completion rates, time spent, attendance records, and performance in real-time.',
    tag: 'Real-time',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Your Account', desc: 'Sign up free in seconds. No credit card required to get started and browse courses.', icon: TargetStatic },
  { step: '02', title: 'Enroll in a Course', desc: 'Browse curated courses across tech, design, and business. Enroll instantly.', icon: BookOpenIcon },
  { step: '03', title: 'Learn with AI Support', desc: 'Watch HD lectures, take quizzes, join live sessions, and ask your AI tutor anything.', icon: BrainIcon },
  { step: '04', title: 'Earn Your Certificate', desc: 'Complete the curriculum and receive a verified certificate to share on your profile.', icon: TrophyStatic },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Full-Stack Developer',
    company: 'TechCorp India',
    text: 'VertexPortal completely changed how I learn. The AI tutor explains complex topics instantly, and live classes feel genuinely interactive. Got my dream job in 5 months.',
    initials: 'PS',
    color: '#6C5CE7',
    rating: 5,
  },
  {
    name: 'Arjun Mehta',
    role: 'Data Scientist',
    company: 'Analytics Labs',
    text: 'The course structure is impeccable. I went from beginner to production-ready in one course. Certificate verification made my resume stand out among hundreds of applicants.',
    initials: 'AM',
    color: '#0984e3',
    rating: 5,
  },
  {
    name: 'Neha Gupta',
    role: 'UI/UX Designer',
    company: 'Creative Studio',
    text: "Best learning platform I've used in years. Community discussions, structured assignments, and a responsive instructor community make it miles ahead of any competitor.",
    initials: 'NG',
    color: '#00b894',
    rating: 5,
  },
];

function CourseCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#e8eaf0] dark:border-slate-800 rounded-2xl overflow-hidden animate-pulse flex flex-col">
      <div className="aspect-video bg-[#f0f2f8] dark:bg-slate-800 w-full" />
      <div className="p-5 space-y-3 flex-1">
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-[#f0f2f8] dark:bg-slate-800 rounded-full" />
          <div className="h-5 w-14 bg-[#f0f2f8] dark:bg-slate-800 rounded-full" />
        </div>
        <div className="h-4 bg-[#f0f2f8] dark:bg-slate-800 rounded-lg w-full" />
        <div className="h-4 bg-[#f0f2f8] dark:bg-slate-800 rounded-lg w-3/4" />
        <div className="h-3 bg-[#f0f2f8] dark:bg-slate-800 rounded w-1/2" />
      </div>
      <div className="px-5 pb-5 flex justify-between items-center border-t border-[#f0f2f8] dark:border-slate-800 pt-4">
        <div className="h-6 w-16 bg-[#f0f2f8] dark:bg-slate-800 rounded" />
        <div className="h-9 w-28 bg-[#f0f2f8] dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="h-10 w-32 bg-[#f0f2f8] dark:bg-slate-800 rounded-xl animate-pulse" />
  );
}

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllCourses({ limit: 6, sort: 'popular', status: 'published' }),
      getAllCategories(),
    ])
      .then(([cr, catr]) => {
        setCourses(cr.data.courses || cr.data.data?.courses || cr.data.data || []);
        setCategories(catr.data.categories || catr.data.data?.categories || catr.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#f7f8fc] dark:bg-slate-950 min-h-screen text-[#1a1d2e] dark:text-white antialiased overflow-x-hidden"
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}
    >

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative bg-white dark:bg-[#0e1022] border-b border-[#e8eaf0] dark:border-[#1e2240] overflow-hidden">
        {/* Mesh gradient bg */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 55% at 70% -5%, rgba(108,92,231,0.09) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at -5% 85%, rgba(162,155,254,0.07) 0%, transparent 65%)' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 lg:pt-20 lg:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* ── Left ── */}
            <div className="space-y-7">
              {/* Trust pill */}
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border"
                style={{ color: '#6C5CE7', background: '#f3f1ff', borderColor: '#ddd6fe' }}
              >
                <FlameIcon size={14} color="#f97316" />
                Trusted by 50,000+ Students &amp; Professionals
              </div>

              {/* H1 */}
              <h1 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", letterSpacing: '-0.03em' }}
                className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold leading-[1.1] text-[#1a1d2e] dark:text-white"
              >
                The Smarter Way to{' '}
                <span style={{ background: 'linear-gradient(135deg,#6C5CE7,#a29bfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Learn Skills
                </span>{' '}
                Online
              </h1>

              <p className="text-base sm:text-lg text-[#636e8a] dark:text-slate-400 leading-relaxed max-w-lg">
                VertexPortal combines HD courses, an AI study tutor, live interactive classes,
                peer discussions, quizzes, and verified certificates in one beautifully designed LMS.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-1">
                <Link to="/courses"
                  className="group inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-2xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg,#6C5CE7 0%,#5046d4 100%)', boxShadow: '0 6px 24px -4px rgba(108,92,231,0.38)' }}
                >
                  Explore Courses
                  <ArrowRightIcon size={16} color="white" />
                </Link>
                <Link to="/ai-chat"
                  className="inline-flex items-center gap-2 text-sm font-bold px-7 py-3.5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
                  style={{ color: '#6C5CE7', background: '#f3f1ff', borderColor: '#ddd6fe' }}
                >
                  <SparklesIcon size={15} color="#6C5CE7" />
                  Try AI Tutor
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {['#6C5CE7','#0984e3','#00b894','#e17055','#fdcb6e'].map((bg, i) => (
                      <div key={i}
                        className="w-9 h-9 rounded-full border-2 border-white dark:border-[#0e1022] flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                        style={{ background: bg }}
                      >
                        {['PS','AM','NK','SR','RK'][i]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 mb-0.5">
                      {[1,2,3,4,5].map(i => (
                        <StarIcon key={i} size={13} color="#f9ca24" />
                      ))}
                    </div>
                    <p className="text-xs text-[#a0a8c0] dark:text-slate-500 font-medium">
                      Rated 4.8/5 by 10,000+ learners
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#636e8a] dark:text-slate-400 font-medium">
                  <ShieldCheckIcon size={14} color="#00b894" />
                  Free plan, no credit card needed
                </div>
              </div>
            </div>

            {/* ── Right: Dashboard Mockup ── */}
            <div className="relative mt-6 lg:mt-0">
              {/* Badge: Certificate */}
              <div className="absolute -top-5 left-2 z-20 flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-[#e8eaf0] dark:border-slate-700 rounded-2xl px-3.5 py-2.5 shadow-lg">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#00b894,#00cec9)' }}>
                  <TrophyStatic className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1a1d2e] dark:text-white leading-none">Certificate Earned!</p>
                  <p className="text-[11px] text-[#a0a8c0] mt-0.5">React Developer — Advanced</p>
                </div>
              </div>

              {/* Main dark card */}
              <div className="rounded-3xl p-5 space-y-4 shadow-2xl border border-[#23244a]"
                style={{ background: 'linear-gradient(160deg,#12152a 0%,#0e1022 100%)' }}>
                {/* Browser chrome */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex gap-1.5">
                    {['#ff5f57','#febc2e','#28c840'].map(c => (
                      <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                  <span className="text-[11px] text-[#636e8a]">vertexportal.app</span>
                </div>

                {/* Now playing */}
                <div className="rounded-2xl p-4 space-y-3" style={{ background: '#1c2040' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                      style={{ background: 'linear-gradient(135deg,#6C5CE7,#5046d4)' }}>
                      <PlayIcon size={16} color="white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#a0a8c0] mb-0.5">Now Playing</p>
                      <h3 className="text-sm font-bold text-white truncate"
                        style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        Fullstack Development 2026
                      </h3>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-[#636e8a]">Lecture 8 of 12</span>
                      <span className="font-bold" style={{ color: '#a29bfe' }}>65% complete</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#2e325a' }}>
                      <div className="h-full rounded-full w-[65%]"
                        style={{ background: 'linear-gradient(90deg,#6C5CE7,#a29bfe)' }} />
                    </div>
                  </div>
                </div>

                {/* Lesson list */}
                <div className="space-y-2">
                  {[
                    { label: 'Express Routes & Middleware', done: true },
                    { label: 'JWT Authentication Flow', active: true },
                    { label: 'AI Tutor Context & RAG Search', done: false },
                  ].map(({ label, done, active }) => (
                    <div key={label}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium"
                      style={{
                        background: active ? 'rgba(108,92,231,0.18)' : 'rgba(255,255,255,0.04)',
                        border: active ? '1px solid rgba(108,92,231,0.35)' : '1px solid transparent',
                        color: active ? '#c4b5fd' : '#8892b0',
                      }}
                    >
                      {done ? (
                        <CircleCheckIcon size={15} color="#00b894" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 shrink-0"
                          style={{ borderColor: active ? '#6C5CE7' : '#3a3f6e' }} />
                      )}
                      <span className="flex-1 truncate">{label}</span>
                      {active && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 text-white"
                          style={{ background: '#6C5CE7' }}>
                          Active
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* AI strip */}
                <div className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: 'rgba(108,92,231,0.12)', border: '1px solid rgba(108,92,231,0.25)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#6C5CE7,#5046d4)' }}>
                    <BrainIcon size={15} color="white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold mb-1" style={{ color: '#a29bfe' }}>AI Tutor</p>
                    <p className="text-xs text-[#8892b0] leading-relaxed">
                      JWT tokens encode user data into a signed string. The server verifies the signature on every request…
                    </p>
                  </div>
                </div>
              </div>

              {/* Badge: AI */}
              <div className="absolute -bottom-4 right-2 z-20 flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-[#e8eaf0] dark:border-slate-700 rounded-2xl px-3.5 py-2.5 shadow-lg">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6C5CE7,#5046d4)' }}>
                  <TrophyStatic className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1a1d2e] dark:text-white leading-none">AI Tutor Active</p>
                  <p className="text-[11px] text-[#a0a8c0] mt-0.5">Ready to answer your questions</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════ STATS STRIP ══════════════ */}
      <div className="border-b border-[#e8eaf0] dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#e8eaf0] dark:divide-slate-800">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-4 py-7 px-6 first:pl-0 last:pr-0">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: '#f3f1ff' }}>
                  <Icon size={20} color="#6C5CE7" />
                </div>
                <div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.02em', color: '#1a1d2e' }}
                    className="text-2xl font-extrabold dark:text-white">
                    {value}
                  </p>
                  <p className="text-xs text-[#636e8a] dark:text-slate-400 font-medium mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ CATEGORIES ══════════════ */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
              style={{ color: '#6C5CE7', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              <GraduationCapStatic className="w-3.5 h-3.5" style={{ color: '#6C5CE7' }} />  Browse Topics
            </p>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.025em' }}
              className="text-2xl sm:text-3xl font-extrabold text-[#1a1d2e] dark:text-white">
              Find Your Learning Path
            </h2>
            <p className="text-sm text-[#636e8a] dark:text-slate-400 mt-1">
              Curated course categories for every career goal
            </p>
          </div>
          <Link to="/courses"
            className="shrink-0 inline-flex items-center gap-1 text-sm font-bold transition-colors hover:opacity-80"
            style={{ color: '#6C5CE7' }}>
            View all <ChevronRightIcon size={15} color="#6C5CE7" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 8 }).map((_, i) => <CategorySkeleton key={i} />)}
          </div>
        ) : categories.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {categories.slice(0, 12).map(cat => (
              <Link key={cat._id} to={`/courses?category=${cat._id}`}
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-[#1a1d2e] dark:text-white border-[#e8eaf0] dark:border-slate-700 hover:border-[#6C5CE7] hover:text-[#6C5CE7] hover:bg-[#f3f1ff] transition-all duration-200 hover:-translate-y-0.5 shadow-xs"
              >
                <BookOpenIcon size={14} color="#6C5CE7" />
                {cat.name}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* ══════════════ POPULAR COURSES ══════════════ */}
      <section className="py-16 border-t border-[#e8eaf0] dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
                style={{ color: '#6C5CE7', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                <TrendingUpIcon size={13} color="#6C5CE7" /> Most Popular
              </p>
              <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.025em' }}
                className="text-2xl sm:text-3xl font-extrabold text-[#1a1d2e] dark:text-white">
                Top Courses Right Now
              </h2>
              <p className="text-sm text-[#636e8a] dark:text-slate-400 mt-1">
                Hand-picked by thousands of learners
              </p>
            </div>
            <Link to="/courses"
              className="shrink-0 inline-flex items-center gap-1 text-sm font-bold transition-colors hover:opacity-80"
              style={{ color: '#6C5CE7' }}>
              Browse all <ChevronRightIcon size={15} color="#6C5CE7" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(c => <CourseCard key={c._id} course={c} />)}
            </div>
          ) : (
            <div className="text-center py-16">
              <TrophyStatic className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-[#636e8a] text-sm font-medium">No courses published yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5"
            style={{ color: '#6C5CE7', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <SparklesIcon size={13} color="#6C5CE7" /> Platform Capabilities
          </p>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.03em' }}
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1a1d2e] dark:text-white">
            Everything a Modern Learner Needs
          </h2>
          <p className="text-[#636e8a] dark:text-slate-400 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
            Built with AI at the core and designed around how people actually learn best.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, tag }) => (
            <div key={title}
              className="group bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ border: '1.5px solid #e8eaf0', boxShadow: '0 1px 3px rgba(108,92,231,0.04)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c4b5fd'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8eaf0'; }}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6C5CE7 0%,#5046d4 100%)' }}>
                  <Icon size={22} color="white" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border"
                  style={{ color: '#6C5CE7', background: '#f3f1ff', borderColor: '#ddd6fe' }}>
                  {tag}
                </span>
              </div>
              <div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#1a1d2e' }}
                  className="font-extrabold text-base mb-2 dark:text-white">
                  {title}
                </h3>
                <p className="text-sm text-[#636e8a] dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold group-hover:gap-2.5 transition-all duration-200"
                style={{ color: '#6C5CE7' }}>
                Learn more <ArrowRightIcon size={13} color="#6C5CE7" />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section className="py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#6C5CE7 0%,#5046d4 60%,#4338ca 100%)' }}>
        <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: '#a29bfe' }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-16 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: '#4338ca' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5"
              style={{ color: '#c4b5fd', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              <ClockIcon size={13} color="#c4b5fd" /> How It Works
            </p>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.03em' }}
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">
              Go from Zero to Certified in 4 Steps
            </h2>
            <p className="text-[#c4b5fd] text-sm mt-3 max-w-md mx-auto">
              Our streamlined process gets you learning in minutes, not hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
              <div key={step}
                className="rounded-2xl p-6 space-y-5 transition-all duration-200 hover:-translate-y-1"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <Icon size={18} color="white" />
                  </div>
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: 'rgba(255,255,255,0.3)' }}
                    className="text-3xl font-extrabold">
                    {step}
                  </span>
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                    className="font-extrabold text-white text-base mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-[#c4b5fd] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className="py-20 border-t border-[#e8eaf0] dark:border-slate-800 bg-[#f7f8fc] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-center gap-1.5"
              style={{ color: '#6C5CE7', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              <StarIcon size={13} color="#f9ca24" /> Student Stories
            </p>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.03em' }}
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1a1d2e] dark:text-white">
              Loved by Thousands of Learners
            </h2>
            <p className="text-[#636e8a] dark:text-slate-400 text-sm mt-2">
              Real outcomes from real people who've used VertexPortal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, company, text, initials, color, rating }) => (
              <div key={name}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 space-y-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                style={{ border: '1.5px solid #e8eaf0' }}>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <StarIcon key={i} size={15} color="#f9ca24" />
                  ))}
                </div>
                <p className="text-sm text-[#1a1d2e] dark:text-slate-200 leading-relaxed">"{text}"</p>
                <div className="flex items-center gap-3 pt-3" style={{ borderTop: '1px solid #f0f2f8' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-extrabold shrink-0"
                    style={{ background: color }}>
                    {initials}
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: '#1a1d2e' }}
                      className="text-sm font-bold dark:text-white">{name}</p>
                    <p className="text-xs text-[#636e8a] dark:text-slate-400">{role} · {company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg,#0e1022 0%,#1a1040 50%,#12152a 100%)', border: '1.5px solid #2e325a' }}>
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(108,92,231,0.22) 0%, transparent 70%)' }} />

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full border"
              style={{ color: '#a29bfe', borderColor: '#3e3a8a', background: 'rgba(108,92,231,0.1)' }}>
              <ShieldCheckIcon size={13} color="#00b894" />
              No credit card required — Free to start
            </div>

            <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", letterSpacing: '-0.03em' }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
              Start Your Learning Journey Today
            </h2>

            <p className="text-[#8892b0] text-base max-w-xl mx-auto leading-relaxed">
              Join 50,000+ students already building skills on VertexPortal. Get instant access to courses, AI tutoring, live classes, and more.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link to="/register"
                className="group inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-2xl text-white transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg,#6C5CE7,#5046d4)', boxShadow: '0 8px 28px -4px rgba(108,92,231,0.5)' }}>
                Create Free Account
                <ArrowRightIcon size={16} color="white" />
              </Link>
              <Link to="/courses"
                className="inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-2xl border transition-all duration-200 hover:border-[#6C5CE7]"
                style={{ color: '#8892b0', borderColor: '#2e325a' }}>
                Explore Courses <ChevronRightIcon size={15} color="#8892b0" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-[#636e8a]">
              {['Free plan available', 'AI Tutor included', 'Verified certificates'].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CircleCheckIcon size={13} color="#00b894" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
