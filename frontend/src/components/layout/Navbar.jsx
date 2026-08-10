import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, ShoppingCart, Heart, User, LogOut,
  ChevronDown, GraduationCap, Bell, Award, MessageSquare, FileText, Bot, Sun, Moon
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutUser, selectUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

export function Navbar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const adminDropdownRef = useRef(null);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

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
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>Vertex<span className="text-blue-600">Portal</span></span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <NavLink to="/courses" className={({ isActive }) => isActive ? "text-blue-600 font-semibold" : "hover:text-gray-900"}>
              Browse Courses
            </NavLink>
            <NavLink to="/discussions" className={({ isActive }) => isActive ? "text-blue-600 font-semibold flex items-center gap-1" : "hover:text-gray-900 flex items-center gap-1"}>
              <MessageSquare className="w-4 h-4" /> Discussions
            </NavLink>
            <NavLink to="/ai-chat" className={({ isActive }) => isActive ? "text-blue-600 font-semibold flex items-center gap-1" : "hover:text-gray-900 flex items-center gap-1"}>
              <Bot className="w-4 h-4 text-blue-600" /> AI Tutor
            </NavLink>

            {user && user.role === 'student' && (
              <>
                <NavLink to="/student/notes" className={({ isActive }) => isActive ? "text-blue-600 font-semibold" : "hover:text-gray-900"}>
                  Notes
                </NavLink>
                <NavLink to="/student/live-classes" className={({ isActive }) => isActive ? "text-blue-600 font-semibold" : "hover:text-gray-900"}>
                  Live Classes
                </NavLink>
                <NavLink to="/student/quizzes" className={({ isActive }) => isActive ? "text-blue-600 font-semibold" : "hover:text-gray-900"}>
                  Quizzes
                </NavLink>
                <NavLink to="/student/assignments" className={({ isActive }) => isActive ? "text-blue-600 font-semibold" : "hover:text-gray-900"}>
                  Assignments
                </NavLink>
              </>
            )}

            {user && (user.role === 'instructor' || user.role === 'admin') && (
              <>
                <NavLink to="/instructor/dashboard" className={({ isActive }) => isActive ? "text-blue-600 font-semibold" : "hover:text-gray-900"}>
                  Instructor
                </NavLink>
                <NavLink to="/instructor/live-classes" className={({ isActive }) => isActive ? "text-blue-600 font-semibold" : "hover:text-gray-900"}>
                  Live Classes
                </NavLink>
                <NavLink to="/instructor/quizzes" className={({ isActive }) => isActive ? "text-blue-600 font-semibold" : "hover:text-gray-900"}>
                  Quizzes
                </NavLink>
              </>
            )}

            {user && user.role === 'admin' && (
              <div className="relative group py-4" ref={adminDropdownRef}>
                <button
                  type="button"
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className="cursor-pointer flex items-center gap-1 hover:text-gray-900 focus:outline-none"
                >
                  Admin <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <div
                  className={`absolute left-0 top-full w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 transition-all ${
                    adminDropdownOpen ? 'block' : 'hidden group-hover:block'
                  }`}
                >
                  <Link
                    to="/admin"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Admin Overview
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Manage Users
                  </Link>
                  <Link
                    to="/admin/orders"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Manage Orders
                  </Link>
                  <Link
                    to="/admin/courses"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Manage Courses
                  </Link>
                  <Link
                    to="/admin/audit"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Audit Logs
                  </Link>
                  <Link
                    to="/admin/reviews"
                    onClick={() => setAdminDropdownOpen(false)}
                    className="block px-4 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Ratings & Reviews
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-all duration-300 transform active:scale-90 cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <div className={`transition-all duration-500 transform ${darkMode ? 'rotate-180 scale-110' : 'rotate-0 scale-100'}`}>
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
              </div>
            </button>

            {user ? (
              <>
                <Link to="/notifications" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" title="Notifications">
                  <Bell className="w-5 h-5" />
                </Link>

                {user.role === 'student' && (
                  <>
                    <Link to="/cart" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" title="Cart">
                      <ShoppingCart className="w-5 h-5" />
                    </Link>
                    <Link to="/wishlist" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" title="Wishlist">
                      <Heart className="w-5 h-5" />
                    </Link>
                    <Link to="/my-learning" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" title="My Learning">
                      <BookOpen className="w-5 h-5" />
                    </Link>
                  </>
                )}

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                      {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 hidden sm:inline">{user.fullName?.split(' ')[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-bold text-gray-900">{user.fullName}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                          {user.role}
                        </span>
                      </div>

                      <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4 text-gray-400" /> Profile
                      </Link>
                      <Link to="/certificates" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">
                        <Award className="w-4 h-4 text-gray-400" /> My Certificates
                      </Link>
                      <Link to="/student/notes" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">
                        <FileText className="w-4 h-4 text-gray-400" /> Study Notes
                      </Link>

                      <div className="border-t border-gray-100 my-1" />

                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 text-left">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-xs font-semibold text-gray-700 hover:text-gray-900 px-3 py-2">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
