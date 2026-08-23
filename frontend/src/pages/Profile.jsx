import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile, updatePassword, updateAvatar } from '../api/user.api';
import { Spinner } from '../components/ui/Spinner';
import { User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (user?.fullName) {
      setProfileForm({ fullName: user.fullName });
    }
  }, [user?.fullName]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) { toast.error('Name cannot be empty'); return; }
    setProfileLoading(true);
    try {
      await updateMyProfile({ fullName: profileForm.fullName.trim() });
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    setPwLoading(true);
    try {
      await updatePassword(pwForm);
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully!');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    setAvatarLoading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await updateAvatar(fd);
      await refreshUser();
      toast.success('Avatar updated successfully!');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to update avatar');
    } finally {
      setAvatarLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 font-[Inter,sans-serif] pb-16 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
          <div className="h-64 bg-white dark:bg-neutral-900 rounded-sm border border-gray-200 dark:border-neutral-800 p-8 space-y-4" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile &amp; Security — NavGujarat Academy</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 font-[Inter,sans-serif] pb-16 pt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Profile & Security</h1>
            <p className="text-[13px] text-gray-500 dark:text-neutral-400 mt-1">
              Manage your personal information, avatar, and security credentials.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* Personal Information */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-sm shadow-none p-6 sm:p-8">
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400 dark:text-neutral-500" /> Personal Information
              </h2>
              
              {/* Avatar Section */}
              <div className="flex items-center gap-5 mb-8 pb-8 border-b border-gray-100 dark:border-neutral-800">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-sm bg-gray-100 dark:bg-neutral-800 flex items-center justify-center border border-gray-200 dark:border-neutral-700 overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-gray-400 dark:text-neutral-500">
                        {user.fullName?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  {avatarLoading && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center rounded-sm">
                      <Spinner size="sm" />
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarLoading}
                    className="text-[12px] font-semibold text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-700 px-3 py-1.5 rounded-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Change Photo
                  </button>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-500 mt-2">JPG, PNG or GIF. Max 2MB.</p>
                  <input type="file" ref={fileRef} accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 dark:text-neutral-300 mb-1.5" htmlFor="profile-name">
                    Full Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-sm px-3 py-2 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                    value={profileForm.fullName}
                    onChange={e => setProfileForm({ fullName: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-sm px-3 py-2 text-[13px] text-gray-500 dark:text-neutral-400 cursor-not-allowed"
                      value={user.email}
                      disabled
                    />
                    <p className="text-[11px] text-gray-400 dark:text-neutral-500 mt-1">Cannot be changed.</p>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 dark:text-neutral-300 mb-1.5">
                      Account Role
                    </label>
                    <div className="flex items-center gap-2 w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-sm px-3 py-2 text-[13px] text-gray-500 dark:text-neutral-400 capitalize cursor-not-allowed">
                      <span className="flex-1">{user.role}</span>
                      {user.status === 'active' || user.isActive !== false ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-[13px] font-semibold px-5 py-2 rounded-sm transition-colors disabled:opacity-50 inline-flex items-center justify-center min-w-[120px]"
                    disabled={profileLoading}
                  >
                    {profileLoading ? <Spinner size="sm" /> : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>

            {/* Security & Password */}
            <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-sm shadow-none p-6 sm:p-8">
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400 dark:text-neutral-500" /> Security & Password
              </h2>
              
              <form onSubmit={handlePasswordSave} className="space-y-5">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 dark:text-neutral-300 mb-1.5" htmlFor="old-password">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="old-password"
                      type={showOld ? 'text' : 'password'}
                      className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-sm pl-3 pr-10 py-2 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                      placeholder="Enter current password"
                      value={pwForm.oldPassword}
                      onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOld(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 dark:text-neutral-300 mb-1.5" htmlFor="new-password">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNew ? 'text' : 'password'}
                      className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-sm pl-3 pr-10 py-2 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                      placeholder="Minimum 8 characters"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 dark:text-neutral-300 mb-1.5" htmlFor="confirm-password">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-sm pl-3 pr-10 py-2 text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
                      placeholder="Re-enter new password"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-[13px] font-semibold px-5 py-2 rounded-sm transition-colors disabled:opacity-50 inline-flex items-center justify-center min-w-[150px]"
                    disabled={pwLoading}
                  >
                    {pwLoading ? <Spinner size="sm" /> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
