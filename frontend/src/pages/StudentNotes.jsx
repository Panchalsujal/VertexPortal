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
import { FileText, Plus, Pin, Trash2, Edit3, Search, BookOpen, Video, ArrowLeft } from 'lucide-react';
import { SkeletonTable } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function StudentNotes() {
  const dispatch = useAppDispatch();
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

    // Fetch modules & lectures for the selected course
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
    try {
      if (editingNote) {
        await dispatch(editNote({ noteId: editingNote._id, data: { title, content, isPinned } })).unwrap();
        toast.success('Note updated');
      } else {
        await dispatch(addNote({ courseId: selectedCourseId, lectureId, title, content, isPinned })).unwrap();
        toast.success('Note created');
      }
      setShowModal(false);
      resetForm();
      if (selectedCourseId) {
        dispatch(fetchCourseNotes({ courseId: selectedCourseId, params: { search } }));
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || err?.response?.data?.message || 'Failed to save note');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await dispatch(removeNote(id)).unwrap();
      toast.success('Note deleted');
    } catch (err) {
      toast.error(err || 'Failed to delete');
    }
  };

  const resetForm = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setLectureId(lecturesList.length > 0 ? lecturesList[0]._id : '');
    setIsPinned(false);
  };

  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.history.length > 1 && window.history.state?.idx > 0) {
                navigate(-1);
              } else {
                navigate('/dashboard');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 transition cursor-pointer"
            title="Go back to previous page"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Study Notes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Keep track of key concepts, summaries, and lecture takeaways</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Note
        </button>
      </div>

      {/* Course Selector & Search Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Select Enrolled Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-gray-800"
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
          <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Search Notes</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search within notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">No notes found for this course</p>
          <p className="text-xs text-gray-400 mt-1">Select a course from the dropdown above or click "Add Note" to write one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((n) => (
            <div
              key={n._id}
              className={`bg-white rounded-xl border p-4 flex flex-col justify-between transition hover:shadow-md ${
                n.isPinned ? 'border-blue-400 bg-blue-50/20' : 'border-gray-200'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-base">{n.title || 'Untitled Note'}</h3>
                  {n.isPinned && <Pin className="w-4 h-4 text-blue-600 fill-blue-600 shrink-0" />}
                </div>
                <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-6 mb-4">{n.content}</p>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-3">
                <span className="truncate max-w-45" title={n.lecture?.title || 'Lecture Note'}>
                  {n.lecture?.title || 'Lecture Note'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingNote(n);
                      setTitle(n.title || '');
                      setContent(n.content || '');
                      setIsPinned(n.isPinned || false);
                      setShowModal(true);
                    }}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(n._id)} className="text-gray-500 hover:text-red-600">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editingNote ? 'Edit Note' : 'Create Note'}</h2>
            <form onSubmit={handleSaveNote} className="space-y-4">
              {!editingNote && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Lecture *</label>
                  <select
                    required
                    value={lectureId}
                    onChange={(e) => setLectureId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Choose Lecture --</option>
                    {lecturesList.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.moduleTitle ? `${l.moduleTitle}: ` : ''}{l.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Key Takeaways from Section 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Note Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your note content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pin"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="pin" className="text-xs text-gray-700 font-medium">Pin this note to top</label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
