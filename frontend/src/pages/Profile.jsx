import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile, updatePassword, updateAvatar } from '../api/user.api';
import { Spinner } from '../components/ui/Spinner';
import { User, Lock, Camera, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef(null);

  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || '' });
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [tab, setTab] = useState('profile');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) { toast.error('Name cannot be empty'); return; }
    setProfileLoading(true);
    try {
      await updateMyProfile({ fullName: profileForm.fullName });
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.message); }
    finally { setProfileLoading(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPassword || !pwForm.newPassword) { toast.error('Both fields are required'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    setPwLoading(true);
    try {
      await updatePassword(pwForm);
      setPwForm({ oldPassword: '', newPassword: '' });
      toast.success('Password updated!');
    } catch (err) { toast.error(err.message); }
    finally { setPwLoading(false); }
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
      toast.success('Avatar updated!');
    } catch (err) { toast.error(err.message); }
    finally { setAvatarLoading(false); }
  };

  if (!user) return <div className="page-loader"><Spinner /></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1>Account Settings</h1>
          <p>Manage your profile and security</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', maxWidth: 800 }}>
        {/* Avatar Section */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.5rem',
          padding: '1.5rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '2rem',
        }}>
          <div style={{ position: 'relative' }}>
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className="avatar"
              style={{ width: 80, height: 80 }}
            />
            {avatarLoading && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size="sm" />
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28,
                background: 'var(--gradient-primary)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '2px solid var(--color-bg)',
              }}
              id="change-avatar-btn"
              title="Change avatar"
            >
              <Camera size={13} color="white" />
            </button>
            <input type="file" ref={fileRef} accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>
          <div>
            <h3>{user.fullName}</h3>
            <p style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>{user.email}</p>
            <span className="badge badge-primary">{user.role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')} id="tab-profile">
            <User size={15} /> Profile
          </button>
          <button className={`tab-btn ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')} id="tab-security">
            <Lock size={15} /> Security
          </button>
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '2rem', maxWidth: 500 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Personal Information</h3>
            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="profile-name">Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  className="input-field"
                  value={profileForm.fullName}
                  onChange={e => setProfileForm({ fullName: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input type="email" className="input-field" value={user.email} disabled style={{ opacity: 0.6 }} />
                <span className="input-error-msg" style={{ color: 'var(--text-muted)' }}>Email cannot be changed</span>
              </div>
              <div className="input-group">
                <label className="input-label">Account Role</label>
                <input type="text" className="input-field" value={user.role} disabled style={{ opacity: 0.6, textTransform: 'capitalize' }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={profileLoading} id="save-profile-btn">
                {profileLoading ? <div className="spinner spinner-sm" /> : <><Save size={16} /> Save Changes</>}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', padding: '2rem', maxWidth: 500 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Change Password</h3>
            <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-group">
                <label className="input-label" htmlFor="old-password">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="old-password"
                    type={showOld ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Current password"
                    value={pwForm.oldPassword}
                    onChange={e => setPwForm(f => ({ ...f, oldPassword: e.target.value }))}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowOld(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none' }} id="toggle-old-pw">
                    {showOld ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="new-password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Minimum 6 characters"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowNew(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', background: 'none' }} id="toggle-new-pw">
                    {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={pwLoading} id="save-pw-btn">
                {pwLoading ? <div className="spinner spinner-sm" /> : <><Lock size={16} /> Update Password</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
