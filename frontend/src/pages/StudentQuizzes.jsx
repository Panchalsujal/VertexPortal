import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchStudentQuizzes,
  selectStudentQuizzes,
  selectStudentQuizzesLoading,
} from '../store/slices/student/studentQuizzesSlice';
import {
  getStudentQuiz,
  startQuizAttempt,
  saveQuizAnswer,
  submitQuizAttempt,
} from '../api/student.api';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { HelpCircle, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentQuizzes() {
  const dispatch = useAppDispatch();
  const quizzes = useAppSelector(selectStudentQuizzes);
  const loading = useAppSelector(selectStudentQuizzesLoading);

  const [activeQuiz, setActiveQuiz]     = useState(null);
  const [quizDetails, setQuizDetails]   = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [attempt, setAttempt]           = useState(null);
  const [answers, setAnswers]           = useState({});
  const [result, setResult]             = useState(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizLoading, setQuizLoading]   = useState(false);

  useEffect(() => {
    dispatch(fetchStudentQuizzes());
  }, [dispatch]);

  const handleStartQuiz = async (quiz) => {
    setActiveQuiz(quiz);
    setQuizModalOpen(true);
    setQuizLoading(true);
    setResult(null);
    setAnswers({});
    setQuizQuestions([]);
    try {
      // Get quiz metadata (instructions, etc.)
      const detailRes = await getStudentQuiz(quiz._id);
      const qData = detailRes.data.quiz || detailRes.data.data?.quiz || detailRes.data;
      setQuizDetails(qData);

      // Start attempt — questions come from THIS response at top level
      const attRes = await startQuizAttempt(quiz._id);
      const attData = attRes.data.attempt || attRes.data.data?.attempt || attRes.data;
      const questions = attRes.data.questions || attRes.data.data?.questions || [];
      setAttempt(attData);
      setQuizQuestions(questions);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not start quiz');
      setQuizModalOpen(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectOption = async (questionId, optionId, questionType) => {
    // Update local state first (optimistic)
    setAnswers(prev => {
      if (questionType === 'multiple_choice') {
        const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
        return {
          ...prev,
          [questionId]: current.includes(optionId)
            ? current.filter(id => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [questionId]: optionId };
    });

    // Save to backend
    try {
      const attemptId = attempt?._id || attempt?.attemptId;
      await saveQuizAnswer(activeQuiz._id, attemptId, questionId, {
        selectedOption: optionId,
      });
    } catch (err) {
      console.error('Save answer error:', err.response?.data?.message || err.message);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!window.confirm('Are you sure you want to submit your quiz?')) return;
    setQuizLoading(true);
    try {
      const attemptId = attempt?._id || attempt?.attemptId;
      const res = await submitQuizAttempt(activeQuiz._id, attemptId);
      const resData = res.data.result || res.data.data?.result || res.data;
      setResult(resData);
      toast.success('Quiz submitted!');
      dispatch(fetchStudentQuizzes()); // refresh attempt summary
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <HelpCircle size={28} color="var(--color-primary-light)" /> My Quizzes
          </h1>
          <p>Test your knowledge with course quizzes</p>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-primary">{quiz.course?.title || 'Quiz'}</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} /> {quiz.durationInMinutes || quiz.timeLimit || 15} mins
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{quiz.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{quiz.description || 'Test your knowledge on this module.'}</p>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <span>{quiz.totalQuestions ?? 0} questions</span>
                    {quiz.attemptSummary?.bestPercentage > 0 && (
                      <span style={{ marginLeft: 8 }}>· Best: {quiz.attemptSummary.bestPercentage}%</span>
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}
                  onClick={() => handleStartQuiz(quiz)}
                  disabled={quiz.attemptSummary?.canStart === false}
                >
                  {quiz.attemptSummary?.hasInProgressAttempt ? 'Resume Quiz' : 'Start Quiz'} <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><HelpCircle size={48} /></div>
            <h3>No quizzes available</h3>
            <p>Enrolled course quizzes will show up here.</p>
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      <Modal isOpen={quizModalOpen} onClose={() => setQuizModalOpen(false)} title={activeQuiz?.title || 'Quiz'}>
        {quizLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><Spinner /></div>

        ) : result ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            {result.isPassed || result.passed ? (
              <CheckCircle size={64} color="var(--color-success)" style={{ margin: '0 auto 1rem' }} />
            ) : (
              <XCircle size={64} color="var(--color-error)" style={{ margin: '0 auto 1rem' }} />
            )}
            <h2>{result.isPassed || result.passed ? 'Congratulations! Quiz Passed 🎉' : 'Quiz Completed'}</h2>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: '1rem 0' }}>
              Score: {result.obtainedMarks ?? result.score} / {result.totalMarks ?? result.total}
              {result.percentage != null && (
                <span style={{ marginLeft: 8, fontSize: '1rem', color: 'var(--text-muted)' }}>({result.percentage}%)</span>
              )}
            </p>
            <button className="btn btn-primary" onClick={() => setQuizModalOpen(false)}>Done</button>
          </div>

        ) : quizQuestions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {quizDetails?.instructions && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                {quizDetails.instructions}
              </p>
            )}

            {quizQuestions.map((q, idx) => (
              <div key={q._id || idx} style={{ background: 'var(--color-bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>
                  {idx + 1}. {q.questionText}
                  {q.questionType === 'multiple_choice' && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                      (Select all that apply)
                    </span>
                  )}
                </p>

                {q.questionType === 'short_answer' ? (
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Type your answer..."
                    value={answers[q._id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q._id]: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {q.options?.map((opt) => {
                      const isSelected = q.questionType === 'multiple_choice'
                        ? Array.isArray(answers[q._id]) && answers[q._id].includes(opt._id)
                        : answers[q._id] === opt._id;
                      return (
                        <label
                          key={opt._id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            cursor: 'pointer', padding: '0.625rem 0.75rem',
                            background: isSelected ? 'rgba(99,102,241,0.15)' : 'transparent',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${isSelected ? 'var(--color-primary-light)' : 'transparent'}`,
                            transition: 'background 0.15s, border-color 0.15s',
                          }}
                        >
                          <input
                            type={q.questionType === 'multiple_choice' ? 'checkbox' : 'radio'}
                            name={`q-${q._id}`}
                            value={opt._id}
                            checked={isSelected}
                            onChange={() => handleSelectOption(q._id, opt._id, q.questionType)}
                            style={{ accentColor: 'var(--color-primary-light)' }}
                          />
                          <span>{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={handleSubmitQuiz}>
              Submit Quiz
            </button>
          </div>

        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No questions found. Please close and try again.
          </div>
        )}
      </Modal>
    </div>
  );
}
