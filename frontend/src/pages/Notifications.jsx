import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  setNotificationsSnapshot
} from '../store/slices/notificationsSlice';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  restoreNotification,
} from '../api/notification.api';
import { SkeletonFeed } from '../components/ui/Spinner';
import { Switch } from '../components/ui/Switch';
import {
  CheckCheck, Trash2, Archive, Bell,
  RefreshCw, Check, RotateCcw, ChevronDown, ArrowRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const NOTIFICATION_CATEGORIES = [
  { key: 'announcement', label: 'Announcements', desc: 'New announcements and updates from instructors.' },
  { key: 'assignment', label: 'New Assignments', desc: 'When new assignments or homework are published.' },
  { key: 'assignment_graded', label: 'Graded Assignments', desc: 'When your assignment submissions are evaluated.' },
  { key: 'quiz', label: 'Quizzes & Tests', desc: 'Upcoming quiz dates, deadlines, and requirements.' },
  { key: 'quiz_result', label: 'Quiz Results', desc: 'Score breakdowns and feedback on completed quizzes.' },
  { key: 'live_class', label: 'Live Classes', desc: 'Reminders and changes for scheduled live classes.' },
  { key: 'certificate', label: 'Certificates', desc: 'Course completion and certificate issuances.' },
  { key: 'system', label: 'System & Security', desc: 'Important account, billing, and platform notices.' },
];

const PREF_GROUPS = [
  {
    title: 'COURSES',
    desc: 'Updates from your enrolled courses.',
    items: ['announcement', 'assignment', 'assignment_graded']
  },
  {
    title: 'LEARNING',
    desc: 'Live events and achievements.',
    items: ['quiz', 'quiz_result', 'live_class', 'certificate']
  },
  {
    title: 'ACCOUNT',
    desc: 'Important platform notices.',
    items: ['system']
  }
];

function getNotificationUrl(item) {
  if (item.actionUrl && item.actionUrl.trim() && item.actionUrl !== '#') {
    let url = item.actionUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const parsed = new URL(url);
        url = parsed.pathname + parsed.search;
      } catch (_err) { /* ignore */ }
    }
    return url;
  }
  const type = (item.type || '').toLowerCase();
  const title = (item.title || '').toLowerCase();
  const msg = (item.message || '').toLowerCase();

  if (type === 'certificate' || title.includes('certificate') || msg.includes('certificate')) return '/certificates';
  if (type === 'live_class' || title.includes('live class') || title.includes('live session') || msg.includes('live class')) {
    return item.resourceId ? `/live-class/${item.resourceId}` : '/student/live-classes';
  }
  if (type === 'quiz' || type === 'quiz_result' || title.includes('quiz') || title.includes('test') || msg.includes('quiz')) return '/student/quizzes';
  if (type === 'assignment' || type === 'assignment_graded' || type === 'assignment_returned' || title.includes('assignment') || msg.includes('assignment')) return '/student/assignments';
  if (type === 'announcement' || title.includes('announcement') || msg.includes('announcement')) return '/student/announcements';
  if (type === 'discussion' || type === 'discussion_reply' || type === 'answer_accepted' || title.includes('discussion') || title.includes('replied') || msg.includes('replied')) return '/discussions';
  if (item.courseId) return `/learn/${item.courseId}`;
  return '/dashboard';
}

const groupNotifications = (notifs) => {
  const groups = { today: [], yesterday: [], earlierThisWeek: [], older: [] };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  notifs.forEach(item => {
    const d = new Date(item.createdAt);
    if (d >= today) groups.today.push(item);
    else if (d >= yesterday) groups.yesterday.push(item);
    else if (d >= startOfWeek) groups.earlierThisWeek.push(item);
    else groups.older.push(item);
  });

  return [
    { label: 'Today', items: groups.today },
    { label: 'Yesterday', items: groups.yesterday },
    { label: 'Earlier this week', items: groups.earlierThisWeek },
    { label: 'Older', items: groups.older }
  ].filter(g => g.items.length > 0);
};

