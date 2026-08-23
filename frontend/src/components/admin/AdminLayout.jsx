import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Tag, UserCog, Video, ClipboardList,
  Star, FileText, Bell, ShoppingBag, Tag as CouponTag, BarChart2,
  Settings, Globe, LogOut, ArrowUpRight, Menu, ChevronDown,
  GraduationCap, DollarSign, Zap, ArrowLeft, User, MessageSquare, Flag
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectUser, logoutUser } from '../../store/slices/authSlice';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
} from '../ui/Sidebar';
import { useSidebar } from '../ui/useSidebar';
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
      { to: '/admin/courses',          icon: FileText,        label: 'Lectures & Content' },
      { to: '/discussions',            icon: MessageSquare,   label: 'Discussions & Q&A' },
      { to: '/admin/notes',            icon: Bell,            label: 'Notes & Documents' },
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

export default function AdminLayout({ children, title, subtitle, actions, showBack = false }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AdminLayoutInner title={title} subtitle={subtitle} actions={actions} showBack={showBack}>
        {children}
      </AdminLayoutInner>
    </SidebarProvider>
  );
}

function AdminLayoutInner({ children, title, subtitle, actions, showBack = false }) {
  const dispatch  = useAppDispatch();
  const user      = useAppSelector(selectUser);
  const navigate  = useNavigate();
  const { open, setOpen } = useSidebar();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await dispatch(logoutUser());
    toast.success('Logged out');
    navigate('/login');
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) {
      setOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#111111] font-[Inter,sans-serif] w-full max-w-full overflow-x-hidden">
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-neutral-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar>
        <SidebarHeader>
          <Link to="/admin" className="flex items-center gap-2.5 no-underline py-2" onClick={closeSidebarOnMobile}>
            <div className="w-7 h-7 bg-gray-900 dark:bg-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-white dark:text-gray-900" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-none tracking-tight">NavGujarat</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Admin Console</p>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <div className="py-2">
            {sidebarSections.map((section) => (
              <div key={section.label} className="mb-4 last:mb-0">
                <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-500 px-3 mb-2">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map(({ to, icon: Icon, label, end }) => (
                    <NavLink
                      key={`${to}-${label}`}
                      to={to}
                      end={end}
                      onClick={closeSidebarOnMobile}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors border-l-2 ${
                          isActive
                            ? 'text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20 border-purple-600'
                            : 'text-slate-600 dark:text-neutral-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181818]'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SidebarContent>

        <SidebarFooter>
          <div className="border-t border-slate-200 dark:border-white/10 pt-3 space-y-1">
            <Link
              to="/"
              onClick={closeSidebarOnMobile}
              className="flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181818] rounded-sm transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>Live Website</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-50" />
            </Link>
            <button
              type="button"
              onClick={() => {
                closeSidebarOnMobile();
                handleLogout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] font-medium text-gray-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-sm transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 w-full max-w-full lg:ml-60 min-h-screen flex flex-col overflow-x-hidden">
        
        {/* Topbar */}
        <header className="bg-white dark:bg-[#181818] border-b border-slate-200 dark:border-white/10 sticky top-0 z-30 w-full">
          <div className="flex items-center gap-3 px-4 h-14">
            <SidebarTrigger className="lg:hidden shrink-0" />

            {/* Breadcrumb / Back */}
            {showBack && (
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1 && window.history.state?.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/admin');
                  }
                }}
                className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            <div className="flex-1"></div>

            {/* Actions / Utilities */}
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/discussions" className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition-colors" title="Discussions">
                <MessageSquare className="w-4 h-4" />
              </Link>
              <Link to="/notifications" className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition-colors relative" title="Notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gray-900 dark:bg-white rounded-full" />
              </Link>

              {/* User Menu */}
              <div className="relative ml-2 pl-4 border-l border-slate-200 dark:border-white/10" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer text-left"
                >
                  <div className="w-7 h-7 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-900 dark:text-white font-bold text-xs shrink-0 overflow-hidden">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName || 'Admin'}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      user?.fullName?.[0]?.toUpperCase() || 'A'
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-tight">
                      {user?.fullName || 'Admin'}
                    </p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#202020] rounded-md shadow-lg border border-slate-200 dark:border-white/10 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-white/10 mb-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.fullName || 'Admin'}</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <User className="w-3.5 h-3.5" /> Profile Settings
                    </Link>

                    <Link
                      to="/"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5" /> View Live Site
                    </Link>

                    <div className="border-t border-gray-100 dark:border-neutral-800 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-1.5 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Header */}
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 w-full bg-white dark:bg-[#181818] border-b border-slate-200 dark:border-white/10">
            <div className="min-w-0">
              {title && <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{title}</h1>}
              {subtitle && <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 p-6 w-full min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
