import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchInstructorAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  selectInstructorAnnouncements,
  selectInstructorAnnouncementsLoading,
} from '../../store/slices/instructor/announcementsSlice';
import {
  fetchAllCourses,
  selectCourses,
} from '../../store/slices/coursesSlice';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Megaphone, Plus, Edit3, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { title: '', courseId: '', content: '' };

export default function InstructorAnnouncements() {
  const dispatch = useAppDispatch();
  const announcements = useAppSelector(selectInstructorAnnouncements);
  const loading = useAppSelector(selectInstructorAnnouncementsLoading);
  const courses = useAppSelector(selectCourses);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeAnn, setActiveAnn] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchInstructorAnnouncements());
    dispatch(fetchAllCourses());
  }, [dispatch]);

  const openCreate = () => {
    setActiveAnn(null);
    setForm({ title: '', courseId: courses[0]?._id || '', content: '' });
    setModalOpen(true);
  };

  const openEdit = (ann) => {
    setActiveAnn(ann);
    setForm({
      title: ann.title || '',
      courseId: ann.course?._id || ann.course || '',
      content: ann.content || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.courseId || !form.content.trim()) {
      toast.error('All fields are required');
      return;
    }
    setSaving(true);
    if (activeAnn) {
      const res = await dispatch(updateAnnouncement({ id: activeAnn._id, payload: form }));
      setSaving(false);
      if (updateAnnouncement.fulfilled.match(res)) {
        toast.success('Announcement updated');
        setModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to update announcement');
      }
    } else {
      const res = await dispatch(createAnnouncement(form));
      setSaving(false);
      if (createAnnouncement.fulfilled.match(res)) {
        toast.success('Announcement created & sent to enrolled students!');
        setModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to create announcement');
      }
    }
  };

  const toggleStatus = async (ann) => {
    const nextStatus = ann.status === 'published' ? 'draft' : 'published';
    const res = await dispatch(updateAnnouncementStatus({ id: ann._id, status: nextStatus }));
    if (updateAnnouncementStatus.fulfilled.match(res)) {
      toast.success(`Announcement ${nextStatus}`);
    } else {
      toast.error('Failed to change status');
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Megaphone size={28} color="var(--color-primary-light)" /> Manage Announcements
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Publish updates and send email notifications to students enrolled in your courses
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} /> New Announcement
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Spinner /></div>
        ) : announcements.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {announcements.map(ann => {
              const courseTitle = ann.course?.title || courses.find(c => c._id === ann.course)?.title || 'Course';
              return (
                <div key={ann._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{courseTitle}</span>
                      <span className={`badge ${ann.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                        {ann.status || 'published'}
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{ann.title}</h3>
                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{ann.content}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(ann)}>
                      <CheckCircle size={14} /> {ann.status === 'published' ? 'Unpublish' : 'Publish'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(ann)}>
                      <Edit3 size={14} /> Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Megaphone size={48} /></div>
            <h3>No announcements created</h3>
            <p>Publish an announcement to notify enrolled students of important updates.</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>
              <Plus size={16} /> Create Announcement
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => !saving && setModalOpen(false)} title={activeAnn ? 'Edit Announcement' : 'New Announcement'}>
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
            <input
              type="text" className="input-field"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Schedule Change for Module 3" required minLength={3}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Content *</label>
            <textarea
              className="input-field" rows={5}
              placeholder="Announcement details..."
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={saving}>
            {saving ? <><Spinner size={16} /> Saving…</> : (activeAnn ? 'Save Changes' : 'Publish Announcement')}
          </button>
        </form>
      </Modal>
    </div>
  );
}