export default function Notifications() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const loading = useAppSelector(selectNotifLoading);

  const [activeTab, setActiveTab] = useState('all'); 
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [preferences, setPreferences] = useState({ email: {}, inApp: {} });
  const [prefLoading, setPrefLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPreferences = async () => {
    setPrefLoading(true);
    try {
      const res = await getNotificationPreferences();
      const prefs = res.data.preferences || res.data.data?.preferences || {};
      setPreferences({ email: prefs.email || {}, inApp: prefs.inApp || {} });
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
    if (markOneRead.rejected.match(res)) toast.error(res.payload?.message || 'Failed to mark read. Action rolled back.');
  };

  const handleMarkAllRead = async () => {
    const res = await dispatch(markAllRead());
    if (markAllRead.rejected.match(res)) toast.error(res.payload || 'Failed to mark all as read. Action rolled back.');
    else toast.success('All notifications marked as read');
  };

  const handleArchive = async (id, e) => {
    e?.stopPropagation();
    toast.success('Archived');
    const res = await dispatch(archiveOne(id));
    if (archiveOne.rejected.match(res)) toast.error(res.payload?.message || 'Failed to archive. Action rolled back.');
  };

  const handleRestore = async (id, e) => {
    e?.stopPropagation();
    const targetItem = notifications.find(x => x._id === id);
    if (targetItem) dispatch(setNotificationsSnapshot({ items: notifications.filter(x => x._id !== id) }));
    toast.success('Unarchived');
    try {
      await restoreNotification(id);
    } catch (err) {
      if (targetItem) dispatch(setNotificationsSnapshot({ items: notifications }));
      toast.error(err.response?.data?.message || err.message || 'Failed to unarchive. Rolled back.');
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    toast.success('Deleted');
    const res = await dispatch(deleteOne(id));
    if (deleteOne.rejected.match(res)) toast.error(res.payload?.message || 'Failed to delete. Action rolled back.');
  };

  const handleTogglePref = async (channel, typeKey, value) => {
    const updatedChannel = { ...(preferences[channel] || {}), [typeKey]: value };
    const payload = { [channel]: updatedChannel };
    setPreferences(prev => ({ ...prev, [channel]: updatedChannel }));
    try {
      await updateNotificationPreferences(payload);
    } catch (err) {
      toast.error(err.message || 'Failed to update preference');
    }
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
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const groupedNotifications = groupNotifications(notifications);

  return (
    <>
      <Helmet>
        <title>Notifications — NavGujarat Academy</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-[#fafafa] dark:bg-[#111111] font-[Inter,sans-serif] pt-8 sm:pt-12 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Notifications</h1>
              <p className="text-[14px] text-gray-500 dark:text-neutral-400 mt-1.5">Stay up to date with courses, classes and discussions.</p>
            </div>
            <div className="flex items-center gap-4">
              {unreadCount > 0 && activeTab !== 'preferences' && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  <CheckCheck className="w-4 h-4" /> Mark all as read
                </button>
              )}
              <button
                onClick={loadCurrentNotifications}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          {/* NAVIGATION BAR */}
          <div className="flex items-center gap-8 border-b border-gray-200 dark:border-neutral-800 overflow-x-auto scrollbar-none mb-8">
            {['all', 'unread', 'archived', 'preferences'].map(tabKey => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`pb-3 text-[14px] transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === tabKey 
                    ? 'font-semibold border-gray-900 text-gray-900 dark:border-white dark:text-white' 
                    : 'font-medium border-transparent text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white'
                }`}
              >
                {tabKey === 'all' && 'All'}
                {tabKey === 'unread' && 'Unread'}
                {tabKey === 'archived' && 'Archived'}
                {tabKey === 'preferences' && 'Preferences'}
                {tabKey === 'unread' && unreadCount > 0 && (
                  <span className={`text-[12px] font-medium px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'unread' 
                      ? 'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white' 
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400'
                  } ml-0.5 transition-colors`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* COMPACT CONTROL BAR */}
          {activeTab !== 'preferences' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="text-[14px] text-gray-700 dark:text-neutral-300">
                {selectedTypeFilter === 'all' 
                  ? <span className="font-medium">Show: <span className="text-gray-500 dark:text-neutral-400">All notifications</span></span>
                  : <span className="font-medium">Showing: <span className="text-gray-900 dark:text-white">{NOTIFICATION_CATEGORIES.find(c=>c.key===selectedTypeFilter)?.label}</span></span>
                }
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-gray-500 dark:text-neutral-400 font-medium">Filter by</span>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center justify-between gap-3 w-[160px] px-3 h-[36px] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-neutral-800 rounded-[4px] text-[13px] font-medium text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-all"
                  >
                    <span className="truncate">{selectedTypeFilter === 'all' ? 'All types' : NOTIFICATION_CATEGORIES.find(c=>c.key===selectedTypeFilter)?.label}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-[200px] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-neutral-800 rounded-[6px] shadow-sm py-1.5 z-50 origin-top-right animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={() => { setSelectedTypeFilter('all'); setIsDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-[13px] ${selectedTypeFilter === 'all' ? 'bg-gray-50 dark:bg-neutral-800/50 font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800/50'} transition-colors`}
                      >
                        All types
                        {selectedTypeFilter === 'all' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="h-px bg-gray-100 dark:bg-neutral-800 my-1.5 mx-3" />
                      {NOTIFICATION_CATEGORIES.map(c => (
                        <button
                          key={c.key}
                          onClick={() => { setSelectedTypeFilter(c.key); setIsDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-[13px] ${selectedTypeFilter === c.key ? 'bg-gray-50 dark:bg-neutral-800/50 font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800/50'} transition-colors`}
                        >
                          {c.label}
                          {selectedTypeFilter === c.key && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATION CONTENT */}
          <div className="min-h-[400px]">
            {activeTab === 'preferences' ? (
              <div className="max-w-3xl pb-12">
                {prefLoading ? (
                  <div className="py-8"><SkeletonFeed count={3} /></div>
                ) : (
                  <div>
                    <div className="mb-8">
                      <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white">Notification preferences</h2>
                      <p className="text-[14px] text-gray-500 dark:text-neutral-400 mt-1">Choose which updates you want to receive.</p>
                    </div>
                    {PREF_GROUPS.map(group => (
                      <div key={group.title} className="mb-12">
                        <div className="mb-4">
                          <h3 className="text-[12px] font-bold tracking-wider text-gray-500 dark:text-neutral-500 uppercase">{group.title}</h3>
                        </div>
                        <div className="border-t border-gray-200 dark:border-neutral-800">
                          {group.items.map((itemKey) => {
                            const cat = NOTIFICATION_CATEGORIES.find(c => c.key === itemKey);
                            if (!cat) return null;
                            const emailVal = preferences.email?.[cat.key] ?? true;
                            const inAppVal = preferences.inApp?.[cat.key] ?? true;
                            
                            return (
                              <div key={cat.key} className="py-5 border-b border-gray-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="pr-8">
                                  <h4 className="text-[14px] font-medium text-gray-900 dark:text-white">{cat.label}</h4>
                                </div>
                                <div className="flex items-center gap-8 shrink-0">
                                  <label className="flex items-center gap-2.5 text-[13px] font-medium text-gray-600 dark:text-neutral-400 cursor-pointer">
                                    <Switch checked={!!emailVal} onCheckedChange={checked => handleTogglePref('email', cat.key, checked)} />
                                    Email
                                  </label>
                                  <label className="flex items-center gap-2.5 text-[13px] font-medium text-gray-600 dark:text-neutral-400 cursor-pointer">
                                    <Switch checked={!!inAppVal} onCheckedChange={checked => handleTogglePref('inApp', cat.key, checked)} />
                                    In-App
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : loading ? (
              <div className="py-8"><SkeletonFeed count={4} /></div>
            ) : notifications.length > 0 ? (
              <div className="pb-16 max-w-5xl">
                {groupedNotifications.map(group => (
                  <div key={group.label} className="mb-10 last:mb-0">
                    <h3 className="text-[12px] font-bold tracking-wider text-gray-400 dark:text-neutral-500 uppercase mb-4">{group.label}</h3>
                    <div className="border-t border-gray-200 dark:border-neutral-800">
                      {group.items.map((item) => {
                        const cat = NOTIFICATION_CATEGORIES.find(c => c.key === item.type) || { label: 'System' };
                        const isUnread = !item.isRead;
                        const targetUrl = getNotificationUrl(item);

                        return (
                          <div 
                            key={item._id} 
                            onClick={() => {
                              if (isUnread) handleMarkRead(item._id);
                              navigate(targetUrl);
                            }}
                            className="group relative flex items-start py-4 sm:py-5 px-4 sm:px-6 border-b border-gray-200 dark:border-neutral-800 cursor-pointer transition-colors hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]/50"
                          >
                            {/* Structural Unread Marker */}
                            <div 
                              className="absolute left-0 top-0 bottom-0 w-[3px] bg-gray-900 dark:bg-white rounded-r-[2px] transition-opacity duration-200" 
                              style={{ opacity: isUnread ? 1 : 0 }} 
                            />

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-4 sm:pr-8">
                              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 mb-1">
                                <span className="text-[13px] font-medium text-gray-500 dark:text-neutral-400">
                                  {cat.label}
                                </span>
                                <span className="text-[12px] font-medium text-gray-400 dark:text-neutral-500 shrink-0">
                                  {formatRelativeTime(item.createdAt)}
                                </span>
                              </div>
                              
                              <h4 className={`text-[15px] leading-snug mt-1 ${isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-neutral-300'}`}>
                                {item.title}
                              </h4>
                              
                              {item.message && (
                                <p className="text-[14px] text-gray-600 dark:text-neutral-400 mt-1.5 leading-relaxed max-w-3xl">
                                  {item.message}
                                </p>
                              )}

                              {/* Mobile Actions */}
                              <div className="flex sm:hidden items-center gap-5 mt-4 pt-2 border-t border-transparent" onClick={e => e.stopPropagation()}>
                                {isUnread && (
                                  <button onClick={(e) => handleMarkRead(item._id, e)} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <Check className="w-3.5 h-3.5" /> Mark read
                                  </button>
                                )}
                                {activeTab === 'archived' ? (
                                  <button onClick={(e) => handleRestore(item._id, e)} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                                  </button>
                                ) : (
                                  <button onClick={(e) => handleArchive(item._id, e)} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    <Archive className="w-3.5 h-3.5" /> Archive
                                  </button>
                                )}
                                <button onClick={(e) => handleDelete(item._id, e)} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-red-600 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            </div>

                            {/* Desktop Actions */}
                            <div className="hidden sm:flex shrink-0 items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150" onClick={e => e.stopPropagation()}>
                              {isUnread && (
                                <button onClick={(e) => handleMarkRead(item._id, e)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-sm hover:bg-gray-100 dark:hover:bg-neutral-800" title="Mark Read">
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              {activeTab === 'archived' ? (
                                <button onClick={(e) => handleRestore(item._id, e)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-sm hover:bg-gray-100 dark:hover:bg-neutral-800" title="Restore">
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              ) : (
                                <button onClick={(e) => handleArchive(item._id, e)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-sm hover:bg-gray-100 dark:hover:bg-neutral-800" title="Archive">
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={(e) => handleDelete(item._id, e)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors rounded-sm" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-16 pb-24 text-center">
                <div className="w-10 h-10 mb-5 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-gray-300 dark:text-neutral-600" strokeWidth={2} />
                </div>
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-2">
                  No notifications yet
                </h3>
                <p className="text-[14px] text-gray-500 dark:text-neutral-400 max-w-sm mb-6 leading-relaxed">
                  When something needs your attention, you'll find it here.
                </p>
                <Link to="/courses" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
                  Explore courses <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
