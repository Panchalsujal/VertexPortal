import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  Users, Video, Clock, TrendingUp, Search, RefreshCw, CheckCircle2, XCircle,
  Calendar, BookOpen, Download, ExternalLink, Filter, UserCheck, ShieldCheck,
  User, BarChart3, AlertCircle, PlayCircle, ChevronRight
} from 'lucide-react';
import { Spinner, SkeletonTable, SkeletonFeed } from '../../components/ui/Spinner';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Empty from '../../components/ui/Empty';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminLiveAttendance() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Mobile View Navigation Tab ('sessions' | 'attendance')
  const [mobileView, setMobileView] = useState('sessions');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'live' | 'scheduled' | 'ended' | 'cancelled'
  const [studentSearch, setStudentSearch] = useState('');
  const [attStatusFilter, setAttStatusFilter] = useState('all'); // 'all' | 'present' | 'absent'

  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/live-classes', { params: { limit: 100 } });
      const list =
        res.data.liveClasses ||
        res.data.data?.liveClasses ||
        res.data.data ||
        [];
      const classArray = Array.isArray(list) ? list : [];
      setLiveClasses(classArray);

      // Auto-select first class if available
      if (classArray.length > 0) {
        setSelectedClass(prev => {
          if (prev) {
            const updated = classArray.find(c => c._id === prev._id);
            return updated || classArray[0];
          }
          return classArray[0];
        });
      }
    } catch (err) {
      toast.error('Failed to load live classes');
      setLiveClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (liveClassId) => {
    setAttendanceLoading(true);
    setAttendance([]);
    setAnalytics(null);
    try {
      // 1. Fetch attendance list
      let res;
      try {
        res = await api.get(`/admin/live-classes/${liveClassId}/attendance`);
      } catch {
        res = await api.get(`/instructor/live-classes/${liveClassId}/attendance`);
      }

      const list =
        res.data.attendance ||
        res.data.attendees ||
        res.data.data?.attendance ||
        res.data.data?.attendees ||
        res.data.data ||
        [];
      setAttendance(Array.isArray(list) ? list : []);

      // 2. Fetch attendance analytics (optional)
      try {
        let analyticsRes;
        try {
          analyticsRes = await api.get(`/admin/live-classes/${liveClassId}/attendance/analytics`);
        } catch {
          analyticsRes = await api.get(`/instructor/live-classes/${liveClassId}/attendance/analytics`);
        }
        setAnalytics(analyticsRes.data.analytics || analyticsRes.data.data || null);
      } catch {
        setAnalytics(null);
      }
    } catch (err) {
      toast.error('Failed to load attendance records');
      setAttendance([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  useEffect(() => {
    if (selectedClass?._id) {
      fetchAttendance(selectedClass._id);
    }
  }, [selectedClass?._id]);

  const handleClassClick = (liveClass) => {
    setSelectedClass(liveClass);
    setStudentSearch('');
    setAttStatusFilter('all');
    setMobileView('attendance'); // Switch to attendance log tab on mobile
  };

  // Helper date extractors (handles startsAt / scheduledStartAt / actualStartAt / createdAt)
  const getStartTime = (item) => item?.startsAt || item?.scheduledStartAt || item?.actualStartAt || item?.createdAt;
  const getEndTime = (item) => item?.endsAt || item?.scheduledEndAt || item?.actualEndAt || item?.createdAt;

  const formatDateTime = (dateVal) => {
    if (!dateVal) return 'N/A';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimingStatus = (item) => {
    if (!item) return 'scheduled';
    if (item.status === 'cancelled') return 'cancelled';
    if (item.status === 'completed') return 'ended';
    if (item.status === 'live') return 'live';

    const now = Date.now();
    const start = getStartTime(item) ? new Date(getStartTime(item)).getTime() : 0;
    const end = getEndTime(item) ? new Date(getEndTime(item)).getTime() : 0;

    if (start > 0 && now >= start && (end === 0 || now <= end)) return 'live';
    if (end > 0 && now > end) return 'ended';
    return 'scheduled';
  };

  const getStudentJoinTime = (att) => att?.firstJoinedAt || att?.lastJoinedAt || att?.joinedAt || att?.createdAt;
  const getDurationMinutes = (att) => att?.totalDurationInSeconds ? Math.round(att.totalDurationInSeconds / 60) : (att?.durationMinutes || 0);
  const isStudentPresent = (att) => Boolean(att?.isPresent || att?.status === 'present' || att?.status === 'completed' || att?.status === 'left');

  const filteredClasses = liveClasses.filter(lc => {
    const matchesSearch =
      !search ||
      lc.title?.toLowerCase().includes(search.toLowerCase()) ||
      lc.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
      lc.instructor?.fullName?.toLowerCase().includes(search.toLowerCase());

    const timingStatus = getTimingStatus(lc);
    const matchesStatus = statusFilter === 'all' || timingStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredAttendance = attendance.filter(att => {
    const studentName = att.student?.fullName || att.studentName || '';
    const studentEmail = att.student?.email || att.studentEmail || '';
    const matchesSearch =
      !studentSearch ||
      studentName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      studentEmail.toLowerCase().includes(studentSearch.toLowerCase());

    const present = isStudentPresent(att);
    const matchesStatus =
      attStatusFilter === 'all' ||
      (attStatusFilter === 'present' && present) ||
      (attStatusFilter === 'absent' && !present);

    return matchesSearch && matchesStatus;
  });

  // Export attendance to CSV
  const handleExportCSV = () => {
    if (!selectedClass || attendance.length === 0) {
      toast.error('No attendance records to export');
      return;
    }

    const headers = ['Student Name', 'Email', 'First Joined At', 'Last Left At', 'Duration (Minutes)', 'Status'];
    const rows = attendance.map(att => [
      `"${att.student?.fullName || att.studentName || 'Student'}"`,
      `"${att.student?.email || att.studentEmail || ''}"`,
      `"${getStudentJoinTime(att) ? new Date(getStudentJoinTime(att)).toLocaleString('en-IN') : '-'}"`,
      `"${att.lastLeftAt ? new Date(att.lastLeftAt).toLocaleString('en-IN') : '-'}"`,
      `"${getDurationMinutes(att)}"`,
      `"${isStudentPresent(att) ? 'Present' : 'Absent'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${(selectedClass.title || 'LiveClass').replace(/[^a-z0-9]/gi, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance CSV downloaded successfully');
  };

  const statusColors = {
    live: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
    scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ended: 'bg-gray-100 text-gray-600 border-gray-200',
    cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
  };

  const statusLabels = {
    live: '🔴 Live Now',
    scheduled: 'Scheduled',
    ended: 'Ended',
    cancelled: 'Cancelled',
  };

  const liveCount = liveClasses.filter(lc => getTimingStatus(lc) === 'live').length;
  const scheduledCount = liveClasses.filter(lc => getTimingStatus(lc) === 'scheduled').length;
  const endedCount = liveClasses.filter(lc => getTimingStatus(lc) === 'ended').length;
  const totalAttended = liveClasses.reduce((acc, lc) => acc + (lc.attendanceCount || 0), 0);

  return (
    <AdminLayout
      title="Live Classes & Attendance Control"
      subtitle="Monitor real-time live streams, track student attendance logs, and audit class metrics."
      actions={
        <button
          type="button"
          onClick={fetchLiveClasses}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      }
    >
      {/* Platform Level Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Total Sessions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{liveClasses.length}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Live Now</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{liveCount}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Scheduled</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{scheduledCount}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Attendance Logs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{totalAttended}</p>
        </div>
      </div>

      {/* Mobile Switcher Tab Bar (Visible only on screens below lg) */}
      <div className="flex lg:hidden items-center p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl mb-4">
        <button
          type="button"
          onClick={() => setMobileView('sessions')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold text-center transition ${
            mobileView === 'sessions'
              ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          📹 Sessions ({filteredClasses.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileView('attendance')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold text-center transition flex items-center justify-center gap-1.5 ${
            mobileView === 'attendance'
              ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          👥 Attendance Log
          {attendance.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              {attendance.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left Column: Live Class Sessions List */}
        <div className={`lg:col-span-2 flex flex-col gap-3 sm:gap-4 ${mobileView === 'attendance' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Search & Filter Bar */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search live sessions or course..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full border border-slate-200 dark:border-white/10 rounded-md pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#181818] text-gray-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            {/* Timing Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: `All (${liveClasses.length})` },
                { id: 'live', label: `🔴 Live (${liveCount})` },
                { id: 'scheduled', label: `Scheduled (${scheduledCount})` },
                { id: 'ended', label: `Ended (${endedCount})` },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStatusFilter(t.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    statusFilter === t.id
                      ? 'bg-slate-100 dark:bg-[#202020] text-gray-900 dark:text-white border-slate-200 dark:border-white/10 shadow-sm'
                      : 'bg-white dark:bg-[#181818] text-slate-500 dark:text-neutral-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {filteredClasses.length} Live Session{filteredClasses.length !== 1 ? 's' : ''}
            </p>
          </div>

          {loading ? (
            <SkeletonFeed count={4} />
          ) : filteredClasses.length > 0 ? (
            <div className="space-y-2 overflow-y-auto max-h-[55vh] lg:max-h-[62vh] pr-1 scrollbar-thin">
              {filteredClasses.map(lc => {
                const ts = getTimingStatus(lc);
                const isSelected = selectedClass?._id === lc._id;
                const startTime = getStartTime(lc);
                return (
                  <button
                    key={lc._id}
                    type="button"
                    onClick={() => handleClassClick(lc)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors cursor-pointer group mb-2 ${
                      isSelected
                        ? 'bg-slate-50 dark:bg-[#202020] border-slate-300 dark:border-white/20 shadow-sm'
                        : 'bg-white dark:bg-[#181818] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                        {lc.title}
                      </h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusColors[ts]}`}>
                          {statusLabels[ts]}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 lg:hidden" />
                      </div>
                    </div>

                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1.5 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 shrink-0" />
                      <span className="truncate">{lc.course?.title || 'Course'}</span>
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800/60">
                      <span className="flex items-center gap-1 truncate">
                        <Calendar className="w-3 h-3 text-purple-500 shrink-0" />
                        <span className="truncate">{formatDateTime(startTime)}</span>
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                        <Users className="w-3 h-3 text-purple-500" />
                        {lc.attendanceCount || 0} Attended
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <Empty
              icon={Video}
              title="No sessions found"
              description="No live class sessions match your current filter criteria."
            />
          )}
        </div>

        {/* Right Column: Attendance Records & Session Analytics */}
        <div className={`lg:col-span-3 ${mobileView === 'sessions' ? 'hidden lg:block' : 'block'}`}>
          {selectedClass ? (
            <div className="bg-white dark:bg-[#181818] rounded-lg border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col h-full">
              {/* Session Header Card */}
              <div className="p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#202020]">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        {selectedClass.title}
                      </h3>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${statusColors[getTimingStatus(selectedClass)]}`}>
                        {statusLabels[getTimingStatus(selectedClass)]}
                      </span>
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span className="truncate">{selectedClass.course?.title || 'Course Session'}</span>
                    </p>
                  </div>

                  {/* Actions: Export & Open Session Room */}
                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      disabled={attendance.length === 0}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 text-slate-700 dark:text-neutral-300 text-xs font-semibold transition cursor-pointer shadow-sm"
                      title="Download attendance sheet"
                    >
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>

                    <a
                      href={`/live-class/${selectedClass._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition no-underline cursor-pointer shadow-sm"
                      title="Open Live Class Room"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Join Room
                    </a>
                  </div>
                </div>

                {/* Timing & Details Meta */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <strong className="text-gray-900 dark:text-white">Starts:</strong> {formatDateTime(getStartTime(selectedClass))}
                  </span>
                  <span className="flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <strong className="text-gray-900 dark:text-white">Ends:</strong> {formatDateTime(getEndTime(selectedClass))}
                  </span>
                  {selectedClass.instructor && (
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-slate-400" />
                      <strong className="text-gray-900 dark:text-white">Instructor:</strong> {selectedClass.instructor.fullName || selectedClass.instructor.name || 'Assigned Instructor'}
                    </span>
                  )}
                </div>

                {/* Session Specific Quick Metrics */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-2">
                  <div className="bg-white dark:bg-[#181818] rounded-md p-3 border border-slate-200 dark:border-white/10 shadow-sm text-center">
                    <span className="text-xs text-slate-500 dark:text-neutral-400 uppercase font-semibold block truncate">Total Attendees</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white mt-1 block tabular-nums">
                      {analytics?.summary?.totalJoinedStudents ?? analytics?.totalAttendees ?? attendance.filter(a => isStudentPresent(a)).length}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#181818] rounded-md p-3 border border-slate-200 dark:border-white/10 shadow-sm text-center">
                    <span className="text-xs text-slate-500 dark:text-neutral-400 uppercase font-semibold block truncate">Avg Stay Time</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-white mt-1 block tabular-nums">
                      {analytics?.summary?.averageDurationInSeconds
                        ? `${Math.round(analytics.summary.averageDurationInSeconds / 60)}m`
                        : analytics?.avgDurationMinutes
                        ? `${Math.round(analytics.avgDurationMinutes)}m`
                        : attendance.filter(a => isStudentPresent(a)).length > 0
                        ? `${Math.round(attendance.filter(a => isStudentPresent(a)).reduce((acc, a) => acc + getDurationMinutes(a), 0) / attendance.filter(a => isStudentPresent(a)).length)}m`
                        : '0m'}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#181818] rounded-md p-3 border border-slate-200 dark:border-white/10 shadow-sm text-center">
                    <span className="text-xs text-slate-500 dark:text-neutral-400 uppercase font-semibold block truncate">Status</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase mt-2.5 block truncate">
                      {getTimingStatus(selectedClass)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Filter & Table Header */}
              <div className="p-5 flex-1 flex flex-col min-h-0 bg-white dark:bg-[#181818]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-400" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Student Attendance Logs ({filteredAttendance.length})
                    </h4>
                  </div>

                  <div className="flex items-center gap-0 border border-slate-200 dark:border-white/10 rounded-md shadow-sm divide-x divide-slate-200 dark:divide-white/10 bg-white dark:bg-[#181818]">
                    {/* Student Search */}
                    <div className="relative flex-1 sm:w-48">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filter student..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full text-xs border-none bg-transparent rounded-l-md pl-9 pr-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-0 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Attendance Status Filter */}
                    <select
                      value={attStatusFilter}
                      onChange={(e) => setAttStatusFilter(e.target.value)}
                      className="text-xs border-none bg-transparent rounded-none px-3 py-2 text-slate-700 dark:text-neutral-300 focus:outline-none focus:ring-0 appearance-none cursor-pointer sm:w-32"
                    >
                      <option value="all">All Status</option>
                      <option value="present">Present Only</option>
                      <option value="absent">Absent Only</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => fetchAttendance(selectedClass._id)}
                      className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-neutral-300 transition-colors cursor-pointer rounded-r-md"
                      title="Refresh attendance"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {attendanceLoading ? (
                  <SkeletonTable rows={5} cols={4} />
                ) : filteredAttendance.length > 0 ? (
                  <div className="border border-slate-200 dark:border-white/10 rounded-md overflow-hidden bg-white dark:bg-[#181818] shadow-sm">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-[#202020] border-b border-slate-200 dark:border-white/10">
                        <TableRow>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Student Name</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Joined Time</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Active Duration</TableHead>
                          <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5">Attendance Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredAttendance.map((att, idx) => {
                          const present = isStudentPresent(att);
                          const durMinutes = getDurationMinutes(att);
                          const joinTime = getStudentJoinTime(att);

                          return (
                            <TableRow key={att._id || `att-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-white/5 border-0">
                              <TableCell className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#202020] text-slate-700 dark:text-neutral-300 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10">
                                    {(att.student?.fullName || att.studentName || 'S')?.[0]?.toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {att.student?.fullName || att.studentName || 'Student'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">
                                      {att.student?.email || att.studentEmail || ''}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-neutral-300 tabular-nums whitespace-nowrap">
                                {joinTime
                                  ? new Date(joinTime).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' })
                                  : '-'}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-neutral-300 whitespace-nowrap">
                                {durMinutes > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {durMinutes} mins
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3 whitespace-nowrap">
                                {present ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                                    <span className="w-2 h-2 rounded-full bg-red-500" /> Absent
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <Empty
                    icon={Users}
                    title="No attendance records found"
                    description={
                      studentSearch || attStatusFilter !== 'all'
                        ? 'Try clearing the search or status filter.'
                        : 'Attendance records are logged automatically when students join this live session.'
                    }
                  />
                )}
              </div>
            </div>
          ) : (
            <Empty
              icon={Video}
              title="Select a Live Session"
              description="Click any live session from the left panel to view attendee logs, join times, active durations, and export reports."
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
