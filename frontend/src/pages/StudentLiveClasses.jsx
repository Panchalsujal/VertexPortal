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
  Video,
  Calendar,
  Clock,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  Ban,
  ArrowLeft,
  Award,
  TrendingUp,
  History,
  FileText,
  UserCheck,
  Sparkles,
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

  const formatDuration = (seconds = 0) => {
    if (!seconds || seconds <= 0) return '0 mins';
    const mins = Math.floor(seconds / 60);
    const remSecs = seconds % 60;
    if (mins === 0) return `${remSecs}s`;
    if (remSecs === 0) return `${mins} mins`;
    return `${mins}m ${remSecs}s`;
  };

  const filteredClasses = liveClasses.filter((item) => {
    if (statusFilter === 'all') return true;
    return getClassTimingStatus(item) === statusFilter;
  });

  // Calculate Attendance Stats
  const totalAttendedSessions = attendanceRecords.length;
  const totalDurationSecs = attendanceRecords.reduce(
    (acc, cur) => acc + (cur.totalDurationInSeconds || 0),
    0
  );
  const totalLearningMins = Math.round(totalDurationSecs / 60);
  const avgAttendancePct =
    totalAttendedSessions > 0
      ? Math.round(
          attendanceRecords.reduce((acc, cur) => acc + (cur.attendancePercentage || 0), 0) /
            totalAttendedSessions
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-[Inter,sans-serif] pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 py-6 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <button
                onClick={() => {
                  if (window.history.length > 1 && window.history.state?.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
                <Video className="w-7 h-7 text-purple-600" /> Live Interactive Classes
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Join live lectures, participate in Q&A discussions, and review your personal attendance records.
            </p>
          </div>

          {/* Primary View Switcher */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-inner">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" /> Live & Scheduled
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" /> My Attendance Record
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
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((item) => {
                  const timingStatus = getClassTimingStatus(item);
                  const isJoinable = timingStatus === 'live' || timingStatus === 'scheduled';
                  const courseTitle = item.course?.title || item.courseName || 'Enrolled Course';

                  return (
                    <div
                      key={item._id}
                      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div>
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold px-3 py-1 rounded-full truncate max-w-[65%] border border-purple-200 dark:border-purple-800/60">
                            <BookOpen className="w-3 h-3 shrink-0" />{' '}
                            <span className="truncate">{courseTitle}</span>
                          </span>

                          {timingStatus === 'live' && (
                            <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
                              🔴 LIVE NOW
                            </span>
                          )}
                          {timingStatus === 'scheduled' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                              Scheduled
                            </span>
                          )}
                          {timingStatus === 'ended' && (
                            <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Ended
                            </span>
                          )}
                          {timingStatus === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                              <Ban className="w-3 h-3" /> Cancelled
                            </span>
                          )}
                        </div>

                        {/* Provider tag */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 px-2.5 py-0.5 rounded-md">
                            <Video className="w-3 h-3" />
                            {item.provider === 'getstream'
                              ? 'GetStream Video'
                              : item.provider?.replace('_', ' ') || 'Google Meet'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                            {item.description}
                          </p>
                        )}

                        {/* Timing details */}
                        <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span>
                              Starts:{' '}
                              {item.startsAt || item.scheduledAt
                                ? new Date(item.startsAt || item.scheduledAt).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span>
                              Ends:{' '}
                              {item.endsAt
                                ? new Date(item.endsAt).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions Bar */}
                      <div className="mt-5 pt-3 border-t border-gray-100 dark:border-slate-800">
                        {isJoinable ? (
                          <button
                            onClick={() => handleJoin(item)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer ${
                              timingStatus === 'live'
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-950/20 animate-pulse'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            <Video className="w-4 h-4" />
                            <span>{timingStatus === 'live' ? '🔴 Join Live Class Now' : 'Enter Class Room'}</span>
                            <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                          </button>
                        ) : timingStatus === 'ended' ? (
                          <button
                            disabled
                            className="w-full bg-gray-100 dark:bg-slate-800 text-gray-400 font-semibold text-xs py-2.5 rounded-xl cursor-not-allowed text-center"
                          >
                            Session Ended
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full bg-rose-50 dark:bg-rose-950/30 text-rose-400 font-semibold text-xs py-2.5 rounded-xl cursor-not-allowed text-center"
                          >
                            Session Cancelled
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl">
                <Video className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  No live sessions available
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  There are no {statusFilter !== 'all' ? statusFilter : ''} live classes for your enrolled courses right now.
                </p>
              </div>
            )}
          </>
        )}

        {/* ===================== TAB 2: MY ATTENDANCE ===================== */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition">
                <div className="w-13 h-13 rounded-2xl bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-inner">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sessions Attended
                  </p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                    {totalAttendedSessions}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition">
                <div className="w-13 h-13 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-inner">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg Attendance Rate
                  </p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {avgAttendancePct}%
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/90 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition">
                <div className="w-13 h-13 rounded-2xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-inner">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Live Learning
                  </p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                    {totalLearningMins} <span className="text-sm font-bold text-gray-500">mins</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Records List */}
            {attendanceLoading ? (
              <SkeletonAttendanceList count={4} />
            ) : attendanceRecords.length > 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-purple-600" /> Attendance Log
                  </h3>
                  <span className="text-xs bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800/60">
                    {attendanceRecords.length} Record{attendanceRecords.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {attendanceRecords.map((record) => {
                    const lc = record.liveClass || {};
                    const course = record.course || {};
                    const formattedDuration = formatDuration(record.totalDurationInSeconds || 0);
                    const pctRaw = record.attendancePercentage || 0;
                    const pct = Math.round(pctRaw);

                    const statusStyle =
                      record.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                        : record.status === 'present'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';

                    const statusLabel =
                      record.status === 'present'
                        ? 'Attended (Active)'
                        : record.status === 'completed'
                        ? 'Completed'
                        : 'Left Early';

                    return (
                      <div
                        key={record._id}
                        className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition"
                      >
                        <div className="space-y-2 max-w-xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/60 truncate max-w-xs">
                              <BookOpen className="w-3 h-3 shrink-0" />
                              <span className="truncate">{course.title || 'Course'}</span>
                            </span>
                            <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border capitalize ${statusStyle}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <h4 className="text-base font-bold text-gray-900 dark:text-white leading-snug">
                            {lc.title || 'Live Interactive Class'}
                          </h4>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              {record.firstJoinedAt
                                ? new Date(record.firstJoinedAt).toLocaleString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              Time spent: <strong className="text-gray-800 dark:text-slate-200 font-semibold">{formattedDuration}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Attendance Progress & Percentage */}
                        <div className="flex items-center gap-4 md:text-right shrink-0">
                          <div className="w-44 sm:w-52 space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-gray-500 dark:text-gray-400">Attendance</span>
                              <span className={`text-xs font-extrabold ${pct >= 75 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 25 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                {pct}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-slate-700/80 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full transition-all ${
                                  pct >= 75
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                    : pct >= 25
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-500'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(pct > 0 ? 4 : 0, pct))}%` }}
                              />
                            </div>
                          </div>

                          {lc.notesUrl && (
                            <a
                              href={lc.notesUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:text-purple-600 hover:border-purple-300 transition shrink-0"
                              title="Download Class Notes"
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl">
                <UserCheck className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  No attendance records found
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  When you join live classes, your attendance, duration, and participation will be automatically tracked and listed here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
