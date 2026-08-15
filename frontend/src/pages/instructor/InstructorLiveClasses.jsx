import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchLiveClasses,
  createLiveClass,
  cancelLiveClass,
  selectLiveClasses,
  selectLiveClassesLoading,
} from '../../store/slices/instructor/liveClassesSlice';
import {
  fetchAllCourses,
  selectCourses,
} from '../../store/slices/coursesSlice';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Video, Plus, Calendar, Clock, ExternalLink, XCircle, RefreshCw, BookOpen, Ban, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  courseId: '', title: '', description: '',
  provider: 'google_meet', meetingUrl: '', startsAt: '', endsAt: '',
};

export default function InstructorLiveClasses() {
  const dispatch    = useAppDispatch();
  const navigate    = useNavigate();
  const liveClasses = useAppSelector(selectLiveClasses);
  const loading     = useAppSelector(selectLiveClassesLoading);
  const courses     = useAppSelector(selectCourses);

  // UI state
  const [statusFilter, setStatusFilter]       = useState('all');
  const [modalOpen, setModalOpen]             = useState(false);
  const [form, setForm]                       = useState(EMPTY_FORM);
  const [saving, setSaving]                   = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedClass, setSelectedClass]     = useState(null);
  const [cancelReason, setCancelReason]       = useState('');
  const [canceling, setCanceling]             = useState(false);

  useEffect(() => {
    dispatch(fetchLiveClasses());
    dispatch(fetchAllCourses());
  }, [dispatch]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, courseId: courses[0]?._id || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.meetingUrl) { toast.error('Meeting URL is required'); return; }
    if (!form.startsAt || !form.endsAt) { toast.error('Start and end time are required'); return; }
    if (new Date(form.endsAt) <= new Date(form.startsAt)) { toast.error('End time must be after start time'); return; }

    setSaving(true);
    const res = await dispatch(createLiveClass(form));
    setSaving(false);
    if (createLiveClass.fulfilled.match(res)) {
      toast.success('Live class created & email notifications dispatched to enrolled students!');
      setModalOpen(false);
      dispatch(fetchLiveClasses());
    } else {
      toast.error(typeof res.payload === 'string' ? res.payload : res.payload?.message || 'Failed to create live class');
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) { toast.error('Cancellation reason is required'); return; }
    setCanceling(true);
    const res = await dispatch(cancelLiveClass({ id: selectedClass._id, data: { reason: cancelReason } }));
    setCanceling(false);
    if (cancelLiveClass.fulfilled.match(res)) {
      toast.success('Live class cancelled successfully');
      setCancelModalOpen(false);
      dispatch(fetchLiveClasses());
    } else {
      toast.error(typeof res.payload === 'string' ? res.payload : res.payload?.message || 'Failed to cancel live class');
    }
  };

  const getClassTimingStatus = (item) => {
    const now = Date.now();
    const start = item.startsAt ? new Date(item.startsAt).getTime() : 0;
    const end = item.endsAt ? new Date(item.endsAt).getTime() : 0;

    if (item.status === 'cancelled') return 'cancelled';
    if (item.status === 'completed' || item.status === 'ended' || (end > 0 && now > end)) return 'ended';
    if (start > 0 && now >= start && now <= end) return 'live';
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
                <Video className="w-7 h-7 text-purple-600" /> Manage Live Classes
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Schedule interactive sessions & send automated email notifications to enrolled students.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => dispatch(fetchLiveClasses())}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 transition cursor-pointer"
              title="Refresh List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={openCreate}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-md shadow-purple-950/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Schedule Live Class
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-28" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-full w-16" />
                </div>
                <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-4/5" />
                <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-3/5" />
                <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full pt-4" />
              </div>
            ))}
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map(item => {
              const timingStatus = getClassTimingStatus(item);
              const courseTitle = item.course?.title || courses.find(c => c._id === item.course)?.title || 'Course';

              return (
                <div
                  key={item._id}
                  className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold px-2.5 py-1 rounded-full truncate max-w-[70%] border border-purple-200 dark:border-purple-800/60">
                        <BookOpen className="w-3 h-3 shrink-0" /> <span className="truncate">{courseTitle}</span>
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
                        <span>Starts: {item.startsAt ? new Date(item.startsAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>Ends: {item.endsAt ? new Date(item.endsAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-gray-100 dark:border-slate-800">
                    {timingStatus === 'live' && (
                      <a
                        href={item.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-950/20 transition cursor-pointer"
                      >
                        <Video className="w-4 h-4" /> 🔴 Join Live Session <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {timingStatus === 'scheduled' && (
                      <div className="flex items-center gap-2">
                        <a
                          href={item.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Join Meeting
                        </a>
                        <button
                          onClick={() => { setSelectedClass(item); setCancelReason(''); setCancelModalOpen(true); }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold px-3 py-2.5 rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                          title="Cancel Class"
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </button>
                      </div>
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
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No live classes found</h3>
            <p className="text-xs text-gray-400 mt-1">Schedule a live class to connect with enrolled learners in real-time.</p>
            <button
              onClick={openCreate}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 mt-4 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Schedule First Live Class
            </button>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title="Schedule Live Class">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Course *
            </label>
            <select
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={form.courseId}
              onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
              required
            >
              <option value="">Select Course</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Q&A Session — System Design Basics"
              required
              minLength={3}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={2}
              placeholder="Topic agenda or pre-requisites..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Provider
              </label>
              <select
                className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.provider}
                onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}
              >
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="livekit">LiveKit</option>
                <option value="custom">Custom URL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Meeting URL *
              </label>
              <input
                type="url"
                className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://meet.google.com/..."
                value={form.meetingUrl}
                onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Start Time *
              </label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.startsAt}
                onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                End Time *
              </label>
              <input
                type="datetime-local"
                className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.endsAt}
                onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-purple-950/20 transition cursor-pointer disabled:opacity-50"
              disabled={saving}
            >
              {saving ? <><Spinner size="sm" /> Scheduling…</> : 'Schedule Live Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => !canceling && setCancelModalOpen(false)} title={`Cancel: ${selectedClass?.title}`}>
        <form onSubmit={handleCancel} className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Please enter a reason for canceling this session.</p>
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Reason *
            </label>
            <textarea
              className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="e.g. Instructor emergency / Rescheduled to tomorrow..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-950/20 transition cursor-pointer disabled:opacity-50"
            disabled={canceling}
          >
            {canceling ? <><Spinner size="sm" /> Canceling…</> : 'Confirm Cancellation'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
