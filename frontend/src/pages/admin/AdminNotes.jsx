import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  FileText, Search, Pin, BookOpen, User, Clock, RefreshCw,
  Eye, Trash2, X, AlertCircle, Sparkles, Users, CheckCircle2
} from 'lucide-react';
import { SkeletonTable, Spinner } from '../../components/ui/Spinner';
import CustomSelect from '../../components/ui/CustomSelect';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pinnedFilter, setPinnedFilter] = useState('');
  const [stats, setStats] = useState({ total: 0, pinned: 0, courses: 0, students: 0 });
  const [selectedNote, setSelectedNote] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (pinnedFilter !== '') params.pinned = pinnedFilter;

      const res = await api.get('/admin/notes', { params });
      const list = res.data.notes || res.data.data?.notes || res.data.data || [];
      setNotes(Array.isArray(list) ? list : []);

      if (res.data.stats) {
        setStats(res.data.stats);
      } else {
        setStats({
          total: res.data.total || list.length,
          pinned: list.filter(n => n.isPinned).length,
          courses: [...new Set(list.map(n => n.course?._id || n.course))].length,
          students: [...new Set(list.map(n => n.student?._id || n.student))].length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch admin notes:', err);
      toast.error('Failed to load notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [pinnedFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNotes();
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this student note? This cannot be undone.')) return;
    setDeletingId(noteId);
    try {
      await api.delete(`/admin/notes/${noteId}`);
      toast.success('Note deleted successfully');
      setNotes(prev => prev.filter(n => n._id !== noteId));
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      if (selectedNote?._id === noteId) {
        setSelectedNote(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete note');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title="Notes & Documents"
      subtitle="Overview and moderation of student study notes across all platform courses"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Total Notes</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {stats.total.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <Pin className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Pinned Notes</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {stats.pinned.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Courses Active</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {stats.courses.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Active Students</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {stats.students.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 p-3 sm:p-4 mb-5 shadow-sm flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notes by title, content, student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
          <div className="w-full sm:w-40 min-w-0">
            <CustomSelect
              value={pinnedFilter}
              onChange={(val) => setPinnedFilter(val)}
              options={[
                { value: '', label: 'All Notes' },
                { value: 'true', label: 'Pinned Only' },
                { value: 'false', label: 'Unpinned Only' },
              ]}
              placeholder="All Notes"
            />
          </div>

          <button
            onClick={() => {
              setSearch('');
              setPinnedFilter('');
              fetchNotes();
            }}
            className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition shrink-0"
            title="Reset and Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : notes.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden w-full max-w-full min-w-0">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[650px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">Student</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">Course &amp; Lecture</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">Note Title &amp; Content</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">Pinned</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5">Updated</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm text-gray-900 dark:text-white">
                {notes.map(note => {
                  const studentName = note.student?.fullName || 'Student';
                  const studentEmail = note.student?.email || '';
                  const studentAvatar = note.student?.avatarUrl;
                  const initials = studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

                  return (
                    <tr
                      key={note._id}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedNote(note)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {studentAvatar && studentAvatar !== 'https://ik.imagekit.io/Sujalpanchal/default.avif' ? (
                            <img
                              src={studentAvatar}
                              alt={studentName}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                              style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                            >
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{studentName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{studentEmail}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="font-medium text-purple-600 dark:text-purple-400 text-xs truncate">
                          {note.course?.title || 'General Course'}
                        </p>
                        {note.lectureTitle && (
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">
                            {note.lectureTitle}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 max-w-[240px]">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{note.title || 'Untitled Note'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {note.content?.replace(/<[^>]*>?/gm, '') || 'No text content'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {note.isPinned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            <Pin className="w-3 h-3 fill-amber-500" /> Pinned
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedNote(note)}
                          className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 font-semibold px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="View Note Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(note._id)}
                          disabled={deletingId === note._id}
                          className="text-xs bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100 font-semibold px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Notes Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {search || pinnedFilter
              ? 'No student study notes match your current search or filter query.'
              : 'Students can create and organize notes inside lecture player. When notes are created, they will show up here.'}
          </p>
          {(search || pinnedFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setPinnedFilter('');
                fetchNotes();
              }}
              className="mt-5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Note Details Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white dark:from-purple-950/20 dark:to-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedNote.title || 'Untitled Note'}
                    </h2>
                    {selectedNote.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200">
                        <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">Note ID: {selectedNote._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Student Details */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedNote.student?.avatarUrl && selectedNote.student?.avatarUrl !== 'https://ik.imagekit.io/Sujalpanchal/default.avif' ? (
                    <img
                      src={selectedNote.student.avatarUrl}
                      alt={selectedNote.student.fullName}
                      className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                      style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                    >
                      {(selectedNote.student?.fullName || 'S')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {selectedNote.student?.fullName || 'Student'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedNote.student?.email || ''}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full capitalize bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                  {selectedNote.student?.role || 'student'}
                </span>
              </div>

              {/* Course and Lecture information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60">
                  <span className="text-gray-400 block font-medium mb-1">Course</span>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {selectedNote.course?.title || 'Unknown Course'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60">
                  <span className="text-gray-400 block font-medium mb-1">Lecture & Module</span>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {selectedNote.lecture?.title || 'Lecture Note'}
                  </p>
                  {selectedNote.module?.title && (
                    <p className="text-[11px] text-gray-500 mt-0.5">Module: {selectedNote.module.title}</p>
                  )}
                </div>
              </div>

              {/* Note Content */}
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Note Content
                </span>
                <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {selectedNote.content}
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Created: {new Date(selectedNote.createdAt).toLocaleString()}
                </div>
                <div>
                  Updated: {new Date(selectedNote.updatedAt || selectedNote.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedNote._id)}
                className="text-xs bg-red-600 text-white hover:bg-red-700 font-bold px-4 py-2 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Note
              </button>
              <button
                onClick={() => setSelectedNote(null)}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
