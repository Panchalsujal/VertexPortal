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
  getAssignmentSubmission,
  gradeSubmission,
} from '../../api/instructor.api';
import { Spinner, SkeletonFeed } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import {
  FileText, Plus, Edit3, Trash2, CheckSquare, Calendar, Award,
  Paperclip, Download, ExternalLink, Link2, MessageSquare,
  ChevronDown, ChevronUp, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = { title: '', courseId: '', description: '', dueAt: '', maxMarks: 100 };

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function fileIcon(mimeType = '') {
  if (mimeType.includes('pdf'))   return '📄';
  if (mimeType.includes('image')) return '🖼️';
  if (mimeType.includes('video')) return '🎬';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '🗜️';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  return '📎';
}

/* ── Submission Card ─────────────────────────────────────────────────────── */
function SubmissionCard({ sub, maxMarks, gradingId, gradeData, setGradeData, setGradingId, onGrade, onFetchDetail }) {
  const [expanded, setExpanded]         = useState(false);
  const [detail, setDetail]             = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && !detail) {
      setLoadingDetail(true);
      try { const d = await onFetchDetail(sub._id); setDetail(d); }
      finally { setLoadingDetail(false); }
    }
    setExpanded(prev => !prev);
  };

  const src      = detail || sub;
  const files    = src.files     || [];
  const notes    = src.notes     || src.textAnswer || '';
  const linkAns  = src.linkAnswer || '';

  return (
    <div className="glass-card" style={{ padding: '1rem' }}>
      {/* Summary Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: '0.9375rem' }}>
            {sub.student?.fullName || sub.student?.email || 'Student'}
          </strong>
          {sub.student?.email && sub.student?.fullName && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              {sub.student.email}
            </span>
          )}
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span>Submitted: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
            <span>Status: <span className={`badge ${sub.status === 'graded' ? 'badge-success' : sub.status === 'returned' ? 'badge-warning' : 'badge-info'}`}>{sub.status}</span></span>
            {sub.marksAwarded != null && (
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                Marks: {sub.marksAwarded} / {sub.totalMarks ?? maxMarks}
              </span>
            )}
            {sub.attemptNumber && <span>Attempt #{sub.attemptNumber}</span>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={toggleExpand}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            {loadingDetail ? <Spinner size={12} /> : <Eye size={13} />}
            {expanded ? 'Hide' : 'View Submission'}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {sub.status !== 'graded' ? (
            <button className="btn btn-secondary btn-sm"
              onClick={() => { setGradingId(sub._id); setGradeData({ grade: sub.marksAwarded ?? 0, feedback: sub.feedback ?? '' }); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Award size={13} /> Grade
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm"
              onClick={() => { setGradingId(sub._id); setGradeData({ grade: sub.marksAwarded ?? 0, feedback: sub.feedback ?? '' }); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', opacity: 0.75 }}>
              <Edit3 size={13} /> Re-grade
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

          {/* Notes */}
          {notes && (
            <div style={{ padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                <MessageSquare size={13} color="var(--color-primary)" /> Student Notes
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{notes}</p>
            </div>
          )}

          {/* Link Answer */}
          {linkAns && (
            <div style={{ padding: '0.65rem 0.875rem', background: 'rgba(99,102,241,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link2 size={13} color="var(--color-primary)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Submission Link:</span>
              <a href={linkAns} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {linkAns} <ExternalLink size={11} />
              </a>
            </div>
          )}

          {/* Uploaded Files */}
          {files.length > 0 ? (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Paperclip size={13} color="var(--color-primary)" /> Uploaded Files ({files.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {files.map((f, i) => (
                  <a key={f._id || f.fileId || i} href={f.fileUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.875rem', background: 'var(--color-bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontSize: '0.8125rem', color: 'var(--text-primary)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{fileIcon(f.mimeType)}</span>
                    <span style={{ flex: 1, minWidth: 0, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.fileName || `File ${i + 1}`}
                    </span>
                    {f.fileSizeInBytes && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {formatBytes(f.fileSizeInBytes)}
                      </span>
                    )}
                    <Download size={13} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            !notes && !linkAns && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No files, notes, or link attached to this submission.
              </p>
            )
          )}

          {/* Existing Feedback */}
          {sub.feedback && (
            <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.3rem', color: '#10b981' }}>Your Feedback</div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{sub.feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Grading Form */}
      {gradingId === sub._id && (
        <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Grade Submission</div>
          <input type="number" className="input-field"
            placeholder={`Marks awarded (max ${maxMarks})`} min={0} max={maxMarks}
            value={gradeData.grade} onChange={e => setGradeData(d => ({ ...d, grade: e.target.value }))} />
          <textarea className="input-field" rows={3} placeholder="Feedback for student (optional)…"
            value={gradeData.feedback} onChange={e => setGradeData(d => ({ ...d, feedback: e.target.value }))} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary btn-sm" onClick={() => onGrade(sub._id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Award size={13} /> Submit Grade
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setGradingId(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function InstructorAssignments() {
  const dispatch    = useAppDispatch();
  const assignments = useAppSelector(selectInstructorAssignments);
  const loading     = useAppSelector(selectInstructorAssignmentsLoading);
  const courses     = useAppSelector(selectCourses);

  const [deletingIds, setDeletingIds]                   = useState(new Set());
  const [asgModalOpen, setAsgModalOpen]                 = useState(false);
  const [activeAsg, setActiveAsg]                       = useState(null);
  const [asgForm, setAsgForm]                           = useState(EMPTY_FORM);
  const [formSaving, setFormSaving]                     = useState(false);
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
  const [selectedAsg, setSelectedAsg]                   = useState(null);
  const [submissions, setSubmissions]                   = useState([]);
  const [subLoading, setSubLoading]                     = useState(false);
  const [gradingId, setGradingId]                       = useState(null);
  const [gradeData, setGradeData]                       = useState({ grade: 0, feedback: '' });

  useEffect(() => {
    dispatch(fetchInstructorAssignments());
    dispatch(fetchAllCourses());
  }, [dispatch]);

  const openCreate = () => { setActiveAsg(null); setAsgForm(EMPTY_FORM); setAsgModalOpen(true); };
  const openEdit   = (asg) => {
    setActiveAsg(asg);
    setAsgForm({ title: asg.title, courseId: asg.course?._id || asg.course || '', description: asg.description || '', dueAt: asg.dueAt ? asg.dueAt.slice(0, 16) : '', maxMarks: asg.totalMarks || asg.maxMarks || 100 });
    setAsgModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!asgForm.title.trim() || !asgForm.courseId) { toast.error('Title and course are required'); return; }
    if (!asgForm.dueAt) { toast.error('Due date is required'); return; }
    setFormSaving(true);
    try {
      const payload = { title: asgForm.title.trim(), courseId: asgForm.courseId, description: asgForm.description.trim(), dueAt: new Date(asgForm.dueAt).toISOString(), totalMarks: Number(asgForm.maxMarks) };
      if (activeAsg) {
        const res = await dispatch(updateAssignment({ id: activeAsg._id, payload }));
        if (updateAssignment.fulfilled.match(res)) { toast.success('Assignment updated!'); setAsgModalOpen(false); }
        else toast.error(res.payload || 'Update failed');
      } else {
        const res = await dispatch(createAssignment(payload));
        if (createAssignment.fulfilled.match(res)) { toast.success('Assignment created!'); setAsgModalOpen(false); }
        else toast.error(res.payload || 'Create failed');
      }
    } finally { setFormSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    setDeletingIds(prev => new Set([...prev, id]));
    const res = await dispatch(deleteAssignment(id));
    setDeletingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (deleteAssignment.fulfilled.match(res)) toast.success('Assignment deleted');
    else toast.error(res.payload || 'Delete failed');
  };

  const openSubmissions = async (asg) => {
    setSelectedAsg(asg); setSubmissionsModalOpen(true); setGradingId(null); setSubLoading(true);
    try {
      const res = await getAssignmentSubmissions(asg._id);
      const list = res.data.submissions || res.data.data?.submissions || res.data.data || [];
      setSubmissions(Array.isArray(list) ? list : []);
    } catch { toast.error('Failed to load submissions'); }
    finally { setSubLoading(false); }
  };

  const fetchDetail = async (submissionId) => {
    try {
      const res = await getAssignmentSubmission(selectedAsg._id, submissionId);
      return res.data.submission || res.data.data?.submission || res.data.data || null;
    } catch { toast.error('Failed to load submission details'); return null; }
  };

  const handleGrade = async (submissionId) => {
    try {
      await gradeSubmission(selectedAsg._id, submissionId, { marksAwarded: Number(gradeData.grade), feedback: gradeData.feedback });
      toast.success('Graded successfully!');
      setGradingId(null);
      openSubmissions(selectedAsg);
    } catch (err) { toast.error(err.message || 'Grade failed'); }
  };

  const maxMarks = selectedAsg?.totalMarks || selectedAsg?.maxMarks || 100;

  return (
    <div className="page-wrapper">
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
        {loading ? <SkeletonFeed count={4} /> : assignments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.map(asg => (
              <div key={asg._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{asg.course?.title || 'No course'}</span>
                    <span className={`badge ${asg.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{asg.status || 'draft'}</span>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{asg.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{asg.description}</p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Due: {asg.dueAt ? new Date(asg.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}</span>
                    <span><Award size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Max Marks: {asg.totalMarks || asg.maxMarks || 100}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openSubmissions(asg)}><CheckSquare size={16} /> Submissions</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(asg)}><Edit3 size={16} /> Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(asg._id)} disabled={deletingIds.has(asg._id)}>
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
        {subLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner /></div>
        ) : submissions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} · Max marks: {maxMarks}
            </p>
            {submissions.map(sub => (
              <SubmissionCard
                key={sub._id}
                sub={sub}
                maxMarks={maxMarks}
                gradingId={gradingId}
                gradeData={gradeData}
                setGradeData={setGradeData}
                setGradingId={setGradingId}
                onGrade={handleGrade}
                onFetchDetail={fetchDetail}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon"><FileText size={36} /></div>
            <p>No submissions yet for this assignment.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
