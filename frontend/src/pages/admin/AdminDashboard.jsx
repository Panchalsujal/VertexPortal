import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Tag, UserCog, Video, ClipboardList,
  Star, FileText, Bell, ShoppingBag, Tag as CouponTag, BarChart2,
  Settings, FileCode, Globe, LogOut, Menu, X, TrendingUp,
  TrendingDown, ArrowUpRight, Award,
  Activity, Zap, DollarSign, GraduationCap, MessageSquare, ShieldCheck, Flag
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import { getAdminDashboardStats } from '../../api/adminDashboard.api';
import CustomSelect from '../../components/ui/CustomSelect';
import toast from 'react-hot-toast';
// Layer 7: Server-side admin role verification | Layer 9: Inactivity auto-logout
import { useAdminGuard } from '../../hooks/useAdminGuard';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

// ── Sidebar Navigation Sections ──────────────────────────────
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
      { to: '/instructor/announcements', icon: Zap,           label: 'Announcements' },
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
      { to: '/admin/discussion-reports', icon: Flag,          label: 'Discussion Reports' },
      { to: '/admin/live-attendance',  icon: Video,           label: 'Live Attendance' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { to: '/profile',                icon: Settings,        label: 'Settings'  },
    ],
  },
];

import { AnimatedThreeDots } from '../../components/ui/Spinner';

