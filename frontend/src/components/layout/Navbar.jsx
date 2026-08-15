import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpenIcon,
  ShoppingCartIcon,
  HeartIcon,
  UserIcon,
  LogOutIcon,
  ChevronDownIcon,
  BellIcon,
  MessageSquareIcon,
  BrainIcon,
  SunIcon,
  MoonIcon,
  MenuIcon,
  XIcon,
} from '@animateicons/react/lucide';
// Icons not available in animateicons package
import {
  GraduationCap as GraduationCapStatic,
  Award as AwardStatic,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser, selectUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

function NavItem({ to, children, onNavigate, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `block px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
          isActive
            ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400 font-semibold'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export function Navbar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const adminDropdownRef = useRef(null);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.add('theme-transition');
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setAdminDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(e.target)) {
        setAdminDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Logged out successfully');
    navigate('/');
    setDropdownOpen(false);
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  const desktopLinkClass = ({ isActive }) =>
    isActive ? 'text-purple-600 font-semibold dark:text-purple-400' : 'hover:text-purple-600 dark:hover:text-purple-400 transition-colors';

  const adminLinks = [
    { to: '/admin', label: 'Admin Overview' },
    { to: '/admin/users', label: 'Manage Users' },
    { to: '/admin/orders', label: 'Manage Orders' },
    { to: '/admin/courses', label: 'Manage Courses' },
    { to: '/admin/panel?tab=categories', label: 'Categories & Coupons' },
    { to: '/admin/audit', label: 'Audit Logs' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white shrink-0 no-underline">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-950/30 shrink-0">
              <GraduationCapStatic className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="truncate">Vertex<span className="text-purple-600 dark:text-purple-400">Portal</span></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-700 dark:text-gray-300">
            <NavLink to="/courses" className={desktopLinkClass}>Browse Courses</NavLink>
            <NavLink to="/discussions" className={desktopLinkClass}>
              <span className="inline-flex items-center gap-1.5"><MessageSquareIcon size={15} color="#6C5CE7" /> Discussions</span>
            </NavLink>
            <NavLink to="/ai-chat" className={desktopLinkClass}>
              <span className="inline-flex items-center gap-1.5"><BrainIcon size={15} color="#6C5CE7" /> AI Tutor</span>
            </NavLink>

            {user?.role === 'student' && (
              <>
                <NavLink to="/dashboard" className={desktopLinkClass}>Dashboard</NavLink>
                <NavLink to="/my-learning" className={desktopLinkClass}>My Learning</NavLink>
                <NavLink to="/student/notes" className={desktopLinkClass}>Notes</NavLink>
                <NavLink to="/student/live-classes" className={desktopLinkClass}>Live Classes</NavLink>
                <NavLink to="/student/quizzes" className={desktopLinkClass}>Quizzes</NavLink>
                <NavLink to="/student/assignments" className={desktopLinkClass}>Assignments</NavLink>
              </>
            )}

            {user && (user.role === 'instructor' || user.role === 'admin') && (
              <>
                <NavLink to="/instructor/dashboard" className={desktopLinkClass}>Instructor</NavLink>
                <NavLink to="/instructor/live-classes" className={desktopLinkClass}>Live Classes</NavLink>
                <NavLink to="/instructor/quizzes" className={desktopLinkClass}>Quizzes</NavLink>
              </>
            )}

            {user?.role === 'admin' && (
              <div className="relative group py-4" ref={adminDropdownRef}>
                <button
                  type="button"
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className="cursor-pointer flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 focus:outline-none"
                >
                  Admin <ChevronDownIcon size={13} color="currentColor" />
                </button>

                <div
                  className={`absolute left-0 top-full w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 transition-all ${
                    adminDropdownOpen ? 'block' : 'hidden group-hover:block'
                  }`}
                >
                  {adminLinks.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setAdminDropdownOpen(false)}
                      className="block px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400 transition"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(prev => !prev)}
              className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
              title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {darkMode ? <SunIcon size={17} color="#f59e0b" /> : <MoonIcon size={17} color="currentColor" />}
            </button>

            {/* Notifications (only shown when logged in or on larger screens) */}
            {user && (
              <Link
                to="/notifications"
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-colors relative shrink-0"
                title="Notifications"
              >
                <BellIcon size={17} color="currentColor" />
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-purple-600 rounded-full" />
              </Link>
            )}

            {user?.role === 'student' && (
              <>
                <Link
                  to="/cart"
                  className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-colors relative shrink-0"
                  title="Cart"
                >
                  <ShoppingCartIcon size={17} color="currentColor" />
                </Link>
                <Link
                  to="/wishlist"
                  className="hidden sm:inline-flex p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                  title="Wishlist"
                >
                  <HeartIcon size={17} color="currentColor" />
                </Link>
              </>
            )}

            {user ? (
              <div className="relative shrink-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0 overflow-hidden">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName || 'User'}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      user.fullName?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <span className="hidden md:inline-block text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {user.fullName?.split(' ')[0]}
                  </span>
                  <ChevronDownIcon size={13} color="#9ca3af" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.fullName}</p>
                      <p className="text-[11px] text-purple-600 font-semibold capitalize">{user.role}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition-colors"
                    >
                      <UserIcon size={14} color="#6C5CE7" /> Profile & Settings
                    </Link>

                    {user.role === 'student' && (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition-colors"
                        >
                          <GraduationCapStatic className="w-4 h-4" style={{ color: '#6C5CE7' }} /> Student Dashboard
                        </Link>
                        <Link
                          to="/my-learning"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition-colors"
                        >
                          <BookOpenIcon size={14} color="#6C5CE7" /> My Learning
                        </Link>
                      </>
                    )}

                    {user.role === 'instructor' && (
                      <Link
                        to="/instructor/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition-colors"
                      >
                        <AwardStatic className="w-4 h-4" style={{ color: '#6C5CE7' }} /> Instructor Dashboard
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition-colors"
                      >
                        <AwardStatic className="w-4 h-4" style={{ color: '#6C5CE7' }} /> Admin Dashboard
                      </Link>
                    )}

                    <div className="border-t border-gray-100 dark:border-slate-800 my-1" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left cursor-pointer"
                    >
                      <LogOutIcon size={14} color="#ef4444" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  to="/login"
                  className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-purple-600 transition whitespace-nowrap shrink-0"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-3 sm:px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-md shadow-purple-950/20 transition whitespace-nowrap shrink-0"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileOpen(prev => !prev)}
              className="lg:hidden p-1.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 rounded-xl transition shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <XIcon size={20} color="currentColor" /> : <MenuIcon size={20} color="currentColor" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 pt-2 pb-6 space-y-2 animate-in fade-in slide-in-from-top-2">
          {user?.role === 'student' && (
            <>
              <NavItem to="/dashboard" onNavigate={closeMobile}>Dashboard</NavItem>
              <NavItem to="/my-learning" onNavigate={closeMobile}>My Learning</NavItem>
            </>
          )}

          <NavItem to="/courses" onNavigate={closeMobile}>Browse Courses</NavItem>
          <NavItem to="/discussions" onNavigate={closeMobile}>Discussions</NavItem>
          <NavItem to="/ai-chat" onNavigate={closeMobile}>AI Tutor</NavItem>

          {user?.role === 'student' && (
            <>
              <NavItem to="/student/notes" onNavigate={closeMobile}>Notes</NavItem>
              <NavItem to="/student/live-classes" onNavigate={closeMobile}>Live Classes</NavItem>
              <NavItem to="/student/quizzes" onNavigate={closeMobile}>Quizzes</NavItem>
              <NavItem to="/student/assignments" onNavigate={closeMobile}>Assignments</NavItem>
              <NavItem to="/wishlist" onNavigate={closeMobile}>Wishlist</NavItem>
            </>
          )}

          {user?.role === 'instructor' && (
            <>
              <NavItem to="/instructor/dashboard" onNavigate={closeMobile}>Instructor Dashboard</NavItem>
              <NavItem to="/instructor/live-classes" onNavigate={closeMobile}>Live Classes</NavItem>
              <NavItem to="/instructor/quizzes" onNavigate={closeMobile}>Quizzes</NavItem>
            </>
          )}

          {user?.role === 'admin' && adminLinks.map(({ to, label }) => (
            <NavItem key={to} to={to} onNavigate={closeMobile}>{label}</NavItem>
          ))}

          {!user && (
            <div className="pt-3 mt-2 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={closeMobile}
                className="w-full text-center py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={closeMobile}
                className="w-full text-center py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xs transition"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
