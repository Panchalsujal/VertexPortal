import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { FileText, Search, Pin, BookOpen, User, Clock, RefreshCw } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, pinned: 0, courses: 0 });

  const fetchNotes = async () => {
    setLoading(true);
    try {
      // Use admin notes endpoint
      const res = await api.get('/admin/notes', { params: { search, limit: 100 } });
      const list = res.data.notes || res.data.data?.notes || res.data.data || [];
      setNotes(Array.isArray(list) ? list : []);
      setStats({
        total: res.data.total || list.length,
        pinned: list.filter(n => n.isPinned).length,
        courses: [...new Set(list.map(n => n.course?._id || n.course))].length,
      });
    } catch {
      // Notes are student-private; show informational empty state
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNotes();
  };

  return (
    <AdminLayout
      title="Notes & Documents"
      subtitle="Overview of student study notes across all enrolled courses"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Notes', value: stats.total, icon: FileText, color: '#6C5CE7', bg: '#ede9fe' },
          { label: 'Pinned Notes', value: stats.pinned, icon: Pin, color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Courses with Notes', value: stats.courses, icon: BookOpen, color: '#10b981', bg: '#d1fae5' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6 flex gap-3 items-center shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notes by title or content..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition">
            Search
          </button>
        </form>
        <button
          onClick={fetchNotes}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : notes.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="p-4">Student</th>
                <th className="p-4">Course / Lecture</th>
                <th className="p-4">Note Title</th>
                <th className="p-4">Pinned</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm text-gray-900 dark:text-white">
              {notes.map(note => (
                <tr key={note._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-gray-900 dark:text-white">
                          {note.student?.fullName || 'Student'}
                        </p>
                        <p className="text-[11px] text-gray-400">{note.student?.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {note.course?.title || 'Course'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {note.lecture?.title || ''}
                    </p>
                  </td>
                  <td className="p-4 max-w-xs">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {note.title || 'Untitled Note'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {note.content}
                    </p>
                  </td>
                  <td className="p-4">
                    {note.isPinned ? (
                      <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.updatedAt || note.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-16 text-center shadow-sm">
          <FileText className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Notes Overview</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            Student notes are private study materials. Students can manage their notes from their dashboard.
          </p>
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-800/40 text-left max-w-md mx-auto">
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">Info for Admins</p>
            <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1 list-disc list-inside">
              <li>Students create notes tied to specific lectures</li>
              <li>Notes support pinning, search, and editing</li>
              <li>Access from Student Dashboard &rarr; Notes</li>
              <li>Notes require active course enrollment</li>
            </ul>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