// ── Stat Card Component ──────────────────────────────────────
function StatCard({ icon, title, value, sub, subUp = true, color, bg }) {
  const isLoading = value === '...' || value === undefined || value === null;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 flex items-start gap-4 shadow-xs hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ backgroundColor: bg }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1 truncate">{title}</p>
        <div className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight flex items-center min-h-[1.75rem]">
          {isLoading ? <AnimatedThreeDots color={color} /> : value}
        </div>
        {sub && (
          <p className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 ${subUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {subUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{sub}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── System Status Row ─────────────────────────────────────────
function StatusRow({ name, icon: Icon, status = 'Online', detail }) {
  const online = status === 'Online' || status === 'Operational';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800/80 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-gray-400" />
        <div>
          <span className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">{name}</span>
          {detail && <span className="text-[10px] text-gray-400 block font-mono leading-none mt-0.5">{detail}</span>}
        </div>
      </div>
      <span className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
        online ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 text-rose-600'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
        {status}
      </span>
    </div>
  );
}

// ── Recent User Row ───────────────────────────────────────────
function RecentUserRow({ name, email, role, createdAt }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'U';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800/80 last:border-0">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
        style={{ background: 'linear-gradient(135deg, #6C5CE7, #8B5CF6)' }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{name}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{email}</p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md capitalize text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800">
          {role}
        </span>
        {createdAt && (
          <p className="text-[10px] text-gray-400 mt-1 font-mono">
            {new Date(createdAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Top Course Row ────────────────────────────────────────────
function TopCourseRow({ rank, title, enrollments, rating = 5.0, price, color }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800/80 last:border-0">
      <span className="w-5 text-xs font-bold text-gray-400 shrink-0 font-mono">#{rank}</span>
      <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-xs" style={{ backgroundColor: color }}>
        <BookOpen className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
            {enrollments} {enrollments === 1 ? 'student' : 'students'}
          </span>
          {price !== undefined && (
            <span className="text-[11px] text-gray-400">
              · {price === 0 ? 'Free' : `₹${price}`}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 rounded-md">
        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
        <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
          {Number(rating || 5.0).toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const dispatch  = useAppDispatch();
  const user      = useAppSelector(selectUser);
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState('30d');

  // ── Layer 7: Server-side admin role re-verification ────────
  useAdminGuard();

  // ── Layer 9: Auto-logout after 30 minutes of inactivity ────
  useInactivityLogout({
    onWarning: (secondsLeft) => {
      toast(`⚠️ Admin session expires in ${Math.floor(secondsLeft / 60)} min due to inactivity`, {
        icon: '🔒',
        duration: 10000,
      });
    },
  });

  const firstName = user?.fullName?.split(' ')[0] || 'Admin';

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboard() {
      setLoading(true);
      try {
        const res = await getAdminDashboardStats({ period });
        if (isMounted) {
          const payload = res.data?.dashboard || res.data?.data?.dashboard || res.data?.data || res.data;
          setDashboardData(payload || null);
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

  // Safe metrics extraction from real database
  const overview    = dashboardData?.overview;
  const periodStats = dashboardData?.periodStats;
  const systemHealth = dashboardData?.systemHealth;

  const totalUsers        = overview?.users?.total ?? 0;
  const studentsCount     = overview?.users?.students ?? 0;
  const instructorsCount  = overview?.users?.instructors ?? 0;
  const adminsCount       = overview?.users?.admins ?? 0;
  const totalCourses      = overview?.courses?.total ?? 0;
  const totalEnrollments  = overview?.enrollments?.total ?? 0;
  const totalLiveClasses  = overview?.liveClasses?.total ?? 0;
  const totalRevenue      = overview?.finance?.totalRevenue ?? 0;
  const totalCertificates = overview?.certificates?.total ?? 0;

  const userGrowth       = periodStats?.users?.growthPercentage;
  const courseGrowth     = periodStats?.courses?.growthPercentage;
  const enrollmentGrowth = periodStats?.enrollments?.growthPercentage;
  const liveClassGrowth  = periodStats?.liveClasses?.growthPercentage;
  const revenueGrowth    = periodStats?.revenue?.growthPercentage;

  const topCourses      = dashboardData?.topCourses || [];
  const recentUsers     = dashboardData?.recent?.users || dashboardData?.recentUsers || [];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] text-gray-900 dark:text-gray-100">
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-30 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <Link to="/admin" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md bg-gradient-to-tr from-purple-600 to-indigo-600">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight">NavGujarat Academy</p>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {sidebarSections.map((sec) => (
            <div key={sec.label}>
              <p className="px-3 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {sec.label}
              </p>
              <div className="space-y-0.5">
                {sec.items.map(({ to, icon: Icon, label, end }) => (
                  <NavLink
                    key={to + label}
                    to={to}
                    end={end}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 font-bold shadow-xs'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <Globe className="w-4 h-4 text-purple-600" />
            <span>Visit Website</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-60 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 dark:bg-gray-900/90 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">Admin Dashboard</h2>
              <p className="text-[11px] text-gray-400">Live operational overview</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Period Selector */}
            <div className="w-32 sm:w-36 min-w-0">
              <CustomSelect
                size="sm"
                value={period}
                onChange={(val) => setPeriod(val)}
                options={[
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: '90d', label: 'Last 90 Days' },
                  { value: '1y', label: 'Last 1 Year' },
                  { value: 'all', label: 'All Time' },
                ]}
                placeholder="Period"
              />
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.fullName?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{user?.fullName || 'Admin'}</p>
                  <p className="text-[10px] text-purple-600 font-bold uppercase">Administrator</p>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xl py-1 z-30">
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30"
                  >
                    <Settings className="w-4 h-4" /> Profile Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Workspace */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Welcome back, {firstName}! 👋
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Real-time metrics, platform growth, and active learner analytics.
              </p>
            </div>
          </div>

          {/* Real Live Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="w-6 h-6" />}
              color="#8B5CF6" bg="rgba(139,92,246,0.12)"
              title="Total Users"
              value={loading ? '...' : totalUsers.toLocaleString()}
              sub={userGrowth !== null && userGrowth !== undefined ? `${userGrowth >= 0 ? '+' : ''}${userGrowth}% vs prev period` : null}
              subUp={userGrowth >= 0}
            />
            <StatCard
              icon={<BookOpen className="w-6 h-6" />}
              color="#10B981" bg="rgba(16,185,129,0.12)"
              title="Total Courses"
              value={loading ? '...' : totalCourses.toLocaleString()}
              sub={courseGrowth !== null && courseGrowth !== undefined ? `${courseGrowth >= 0 ? '+' : ''}${courseGrowth}% vs prev period` : null}
              subUp={courseGrowth >= 0}
            />
            <StatCard
              icon={<GraduationCap className="w-6 h-6" />}
              color="#F59E0B" bg="rgba(245,158,11,0.12)"
              title="Enrollments"
              value={loading ? '...' : totalEnrollments.toLocaleString()}
              sub={enrollmentGrowth !== null && enrollmentGrowth !== undefined ? `${enrollmentGrowth >= 0 ? '+' : ''}${enrollmentGrowth}% vs prev period` : null}
              subUp={enrollmentGrowth >= 0}
            />
            <StatCard
              icon={<DollarSign className="w-6 h-6" />}
              color="#3B82F6" bg="rgba(59,130,246,0.12)"
              title="Gross Revenue"
              value={loading ? '...' : `₹${Number(totalRevenue).toLocaleString()}`}
              sub={revenueGrowth !== null && revenueGrowth !== undefined ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% vs prev period` : null}
              subUp={revenueGrowth >= 0}
            />
          </div>

          {/* Middle Row: Top Courses + Recent Users */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Top Courses (2 columns) */}
            <div className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Top Courses by Enrollment</h2>
                  <p className="text-xs text-gray-400">Live active course distribution</p>
                </div>
                <Link to="/admin/courses" className="text-xs font-bold text-purple-600 hover:text-purple-500">
                  View all courses →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : topCourses.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {topCourses.map((c, i) => (
                    <TopCourseRow
                      key={c.courseId || i}
                      rank={i + 1}
                      title={c.title || 'Course'}
                      enrollments={c.enrollmentCount || 0}
                      rating={c.averageRating || 5.0}
                      price={c.price}
                      color={['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EC4899'][i % 5]}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-500">No courses published yet</p>
                </div>
              )}
            </div>

            {/* Recent Registered Users */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Registrations</h2>
                  <p className="text-xs text-gray-400">Latest signed up users</p>
                </div>
                <Link to="/admin/users" className="text-xs font-bold text-purple-600 hover:text-purple-500">
                  All Users →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3 py-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : recentUsers.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                  {recentUsers.slice(0, 5).map((u) => (
                    <RecentUserRow
                      key={u._id}
                      name={u.fullName || 'User'}
                      email={u.email}
                      role={u.role || 'student'}
                      createdAt={u.createdAt}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-500">No user records</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: User Roles breakdown + Real System Status */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* User Role Breakdown (2 columns) */}
            <div className="xl:col-span-2 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">User Distribution by Role</h2>
              <p className="text-xs text-gray-400 mb-5">Live account classification across the platform</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/60">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">Students</p>
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-3xl font-black text-purple-900 dark:text-purple-100 mt-2">{loading ? '...' : studentsCount}</p>
                  <p className="text-[11px] text-purple-600/80 mt-1">Enrolled & Active</p>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Instructors</p>
                    <UserCog className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100 mt-2">{loading ? '...' : instructorsCount}</p>
                  <p className="text-[11px] text-emerald-600/80 mt-1">Course Creators</p>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/60">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase">Admins</p>
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-2">{loading ? '...' : adminsCount}</p>
                  <p className="text-[11px] text-amber-600/80 mt-1">Platform Control</p>
                </div>
              </div>
            </div>

            {/* Real System Status */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs p-6">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">System Health</h2>
              <p className="text-xs text-gray-400 mb-4">Real-time infrastructure & service states</p>
              
              <div className="space-y-1">
                <StatusRow
                  name="Database"
                  icon={Activity}
                  status={systemHealth?.database || 'Online'}
                  detail="MongoDB Atlas Cluster"
                />
                <StatusRow
                  name="API Gateway"
                  icon={Globe}
                  status={systemHealth?.apiServer || 'Online'}
                  detail={`Node.js Server (${systemHealth?.memoryUsageMB || 45}MB Memory)`}
                />
                <StatusRow
                  name="Live Class Server"
                  icon={Video}
                  status={systemHealth?.liveClasses || 'Online'}
                  detail="WebRTC / Socket Streaming"
                />
                <StatusRow
                  name="Certificates Engine"
                  icon={Award}
                  status="Online"
                  detail={`${totalCertificates} verified certificates issued`}
                />
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {[
              { label: 'Manage Users',    icon: Users,       to: '/admin/users',            color: '#8B5CF6' },
              { label: 'Manage Courses',  icon: BookOpen,    to: '/admin/courses',          color: '#10B981' },
              { label: 'View Orders',     icon: ShoppingBag, to: '/admin/orders',           color: '#3B82F6' },
              { label: 'Live Attendance', icon: Video,       to: '/admin/live-attendance',  color: '#EC4899' },
              { label: 'Audit Logs',      icon: BarChart2,   to: '/admin/audit',            color: '#EF4444' },
            ].map(({ label, icon: Icon, to, color }) => (
              <Link
                key={to}
                to={to}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-3.5 sm:p-4 flex items-center gap-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: `${color}15` }}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
