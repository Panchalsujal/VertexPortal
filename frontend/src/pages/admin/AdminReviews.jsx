import React, { useEffect, useState } from 'react';
import { getAdminReviews } from '../../api/admin.api';
import { getCourseReviews, deleteReview } from '../../api/review.api';
import { getAllCourses } from '../../api/course.api';
import { Star, Search, Trash2, MessageSquare, Award, ThumbsUp, Shield } from 'lucide-react';
import { StarRating } from '../../components/ui/StarRating';
import { SkeletonTable } from '../../components/ui/Spinner';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const fetchAllReviews = async () => {
    setLoading(true);
    try {
      const res = await getAdminReviews({ search, rating: ratingFilter });
      const list = res.data.reviews || res.data.data?.reviews || res.data.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setReviews(list);
        setLoading(false);
        return;
      }
    } catch {
      /* fallback */
    }

    try {
      const coursesRes = await getAllCourses({ limit: 100 });
      const courses = coursesRes.data.courses || coursesRes.data.data?.courses || coursesRes.data.data || [];
      const allRev = await Promise.all(
        courses.map(c => getCourseReviews(c._id).catch(() => ({ data: { reviews: [] } })))
      );
      const combined = allRev.flatMap(r => r.data?.reviews || r.data?.data?.reviews || []);
      setReviews(combined);
    } catch (err) {
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, [ratingFilter]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this course review?')) return;
    try {
      await deleteReview(reviewId);
      toast.success('Review deleted successfully');
      setReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch (err) {
      toast.error(err.message || 'Failed to delete review');
    }
  };

  const filteredReviews = reviews.filter(r => {
    const s = search.toLowerCase();
    const studentName = (r.student?.fullName || r.user?.fullName || '').toLowerCase();
    const courseTitle = (r.course?.title || r.courseTitle || '').toLowerCase();
    const comment = (r.comment || r.content || '').toLowerCase();
    const matchesSearch = !s || studentName.includes(s) || courseTitle.includes(s) || comment.includes(s);
    const matchesRating = !ratingFilter || String(r.rating) === String(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1) : '0.0';
  const fiveStars = reviews.filter(r => r.rating === 5).length;
  const fourStarsPlus = reviews.filter(r => r.rating >= 4).length;

  return (
    <AdminLayout
      title="Course Ratings & Reviews"
      subtitle="Inspect, filter, and moderate student ratings and course feedback platform-wide"
    >
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Avg Rating</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{avgRating} / 5.0</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{totalReviews}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">5★ Reviews</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{fiveStars}</p>
        </div>

        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-neutral-400 mb-2">Positive (4★+)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight tabular-nums">{fourStarsPlus}</p>
        </div>
      </div>

      {/* Filter Bar (Unified Toolbar) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm mb-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-white/10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews by student, course, or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none"
          />
        </div>
        <div className="w-48">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="w-full bg-transparent border-none px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-300 focus:ring-0 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars (Excellent)</option>
            <option value="4">4 Stars (Very Good)</option>
            <option value="3">3 Stars (Average)</option>
            <option value="2">2 Stars (Poor)</option>
            <option value="1">1 Star (Very Poor)</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-white/10 rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#202020]">
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Review Comment</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-slate-500">
                    No course reviews found.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((r) => {
                  const studentName = r.student?.fullName || r.user?.fullName || 'Anonymous Student';
                  const studentEmail = r.student?.email || r.user?.email || '';
                  const courseTitle = r.course?.title || r.courseTitle || 'Course';
                  const initials = studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-[#202020]/30 transition-colors group bg-white dark:bg-[#181818]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{studentName}</p>
                            <p className="text-xs text-slate-500 dark:text-neutral-400">{studentEmail}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2.5">
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">
                          {courseTitle}
                        </span>
                      </td>

                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={r.rating} size={14} />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">{r.rating}.0</span>
                        </div>
                      </td>

                      <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-neutral-300 max-w-md">
                        <p className="line-clamp-2">{r.comment || r.content || 'No text comment provided'}</p>
                      </td>

                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(r._id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-md border bg-white dark:bg-[#202020] border-slate-200 dark:border-white/10 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-sm inline-flex items-center gap-1.5"
                          title="Delete Review"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
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
