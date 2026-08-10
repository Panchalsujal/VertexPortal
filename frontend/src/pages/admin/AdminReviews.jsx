import React, { useEffect, useState } from 'react';
import { getAdminReviews } from '../../api/admin.api';
import { getCourseReviews, deleteReview } from '../../api/review.api';
import { getAllCourses } from '../../api/course.api';
import { Star, Search, Trash2, MessageSquare, Award, ThumbsUp, Shield } from 'lucide-react';
import { StarRating } from '../../components/ui/StarRating';
import { SkeletonTable } from '../../components/ui/Spinner';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" /> Course Ratings & Reviews Management
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Inspect, filter, and moderate student ratings and course feedback platform-wide</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl"><Star className="w-5 h-5 fill-amber-400 text-amber-400" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Average Rating Score</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{avgRating} / 5.0</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl"><MessageSquare className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Student Reviews</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{totalReviews}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl"><ThumbsUp className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">5-Star Reviews</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{fiveStars}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl"><Award className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Positive Reviews (4★+)</p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">{fourStarsPlus}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search reviews by student name, email, course title, or comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars (Excellent)</option>
          <option value="4">4 Stars (Very Good)</option>
          <option value="3">3 Stars (Average)</option>
          <option value="2">2 Stars (Poor)</option>
          <option value="1">1 Star (Very Poor)</option>
        </select>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="p-4">Student</th>
                <th className="p-4">Course</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Review Comment</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-sm text-gray-900 dark:text-white">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No course reviews found matching search filters
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => {
                  const studentName = rev.student?.fullName || rev.user?.fullName || 'Student User';
                  const studentEmail = rev.student?.email || rev.user?.email || 'N/A';
                  const courseTitle = rev.course?.title || rev.courseTitle || 'Course';
                  const comment = rev.comment || rev.content || 'No text review comment provided';

                  return (
                    <tr key={rev._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{studentName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{studentEmail}</div>
                      </td>
                      <td className="p-4 text-xs font-medium text-blue-600 dark:text-blue-400 max-w-xs truncate">
                        {courseTitle}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <StarRating rating={rev.rating || 5} size={15} />
                      </td>
                      <td className="p-4 text-xs text-gray-700 dark:text-gray-300 max-w-md">
                        {comment}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(rev._id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
