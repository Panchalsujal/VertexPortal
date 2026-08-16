import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCourseAnalytics, fetchAdminCourses, publishCourse, unpublishCourse, archiveCourse,
  selectAdminCoursesList, selectAdminCoursesAnalytics, selectAdminCoursesLoading,
} from '../../store/slices/admin/coursesSlice';
import { indexCourseForRag } from '../../api/rag.api';
import { BookOpen, CheckCircle, Clock, Archive, Search, Sparkles } from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Spinner';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminCourses() {
  const dispatch = useAppDispatch();
  const courses = useAppSelector(selectAdminCoursesList);
  const analytics = useAppSelector(selectAdminCoursesAnalytics);
  const loading = useAppSelector(selectAdminCoursesLoading);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [indexingId, setIndexingId] = useState(null);

  useEffect(() => {
    dispatch(fetchCourseAnalytics());
    dispatch(fetchAdminCourses({ search, status: statusFilter }));
  }, [dispatch, search, statusFilter]);

  const handleIndexRag = async (courseId, courseTitle) => {
    setIndexingId(courseId);
    try {
      await indexCourseForRag(courseId);
      toast.success(`"${courseTitle}" indexed into AI RAG knowledge base!`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'AI indexing failed');
    } finally {
      setIndexingId(null);
    }
  };

  const handlePublishToggle = async (id, isPublished) => {
    try {
      if (isPublished) {
        await dispatch(unpublishCourse(id)).unwrap();
        toast.success('Course unpublished');
      } else {
        await dispatch(publishCourse(id)).unwrap();
        toast.success('Course published');
      }
    } catch (err) {
      toast.error(err || 'Operation failed');
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this course?')) return;
    try {
      await dispatch(archiveCourse(id)).unwrap();
      toast.success('Course archived');
    } catch (err) {
      toast.error(err || 'Failed to archive course');
    }
  };

  const overview = analytics?.overview || analytics || {};

  return (
    <AdminLayout
      title="Course Catalog & Moderation"
      subtitle="Review, publish, and moderate platform courses"
    >
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Total Courses</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{overview.totalCourses ?? analytics?.totalCourses ?? courses.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Published</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{overview.publishedCourses ?? analytics?.publishedCourses ?? 0}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Drafts</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{overview.draftCourses ?? analytics?.draftCourses ?? 0}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center shrink-0">
            <Archive className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Archived</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{overview.archivedCourses ?? analytics?.archivedCourses ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-5 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition cursor-pointer truncate min-w-0 max-w-full"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden w-full max-w-full min-w-0">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[640px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-4 sm:px-5 py-3 sm:py-3.5">Course Title</th>
                <th className="px-4 sm:px-5 py-3 sm:py-3.5">Instructor</th>
                <th className="px-4 sm:px-5 py-3 sm:py-3.5">Price</th>
                <th className="px-4 sm:px-5 py-3 sm:py-3.5">Status</th>
                <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50 text-purple-400" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No courses found</p>
                  </td>
                </tr>
              ) : (
                courses.map((c) => {
                  const instructorName = c.instructor?.fullName || c.instructor?.name || 'N/A';
                  const isPub = c.isPublished || c.status === 'published';
                  const statusLabel = c.status || (isPub ? 'published' : 'draft');

                  return (
                    <tr key={c._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 sm:px-5 py-3 sm:py-4 font-semibold text-gray-900 dark:text-white">{c.title}</td>
                      <td className="px-4 sm:px-5 py-3 sm:py-4 text-xs text-gray-600 dark:text-gray-400 font-medium">{instructorName}</td>
                      <td className="px-4 sm:px-5 py-3 sm:py-4 font-bold text-gray-900 dark:text-white">₹{c.price ?? c.originalPrice ?? 0}</td>
                      <td className="px-4 sm:px-5 py-3 sm:py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                          statusLabel === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          statusLabel === 'archived' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            statusLabel === 'published' ? 'bg-emerald-500' :
                            statusLabel === 'archived' ? 'bg-gray-500' : 'bg-amber-500'
                          }`} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleIndexRag(c._id, c.title)}
                          disabled={indexingId === c._id}
                          className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-bold px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                          title="Index course curriculum and resources into AI RAG"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${indexingId === c._id ? 'animate-spin' : 'text-purple-600'}`} />
                          {indexingId === c._id ? 'Indexing…' : 'AI Index'}
                        </button>
                        <button
                          onClick={() => handlePublishToggle(c._id, isPub)}
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            isPub ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          {isPub ? 'Unpublish' : 'Publish'}
                        </button>
                        {statusLabel !== 'archived' && (
                          <button
                            onClick={() => handleArchive(c._id)}
                            className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Archive
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
