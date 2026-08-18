import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile, updatePassword, updateAvatar } from '../api/user.api';
import { Spinner } from '../components/ui/Spinner';
import { Input, Label } from '../components/ui/Input';
import { Marker } from '../components/ui/Marker';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { User, Lock, Camera, Save, Eye, EyeOff, ArrowLeft, ShieldCheck, Mail, Sparkles, CheckCircle2 } from 'lucide-react';
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
  const [tab, setTab] = useState('profile');

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-[Inter,sans-serif] pb-16 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-2">
              <div className="w-48 h-6 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="w-32 h-4 rounded-md bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
          <div className="h-64 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 space-y-4" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Account Settings &amp; Profile — NavGujarat Academy</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-[Inter,sans-serif] pb-16">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-purple-900/10 via-indigo-900/10 to-slate-900/5 dark:from-purple-950/40 dark:to-slate-900 border-b border-gray-200 dark:border-slate-800 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 transition cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-3 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-purple-600" /> Account Settings
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">User Profile & Security</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your personal profile information, avatar, and security credentials.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* User Card */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-100 dark:border-purple-950/50 shadow-md bg-linear-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-extrabold">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                user.fullName?.[0]?.toUpperCase() || 'U'
              )}
            </div>

            {avatarLoading && (
              <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center">
                <Spinner size="sm" />
              </div>
            )}

            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-linear-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 hover:scale-110 transition cursor-pointer"
              id="change-avatar-btn"
              title="Change Profile Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input type="file" ref={fileRef} accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>

          <div className="text-center sm:text-left flex-1 space-y-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{user.fullName}</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-500" /> {user.email}
            </p>
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <Marker variant="purple" size="sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="uppercase">{user.role}</span>
              </Marker>
              <Marker variant="emerald" size="sm" dot>
                Active Account
              </Marker>
            </div>
          </div>
        </div>

        {/* Tab Navigation with Shadcn Tabs */}
        <div className="mb-8">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="profile" id="tab-profile">
                <User className="w-4 h-4" /> Profile Details
              </TabsTrigger>
              <TabsTrigger value="security" id="tab-security">
                <Lock className="w-4 h-4" /> Security & Password
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Profile Details Form */}
        {tab === 'profile' && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" /> Personal Information
            </h3>
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2" htmlFor="profile-name">
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  value={profileForm.fullName}
                  onChange={e => setProfileForm({ fullName: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-xl px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    value={user.email}
                    disabled
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Email address cannot be changed once registered.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Account Role
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-xl px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 capitalize cursor-not-allowed"
                    value={user.role}
                    disabled
                  />
                  <ShieldCheck className="w-4 h-4 text-purple-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md shadow-purple-950/20 transition cursor-pointer disabled:opacity-50"
                  disabled={profileLoading}
                  id="save-profile-btn"
                >
                  {profileLoading ? <Spinner size="sm" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security & Password Form */}
        {tab === 'security' && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" /> Change Security Password
            </h3>
            <form onSubmit={handlePasswordSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2" htmlFor="old-password">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="old-password"
                    type={showOld ? 'text' : 'password'}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl pl-4 pr-11 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="Enter current password"
                    value={pwForm.oldPassword}
                    onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition cursor-pointer"
                    id="toggle-old-pw"
                  >
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl pl-4 pr-11 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="Minimum 8 characters"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition cursor-pointer"
                    id="toggle-new-pw"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl pl-4 pr-11 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="Re-enter new password"
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition cursor-pointer"
                    id="toggle-confirm-pw"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md shadow-purple-950/20 transition cursor-pointer disabled:opacity-50"
                  disabled={pwLoading}
                  id="save-pw-btn"
                >
                  {pwLoading ? <Spinner size="sm" /> : <><Lock className="w-4 h-4" /> Update Password</>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  </>
);
}
