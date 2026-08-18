import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  ShoppingCart,
  Heart,
  User,
  LogOut,
  ChevronDown,
  Bell,
  MessageSquare,
  Brain,
  Sun,
  Moon,
  Menu,
  X,
  GraduationCap,
  Award,
  Video,
  FileText,
  CheckSquare,
  LayoutDashboard,
  Sparkles,
  Compass,
  Flame,
  Code2,
  PlusCircle,
  Megaphone,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser, selectUser } from '../../store/slices/authSlice';
import { useTheme } from '../../context/ThemeContext.jsx';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../ui/DropdownMenu';
import toast from 'react-hot-toast';

function NavItem({ to, icon: Icon, children, onNavigate, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl transition-all ${
          isActive
            ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400 font-bold shadow-xs'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-white'
        }`
      }
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />}
      <span>{children}</span>
    </NavLink>
  );
}

export function Navbar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile drawer upon route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Subtle glass elevation on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Logout failed');
    }
  };

  const closeMobile = () => setMobileOpen(false);

  const desktopLinkClass = ({ isActive }) =>
    `relative px-3 py-1.5 text-xs xl:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
      isActive
        ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-50/80 dark:bg-purple-950/40'
        : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100/70 dark:hover:bg-slate-800/70'
    }`;

  const adminLinks = [
    { to: '/admin', label: 'Admin Dashboard' },
    { to: '/admin/courses', label: 'Courses Management' },
    { to: '/admin/users', label: 'User Directory' },
    { to: '/admin/orders', label: 'Revenue & Orders' },
    { to: '/admin/reviews', label: 'Moderation & Reviews' },
    { to: '/admin/audit', label: 'Security Audit Logs' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800/80 shadow-xs'
          : 'bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group no-underline">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/25 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white leading-none font-sans">
                NavGujarat<span className="text-purple-600 dark:text-purple-400">Academy</span>
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400 mt-0.5">
                Online Learning
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            
            {/* Explore Courses Dropdown Menu */}
            <DropdownMenu
              align="start"
              className="w-64 p-2"
              trigger={
                <NavLink to="/courses" className={desktopLinkClass}>
                  <Compass className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Explore Courses</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
                </NavLink>
              }
            >
              <div className="space-y-1">
                <Link
                  to="/courses"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-800 dark:text-slate-200 group transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                      All Courses
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">
                      Browse the complete catalog
                    </p>
                  </div>
                </Link>

                <Link
                  to="/courses?sort=popular"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-800 dark:text-slate-200 group transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                      Popular Masterclasses
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">
                      Top-rated courses by students
                    </p>
                  </div>
                </Link>

                <Link
                  to="/courses?price=free"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-800 dark:text-slate-200 group transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                      Free Courses
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">
                      Start learning at zero cost
                    </p>
                  </div>
                </Link>
              </div>
            </DropdownMenu>

            {/* Code Playground */}
            <NavLink to="/playground" className={desktopLinkClass}>
              <Code2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Playground</span>
            </NavLink>

            {/* Community Discussions */}
            <NavLink to="/discussions" className={desktopLinkClass}>
              <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Discussions</span>
            </NavLink>

            {/* Authenticated Role-Specific Nav Items */}
            {user && user.role === 'student' && (
              <>
                <NavLink to="/my-learning" className={desktopLinkClass}>
                  <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>My Learning</span>
                </NavLink>

                <NavLink to="/student/live-classes" className={desktopLinkClass}>
                  <Video className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Live Classes</span>
                </NavLink>

                <NavLink to="/ai-chat" className={desktopLinkClass}>
                  <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>AI Tutor</span>
                </NavLink>

                {/* Student Hub Dropdown */}
                <DropdownMenu
                  align="start"
                  className="w-52"
                  trigger={
                    <button
                      type="button"
                      className="cursor-pointer whitespace-nowrap px-2.5 py-1.5 text-xs xl:text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100/70 dark:hover:bg-slate-800/70 transition-all flex items-center gap-1 focus:outline-none"
                    >
                      <span>More</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  }
                >
                  <div className="py-1">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Student Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/discussions')}>
                      <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Discussions</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/student/notes')}>
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>My Notes</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/student/quizzes')}>
                      <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Quizzes</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/student/assignments')}>
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Assignments</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/certificates')}>
                      <Award className="w-4 h-4 text-sky-500" />
                      <span>My Certificates</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenu>
              </>
            )}

            {user && user.role === 'instructor' && (
              <>
                <NavLink to="/instructor/dashboard" className={desktopLinkClass}>
                  <LayoutDashboard className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Dashboard</span>
                </NavLink>

                <NavLink to="/instructor/courses/new" className={desktopLinkClass}>
                  <PlusCircle className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Create Course</span>
                </NavLink>

                {/* Instructor Hub Dropdown */}
                <DropdownMenu
                  align="start"
                  className="w-56"
                  trigger={
                    <button
                      type="button"
                      className="cursor-pointer whitespace-nowrap px-2.5 py-1.5 text-xs xl:text-sm font-semibold rounded-xl text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100/70 dark:hover:bg-slate-800/70 transition-all flex items-center gap-1 focus:outline-none"
                    >
                      <span>Teaching Tools</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  }
                >
                  <div className="py-1">
                    <DropdownMenuItem onClick={() => navigate('/instructor/quizzes')}>
                      <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Quizzes & AI Generator</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/instructor/live-classes')}>
                      <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Live Classes</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/instructor/assignments')}>
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Assignments</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/instructor/announcements')}>
                      <Megaphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Announcements</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenu>
              </>
            )}

            {user && user.role === 'admin' && (
              <DropdownMenu
                align="start"
                className="w-56"
                trigger={
                  <button
                    type="button"
                    className="cursor-pointer whitespace-nowrap px-2.5 py-1.5 text-xs xl:text-sm font-semibold rounded-xl text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all flex items-center gap-1 focus:outline-none"
                  >
                    <span>Admin Portal</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>
                }
              >
                <div className="py-1">
                  {adminLinks.map(({ to, label }) => (
                    <DropdownMenuItem key={to} onClick={() => navigate(to)}>
                      <span>{label}</span>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenu>
            )}
          </nav>

          {/* Right Actions Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto lg:ml-0">
            
            {/* Daily Learning Streak Badge */}
            {user && user.role === 'student' && (
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-800/40 text-orange-600 dark:text-orange-400 text-xs font-bold shadow-2xs hover:scale-105 transition-transform shrink-0"
                title="Daily Learning Streak"
              >
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
                <span>{user.learningStreak?.currentStreak || 1} {user.learningStreak?.currentStreak === 1 ? 'Day' : 'Days'}</span>
              </Link>
            )}

            {/* Theme Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer shrink-0"
              title={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-label="Toggle theme mode"
            >
              {darkMode ? (
                <Sun className="w-4.5 h-4.5 text-amber-500" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-gray-600" />
              )}
            </button>

            {/* Notifications Button */}
            {user && (
              <Link
                to="/notifications"
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-all relative shrink-0"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
              </Link>
            )}

            {/* Student Quick Shopping Actions */}
            {user?.role === 'student' && (
              <>
                <Link
                  to="/cart"
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-all relative shrink-0"
                  title="Cart"
                  aria-label="Shopping Cart"
                >
                  <ShoppingCart className="w-4.5 h-4.5" />
                </Link>
                <Link
                  to="/wishlist"
                  className="hidden md:inline-flex p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition-all shrink-0"
                  title="Wishlist"
                  aria-label="Saved Wishlist"
                >
                  <Heart className="w-4.5 h-4.5" />
                </Link>
              </>
            )}

            <div className="h-5 w-px bg-gray-200 dark:bg-slate-800 hidden sm:block shrink-0 mx-1" />

            {/* User Profile Dropdown or Auth Buttons */}
            {user ? (
              <DropdownMenu
                align="end"
                className="w-56"
                trigger={
                  <div
                    className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-slate-700"
                    aria-label="User menu"
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
                    <span className="hidden md:inline-block text-xs font-bold text-gray-800 dark:text-gray-200 max-w-[100px] truncate">
                      {user.fullName?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                }
              >
                <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user.fullName}</p>
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold capitalize mt-0.5">{user.role}</p>
                </div>

                <div className="py-1">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Profile & Settings</span>
                  </DropdownMenuItem>

                  {user.role === 'student' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        <LayoutDashboard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Student Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/my-learning')}>
                        <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>My Learning</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/certificates')}>
                        <Award className="w-3.5 h-3.5 text-sky-500" />
                        <span>My Certificates</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {user.role === 'instructor' && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/instructor/dashboard')}>
                        <LayoutDashboard className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Instructor Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/instructor/courses/new')}>
                        <PlusCircle className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Create New Course</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/instructor/quizzes')}>
                        <CheckSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Quizzes & AI Generator</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/instructor/assignments')}>
                        <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Assignments & Grading</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/instructor/announcements')}>
                        <Megaphone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Announcements</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/instructor/live-classes')}>
                        <Video className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Live Sessions</span>
                      </DropdownMenuItem>
                    </>
                  )}

                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem destructive onClick={handleLogout}>
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Link
                  to="/login"
                  className="px-3 sm:px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition whitespace-nowrap shrink-0"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 sm:px-4.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-md shadow-purple-950/20 transition whitespace-nowrap shrink-0"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(prev => !prev)}
              className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-xl transition shrink-0 cursor-pointer flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-2 animate-in fade-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto shadow-xl">
          {!user && (
            <div className="pb-3 mb-2 border-b border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-2.5">
              <Link
                to="/login"
                onClick={closeMobile}
                className="w-full text-center py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={closeMobile}
                className="w-full text-center py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xs transition"
              >
                Sign up
              </Link>
            </div>
          )}

          {user?.role === 'student' && (
            <div className="pb-2 mb-2 border-b border-gray-100 dark:border-slate-800 space-y-1">
              <NavItem to="/dashboard" icon={LayoutDashboard} onNavigate={closeMobile}>Dashboard</NavItem>
              <NavItem to="/my-learning" icon={BookOpen} onNavigate={closeMobile}>My Learning</NavItem>
              <NavItem to="/certificates" icon={Award} onNavigate={closeMobile}>My Certificates</NavItem>
            </div>
          )}

          <div className="space-y-1">
            <NavItem to="/courses" icon={Compass} onNavigate={closeMobile}>Browse Courses</NavItem>
            <NavItem to="/playground" icon={Code2} onNavigate={closeMobile}>Code Playground</NavItem>
            <NavItem to="/discussions" icon={MessageSquare} onNavigate={closeMobile}>Discussions</NavItem>
            <NavItem to="/ai-chat" icon={Brain} onNavigate={closeMobile}>AI Tutor</NavItem>
          </div>

          {user?.role === 'student' && (
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-800 space-y-1">
              <NavItem to="/student/live-classes" icon={Video} onNavigate={closeMobile}>Live Classes</NavItem>
              <NavItem to="/student/quizzes" icon={CheckSquare} onNavigate={closeMobile}>Quizzes</NavItem>
              <NavItem to="/student/assignments" icon={FileText} onNavigate={closeMobile}>Assignments</NavItem>
              <NavItem to="/student/notes" icon={FileText} onNavigate={closeMobile}>Notes</NavItem>
              <NavItem to="/wishlist" icon={Heart} onNavigate={closeMobile}>Wishlist</NavItem>
              <NavItem to="/cart" icon={ShoppingCart} onNavigate={closeMobile}>Cart</NavItem>
            </div>
          )}

          {user?.role === 'instructor' && (
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-800 space-y-1">
              <NavItem to="/instructor/dashboard" icon={LayoutDashboard} onNavigate={closeMobile}>Instructor Dashboard</NavItem>
              <NavItem to="/instructor/live-classes" icon={Video} onNavigate={closeMobile}>Live Classes</NavItem>
              <NavItem to="/instructor/quizzes" icon={CheckSquare} onNavigate={closeMobile}>Quizzes</NavItem>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-800 space-y-1">
              {adminLinks.map(({ to, label }) => (
                <NavItem key={to} to={to} icon={LayoutDashboard} onNavigate={closeMobile}>{label}</NavItem>
              ))}
            </div>
          )}

          {user && (
            <div className="pt-4 mt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
export default Navbar;
