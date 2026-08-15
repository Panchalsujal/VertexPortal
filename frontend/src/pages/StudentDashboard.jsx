import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Video, FileText, Bot, Heart, ShoppingBag,
  Award, Settings, ChevronRight, Bell, MessageSquare, TrendingUp,
  Clock, Star, Play, Users, Zap, LogOut, ChevronDown, Menu, X,
  GraduationCap, BarChart2, ArrowLeft, User, Flame, Sparkles,
  Gift, Share2, Copy, Check, Code2, Sun, Moon, CheckSquare, Megaphone,
  Compass
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
  { to: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/my-learning',          icon: BookOpen,        label: 'My Courses'    },
  { to: '/student/quizzes',      icon: CheckSquare,     label: 'Quizzes', badge: 'AI' },
  { to: '/student/assignments',  icon: FileText,        label: 'Assignments'   },
  { to: '/student/live-classes', icon: Video,           label: 'Live Classes'  },
  { to: '/ai-chat',              icon: Bot,             label: 'AI Tutor', badge: 'New' },
  { to: '/discussions',          icon: MessageSquare,   label: 'Discussions'   },
  { to: '/playground',           icon: Code2,           label: 'Playground'    },
  { to: '/student/notes',        icon: FileText,        label: 'Notes'         },
  { to: '/student/announcements',icon: Megaphone,       label: 'Announcements' },
  { to: '/certificates',         icon: Award,           label: 'Certificates'  },
  { to: '/wishlist',             icon: Heart,           label: 'Wishlist'      },
  { to: '/cart',                 icon: ShoppingBag,     label: 'Orders'        },
  { to: '/profile',              icon: Settings,        label: 'Settings'      },
];

