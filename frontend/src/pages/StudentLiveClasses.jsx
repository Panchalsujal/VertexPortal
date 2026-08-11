import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchStudentLiveClasses,
  selectStudentLiveClasses,
  selectStudentLiveClassesLoading,
} from '../store/slices/student/studentLiveClassesSlice';
import { joinLiveClass } from '../api/student.api';
import { Spinner } from '../components/ui/Spinner';
import { Video, Calendar, Clock, ExternalLink, BookOpen, CheckCircle2, Ban, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentLiveClasses() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const liveClasses = useAppSelector(selectStudentLiveClasses);
  const loading = useAppSelector(selectStudentLiveClassesLoading);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchStudentLiveClasses());
  }, [dispatch]);

  const handleJoin = async (item) => {
    try {
      const res = await joinLiveClass(item._id);
      const data = res.data.data || res.data;
      const meetingUrl = data.joinUrl || data.meetingLink || item.meetingUrl;
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

  const filteredClasses = liveClasses.filter(item => {
    if (statusFilter === 'all') return true;
    return getClassTimingStatus(item) === statusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-[Inter,sans-serif] pb-16">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 py-6 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
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
              Join live lectures, Q&A sessions, and workshops for your enrolled courses.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-gray-200 dark:border-slate-800 pb-3">
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'live', label: '🔴 Live Now' },
            { id: 'ended', label: 'Ended' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(tab => (
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
          <div className="py-20 text-center"><Spinner /></div>
        ) : filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map(item => {
              const timingStatus = getClassTimingStatus(item);

              return (
                <div
                  key={item._id}
                  className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold px-2.5 py-1 rounded-full truncate max-w-[70%] border border-purple-200 dark:border-purple-800/60">
                        <BookOpen className="w-3 h-3 shrink-0" /> <span className="truncate">{item.course?.title || 'Live Class'}</span>
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
                        <span>Starts: {new Date(item.scheduledAt || item.startsAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>Duration: {item.duration || item.durationInMinutes || 60} mins</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-gray-100 dark:border-slate-800">
                    {timingStatus === 'live' && (
                      <button
                        onClick={() => handleJoin(item)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-950/20 transition cursor-pointer"
                      >
                        <Video className="w-4 h-4" /> 🔴 Join Live Class Now <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {timingStatus === 'scheduled' && (
                      <button
                        onClick={() => handleJoin(item)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Join Session <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {timingStatus === 'ended' && (
                      <button
                        disabled
                        className="w-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 font-semibold text-xs py-2.5 rounded-xl cursor-not-allowed border border-gray-200/50 dark:border-slate-700/50"
                      >
                        Session Ended
                      </button>
                    )}

                    {timingStatus === 'cancelled' && (
                      <button
                        disabled
                        className="w-full bg-rose-50/60 dark:bg-rose-950/30 text-rose-400 dark:text-rose-500 font-semibold text-xs py-2.5 rounded-xl cursor-not-allowed border border-rose-200/50 dark:border-rose-900/50"
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
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-12 text-center">
            <Video className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No upcoming live classes</h3>
            <p className="text-xs text-gray-400 mt-1">Scheduled live sessions will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}
