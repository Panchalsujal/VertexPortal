import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  FileText, Search, Pin, BookOpen, User, Clock, RefreshCw,
  Eye, Trash2, X, AlertCircle, Sparkles, Users, CheckCircle2
} from 'lucide-react';
import { SkeletonTable, Spinner } from '../../components/ui/Spinner';
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Total Notes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{stats.total.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Pinned Notes</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{stats.pinned.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Courses Active</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{stats.courses.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Active Students</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{stats.students.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Filter Bar (Unified Toolbar) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm flex-1 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/10">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notes by title, content, student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent border-none pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none"
            />
          </div>
          <div className="w-44 shrink-0">
            <select
              value={pinnedFilter}
              onChange={(e) => setPinnedFilter(e.target.value)}
              className="w-full bg-transparent border-none px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-300 focus:ring-0 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">All Notes</option>
              <option value="true">Pinned Only</option>
              <option value="false">Unpinned Only</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 text-sm font-medium transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <button
          onClick={() => {
            setSearch('');
            setPinnedFilter('');
            fetchNotes();
          }}
          className="p-1.5 bg-white dark:bg-[#181818] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md text-slate-600 dark:text-neutral-300 transition-colors shadow-sm shrink-0 cursor-pointer"
          title="Reset and Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Notes Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : notes.length > 0 ? (
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#202020]">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course &amp; Lecture</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Note Title &amp; Content</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pinned</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {notes.map(note => {
                const studentName = note.student?.fullName || 'Student';
                const studentEmail = note.student?.email || '';
                const studentAvatar = note.student?.avatarUrl;
                const initials = studentName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

                return (
                  <tr
                    key={note._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-[#202020]/30 transition-colors cursor-pointer group bg-white dark:bg-[#181818]"
                    onClick={() => setSelectedNote(note)}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {studentAvatar && studentAvatar !== 'https://ik.imagekit.io/Sujalpanchal/default.avif' ? (
                          <img
                            src={studentAvatar}
                            alt={studentName}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm border border-slate-200 dark:border-white/10"
                            style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{studentName}</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 truncate">{studentEmail}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2.5 max-w-[200px]">
                      <p className="font-medium text-purple-600 dark:text-purple-400 text-xs truncate">
                        {note.course?.title || 'General Course'}
                      </p>
                      {note.lectureTitle && (
                        <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate mt-0.5">
                          {note.lectureTitle}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-2.5 max-w-[240px]">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{note.title || 'Untitled Note'}</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                        {note.content?.replace(/<[^>]*>?/gm, '') || 'No text content'}
                      </p>
                    </td>

                    <td className="px-4 py-2.5">
                      {note.isPinned ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
                          <Pin className="w-3 h-3 fill-amber-500" /> Pinned
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-neutral-500">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-neutral-400 whitespace-nowrap tabular-nums">
                      {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedNote(note)}
                          className="px-3 py-1.5 bg-white dark:bg-[#202020] hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md text-xs font-medium text-slate-700 dark:text-neutral-300 transition-colors shadow-sm inline-flex items-center gap-1.5"
                          title="View Note Details"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(note._id)}
                          disabled={deletingId === note._id}
                          className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#181818] rounded-xl border border-slate-200 dark:border-white/10 p-12 text-center shadow-sm max-w-xl mx-auto mt-10">
          <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-[#202020] border border-slate-100 dark:border-white/10 text-slate-400 dark:text-neutral-500 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No Notes Found</h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2 max-w-sm mx-auto">
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
              className="mt-6 px-4 py-2 bg-slate-100 dark:bg-[#202020] text-slate-700 dark:text-neutral-300 rounded-md text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/5 transition-colors border border-slate-200 dark:border-white/10 cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Note Details Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#181818] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-purple-600 text-white flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedNote.title || 'Untitled Note'}
                    </h2>
                    {selectedNote.isPinned && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                        <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 font-mono mt-0.5 tabular-nums">ID: {selectedNote._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Student Details */}
              <div className="bg-slate-50 dark:bg-[#202020] p-4 rounded-md border border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedNote.student?.avatarUrl && selectedNote.student?.avatarUrl !== 'https://ik.imagekit.io/Sujalpanchal/default.avif' ? (
                    <img
                      src={selectedNote.student.avatarUrl}
                      alt={selectedNote.student.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-white/10 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm border border-slate-200 dark:border-white/10"
                      style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                    >
                      {(selectedNote.student?.fullName || 'S')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {selectedNote.student?.fullName || 'Student'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">{selectedNote.student?.email || ''}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full capitalize bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50">
                  {selectedNote.student?.role || 'student'}
                </span>
              </div>

              {/* Course and Lecture information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 dark:bg-[#202020] p-4 rounded-md border border-slate-200 dark:border-white/10">
                  <span className="text-slate-500 dark:text-neutral-400 block font-medium mb-1 text-xs uppercase tracking-wider">Course</span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedNote.course?.title || 'Unknown Course'}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-[#202020] p-4 rounded-md border border-slate-200 dark:border-white/10">
                  <span className="text-slate-500 dark:text-neutral-400 block font-medium mb-1 text-xs uppercase tracking-wider">Lecture & Module</span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedNote.lecture?.title || 'Lecture Note'}
                  </p>
                  {selectedNote.module?.title && (
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Module: {selectedNote.module.title}</p>
                  )}
                </div>
              </div>

              {/* Note Content */}
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block mb-2">
                  Note Content
                </span>
                <div className="bg-white dark:bg-[#111111] p-4 rounded-md border border-slate-200 dark:border-white/10 text-sm text-gray-800 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                  {selectedNote.content}
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-500 pt-2 border-t border-slate-100 dark:border-white/10 tabular-nums">
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
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-[#202020] flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedNote._id)}
                className="text-sm bg-rose-600 text-white hover:bg-rose-700 font-medium px-4 py-2 rounded-md transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete Note
              </button>
              <button
                onClick={() => setSelectedNote(null)}
                className="text-sm font-medium px-4 py-2 rounded-md bg-white dark:bg-[#202020] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-white/5 transition shadow-sm cursor-pointer"
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
