import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchStudentAssignments,
  selectStudentAssignments,
  selectStudentAssignmentsLoading,
} from '../store/slices/student/studentAssignmentsSlice';
import {
  submitAssignment,
  getMyAssignmentSubmissions,
} from '../api/student.api';
import { Spinner, SkeletonFeed } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { Empty } from '../components/ui/Empty';
import { Marker } from '../components/ui/Marker';
import {
  FileText, Upload, Calendar, AlertCircle, CheckCircle2,
  Clock, Star, RotateCcw, ChevronDown, ChevronUp,
  Award, MessageSquare, Paperclip, Eye, TrendingUp, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ────────────────────────────────────────────────────────────── */
/* Helpers                                                        */
/* ────────────────────────────────────────────────────────────── */

const STATUS_CONFIG = {
  graded: {
    label: 'Graded',
    icon: Award,
    bg: 'rgba(16,185,129,0.1)',
    color: '#10b981',
    border: 'rgba(16,185,129,0.3)',
  },
  passed: {
    label: 'Passed',
    icon: CheckCircle2,
    bg: 'rgba(16,185,129,0.1)',
    color: '#10b981',
    border: 'rgba(16,185,129,0.3)',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    bg: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    border: 'rgba(239,68,68,0.3)',
  },
  submitted: {
    label: 'Submitted',
    icon: CheckCircle2,
    bg: 'rgba(99,102,241,0.1)',
    color: '#6366f1',
    border: 'rgba(99,102,241,0.3)',
  },
  pending_review: {
    label: 'Pending Review',
    icon: Clock,
    bg: 'rgba(245,158,11,0.1)',
    color: '#f59e0b',
    border: 'rgba(245,158,11,0.3)',
  },
  returned: {
    label: 'Returned for Revision',
    icon: RotateCcw,
    bg: 'rgba(245,158,11,0.1)',
    color: '#f59e0b',
    border: 'rgba(245,158,11,0.3)',
  },
};

function SubmissionStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      fontSize: '0.75rem', fontWeight: 600,
      padding: '0.25rem 0.65rem', borderRadius: '999px',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      <Icon size={13} /> {cfg.label}
    </span>
  );
}

