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

      const modsRes = await getPublishedModules(courseId);
      const rawMods = modsRes.data.modules || [];

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

      const firstLecture = modsWithLectures[0]?.lectures?.[0];
      if (firstLecture) setActiveLecture(firstLecture);

      await fetchProgress();

    } catch (err) {
      toast.error('Failed to load course');
      navigate('/my-learning');
    } finally {
      setLoading(false);
    }
  }, [courseId, navigate, fetchProgress, isAdminOrInstructor, user]);

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
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-4 z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/my-learning')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
            id="back-to-learning-btn"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-4 w-px bg-gray-200 dark:bg-slate-800 hidden sm:block" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">
            {activeLecture?.title || 'Select a Lecture'}
          </h2>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {Number(progressPct) >= 100 && (
            <button
              onClick={() => navigate('/certificates')}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs"
              title="View Certificate"
            >
              <Award className="w-4 h-4" /> Certificate
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-24 sm:w-32 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {Number(progressPct).toFixed(0)}%
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
            id="toggle-sidebar-btn"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Area: Video Player & Lecture Info */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-black dark:bg-slate-950">
          <div className="flex-1 flex items-center justify-center bg-black min-h-[350px] lg:min-h-[480px]">
            {activeLecture ? (
              activeLecture.videoUrl ? (
                <video
                  ref={videoRef}
                  src={activeLecture.videoUrl}
                  controls
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={e => e.preventDefault()}
                  className="w-full max-h-[calc(100vh-220px)] object-contain"
                  id="lecture-video"
                />
              ) : activeLecture.documentUrl ? (
                <div className="w-full max-w-4xl p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between bg-gray-900 text-white p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-400" />
                      <div>
                        <h3 className="text-base font-bold">{activeLecture.title}</h3>
                        <p className="text-xs text-gray-400">Resource Document Attached</p>
                      </div>
                    </div>
                    <a
                      href={activeLecture.documentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                    >
                      <Download className="w-4 h-4" /> Download Document
                    </a>
                  </div>

                  {activeLecture.documentUrl.toLowerCase().includes('.pdf') ? (
                    <iframe
                      src={activeLecture.documentUrl}
                      title={activeLecture.title}
                      className="w-full h-[500px] rounded-xl border border-slate-800 bg-white"
                    />
                  ) : (
                    <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-4">
                      <FileText className="w-12 h-12 text-blue-400 mx-auto" />
                      <p className="text-sm text-gray-300">Click below to view the attached document file.</p>
                      <a href={activeLecture.documentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg">
                        Open Document
                      </a>
                    </div>
                  )}
                </div>
              ) : (activeLecture.type === 'text' || activeLecture.content) ? (
                <div className="w-full max-w-3xl p-8 bg-slate-900 text-white border border-slate-800 rounded-2xl space-y-4 m-4">
                  <h3 className="text-xl font-bold text-blue-400">{activeLecture.title}</h3>
                  <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {activeLecture.content || activeLecture.description || 'Written material for this lecture.'}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <Lock className="w-12 h-12 text-gray-600 mx-auto" />
                  <h3 className="text-base font-bold text-gray-300">Content Pending</h3>
                  <p className="text-xs text-gray-500">No playable content available for this lecture yet.</p>
                </div>
              )
            ) : (
              <p className="text-sm text-gray-500">Select a lecture from the sidebar to start</p>
            )}
          </div>

          {/* Lecture Info & Navigation Controls */}
          {activeLecture && (
            <div className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{activeLecture.title}</h3>
                {activeLecture.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{activeLecture.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!isCompleted ? (
                  <button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs"
                    id="mark-complete-btn"
                  >
                    {marking ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Mark Complete</>
                    )}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl">
                    <CheckCircle className="w-4 h-4" /> Completed
                  </div>
                )}

                <button
                  onClick={goToNextLecture}
                  className="inline-flex items-center gap-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition"
                  id="next-lecture-btn"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Course Content */}
        {sidebarOpen && (
          <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 overflow-y-auto p-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-200 dark:border-slate-800 mb-4">
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
