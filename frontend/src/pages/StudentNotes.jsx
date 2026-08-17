import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchCourseNotes, addNote, editNote, removeNote,
  selectNotes, selectNotesLoading,
} from '../store/slices/notesSlice';
import { getMyEnrollments } from '../api/enrollment.api';
import { getPublishedModules } from '../api/module.api';
import { getPublishedLectures } from '../api/lecture.api';
import {
  BookOpenIcon,
  VideoIcon,
  SparklesIcon,
} from '@animateicons/react/lucide';
import { FileText, Plus, Pin, Trash2, Edit3, Search, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentNotes() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notes = useAppSelector(selectNotes);
  const loading = useAppSelector(selectNotesLoading);

  const [enrollments, setEnrollments] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [lecturesList, setLecturesList] = useState([]);
  const [loadingLectures, setLoadingLectures] = useState(false);

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lectureId, setLectureId] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // 1. Load Enrolled Courses on Mount
  useEffect(() => {
    getMyEnrollments()
      .then((res) => {
        const list = res.data.enrollments || res.data.data?.enrollments || res.data.data || [];
        const validList = list.filter((item) => item && (item.course || typeof item === 'object'));
        setEnrollments(validList);
        if (validList.length > 0) {
          const firstItem = validList[0];
          const firstCourse = firstItem.course || firstItem;
          const firstCourseId =
            typeof firstCourse === 'object' && firstCourse !== null
              ? firstCourse._id || firstCourse.id
              : firstCourse;
          if (firstCourseId) {
            setSelectedCourseId(String(firstCourseId));
          }
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Notes & Lectures when selected course changes
  useEffect(() => {
    if (!selectedCourseId) return;

    dispatch(fetchCourseNotes({ courseId: selectedCourseId, params: { search } }));

    setLoadingLectures(true);
    getPublishedModules(selectedCourseId)
      .then(async (mRes) => {
        const mods = mRes.data.modules || mRes.data.data?.modules || [];
        const allLecs = [];
        await Promise.all(
          mods.map(async (mod) => {
            try {
              const lRes = await getPublishedLectures(mod._id);
              const lecs = lRes.data.lectures || lRes.data.data?.lectures || [];
              lecs.forEach((l) => allLecs.push({ ...l, moduleTitle: mod.title }));
            } catch {
              /* ignore */
            }
          })
        );
        setLecturesList(allLecs);
        if (allLecs.length > 0) {
          setLectureId((prev) => (prev && allLecs.some((l) => l._id === prev) ? prev : allLecs[0]._id));
        } else {
          setLectureId('');
        }
      })
      .catch(() => {
        setLecturesList([]);
        setLectureId('');
      })
      .finally(() => setLoadingLectures(false));
  }, [dispatch, selectedCourseId, search]);

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!content || (!lectureId && !editingNote)) {
      return toast.error('Please select a Lecture and write Note content');
    }
    const currentEditing = editingNote;
    setShowModal(false);
    resetForm();

    if (currentEditing) {
      toast.success('Note updated!');
      const res = await dispatch(editNote({ noteId: currentEditing._id, data: { title, content, isPinned } }));
      if (editNote.rejected.match(res)) {
        toast.error(res.payload || 'Failed to update note. Action rolled back.');
      }
    } else {
      toast.success('Note added!');
      const res = await dispatch(
        addNote({
          lectureId,
          title,
          content,
          isPinned,
        })
      );
      if (addNote.rejected.match(res)) {
        toast.error(res.payload || 'Failed to save note. Action rolled back.');
      }
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    toast.success('Note deleted');
    const res = await dispatch(removeNote(noteId));
    if (removeNote.rejected.match(res)) {
      toast.error(res.payload || 'Failed to delete note. Action rolled back.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsPinned(false);
    setEditingNote(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-[Inter,sans-serif] pb-16">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" /> My Study Notes
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Keep track of key concepts, summaries, and lecture takeaways
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-purple-950/20 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> <span>Add New Note</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Course Selector & Search Header */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-slate-800 mb-6 flex flex-col sm:flex-row gap-3 shadow-xs">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Select Enrolled Course
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 font-medium text-gray-800 dark:text-gray-200"
            >
              {enrollments.length === 0 ? (
                <option value="">No Enrolled Courses Found</option>
              ) : (
                enrollments.map((enr) => {
                  const c = typeof enr.course === 'object' && enr.course !== null ? enr.course : { _id: enr.course, title: 'Enrolled Course' };
                  const courseId = c._id || enr.course || enr._id;
                  return (
                    <option key={enr._id} value={courseId}>
                      {c.title || 'Enrolled Course'}
                    </option>
                  );
                })
              )}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Search Within Notes
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search notes content or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 bg-gray-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-40" />
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">No notes found for this course</p>
            <p className="text-xs text-gray-400 mt-1">Select an enrolled course above or click "Add New Note" to write one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {notes.map((n) => (
              <div
                key={n._id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col justify-between transition hover:shadow-md ${
                  n.isPinned
                    ? 'border-purple-400 bg-purple-50/20 dark:bg-purple-950/20 shadow-xs'
                    : 'border-gray-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">{n.title || 'Untitled Note'}</h3>
                    {n.isPinned && <Pin className="w-4 h-4 text-purple-600 fill-purple-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap line-clamp-6 mb-4 leading-relaxed">{n.content}</p>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 dark:border-slate-800 pt-3">
                  <span className="truncate max-w-[180px]" title={n.lecture?.title || 'Lecture Note'}>
                    {n.lecture?.title || 'Lecture Note'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNote(n);
                        setTitle(n.title || '');
                        setContent(n.content || '');
                        setIsPinned(n.isPinned || false);
                        setShowModal(true);
                      }}
                      className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded transition"
                      title="Edit Note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(n._id)}
                      className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Note Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-slate-800 animate-in fade-in">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {editingNote ? 'Edit Study Note' : 'Create Study Note'}
              </h2>
              <form onSubmit={handleSaveNote} className="space-y-4">
                {!editingNote && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Select Lecture *</label>
                    <select
                      required
                      value={lectureId}
                      onChange={(e) => setLectureId(e.target.value)}
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200"
                    >
                      {loadingLectures ? (
                        <option value="">Loading Lectures...</option>
                      ) : lecturesList.length === 0 ? (
                        <option value="">No Lectures Available</option>
                      ) : (
                        lecturesList.map((lec) => (
                          <option key={lec._id} value={lec._id}>
                            {lec.moduleTitle ? `${lec.moduleTitle} — ` : ''}{lec.title}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Note Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Key take-aways from module 1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Content *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Write your study notes, formulas, or key reminders here..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pinNote"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="pinNote" className="text-xs text-gray-700 dark:text-gray-300 font-semibold cursor-pointer">
                    Pin this note to the top
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition shadow-md shadow-purple-950/20 cursor-pointer"
                  >
                    {editingNote ? 'Update Note' : 'Save Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
