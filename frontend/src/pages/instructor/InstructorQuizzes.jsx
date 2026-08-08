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
import { addQuizQuestion, updateQuizStatus } from '../../api/instructor.api';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { HelpCircle, Plus, Trash2, Edit3, Globe, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstructorQuizzes() {
  const dispatch = useAppDispatch();
  const quizzes  = useAppSelector(selectInstructorQuizzes);
  const loading  = useAppSelector(selectInstructorQuizzesLoading);
  const courses  = useAppSelector(selectCourses);

  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [activeQuiz, setActiveQuiz]       = useState(null);
  const [quizForm, setQuizForm]           = useState({ title: '', courseId: '', description: '', timeLimit: 15, passingScore: 70 });

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [selectedQuizForQ, setSelectedQuizForQ]   = useState(null);
  const [questionForm, setQuestionForm]           = useState({
    questionText: '', questionType: 'single_choice',
    options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }],
    marks: 1,
  });

  useEffect(() => {
    dispatch(fetchInstructorQuizzes());
    dispatch(fetchAllCourses());
  }, [dispatch]);

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
      toast.success(nextStatus === 'published'
        ? 'Quiz published — students can now see it!'
        : 'Quiz unpublished');
      dispatch(fetchInstructorQuizzes());
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Status update failed');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedQuizForQ) return;
    try {
      await addQuizQuestion(selectedQuizForQ._id, questionForm);
      toast.success('Question added!');
      setQuestionModalOpen(false);
      dispatch(fetchInstructorQuizzes());
    } catch (err) { toast.error(err.message); }
  };

  const statusColor = (status) => {
    if (status === 'published') return 'badge-success';
    if (status === 'archived')  return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div className="page-wrapper">
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <HelpCircle size={28} color="var(--color-primary-light)" /> Manage Quizzes
            </h1>
            <p>Create quizzes and questions for your students</p>
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
                    <div>Time Limit: {quiz.timeLimit || quiz.durationInMinutes} mins</div>
                    <div>Passing Score: {quiz.passingScore || quiz.passingPercentage}%</div>
                    <div>Questions: {quiz.totalQuestions ?? quiz.questions?.length ?? 0}</div>
                  </div>
                  {quiz.status !== 'published' && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.5rem' }}>
                      ⚠ Publish this quiz so students can see it
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                  <button
                    className={`btn btn-sm ${quiz.status === 'published' ? 'btn-secondary' : 'btn-primary'}`}
                    style={{ flex: 1 }}
                    onClick={() => handlePublishToggle(quiz)}
                    title={quiz.status === 'published' ? 'Unpublish quiz' : 'Publish quiz so students can see it'}
                  >
                    {quiz.status === 'published'
                      ? <><EyeOff size={14} /> Unpublish</>
                      : <><Globe size={14} /> Publish</>
                    }
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedQuizForQ(quiz); setQuestionModalOpen(true); }}>
                    <Plus size={14} /> Add Q
                  </button>
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

      {/* Quiz Modal */}
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

      {/* Add Question Modal */}
      <Modal isOpen={questionModalOpen} onClose={() => setQuestionModalOpen(false)} title={`Add Question to "${selectedQuizForQ?.title}"`}>
        <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Question Text *</label>
            <input type="text" className="input-field" value={questionForm.questionText} onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))} required />
          </div>
          <div className="input-group">
            <label className="input-label">Question Type</label>
            <select className="input-field" value={questionForm.questionType} onChange={e => {
              const type = e.target.value;
              let options = questionForm.options;
              if (type === 'true_false') options = [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }];
              else if (type === 'short_answer') options = [];
              else if (questionForm.questionType === 'true_false' || questionForm.questionType === 'short_answer')
                options = [{ text: '', isCorrect: true }, { text: '', isCorrect: false }];
              setQuestionForm(f => ({ ...f, questionType: type, options }));
            }}>
              <option value="single_choice">Single Choice (one correct answer)</option>
              <option value="multiple_choice">Multiple Choice (many correct answers)</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer (text)</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Options</label>
            {['single_choice', 'multiple_choice', 'true_false'].includes(questionForm.questionType) ? (
              <>
                {questionForm.questionType === 'true_false' ? (
                  ['True', 'False'].map((val, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <input type="text" className="input-field" value={val} readOnly />
                      <button
                        type="button"
                        className={`btn btn-sm ${questionForm.options[i]?.isCorrect ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => {
                          const newOpts = ['True', 'False'].map((t, idx) => ({ text: t, isCorrect: idx === i }));
                          setQuestionForm(f => ({ ...f, options: newOpts }));
                        }}
                      >
                        {questionForm.options[i]?.isCorrect ? 'Correct ✓' : 'Mark Correct'}
                      </button>
                    </div>
                  ))
                ) : (
                  <>
                    {questionForm.options.map((opt, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text" className="input-field"
                          placeholder={`Option ${i + 1}`} value={opt.text}
                          onChange={e => {
                            const newOpts = [...questionForm.options];
                            newOpts[i] = { ...newOpts[i], text: e.target.value };
                            setQuestionForm(f => ({ ...f, options: newOpts }));
                          }}
                          required
                        />
                        <button
                          type="button"
                          className={`btn btn-sm ${opt.isCorrect ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => {
                            const newOpts = questionForm.questionType === 'multiple_choice'
                              ? questionForm.options.map((o, idx) => idx === i ? { ...o, isCorrect: !o.isCorrect } : o)
                              : questionForm.options.map((o, idx) => ({ ...o, isCorrect: idx === i }));
                            setQuestionForm(f => ({ ...f, options: newOpts }));
                          }}
                        >
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
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Short answer questions are graded manually by the instructor.</p>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Save Question</button>
        </form>
      </Modal>
    </div>
  );
}
