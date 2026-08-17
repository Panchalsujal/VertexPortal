import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPublishedModules } from '../api/module.api';
import { getPublishedLectures } from '../api/lecture.api';
import { markLectureCompleted, getCourseProgress } from '../api/progress.api';
import { getEnrollmentByCourse, getMyEnrollments } from '../api/enrollment.api';
import { createNote, getLectureNotes, deleteNote } from '../api/notes.api';
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
  Clock,
  Trash2,
  Plus,
  Code2,
  Info,
  MessageSquare,
  Share2,
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
  const [sidebarTab, setSidebarTab] = useState('syllabus'); // 'syllabus' | 'notes'
  const [mobileTab, setMobileTab] = useState('overview'); // 'overview' | 'syllabus' | 'notes' | 'ai'
  const [notes, setNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteTimestamp, setNoteTimestamp] = useState(null);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [marking, setMarking] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
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

  // Fetch lecture notes when active lecture changes
  useEffect(() => {
    if (!activeLecture?._id) return;
    let isMounted = true;
    async function loadNotes() {
      try {
        const res = await getLectureNotes(activeLecture._id);
        const list = res.data?.notes || res.data?.data || [];
        if (isMounted) setNotes(Array.isArray(list) ? list : []);
      } catch {
        if (isMounted) setNotes([]);
      }
    }
    loadNotes();
    return () => {
      isMounted = false;
    };
  }, [activeLecture?._id]);

  // Video Resume playback handlers
  const handleVideoLoadedMetadata = () => {
    if (!videoRef.current || !activeLecture?._id) return;
    const resumeKey = `vp_resume_${courseId}_${activeLecture._id}`;
    const savedTime = localStorage.getItem(resumeKey);
    if (savedTime) {
      const parsed = parseFloat(savedTime);
      if (!isNaN(parsed) && parsed > 0 && parsed < (videoRef.current.duration - 5)) {
        videoRef.current.currentTime = parsed;
        toast('Resumed playback position', { icon: '⏱️', id: 'resume-toast' });
      }
    }
  };

  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || !activeLecture?._id) return;
    const current = videoRef.current.currentTime;
    if (current > 3) {
      localStorage.setItem(`vp_resume_${courseId}_${activeLecture._id}`, current.toString());
    }
  };

  const captureTimestamp = () => {
    if (videoRef.current) {
      const sec = Math.floor(videoRef.current.currentTime || 0);
      setNoteTimestamp(sec);
      toast.success(`Tagged video at ${formatTimestamp(sec)}`);
    } else {
      toast.error('No video is currently playing');
    }
  };

  const formatTimestamp = (sec) => {
    if (sec === null || sec === undefined || isNaN(sec)) return null;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeekToTimestamp = (sec) => {
    if (videoRef.current && sec !== null && sec !== undefined) {
      videoRef.current.currentTime = sec;
      videoRef.current.play?.();
    }
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !activeLecture?._id) return;
    const content = newNoteContent.trim();
    const timestamp = noteTimestamp;
    setNewNoteContent('');
    setNoteTimestamp(null);

    const tempId = 'temp-' + Date.now();
    const tempNote = {
      _id: tempId,
      lectureId: activeLecture._id,
      content,
      timestampInSeconds: timestamp,
      createdAt: new Date().toISOString(),
    };

    setNotes((prev) => [tempNote, ...prev]);
    toast.success('Note saved!');

    try {
      const res = await createNote({
        lectureId: activeLecture._id,
        content,
        timestampInSeconds: timestamp,
      });
      const created = res.data?.note || res.data?.data;
      if (created) {
        setNotes((prev) => prev.map((n) => (n._id === tempId ? created : n)));
      }
    } catch (err) {
      setNotes((prev) => prev.filter((n) => n._id !== tempId));
      toast.error(err?.response?.data?.message || err.message || 'Failed to save note. Rolled back.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    const prevNotes = [...notes];
    setNotes((prev) => prev.filter((n) => n._id !== noteId));
    toast.success('Note deleted');

    try {
      await deleteNote(noteId);
    } catch (err) {
      setNotes(prevNotes);
      toast.error(err?.response?.data?.message || err.message || 'Failed to delete note. Action rolled back.');
    }
  };

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
    const currentLectureId = activeLecture._id;
    const prevCompleted = [...completedIds];
    const prevPct = progressPct;

    const newCompleted = prevCompleted.includes(currentLectureId)
      ? prevCompleted
      : [...prevCompleted, currentLectureId];
    const newPct = Math.min(100, Math.round((newCompleted.length / Math.max(1, allLectures.length)) * 100));

    // Optimistically update
    setCompletedIds(newCompleted);
    setProgressPct(newPct);
    toast.success('Lesson marked as completed! 🎉');

    if (hasNext) {
      goToNextLecture();
    }

    try {
      const res = await markLectureCompleted(currentLectureId);
      if (res.data?.enrollment?.progressPercentage !== undefined) {
        setProgressPct(res.data.enrollment.progressPercentage);
      }
    } catch (err) {
      // Rollback
      setCompletedIds(prevCompleted);
      setProgressPct(prevPct);
      toast.error(err?.response?.data?.message || err.message || 'Failed to update progress. Action rolled back.');
    }
  };

  const isCompleted = completedIds.includes(activeLecture?._id);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#0b0f19] text-gray-900 dark:text-slate-100 font-[Inter,sans-serif] animate-pulse">
        <div className="h-14 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-slate-800 px-6 flex items-center justify-between">
          <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-40" />
          <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-24" />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="w-full max-w-5xl aspect-video mx-auto rounded-2xl bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700" />
            <div className="h-12 w-full rounded-2xl bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700" />
          </div>
          <div className="w-80 border-l border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3 hidden md:block">
            <div className="w-32 h-5 rounded-md bg-gray-200 dark:bg-slate-800 mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#0b0f19] text-gray-900 dark:text-slate-100 font-[Inter,sans-serif] overflow-hidden select-none transition-colors duration-200">
      {/* ── Top Navigation Header ─────────────────────────────────────────── */}
      <header className="h-14 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-3 z-30 shrink-0 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 hover:border-purple-300 dark:hover:border-purple-600/50 text-xs font-semibold text-gray-700 dark:text-slate-200 transition cursor-pointer shrink-0"
            id="back-to-learning-btn"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back</span>
          </button>

          <div className="h-4 w-px bg-gray-200 dark:bg-slate-800 hidden sm:block shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-md">
              {activeLecture?.title || 'Course Content'}
            </h2>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Ask AI Tutor Link */}
          <Link
            to="/ai-chat"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-bold transition shadow-xs"
            title="Ask AI Tutor about this lecture"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 fill-purple-600/30" />
            <span>AI Tutor</span>
          </Link>

          {/* Code Playground Link */}
          <Link
            to="/playground"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 text-xs font-bold transition shadow-xs"
            title="Open Code Playground in new tab"
          >
            <Code2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Playground</span>
          </Link>

          {/* Certificate Action */}
          {Number(progressPct) >= 100 && (
            <button
              onClick={() => navigate('/certificates')}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Certificate</span>
            </button>
          )}

          {/* Progress Bar */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800/90 px-2.5 sm:px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700/80">
            <div className="w-12 sm:w-20 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
            className="p-2 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl transition cursor-pointer"
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
        <main className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50/70 dark:bg-[#07090e] scrollbar-thin">
          {/* Lecture Cinema Stage */}
          <div className="w-full bg-black flex items-center justify-center border-b border-gray-200 dark:border-slate-800/80 shrink-0">
            <div className="w-full max-w-5xl aspect-video max-h-[58vh] sm:max-h-[64vh] flex items-center justify-center relative bg-black">
              {activeLecture ? (
                activeLecture.videoUrl ? (
                  /* ── VIDEO PLAYER ── */
                  <video
                    ref={videoRef}
                    src={activeLecture.videoUrl}
                    controls
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    onTimeUpdate={handleVideoTimeUpdate}
                    className="w-full h-full object-contain"
                    id="lecture-video"
                  />
                ) : activeLecture.documentUrl ? (
                  /* ── DOCUMENT PREVIEW ── */
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-gray-900">
                    <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-purple-300">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white">{activeLecture.title}</h4>
                      <p className="text-xs text-gray-300 mt-1">Study document attachment ready to view or download.</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <a
                        href={activeLecture.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Document
                      </a>
                      <a
                        href={activeLecture.documentUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                ) : activeLecture.type === 'text' || activeLecture.content ? (
                  /* ── TEXT / READING ── */
                  <div className="w-full h-full overflow-y-auto p-6 flex flex-col justify-center items-center bg-gray-900 text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                      Reading Lesson
                    </span>
                    <h3 className="text-xl font-bold text-white max-w-lg mb-3">{activeLecture.title}</h3>
                    <p className="text-xs text-gray-300 max-w-md line-clamp-4 leading-relaxed">
                      {activeLecture.content || activeLecture.description || 'Written reading material.'}
                    </p>
                  </div>
                ) : (
                  /* ── PENDING MEDIA ── */
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 bg-gray-900">
                    <Lock className="w-10 h-10 text-gray-500" />
                    <h4 className="text-sm font-bold text-white">Content in Preparation</h4>
                    <p className="text-xs text-gray-400 max-w-sm">No media file has been attached yet.</p>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 bg-gray-900 text-gray-400">
                  <PlayCircle className="w-12 h-12 text-purple-400/40" />
                  <p className="text-xs font-semibold">Select a lesson to begin</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Below-Video Interactive Tabs & Details ──────────────────────── */}
          <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-5 bg-white dark:bg-[#07090e]">
            {/* Lecture Meta & Tabs Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                    {currentIndex >= 0 ? `Lesson ${currentIndex + 1} of ${allLectures.length}` : 'Lesson'}
                  </span>
                  {activeLecture?.duration && (
                    <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" /> {activeLecture.duration}
                    </span>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {activeLecture?.title || 'Lesson Overview'}
                </h1>
              </div>

              {/* Action Buttons on top right */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleMarkComplete}
                  disabled={marking || isCompleted}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30'
                  }`}
                >
                  {isCompleted ? <CheckCheck className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  <span>{isCompleted ? 'Completed' : marking ? 'Saving…' : 'Mark as Complete'}</span>
                </button>
              </div>
            </div>

            {/* In-Page Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800/80 pb-2 overflow-x-auto scrollbar-none">
              {[
                { id: 'overview', label: 'Overview', icon: Info },
                { id: 'syllabus', label: `Syllabus (${allLectures.length})`, icon: Layers },
                { id: 'notes', label: `My Notes (${notes.length})`, icon: FileText },
                { id: 'ai', label: 'AI Doubt Solver', icon: Sparkles },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMobileTab(id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    mobileTab === id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-slate-800/70 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content Panels */}
            {mobileTab === 'overview' && (
              <div className="space-y-4">
                {activeLecture?.description ? (
                  <div className="bg-gray-50/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Lesson Description</h3>
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {activeLecture.description}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-xs">
                    No additional description provided for this lesson.
                  </div>
                )}

                {/* Quick Resources & Downloads */}
                {activeLecture?.documentUrl && (
                  <div className="bg-gray-50/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Lesson Resource File</h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">PDF and supplemental study documents</p>
                      </div>
                    </div>
                    <a
                      href={activeLecture.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                )}
              </div>
            )}

            {mobileTab === 'syllabus' && (
              <div className="bg-gray-50/90 dark:bg-slate-900/90 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800">
                <CurriculumAccordion
                  modules={modules}
                  completedLectureIds={completedIds}
                  activeLectureId={activeLecture?._id}
                  onLectureSelect={setActiveLecture}
                />
              </div>
            )}

            {mobileTab === 'notes' && (
              <div className="bg-gray-50/90 dark:bg-slate-900/90 rounded-2xl p-4 border border-gray-200/80 dark:border-slate-800 space-y-4">
                {/* Note creation form */}
                <form onSubmit={handleCreateNote} className="space-y-2.5">
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Take notes with optional video timestamp..."
                    rows={3}
                    className="w-full text-xs bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none shadow-2xs"
                  />
                  <div className="flex items-center justify-between gap-2">
                    {activeLecture?.videoUrl ? (
                      <button
                        type="button"
                        onClick={captureTimestamp}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                          noteTimestamp !== null
                            ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-300'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {noteTimestamp !== null ? `Tagged: ${formatTimestamp(noteTimestamp)}` : '📍 Tag Current Video Time'}
                      </button>
                    ) : <div />}

                    <button
                      type="submit"
                      disabled={submittingNote || !newNoteContent.trim()}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Save Note
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                  {notes.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 dark:text-slate-400 text-xs">
                      No notes saved for this lesson yet.
                    </div>
                  ) : (
                    notes.map((n) => (
                      <div key={n._id} className="p-3 bg-white dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700/60 rounded-xl space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          {n.timestampInSeconds !== null && n.timestampInSeconds !== undefined ? (
                            <button
                              type="button"
                              onClick={() => handleSeekToTimestamp(n.timestampInSeconds)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-mono font-bold hover:bg-purple-100 cursor-pointer"
                            >
                              <Clock className="w-2.5 h-2.5" /> {formatTimestamp(n.timestampInSeconds)}
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">Note</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(n._id)}
                            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{n.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {mobileTab === 'ai' && (
              <div className="bg-gray-50/90 dark:bg-slate-900/90 rounded-2xl p-5 border border-gray-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">AI Doubt Solver</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Ask questions about "{activeLecture?.title || 'this lesson'}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask AI anything about this lesson..."
                    className="flex-1 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-2xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && aiQuestion.trim()) {
                        navigate(`/ai-chat?q=${encodeURIComponent(aiQuestion.trim())}`);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (aiQuestion.trim()) {
                        navigate(`/ai-chat?q=${encodeURIComponent(aiQuestion.trim())}`);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Ask AI
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Sticky Bottom Control Bar ──────────────────────────────────── */}
          <footer className="sticky bottom-0 h-14 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-3 shrink-0 shadow-lg z-20">
            {/* Prev Button */}
            <button
              onClick={goToPrevLecture}
              disabled={!hasPrev}
              className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-gray-700 dark:text-slate-200 text-xs font-bold border border-gray-200 dark:border-slate-700 transition cursor-pointer shrink-0"
              title="Previous Lesson"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Now Playing Title - Sized Responsively */}
            <div className="text-center min-w-0 px-2 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold block sm:inline sm:mr-2">
                {currentIndex >= 0 ? `Lesson ${currentIndex + 1} of ${allLectures.length}` : 'Now Playing'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate inline-block max-w-[130px] xs:max-w-[200px] sm:max-w-md align-bottom">
                {activeLecture?.title || 'Select Lesson'}
              </span>
            </div>

            {/* Right Actions: Complete & Next */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handleMarkComplete}
                disabled={marking || isCompleted}
                className={`inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                id="mark-complete-btn"
              >
                {isCompleted ? <CheckCheck className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">{isCompleted ? 'Done' : marking ? 'Saving…' : 'Complete'}</span>
              </button>

              <button
                onClick={goToNextLecture}
                disabled={!hasNext}
                className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-gray-700 dark:text-slate-200 text-xs font-bold border border-gray-200 dark:border-slate-700 transition cursor-pointer shrink-0"
                id="next-lecture-btn"
                title="Next Lesson"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </main>

        {/* ── Right Sidebar: Desktop Syllabus & Notes ─────────────────────── */}
        <aside
          className={`${
            sidebarOpen ? 'w-80 sm:w-96' : 'w-0 -translate-x-full'
          } transition-all duration-300 ease-in-out shrink-0 bg-white dark:bg-[#111827] border-l border-gray-200 dark:border-slate-800 flex flex-col h-full overflow-hidden shadow-xl z-20`}
        >
          {/* Tab Header: Syllabus vs Notes */}
          <div className="p-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gray-50/80 dark:bg-slate-900/90 gap-2">
            <div className="flex items-center gap-1 bg-gray-200/70 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setSidebarTab('syllabus')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'syllabus'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Syllabus
              </button>
              <button
                onClick={() => setSidebarTab('notes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'notes'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Notes ({notes.length})
              </button>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {sidebarTab === 'syllabus' ? (
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-white dark:bg-[#111827]">
              <CurriculumAccordion
                modules={modules}
                completedLectureIds={completedIds}
                activeLectureId={activeLecture?._id}
                onLectureSelect={setActiveLecture}
              />
            </div>
          ) : (
            /* Notes Tab */
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#111827]">
              {/* Create Note Form */}
              <form onSubmit={handleCreateNote} className="p-3 border-b border-gray-200 dark:border-slate-800 space-y-2">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Take a note for this lesson..."
                  rows={3}
                  className="w-full text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-2.5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-purple-500 resize-none shadow-2xs"
                />
                <div className="flex items-center justify-between gap-2">
                  {activeLecture?.videoUrl ? (
                    <button
                      type="button"
                      onClick={captureTimestamp}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition cursor-pointer ${
                        noteTimestamp !== null
                          ? 'bg-purple-50 dark:bg-purple-950 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300'
                          : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {noteTimestamp !== null ? `Tagged: ${formatTimestamp(noteTimestamp)}` : '📍 Tag Current Time'}
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={submittingNote || !newNoteContent.trim()}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-slate-500">
                    <FileText className="w-8 h-8 mx-auto mb-1 opacity-40" />
                    <p className="text-xs font-semibold">No notes for this lesson</p>
                    <p className="text-[11px]">Type above to save your first note.</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note._id}
                      className="p-3 bg-gray-50 dark:bg-slate-800/70 border border-gray-200 dark:border-slate-700/60 rounded-xl space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {note.timestampInSeconds !== null && note.timestampInSeconds !== undefined ? (
                          <button
                            type="button"
                            onClick={() => handleSeekToTimestamp(note.timestampInSeconds)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-mono font-bold hover:bg-purple-100 transition cursor-pointer"
                            title="Click to jump to this video time"
                          >
                            <Clock className="w-2.5 h-2.5" /> {formatTimestamp(note.timestampInSeconds)}
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">Note</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note._id)}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 transition cursor-pointer"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
