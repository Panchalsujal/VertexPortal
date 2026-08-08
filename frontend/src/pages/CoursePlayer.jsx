import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublishedModules } from '../api/module.api';
import { getPublishedLectures } from '../api/lecture.api';
import { markLectureCompleted, getCourseProgress } from '../api/progress.api';
import { getEnrollmentByCourse, getMyEnrollments } from '../api/enrollment.api';
import { useAuth } from '../context/AuthContext';
import { CurriculumAccordion } from '../components/course/CurriculumAccordion';
import { Spinner } from '../components/ui/Spinner';
import { Award, CheckCircle, ChevronLeft, Download, FileText, Lock, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoursePlayer() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [activeLecture, setActiveLecture] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [progressPct, setProgressPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [marking, setMarking] = useState(false);
  const videoRef = useRef(null);

  const isAdminOrInstructor = user?.role === 'admin' || user?.role === 'instructor';

  const fetchProgress = useCallback(async () => {
    try {
      const progRes = await getCourseProgress(courseId);
      const lectureList = progRes.data.lectures || [];
      const ids = lectureList
        .filter(l => l.progress?.isCompleted)
        .map(l => l._id);
      setCompletedIds(ids);
      setProgressPct(progRes.data.enrollment?.progressPercentage || 0);
    } catch {
      // progress fetch failure is non-critical
    }
  }, [courseId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Check enrollment (allow Admin or Instructor testing bypass)
      let isEnrolled = isAdminOrInstructor;
      if (!isEnrolled && user) {
        try {
          const enrRes = await getEnrollmentByCourse(courseId);
          if (enrRes.data?.enrolled || enrRes.data?.enrollment || enrRes.data?.data?.enrollment) {
            isEnrolled = true;
          }
        } catch {
          try {
            const myEnrRes = await getMyEnrollments();
            const list = myEnrRes.data.enrollments || myEnrRes.data.data?.enrollments || [];
            isEnrolled = list.some(e => String(e.course?._id || e.course) === String(courseId));
          } catch {
            isEnrolled = false;
          }
        }
      }

      if (!isEnrolled) {
        toast.error('You are not enrolled in this course');
        navigate('/courses');
        return;
      }

      // 2. Fetch published modules — backend: { modules: [...] }
      const modsRes = await getPublishedModules(courseId);
      const rawMods = modsRes.data.modules || [];

      // 3. For each module fetch its lectures — backend: { lectures: [...] }
      const modsWithLectures = await Promise.all(
        rawMods.map(async mod => {
          try {
            const lr = await getPublishedLectures(mod._id);
            return { ...mod, lectures: lr.data.lectures || [] };
          } catch {
            return { ...mod, lectures: [] };
          }
        })
      );
      setModules(modsWithLectures);

      // 4. Auto-select first lecture
      const firstLecture = modsWithLectures[0]?.lectures?.[0];
      if (firstLecture) setActiveLecture(firstLecture);

      // 5. Fetch progress
      await fetchProgress();

    } catch (err) {
      toast.error('Failed to load course');
      navigate('/my-learning');
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate, fetchProgress]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkComplete = async () => {
    if (!activeLecture || marking) return;
    setMarking(true);
    try {
      await markLectureCompleted(activeLecture._id);
      toast.success('Lecture marked as complete!');
      await fetchProgress();
      goToNextLecture();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMarking(false);
    }
  };

  const goToNextLecture = () => {
    const allLectures = modules.flatMap(m => m.lectures || []);
    const idx = allLectures.findIndex(l => l._id === activeLecture?._id);
    if (idx < allLectures.length - 1) setActiveLecture(allLectures[idx + 1]);
  };

  const isCompleted = activeLecture && completedIds.includes(activeLecture._id);

  if (loading) return <div className="page-loader"><Spinner /></div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 70 }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        padding: '0.75rem 1.5rem',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 10,
      }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-learning')} id="back-to-learning-btn">
          <ChevronLeft size={16} /> Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeLecture?.title || 'Select a Lecture'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {Number(progressPct) >= 100 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/certificates')}
              style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
              title="View Certificate"
            >
              <Award size={14} /> Certificate
            </button>
          )}
          <div className="progress-bar-wrap" style={{ width: 120 }}>
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {Number(progressPct).toFixed(0)}% complete
          </span>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setSidebarOpen(o => !o)}
          id="toggle-sidebar-btn"
        >
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'auto', background: '#000' }}>
          {activeLecture ? (
            <>
              {activeLecture.videoUrl ? (
                <video
                  ref={videoRef}
                  src={activeLecture.videoUrl}
                  controls
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={e => e.preventDefault()}
                  style={{
                    width: '100%',
                    maxHeight: 'calc(100vh - 180px)',
                    display: 'block',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                  id="lecture-video"
                />
              ) : activeLecture.documentUrl ? (
                <div style={{ padding: '2rem', background: 'var(--color-bg)', minHeight: 450, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <FileText size={36} color="var(--color-primary-light)" />
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{activeLecture.title}</h3>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Resource Document Attached</p>
                      </div>
                    </div>
                    <a
                      href={activeLecture.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                      id="open-document-btn"
                    >
                      <Download size={16} /> View / Download Document
                    </a>
                  </div>

                  {activeLecture.documentUrl.toLowerCase().includes('.pdf') ? (
                    <iframe
                      src={activeLecture.documentUrl}
                      title={activeLecture.title}
                      style={{ width: '100%', height: '550px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: '#fff' }}
                    />
                  ) : (
                    <div style={{ padding: '2.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                      <FileText size={48} color="var(--color-primary-light)" style={{ marginBottom: '1rem' }} />
                      <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Click below to open and view the attached resource document file.</p>
                      <a href={activeLecture.documentUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                        Open Attached Document
                      </a>
                    </div>
                  )}

                  {activeLecture.content && (
                    <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', lineHeight: 1.8, fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                      {activeLecture.content}
                    </div>
                  )}
                </div>
              ) : (activeLecture.type === 'text' || activeLecture.content) ? (
                <div style={{ padding: '3rem', background: 'var(--color-bg)', minHeight: 400 }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>{activeLecture.title}</h3>
                  <div style={{ lineHeight: 1.8, fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                    {activeLecture.content || activeLecture.description || 'Written material for this lecture.'}
                  </div>
                </div>
              ) : activeLecture.type === 'document' ? (
                <div style={{ padding: '3rem', background: 'var(--color-bg)', textAlign: 'center', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <FileText size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                  <h3>Document Pending</h3>
                  <p style={{ color: 'var(--text-muted)' }}>No document file has been uploaded for this lecture yet.</p>
                </div>
              ) : activeLecture.isLocked ? (
                <div style={{ padding: '3rem', background: 'var(--color-bg)', textAlign: 'center', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <Lock size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                  <h3>Lecture Locked</h3>
                  <p>Please log in and enroll to access this course material.</p>
                </div>
              ) : (
                <div style={{ padding: '3rem', background: 'var(--color-bg)', textAlign: 'center', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <Lock size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
                  <h3>Content not available</h3>
                  <p>This lecture has no playable content yet.</p>
                </div>
              )}

              {/* Lecture Info Bar */}
              <div style={{ padding: '1.5rem', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>{activeLecture.title}</h3>
                    {activeLecture.description && <p style={{ fontSize: '0.9375rem' }}>{activeLecture.description}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {!isCompleted && (
                      <button
                        className="btn btn-primary"
                        onClick={handleMarkComplete}
                        disabled={marking}
                        id="mark-complete-btn"
                      >
                        {marking ? <div className="spinner spinner-sm" /> : <><CheckCircle size={16} /> Mark Complete</>}
                      </button>
                    )}
                    {isCompleted && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)' }}>
                        <CheckCircle size={18} /> Completed
                      </div>
                    )}
                    <button className="btn btn-secondary" onClick={goToNextLecture} id="next-lecture-btn">
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>Select a lecture from the sidebar to start</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div style={{
            width: 340, flexShrink: 0,
            background: 'var(--color-surface)',
            borderLeft: '1px solid var(--color-border)',
            overflow: 'auto',
            padding: '1rem',
          }}>
            <h4 style={{ padding: '0.5rem 0 1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
              Course Content
            </h4>
            <CurriculumAccordion
              modules={modules}
              completedLectureIds={completedIds}
              activeLectureId={activeLecture?._id}
              onLectureSelect={setActiveLecture}
            />
          </div>
        )}
      </div>
    </div>
  );
}
