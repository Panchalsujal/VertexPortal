import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getCourseBySlug } from '../api/course.api';
import { getPublishedModules } from '../api/module.api';
import { getPublishedLectures } from '../api/lecture.api';
import { getCourseReviews, createReview, updateReview, deleteReview, getMyReview } from '../api/review.api';
import { addToCart } from '../api/cart.api';
import { addToWishlist, removeFromWishlist, getWishlistStatus } from '../api/wishlist.api';
import { getEnrollmentByCourse, createEnrollment } from '../api/enrollment.api';
import { useAuth } from '../context/AuthContext';
import { StarRating } from '../components/ui/StarRating';
import { CurriculumAccordion } from '../components/course/CurriculumAccordion';
import {
  BookOpen, Clock, Users, Star, Heart, ShoppingCart, Play, CheckCircle2,
  Globe, BarChart2, Trash2, Edit3, Send, ArrowLeft, Award, ShieldCheck, Video, FileCode, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const SAFE_DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237c3aed'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

function formatDuration(s = 0) {
  if (!s || s <= 0) return '0m';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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

  // Dynamically calculate accurate live rating stats
  const { averageRating, totalReviewsCount, ratingBreakdown } = useMemo(() => {
    if (!reviews.length) {
      const avg = course?.averageRating || 0;
      const count = course?.totalReviews || 0;
      return {
        averageRating: avg,
        totalReviewsCount: count,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = sum / reviews.length;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
      breakdown[rounded] = (breakdown[rounded] || 0) + 1;
    });

    return {
      averageRating: avg,
      totalReviewsCount: reviews.length,
      ratingBreakdown: breakdown,
    };
  }, [reviews, course]);

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
      toast.error(err.response?.data?.message || err.message || 'Failed to update wishlist');
    }
  };

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) { toast.error('Please write a review comment'); return; }
    setReviewLoading(true);
    try {
      if (editingReview && myReview) {
        await updateReview(myReview._id, reviewForm);
        toast.success('Review updated successfully!');
      } else {
        await createReview(course._id, reviewForm);
        toast.success('Review submitted successfully!');
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
    setMyReview(null);
    setReviewForm({ rating: 5, comment: '' });
    toast.success('Review deleted');

    try {
      await deleteReview(prevReview._id);
      fetchData();
    } catch (err) {
      setMyReview(prevReview);
      setReviewForm(prevForm);
      toast.error(err.response?.data?.message || err.message || 'Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] bg-gray-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="w-32 h-6 rounded bg-gray-200 dark:bg-neutral-800" />
          <div className="w-3/4 h-12 rounded bg-gray-200 dark:bg-neutral-800" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="w-full h-40 rounded-lg bg-gray-200 dark:bg-neutral-800" />
              <div className="w-full h-24 rounded-lg bg-gray-200 dark:bg-neutral-800" />
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="w-full h-64 rounded-lg bg-gray-200 dark:bg-neutral-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const effectivePrice = course.discountPrice ?? course.price;
  const hasDiscount = course.discountPrice !== null && course.discountPrice !== undefined && course.discountPrice < course.price;
  const discountPercent = hasDiscount ? Math.round(((course.price - course.discountPrice) / course.price) * 100) : 0;

  // SEO
  const siteUrl = 'https://navgujaratacademy.online';
  const canonicalUrl = `${siteUrl}/courses/${encodeURIComponent(slug)}`;
  const seoTitle = `${course.title} | NavGujarat Academy`;
  const rawDescription =
    course.subtitle ||
    course.description ||
    `Learn ${course.title} on NavGujarat Academy.`;
  const seoDescription =
    rawDescription.length > 160
      ? `${rawDescription.slice(0, 157).trim()}...`
      : rawDescription;
  const seoImage = course.thumbnailUrl || `${siteUrl}/og-image.png`;
  const instructorName =
    course.instructor?.fullName ||
    course.instructor?.name ||
    'NavGujarat Academy Instructor';

  const courseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: seoDescription,
    url: canonicalUrl,
    image: seoImage,
    provider: {
      '@type': 'Organization',
      name: 'NavGujarat Academy',
      sameAs: `${siteUrl}/`,
    },
    author: {
      '@type': 'Person',
      name: instructorName,
    },
    inLanguage: course.language || 'English',
    educationalLevel: course.level || 'All Levels',
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="NavGujarat Academy" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:image:alt" content={`${course.title} course thumbnail`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={seoImage} />
        <script type="application/ld+json">{JSON.stringify(courseStructuredData)}</script>
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-neutral-950 font-[Inter,sans-serif] text-gray-900 dark:text-gray-100 selection:bg-gray-900 selection:text-white dark:selection:bg-white dark:selection:text-gray-900 transition-colors duration-200 pb-24 lg:pb-12">
        
        {/* Mobile Sticky CTA Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-neutral-950 border-t border-gray-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between pb-safe">
          <div className="flex-1 min-w-0 pr-4">
            {!isEnrolled && !enrollment ? (
              effectivePrice === 0 ? (
                <p className="text-base font-bold text-gray-900 dark:text-white">Free</p>
              ) : (
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">₹{effectivePrice}</span>
                  {hasDiscount && <span className="text-xs text-gray-500 line-through">₹{course.price}</span>}
                </div>
              )
            ) : (
              <p className="text-sm font-bold text-gray-900 dark:text-white">Enrolled</p>
            )}
          </div>
          <div className="shrink-0">
            {isEnrolled || enrollment ? (
              <Link
                to={`/learn/${course._id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm transition-colors hover:opacity-90"
              >
                Continue
              </Link>
            ) : effectivePrice === 0 ? (
              <button
                onClick={handleFreeEnroll}
                disabled={cartLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {cartLoading ? 'Enrolling...' : 'Enroll Free'}
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={cartLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {cartLoading ? 'Adding...' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>

        {/* Course Header (Product Info, NOT Marketing) */}
        <section className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 pt-6 pb-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() => {
                  if (window.history.length > 1 && window.history.state?.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/courses');
                  }
                }}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to courses
              </button>
            </div>

            <div className="max-w-3xl">
              {course.category?.name && (
                <div className="mb-4">
                  <span className="text-sm font-bold tracking-wide text-gray-500 dark:text-neutral-400 uppercase">
                    {course.category.name}
                  </span>
                </div>
              )}
              
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4 tracking-tight">
                {course.title}
              </h1>
              
              {course.subtitle && (
                <p className="text-lg text-gray-600 dark:text-neutral-300 mb-6 leading-relaxed">
                  {course.subtitle}
                </p>
              )}

              {/* Minimal Metadata Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-neutral-400 font-medium">
                {averageRating > 0 && (
                  <div className="flex items-center gap-1.5 text-gray-900 dark:text-white">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-bold">{averageRating.toFixed(1)}</span>
                    <span className="text-gray-500 dark:text-neutral-500 font-normal">({totalReviewsCount} reviews)</span>
                  </div>
                )}
                
                {(course.enrolledStudentsCount > 0) && (
                  <>
                    <span className="hidden sm:inline text-gray-300 dark:text-neutral-600">•</span>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>{course.enrolledStudentsCount} Learners</span>
                    </div>
                  </>
                )}

                {(course.totalDurationInSeconds > 0) && (
                  <>
                    <span className="hidden sm:inline text-gray-300 dark:text-neutral-600">•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(course.totalDurationInSeconds)}</span>
                    </div>
                  </>
                )}
                
                {course.level && (
                  <>
                    <span className="hidden sm:inline text-gray-300 dark:text-neutral-600">•</span>
                    <div className="flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4" />
                      <span className="capitalize">{course.level}</span>
                    </div>
                  </>
                )}

                {course.language && (
                  <>
                    <span className="hidden sm:inline text-gray-300 dark:text-neutral-600">•</span>
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      <span>{course.language}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3 text-sm text-gray-600 dark:text-neutral-400">
                <span>Created by</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {course.instructor?.fullName || course.instructor?.name || 'NavGujarat Academy'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Layout */}
        <section className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              
              {/* Left Column: Continuous Scrolling Content */}
              <div className="lg:col-span-8 space-y-12">
                
                {/* 1. What You'll Learn */}
                {course.learningOutcomes?.length > 0 && (
                  <div className="space-y-5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">What you'll learn</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {course.learningOutcomes.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-gray-400 dark:text-neutral-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Description */}
                {course.description && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Overview</h2>
                    <div className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                      {course.description}
                    </div>
                  </div>
                )}

                {/* 3. Curriculum */}
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Curriculum</h2>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium">
                      {course.totalModules || modules.length} Modules • {course.totalLectures || 0} Lectures • {formatDuration(course.totalDurationInSeconds)} total length
                    </p>
                  </div>
                  <div className="pt-2">
                    {/* CurriculumAccordion is treated as a core UI piece, un-modified functionally */}
                    <CurriculumAccordion modules={modules} />
                  </div>
                </div>

                {/* 4. Requirements */}
                {course.requirements?.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Requirements</h2>
                    <ul className="space-y-3 list-disc pl-5">
                      {course.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-gray-700 dark:text-neutral-300">
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 5. Instructor */}
                <div className="space-y-5 border-t border-gray-200 dark:border-neutral-800 pt-10">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Instructor</h2>
                  <div className="flex items-start gap-5">
                    <img
                      src={course.instructor?.avatarUrl && !course.instructor.avatarUrl.includes('default.avif') ? course.instructor.avatarUrl : SAFE_DEFAULT_AVATAR}
                      alt={course.instructor?.fullName}
                      onError={(e) => { e.currentTarget.src = SAFE_DEFAULT_AVATAR; }}
                      className="w-24 h-24 rounded-full object-cover bg-gray-100 dark:bg-neutral-800"
                    />
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {course.instructor?.fullName || course.instructor?.name || 'Instructor'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-neutral-400">Lead Educator & Mentor</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-neutral-300 pt-1 font-medium">
                        <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Active Mentor</span>
                        <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> Verified</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Reviews */}
                <div className="space-y-8 border-t border-gray-200 dark:border-neutral-800 pt-10">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Reviews</h2>
                  
                  {/* Rating Breakdown */}
                  {reviews.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-gray-50 dark:bg-neutral-900 p-6 rounded-xl border border-gray-200 dark:border-neutral-800">
                      <div className="md:col-span-4 text-center md:text-left flex flex-col items-center md:items-start justify-center md:border-r border-gray-200 dark:border-neutral-700 md:pr-6">
                        <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                        </span>
                        <div className="my-3">
                          <StarRating rating={averageRating} size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-neutral-400">
                          Course Rating
                        </p>
                      </div>
                      
                      <div className="md:col-span-8 space-y-2">
                        {[5, 4, 3, 2, 1].map((starVal) => {
                          const count = ratingBreakdown[starVal] || 0;
                          const total = totalReviewsCount || 1;
                          const percentage = totalReviewsCount ? Math.round((count / total) * 100) : 0;
                          return (
                            <div key={starVal} className="flex items-center gap-3 text-sm">
                              <div className="flex items-center gap-1 w-10 shrink-0 text-gray-600 dark:text-neutral-400 font-medium">
                                <span>{starVal}</span>
                                <Star className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 h-2.5 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gray-700 dark:bg-gray-300 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="w-10 text-right text-gray-500 dark:text-neutral-500 text-xs">
                                {percentage}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Submit / Edit Review */}
                  {user?.role === 'student' && isEnrolled && (
                    <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 space-y-5">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {myReview ? 'Your Review' : 'Write a Review'}
                      </h3>

                      {myReview && !editingReview ? (
                        <div className="space-y-4">
                          <StarRating rating={myReview.rating} size={18} />
                          <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                            {myReview.comment}
                          </p>
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={() => setEditingReview(true)}
                              className="text-sm font-medium text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-200 dark:border-neutral-800 px-4 py-2 rounded-lg"
                            >
                              Edit
                            </button>
                            <button
                              onClick={handleDeleteReview}
                              className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors border border-red-200 dark:border-red-900/30 px-4 py-2 rounded-lg"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-neutral-300 mb-2">Rating</label>
                            <StarRating
                              rating={reviewForm.rating}
                              size={24}
                              interactive
                              onRate={(r) => setReviewForm((f) => ({ ...f, rating: r }))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-neutral-300 mb-2">Feedback</label>
                            <textarea
                              className="w-full bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent outline-none transition-all"
                              rows={4}
                              placeholder="Share your experience..."
                              value={reviewForm.comment}
                              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={submitReview}
                              disabled={reviewLoading}
                              className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {reviewLoading ? 'Submitting...' : (editingReview ? 'Update' : 'Submit')}
                            </button>
                            {editingReview && (
                              <button
                                onClick={() => setEditingReview(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((rev) => (
                        <div key={rev._id} className="border-b border-gray-200 dark:border-neutral-800 pb-6 last:border-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={rev.student?.avatarUrl && !rev.student.avatarUrl.includes('default.avif') ? rev.student.avatarUrl : SAFE_DEFAULT_AVATAR}
                                alt={rev.student?.fullName}
                                onError={(e) => { e.currentTarget.src = SAFE_DEFAULT_AVATAR; }}
                                className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-neutral-800"
                              />
                              <div>
                                <p className="font-bold text-sm text-gray-900 dark:text-white">
                                  {rev.student?.fullName || 'Student'}
                                </p>
                                <div className="mt-0.5">
                                  <StarRating rating={rev.rating} size={14} />
                                </div>
                              </div>
                            </div>
                            {rev.createdAt && (
                              <span className="text-xs text-gray-500 dark:text-neutral-500">
                                {new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-neutral-300 leading-relaxed pl-13">
                            {rev.comment}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-neutral-400 italic">No reviews yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Decision Panel */}
              <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-8">
                <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
                  
                  {/* Thumbnail */}
                  <div className="aspect-video w-full bg-gray-100 dark:bg-neutral-900 relative">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-neutral-600">
                        <Video className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Price Info */}
                    {!isEnrolled && !enrollment && (
                      <div className="flex flex-col gap-1">
                        {effectivePrice === 0 ? (
                          <span className="text-3xl font-bold text-gray-900 dark:text-white">Free</span>
                        ) : (
                          <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{effectivePrice}</span>
                            {hasDiscount && (
                              <span className="text-base text-gray-500 line-through">₹{course.price}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                      {isEnrolled || enrollment ? (
                        <Link
                          to={`/learn/${course._id}`}
                          className="w-full py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-center block transition-colors hover:opacity-90"
                        >
                          Continue Learning
                        </Link>
                      ) : (
                        <>
                          {effectivePrice === 0 ? (
                            <button
                              onClick={handleFreeEnroll}
                              disabled={cartLoading}
                              className="w-full py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold transition-colors hover:opacity-90 disabled:opacity-50"
                            >
                              {cartLoading ? 'Processing...' : 'Enroll for Free'}
                            </button>
                          ) : (
                            <button
                              onClick={handleAddToCart}
                              disabled={cartLoading}
                              className="w-full py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold transition-colors hover:opacity-90 disabled:opacity-50"
                            >
                              {cartLoading ? 'Processing...' : 'Add to Cart'}
                            </button>
                          )}
                        </>
                      )}

                      {/* Wishlist Action */}
                      {(!isEnrolled && !enrollment) && (
                        user ? (
                          <button
                            onClick={handleWishlist}
                            className="w-full py-2.5 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2"
                          >
                            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-gray-900 dark:fill-white text-gray-900 dark:text-white' : ''}`} />
                            {isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                          </button>
                        ) : (
                          <Link
                            to="/login"
                            className="block text-center text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white"
                          >
                            Sign in to save course
                          </Link>
                        )
                      )}
                    </div>

                    {/* Includes */}
                    <div className="pt-6 border-t border-gray-200 dark:border-neutral-800">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">This course includes:</h4>
                      <ul className="space-y-3 text-sm text-gray-600 dark:text-neutral-400">
                        <li className="flex items-center gap-3">
                          <Video className="w-4 h-4" /> {course.totalLectures || 0} on-demand video lectures
                        </li>
                        <li className="flex items-center gap-3">
                          <BookOpen className="w-4 h-4" /> {course.totalModules || 0} curriculum modules
                        </li>
                        <li className="flex items-center gap-3">
                          <Clock className="w-4 h-4" /> {formatDuration(course.totalDurationInSeconds)} total length
                        </li>
                        <li className="flex items-center gap-3">
                          <Award className="w-4 h-4" /> Certificate of completion
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>
    </>
  );
}