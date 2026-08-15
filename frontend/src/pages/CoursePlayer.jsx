import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublishedModules } from '../api/module.api';
import { getPublishedLectures } from '../api/lecture.api';
import { markLectureCompleted, getCourseProgress } from '../api/progress.api';
import { getEnrollmentByCourse, getMyEnrollments } from '../api/enrollment.api';
import { useAuth } from '../context/AuthContext';
import { CurriculumAccordion } from '../components/course/CurriculumAccordion';
import { Spinner } from '../components/ui/Spinner';
import {
  Award,
  CheckCircle,
  ChevronLeft,
  Download,
  FileText,
  Lock,
  Menu,
  X,
  PlayCircle,
  ExternalLink,
  Sparkles,
  ChevronRight,
  BookOpen,
  Bot,
  Layers,
  CheckCheck,
  RefreshCw,
  PanelRightClose,
  PanelRightOpen,
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
        .filter((l) => l.progress?.isCompleted)
        .map((l) => l._id);
      setCompletedIds(ids);
      setProgressPct(progRes.data.enrollment?.progressPercentage || 0);
    } catch {
      // non-critical
    }
  }, [courseId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let isEnrolled = isAdminOrInstructor;
      if (!isEnrolled && user) {
        try {
          const enrRes = await getEnrollmentByCourse(courseId);
          if (
            enrRes.data?.enrolled ||
            enrRes.data?.enrollment ||
            enrRes.data?.data?.enrollment
          ) {
            isEnrolled = true;
          }
        } catch {
          try {
            const myEnrRes = await getMyEnrollments();
            const list =
              myEnrRes.data.enrollments || myEnrRes.data.data?.enrollments || [];
            isEnrolled = list.some(
              (e) => String(e.course?._id || e.course) === String(courseId)
            );
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
        rawMods.map(async (mod) => {
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Flatten all lectures to calculate next / prev
  const allLectures = modules.flatMap((m) => m.lectures || []);
  const currentIndex = allLectures.findIndex((l) => l._id === activeLecture?._id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allLectures.length - 1;

  const goToPrevLecture = () => {
    if (hasPrev) setActiveLecture(allLectures[currentIndex - 1]);
  };

  const goToNextLecture = () => {
    if (hasNext) setActiveLecture(allLectures[currentIndex + 1]);
  };

  const handleMarkComplete = async () => {
    if (!activeLecture) return;
    setMarking(true);
    try {
      const res = await markLectureCompleted(activeLecture._id);
      setCompletedIds((prev) =>
        prev.includes(activeLecture._id) ? prev : [...prev, activeLecture._id]
      );
      setProgressPct(
        res.data.enrollment?.progressPercentage ??
          Math.min(100, Math.round(((completedIds.length + 1) / allLectures.length) * 100))
      );
      toast.success('Lesson marked as completed!');

      if (hasNext) {
        goToNextLecture();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update progress');
    } finally {
      setMarking(false);
    }
  };

  const isCompleted = completedIds.includes(activeLecture?._id);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-[Inter,sans-serif] animate-pulse">
        <div className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 flex items-center justify-between">
          <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-40" />
          <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-24" />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="w-full max-w-5xl aspect-video mx-auto rounded-2xl bg-gray-200 dark:bg-slate-900 border border-gray-200 dark:border-slate-800" />
            <div className="h-12 w-full rounded-2xl bg-gray-200 dark:bg-slate-900 border border-gray-200 dark:border-slate-800" />
          </div>
          <div className="w-80 border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 hidden md:block">
            <div className="w-32 h-5 rounded-md bg-gray-200 dark:bg-slate-800 mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-gray-100 dark:bg-slate-800/80 border border-gray-200/80 dark:border-slate-800"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-white font-[Inter,sans-serif] overflow-hidden select-none transition-colors duration-200">
      {/* ── Top Navigation Header ─────────────────────────────────────────── */}
      <header className="h-14 bg-white/95 dark:bg-slate-900/95 border-b border-gray-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 z-30 shrink-0 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => {
              if (window.history.length > 1 && window.history.state?.idx > 0) {
                navigate(-1);
              } else {
                navigate(
                  user?.role === 'admin'
                    ? '/admin/courses'
                    : user?.role === 'instructor'
                    ? '/instructor/dashboard'
                    : '/my-learning'
                );
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 text-xs font-semibold text-gray-700 dark:text-slate-200 transition cursor-pointer shrink-0"
            id="back-to-learning-btn"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="h-4 w-px bg-gray-200 dark:bg-slate-800 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[10px] font-bold uppercase tracking-wider shrink-0">
              <BookOpen className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Lesson
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate max-w-sm sm:max-w-md">
              {activeLecture?.title || 'Course Content'}
            </h2>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Ask AI Tutor Link */}
          <Link
            to="/ai-chat"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-bold transition shadow-xs"
            title="Ask AI Tutor about this lecture"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 fill-purple-600/30" />
            <span>AI Tutor</span>
          </Link>

          {/* Certificate Action */}
          {Number(progressPct) >= 100 && (
            <button
              onClick={() => navigate('/certificates')}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Certificate</span>
            </button>
          )}

          {/* Progress Bar */}
          <div className="flex items-center gap-2.5 bg-gray-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-gray-200/90 dark:border-slate-700/60">
            <div className="w-16 sm:w-24 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 font-mono">
              {Number(progressPct).toFixed(0)}%
            </span>
          </div>

          {/* Toggle Syllabus Sidebar */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl transition cursor-pointer"
            title={sidebarOpen ? 'Hide Syllabus' : 'Show Syllabus'}
          >
            {sidebarOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body ────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100/70 dark:bg-slate-950 relative">
          {/* Lecture Viewer Container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {activeLecture ? (
              activeLecture.videoUrl ? (
                /* ── VIDEO PLAYER ── */
                <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                  <div className="w-full max-w-5xl aspect-video max-h-[calc(100vh-140px)] rounded-3xl overflow-hidden shadow-xl border border-gray-200 dark:border-slate-800 bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      src={activeLecture.videoUrl}
                      controls
                      controlsList="nodownload noremoteplayback"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-full object-contain"
                      id="lecture-video"
                    />
                  </div>
                </div>
              ) : activeLecture.documentUrl ? (
                /* ── DOCUMENT / PDF VIEWER ── */
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Slim Integrated Document Toolbar */}
                  <div className="h-12 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                        {activeLecture.title}
                      </span>
                      <span className="hidden sm:inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                        PDF Resource
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={activeLecture.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 transition shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Open in Tab</span>
                      </a>
                      <a
                        href={activeLecture.documentUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>

                  {/* Full Height Embedded PDF */}
                  <div className="flex-1 w-full h-full bg-slate-200/50 dark:bg-slate-950 overflow-hidden">
                    {activeLecture.documentUrl.toLowerCase().includes('.pdf') ? (
                      <iframe
                        src={`${activeLecture.documentUrl}#toolbar=1&navpanes=0`}
                        title={activeLecture.title}
                        className="w-full h-full border-0 bg-white"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-700 dark:text-purple-300">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-white">
                            {activeLecture.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                            Study document attachment ready to view or download.
                          </p>
                        </div>
                        <a
                          href={activeLecture.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md"
                        >
                          <ExternalLink className="w-4 h-4" /> Open Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeLecture.type === 'text' || activeLecture.content ? (
                /* ── TEXT / READING VIEWER ── */
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex justify-center scrollbar-thin bg-white dark:bg-slate-950">
                  <div className="w-full max-w-3xl space-y-4">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" /> Reading Lesson
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                      {activeLecture.title}
                    </h1>
                    <div className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pt-4 border-t border-gray-200 dark:border-slate-800">
                      {activeLecture.content ||
                        activeLecture.description ||
                        'Written lecture notes.'}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── EMPTY / PENDING CONTENT ── */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-white dark:bg-slate-950">
                  <Lock className="w-12 h-12 text-gray-400 dark:text-slate-600" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Content in Preparation
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm">
                    No media file has been attached to this lecture yet.
                  </p>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-950">
                <PlayCircle className="w-16 h-16 text-purple-400/40" />
                <p className="text-sm font-semibold">
                  Select a lecture from the syllabus to start learning
                </p>
              </div>
            )}
          </div>

          {/* ── Bottom Control Bar ─────────────────────────────────────────── */}
          <footer className="h-14 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-sm z-20">
            {/* Prev Button */}
            <button
              onClick={goToPrevLecture}
              disabled={!hasPrev}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-gray-700 dark:text-slate-200 text-xs font-semibold border border-gray-200 dark:border-slate-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Now Playing Title */}
            <div className="text-center min-w-0 px-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold">
                {currentIndex >= 0
                  ? `Lesson ${currentIndex + 1} of ${allLectures.length}`
                  : 'Now Playing'}
              </p>
              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate max-w-xs sm:max-w-md">
                {activeLecture?.title || 'Select Lesson'}
              </p>
            </div>

            {/* Right Actions: Complete & Next */}
            <div className="flex items-center gap-2 shrink-0">
              {!isCompleted ? (
                <button
                  onClick={handleMarkComplete}
                  disabled={marking}
                  className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold px-3.5 sm:px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                  id="mark-complete-btn"
                >
                  {marking ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>{marking ? 'Saving…' : 'Complete'}</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Completed</span>
                </div>
              )}

              <button
                onClick={goToNextLecture}
                disabled={!hasNext}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-gray-800 dark:text-white text-xs font-bold border border-gray-200 dark:border-slate-700 transition cursor-pointer"
                id="next-lecture-btn"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </main>

        {/* ── Right Sidebar: Course Syllabus ──────────────────────────────── */}
        <aside
          className={`${
            sidebarOpen ? 'w-80 sm:w-90' : 'w-0 -translate-x-full'
          } transition-all duration-300 ease-in-out shrink-0 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-lg z-20`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gray-50/80 dark:bg-slate-900/80">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Course Syllabus
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                {allLectures.length} lessons total
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-white dark:bg-slate-900">
            <CurriculumAccordion
              modules={modules}
              completedLectureIds={completedIds}
              activeLectureId={activeLecture?._id}
              onLectureSelect={setActiveLecture}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
