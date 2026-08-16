import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchInstructorAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  deleteAnnouncement,
  selectInstructorAnnouncements,
  selectInstructorAnnouncementsLoading,
} from '../../store/slices/instructor/announcementsSlice';
import {
  fetchAllCourses,
  selectCourses,
} from '../../store/slices/coursesSlice';
import { selectUser } from '../../store/slices/authSlice';
import { Spinner, SkeletonFeed } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import {
  Megaphone, Plus, Edit3, CheckCircle, Clock, Trash2,
  Search, Filter, Pin, BookOpen, AlertCircle, Eye, EyeOff,
  Sparkles, Check, X, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  title: '',
  courseId: '',
  content: '',
  type: 'general',
  isPinned: false,
  status: 'published',
};

const ANNOUNCEMENT_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'important', label: 'Important' },
  { value: 'course_update', label: 'Course Update' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'live_class', label: 'Live Class' },
];

export default function InstructorAnnouncements() {
  const dispatch = useAppDispatch();
  const announcements = useAppSelector(selectInstructorAnnouncements);
  const loading = useAppSelector(selectInstructorAnnouncementsLoading);
  const courses = useAppSelector(selectCourses);
  const user = useAppSelector(selectUser);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeAnn, setActiveAnn] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [viewingAnn, setViewingAnn] = useState(null);

  useEffect(() => {
    dispatch(fetchInstructorAnnouncements());
    dispatch(fetchAllCourses());
  }, [dispatch]);

  const openCreate = () => {
    setActiveAnn(null);
    setForm({
      title: '',
      courseId: courses[0]?._id || '',
      content: '',
      type: 'general',
      isPinned: false,
      status: 'published',
    });
    setModalOpen(true);
  };

  const openEdit = (ann) => {
    setActiveAnn(ann);
    setForm({
      title: ann.title || '',
      courseId: ann.course?._id || ann.course || '',
      content: ann.content || '',
      type: ann.type || 'general',
      isPinned: Boolean(ann.isPinned),
      status: ann.status || 'published',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.courseId || !form.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    if (activeAnn) {
      const res = await dispatch(updateAnnouncement({ id: activeAnn._id, payload: form }));
      setSaving(false);
      if (updateAnnouncement.fulfilled.match(res)) {
        toast.success('Announcement updated successfully');
        setModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to update announcement');
      }
    } else {
      const res = await dispatch(createAnnouncement(form));
      setSaving(false);
      if (createAnnouncement.fulfilled.match(res)) {
        toast.success('Announcement published & notified enrolled students!');
        setModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to create announcement');
      }
    }
  };

  const toggleStatus = async (ann) => {
    const nextStatus = ann.status === 'published' ? 'draft' : 'published';
    const res = await dispatch(updateAnnouncementStatus({ id: ann._id, status: nextStatus }));
    if (updateAnnouncementStatus.fulfilled.match(res)) {
      toast.success(`Announcement marked as ${nextStatus}`);
    } else {
      toast.error(res.payload || 'Failed to change status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    const res = await dispatch(deleteAnnouncement(id));
    if (deleteAnnouncement.fulfilled.match(res)) {
      toast.success('Announcement deleted');
      if (viewingAnn?._id === id) setViewingAnn(null);
    } else {
      toast.error(res.payload || 'Failed to delete announcement');
    }
  };

  // Filtered Announcements
  const filteredAnnouncements = announcements.filter(ann => {
    const matchSearch = search.trim() === '' ||
      ann.title?.toLowerCase().includes(search.toLowerCase()) ||
      ann.content?.toLowerCase().includes(search.toLowerCase()) ||
      (ann.course?.title || '').toLowerCase().includes(search.toLowerCase());

    const matchCourse = !selectedCourseFilter ||
      (ann.course?._id || ann.course) === selectedCourseFilter;

    const matchStatus = !selectedStatusFilter ||
      ann.status === selectedStatusFilter;

    return matchSearch && matchCourse && matchStatus;
  });

  const getTypeBadge = (type) => {
    switch (type) {
      case 'important':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200">Important</span>;
      case 'course_update':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200">Update</span>;
      case 'assignment':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">Assignment</span>;
      case 'quiz':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">Quiz</span>;
      case 'live_class':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200">Live Class</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200">General</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-4 sm:py-8 w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full max-w-full min-w-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 shadow-sm mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center shadow-inner shrink-0">
              <Megaphone className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-base sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Manage Announcements
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                Broadcast course news, exam updates, and direct notifications to enrolled students
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl transition shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>

        {/* Search & Filter */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search announcements by title, content, or course..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCourseFilter}
              onChange={e => setSelectedCourseFilter(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition flex-1 sm:flex-none max-w-[200px]"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setSelectedCourseFilter('');
                setSelectedStatusFilter('');
                dispatch(fetchInstructorAnnouncements());
              }}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <SkeletonFeed count={4} />
        ) : filteredAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {filteredAnnouncements.map(ann => {
              const courseTitle = ann.course?.title || courses.find(c => c._id === (ann.course?._id || ann.course))?.title || 'Course Announcement';
              const isPublished = ann.status === 'published';

              return (
                <div
                  key={ann._id}
                  className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-100 dark:border-purple-900">
                        <BookOpen className="w-3.5 h-3.5" />
                        {courseTitle}
                      </span>
                      {getTypeBadge(ann.type)}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isPublished
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {ann.status || 'draft'}
                      </span>
                      {ann.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                          <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Pinned
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto sm:ml-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ann.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                      {ann.title}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setViewingAnn(ann)}
                      className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleStatus(ann)}
                      className={`text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                        isPublished
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                      title={isPublished ? 'Unpublish to Draft' : 'Publish Announcement'}
                    >
                      {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      {isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => openEdit(ann)}
                      className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann._id)}
                      className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {search || selectedCourseFilter || selectedStatusFilter ? 'No matching announcements' : 'No announcements created yet'}
            </h3>
            <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
              {search || selectedCourseFilter || selectedStatusFilter
                ? 'Try adjusting or clearing your search and filter parameters.'
                : 'Publish course updates, schedule announcements, and broadcast news directly to your enrolled students.'}
            </p>
            <button
              onClick={openCreate}
              className="mt-5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Announcement
            </button>
          </div>
        )}

        {/* Create / Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => !saving && setModalOpen(false)}
          title={activeAnn ? 'Edit Announcement' : 'New Announcement'}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Target Course *
              </label>
              <select
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.courseId}
                onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                required
              >
                <option value="">Select a Course</option>
                {courses.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Announcement Type
                </label>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  {ANNOUNCEMENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Publish Status
                </label>
                <select
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="published">Publish Immediately</option>
                  <option value="draft">Save as Draft</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Announcement Title *
              </label>
              <input
                type="text"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Schedule Change for Module 3"
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Announcement Content *
              </label>
              <textarea
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={5}
                placeholder="Write the details of your announcement here..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
                minLength={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPinned"
                checked={form.isPinned}
                onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isPinned" className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-amber-500" /> Pin this announcement to the top
              </label>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 text-xs font-semibold transition"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    Saving…
                  </>
                ) : activeAnn ? (
                  'Save Changes'
                ) : (
                  'Publish Announcement'
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* View Modal */}
        {viewingAnn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {viewingAnn.title}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {viewingAnn.course?.title || 'Course'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingAnn(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  {getTypeBadge(viewingAnn.type)}
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    viewingAnn.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {viewingAnn.status}
                  </span>
                  {viewingAnn.isPinned && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                      Pinned
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(viewingAnn.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                  {viewingAnn.content}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex justify-end">
                <button
                  onClick={() => setViewingAnn(null)}
                  className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
