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
import { Spinner, SkeletonFeed, SkeletonTable } from '../components/ui/Spinner';
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

// Intelligent URL resolver for notification redirection
function getNotificationUrl(item) {
  if (item.actionUrl && item.actionUrl.trim() && item.actionUrl !== '#') {
    let url = item.actionUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const parsed = new URL(url);
        url = parsed.pathname + parsed.search;
      } catch {}
    }
    return url;
  }

  const type = (item.type || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const msg = (item.message || '').toLowerCase();

  if (type === 'certificate' || title.includes('certificate') || msg.includes('certificate')) {
    return '/certificates';
  }
  if (type === 'live_class' || title.includes('live class') || title.includes('live session') || msg.includes('live class')) {
    if (item.resourceId) return `/live-class/${item.resourceId}`;
    return '/student/live-classes';
  }
  if (type === 'quiz' || type === 'quiz_result' || title.includes('quiz') || title.includes('test') || msg.includes('quiz')) {
    return '/student/quizzes';
  }
  if (type === 'assignment' || type === 'assignment_graded' || type === 'assignment_returned' || title.includes('assignment') || msg.includes('assignment')) {
    return '/student/assignments';
  }
  if (type === 'announcement' || title.includes('announcement') || msg.includes('announcement')) {
    return '/student/announcements';
  }
  if (type === 'discussion' || type === 'discussion_reply' || type === 'answer_accepted' || title.includes('discussion') || title.includes('replied') || msg.includes('replied')) {
    return '/discussions';
  }
  if (item.courseId) {
    return `/learn/${item.courseId}`;
  }
  return '/dashboard';
}

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
      setSavingPrefs(false);
    }
  };

  const getCategoryInfo = (typeKey) => {
    return NOTIFICATION_CATEGORIES.find(c => c.key === typeKey) || {
      key: typeKey || 'system',
      label: 'Notification',
      desc: 'Platform notification',
      icon: Bell,
      color: '#6366f1',
      bg: '#eef2ff',
    };
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const d = new Date(dateStr);
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-[#0b0f17] font-[Inter,sans-serif] py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Bar */}
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => {
                  if (window.history.length > 1 && window.history.state?.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition cursor-pointer shrink-0"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 sm:gap-2 truncate">
                  <span>Notifications</span>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" />
                </h1>
                <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate sm:whitespace-normal">
                  Stay updated on course announcements, quizzes, assignments, and live classes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={loadCurrentNotifications}
                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {unreadCount > 0 && activeTab !== 'preferences' && (
                <button
                  onClick={handleMarkAllRead}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Mark all read button */}
          {unreadCount > 0 && activeTab !== 'preferences' && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex sm:hidden justify-end">
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read ({unreadCount})</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-gray-900 p-1 sm:p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 min-w-[70px] sm:min-w-[90px] py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>All</span>
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 min-w-[80px] sm:min-w-[90px] py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'unread'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'unread' ? 'bg-white text-purple-600' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 min-w-[80px] sm:min-w-[90px] py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'archived'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Archived</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 min-w-[90px] sm:min-w-[100px] py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'preferences'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Category Filters */}
        {activeTab !== 'preferences' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 cursor-pointer text-xs ${
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
                className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer text-xs ${
                  selectedTypeFilter === cat.key
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === 'preferences' ? (
          /* Preferences Panel */
          prefLoading ? (
            <SkeletonTable rows={5} cols={3} />
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 sm:p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Notification Channels & Delivery</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Choose how and when you want to receive alerts across channels
                  </p>
                </div>
                {savingPrefs && (
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 animate-pulse">
                    <Check className="w-3.5 h-3.5" /> Saving...
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3">Category</th>
                      <th className="pb-3 text-center">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> Email
                        </span>
                      </th>
                      <th className="pb-3 text-center">
                        <span className="inline-flex items-center gap-1">
                          <Smartphone className="w-3.5 h-3.5" /> In-App
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                    {NOTIFICATION_CATEGORIES.map(item => {
                      const emailVal = preferences.email?.[item.key] ?? true;
                      const inAppVal = preferences.inApp?.[item.key] ?? true;

                      return (
                        <tr key={item.key} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: item.bg, color: item.color }}
                              >
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{item.label}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.desc}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!emailVal}
                                onChange={e => handleTogglePref('email', item.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </td>

                          <td className="py-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!inAppVal}
                                onChange={e => handleTogglePref('inApp', item.key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
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
          <SkeletonFeed count={5} />
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(item => {
              const cat = getCategoryInfo(item.type);
              const Icon = cat.icon;
              const isUnread = !item.isRead;
              const targetUrl = getNotificationUrl(item);

              return (
                <div
                  key={item._id}
                  onClick={() => {
                    if (isUnread) handleMarkRead(item._id);
                    navigate(targetUrl);
                  }}
                  className={`bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition flex items-start gap-3 sm:gap-4 cursor-pointer group relative ${
                    isUnread
                      ? 'border-purple-200 dark:border-purple-900/60 bg-gradient-to-r from-purple-50/40 to-white dark:from-purple-950/20 dark:to-gray-900'
                      : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-800/40'
                  }`}
                >
                  <div
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-xs mt-0.5"
                    style={{ backgroundColor: cat.bg, color: cat.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0 pr-1 sm:pr-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 truncate">
                          {cat.label}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                        )}
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 shrink-0 ml-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkRead(item._id, e)}
                            className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {activeTab === 'archived' ? (
                          <button
                            type="button"
                            onClick={(e) => handleRestore(item._id, e)}
                            className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                            title="Restore"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleArchive(item._id, e)}
                            className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title="Archive"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDelete(item._id, e)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className={`text-xs sm:text-sm text-gray-900 dark:text-white leading-snug mt-1 ${isUnread ? 'font-black' : 'font-bold'}`}>
                      {item.title || 'Notification'}
                    </h3>

                    {item.message && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed whitespace-pre-line line-clamp-3">
                        {item.message}
                      </p>
                    )}

                    <div className="mt-2">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isUnread) handleMarkRead(item._id);
                          navigate(targetUrl);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline cursor-pointer"
                      >
                        View details
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
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
