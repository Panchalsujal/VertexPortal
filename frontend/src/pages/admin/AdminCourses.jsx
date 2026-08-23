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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Total Courses</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{overview.totalCourses ?? analytics?.totalCourses ?? courses.length}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Published</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{overview.publishedCourses ?? analytics?.publishedCourses ?? 0}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Drafts</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{overview.draftCourses ?? analytics?.draftCourses ?? 0}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Archived</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{overview.archivedCourses ?? analytics?.archivedCourses ?? 0}</p>
        </div>
      </div>

      {/* Filter / Search (Unified Toolbar) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm mb-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none"
          />
        </div>
        <div className="w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent border-none px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-300 focus:ring-0 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#202020]">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course Title</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Instructor</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-slate-500">
                    No courses found
                  </td>
                </tr>
              ) : (
                courses.map((c) => {
                  const instructorName = c.instructor?.fullName || c.instructor?.name || 'N/A';
                  const isPub = c.isPublished || c.status === 'published';
                  const statusLabel = c.status || (isPub ? 'published' : 'draft');

                  return (
                    <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-[#202020]/30 transition-colors group bg-white dark:bg-[#181818]">
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white">{c.title}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-600 dark:text-neutral-400">{instructorName}</td>
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white tabular-nums">₹{c.price ?? c.originalPrice ?? 0}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-medium flex w-fit items-center gap-1.5 px-2 py-0.5 rounded-md border bg-slate-50 dark:bg-[#202020] text-slate-600 dark:text-neutral-300 border-slate-200 dark:border-white/10 capitalize">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            statusLabel === 'published' ? 'bg-emerald-500' :
                            statusLabel === 'archived' ? 'bg-slate-400' : 'bg-amber-500'
                          }`} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleIndexRag(c._id, c.title)}
                          disabled={indexingId === c._id}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border bg-white dark:bg-[#202020] border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-purple-900/30 transition-colors shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${indexingId === c._id ? 'animate-spin' : ''}`} />
                          {indexingId === c._id ? 'Indexing…' : 'AI Index'}
                        </button>
                        <button
                          onClick={() => handlePublishToggle(c._id, isPub)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border bg-white dark:bg-[#202020] border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-[#202020] transition-colors shadow-sm"
                        >
                          {isPub ? 'Unpublish' : 'Publish'}
                        </button>
                        {statusLabel !== 'archived' && (
                          <button
                            onClick={() => handleArchive(c._id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-md border bg-white dark:bg-[#202020] border-slate-200 dark:border-white/10 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm"
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
      )}
    </AdminLayout>
  );
}
