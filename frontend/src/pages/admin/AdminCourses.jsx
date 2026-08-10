import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchCourseAnalytics, fetchAdminCourses, publishCourse, unpublishCourse, archiveCourse,
  selectAdminCoursesList, selectAdminCoursesAnalytics, selectAdminCoursesLoading,
} from '../../store/slices/admin/coursesSlice';
import { BookOpen, CheckCircle, Clock, Archive, Search } from 'lucide-react';
import { SkeletonTable } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function AdminCourses() {
  const dispatch = useAppDispatch();
  const courses = useAppSelector(selectAdminCoursesList);
  const analytics = useAppSelector(selectAdminCoursesAnalytics);
  const loading = useAppSelector(selectAdminCoursesLoading);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchCourseAnalytics());
    dispatch(fetchAdminCourses({ search, status: statusFilter }));
  }, [dispatch, search, statusFilter]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Course Moderation & Catalog (Admin)</h1>
        <p className="text-sm text-gray-500">Review, publish, and moderate platform courses</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><BookOpen className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Courses</p>
            <p className="text-xl font-bold text-gray-900">{overview.totalCourses ?? analytics?.totalCourses ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Published</p>
            <p className="text-xl font-bold text-gray-900">{overview.publishedCourses ?? analytics?.publishedCourses ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Drafts</p>
            <p className="text-xl font-bold text-gray-900">{overview.draftCourses ?? analytics?.draftCourses ?? 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-gray-100 text-gray-600 rounded-lg"><Archive className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Archived</p>
            <p className="text-xl font-bold text-gray-900">{overview.archivedCourses ?? analytics?.archivedCourses ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Filter / Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Course Title</th>
                <th className="p-4">Instructor</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {courses.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No courses found</td></tr>
              ) : (
                courses.map((c) => {
                  const instructorName = c.instructor?.fullName || c.instructor?.name || 'N/A';
                  const isPub = c.isPublished || c.status === 'published';
                  const statusLabel = c.status || (isPub ? 'published' : 'draft');

                  return (
                    <tr key={c._id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-semibold text-gray-900">{c.title}</td>
                      <td className="p-4 text-xs text-gray-600 font-medium">{instructorName}</td>
                      <td className="p-4 font-bold text-gray-900">₹{c.price ?? c.originalPrice ?? 0}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          statusLabel === 'published' ? 'bg-green-100 text-green-700' :
                          statusLabel === 'archived' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handlePublishToggle(c._id, isPub)}
                          className={`text-xs font-medium px-2.5 py-1 rounded ${
                            isPub ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {isPub ? 'Unpublish' : 'Publish'}
                        </button>
                        {statusLabel !== 'archived' && (
                          <button
                            onClick={() => handleArchive(c._id)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-2.5 py-1 rounded"
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
    </div>
  );
}
