import React, { useEffect, useState } from 'react';
import { getAdminReviews } from '../../api/admin.api';
import { getCourseReviews, deleteReview } from '../../api/review.api';
import { getAllCourses } from '../../api/course.api';
import { Star, Search, Trash2, MessageSquare, Award, ThumbsUp, Shield } from 'lucide-react';
import { StarRating } from '../../components/ui/StarRating';
import { SkeletonTable } from '../../components/ui/Spinner';
import AdminLayout from '../../components/admin/AdminLayout';
import CustomSelect from '../../components/ui/CustomSelect';
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Avg Rating</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{avgRating} / 5.0</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Total Reviews</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{totalReviews}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">5★ Reviews</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{fiveStars}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-3 sm:p-4.5 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-2.5 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium truncate">Positive (4★+)</p>
            <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{fourStarsPlus}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-5 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews by student, course, or text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>
        <div className="w-full sm:w-48 min-w-0">
          <CustomSelect
            value={ratingFilter}
            onChange={(val) => setRatingFilter(val)}
            options={[
              { value: '', label: 'All Ratings' },
              { value: '5', label: '5 Stars (Excellent)' },
              { value: '4', label: '4 Stars (Very Good)' },
              { value: '3', label: '3 Stars (Average)' },
              { value: '2', label: '2 Stars (Poor)' },
              { value: '1', label: '1 Star (Very Poor)' },
            ]}
            placeholder="All Ratings"
          />
        </div>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden w-full max-w-full min-w-0">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Review Comment</th>
                  <th className="px-4 sm:px-5 py-3 sm:py-3.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50 text-purple-400" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No course reviews found</p>
                      <p className="text-xs text-gray-400 mt-1">Student reviews will appear here automatically.</p>
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((r) => {
                    const studentName = r.student?.fullName || r.user?.fullName || 'Anonymous Student';
                    const studentEmail = r.student?.email || r.user?.email || '';
                    const courseTitle = r.course?.title || r.courseTitle || 'Course';
                    const initials = studentName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

                    return (
                      <tr key={r._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm"
                              style={{ background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)' }}
                            >
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{studentName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{studentEmail}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">
                            {courseTitle}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <StarRating rating={r.rating} size={14} />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">{r.rating}.0</span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-md">
                          <p className="line-clamp-2">{r.comment || r.content || 'No text comment provided'}</p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDelete(r._id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
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
