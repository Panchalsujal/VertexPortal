import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchInstructorAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  selectInstructorAssignments,
  selectInstructorAssignmentsLoading,
} from '../../store/slices/instructor/assignmentsSlice';
import {
  fetchAllCourses,
  selectCourses,
} from '../../store/slices/coursesSlice';
import {
  getAssignmentSubmissions,
  gradeSubmission,
} from '../../api/instructor.api';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { FileText, Plus, Edit3, Trash2, CheckSquare, Calendar, Award, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { title: '', courseId: '', description: '', dueAt: '', maxMarks: 100 };

export default function InstructorAssignments() {
  const dispatch  = useAppDispatch();
  const assignments = useAppSelector(selectInstructorAssignments);
  const loading     = useAppSelector(selectInstructorAssignmentsLoading);
  const courses     = useAppSelector(selectCourses);

  // UI-only state
  const [deletingIds, setDeletingIds]             = useState(new Set());
  const [asgModalOpen, setAsgModalOpen]           = useState(false);
  const [activeAsg, setActiveAsg]                 = useState(null);
  const [asgForm, setAsgForm]                     = useState(EMPTY_FORM);
  const [formSaving, setFormSaving]               = useState(false);
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [selectedAsg, setSelectedAsg]             = useState(null);
  const [submissions, setSubmissions]             = useState([]);
  const [subLoading, setSubLoading]               = useState(false);
  const [gradingId, setGradingId]                 = useState(null);
  const [gradeData, setGradeData]                 = useState({ grade: 0, feedback: '' });

  useEffect(() => {
    dispatch(fetchInstructorAssignments());
    dispatch(fetchAllCourses());
  }, [dispatch]);

  // ── Create / Update ──────────────────────────────────────────────────────
  const openCreate = () => { setActiveAsg(null); setAsgForm(EMPTY_FORM); setAsgModalOpen(true); };
  const openEdit   = (asg) => {
    setActiveAsg(asg);
    setAsgForm({
      title:       asg.title,
      courseId:    asg.course?._id || asg.course || '',
      description: asg.description || '',
      dueAt:       asg.dueAt ? asg.dueAt.slice(0, 16) : '',
      maxMarks:    asg.totalMarks || asg.maxMarks || 100,
    });
    setAsgModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!asgForm.title.trim() || !asgForm.courseId) {
      toast.error('Title and course are required');
      return;
    }
    if (!asgForm.dueAt) { toast.error('Due date is required'); return; }
    setFormSaving(true);
    try {
      const payload = {
        title:       asgForm.title.trim(),
        courseId:    asgForm.courseId,
        description: asgForm.description.trim(),
        dueAt:       new Date(asgForm.dueAt).toISOString(),
        totalMarks:  Number(asgForm.maxMarks),
      };
      if (activeAsg) {
        const res = await dispatch(updateAssignment({ id: activeAsg._id, payload }));
        if (updateAssignment.fulfilled.match(res)) { toast.success('Assignment updated!'); setAsgModalOpen(false); }
        else { toast.error(res.payload || 'Update failed'); }
      } else {
        const res = await dispatch(createAssignment(payload));
        if (createAssignment.fulfilled.match(res)) { toast.success('Assignment created!'); setAsgModalOpen(false); }
        else { toast.error(res.payload || 'Create failed'); }
      }
    } finally {
      setFormSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    setDeletingIds(prev => new Set([...prev, id]));
    const res = await dispatch(deleteAssignment(id));
    setDeletingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (deleteAssignment.fulfilled.match(res)) toast.success('Assignment deleted');
    else toast.error(res.payload || 'Delete failed');
  };

  // ── Submissions ──────────────────────────────────────────────────────────
  const openSubmissions = async (asg) => {
    setSelectedAsg(asg);
    setSubmissionsModalOpen(true);
    setSubLoading(true);
    try {
      const res = await getAssignmentSubmissions(asg._id);
      const list = res.data.submissions || res.data.data?.submissions || res.data.data || [];
      setSubmissions(Array.isArray(list) ? list : []);
    } catch { toast.error('Failed to load submissions'); }
    finally { setSubLoading(false); }
  };

  const handleGrade = async (submissionId) => {
    try {
      await gradeSubmission(selectedAsg._id, submissionId, {
        marksAwarded: Number(gradeData.grade),
        feedback:     gradeData.feedback,
      });
      toast.success('Graded!');
      setGradingId(null);
      openSubmissions(selectedAsg);
    } catch (err) { toast.error(err.message || 'Grade failed'); }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <FileText size={28} color="var(--color-primary-light)" /> Assignments
            </h1>
            <p>Create and manage assignments for your students</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate} id="create-assignment-btn">
            <Plus size={18} /> New Assignment
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Spinner /></div>
        ) : assignments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.map(asg => (
              <div key={asg._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{asg.course?.title || 'No course'}</span>
                    <span className={`badge ${asg.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {asg.status || 'draft'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{asg.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{asg.description}</p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Due: {asg.dueAt ? new Date(asg.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}
                    </span>
                    <span><Award size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Max Marks: {asg.totalMarks || asg.maxMarks || 100}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openSubmissions(asg)}>
                    <CheckSquare size={16} /> Submissions
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(asg)}>
                    <Edit3 size={16} /> Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(asg._id)}
                    disabled={deletingIds.has(asg._id)}
                  >
                    {deletingIds.has(asg._id) ? <Spinner size={14} /> : <Trash2 size={16} />} Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={48} /></div>
            <h3>No assignments yet</h3>
            <p>Create your first assignment to engage students with coursework.</p>
            <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> Create Assignment</button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={asgModalOpen} onClose={() => setAsgModalOpen(false)} title={activeAsg ? 'Edit Assignment' : 'New Assignment'}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input className="input-field" placeholder="Assignment title" value={asgForm.title} onChange={e => setAsgForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="input-group">
            <label className="input-label">Course *</label>
            <select className="input-field" value={asgForm.courseId} onChange={e => setAsgForm(f => ({ ...f, courseId: e.target.value }))} required>
              <option value="">Select course…</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input-field" rows={3} placeholder="Assignment instructions…" value={asgForm.description} onChange={e => setAsgForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Due Date *</label>
              <input type="datetime-local" className="input-field" value={asgForm.dueAt} onChange={e => setAsgForm(f => ({ ...f, dueAt: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label className="input-label">Max Marks</label>
              <input type="number" className="input-field" min={1} value={asgForm.maxMarks} onChange={e => setAsgForm(f => ({ ...f, maxMarks: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={formSaving} style={{ justifyContent: 'center' }}>
            {formSaving ? <Spinner size={16} /> : (activeAsg ? 'Save Changes' : 'Create Assignment')}
          </button>
        </form>
      </Modal>

      {/* Submissions Modal */}
      <Modal isOpen={submissionsModalOpen} onClose={() => setSubmissionsModalOpen(false)} title={`Submissions: ${selectedAsg?.title}`}>
        {subLoading ? <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div> : (
          submissions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {submissions.map(sub => (
                <div key={sub._id} className="glass-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong>{sub.student?.fullName || sub.student?.email || 'Student'}</strong>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Submitted: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                        {' · '} Status: <span className={`badge ${sub.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>{sub.status}</span>
                        {sub.marksAwarded !== undefined && ` · Marks: ${sub.marksAwarded}`}
                      </div>
                    </div>
                    {sub.status !== 'graded' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setGradingId(sub._id); setGradeData({ grade: 0, feedback: '' }); }}>
                        <Award size={14} /> Grade
                      </button>
                    )}
                  </div>
                  {gradingId === sub._id && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input type="number" className="input-field" placeholder={`Marks (max ${selectedAsg?.totalMarks || 100})`} min={0} max={selectedAsg?.totalMarks || 100} value={gradeData.grade} onChange={e => setGradeData(d => ({ ...d, grade: e.target.value }))} />
                      <textarea className="input-field" rows={2} placeholder="Feedback…" value={gradeData.feedback} onChange={e => setGradeData(d => ({ ...d, feedback: e.target.value }))} />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleGrade(sub._id)}><BookOpen size={14} /> Submit Grade</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setGradingId(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No submissions yet</p>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
