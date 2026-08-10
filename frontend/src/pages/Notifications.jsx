import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchNotifications,
  markOneRead,
  markAllRead,
  archiveOne,
  deleteOne,
  selectNotifications,
  selectUnreadCount,
  selectNotifLoading,
} from '../store/slices/notificationsSlice';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../api/notification.api';
import { Spinner } from '../components/ui/Spinner';
import { Bell, CheckCheck, Archive, Trash2, Settings, Mail, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const NOTIFICATION_TYPES = [
  { key: 'announcement', label: 'Course Announcements' },
  { key: 'assignment', label: 'New Assignments' },
  { key: 'assignment_graded', label: 'Graded Assignments' },
  { key: 'quiz', label: 'Quizzes & Tests' },
  { key: 'quiz_result', label: 'Quiz Results' },
  { key: 'live_class', label: 'Live Classes' },
  { key: 'certificate', label: 'Certificates' },
  { key: 'system', label: 'System Alerts' },
];

export default function Notifications() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const loading = useAppSelector(selectNotifLoading);

  const [activeTab, setActiveTab] = useState('all'); // all, unread, archived, preferences
  const [preferences, setPreferences] = useState({ email: {}, inApp: {} });
  const [prefLoading, setPrefLoading] = useState(false);

  const fetchPreferences = async () => {
    setPrefLoading(true);
    try {
      const res = await getNotificationPreferences();
      const prefs = res.data.preferences || res.data.data?.preferences || {};
      setPreferences({
        email: prefs.email || {},
        inApp: prefs.inApp || {},
      });
    } catch {
      toast.error('Failed to load notification preferences');
    } finally {
      setPrefLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'preferences') {
      fetchPreferences();
    } else {
      dispatch(fetchNotifications({ status: activeTab === 'all' ? undefined : activeTab }));
    }
  }, [activeTab, dispatch]);

  const handleMarkRead = async (id) => {
    const res = await dispatch(markOneRead(id));
    if (markOneRead.fulfilled.match(res)) {
      toast.success('Marked as read');
    } else {
      toast.error('Failed to mark read');
    }
  };

  const handleMarkAllRead = async () => {
    const res = await dispatch(markAllRead());
    if (markAllRead.fulfilled.match(res)) {
      toast.success('All marked as read');
    } else {
      toast.error('Failed to mark all as read');
    }
  };

  const handleArchive = async (id) => {
    const res = await dispatch(archiveOne(id));
    if (archiveOne.fulfilled.match(res)) {
      toast.success('Notification archived');
    } else {
      toast.error('Failed to archive');
    }
  };

  const handleDelete = async (id) => {
    const res = await dispatch(deleteOne(id));
    if (deleteOne.fulfilled.match(res)) {
      toast.success('Notification deleted');
    } else {
      toast.error('Failed to delete');
    }
  };

  const handleTogglePref = async (channel, typeKey, value) => {
    const updatedChannel = { ...(preferences[channel] || {}), [typeKey]: value };
    const payload = {
      [channel]: updatedChannel,
    };

    setPreferences(prev => ({
      ...prev,
      [channel]: updatedChannel,
    }));

    try {
      await updateNotificationPreferences(payload);
      toast.success('Preference updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update preference');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Bell size={28} color="var(--color-primary-light)" /> Notifications
            </h1>
            <p>Stay updated on course announcements, quizzes, grades, and live classes</p>
          </div>
          {unreadCount > 0 && activeTab !== 'preferences' && (
            <button className="btn btn-secondary" onClick={handleMarkAllRead}>
              <CheckCheck size={18} /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            All
          </button>
          <button className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`} onClick={() => setActiveTab('unread')}>
            Unread {unreadCount > 0 && <span className="badge badge-primary" style={{ marginLeft: 6 }}>{unreadCount}</span>}
          </button>
          <button className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => setActiveTab('archived')}>
            Archived
          </button>
          <button className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
            <Settings size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Preferences
          </button>
        </div>

        {activeTab === 'preferences' ? (
          prefLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}><Spinner /></div>
          ) : (
            <div className="glass-card" style={{ padding: '2rem', maxWidth: 750 }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Notification Preferences</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Configure which email and in-app notifications you wish to receive for each category.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '0.75rem 0', fontWeight: 600 }}>Notification Type</th>
                      <th style={{ padding: '0.75rem 0', textAlign: 'center', width: 120 }}>
                        <Mail size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Email
                      </th>
                      <th style={{ padding: '0.75rem 0', textAlign: 'center', width: 120 }}>
                        <Smartphone size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> In-App
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {NOTIFICATION_TYPES.map(item => {
                      const emailVal = preferences.email?.[item.key] ?? true;
                      const inAppVal = preferences.inApp?.[item.key] ?? true;
                      return (
                        <tr key={item.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem 0', fontWeight: 500 }}>{item.label}</td>
                          <td style={{ padding: '1rem 0', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={!!emailVal}
                              onChange={e => handleTogglePref('email', item.key, e.target.checked)}
                              style={{ width: 18, height: 18, cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '1rem 0', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={!!inAppVal}
                              onChange={e => handleTogglePref('inApp', item.key, e.target.checked)}
                              style={{ width: 18, height: 18, cursor: 'pointer' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Spinner /></div>
        ) : notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map(item => (
              <div
                key={item._id}
                className="glass-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: item.isRead ? 'var(--color-surface)' : 'rgba(99, 102, 241, 0.08)',
                  borderLeft: item.isRead ? 'none' : '4px solid var(--color-primary)',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: item.isRead ? 500 : 700, marginBottom: '0.25rem' }}>
                    {item.title || item.message}
                  </h4>
                  {item.message && item.title && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.message}</p>}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {!item.isRead && (
                    <button className="btn btn-ghost btn-sm" onClick={() => handleMarkRead(item._id)} title="Mark as read">
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => handleArchive(item._id)} title="Archive">
                    <Archive size={16} />
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(item._id)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Bell size={48} /></div>
            <h3>No notifications</h3>
            <p>You are all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
