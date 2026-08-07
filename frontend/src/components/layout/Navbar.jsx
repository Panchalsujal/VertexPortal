import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen, ShoppingCart, Heart, User, LogOut, Settings,
  LayoutDashboard, ChevronDown, Menu, X, GraduationCap, Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">
            <GraduationCap size={20} color="white" />
          </div>
          <span className="gradient-text">Vertex</span>
        </Link>

        {/* Nav Links */}
        <ul className="navbar-nav">
          <li><NavLink to="/courses">Browse Courses</NavLink></li>
          {user && (user.role === 'instructor' || user.role === 'admin') && (
            <li><NavLink to="/instructor/dashboard">Instructor</NavLink></li>
          )}
          {user && user.role === 'admin' && (
            <li><NavLink to="/admin">Admin</NavLink></li>
          )}
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              {/* Cart */}
              {user.role === 'student' && (
                <Link to="/cart" className="navbar-icon-btn" title="Cart">
                  <ShoppingCart size={18} />
                </Link>
              )}
              {/* Wishlist */}
              {user.role === 'student' && (
                <Link to="/wishlist" className="navbar-icon-btn" title="Wishlist">
                  <Heart size={18} />
                </Link>
              )}
              {/* My Learning */}
              {user.role === 'student' && (
                <Link to="/my-learning" className="navbar-icon-btn" title="My Learning">
                  <BookOpen size={18} />
                </Link>
              )}

              {/* User Dropdown */}
              <div className="navbar-user-menu" ref={dropdownRef}>
                <button
                  className="navbar-avatar-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  id="navbar-user-btn"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="avatar"
                    style={{ width: 30, height: 30 }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.fullName.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} style={{ opacity: 0.6, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                </button>

                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{user.fullName}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</p>
                      <span className="badge badge-primary" style={{ marginTop: 6 }}>{user.role}</span>
                    </div>

                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <User size={16} /> Profile
                    </Link>

                    {user.role === 'student' && (
                      <Link to="/my-learning" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <BookOpen size={16} /> My Learning
                      </Link>
                    )}

                    {(user.role === 'instructor' || user.role === 'admin') && (
                      <Link to="/instructor/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <Shield size={16} /> Admin Panel
                      </Link>
                    )}

                    <div className="dropdown-separator" />

                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className="navbar-icon-btn"
            style={{ display: 'none' }}
            onClick={() => setMenuOpen(!menuOpen)}
            id="navbar-mobile-btn"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
