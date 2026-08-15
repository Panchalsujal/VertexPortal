import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchStudentLiveClasses,
  selectStudentLiveClasses,
  selectStudentLiveClassesLoading,
} from '../store/slices/student/studentLiveClassesSlice';
import { joinLiveClass, getLiveClassAttendanceHistory } from '../api/student.api';
import { SkeletonLiveClassGrid, SkeletonAttendanceList } from '../components/ui/Spinner';
import {
  VideoIcon,
  BookOpenIcon,
  CircleCheckIcon,
  ClockIcon,
  ArrowRightIcon,
  TrendingUpIcon,
} from '@animateicons/react/lucide';
import {
  Calendar,
  ExternalLink,
  Ban,
  ArrowLeft,
  History,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentLiveClasses() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const liveClasses = useAppSelector(selectStudentLiveClasses);
  const loading = useAppSelector(selectStudentLiveClassesLoading);

  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'attendance'
  const [statusFilter, setStatusFilter] = useState('all');

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchStudentLiveClasses());
  }, [dispatch]);

  const loadAttendanceHistory = async () => {
    setAttendanceLoading(true);
    try {
      const res = await getLiveClassAttendanceHistory();
      const records =
        res.data.attendance ||
        res.data.data?.attendance ||
        res.data.data ||
        [];
      setAttendanceRecords(Array.isArray(records) ? records : []);
    } catch {
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceHistory();
    }
  }, [activeTab]);

  const handleJoin = async (item) => {
    if (item.provider === 'getstream') {
      navigate(`/live-class/stream/${item._id}`);
      return;
    }
    try {
      const res = await joinLiveClass(item._id);
      const data = res.data.data || res.data;
      const meetingUrl = data.meeting?.url || data.joinUrl || data.meetingLink || item.meetingUrl;
      if (meetingUrl) {
        window.open(meetingUrl, '_blank');
      } else {
        toast.success('Joined class!');
      }
    } catch (err) {
      if (item.meetingUrl) {
        window.open(item.meetingUrl, '_blank');
      } else {
        toast.error(typeof err === 'string' ? err : err?.message || 'Failed to join live class');
      }
    }
  };

  const getClassTimingStatus = (item) => {
    const now = Date.now();
    const start = item.startsAt || item.scheduledAt ? new Date(item.startsAt || item.scheduledAt).getTime() : 0;
    const durationMs = (item.duration || item.durationInMinutes || 60) * 60 * 1000;
    const end = item.endsAt ? new Date(item.endsAt).getTime() : (start > 0 ? start + durationMs : 0);

    if (item.status === 'cancelled') return 'cancelled';
    if (item.status === 'completed' || item.status === 'ended' || (end > 0 && now > end)) return 'ended';
    if (start > 0 && now >= start && (end === 0 || now <= end)) return 'live';
    return 'scheduled';
  };

  const filteredClasses = liveClasses.filter((c) => {
    const timing = getClassTimingStatus(c);
    if (statusFilter === 'all') return true;
    if (statusFilter === 'scheduled') return timing === 'scheduled';
    if (statusFilter === 'live') return timing === 'live';
    if (statusFilter === 'ended') return timing === 'ended';
    if (statusFilter === 'cancelled') return timing === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-[Inter,sans-serif] pb-16">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 py-5 sm:py-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-4">
          {/* Back button + Title */}
          <div>
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
              <VideoIcon size={24} color="#6C5CE7" /> Live Interactive Classes
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Join live lectures, participate in Q&amp;A discussions, and review your personal attendance records.
            </p>
          </div>

          {/* Primary View Switcher */}
          <div className="w-full sm:w-auto self-start grid grid-cols-2 sm:flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'sessions'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <VideoIcon size={14} color="currentColor" /> Live &amp; Scheduled
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Attendance Record
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ===================== TAB 1: SESSIONS ===================== */}
        {activeTab === 'sessions' && (
          <>
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 dark:border-slate-800 pb-3">
              {[
                { id: 'all', label: 'All Sessions' },
                { id: 'scheduled', label: 'Scheduled' },
                { id: 'live', label: '🔴 Live Now' },
                { id: 'ended', label: 'Ended' },
                { id: 'cancelled', label: 'Cancelled' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    statusFilter === tab.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <SkeletonLiveClassGrid count={6} />
            ) : filteredClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {filteredClasses.map((item) => {
                  const timingStatus = getClassTimingStatus(item);
                  const isJoinable = timingStatus === 'live' || timingStatus === 'scheduled';
                  const courseTitle = item.course?.title || item.courseName || 'Enrolled Course';

                  return (
                    <div
                      key={item._id}
                      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold px-2.5 py-1 rounded-full truncate max-w-[65%] border border-purple-200 dark:border-purple-800/60">
                            <BookOpenIcon size={12} color="#6C5CE7" className="shrink-0" />{' '}
                            <span className="truncate">{courseTitle}</span>
                          </span>

                          {timingStatus === 'live' && (
                            <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full animate-pulse shrink-0">
                              🔴 LIVE NOW
                            </span>
                          )}
                          {timingStatus === 'scheduled' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                              Scheduled
                            </span>
                          )}
                          {timingStatus === 'ended' && (
                            <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                              <CircleCheckIcon size={12} color="#9ca3af" /> Ended
                            </span>
                          )}
                          {timingStatus === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                              <Ban className="w-3 h-3" /> Cancelled
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug mb-1">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Schedule Meta */}
                        <div className="space-y-1.5 py-3 border-y border-gray-100 dark:border-slate-800/80 my-3 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span>
                              {new Date(item.startsAt || item.scheduledAt || Date.now()).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon size={14} color="#6C5CE7" className="shrink-0" />
                            <span>
                              {new Date(item.startsAt || item.scheduledAt || Date.now()).toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              ({item.duration || item.durationInMinutes || 60} mins)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        {isJoinable ? (
                          <button
                            type="button"
                            onClick={() => handleJoin(item)}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer shadow-sm ${
                              timingStatus === 'live'
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-600/20'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-600/20'
                            }`}
                          >
                            <VideoIcon size={14} color="#ffffff" />
                            {timingStatus === 'live' ? 'Join Live Room Now' : 'Join Classroom'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed text-center"
                          >
                            {timingStatus === 'ended' ? 'Class Concluded' : 'Class Cancelled'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8">
                <VideoIcon size={48} color="#c4b5fd" className="mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">No Live Classes Found</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  There are currently no live sessions matching this filter. Check back when your instructor schedules the next class.
                </p>
              </div>
            )}
          </>
        )}

        {/* ===================== TAB 2: ATTENDANCE HISTORY ===================== */}
        {activeTab === 'attendance' && (
          <div className="space-y-5 sm:space-y-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 shrink-0" /> Attendance Log &amp; Verification
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Detailed timestamps and durations recorded for every live class you attended.
                </p>
              </div>
              <button
                type="button"
                onClick={loadAttendanceHistory}
                className="whitespace-nowrap shrink-0 text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                Refresh Log
              </button>
            </div>

            {attendanceLoading ? (
              <SkeletonAttendanceList count={5} />
            ) : attendanceRecords.length > 0 ? (
              <>
                {/* Mobile Cards View (< md) */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {attendanceRecords.map((rec, i) => {
                    const classTitle = rec.liveClass?.title || rec.title || 'Live Lecture';
                    const courseName = rec.course?.title || rec.liveClass?.course?.title || 'Enrolled Course';
                    const joinTime = rec.joinedAt ? new Date(rec.joinedAt).toLocaleTimeString() : 'Recorded';
                    const dateStr = rec.joinedAt
                      ? new Date(rec.joinedAt).toLocaleDateString()
                      : new Date(rec.createdAt || Date.now()).toLocaleDateString();
                    const durationMins = rec.durationInMinutes || (rec.durationSeconds ? Math.round(rec.durationSeconds / 60) : 'Active');

                    return (
                      <div
                        key={rec._id || i}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{classTitle}</p>
                            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">{courseName}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            <CircleCheckIcon size={11} color="#00b894" /> Present
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-xs">
                          <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Date</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{dateStr}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Join Time</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{joinTime}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold text-gray-400 uppercase">Duration</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {typeof durationMins === 'number' ? `${durationMins} mins` : durationMins}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                      <thead className="bg-gray-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-slate-800">
                        <tr>
                          <th className="px-6 py-3.5">Session / Course</th>
                          <th className="px-6 py-3.5">Date</th>
                          <th className="px-6 py-3.5">Join Time</th>
                          <th className="px-6 py-3.5">Duration</th>
                          <th className="px-6 py-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                        {attendanceRecords.map((rec, i) => {
                          const classTitle = rec.liveClass?.title || rec.title || 'Live Lecture';
                          const courseName = rec.course?.title || rec.liveClass?.course?.title || 'Enrolled Course';
                          const joinTime = rec.joinedAt ? new Date(rec.joinedAt).toLocaleTimeString() : 'Recorded';
                          const dateStr = rec.joinedAt
                            ? new Date(rec.joinedAt).toLocaleDateString()
                            : new Date(rec.createdAt || Date.now()).toLocaleDateString();
                          const durationMins = rec.durationInMinutes || (rec.durationSeconds ? Math.round(rec.durationSeconds / 60) : 'Active');

                          return (
                            <tr key={rec._id || i} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition">
                              <td className="px-6 py-4">
                                <p className="font-bold text-gray-900 dark:text-white">{classTitle}</p>
                                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">{courseName}</p>
                              </td>
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">{dateStr}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{joinTime}</td>
                              <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                {typeof durationMins === 'number' ? `${durationMins} mins` : durationMins}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                  <CircleCheckIcon size={12} color="#00b894" /> Present
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8">
                <History className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">No Attendance Records Yet</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  When you join scheduled live sessions, your presence and duration will be automatically recorded here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
