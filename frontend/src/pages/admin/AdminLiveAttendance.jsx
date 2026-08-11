import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Users, Video, Clock, TrendingUp, Search, RefreshCw, CheckCircle2, XCircle, Calendar, BookOpen } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import api from '../../api/axios';

export default function AdminLiveAttendance() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/live-classes', { params: { limit: 50 } });
      const list =
        res.data.liveClasses ||
        res.data.data?.liveClasses ||
        res.data.data ||
        [];
      setLiveClasses(Array.isArray(list) ? list : []);
    } catch {
      setLiveClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (liveClassId) => {
    setAttendanceLoading(true);
    setAttendance([]);
    try {
      // Try instructor attendance endpoint
      const res = await api.get(`/instructor/live-classes/${liveClassId}/attendance`);
      const list =
        res.data.attendees ||
        res.data.data?.attendees ||
        res.data.attendance ||
        res.data.data ||
        [];
      setAttendance(Array.isArray(list) ? list : []);
    } catch {
      setAttendance([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const handleClassClick = (liveClass) => {
    setSelectedClass(liveClass);
    fetchAttendance(liveClass._id);
  };

  const getTimingStatus = (item) => {
    const now = Date.now();
    const start = item.startsAt ? new Date(item.startsAt).getTime() : 0;
    const end = item.endsAt ? new Date(item.endsAt).getTime() : 0;
    if (item.status === 'cancelled') return 'cancelled';
    if (item.status === 'completed' || (end > 0 && now > end)) return 'ended';
    if (start > 0 && now >= start && (end === 0 || now <= end)) return 'live';
    return 'scheduled';
  };

  const filtered = liveClasses.filter(lc =>
    !search ||
    lc.title?.toLowerCase().includes(search.toLowerCase()) ||
    lc.course?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    live: 'bg-red-100 text-red-700 border-red-200',
    scheduled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ended: 'bg-gray-100 text-gray-500 border-gray-200',
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
  const totalAttended = liveClasses.reduce((acc, lc) => acc + (lc.attendeeCount || 0), 0);

  return (
    <AdminLayout
      title="Live Attendance"
      subtitle="Monitor live class sessions and student attendance in real-time"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sessions', value: liveClasses.length, icon: Video, color: '#6C5CE7', bg: '#ede9fe' },
          { label: 'Live Now', value: liveCount, icon: TrendingUp, color: '#ef4444', bg: '#fee2e2' },
          { label: 'Scheduled', value: scheduledCount, icon: Calendar, color: '#10b981', bg: '#d1fae5' },
          { label: 'Total Attendees', value: totalAttended, icon: Users, color: '#f59e0b', bg: '#fef3c7' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Sessions list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {filtered.length} Session{filtered.length !== 1 ? 's' : ''}
            </p>
            <button onClick={fetchLiveClasses} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : filtered.length > 0 ? (
            <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1">
              {filtered.map(lc => {
                const ts = getTimingStatus(lc);
                const isSelected = selectedClass?._id === lc._id;
                return (
                  <button
                    key={lc._id}
                    onClick={() => handleClassClick(lc)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700'
                        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-purple-200 hover:bg-purple-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {lc.title}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusColors[ts]}`}>
                        {statusLabels[ts]}
                      </span>
                    </div>
                    <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {lc.course?.title || 'Course'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {lc.startsAt ? new Date(lc.startsAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {lc.attendeeCount || 0} attended
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Video className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
              <p className="text-sm font-medium">No sessions found</p>
            </div>
          )}
        </div>

        {/* Right: Attendance detail */}
        <div className="lg:col-span-3">
          {selectedClass ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              {/* Session header */}
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedClass.title}</h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                      {selectedClass.course?.title || 'Course'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusColors[getTimingStatus(selectedClass)]}`}>
                    {statusLabels[getTimingStatus(selectedClass)]}
                  </span>
                </div>
                <div className="flex gap-4 mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {selectedClass.startsAt ? new Date(selectedClass.startsAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedClass.endsAt ? new Date(selectedClass.endsAt).toLocaleString('en-IN', { timeStyle: 'short' }) : 'N/A'} ends
                  </span>
                </div>
              </div>

              {/* Attendance list */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" /> Attendance Records
                  </p>
                  <button
                    onClick={() => fetchAttendance(selectedClass._id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition"
                    title="Refresh attendance"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {attendanceLoading ? (
                  <div className="flex justify-center py-10"><Spinner /></div>
                ) : attendance.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/60 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <th className="px-4 py-2.5">Student</th>
                          <th className="px-4 py-2.5">Joined At</th>
                          <th className="px-4 py-2.5">Duration</th>
                          <th className="px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {attendance.map((att) => (
                          <tr key={att._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                            <td className="px-4 py-3">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                {att.student?.fullName || att.studentName || 'Student'}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {att.student?.email || att.studentEmail || ''}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                              {att.joinedAt ? new Date(att.joinedAt).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'short' }) : '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                              {att.totalDurationInSeconds
                                ? `${Math.round(att.totalDurationInSeconds / 60)} min`
                                : att.durationMinutes
                                  ? `${att.durationMinutes} min`
                                  : '-'}
                            </td>
                            <td className="px-4 py-3">
                              {att.status === 'present' || att.attended ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" /> Present
                                </span>
                              ) : att.status === 'absent' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                                  <XCircle className="w-3 h-3" /> Absent
                                </span>
                              ) : (
                                <span className="text-[11px] text-gray-400">{att.status || '-'}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-200 dark:text-gray-700" />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No attendance records yet</p>
                    <p className="text-xs mt-1">Records appear when students join this session.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-16 text-center shadow-sm h-full flex flex-col items-center justify-center">
              <Video className="w-14 h-14 text-gray-200 dark:text-gray-700 mb-4" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Select a Session</h3>
              <p className="text-sm text-gray-400 mt-1 max-w-xs">
                Click on a live class session from the left panel to view attendance details.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