function ScoreDisplay({ marksAwarded, totalMarks, percentage }) {
  const pct = Math.round(percentage ?? 0);
  const passed = pct >= 50;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.75rem 1rem',
      background: passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
      border: `1px solid ${passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: passed ? '#10b981' : '#ef4444',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0,
      }}>
        {pct}%
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
          {marksAwarded ?? 0} / {totalMarks} marks
        </div>
        <div style={{ fontSize: '0.75rem', color: passed ? '#10b981' : '#ef4444', fontWeight: 600 }}>
          {passed ? '✓ Passed' : '✗ Did not pass'}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/* Main Component                                                 */
/* ────────────────────────────────────────────────────────────── */

export default function StudentAssignments() {
  const dispatch = useAppDispatch();
  const assignments = useAppSelector(selectStudentAssignments);
  const loading = useAppSelector(selectStudentAssignmentsLoading);

  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Expanded submission detail panel (per card)
  const [expandedId, setExpandedId] = useState(null);
  // Cached latest submission details { [assignmentId]: submissionObj }
  const [submissionDetails, setSubmissionDetails] = useState({});
  const [loadingDetail, setLoadingDetail] = useState({});

  useEffect(() => {
    dispatch(fetchStudentAssignments());
  }, [dispatch]);

  /* ── Fetch latest submission details for a card ── */
  const loadSubmissionDetail = async (asg) => {
    const id = asg._id;
    if (submissionDetails[id] || loadingDetail[id]) return;
    if (!asg.submissionSummary?.latestSubmissionId) return;

    setLoadingDetail(prev => ({ ...prev, [id]: true }));
    try {
      const res = await getMyAssignmentSubmissions(id);
      const submissions = res.data.submissions || res.data.data?.submissions || [];
      // Sort by attemptNumber desc, pick latest
      const latest = submissions.sort((a, b) => b.attemptNumber - a.attemptNumber)[0] || null;
      setSubmissionDetails(prev => ({ ...prev, [id]: latest }));
    } catch {
      // silently ignore
    } finally {
      setLoadingDetail(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleExpand = (asg) => {
    if (expandedId === asg._id) {
      setExpandedId(null);
    } else {
      setExpandedId(asg._id);
      loadSubmissionDetail(asg);
    }
  };

  /* ── Submit handler ── */
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
      // Clear cached detail so it reloads fresh
      setSubmissionDetails(prev => {
        const next = { ...prev };
        delete next[activeAssignment._id];
        return next;
      });
      setExpandedId(null);
      dispatch(fetchStudentAssignments());
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitModal = (asg) => {
    setActiveAssignment(asg);
    setNotes('');
    setFiles([]);
    setSubmitModalOpen(true);
  };

  /* ── Availability label (from availabilityStatus field) ── */
  const getAvailLabel = (status) => {
    switch (status) {
      case 'available': return { label: 'Active', color: 'var(--color-success)' };
      case 'upcoming': return { label: 'Upcoming', color: 'var(--color-warning)' };
      case 'late_submission': return { label: 'Late Submission Open', color: 'var(--color-warning)' };
      case 'expired': return { label: 'Expired', color: 'var(--color-error)' };
      default: return { label: 'Active', color: 'var(--color-success)' };
    }
  };

  /* ── Render action button area ── */
  const renderActionArea = (asg) => {
    const summary = asg.submissionSummary || {};
    const hasSubmitted = summary.attemptsUsed > 0;
    const latestStatus = summary.latestStatus;
    const canSubmit = summary.canSubmit; // backend-computed
    const attemptsRemaining = summary.attemptsRemaining ?? 0;
    const maxAttempts = asg.maxAttempts ?? 1;
    const isGraded = latestStatus === 'graded';
    const isReturned = latestStatus === 'returned';

    if (!hasSubmitted) {
      // Never submitted
      if (canSubmit) {
        return (
          <button
            className="btn btn-primary"
            onClick={() => openSubmitModal(asg)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <Upload size={15} /> Submit Work
          </button>
        );
      }
      return (
        <span style={{ fontSize: '0.8rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}>
          <AlertCircle size={15} /> Deadline passed
        </span>
      );
    }

    // Has submitted — show status badge + grade
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
        <SubmissionStatusBadge status={isGraded ? (summary.isPassed ? 'passed' : 'failed') : (latestStatus || 'submitted')} />

        {/* Score pill if graded */}
        {isGraded && summary.bestPercentage != null && (
          <span style={{
            fontSize: '0.8rem', fontWeight: 700,
            color: summary.isPassed ? '#10b981' : '#ef4444',
          }}>
            {Math.round(summary.bestPercentage)}% best score
          </span>
        )}

        {/* Resubmit if returned OR if attempts remain */}
        {(isReturned || (canSubmit && attemptsRemaining > 0)) && (
          <button
            className="btn"
            style={{
              fontSize: '0.75rem', padding: '0.35rem 0.9rem',
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--color-warning)',
            }}
            onClick={() => openSubmitModal(asg)}
          >
            <RotateCcw size={13} />
            {isReturned ? 'Resubmit (Returned)' : `Resubmit (${attemptsRemaining} left)`}
          </button>
        )}

        {/* Expand details toggle */}
        <button
          onClick={() => toggleExpand(asg)}
          style={{
            fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
            color: 'var(--color-primary)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius-sm)',
          }}
        >
          <Eye size={13} />
          {expandedId === asg._id ? 'Hide details' : 'View details'}
          {expandedId === asg._id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
    );
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
              const avail = getAvailLabel(asg.availabilityStatus);
              const dueDate = asg.dueAt || asg.dueDate;
              const summary = asg.submissionSummary || {};
              const isExpanded = expandedId === asg._id;
              const detail = submissionDetails[asg._id];
              const isLoadingDetail = loadingDetail[asg._id];

              return (
                <div key={asg._id} className="glass-card" style={{ padding: '1.5rem' }}>
                  {/* ── Main row ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Badges row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-primary">{asg.course?.title || 'Assignment'}</span>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: 600,
                          padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)',
                          background: `${avail.color}20`, color: avail.color,
                          border: `1px solid ${avail.color}40`,
                        }}>
                          {avail.label}
                        </span>
                        {/* Submission count badge */}
                        {summary.attemptsUsed > 0 && (
                          <span style={{
                            fontSize: '0.7rem', fontWeight: 600,
                            padding: '0.15rem 0.5rem', borderRadius: '999px',
                            background: 'rgba(99,102,241,0.08)', color: '#6366f1',
                            border: '1px solid rgba(99,102,241,0.2)',
                          }}>
                            {summary.attemptsUsed}/{asg.maxAttempts ?? 1} attempt{summary.attemptsUsed !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{asg.title}</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{asg.description}</p>

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <span>
                          <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                          Due: {dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No deadline'}
                        </span>
                        <span><TrendingUp size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Max Marks: {asg.totalMarks || asg.maxMarks || 100}</span>
                      </div>
                    </div>

                    {/* Action area */}
                    <div style={{ flexShrink: 0 }}>
                      {renderActionArea(asg)}
                    </div>
                  </div>

                  {/* ── Expanded submission detail panel ── */}
                  {isExpanded && (
                    <div style={{
                      marginTop: '1.25rem',
                      paddingTop: '1.25rem',
                      borderTop: '1px solid var(--border-color)',
                    }}>
                      {isLoadingDetail ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          <Spinner size={16} /> Loading submission details…
                        </div>
                      ) : detail ? (
                        <SubmissionDetailPanel submission={detail} totalMarks={asg.totalMarks || asg.maxMarks || 100} />
                      ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No submission details found.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <Empty
            icon={FileText}
            title="No assignments found"
            description="Course assignments assigned by your instructors will appear here."
          />
        )}
      </div>

      {/* ── Submit / Resubmit Modal ── */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title={`Submit: ${activeAssignment?.title}`}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeAssignment && (
            <div style={{
              padding: '0.75rem', background: 'var(--color-bg-secondary)',
              borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-muted)',
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>Due: </strong>
              {(activeAssignment.dueAt || activeAssignment.dueDate)
                ? new Date(activeAssignment.dueAt || activeAssignment.dueDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'No deadline'}
              {' · '}<strong style={{ color: 'var(--text-primary)' }}>Max Marks: </strong>
              {activeAssignment.totalMarks || activeAssignment.maxMarks || 100}
              {(activeAssignment.submissionSummary?.attemptsUsed > 0) && (
                <span style={{ marginLeft: '0.75rem', color: 'var(--color-warning)', fontWeight: 600 }}>
                  · Attempt {(activeAssignment.submissionSummary.attemptsUsed ?? 0) + 1}
                  {activeAssignment.maxAttempts ? ` of ${activeAssignment.maxAttempts}` : ''}
                </span>
              )}
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Notes / Description</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Add any comments or notes for your submission..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
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

/* ────────────────────────────────────────────────────────────── */
/* Submission Detail Panel (shown when expanded)                  */
/* ────────────────────────────────────────────────────────────── */

function SubmissionDetailPanel({ submission, totalMarks }) {
  const isGraded = submission.status === 'graded';
  const isReturned = submission.status === 'returned';
  const isPending = !isGraded && !isReturned;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <strong style={{ fontSize: '0.875rem' }}>Submission #{submission.attemptNumber}</strong>
        <SubmissionStatusBadge status={isGraded ? (submission.isPassed ? 'passed' : 'failed') : submission.status} />
        {submission.submittedAt && (
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Submitted {new Date(submission.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Grade / Score block */}
      {isGraded && (
        <ScoreDisplay
          marksAwarded={submission.marksAwarded}
          totalMarks={submission.totalMarks ?? totalMarks}
          percentage={submission.percentage}
        />
      )}

      {/* Pending review notice */}
      {isPending && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.75rem', background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem', color: '#f59e0b',
        }}>
          <Clock size={15} /> Your submission is awaiting review from the instructor.
        </div>
      )}

      {/* Returned notice */}
      {isReturned && (
        <div style={{
          padding: '0.75rem', background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 600, marginBottom: '0.25rem' }}>
            <RotateCcw size={14} /> Returned for Revision
          </div>
          {submission.returnReason && (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{submission.returnReason}</p>
          )}
        </div>
      )}

      {/* Instructor Feedback */}
      {submission.feedback && (
        <div style={{
          padding: '0.875rem',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            <MessageSquare size={14} color="var(--color-primary)" /> Instructor Feedback
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            {submission.feedback}
          </p>
          {submission.reviewedAt && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
              Reviewed on {new Date(submission.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* Submitted files */}
      {submission.files?.length > 0 && (
        <div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            <Paperclip size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Submitted Files
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {submission.files.map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.8125rem', color: 'var(--color-primary)',
                  padding: '0.4rem 0.75rem',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none',
                }}
              >
                <FileText size={13} /> {f.name || f.originalName || `File ${i + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Student notes */}
      {submission.notes && (
        <div style={{
          padding: '0.75rem', background: 'var(--color-bg-secondary)',
          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
        }}>
          <p style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Your Notes</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>{submission.notes}</p>
        </div>
      )}
    </div>
  );
}
