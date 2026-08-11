import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublishedModules } from '../api/module.api';
import { getPublishedLectures } from '../api/lecture.api';
import { markLectureCompleted, getCourseProgress } from '../api/progress.api';
import { getEnrollmentByCourse, getMyEnrollments } from '../api/enrollment.api';
import { useAuth } from '../context/AuthContext';
import { CurriculumAccordion } from '../components/course/CurriculumAccordion';
import { Spinner } from '../components/ui/Spinner';
import {
  Award, CheckCircle, ChevronLeft, Download, FileText, Lock, Menu, X,
  PlayCircle, ExternalLink, Sparkles, ChevronRight, BookOpen
} from 'lucide-react';
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
      toast.error(err.message || 'Failed to update status');
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
    <div className="flex flex-col h-screen bg-slate-950 text-white font-[Inter,sans-serif] overflow-hidden">
      {/* Top Navigation Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between gap-4 z-20 shrink-0 shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              if (window.history.length > 1 && window.history.state?.idx > 0) {
                navigate(-1);
              } else {
                navigate(user?.role === 'admin' ? '/admin/courses' : user?.role === 'instructor' ? '/instructor/dashboard' : '/my-learning');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-purple-600 hover:border-purple-500 text-xs font-semibold text-gray-200 hover:text-white transition cursor-pointer shrink-0"
            id="back-to-learning-btn"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-bold uppercase tracking-wider shrink-0">
              <BookOpen className="w-3 h-3" /> Lecture
            </span>
            <h2 className="text-sm font-bold text-white truncate">
              {activeLecture?.title || 'Select a Lecture'}
            </h2>
          </div>
        </div>

        {/* Right Status Actions & Progress */}
        <div className="flex items-center gap-4 shrink-0">
          {Number(progressPct) >= 100 && (
            <button
              onClick={() => navigate('/certificates')}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-md shadow-emerald-950/40"
              title="View Earned Certificate"
            >
              <Award className="w-4 h-4" /> Certificate
            </button>
          )}

          <div className="hidden sm:flex items-center gap-3 bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-700/60">
            <div className="w-28 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-purple-300">
              {Number(progressPct).toFixed(0)}%
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
            id="toggle-sidebar-btn"
            title={sidebarOpen ? "Hide Course Sidebar" : "Show Course Sidebar"}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content (Player + Bottom Bar) */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
          <div className="flex-1 flex items-center justify-center p-4 lg:p-6 min-h-[400px]">
            {activeLecture ? (
              activeLecture.videoUrl ? (
                <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
                  <video
                    ref={videoRef}
                    src={activeLecture.videoUrl}
                    controls
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={e => e.preventDefault()}
                    className="w-full max-h-[calc(100vh-250px)] object-contain mx-auto"
                    id="lecture-video"
                  />
                </div>
              ) : activeLecture.documentUrl ? (
                <div className="w-full max-w-5xl flex flex-col gap-4">
                  {/* Styled Header Card for Document */}
                  <div className="flex flex-wrap items-center justify-between bg-slate-900 border border-slate-800 p-4 px-6 rounded-2xl shadow-xl gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{activeLecture.title}</h3>
                        <p className="text-xs text-gray-400">Attached Study Resource Document</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={activeLecture.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                      </a>
                      <a
                        href={activeLecture.documentUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-lg shadow-purple-950/50"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>

                  {/* Document Embed Container */}
                  <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-2xl min-h-[520px]">
                    {activeLecture.documentUrl.toLowerCase().includes('.pdf') ? (
                      <iframe
                        src={activeLecture.documentUrl}
                        title={activeLecture.title}
                        className="w-full h-[600px] border-0"
                      />
                    ) : (
                      <div className="p-12 text-center space-y-4 my-auto">
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-purple-400">
                          <FileText className="w-8 h-8" />
                        </div>
                        <h4 className="text-lg font-bold text-white">Attachment Ready</h4>
                        <p className="text-sm text-gray-400 max-w-md mx-auto">
                          Click below to open or view the attached resource document.
                        </p>
                        <a
                          href={activeLecture.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg transition"
                        >
                          <ExternalLink className="w-4 h-4" /> View Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (activeLecture.type === 'text' || activeLecture.content) ? (
                <div className="w-full max-w-4xl p-8 bg-slate-900 text-white border border-slate-800 rounded-2xl space-y-4 shadow-2xl m-4">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> Reading Material
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">{activeLecture.title}</h3>
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap pt-2 border-t border-slate-800">
                    {activeLecture.content || activeLecture.description || 'Written material for this lecture.'}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-2xl max-w-md">
                  <Lock className="w-12 h-12 text-gray-500 mx-auto" />
                  <h3 className="text-base font-bold text-white">Content Pending</h3>
                  <p className="text-xs text-gray-400">No playable content uploaded for this lecture yet.</p>
                </div>
              )
            ) : (
              <div className="text-center py-16 space-y-3">
                <PlayCircle className="w-16 h-16 text-purple-500/40 mx-auto" />
                <p className="text-sm font-semibold text-gray-400">Select a lecture from the sidebar to start learning</p>
              </div>
            )}
          </div>

          {/* Lecture Controls & Info Bottom Bar */}
          {activeLecture && (
            <div className="bg-slate-900 border-t border-slate-800 p-5 px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 shadow-2xl">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Now Playing</span>
                <h3 className="text-lg font-bold text-white leading-tight">{activeLecture.title}</h3>
                {activeLecture.description && (
                  <p className="text-xs text-gray-400 mt-1 max-w-3xl line-clamp-2">{activeLecture.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {!isCompleted ? (
                  <button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-purple-950/50 cursor-pointer"
                    id="mark-complete-btn"
                  >
                    {marking ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Mark as Complete</>
                    )}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-4 py-2.5 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Completed
                  </div>
                )}

                <button
                  onClick={goToNextLecture}
                  className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-5 py-3 rounded-xl border border-slate-700 transition cursor-pointer"
                  id="next-lecture-btn"
                >
                  Next Lecture <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Course Content */}
        {sidebarOpen && (
          <aside className="w-80 shrink-0 bg-slate-900 border-l border-slate-800 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Course Syllabus</span>
                <span className="text-xs font-normal text-purple-400">{modules.reduce((acc, m) => acc + (m.lectures?.length || 0), 0)} items</span>
              </h4>
            </div>

            <div className="dark">
              <CurriculumAccordion
                modules={modules}
                completedLectureIds={completedIds}
                activeLectureId={activeLecture?._id}
                onLectureSelect={setActiveLecture}
              />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
