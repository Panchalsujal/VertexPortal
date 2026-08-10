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
import { Video, Plus, Calendar, Clock, ExternalLink, XCircle, RefreshCw, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  courseId: '', title: '', description: '',
  provider: 'google_meet', meetingUrl: '', startsAt: '', endsAt: '',
};

export default function InstructorLiveClasses() {
  const dispatch    = useAppDispatch();
  const liveClasses = useAppSelector(selectLiveClasses);
  const loading     = useAppSelector(selectLiveClassesLoading);
  const courses     = useAppSelector(selectCourses);

  // UI-only state
  const [modalOpen, setModalOpen]           = useState(false);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedClass, setSelectedClass]   = useState(null);
  const [cancelReason, setCancelReason]     = useState('');
  const [canceling, setCanceling]           = useState(false);

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
      toast.success('Live class created & notification sent to enrolled students!');
      setModalOpen(false);
    } else {
      toast.error(res.payload || 'Failed to create live class');
    }
  };

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) { toast.error('Cancellation reason is required'); return; }
    setCanceling(true);
    const res = await dispatch(cancelLiveClass({ id: selectedClass._id, data: { reason: cancelReason } }));
    setCanceling(false);
    if (cancelLiveClass.fulfilled.match(res)) {
      toast.success('Live class cancelled');
      setCancelModalOpen(false);
    } else {
      toast.error(res.payload || 'Failed to cancel live class');
    }
  };

  const getStatusBadge = (item) => {
    const status = item.timingStatus || item.status;
    if (status === 'live')      return { label: '🔴 LIVE NOW', color: 'var(--color-error)' };
    if (status === 'cancelled') return { label: 'Cancelled', color: 'var(--text-muted)' };
    if (status === 'completed' || status === 'ended') return { label: 'Ended', color: 'var(--text-muted)' };
    return { label: 'Scheduled', color: 'var(--color-success)' };
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Video size={28} color="var(--color-primary-light)" /> Manage Live Classes
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Schedule interactive sessions & send automated email notifications to enrolled students
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => dispatch(fetchLiveClasses())} title="Refresh">
              <RefreshCw size={15} />
            </button>
            <button className="btn btn-primary" onClick={openCreate}>
              <Plus size={18} /> Schedule Live Class
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Spinner /></div>
        ) : liveClasses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {liveClasses.map(item => {
              const badge = getStatusBadge(item);
              const courseTitle = item.course?.title || courses.find(c => c._id === item.course)?.title || 'Course';
              return (
                <div key={item._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        <BookOpen size={10} style={{ marginRight: 3 }} /> {courseTitle}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600,
                        padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)',
                        background: `${badge.color}18`, color: badge.color,
                        border: `1px solid ${badge.color}30`,
                      }}>
                        {badge.label}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: '0.375rem', lineHeight: 1.4 }}>{item.title}</h3>
                    {item.description && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.6 }}>
                        {item.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar size={13} />
                        Starts: {item.startsAt ? new Date(item.startsAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Clock size={13} />
                        Ends: {item.endsAt ? new Date(item.endsAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                    <a href={item.meetingUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      <ExternalLink size={14} /> Join Meeting
                    </a>
                    {item.status !== 'cancelled' && item.status !== 'completed' && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-error)' }}
                        onClick={() => { setSelectedClass(item); setCancelReason(''); setCancelModalOpen(true); }}
                        title="Cancel Live Class"
                      >
                        <XCircle size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Video size={48} /></div>
            <h3>No live classes scheduled</h3>
            <p>Schedule a live class to connect with enrolled learners in real-time.</p>
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={openCreate}>
              <Plus size={16} /> Schedule First Live Class
            </button>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title="Schedule Live Class">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Course *</label>
            <select className="input-field" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} required>
              <option value="">Select Course</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input type="text" className="input-field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Q&A Session — System Design Basics" required minLength={3} />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input-field" rows={2} placeholder="Topic agenda or pre-requisites..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Provider</label>
              <select className="input-field" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="livekit">LiveKit</option>
                <option value="custom">Custom URL</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Meeting URL *</label>
              <input type="url" className="input-field" placeholder="https://meet.google.com/..." value={form.meetingUrl} onChange={e => setForm(f => ({ ...f, meetingUrl: e.target.value }))} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Start Time *</label>
              <input type="datetime-local" className="input-field" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label className="input-label">End Time *</label>
              <input type="datetime-local" className="input-field" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={saving}>
            {saving ? <><Spinner size={16} /> Scheduling…</> : 'Schedule Live Class'}
          </button>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => !canceling && setCancelModalOpen(false)} title={`Cancel: ${selectedClass?.title}`}>
        <form onSubmit={handleCancel} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Please enter a reason for canceling this session.</p>
          <div className="input-group">
            <label className="input-label">Reason *</label>
            <textarea className="input-field" rows={3} placeholder="e.g. Instructor emergency / Rescheduled to tomorrow..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)', justifyContent: 'center' }} disabled={canceling}>
            {canceling ? <><Spinner size={16} /> Canceling…</> : 'Confirm Cancellation'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
