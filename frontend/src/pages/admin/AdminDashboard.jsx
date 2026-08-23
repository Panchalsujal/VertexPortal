import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, ClipboardList,
  Star, BarChart2,
  TrendingUp, TrendingDown,
  Activity, Globe, Video, Award, GraduationCap, UserCog, ShieldCheck
} from 'lucide-react';
import { getAdminDashboardStats } from '../../api/adminDashboard.api';
import CustomSelect from '../../components/ui/CustomSelect';
import toast from 'react-hot-toast';
import { useAdminGuard } from '../../hooks/useAdminGuard';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import AdminLayout from '../../components/admin/AdminLayout';
import { AnimatedThreeDots } from '../../components/ui/Spinner';

function StatCard({ title, value, sub, subUp = true }) {
  const isLoading = value === '...' || value === undefined || value === null;
  return (
    <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 tracking-wider uppercase">{title}</p>
      <div className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums flex items-center min-h-[1.75rem]">
        {isLoading ? <AnimatedThreeDots color="currentColor" /> : value}
      </div>
      {sub && (
        <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${subUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          {subUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          <span className="tabular-nums">{sub}</span>
        </p>
      )}
    </div>
  );
}

function StatusRow({ name, status = 'Online', detail }) {
  const online = status === 'Online' || status === 'Operational';
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-[#202020]/30 transition-colors px-2 -mx-2 rounded-md">
      <div>
        <span className="text-sm font-medium text-gray-900 dark:text-white block">{name}</span>
        {detail && <span className="text-xs text-slate-500 dark:text-neutral-400 block mt-0.5">{detail}</span>}
      </div>
      <span className="text-xs font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-md border bg-slate-50 dark:bg-[#202020] text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10">
        <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'} ${online ? 'animate-pulse' : ''}`} />
        {status}
      </span>
    </div>
  );
}

function RecentUserRow({ name, email, role, createdAt }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-[#202020]/30 transition-colors px-2 -mx-2 rounded-md">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{name || 'User'}</p>
        <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">{email}</p>
      </div>
      <div className="text-right shrink-0">
        <span className="text-xs font-medium px-2 py-0.5 rounded-md capitalize border bg-slate-50 dark:bg-[#202020] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-white/10">
          {role}
        </span>
        {createdAt && (
          <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-1.5 tabular-nums">
            {new Date(createdAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

function TopCourseRow({ rank, title, enrollments, price }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-[#202020]/30 transition-colors px-2 -mx-2 rounded-md">
      <span className="w-5 text-sm font-semibold text-slate-400 dark:text-neutral-500 shrink-0 tabular-nums">{rank}.</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500 dark:text-neutral-400">
            <span className="tabular-nums">{enrollments}</span> {enrollments === 1 ? 'student' : 'students'}
          </span>
          {price !== undefined && (
            <span className="text-xs text-slate-500 dark:text-neutral-400">
              · <span className="tabular-nums">{price === 0 ? 'Free' : `₹${price}`}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────
export default function AdminDashboard() {
  const user = useAppSelector(selectUser);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useAdminGuard();

  useInactivityLogout({
    onWarning: (secondsLeft) => {
      toast(`⚠️ Admin session expires in ${Math.floor(secondsLeft / 60)} min due to inactivity`, {
        icon: '🔒',
        duration: 10000,
      });
    },
  });

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
  const revenueGrowth    = periodStats?.revenue?.growthPercentage;

  const topCourses      = dashboardData?.topCourses || [];
  const recentUsers     = dashboardData?.recent?.users || dashboardData?.recentUsers || [];

  const PeriodSelector = (
    <div className="w-32 min-w-0">
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
  );

  return (
    <AdminLayout 
      title={`Overview`} 
      subtitle={`Live metrics and platform analytics`}
      actions={PeriodSelector}
    >
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={loading ? '...' : totalUsers.toLocaleString()}
            sub={userGrowth !== null && userGrowth !== undefined ? `${userGrowth >= 0 ? '+' : ''}${userGrowth}%` : null}
            subUp={userGrowth >= 0}
          />
          <StatCard
            title="Total Courses"
            value={loading ? '...' : totalCourses.toLocaleString()}
            sub={courseGrowth !== null && courseGrowth !== undefined ? `${courseGrowth >= 0 ? '+' : ''}${courseGrowth}%` : null}
            subUp={courseGrowth >= 0}
          />
          <StatCard
            title="Enrollments"
            value={loading ? '...' : totalEnrollments.toLocaleString()}
            sub={enrollmentGrowth !== null && enrollmentGrowth !== undefined ? `${enrollmentGrowth >= 0 ? '+' : ''}${enrollmentGrowth}%` : null}
            subUp={enrollmentGrowth >= 0}
          />
          <StatCard
            title="Gross Revenue"
            value={loading ? '...' : `₹${Number(totalRevenue).toLocaleString()}`}
            sub={revenueGrowth !== null && revenueGrowth !== undefined ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%` : null}
            subUp={revenueGrowth >= 0}
          />
        </div>

        {/* Middle Data Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Courses */}
          <div className="lg:col-span-2 bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">Top Courses</h2>
              <Link to="/admin/courses" className="text-sm font-medium text-slate-500 hover:text-purple-600 transition-colors">
                View All →
              </Link>
            </div>
            
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-sm animate-pulse" />
                ))}
              </div>
            ) : topCourses.length > 0 ? (
              <div className="flex flex-col">
                {topCourses.map((c, i) => (
                  <TopCourseRow
                    key={c.courseId || i}
                    rank={i + 1}
                    title={c.title || 'Course'}
                    enrollments={c.enrollmentCount || 0}
                    price={c.price}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-500 py-4">No course data available.</p>
            )}
          </div>

          {/* Recent Users */}
          <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">Recent Signups</h2>
              <Link to="/admin/users" className="text-sm font-medium text-slate-500 hover:text-purple-600 transition-colors">
                View All →
              </Link>
            </div>
            
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-100 dark:bg-neutral-800 rounded-sm animate-pulse" />
                ))}
              </div>
            ) : recentUsers.length > 0 ? (
              <div className="flex flex-col">
                {recentUsers.slice(0, 5).map((u) => (
                  <RecentUserRow
                    key={u._id}
                    name={u.fullName}
                    email={u.email}
                    role={u.role || 'student'}
                    createdAt={u.createdAt}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-500 py-4">No recent users.</p>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Distribution */}
          <div className="lg:col-span-2 bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 shadow-sm rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-6 tracking-tight">Active Roles</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-[#202020]">
                <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Students</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{loading ? '...' : studentsCount}</p>
              </div>
              <div className="p-4 border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-[#202020]">
                <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Instructors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{loading ? '...' : instructorsCount}</p>
              </div>
              <div className="p-4 border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-[#202020]">
                <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{loading ? '...' : adminsCount}</p>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 shadow-sm rounded-lg p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 tracking-tight">System Status</h2>
            <div className="flex flex-col gap-1">
              <StatusRow
                name="Database"
                status={systemHealth?.database || 'Online'}
                detail="MongoDB Atlas"
              />
              <StatusRow
                name="API Gateway"
                status={systemHealth?.apiServer || 'Online'}
                detail={`Node.js Server`}
              />
              <StatusRow
                name="Live Class Node"
                status={systemHealth?.liveClasses || 'Online'}
                detail="WebRTC Streaming"
              />
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
