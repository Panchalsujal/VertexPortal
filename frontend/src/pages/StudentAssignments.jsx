import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchStudentAssignments,
  selectStudentAssignments,
  selectStudentAssignmentsLoading,
} from '../store/slices/student/studentAssignmentsSlice';
import { submitAssignment } from '../api/student.api';
import { Spinner, SkeletonFeed } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { FileText, Upload, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentAssignments() {
  const dispatch = useAppDispatch();
  const assignments = useAppSelector(selectStudentAssignments);
  const loading = useAppSelector(selectStudentAssignmentsLoading);

  // Submit modal local state
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchStudentAssignments());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeAssignment) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('notes', notes);
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      await submitAssignment(activeAssignment._id, formData);
      toast.success('Assignment submitted successfully!');
      setSubmitModalOpen(false);
      dispatch(fetchStudentAssignments());
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailabilityInfo = (asg) => {
    const now = new Date();
    const due = asg.dueAt ? new Date(asg.dueAt) : null;
    const availFrom = asg.availableFrom ? new Date(asg.availableFrom) : null;
    const lateUntil = asg.lateSubmissionUntil ? new Date(asg.lateSubmissionUntil) : null;

    const status = asg.availabilityStatus;
    if (status === 'expired') return { label: 'Expired', color: 'var(--color-error)', canSubmit: false };
    if (status === 'upcoming') return { label: 'Upcoming', color: 'var(--color-warning)', canSubmit: false };
    if (status === 'late_submission') return { label: 'Late Submission Open', color: 'var(--color-warning)', canSubmit: true };
    if (status === 'available') return { label: 'Active', color: 'var(--color-success)', canSubmit: true };

    if (!due) return { label: 'Active', color: 'var(--color-success)', canSubmit: true };
    if (availFrom && now < availFrom) return { label: 'Upcoming', color: 'var(--color-warning)', canSubmit: false };
    if (now > due) {
      if (asg.allowLateSubmission && lateUntil && now <= lateUntil) {
        return { label: 'Late Submission Open', color: 'var(--color-warning)', canSubmit: true };
      }
      return { label: 'Expired', color: 'var(--color-error)', canSubmit: false };
    }
    return { label: 'Active', color: 'var(--color-success)', canSubmit: true };
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <FileText size={28} color="var(--color-primary-light)" /> My Assignments
          </h1>
          <p>Submit coursework and view grades from your instructors</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <SkeletonFeed count={4} />
        ) : assignments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.map(asg => {
              const avail = getAvailabilityInfo(asg);
              const dueDate = asg.dueAt || asg.dueDate;
              return (
                <div key={asg._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">{asg.course?.title || 'Assignment'}</span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: `${avail.color}20`,
                        color: avail.color,
                        border: `1px solid ${avail.color}40`,
                      }}>
                        {avail.label}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{asg.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{asg.description}</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span>
                        <Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Due: {dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}
                      </span>
                      <span>Max Marks: {asg.totalMarks || asg.maxMarks || 100}</span>
                    </div>
                  </div>

                  <div>
                    {avail.canSubmit ? (
                      <button className="btn btn-primary" onClick={() => { setActiveAssignment(asg); setNotes(''); setFiles([]); setSubmitModalOpen(true); }}>
                        <Upload size={16} /> Submit Work
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.875rem', color: avail.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <AlertCircle size={16} /> {avail.label === 'Upcoming' ? 'Not open yet' : 'Deadline passed'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={48} /></div>
            <h3>No assignments found</h3>
            <p>Course assignments assigned by your instructors will appear here.</p>
          </div>
        )}
      </div>

      {/* Submission Modal */}
      <Modal isOpen={submitModalOpen} onClose={() => setSubmitModalOpen(false)} title={`Submit: ${activeAssignment?.title}`}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeAssignment && (
            <div style={{ padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Due: </strong>
              {(activeAssignment.dueAt || activeAssignment.dueDate)
                ? new Date(activeAssignment.dueAt || activeAssignment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'No deadline'}
              {' · '}<strong style={{ color: 'var(--text-primary)' }}>Max Marks: </strong>{activeAssignment.totalMarks || activeAssignment.maxMarks || 100}
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Notes / Description</label>
            <textarea className="input-field" rows={3} placeholder="Add any comments or notes for your submission..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="input-group">
            <label className="input-label">Upload File(s)</label>
            <input type="file" multiple className="input-field" onChange={e => setFiles(e.target.files)} />
            <small style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Up to 5 files allowed (PDF, DOCX, ZIP, Code)</small>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ justifyContent: 'center' }}>
            {submitting ? <Spinner size={16} /> : 'Submit Assignment'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
