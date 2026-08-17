import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseBySlug } from '../api/course.api';
import { getPublishedModules } from '../api/module.api';
import { getPublishedLectures } from '../api/lecture.api';
import { getCourseReviews, createReview, updateReview, deleteReview, getMyReview } from '../api/review.api';
import { addToCart } from '../api/cart.api';
import { addToWishlist, removeFromWishlist, getWishlistStatus } from '../api/wishlist.api';
import { getEnrollmentByCourse, createEnrollment } from '../api/enrollment.api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { StarRating } from '../components/ui/StarRating';
import { CurriculumAccordion } from '../components/course/CurriculumAccordion';
import {
  BookOpen, Clock, Users, Star, Heart, ShoppingCart, Play, CheckCircle,
  Globe, BarChart2, Trash2, Edit3, Send, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

function formatDuration(s = 0) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [editingReview, setEditingReview] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const courseRes = await getCourseBySlug(slug);
      const c = courseRes.data.course || courseRes.data.data?.course || courseRes.data.data;
      setCourse(c);

      const [modsRes, revRes] = await Promise.all([
        getPublishedModules(c._id).catch(() => ({ data: { modules: [] } })),
        getCourseReviews(c._id).catch(() => ({ data: { reviews: [] } })),
      ]);

      const rawMods = modsRes.data.modules || modsRes.data.data?.modules || modsRes.data.data || [];
      const modsWithLectures = await Promise.all(
        rawMods.map(async (mod) => {
          try {
            const lecRes = await getPublishedLectures(mod._id);
            return { ...mod, lectures: lecRes.data.lectures || lecRes.data.data?.lectures || lecRes.data.data || [] };
          } catch {
            return { ...mod, lectures: [] };
          }
        })
      );
      setModules(modsWithLectures);

      const revData = revRes.data.reviews || revRes.data.data?.reviews || revRes.data.data || [];
      setReviews(revData);

      if (user) {
        const isStaff = user.role === 'admin' || user.role === 'instructor';
        const [wishRes, enrRes, myRevRes] = await Promise.all([
          getWishlistStatus(c._id).catch(() => null),
          getEnrollmentByCourse(c._id).catch(() => null),
          user.role === 'student' ? getMyReview(c._id).catch(() => null) : Promise.resolve(null),
        ]);
        setIsWishlisted(wishRes?.data?.isInWishlist ?? wishRes?.data?.data?.isInWishlist ?? false);
        const enrData = enrRes?.data;
        const enrolledFlag = isStaff || !!(enrData?.enrolled || enrData?.enrollment || enrData?.data?.enrollment);
        setIsEnrolled(enrolledFlag);
        setEnrollment(enrData?.enrollment || enrData?.data?.enrollment || null);
        const userRev = myRevRes?.data?.review || myRevRes?.data?.data?.review;
        if (userRev) {
          setMyReview(userRev);
          setReviewForm({ rating: userRev.rating, comment: userRev.comment });
        }
      }
    } catch (err) {
      toast.error('Course not found');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  }, [slug, user, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'student') { toast.error('Only students can add to cart'); return; }
    setCartLoading(true);
    try {
      await addToCart(course._id);
      toast.success('Added to cart!');
      navigate('/cart');
    } catch (err) {
      if (err.message?.toLowerCase().includes('already enrolled')) {
        toast.success('You are already enrolled! Redirecting...');
        navigate(`/learn/${course._id}`);
      } else {
        toast.error(err.message);
      }
    } finally {
      setCartLoading(false);
    }
  };

  const handleFreeEnroll = async () => {
    if (!user) { navigate('/login'); return; }
    setCartLoading(true);
    try {
      await createEnrollment(course._id);
      toast.success('Successfully enrolled!');
      navigate(`/learn/${course._id}`);
    } catch (err) {
      if (err.message?.toLowerCase().includes('already enrolled')) {
        toast.success('You are already enrolled! Redirecting...');
        navigate(`/learn/${course._id}`);
      } else {
        toast.error(err.message);
      }
    } finally {
      setCartLoading(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    const prevWishlisted = isWishlisted;
    const nextWishlisted = !prevWishlisted;
    setIsWishlisted(nextWishlisted);
    toast.success(nextWishlisted ? 'Added to wishlist' : 'Removed from wishlist');

    try {
      if (prevWishlisted) {
        await removeFromWishlist(course._id);
      } else {
        await addToWishlist(course._id);
      }
    } catch (err) {
      setIsWishlisted(prevWishlisted);
      toast.error(err.response?.data?.message || err.message || 'Failed to update wishlist. Rolled back.');
    }
  };

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) { toast.error('Please write a review'); return; }
    setReviewLoading(true);
    try {
      if (editingReview && myReview) {
        await updateReview(myReview._id, reviewForm);
        toast.success('Review updated!');
      } else {
        await createReview(course._id, reviewForm);
        toast.success('Review submitted!');
      }
      setEditingReview(false);
      fetchData();
    } catch (err) { toast.error(err.message); }
    finally { setReviewLoading(false); }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    const prevReview = myReview;
    const prevForm = reviewForm;
    // Optimistic delete
    setMyReview(null);
    setReviewForm({ rating: 5, comment: '' });
    toast.success('Review deleted');

    try {
      await deleteReview(prevReview._id);
      fetchData();
    } catch (err) {
      // Rollback
      setMyReview(prevReview);
      setReviewForm(prevForm);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete review. Action rolled back.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-8 text-gray-900 dark:text-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="w-24 h-6 rounded-md bg-gray-200 dark:bg-gray-800" />
              <div className="w-3/4 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
              <div className="w-full h-5 rounded-md bg-gray-200 dark:bg-gray-800" />
              <div className="w-1/2 h-5 rounded-md bg-gray-200 dark:bg-gray-800" />
              <div className="flex gap-4 pt-2">
                <div className="w-32 h-6 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="w-32 h-6 rounded-full bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
              <div className="aspect-video w-full rounded-2xl bg-gray-200 dark:bg-gray-800" />
              <div className="w-1/3 h-8 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="w-full h-12 rounded-2xl bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!course) return null;

  const effectivePrice = course.discountPrice ?? course.price;

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-10">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/courses');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to courses
            </button>
            <br />
            <span className="inline-block px-3 py-1 bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-full uppercase tracking-wider">
              {course.category?.name || 'Course'}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">{course.title}</h1>
            {course.subtitle && <p className="text-base sm:text-lg text-gray-300">{course.subtitle}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 pt-2">
              {course.averageRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={course.averageRating} size={16} />
                  <span className="font-bold text-amber-400">{course.averageRating.toFixed(1)}</span>
                  <span className="text-gray-400">({course.totalReviews} reviews)</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-300">
                <Users size={15} className="text-gray-400" /> {course.enrolledStudentsCount || 0} enrolled
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-gray-300 pt-1">
              <div className="flex items-center gap-1.5"><Globe size={15} className="text-blue-400" /> {course.language || 'English'}</div>
              <div className="flex items-center gap-1.5 capitalize"><BarChart2 size={15} className="text-blue-400" /> {course.level || 'All Levels'}</div>
              <div className="flex items-center gap-1.5"><BookOpen size={15} className="text-blue-400" /> {course.totalLectures} lectures</div>
              {course.totalDurationInSeconds > 0 && (
                <div className="flex items-center gap-1.5"><Clock size={15} className="text-blue-400" /> {formatDuration(course.totalDurationInSeconds)}</div>
              )}
            </div>

            <div className="pt-2 text-sm text-gray-300">
              Instructor: <span className="text-white font-bold">{course.instructor?.fullName || course.instructor?.name || 'Instructor'}</span>
            </div>
          </div>

          {/* Purchase / Enrolled Card */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl transition-all">
            {course.thumbnailUrl && (
              <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-slate-950">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-5 sm:p-6 space-y-5">
              {!isEnrolled && !enrollment && (
                <div className="flex items-baseline gap-2.5">
                  {effectivePrice === 0 ? (
                    <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                      Free
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        ₹{effectivePrice}
                      </span>
                      {course.discountPrice !== null && course.discountPrice < course.price && (
                        <span className="text-sm font-semibold line-through text-gray-400">
                          ₹{course.price}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}

              {isEnrolled || enrollment ? (
                <a
                  href={`/learn/${course._id}`}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition cursor-pointer text-sm"
                  id="go-to-course-btn"
                >
                  <Play size={18} fill="white" /> Continue Learning
                </a>
              ) : user?.role === 'student' || !user ? (
                <div className="space-y-2.5">
                  {effectivePrice === 0 ? (
                    <button
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition cursor-pointer text-sm"
                      onClick={handleFreeEnroll}
                      disabled={cartLoading}
                      id="free-enroll-btn"
                    >
                      {cartLoading ? <div className="spinner spinner-sm" /> : <><Play size={18} fill="white" /> Enroll for Free</>}
                    </button>
                  ) : (
                    <button
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition cursor-pointer text-sm"
                      onClick={handleAddToCart}
                      disabled={cartLoading}
                      id="add-to-cart-btn"
                    >
                      {cartLoading ? <div className="spinner spinner-sm" /> : <><ShoppingCart size={18} /> Add to Cart</>}
                    </button>
                  )}
                  {user ? (
                    <button
                      className="w-full py-2.5 px-4 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 font-semibold flex items-center justify-center gap-2 transition cursor-pointer text-xs"
                      onClick={handleWishlist}
                      id="wishlist-btn"
                    >
                      <Heart size={15} fill={isWishlisted ? '#ef4444' : 'none'} color={isWishlisted ? '#ef4444' : 'currentColor'} />
                      {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
                    </button>
                  ) : (
                    <a
                      href="/login"
                      className="block text-center py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Login to access course options
                    </a>
                  )}
                </div>
              ) : null}

              {/* Includes Checklist */}
              <div className="pt-5 border-t border-gray-100 dark:border-slate-800 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">
                  This Course Includes:
                </p>
                {[
                  `${course.totalLectures || 0} on-demand lectures`,
                  `${course.totalModules || 0} course modules`,
                  `${formatDuration(course.totalDurationInSeconds)} total content`,
                  'Full lifetime access',
                  'Verified certificate of completion',
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Body */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="flex border-b border-gray-200 dark:border-slate-800 mb-8 gap-2">
          {['overview', 'curriculum', 'reviews'].map((t) => (
            <button
              key={t}
              className={`px-5 py-2.5 font-bold text-xs sm:text-sm capitalize transition border-b-2 cursor-pointer ${
                tab === t
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              onClick={() => setTab(t)}
              id={`detail-tab-${t}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs sm:text-sm">
            {/* Description */}
            <div className="space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">About This Course</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>

            <div className="space-y-6">
              {/* Requirements */}
              {course.requirements?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Requirements</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-300">
                    {course.requirements.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Learning Outcomes */}
              {course.learningOutcomes?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">What You'll Learn</h4>
                  <div className="space-y-2">
                    {course.learningOutcomes.map((o, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-gray-700 dark:text-gray-200">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Curriculum */}
        {tab === 'curriculum' && (
          <div style={{ maxWidth: 800 }}>
            <p style={{ marginBottom: '1.5rem' }}>
              {course.totalModules} modules • {course.totalLectures} lectures • {formatDuration(course.totalDurationInSeconds)} total length
            </p>
            <CurriculumAccordion modules={modules} />
          </div>
        )}

        {/* Reviews */}
        {tab === 'reviews' && (
          <div className="max-w-3xl space-y-6">
            {/* Stats Summary */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-6 shadow-xs">
              <div className="text-center shrink-0 pr-6 border-r border-gray-100 dark:border-slate-800">
                <div className="text-4xl font-extrabold text-amber-500">
                  {course.averageRating ? course.averageRating.toFixed(1) : '0.0'}
                </div>
                <div className="my-1">
                  <StarRating rating={course.averageRating || 0} size={18} />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{course.totalReviews || reviews.length || 0} reviews</div>
              </div>
              <div className="flex-1 text-xs text-gray-600 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Student Ratings & Reviews</p>
                <p>Ratings are calculated from verified enrolled student reviews. Rate this course to share your experience!</p>
              </div>
            </div>

            {/* Write/Edit Review */}
            {user?.role === 'student' && isEnrolled && (
              <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{myReview ? 'Your Review & Rating' : 'Write a Review & Rate Course'}</h4>

                {myReview && !editingReview ? (
                  <div>
                    <StarRating rating={myReview.rating} size={18} />
                    <p style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>{myReview.comment}</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingReview(true)} id="edit-review-btn">
                        <Edit3 size={14} /> Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={handleDeleteReview} id="delete-review-btn">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Your Rating</p>
                      <StarRating rating={reviewForm.rating} size={24} interactive onRate={r => setReviewForm(f => ({ ...f, rating: r }))} />
                    </div>
                    <textarea
                      className="input-field"
                      placeholder="Share your experience with this course…"
                      rows={4}
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                      style={{ resize: 'vertical', marginBottom: '1rem' }}
                      id="review-comment-input"
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary btn-sm" onClick={submitReview} disabled={reviewLoading} id="submit-review-btn">
                        {reviewLoading ? <div className="spinner spinner-sm" /> : <><Send size={14} /> {editingReview ? 'Update' : 'Submit'}</>}
                      </button>
                      {editingReview && (
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingReview(false)}>Cancel</button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Review List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {reviews.map(rev => (
                <div key={rev._id} style={{ padding: '1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <img src={rev.student?.avatarUrl || 'https://ik.imagekit.io/Sujalpanchal/default.avif'} alt={rev.student?.fullName} className="avatar" style={{ width: 36, height: 36 }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{rev.student?.fullName}</p>
                      <StarRating rating={rev.rating} size={13} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9375rem' }}>{rev.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon"><Star size={40} /></div>
                  <h3>No reviews yet</h3>
                  <p>Be the first to review this course!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
