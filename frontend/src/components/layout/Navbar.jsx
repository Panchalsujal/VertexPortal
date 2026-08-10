import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen, ShoppingCart, Heart, User, LogOut,
  ChevronDown, GraduationCap, Bell, Award, MessageSquare, FileText, Bot, Sun, Moon, Menu, X
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
        `block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400'
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
    isActive ? 'text-blue-600 font-semibold dark:text-blue-400' : 'hover:text-gray-900 dark:hover:text-white';

  const adminLinks = [
    { to: '/admin', label: 'Admin Overview' },
    { to: '/admin/users', label: 'Manage Users' },
    { to: '/admin/orders', label: 'Manage Orders' },
    { to: '/admin/courses', label: 'Manage Courses' },
    { to: '/admin/audit', label: 'Audit Logs' },
    { to: '/admin/reviews', label: 'Ratings & Reviews' },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white shrink-0">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>Vertex<span className="text-blue-600">Portal</span></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            <NavLink to="/courses" className={desktopLinkClass}>Browse Courses</NavLink>
            <NavLink to="/discussions" className={desktopLinkClass}>
              <span className="inline-flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Discussions</span>
            </NavLink>
            <NavLink to="/ai-chat" className={desktopLinkClass}>
              <span className="inline-flex items-center gap-1"><Bot className="w-4 h-4 text-blue-600" /> AI Tutor</span>
            </NavLink>

            {user?.role === 'student' && (
              <>
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
                  className="cursor-pointer flex items-center gap-1 hover:text-gray-900 dark:hover:text-white focus:outline-none"
                >
                  Admin <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <div
                  className={`absolute left-0 top-full w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 z-50 transition-all ${
                    adminDropdownOpen ? 'block' : 'hidden group-hover:block'
                  }`}
                >
                  {adminLinks.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setAdminDropdownOpen(false)}
                      className="block px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setDarkMode(prev => !prev)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                <Link to="/notifications" className="hidden sm:block p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg" title="Notifications">
                  <Bell className="w-5 h-5" />
                </Link>

                {user.role === 'student' && (
                  <>
                    <Link to="/cart" className="hidden sm:block p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg" title="Cart">
                      <ShoppingCart className="w-5 h-5" />
                    </Link>
                    <Link to="/wishlist" className="hidden sm:block p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg" title="Wishlist">
                      <Heart className="w-5 h-5" />
                    </Link>
                    <Link to="/my-learning" className="hidden sm:block p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg" title="My Learning">
                      <BookOpen className="w-5 h-5" />
                    </Link>
                  </>
                )}

                <div className="relative hidden sm:block" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                      {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 hidden md:inline">{user.fullName?.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{user.fullName}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                          {user.role}
                        </span>
                      </div>

                      <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800">
                        <User className="w-4 h-4 text-gray-400" /> Profile
                      </Link>
                      <Link to="/certificates" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800">
                        <Award className="w-4 h-4 text-gray-400" /> My Certificates
                      </Link>
                      <Link to="/student/notes" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800">
                        <FileText className="w-4 h-4 text-gray-400" /> Study Notes
                      </Link>

                      <div className="border-t border-gray-100 dark:border-slate-800 my-1" />

                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-left">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="px-4 py-4 space-y-1">
            <NavItem to="/courses" onNavigate={closeMobile}>Browse Courses</NavItem>
            <NavItem to="/discussions" onNavigate={closeMobile}>
              <span className="inline-flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Discussions</span>
            </NavItem>
            <NavItem to="/ai-chat" onNavigate={closeMobile}>
              <span className="inline-flex items-center gap-2"><Bot className="w-4 h-4" /> AI Tutor</span>
            </NavItem>

            {user?.role === 'student' && (
              <>
                <NavItem to="/student/notes" onNavigate={closeMobile}>Notes</NavItem>
                <NavItem to="/student/live-classes" onNavigate={closeMobile}>Live Classes</NavItem>
                <NavItem to="/student/quizzes" onNavigate={closeMobile}>Quizzes</NavItem>
                <NavItem to="/student/assignments" onNavigate={closeMobile}>Assignments</NavItem>
                <NavItem to="/cart" onNavigate={closeMobile}>Cart</NavItem>
                <NavItem to="/wishlist" onNavigate={closeMobile}>Wishlist</NavItem>
                <NavItem to="/my-learning" onNavigate={closeMobile}>My Learning</NavItem>
              </>
            )}

            {user && (user.role === 'instructor' || user.role === 'admin') && (
              <>
                <NavItem to="/instructor/dashboard" onNavigate={closeMobile}>Instructor Dashboard</NavItem>
                <NavItem to="/instructor/live-classes" onNavigate={closeMobile}>Live Classes</NavItem>
                <NavItem to="/instructor/quizzes" onNavigate={closeMobile}>Quizzes</NavItem>
              </>
            )}

            {user?.role === 'admin' && adminLinks.map(({ to, label }) => (
              <NavItem key={to} to={to} onNavigate={closeMobile}>{label}</NavItem>
            ))}

            {user ? (
              <>
                <div className="border-t border-gray-200 dark:border-slate-800 my-3 pt-3 space-y-1">
                  <NavItem to="/notifications" onNavigate={closeMobile}>Notifications</NavItem>
                  <NavItem to="/profile" onNavigate={closeMobile}>Profile</NavItem>
                  <NavItem to="/certificates" onNavigate={closeMobile}>My Certificates</NavItem>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <div className="border-t border-gray-200 dark:border-slate-800 mt-3 pt-4 flex flex-col gap-2">
                <Link to="/login" onClick={closeMobile} className="btn btn-secondary w-full text-center">Login</Link>
                <Link to="/register" onClick={closeMobile} className="btn btn-primary w-full text-center">Get Started</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
