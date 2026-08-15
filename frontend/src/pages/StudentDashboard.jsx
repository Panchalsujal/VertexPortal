import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Video, FileText, Bot, Heart, ShoppingBag,
  Award, Settings, ChevronRight, Bell, MessageSquare, TrendingUp,
  Clock, Star, Play, Users, Zap, LogOut, ChevronDown, Menu, X,
  GraduationCap, BarChart2, ArrowLeft, User, Flame, Sparkles,
  Gift, Share2, Copy, Check, Code2, Sun, Moon
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUser, logoutUser } from '../store/slices/authSlice';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  getMyCourses,
  getContinueLearning,
  getStudentLiveClasses,
  getGamificationData,
  getReferralData,
} from '../api/student.api';
import { getMyCertificates } from '../api/certificate.api';
import toast from 'react-hot-toast';

// ── Sidebar navigation items ──────────────────────────────────
const navItems = [
  { to: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/my-learning',         icon: BookOpen,        label: 'My Courses'    },
  { to: '/student/live-classes',icon: Video,           label: 'Live Classes'  },
  { to: '/student/notes',       icon: FileText,        label: 'Notes'         },
  { to: '/ai-chat',             icon: Bot,             label: 'AI Tutor', badge: 'New' },
  { to: '/wishlist',            icon: Heart,           label: 'Wishlist'      },
  { to: '/cart',                icon: ShoppingBag,     label: 'Orders'        },
  { to: '/certificates',        icon: Award,           label: 'Certificates'  },
  { to: '/profile',             icon: Settings,        label: 'Settings'      },
];

import { AnimatedThreeDots } from '../components/ui/Spinner';

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, color, bg, title, value, sub }) {
  const isLoading = value === '...' || value === undefined || value === null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <div className="text-2xl font-bold text-gray-900 dark:text-white leading-tight flex items-center min-h-[1.75rem]">
          {isLoading ? <AnimatedThreeDots color={color} /> : value}
        </div>
        {sub && <p className="text-xs text-green-600 font-semibold mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Course Progress Row ───────────────────────────────────────
function CourseRow({ course, onContinue }) {
  const title = course?.title || course?.course?.title || 'Untitled Course';
  const progress = course?.progressPercentage ?? course?.progress ?? 0;
  const slug = course?.slug || course?.course?.slug || course?._id;

  return (
    <div className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors group">
      <div
        className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-base shadow-sm"
        style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
      >
        📚
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%`, background: 'linear-gradient(90deg, #6C5CE7, #a29bfe)' }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">{progress}%</span>
        </div>
      </div>
      <Link
        to={slug ? `/learn/${slug}` : '/my-learning'}
        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 shrink-0 no-underline"
      >
        <Play className="w-3 h-3 fill-white" /> Continue
      </Link>
    </div>
  );
}

export default function StudentDashboard() {
  const dispatch  = useAppDispatch();
  const user      = useAppSelector(selectUser);
  const navigate  = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiMsg, setAiMsg] = useState('');

  const [myCourses, setMyCourses] = useState([]);
  const [continueList, setContinueList] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [gamification, setGamification] = useState({
    streak: { currentStreak: 1, longestStreak: 1 },
    badges: [],
  });
  const [referral, setReferral] = useState({
    referralCode: user?.referralCode || 'VP-LEARN',
    referralStats: { totalReferrals: 0, rewardPoints: 0 },
  });
  const [copiedRef, setCopiedRef] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const firstName = user?.fullName?.split(' ')[0] || 'Student';

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    let isMounted = true;
    async function loadStudentData() {
      setLoading(true);
      try {
        const [coursesRes, continueRes, liveRes, certRes, gamifyRes, refRes] = await Promise.allSettled([
          getMyCourses(),
          getContinueLearning(),
          getStudentLiveClasses(),
          getMyCertificates(),
          getGamificationData(),
          getReferralData(),
        ]);

        if (isMounted) {
          if (coursesRes.status === 'fulfilled') {
            const list = coursesRes.value.data?.courses || coursesRes.value.data?.data || [];
            setMyCourses(Array.isArray(list) ? list : []);
          }
          if (continueRes.status === 'fulfilled') {
            const list = continueRes.value.data?.courses || continueRes.value.data?.data || [];
            setContinueList(Array.isArray(list) ? list : []);
          }
          if (liveRes.status === 'fulfilled') {
            const list = liveRes.value.data?.liveClasses || liveRes.value.data?.data || [];
            setLiveClasses(Array.isArray(list) ? list : []);
          }
          if (certRes.status === 'fulfilled') {
            const list = certRes.value.data?.certificates || certRes.value.data?.data || [];
            setCertificates(Array.isArray(list) ? list : []);
          }
          if (gamifyRes.status === 'fulfilled') {
            const gData = gamifyRes.value.data?.data || {};
            if (gData.streak || gData.badges) {
              setGamification({
                streak: gData.streak || { currentStreak: 1, longestStreak: 1 },
                badges: gData.badges || [],
              });
            }
          }
          if (refRes.status === 'fulfilled') {
            const rData = refRes.value.data?.data || {};
            if (rData.referralCode) {
              setReferral({
                referralCode: rData.referralCode,
                referralStats: rData.referralStats || { totalReferrals: 0, rewardPoints: 0 },
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching student dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStudentData();
    return () => { isMounted = false; };
  }, [user]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate('/login');
  };

  const enrolledCount  = myCourses.length;
  const completedCount = myCourses.filter(c => (c.progress === 100 || c.progressPercentage === 100 || c.isCompleted || c.status === 'completed')).length;
  const certCount      = certificates.length;

  // Calculate real progress across all enrolled courses
  const averageProgress = enrolledCount > 0
    ? Math.round(myCourses.reduce((sum, c) => sum + (c.progressPercentage ?? c.progress ?? 0), 0) / enrolledCount)
    : 0;

  const progressMessage = enrolledCount === 0
    ? 'Enroll in a course to start tracking your learning progress.'
    : averageProgress >= 100
    ? 'Outstanding! You have completed your enrolled courses!'
    : averageProgress >= 50
    ? "Great momentum! You're more than halfway to your goals."
    : 'Every lesson counts! Keep up your study streak today.';

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif]">
      <style>{`
        @media (max-width: 1023px) {
          .sd-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .sd-main-grid  { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 639px) {
          .sd-stats-grid { grid-template-columns: 1fr !important; }
          .sd-main-grid  { grid-template-columns: 1fr !important; }
          .sd-topbar-search { display: none !important; }
          .sd-topbar-user-name { display: none !important; }
          .sd-welcome-btn { display: none !important; }
          .sd-body { padding: 1rem !important; }
          .sd-chart-bars { height: 100px !important; }
        }
        @media (max-width: 480px) {
          .sd-achievement-grid { gap: 0.5rem !important; }
          .sd-weekly-goal { display: none !important; }
        }
      `}</style>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-30 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0"
            style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)' }}
          >
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">VertexPortal</p>
            <p className="text-[10px] text-purple-500 font-medium">Learning Platform</p>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30'
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-purple-600 rounded-r-full" />
                  )}
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{label}</span>
                  {badge && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Real Progress Card */}
        <div className="sd-weekly-goal mx-3 mb-4 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-white">Keep Learning 🔥</p>
            <Zap className="w-4 h-4 text-yellow-300" />
          </div>
          <p className="text-xs text-purple-200 mb-3">{progressMessage}</p>
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke="white" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - (averageProgress || 0) / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">{averageProgress}%</span>
              </div>
            </div>
            <p className="text-xs text-purple-200 font-semibold">
              {enrolledCount > 0 ? `${completedCount} of ${enrolledCount} Completed` : 'Course Progress'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-5 py-3.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors border-t border-gray-100 dark:border-gray-800"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-60 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
          <div className="flex items-center gap-3 px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Back Button */}
            <button
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition cursor-pointer"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div className="sd-topbar-search relative flex-1 max-w-lg">
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search for courses, topics or anything..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto relative">
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>

              <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Link>
              <Link to="/discussions" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500">
                <MessageSquare className="w-5 h-5" />
              </Link>

              {/* User Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700 hover:opacity-80 transition cursor-pointer text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0 overflow-hidden border border-purple-200 dark:border-purple-800"
                    style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName || 'Student'}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      user?.fullName?.[0]?.toUpperCase() || 'S'
                    )}
                  </div>
                  <div className="sd-topbar-user-name hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">Hi, {firstName}</p>
                    <p className="text-[10px] text-purple-500 font-semibold capitalize">{user?.role || 'Student'}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Popover Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.fullName || 'Student'}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30 transition-colors"
                    >
                      <User className="w-4 h-4 text-purple-600" /> My Profile & Settings
                    </Link>

                    <Link
                      to="/my-learning"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-purple-600" /> My Courses
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-purple-600" /> Wishlist
                    </Link>

                    <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" /> Logout Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="sd-body p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track your progress and continue learning.
              </p>
            </div>
            <Link
              to="/courses"
              className="sd-welcome-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md no-underline"
              style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%)' }}
            >
              Explore Courses <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stat Cards */}
          <div className="sd-stats-grid grid grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
            <StatCard
              icon={<BookOpen className="w-6 h-6" />}
              color="#6C5CE7" bg="rgba(108,92,231,0.1)"
              title="Enrolled Courses" value={loading ? '...' : enrolledCount}
              sub={enrolledCount > 0 ? `${enrolledCount} active courses` : 'Enroll in a course!'}
            />
            <StatCard
              icon={<GraduationCap className="w-6 h-6" />}
              color="#00b894" bg="rgba(0,184,148,0.1)"
              title="Completed" value={loading ? '...' : completedCount}
              sub={`${completedCount} finished`}
            />
            <StatCard
              icon={<Clock className="w-6 h-6" />}
              color="#fdcb6e" bg="rgba(253,203,110,0.15)"
              title="Upcoming Live" value={loading ? '...' : liveClasses.length}
              sub={liveClasses.length > 0 ? `${liveClasses.length} scheduled` : 'No live classes yet'}
            />
            <StatCard
              icon={<Award className="w-6 h-6" />}
              color="#0984e3" bg="rgba(9,132,227,0.1)"
              title="Certificates" value={loading ? '...' : certCount}
              sub={<Link to="/certificates" className="text-blue-500 font-semibold text-xs">View all →</Link>}
            />
          </div>

          {/* Main 2-column Grid */}
          <div className="sd-main-grid grid grid-cols-1 xl:grid-cols-[1fr,380px] gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Continue Learning */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Continue Learning</h2>
                  <Link to="/my-learning" className="text-xs font-semibold text-purple-600 hover:text-purple-700">See all</Link>
                </div>
                <div className="px-3 pb-4 space-y-1">
                  {loading ? (
                    <p className="text-xs text-gray-400 py-6 text-center">Loading courses...</p>
                  ) : (continueList.length > 0 ? continueList : myCourses).length > 0 ? (
                    (continueList.length > 0 ? continueList : myCourses).slice(0, 4).map((c, i) => (
                      <CourseRow key={c._id || i} course={c} />
                    ))
                  ) : (
                    <div className="text-center py-8 px-4">
                      <BookOpen className="w-10 h-10 text-purple-400 mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">You haven't enrolled in any courses yet</p>
                      <p className="text-xs text-gray-400 mt-1 mb-4">Browse our catalog and start learning today!</p>
                      <Link
                        to="/courses"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-md no-underline hover:bg-purple-700 transition"
                      >
                        Browse Courses
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Streak & Achievements Showcase */}
              <div className="bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-indigo-500/10 dark:from-orange-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 rounded-2xl border border-orange-200/50 dark:border-orange-900/30 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30">
                      <Flame className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>{gamification.streak.currentStreak} Day Learning Streak!</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-extrabold">
                          Best: {gamification.streak.longestStreak}d
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Learn every day to keep your flame burning and unlock badges.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Badges List */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-orange-200/30 dark:border-orange-900/20">
                  {(gamification.badges.length > 0 ? gamification.badges : [
                    { id: 'welcome', title: 'Welcome Scholar', description: 'Joined VertexPortal', icon: 'sparkles' },
                    { id: 'streak_3', title: '3-Day Streak', description: 'Study 3 days in a row', icon: 'flame' },
                  ]).map((b, idx) => (
                    <div key={b.id || idx} className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-3 border border-gray-100 dark:border-gray-700/60 flex items-center gap-2.5 shadow-2xs">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{b.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{b.description || 'Badge Earned'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Upcoming Live Classes */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Upcoming Live Classes</h2>
                  <Link to="/student/live-classes" className="text-xs font-semibold text-purple-600">See all</Link>
                </div>
                <div className="px-4 pb-4 space-y-3">
                  {loading ? (
                    <p className="text-xs text-gray-400 py-4 text-center">Loading live classes...</p>
                  ) : liveClasses.length > 0 ? (
                    liveClasses.slice(0, 3).map((cls) => (
                      <div key={cls._id} className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{cls.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{cls.instructor?.fullName || 'Instructor'}</p>
                        </div>
                        <Link
                          to={`/student/live-classes/${cls._id}`}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 rounded-lg shadow-sm shrink-0 transition-all hover:bg-purple-700 no-underline"
                        >
                          Join
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-xs text-gray-400">No live classes scheduled right now</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Tutor Assistant */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">AI Tutor Assistant</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ask anything about your courses...</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-md"
                    style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}>
                    🤖
                  </div>
                </div>

                <div className="relative mt-3">
                  <input
                    type="text"
                    value={aiMsg}
                    onChange={(e) => setAiMsg(e.target.value)}
                    placeholder="Type your question here..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                  <button
                    onClick={() => aiMsg && navigate('/ai-chat')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {['Explain useEffect in React', 'What is Big O notation?', 'Help me with this error'].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => navigate('/ai-chat')}
                      className="px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50 rounded-lg transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Refer & Earn Rewards Card */}
              <div className="bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-slate-900 rounded-2xl border border-purple-800/40 p-5 shadow-sm text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Invite &amp; Earn Rewards</h3>
                      <p className="text-[11px] text-purple-200">Earn 50 bonus points for every friend who joins!</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-2.5 border border-purple-700/30 flex items-center justify-between gap-2 mt-3">
                  <div className="min-w-0 font-mono text-xs font-bold text-purple-300 truncate">
                    {referral.referralCode || 'VP-LEARN'}
                  </div>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/register?ref=${referral.referralCode}`;
                      navigator.clipboard.writeText(link);
                      setCopiedRef(true);
                      toast.success('Referral invite link copied!');
                      setTimeout(() => setCopiedRef(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedRef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRef ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-purple-300 font-semibold mt-3 pt-2 border-t border-purple-800/40">
                  <span>Invited: {referral.referralStats?.totalReferrals || 0} friends</span>
                  <span>Points: {referral.referralStats?.rewardPoints || 0} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