import { AnimatedThreeDots } from '../components/ui/Spinner';

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, color, bg, title, value, sub }) {
  const isLoading = value === '...' || value === undefined || value === null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-3 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-xs min-w-0">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{title}</p>
        <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight flex items-center min-h-[1.5rem] sm:min-h-[1.75rem] truncate">
          {isLoading ? <AnimatedThreeDots color={color} /> : value}
        </div>
        {sub && <div className="text-[10px] sm:text-xs text-green-600 font-semibold mt-0.5 truncate">{sub}</div>}
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
    <div className="flex items-center gap-2.5 sm:gap-4 p-2.5 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors group min-w-0">
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-xs"
        style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
      >
        📚
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden min-w-[50px]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%`, background: 'linear-gradient(90deg, #6C5CE7, #a29bfe)' }}
            />
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">{progress}%</span>
        </div>
      </div>
      <Link
        to={slug ? `/learn/${slug}` : '/my-learning'}
        className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] sm:text-xs font-bold rounded-lg transition-all shadow-xs shrink-0 no-underline"
      >
        <Play className="w-3 h-3 fill-white" /> <span className="hidden xs:inline">Continue</span>
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

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [sidebarOpen]);

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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] w-full max-w-full overflow-x-hidden">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 h-screen h-[100dvh] w-screen bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 h-screen h-[100dvh] w-64 max-w-[85vw] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-50 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2.5">
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
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 min-h-0">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-purple-600 rounded-r-full" />
                  )}
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span className="truncate">{label}</span>
                  {badge && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Real Progress Card inside scrollable sidebar */}
          <div className="mt-3 p-3.5 rounded-2xl shrink-0" style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%)' }}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-white">Keep Learning 🔥</p>
              <Zap className="w-4 h-4 text-yellow-300" />
            </div>
            <p className="text-[11px] text-purple-200 mb-2.5 leading-relaxed">{progressMessage}</p>
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative w-14 h-14">
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
                  <span className="text-white font-extrabold text-xs">{averageProgress}%</span>
                </div>
              </div>
              <p className="text-[11px] text-purple-200 font-semibold text-center truncate w-full">
                {enrolledCount > 0 ? `${completedCount} of ${enrolledCount} Completed` : 'Course Progress'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 w-full">
          <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-3.5 max-w-full">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 shrink-0 cursor-pointer"
                aria-label="Toggle menu"
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition cursor-pointer shrink-0"
                title="Go back to previous page"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Back</span>
              </button>

              {/* Search Bar */}
              <div className="hidden md:block relative flex-1 max-w-md lg:max-w-lg min-w-0">
                <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Search for courses, topics or anything..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0 relative">
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-gray-600" />}
              </button>

              <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500" aria-label="Notifications">
                <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Link>
              <Link to="/discussions" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500 hidden xs:flex" aria-label="Discussions">
                <MessageSquare className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </Link>

              {/* User Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2.5 ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-gray-200 dark:border-gray-700 hover:opacity-80 transition cursor-pointer text-left"
                >
                  <div
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm shrink-0 overflow-hidden border border-purple-200 dark:border-purple-800"
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
                  <div className="hidden md:block max-w-[120px]">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight truncate">Hi, {firstName}</p>
                    <p className="text-[10px] text-purple-500 font-semibold capitalize truncate">{user?.role || 'Student'}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
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
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer"
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
        <div className="p-3.5 sm:p-5 md:p-6 space-y-5 sm:space-y-6 max-w-full min-w-0">
          {/* Welcome section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight break-words">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                Track your progress and continue learning.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md no-underline shrink-0 self-start sm:self-auto hover:opacity-95 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #5046d4 100%)' }}
            >
              Explore Courses <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
            <StatCard
              icon={<BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="#6C5CE7" bg="rgba(108,92,231,0.1)"
              title="Enrolled Courses" value={loading ? '...' : enrolledCount}
              sub={enrolledCount > 0 ? `${enrolledCount} active` : 'Enroll now!'}
            />
            <StatCard
              icon={<GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="#00b894" bg="rgba(0,184,148,0.1)"
              title="Completed" value={loading ? '...' : completedCount}
              sub={`${completedCount} finished`}
            />
            <StatCard
              icon={<Clock className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="#fdcb6e" bg="rgba(253,203,110,0.15)"
              title="Upcoming Live" value={loading ? '...' : liveClasses.length}
              sub={liveClasses.length > 0 ? `${liveClasses.length} scheduled` : 'None scheduled'}
            />
            <StatCard
              icon={<Award className="w-5 h-5 sm:w-6 sm:h-6" />}
              color="#0984e3" bg="rgba(9,132,227,0.1)"
              title="Certificates" value={loading ? '...' : certCount}
              sub={<Link to="/certificates" className="text-blue-500 font-semibold text-[11px] sm:text-xs">View all →</Link>}
            />
          </div>

          {/* Quick Action Hub */}
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 min-w-0">
            <Link
              to="/my-learning"
              className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-2xs hover:shadow-md hover:border-purple-400 hover:-translate-y-0.5 transition-all text-center flex flex-col items-center group min-w-0 overflow-hidden"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 truncate w-full">My Courses</span>
              <span className="hidden xs:block text-[10px] text-gray-400 mt-0.5 truncate w-full">Continue study</span>
            </Link>

            <Link
              to="/student/quizzes"
              className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-2xs hover:shadow-md hover:border-amber-400 hover:-translate-y-0.5 transition-all text-center flex flex-col items-center group min-w-0 overflow-hidden"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform shrink-0">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-0.5 truncate w-full">
                Quizzes <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500 shrink-0" />
              </span>
              <span className="hidden xs:block text-[10px] text-amber-600 font-semibold mt-0.5 truncate w-full">Test knowledge</span>
            </Link>

            <Link
              to="/student/assignments"
              className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-2xs hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all text-center flex flex-col items-center group min-w-0 overflow-hidden"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 truncate w-full">Assignments</span>
              <span className="hidden xs:block text-[10px] text-gray-400 mt-0.5 truncate w-full">Submit tasks</span>
            </Link>

            <Link
              to="/student/live-classes"
              className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-2xs hover:shadow-md hover:border-rose-400 hover:-translate-y-0.5 transition-all text-center flex flex-col items-center group min-w-0 overflow-hidden"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform shrink-0">
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 truncate w-full">Live Classes</span>
              <span className="hidden xs:block text-[10px] text-gray-400 mt-0.5 truncate w-full">Interactive</span>
            </Link>

            <Link
              to="/ai-chat"
              className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-2xs hover:shadow-md hover:border-purple-400 hover:-translate-y-0.5 transition-all text-center flex flex-col items-center group min-w-0 overflow-hidden"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform shrink-0">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 truncate w-full">AI Tutor</span>
              <span className="hidden xs:block text-[10px] text-purple-600 font-semibold mt-0.5 truncate w-full">Instant help</span>
            </Link>

            <Link
              to="/playground"
              className="p-2.5 sm:p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 shadow-2xs hover:shadow-md hover:border-emerald-400 hover:-translate-y-0.5 transition-all text-center flex flex-col items-center group min-w-0 overflow-hidden"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform shrink-0">
                <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 truncate w-full">Playground</span>
              <span className="hidden xs:block text-[10px] text-gray-400 mt-0.5 truncate w-full">Code sandbox</span>
            </Link>
          </div>

          {/* Main 2-column Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr,380px] gap-5 sm:gap-6 min-w-0">
            {/* Left Column */}
            <div className="space-y-5 sm:space-y-6 min-w-0">
              {/* Continue Learning */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Continue Learning</h2>
                  <Link to="/my-learning" className="text-xs font-semibold text-purple-600 hover:text-purple-700">See all</Link>
                </div>
                <div className="px-2.5 sm:px-3 pb-3 sm:pb-4 space-y-1">
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
              <div className="bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-indigo-500/10 dark:from-orange-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 rounded-2xl border border-orange-200/50 dark:border-orange-900/30 p-3.5 sm:p-5 shadow-xs min-w-0">
                <div className="flex items-start sm:items-center justify-between mb-3.5 sm:mb-4 gap-3">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30 shrink-0">
                      <Flame className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                          {gamification.streak.currentStreak} Day Streak!
                        </span>
                        <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-extrabold shrink-0">
                          Best: {gamification.streak.longestStreak}d
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Learn every day to keep your flame burning and unlock badges.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Badges List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 pt-2.5 border-t border-orange-200/30 dark:border-orange-900/20">
                  {(gamification.badges.length > 0 ? gamification.badges : [
                    { id: 'welcome', title: 'Welcome Scholar', description: 'Joined VertexPortal', icon: 'sparkles' },
                    { id: 'streak_3', title: '3-Day Streak', description: 'Study 3 days in a row', icon: 'flame' },
                  ]).map((b, idx) => (
                    <div key={b.id || idx} className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-2.5 sm:p-3 border border-gray-100 dark:border-gray-700/60 flex items-center gap-2.5 shadow-2xs min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{b.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{b.description || 'Badge Earned'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5 sm:space-y-6 min-w-0">
              {/* Upcoming Live Classes */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Upcoming Live Classes</h2>
                  <Link to="/student/live-classes" className="text-xs font-semibold text-purple-600">See all</Link>
                </div>
                <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2.5 sm:space-y-3">
                  {loading ? (
                    <p className="text-xs text-gray-400 py-4 text-center">Loading live classes...</p>
                  ) : liveClasses.length > 0 ? (
                    liveClasses.slice(0, 3).map((cls) => (
                      <div key={cls._id} className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 bg-gray-50 dark:bg-gray-800 rounded-xl min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">{cls.title}</p>
                          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{cls.instructor?.fullName || 'Instructor'}</p>
                        </div>
                        <Link
                          to={`/student/live-classes/${cls._id}`}
                          className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold text-white bg-purple-600 rounded-lg shadow-xs shrink-0 transition-all hover:bg-purple-700 no-underline"
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
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs p-4 sm:p-5 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0 pr-2">
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">AI Tutor Assistant</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Ask anything about your courses...</p>
                  </div>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white text-base sm:text-lg shadow-sm shrink-0"
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
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 pr-11 text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                  <button
                    onClick={() => aiMsg && navigate('/ai-chat')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-90 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                  {['Explain useEffect in React', 'What is Big O notation?', 'Help me with this error'].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => navigate('/ai-chat')}
                      className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50 rounded-lg transition-colors cursor-pointer text-left truncate max-w-full"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Refer & Earn Rewards Card */}
              <div className="bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-slate-900 rounded-2xl border border-purple-800/40 p-4 sm:p-5 shadow-xs text-white min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
                      <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">Invite &amp; Earn Rewards</h3>
                      <p className="text-[10px] sm:text-[11px] text-purple-200 truncate">Earn 50 bonus points per friend!</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-2 sm:p-2.5 border border-purple-700/30 flex items-center justify-between gap-2 mt-3 min-w-0">
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

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-purple-300 font-semibold mt-3 pt-2 border-t border-purple-800/40">
                  <span className="truncate">Invited: {referral.referralStats?.totalReferrals || 0} friends</span>
                  <span className="truncate">Points: {referral.referralStats?.rewardPoints || 0} pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
