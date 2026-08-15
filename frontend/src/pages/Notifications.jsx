import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  restoreNotification,
} from '../api/notification.api';
import { Spinner } from '../components/ui/Spinner';
import {
  Bell, Check, CheckCheck, Trash2, Settings, AlertCircle,
  Info, CheckCircle, ArrowLeft, Archive, Mail, Smartphone,
  Megaphone, BookOpen, Award, Video, Shield, RefreshCw,
  ExternalLink, Sparkles, Inbox, Clock, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

const NOTIFICATION_CATEGORIES = [
  { key: 'announcement', label: 'Course Announcements', desc: 'New announcements and updates from instructors', icon: Megaphone, color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'assignment', label: 'New Assignments', desc: 'When new assignments or homework are published', icon: BookOpen, color: '#3b82f6', bg: '#eff6ff' },
  { key: 'assignment_graded', label: 'Graded Assignments', desc: 'When your assignment submissions are evaluated', icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
  { key: 'quiz', label: 'Quizzes & Tests', desc: 'Upcoming quiz dates, deadlines, and requirements', icon: Award, color: '#f59e0b', bg: '#fffbeb' },
  { key: 'quiz_result', label: 'Quiz Results', desc: 'Score breakdowns and feedback on completed quizzes', icon: Award, color: '#f59e0b', bg: '#fffbeb' },
  { key: 'live_class', label: 'Live Classes', desc: 'Reminders for scheduled live sessions and webinars', icon: Video, color: '#ec4899', bg: '#fdf2f8' },
  { key: 'certificate', label: 'Certificates', desc: 'Course completion and certificate issuances', icon: Award, color: '#14b8a6', bg: '#f0fdfa' },
  { key: 'system', label: 'System & Security', desc: 'Important account, billing, and platform notices', icon: Shield, color: '#64748b', bg: '#f8fafc' },
];

export default function Notifications() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const loading = useAppSelector(selectNotifLoading);

  const [activeTab, setActiveTab] = useState('all'); // all, unread, archived, preferences
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [preferences, setPreferences] = useState({ email: {}, inApp: {} });
  const [prefLoading, setPrefLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

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

  const loadCurrentNotifications = () => {
    if (activeTab === 'preferences') {
      fetchPreferences();
    } else {
      const params = {};
      if (activeTab === 'unread') params.status = 'unread';
      if (activeTab === 'archived') params.status = 'archived';
      if (activeTab === 'all') params.status = 'all';
      if (selectedTypeFilter !== 'all') params.type = selectedTypeFilter;
      dispatch(fetchNotifications(params));
    }
  };

  useEffect(() => {
    loadCurrentNotifications();
  }, [activeTab, selectedTypeFilter, dispatch]);

  const handleMarkRead = async (id, e) => {
    e?.stopPropagation();
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
      toast.success('All notifications marked as read');
    } else {
      toast.error('Failed to mark all as read');
    }
  };

  const handleArchive = async (id, e) => {
    e?.stopPropagation();
    const res = await dispatch(archiveOne(id));
    if (archiveOne.fulfilled.match(res)) {
      toast.success('Notification archived');
    } else {
      toast.error('Failed to archive');
    }
  };

  const handleRestore = async (id, e) => {
    e?.stopPropagation();
    try {
      await restoreNotification(id);
      toast.success('Notification unarchived');
      loadCurrentNotifications();
    } catch {
      toast.error('Failed to unarchive notification');
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    const res = await dispatch(deleteOne(id));
    if (deleteOne.fulfilled.match(res)) {
      toast.success('Notification removed');
    } else {
      toast.error('Failed to delete notification');
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

    setSavingPrefs(true);
    try {
      await updateNotificationPreferences(payload);
    } catch (err) {
      toast.error(err.message || 'Failed to update preference');
    } finally {
      setTimeout(() => setSavingPrefs(false), 500);
    }
  };

  const getCategoryInfo = (type) => {
    const matched = NOTIFICATION_CATEGORIES.find(c => c.key === type);
    return matched || {
      label: 'Notification',
      icon: Bell,
      color: '#8b5cf6',
      bg: '#f5f3ff',
    };
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition shrink-0 cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white shadow-sm">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Stay updated on course announcements, quizzes, grades, assignments, and platform events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {unreadCount > 0 && activeTab !== 'preferences' && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2.5 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            )}
            <button
              onClick={loadCurrentNotifications}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
              title="Refresh notifications"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-1.5 mb-6 shadow-sm flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            All
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'unread'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            Unread
            {unreadCount > 0 && (
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'unread' ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'archived'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Archive className="w-4 h-4" />
            Archived
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            Preferences
          </button>
        </div>

        {/* Category Filters (when on All or Unread tabs) */}
        {activeTab !== 'preferences' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition shrink-0 cursor-pointer ${
                selectedTypeFilter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
              }`}
            >
              All Types
            </button>
            {NOTIFICATION_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedTypeFilter(cat.key)}
                className={`px-3.5 py-1.5 rounded-full font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedTypeFilter === cat.key
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Tab 1: Preferences View */}
        {activeTab === 'preferences' ? (
          prefLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Notification Preferences
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Choose how and where you receive notifications across email and in-app alerts
                  </p>
                </div>
                {savingPrefs && (
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 animate-pulse">
                    <Check className="w-3.5 h-3.5" /> Saving preferences...
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-3">Notification Category</th>
                      <th className="pb-3 text-center w-28">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <Mail className="w-4 h-4 text-purple-600" />
                          <span>Email</span>
                        </div>
                      </th>
                      <th className="pb-3 text-center w-28">
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <Smartphone className="w-4 h-4 text-purple-600" />
                          <span>In-App</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/80">
                    {NOTIFICATION_CATEGORIES.map(item => {
                      const emailVal = preferences.email?.[item.key] ?? true;
                      const inAppVal = preferences.inApp?.[item.key] ?? true;
                      const Icon = item.icon;

                      return (
                        <tr key={item.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                          <td className="py-4 pr-4">
                            <div className="flex items-start gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                style={{ backgroundColor: item.bg, color: item.color }}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {item.label}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email Toggle */}
                          <td className="py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!emailVal}
                                onChange={e => handleTogglePref('email', item.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </td>

                          {/* In-App Toggle */}
                          <td className="py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!inAppVal}
                                onChange={e => handleTogglePref('inApp', item.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
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
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(item => {
              const cat = getCategoryInfo(item.type);
              const Icon = cat.icon;
              const isUnread = !item.isRead;

              return (
                <div
                  key={item._id}
                  onClick={() => {
                    if (isUnread) handleMarkRead(item._id);
                    if (item.actionUrl) navigate(item.actionUrl);
                  }}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border p-5 shadow-sm transition flex items-start justify-between gap-4 cursor-pointer group ${
                    isUnread
                      ? 'border-purple-200 dark:border-purple-900/60 bg-gradient-to-r from-purple-50/40 to-white dark:from-purple-950/20 dark:to-gray-900 hover:border-purple-300'
                      : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                      style={{ backgroundColor: cat.bg, color: cat.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {cat.label}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                        )}
                        <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto sm:ml-0">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <h3 className={`text-sm font-bold text-gray-900 dark:text-white leading-snug ${isUnread ? 'font-extrabold' : 'font-semibold'}`}>
                        {item.title || 'Notification'}
                      </h3>

                      {item.message && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed whitespace-pre-line line-clamp-3">
                          {item.message}
                        </p>
                      )}

                      {item.actionUrl && (
                        <div className="mt-2.5">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:underline">
                            View details
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkRead(item._id, e)}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    {activeTab === 'archived' ? (
                      <button
                        type="button"
                        onClick={(e) => handleRestore(item._id, e)}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                        title="Restore to Inbox"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleArchive(item._id, e)}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                        title="Archive"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDelete(item._id, e)}
                      className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-16 text-center shadow-sm max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {activeTab === 'unread'
                ? 'No unread notifications'
                : activeTab === 'archived'
                ? 'No archived notifications'
                : 'All caught up!'}
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              {activeTab === 'unread'
                ? 'You have read all your notifications. Great job!'
                : activeTab === 'archived'
                ? 'Notifications you archive will appear here for future reference.'
                : 'When new course updates, quizzes, announcements, or grades arrive, they will show up here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
