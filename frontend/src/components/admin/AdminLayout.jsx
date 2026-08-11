import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Tag, UserCog, Video, ClipboardList,
  Star, FileText, Bell, ShoppingBag, Tag as CouponTag, BarChart2,
  Settings, Globe, LogOut, ArrowUpRight, Menu, ChevronDown,
  GraduationCap, DollarSign, Zap, ArrowLeft, User
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

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

export default function AdminLayout({ children, title, subtitle, actions, showBack = false }) {
  const dispatch  = useAppDispatch();
  const user      = useAppSelector(selectUser);
  const navigate  = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Dropdown Backdrop */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
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
      <main className="flex-1 lg:ml-56 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
          <div className="flex items-center gap-3 px-6 py-3.5">
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
                  navigate('/admin');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition cursor-pointer"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search across platform..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto relative">
              {actions}
              <Link to="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Link>

              {/* User Avatar & Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 ml-2 pl-3 border-l border-gray-200 dark:border-gray-700 hover:opacity-80 transition cursor-pointer text-left"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
                    style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                  >
                    {user?.fullName?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{user?.fullName || 'Admin'}</p>
                    <p className="text-[10px] text-purple-500 font-semibold capitalize">{user?.role || 'Super Admin'}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Popover */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 z-40 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.fullName || 'Admin'}</p>
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
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-600" /> Admin Dashboard
                    </Link>

                    <Link
                      to="/"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30 transition-colors"
                    >
                      <Globe className="w-4 h-4 text-purple-600" /> Visit Main Website
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

        {/* Page Content */}
        <div className="flex-1 p-6 space-y-6">
          {(title || subtitle) && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                {title && <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h1>}
                {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
