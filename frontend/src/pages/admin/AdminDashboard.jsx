import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Tag, UserCog, Video, ClipboardList,
  Star, FileText, Bell, ShoppingBag, Tag as CouponTag, BarChart2,
  Settings, FileCode, Globe, LogOut, Menu, X, TrendingUp,
  TrendingDown, ArrowUpRight, ChevronDown, Award, RotateCcw, Plus,
  Activity, Zap, DollarSign, GraduationCap, MessageSquare, User
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import { getAdminDashboardStats } from '../../api/adminDashboard.api';
import toast from 'react-hot-toast';

// ── Sidebar sections ──────────────────────────────────────────
const sidebarSections = [
  {
    label: 'MANAGEMENT',
    items: [
      { to: '/admin',                  icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/admin/users',            icon: Users,           label: 'Users'     },
      { to: '/admin/courses',          icon: BookOpen,        label: 'Courses'   },
      { to: '/admin/panel?tab=categories', icon: Tag,         label: 'Categories & Coupons' },
      { to: '/admin/users?role=instructor', icon: UserCog,    label: 'Instructors' },
      { to: '/instructor/live-classes', icon: Video,          label: 'Live Classes' },
      { to: '/admin/orders',           icon: ClipboardList,   label: 'Enrollments & Orders' },
      { to: '/admin/reviews',          icon: Star,            label: 'Reviews'   },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { to: '/admin/courses',          icon: FileText,        label: 'Lectures & Course Content' },
      { to: '/discussions',            icon: MessageSquare,   label: 'Discussions & Q&A' },
      { to: '/student/notes',          icon: Bell,            label: 'Notes & Documents' },
      { to: '/instructor/announcements', icon: Zap,          label: 'Announcements' },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { to: '/admin/orders',           icon: ShoppingBag,     label: 'Orders'    },
      { to: '/admin/panel?tab=coupons', icon: CouponTag,      label: 'Coupons'   },
    ],
  },
  {
    label: 'REPORTS & AUDIT',
    items: [
      { to: '/admin/audit',            icon: BarChart2,       label: 'Audit Logs' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { to: '/profile',                icon: Settings,        label: 'Settings'  },
    ],
  },
];

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, title, value, sub, subUp = true, color, bg }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{title}</p>
        <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">{value}</p>
        {sub && (
          <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${subUp ? 'text-green-600' : 'text-red-500'}`}>
            {subUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ── System Status Row ─────────────────────────────────────────
function StatusRow({ name, icon: Icon, status = 'Online' }) {
  const online = status === 'Online';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{name}</span>
      </div>
      <span className={`text-xs font-bold flex items-center gap-1.5 ${online ? 'text-green-600' : 'text-red-500'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
        {status}
      </span>
    </div>
  );
}

// ── Recent User Row ───────────────────────────────────────────
function RecentUserRow({ name, email, role, time }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</p>
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize text-purple-700 bg-purple-50 dark:bg-purple-950/40">
        {role}
      </span>
    </div>
  );
}

// ── Top Course Row ────────────────────────────────────────────
function TopCourseRow({ rank, title, enrollments, rating = 4.8, color }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      <span className="w-5 text-sm font-bold text-gray-400 shrink-0">{rank}</span>
      <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ backgroundColor: color }}>
        📚
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{title}</p>
        <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, (enrollments / 50) * 100)}%`, backgroundColor: color }} />
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{enrollments} Enrollments</p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{rating}</span>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const dispatch  = useAppDispatch();
  const user      = useAppSelector(selectUser);
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState('30d');

  const firstName = user?.fullName?.split(' ')[0] || 'Admin';

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboard() {
      setLoading(true);
      try {
        const res = await getAdminDashboardStats({ period });
        if (isMounted) {
          setDashboardData(res.data?.dashboard || null);
        }
      } catch (err) {
        console.error('Failed to fetch admin dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { isMounted = false; };
  }, [period]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  // Safe metrics extraction
  const overview    = dashboardData?.overview;
  const periodStats = dashboardData?.periodStats;

  const totalUsers        = overview?.users?.total ?? 0;
  const studentsCount     = overview?.users?.students ?? 0;
  const instructorsCount  = overview?.users?.instructors ?? 0;
  const adminsCount       = overview?.users?.admins ?? 0;
  const totalCourses      = overview?.courses?.total ?? 0;
  const totalEnrollments  = overview?.enrollments?.total ?? 0;
  const totalLiveClasses  = overview?.liveClasses?.total ?? 0;

  const userGrowth       = periodStats?.users?.growthPercentage;
  const courseGrowth     = periodStats?.courses?.growthPercentage;
  const enrollmentGrowth = periodStats?.enrollments?.growthPercentage;
  const liveClassGrowth  = periodStats?.liveClasses?.growthPercentage;

  const topCourses      = dashboardData?.topCourses || [];
  const recentUsers     = dashboardData?.recent?.users || dashboardData?.recentUsers || [];
  const roleDist        = dashboardData?.distributions?.users || dashboardData?.userRoleDistribution || [];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif]">
      <style>{`
        @media (max-width: 1279px) {
          .ad-stat-grid    { grid-template-columns: repeat(3, 1fr) !important; }
          .ad-middle-grid  { grid-template-columns: 1fr !important; }
          .ad-bottom-grid  { grid-template-columns: 1fr !important; }
          .ad-quick-grid   { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 1023px) {
          .ad-stat-grid    { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 767px) {
          .ad-stat-grid    { grid-template-columns: repeat(2, 1fr) !important; }
          .ad-search-kbd   { display: none !important; }
          .ad-header-name  { display: none !important; }
          .ad-body         { padding: 1rem !important; gap: 1rem !important; }
        }
        @media (max-width: 480px) {
          .ad-stat-grid    { grid-template-columns: 1fr !important; }
          .ad-quick-grid   { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-30 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="px-4 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <Link to="/admin" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%)' }}>
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight">VertexPortal</p>
              <p className="text-[10px] text-purple-500 font-semibold">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {sidebarSections.map((section) => (
            <div key={section.label} className="mb-1">
              <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500 px-4 py-2">
                {section.label}
              </p>
              {section.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={`${to}-${label}`}
                  to={to}
                  end={end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium transition-all ${
                      isActive
                        ? 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30'
                        : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-purple-600 rounded-r-full" />}
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-gray-100 dark:border-gray-800">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>Visit Website</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-auto" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-56 min-h-screen">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
          <div className="flex items-center gap-3 px-6 py-3.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search for users, courses, orders..."
                className="w-full pl-10 pr-20 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
              <span className="ad-search-kbd absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                Ctrl + K
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700 hover:opacity-80 transition cursor-pointer text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                  >
                    {user?.fullName?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="ad-header-name hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user?.fullName || 'Admin'}</p>
                    <p className="text-[10px] text-purple-500 font-semibold capitalize">{user?.role || 'Super Admin'}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-40 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.fullName || 'Admin'}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30 transition-colors"
                      >
                        <User className="w-4 h-4 text-purple-600" /> My Profile & Settings
                      </Link>

                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-purple-600" /> Admin Dashboard
                      </Link>

                      <Link
                        to="/"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30 transition-colors"
                      >
                        <Globe className="w-4 h-4 text-purple-600" /> Visit Main Website
                      </Link>

                      <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Logout Account
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="ad-body p-6 space-y-6">
          {/* Welcome + Period Filter */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Real-time overview of your learning platform performance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition shadow-sm cursor-pointer"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          {/* Real Stat Cards */}
          <div className="ad-stat-grid grid grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
            <StatCard
              icon={<Users className="w-6 h-6" />}
              color="#6C5CE7" bg="rgba(108,92,231,0.1)"
              title="Total Users"
              value={loading ? '...' : totalUsers.toLocaleString()}
              sub={userGrowth !== null && userGrowth !== undefined ? `${userGrowth >= 0 ? '+' : ''}${userGrowth}% vs prev period` : null}
              subUp={userGrowth >= 0}
            />
            <StatCard
              icon={<BookOpen className="w-6 h-6" />}
              color="#00b894" bg="rgba(0,184,148,0.1)"
              title="Total Courses"
              value={loading ? '...' : totalCourses.toLocaleString()}
              sub={courseGrowth !== null && courseGrowth !== undefined ? `${courseGrowth >= 0 ? '+' : ''}${courseGrowth}% vs prev period` : null}
              subUp={courseGrowth >= 0}
            />
            <StatCard
              icon={<GraduationCap className="w-6 h-6" />}
              color="#fdcb6e" bg="rgba(253,203,110,0.15)"
              title="Enrollments"
              value={loading ? '...' : totalEnrollments.toLocaleString()}
              sub={enrollmentGrowth !== null && enrollmentGrowth !== undefined ? `${enrollmentGrowth >= 0 ? '+' : ''}${enrollmentGrowth}% vs prev period` : null}
              subUp={enrollmentGrowth >= 0}
            />
            <StatCard
              icon={<Video className="w-6 h-6" />}
              color="#0984e3" bg="rgba(9,132,227,0.1)"
              title="Live Classes"
              value={loading ? '...' : totalLiveClasses.toLocaleString()}
              sub={liveClassGrowth !== null && liveClassGrowth !== undefined ? `${liveClassGrowth >= 0 ? '+' : ''}${liveClassGrowth}% vs prev period` : null}
              subUp={liveClassGrowth >= 0}
            />
          </div>

          {/* Middle row: Top Courses + Recent Users */}
          <div className="ad-middle-grid grid grid-cols-1 xl:grid-cols-[1fr,380px] gap-6">
            {/* Top Courses */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Top Courses by Enrollment</h2>
                <Link to="/admin/courses" className="text-xs font-semibold text-purple-600">View all</Link>
              </div>
              {loading ? (
                <p className="text-xs text-gray-400 py-6 text-center">Loading top courses...</p>
              ) : topCourses.length > 0 ? (
                <div className="space-y-1">
                  {topCourses.map((c, i) => (
                    <TopCourseRow
                      key={c.courseId || i}
                      rank={i + 1}
                      title={c.title || 'Untitled Course'}
                      enrollments={c.enrollmentCount || 0}
                      color={['#6C5CE7', '#00b894', '#0984e3', '#fdcb6e', '#d63031'][i % 5]}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm font-semibold text-gray-500">No course enrollment data yet</p>
                  <p className="text-xs text-gray-400 mt-1">New course enrollments will show up here automatically.</p>
                </div>
              )}
            </div>

            {/* Recent Registered Users */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Registrations</h2>
                <Link to="/admin/users" className="text-xs font-semibold text-purple-600">View all</Link>
              </div>
              {loading ? (
                <p className="text-xs text-gray-400 py-6 text-center">Loading users...</p>
              ) : recentUsers.length > 0 ? (
                <div>
                  {recentUsers.slice(0, 5).map((u) => (
                    <RecentUserRow
                      key={u._id}
                      name={u.fullName || 'User'}
                      email={u.email}
                      role={u.role || 'student'}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm font-semibold text-gray-500">No users found</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom row: User Roles breakdown + System Status */}
          <div className="ad-bottom-grid grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-6">
            {/* User Role Distribution */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">User Distribution by Role</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900">
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-300">Students</p>
                  <p className="text-2xl font-extrabold text-purple-900 dark:text-purple-100 mt-1">{loading ? '...' : studentsCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Instructors</p>
                  <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-1">{loading ? '...' : instructorsCount}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Admins</p>
                  <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-100 mt-1">{loading ? '...' : adminsCount}</p>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">System Status</h2>
              <div>
                <StatusRow name="API Server"       icon={Globe}     status="Online" />
                <StatusRow name="Database"         icon={Activity}  status="Online" />
                <StatusRow name="Live Classes"     icon={Video}     status="Online" />
                <StatusRow name="Email Dispatch"   icon={Bell}      status="Online" />
              </div>
            </div>
          </div>

          {/* Quick actions row */}
          <div className="ad-quick-grid grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Manage Users',    icon: Users,       to: '/admin/users',    color: '#6C5CE7' },
              { label: 'Manage Courses',  icon: BookOpen,    to: '/admin/courses',  color: '#00b894' },
              { label: 'View Orders',     icon: ShoppingBag, to: '/admin/orders',   color: '#0984e3' },
              { label: 'Audit Logs',      icon: BarChart2,   to: '/admin/audit',    color: '#d63031' },
            ].map(({ label, icon: Icon, to, color }) => (
              <Link
                key={to}
                to={to}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-600 transition-colors">{label}</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
