import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchInstructorQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  selectInstructorQuizzes,
  selectInstructorQuizzesLoading,
} from '../../store/slices/instructor/quizzesSlice';
import { fetchAllCourses, selectCourses } from '../../store/slices/coursesSlice';
import {
  addQuizQuestion,
  updateQuizStatus,
  getQuizAttempts,
  getQuizAttempt,
  evaluateAnswer,
  submitAttemptByInstructor,
} from '../../api/instructor.api';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import {
  HelpCircle, Plus, Trash2, Edit3, Globe, EyeOff,
  Users, ChevronLeft, CheckCircle, XCircle, Clock, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Status badge color ────────────────────────────────────────────────────────
const quizStatusColor = (s) => s === 'published' ? 'badge-success' : s === 'archived' ? 'badge-danger' : 'badge-warning';
const attemptStatusColor = (s) => {
  if (s === 'evaluated') return 'badge-success';
  if (s === 'submitted') return 'badge-warning';
  if (s === 'in_progress') return 'badge-primary';
  return 'badge-warning';
};

export default function InstructorQuizzes() {
  const dispatch = useAppDispatch();
  const quizzes  = useAppSelector(selectInstructorQuizzes);
  const loading  = useAppSelector(selectInstructorQuizzesLoading);
  const courses  = useAppSelector(selectCourses);

  // ── Quiz list/create/edit ──────────────────────────────────────────────────
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [activeQuiz, setActiveQuiz]       = useState(null);
  const [quizForm, setQuizForm]           = useState({ title: '', courseId: '', description: '', timeLimit: 15, passingScore: 70 });

  // ── Add question ───────────────────────────────────────────────────────────
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [selectedQuizForQ, setSelectedQuizForQ]   = useState(null);
  const [questionForm, setQuestionForm]           = useState({
    questionText: '', questionType: 'single_choice',
    options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
    marks: 1,
  });

  // ── Submissions view ───────────────────────────────────────────────────────
  const [view, setView]                     = useState('list');   // 'list' | 'attempts' | 'attempt-detail'
  const [selectedQuizForAttempts, setSelectedQuizForAttempts] = useState(null);
  const [attempts, setAttempts]             = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [attemptDetail, setAttemptDetail]   = useState(null);
  const [detailLoading, setDetailLoading]   = useState(false);

  // ── Evaluate modal ─────────────────────────────────────────────────────────
  const [evalModalOpen, setEvalModalOpen]   = useState(false);
  const [evalAnswer, setEvalAnswer]         = useState(null);
  const [evalForm, setEvalForm]             = useState({ marksAwarded: 0, isCorrect: false, evaluatorComment: '' });
  const [evalLoading, setEvalLoading]       = useState(false);

  useEffect(() => {
    dispatch(fetchInstructorQuizzes());
    dispatch(fetchAllCourses());
  }, [dispatch]);

  // ── Handlers: Quiz ────────────────────────────────────────────────────────
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (activeQuiz) {
      const res = await dispatch(updateQuiz({ id: activeQuiz._id, payload: quizForm }));
      if (updateQuiz.fulfilled.match(res)) { toast.success('Quiz updated'); setQuizModalOpen(false); }
      else toast.error(res.payload || 'Update failed');
    } else {
      const res = await dispatch(createQuiz(quizForm));
      if (createQuiz.fulfilled.match(res)) { toast.success('Quiz created'); setQuizModalOpen(false); }
      else toast.error(res.payload || 'Create failed');
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Delete this quiz?')) return;
    const res = await dispatch(deleteQuiz(id));
    if (deleteQuiz.fulfilled.match(res)) toast.success('Quiz deleted');
    else toast.error(res.payload || 'Delete failed');
  };

  const handlePublishToggle = async (quiz) => {
    const nextStatus = quiz.status === 'published' ? 'draft' : 'published';
    try {
      await updateQuizStatus(quiz._id, { status: nextStatus });
      toast.success(nextStatus === 'published' ? 'Quiz published!' : 'Quiz unpublished');
      dispatch(fetchInstructorQuizzes());
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Status update failed');
    }
  };

  // ── Handlers: Question ────────────────────────────────────────────────────
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedQuizForQ) return;
    try {
      await addQuizQuestion(selectedQuizForQ._id, questionForm);
      toast.success('Question added!');
      setQuestionModalOpen(false);
      dispatch(fetchInstructorQuizzes());
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
  };

  // ── Handlers: Submissions ─────────────────────────────────────────────────
  const openAttempts = async (quiz) => {
    setSelectedQuizForAttempts(quiz);
    setView('attempts');
    setAttemptsLoading(true);
    try {
      const res = await getQuizAttempts(quiz._id);
      const list = res.data.attempts || res.data.data?.attempts || [];
      setAttempts(list);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load attempts');
    } finally {
      setAttemptsLoading(false);
    }
  };

  const openAttemptDetail = async (attempt) => {
    setSelectedAttempt(attempt);
    setView('attempt-detail');
    setDetailLoading(true);
    try {
      const res = await getQuizAttempt(selectedQuizForAttempts._id, attempt._id);
      // API spreads result: { quiz, attempt, answers, evaluationSummary }
      setAttemptDetail(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to load attempt');
    } finally {
      setDetailLoading(false);
    }
  };

  const openEvalModal = (answer) => {
    setEvalAnswer(answer);
    setEvalForm({
      marksAwarded: answer.evaluation?.marksAwarded ?? 0,
      isCorrect: answer.evaluation?.isCorrect ?? false,
      evaluatorComment: answer.evaluation?.evaluatorComment ?? '',
    });
    setEvalModalOpen(true);
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setEvalLoading(true);
    try {
      await evaluateAnswer(
        selectedQuizForAttempts._id,
        selectedAttempt._id,
        evalAnswer._id,
        { ...evalForm, marksAwarded: Number(evalForm.marksAwarded) }
      );
      toast.success('Answer evaluated!');
      setEvalModalOpen(false);
      // Reload detail
      const res = await getQuizAttempt(selectedQuizForAttempts._id, selectedAttempt._id);
      setAttemptDetail(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Evaluation failed');
    } finally {
      setEvalLoading(false);
    }
  };

  const handleForceSubmit = async (attempt) => {
    if (!window.confirm('Force submit this attempt?')) return;
    try {
      await submitAttemptByInstructor(selectedQuizForAttempts._id, attempt._id);
      toast.success('Attempt submitted!');
      openAttempts(selectedQuizForAttempts);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Submit failed');
    }
  };

  const statusColor = quizStatusColor;

  // ── Render question type for selecting default options ──────────────────────
  const handleQuestionTypeChange = (type) => {
    let options = questionForm.options;
    if (type === 'true_false') options = [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }];
    else if (type === 'short_answer') options = [];
    else if (questionForm.questionType === 'true_false' || questionForm.questionType === 'short_answer')
      options = [{ text: '', isCorrect: true }, { text: '', isCorrect: false }];
    setQuestionForm(f => ({ ...f, questionType: type, options }));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTEMPTS LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'attempts') {
    return (
      <div className="page-wrapper">
        <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <button className="btn btn-ghost btn-sm" style={{ marginBottom: '0.5rem' }} onClick={() => setView('list')}>
                <ChevronLeft size={16} /> Back to Quizzes
              </button>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Users size={24} color="var(--color-primary-light)" /> Submissions — {selectedQuizForAttempts?.title}
              </h1>
              <p>Review student quiz attempts and mark answers</p>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          {attemptsLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}><Spinner /></div>
          ) : attempts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {attempts.map(att => (
                <div key={att._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className={`badge ${attemptStatusColor(att.status)}`}>{att.status}</span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Attempt #{att.attemptNumber}</span>
                    </div>
                    <h4 style={{ fontWeight: 600 }}>{att.student?.fullName || att.student?.email || 'Student'}</h4>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {att.obtainedMarks ?? '—'} / {att.totalMarks ?? '—'} marks
                      {att.percentage != null && <span> · {att.percentage}%</span>}
                      {att.isPassed != null && <span style={{ marginLeft: 6, color: att.isPassed ? 'var(--color-success)' : 'var(--color-error)' }}>{att.isPassed ? '✓ Passed' : '✗ Failed'}</span>}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {att.status === 'in_progress' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleForceSubmit(att)}>
                        Force Submit
                      </button>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={() => openAttemptDetail(att)}>
                      View & Mark
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={48} /></div>
              <h3>No submissions yet</h3>
              <p>Students haven't taken this quiz yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ATTEMPT DETAIL + MARKING VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'attempt-detail') {
    // answers array is at top level of API response
    const answers = attemptDetail?.answers || [];
    const attemptMeta = attemptDetail?.attempt || selectedAttempt;
    return (
      <div className="page-wrapper">
        <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
          <div className="container">
            <button className="btn btn-ghost btn-sm" style={{ marginBottom: '0.5rem' }} onClick={() => setView('attempts')}>
              <ChevronLeft size={16} /> Back to Submissions
            </button>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              Attempt — {attemptMeta?.student?.fullName || selectedAttempt?.student?.fullName || 'Student'}
            </h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span className={`badge ${attemptStatusColor(attemptMeta?.status || selectedAttempt?.status)}`}>{attemptMeta?.status || selectedAttempt?.status}</span>
              <span>{attemptMeta?.obtainedMarks ?? selectedAttempt?.obtainedMarks ?? '—'} / {attemptMeta?.totalMarks ?? selectedAttempt?.totalMarks ?? '—'} marks</span>
              {(attemptMeta?.percentage ?? selectedAttempt?.percentage) != null && <span>{attemptMeta?.percentage ?? selectedAttempt?.percentage}%</span>}
              {(attemptMeta?.isPassed ?? selectedAttempt?.isPassed) != null && (
                <span style={{ color: (attemptMeta?.isPassed ?? selectedAttempt?.isPassed) ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {(attemptMeta?.isPassed ?? selectedAttempt?.isPassed) ? '✓ Passed' : '✗ Failed'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}><Spinner /></div>
          ) : answers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {answers.map((ans, idx) => {
                // Answer shape: { _id, question:{questionText,questionType,marks}, response:{answerText,selectedOptionIds,isAnswered}, evaluation:{isCorrect,marksAwarded,maxMarks,evaluatedAt,evaluatorComment} }
                const needsManualMark = ans.question?.questionType === 'short_answer' && !ans.evaluation?.evaluatedAt;
                const studentAnswer = ans.response?.answerText ||
                  (ans.response?.selectedOptionIds?.length
                    ? ans.question?.options?.filter(o => ans.response.selectedOptionIds.includes(String(o._id))).map(o => o.text).join(', ')
                    : null) || '(no answer)';
                return (
                  <div key={ans._id} className="glass-card" style={{ padding: '1.25rem', borderLeft: `3px solid ${ans.evaluation?.isCorrect === true ? 'var(--color-success)' : ans.evaluation?.isCorrect === false ? 'var(--color-error)' : 'var(--color-border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <p style={{ fontWeight: 600, flex: 1 }}>
                        Q{idx + 1}. {ans.question?.questionText || 'Question'}
                        <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>({ans.question?.questionType})</span>
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {ans.evaluation?.isCorrect === true && <CheckCircle size={18} color="var(--color-success)" />}
                        {ans.evaluation?.isCorrect === false && <XCircle size={18} color="var(--color-error)" />}
                        {ans.evaluation?.isCorrect == null && <Clock size={18} color="var(--text-muted)" />}
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                          {ans.evaluation?.marksAwarded ?? '—'} / {ans.evaluation?.maxMarks ?? ans.question?.marks ?? '—'} marks
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Student answer: </span>
                      <span style={{ fontWeight: 500 }}>{studentAnswer}</span>
                    </div>

                    {ans.evaluation?.evaluatorComment && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        Comment: {ans.evaluation.evaluatorComment}
                      </p>
                    )}

                    {(['submitted', 'evaluated'].includes(attemptMeta?.status || selectedAttempt?.status)) && (
                      <button
                        className={`btn btn-sm ${needsManualMark ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ marginTop: '0.75rem' }}
                        onClick={() => openEvalModal(ans)}
                      >
                        <Award size={14} /> {needsManualMark ? 'Mark Answer' : 'Edit Mark'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No answers found</h3>
            </div>
          )}
        </div>

        {/* Evaluate Modal */}
        <Modal isOpen={evalModalOpen} onClose={() => setEvalModalOpen(false)} title="Mark Answer">
          <form onSubmit={handleEvaluate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--color-bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.375rem' }}>{evalAnswer?.question?.questionText}</p>
              <p style={{ color: 'var(--text-muted)' }}>
                Student: <strong>{evalAnswer?.response?.answerText ||
                  (evalAnswer?.response?.selectedOptionIds?.length
                    ? evalAnswer?.question?.options?.filter(o => evalAnswer.response.selectedOptionIds.includes(String(o._id))).map(o => o.text).join(', ')
                    : null) || '(no answer)'}</strong>
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                Max marks: {evalAnswer?.evaluation?.maxMarks ?? evalAnswer?.question?.marks ?? '—'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Marks Awarded *</label>
                <input
                  type="number" min="0"
                  max={evalAnswer?.evaluation?.maxMarks ?? evalAnswer?.question?.marks ?? 100}
                  step="0.5"
                  className="input-field"
                  value={evalForm.marksAwarded}
                  onChange={e => setEvalForm(f => ({ ...f, marksAwarded: e.target.value }))}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Mark as</label>
                <select
                  className="input-field"
                  value={evalForm.isCorrect ? 'correct' : 'incorrect'}
                  onChange={e => setEvalForm(f => ({ ...f, isCorrect: e.target.value === 'correct' }))}
                >
                  <option value="correct">Correct ✓</option>
                  <option value="incorrect">Incorrect ✗</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Comment (optional)</label>
              <textarea
                className="input-field" rows={3}
                placeholder="Feedback for the student..."
                value={evalForm.evaluatorComment}
                onChange={e => setEvalForm(f => ({ ...f, evaluatorComment: e.target.value }))}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={evalLoading}>
              {evalLoading ? <Spinner /> : 'Save Mark'}
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN QUIZ LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <HelpCircle size={28} color="var(--color-primary-light)" /> Manage Quizzes
            </h1>
            <p>Create quizzes, add questions, and review student submissions</p>
          </div>
          <button className="btn btn-primary" onClick={() => {
            setActiveQuiz(null);
            setQuizForm({ title: '', courseId: courses[0]?._id || '', description: '', timeLimit: 15, passingScore: 70 });
            setQuizModalOpen(true);
          }}>
            <Plus size={18} /> Create Quiz
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Spinner /></div>
        ) : quizzes.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {quizzes.map(quiz => (
              <div key={quiz._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem' }}>{quiz.title}</h3>
                    <span className={`badge ${statusColor(quiz.status)}`} style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
                      {quiz.status || 'draft'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{quiz.description}</p>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <div>Time: {quiz.timeLimit || quiz.durationInMinutes} mins · Passing: {quiz.passingScore || quiz.passingPercentage}%</div>
                    <div>Questions: {quiz.totalQuestions ?? quiz.questions?.length ?? 0}</div>
                  </div>
                  {quiz.status !== 'published' && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>
                      ⚠ Publish this quiz so students can see it
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                  {/* Publish/Unpublish */}
                  <button
                    className={`btn btn-sm ${quiz.status === 'published' ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => handlePublishToggle(quiz)}
                  >
                    {quiz.status === 'published' ? <><EyeOff size={14} /> Unpublish</> : <><Globe size={14} /> Publish</>}
                  </button>

                  {/* View Submissions */}
                  <button className="btn btn-secondary btn-sm" onClick={() => openAttempts(quiz)} title="View student submissions">
                    <Users size={14} /> Submissions
                  </button>

                  {/* Add Question */}
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedQuizForQ(quiz); setQuestionModalOpen(true); }}>
                    <Plus size={14} />
                  </button>

                  {/* Edit */}
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    setActiveQuiz(quiz);
                    setQuizForm({
                      title: quiz.title,
                      courseId: quiz.courseId || quiz.course?._id || '',
                      description: quiz.description || '',
                      timeLimit: quiz.timeLimit || quiz.durationInMinutes || 15,
                      passingScore: quiz.passingScore || quiz.passingPercentage || 70,
                    });
                    setQuizModalOpen(true);
                  }}>
                    <Edit3 size={14} />
                  </button>

                  {/* Delete */}
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteQuiz(quiz._id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><HelpCircle size={48} /></div>
            <h3>No quizzes created</h3>
            <p>Create a quiz, add at least one question, then hit <strong>Publish</strong> so students can take it.</p>
          </div>
        )}
      </div>

      {/* ── Create / Edit Quiz Modal ── */}
      <Modal isOpen={quizModalOpen} onClose={() => setQuizModalOpen(false)} title={activeQuiz ? 'Edit Quiz' : 'Create Quiz'}>
        <form onSubmit={handleSaveQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Title *</label>
            <input type="text" className="input-field" value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div className="input-group">
            <label className="input-label">Course *</label>
            <select className="input-field" value={quizForm.courseId} onChange={e => setQuizForm(f => ({ ...f, courseId: e.target.value }))} required>
              <option value="">Select Course</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="input-field" rows={2} value={quizForm.description} onChange={e => setQuizForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Time Limit (mins)</label>
              <input type="number" min="1" className="input-field" value={quizForm.timeLimit} onChange={e => setQuizForm(f => ({ ...f, timeLimit: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Passing Score (%)</label>
              <input type="number" min="1" max="100" className="input-field" value={quizForm.passingScore} onChange={e => setQuizForm(f => ({ ...f, passingScore: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Save Quiz</button>
        </form>
      </Modal>

      {/* ── Add Question Modal ── */}
      <Modal isOpen={questionModalOpen} onClose={() => setQuestionModalOpen(false)} title={`Add Question — "${selectedQuizForQ?.title}"`}>
        <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Question Text *</label>
            <input type="text" className="input-field" value={questionForm.questionText} onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))} required />
          </div>
          <div className="input-group">
            <label className="input-label">Question Type</label>
            <select className="input-field" value={questionForm.questionType} onChange={e => handleQuestionTypeChange(e.target.value)}>
              <option value="single_choice">Single Choice (one correct answer)</option>
              <option value="multiple_choice">Multiple Choice (many correct answers)</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer (text)</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Marks</label>
            <input type="number" min="1" className="input-field" value={questionForm.marks} onChange={e => setQuestionForm(f => ({ ...f, marks: Number(e.target.value) }))} />
          </div>
          <div className="input-group">
            <label className="input-label">Options</label>
            {['single_choice', 'multiple_choice', 'true_false'].includes(questionForm.questionType) ? (
              <>
                {questionForm.questionType === 'true_false' ? (
                  ['True', 'False'].map((val, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input type="text" className="input-field" value={val} readOnly />
                      <button type="button" className={`btn btn-sm ${questionForm.options[i]?.isCorrect ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setQuestionForm(f => ({ ...f, options: ['True', 'False'].map((t, idx) => ({ text: t, isCorrect: idx === i })) }))}>
                        {questionForm.options[i]?.isCorrect ? 'Correct ✓' : 'Mark Correct'}
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    {questionForm.options.map((opt, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input type="text" className="input-field" placeholder={`Option ${i + 1}`} value={opt.text}
                          onChange={e => { const o = [...questionForm.options]; o[i] = { ...o[i], text: e.target.value }; setQuestionForm(f => ({ ...f, options: o })); }} required />
                        <button type="button" className={`btn btn-sm ${opt.isCorrect ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => {
                            const o = questionForm.questionType === 'multiple_choice'
                              ? questionForm.options.map((x, idx) => idx === i ? { ...x, isCorrect: !x.isCorrect } : x)
                              : questionForm.options.map((x, idx) => ({ ...x, isCorrect: idx === i }));
                            setQuestionForm(f => ({ ...f, options: o }));
                          }}>
                          {opt.isCorrect ? 'Correct ✓' : 'Mark Correct'}
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQuestionForm(f => ({ ...f, options: [...f.options, { text: '', isCorrect: false }] }))}>
                      + Add Option
                    </button>
                  </>
                )}
              </>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Short answer questions are graded manually by you after submission.</p>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Save Question</button>
        </form>
      </Modal>
    </div>
  );
}
