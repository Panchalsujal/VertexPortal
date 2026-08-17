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
import { ButtonGroup, ButtonGroupItem } from '../components/ui/ButtonGroup';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import {
  BookOpen, Clock, Users, Star, Heart, ShoppingCart, Play, CheckCircle, CheckCircle2,
  Globe, BarChart2, Trash2, Edit3, Send, ArrowLeft, Award, Sparkles,
  ShieldCheck, Video, FileCode, MessageSquare, AlertCircle,
  HelpCircle,
  FileQuestion,
  Info,
  UserCheck,
} from 'lucide-react';

const SAFE_DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237c3aed'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
import toast from 'react-hot-toast';

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
      <div className="min-h-[85vh] bg-[#f8fafc] dark:bg-[#0d0f1a] text-gray-900 dark:text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <div className="w-32 h-7 rounded-full bg-gray-200 dark:bg-slate-800" />
              <div className="w-3/4 h-12 rounded-2xl bg-gray-200 dark:bg-slate-800" />
              <div className="w-full h-6 rounded-lg bg-gray-200 dark:bg-slate-800" />
              <div className="w-1/2 h-6 rounded-lg bg-gray-200 dark:bg-slate-800" />
            </div>
            <div className="lg:col-span-4 bg-white dark:bg-[#161928] rounded-3xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
              <div className="aspect-video w-full rounded-2xl bg-gray-200 dark:bg-slate-800" />
              <div className="w-1/2 h-8 rounded-lg bg-gray-200 dark:bg-slate-800" />
              <div className="w-full h-12 rounded-xl bg-gray-200 dark:bg-slate-800" />
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
  const siteUrl = 'https://vertex-mu-eight.vercel.app';
  const canonicalUrl = `${siteUrl}/courses/${encodeURIComponent(slug)}`;
  const seoTitle = `${course.title} | VertexPortal`;
  const rawDescription =
    course.subtitle ||
    course.description ||
    `Learn ${course.title} on VertexPortal with structured lessons, practical learning, AI assistance, and a verified certificate.`;
  const seoDescription =
    rawDescription.length > 160
      ? `${rawDescription.slice(0, 157).trim()}...`
      : rawDescription;
  const seoImage = course.thumbnailUrl || `${siteUrl}/og-image.png`;
  const instructorName =
    course.instructor?.fullName ||
    course.instructor?.name ||
    'VertexPortal Instructor';

  const courseStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: seoDescription,
    url: canonicalUrl,
    image: seoImage,
    provider: {
      '@type': 'Organization',
      name: 'VertexPortal',
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
        <meta property="og:site_name" content="VertexPortal" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:image:alt" content={`${course.title} course thumbnail`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={seoImage} />

        <script type="application/ld+json">
          {JSON.stringify(courseStructuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0d0f1a] text-gray-900 dark:text-gray-100 font-[Inter,sans-serif] selection:bg-purple-500 selection:text-white transition-colors duration-200 pb-24 lg:pb-0">
      
      {/* ── Mobile Sticky Bottom CTA Bar (hidden on lg+) ─────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 dark:bg-[#10121f]/95 backdrop-blur-md border-t border-gray-200/80 dark:border-slate-800 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex-1 min-w-0">
          {!isEnrolled && !enrollment ? (
            effectivePrice === 0 ? (
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">Free Course</p>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-gray-900 dark:text-white">₹{effectivePrice}</span>
                {hasDiscount && (
                  <>
                    <span className="text-sm line-through text-gray-400">₹{course.price}</span>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{discountPercent}% OFF</span>
                  </>
                )}
              </div>
            )
          ) : (
            <p className="text-sm font-bold text-purple-700 dark:text-purple-300">You are enrolled 🎉</p>
          )}
        </div>
        <div className="shrink-0">
          {isEnrolled || enrollment ? (
            <Link
              to={`/learn/${course._id}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-purple-600/30 transition-all"
              id="mobile-go-to-course-btn"
            >
              <Play className="w-4 h-4 fill-white" /> Continue
            </Link>
          ) : effectivePrice === 0 ? (
            <button
              onClick={handleFreeEnroll}
              disabled={cartLoading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all"
              id="mobile-free-enroll-btn"
            >
              {cartLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Play className="w-4 h-4 fill-white" /> Enroll Free</>}
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm shadow-lg shadow-purple-600/30 transition-all"
              id="mobile-add-to-cart-btn"
            >
              {cartLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ShoppingCart className="w-4 h-4" /> Enroll Now</>}
            </button>
          )}
        </div>
      </div>
      
      {/* Hero Section with Unified Seamless Gradient Mesh (ChaiCode & Sheryians Style) */}
      <section className="relative pt-6 pb-12 sm:pb-16 bg-gradient-to-b from-purple-50/70 via-white to-[#f8fafc] dark:from-[#131627] dark:via-[#0f1220] dark:to-[#0d0f1a] border-b border-gray-200/70 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                if (window.history.length > 1 && window.history.state?.idx > 0) {
                  navigate(-1);
                } else {
                  navigate('/courses');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-800/90 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white rounded-full text-xs font-semibold transition border border-gray-200 dark:border-slate-700 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to courses
            </button>
            <span className="text-gray-300 dark:text-slate-600 text-xs">/</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              {course.category?.name || 'Development'}
            </span>
          </div>

          {/* Main Hero Content & Purchase Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Course Details & Info */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.18]">
                  {course.title}
                </h1>
                {course.subtitle && (
                  <p className="text-base sm:text-lg text-gray-600 dark:text-slate-300 leading-relaxed font-normal">
                    {course.subtitle}
                  </p>
                )}
              </div>

              {/* Meta Tags Row */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
                {/* Rating Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-full text-xs shadow-2xs">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-extrabold text-gray-900 dark:text-white">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</span>
                  </div>
                  <span className="text-gray-500 dark:text-slate-400">({totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'})</span>
                </div>

                {/* Enrolled Students Badge */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-full text-xs font-semibold text-gray-700 dark:text-slate-300 shadow-2xs">
                  <Users className="w-3.5 h-3.5 text-purple-600 dark:text-indigo-400" />
                  <span>{course.enrolledStudentsCount || 0} Learners</span>
                </div>

                {/* Language */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-full text-xs text-gray-700 dark:text-slate-300 shadow-2xs">
                  <Globe className="w-3.5 h-3.5 text-sky-500" />
                  <span>{course.language || 'English'}</span>
                </div>

                {/* Level */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-full text-xs text-gray-700 dark:text-slate-300 shadow-2xs capitalize">
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{course.level || 'All Levels'}</span>
                </div>
              </div>

              {/* Course Key Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
                <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Curriculum</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{course.totalLectures || 0} Lectures</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Total Duration</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{formatDuration(course.totalDurationInSeconds)}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-2xl p-3.5 flex items-center gap-3 col-span-2 sm:col-span-1 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Certificate</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Verified Credential</p>
                  </div>
                </div>
              </div>

              {/* Mentor / Instructor Info Card */}
              <div className="flex items-center gap-3.5 pt-2">
                <img
                  src={course.instructor?.avatarUrl && !course.instructor.avatarUrl.includes('default.avif') ? course.instructor.avatarUrl : SAFE_DEFAULT_AVATAR}
                  alt={course.instructor?.fullName || 'Instructor'}
                  onError={(e) => { e.currentTarget.src = SAFE_DEFAULT_AVATAR; }}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-purple-500/30 border border-gray-200 dark:border-slate-800 shadow-2xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {course.instructor?.fullName || course.instructor?.name || 'Instructor'}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-2.5 py-0.5 rounded-full">
                      <UserCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Verified Mentor
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Lead Instructor & Engineering Architect</p>
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Floating Purchase Card (ChaiCode / Sheryians Style) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="bg-white dark:bg-[#161928] border border-gray-200 dark:border-[#2a2f4e] rounded-3xl overflow-hidden shadow-xl dark:shadow-purple-950/30 relative transition-all">
                
                {/* Thumbnail Header with High-Definition Badge */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-slate-950 text-purple-400">
                      <Video className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15 flex items-center gap-1.5">
                      <Play className="w-3 h-3 text-purple-400 fill-purple-400" /> High Definition Content
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-6">
                  {/* Pricing Section */}
                  {!isEnrolled && !enrollment && (
                    <div className="space-y-1">
                      {effectivePrice === 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">Free Enrollment</span>
                          <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full uppercase">
                            100% Free
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                            ₹{effectivePrice}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-base font-semibold line-through text-gray-400 dark:text-slate-500">
                                ₹{course.price}
                              </span>
                              <span className="text-xs font-extrabold px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 rounded-full">
                                {discountPercent}% OFF
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">Full lifetime access & verified certificate included.</p>
                    </div>
                  )}

                  {/* Primary CTA Buttons */}
                  <div className="space-y-3">
                    {isEnrolled || enrollment ? (
                      <Link
                        to={`/learn/${course._id}`}
                        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black flex items-center justify-center gap-2.5 shadow-lg shadow-purple-600/25 transition-all duration-200 cursor-pointer text-sm tracking-wide"
                        id="go-to-course-btn"
                      >
                        <Play className="w-4 h-4 fill-white" /> Continue Learning
                      </Link>
                    ) : user?.role === 'student' || !user ? (
                      <>
                        {effectivePrice === 0 ? (
                          <button
                            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer text-sm"
                            onClick={handleFreeEnroll}
                            disabled={cartLoading}
                            id="free-enroll-btn"
                          >
                            {cartLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Play className="w-4 h-4 fill-white" /> Enroll in Course for Free
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black flex items-center justify-center gap-2.5 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all duration-200 cursor-pointer text-sm tracking-wide"
                            onClick={handleAddToCart}
                            disabled={cartLoading}
                            id="add-to-cart-btn"
                          >
                            {cartLoading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <ShoppingCart className="w-4 h-4" /> Enroll in Course
                              </>
                            )}
                          </button>
                        )}

                        {user ? (
                          <button
                            className="w-full py-2.5 px-4 rounded-2xl bg-gray-100 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700/80 text-gray-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-2 transition cursor-pointer text-xs"
                            onClick={handleWishlist}
                            id="wishlist-btn"
                          >
                            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-gray-400 dark:text-slate-400'}`} />
                            <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                          </button>
                        ) : (
                          <Link
                            to="/login"
                            className="block text-center py-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Sign in to enroll or save course
                          </Link>
                        )}
                      </>
                    ) : null}
                  </div>

                  {/* Highlights Checklist */}
                  <div className="pt-5 border-t border-gray-100 dark:border-slate-800 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                      What's Included:
                    </p>
                    <ul className="space-y-2.5 text-xs text-gray-700 dark:text-slate-300">
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{course.totalLectures || 0} On-demand video lectures</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{course.totalModules || 0} Structured curriculum modules</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{formatDuration(course.totalDurationInSeconds)} total duration</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Full lifetime access on web & mobile</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Verified certificate on course completion</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tabbed Content Section */}
      <section className="py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-8 space-y-8">
              
              {/* Shadcn Tabs for Course Details Navigation */}
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="p-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: BookOpen },
                    { id: 'curriculum', label: 'Curriculum', icon: Video },
                    { id: 'instructor', label: 'Instructor', icon: UserCheck },
                    { id: 'reviews', label: `Reviews (${totalReviewsCount})`, icon: Star },
                  ].map((t) => {
                    const Icon = t.icon;
                    return (
                      <TabsTrigger
                        key={t.id}
                        value={t.id}
                        id={`detail-tab-${t.id}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{t.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              {/* Tab 1: Overview */}
              {tab === 'overview' && (
                <div className="space-y-8">
                  {/* About Description Card */}
                  <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" /> About This Course
                    </h3>
                    <div className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-3 font-normal">
                      {course.description}
                    </div>
                  </div>

                  {/* What You'll Learn Grid */}
                  {course.learningOutcomes?.length > 0 && (
                    <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xs">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <CheckCircle className="w-5 h-5 text-emerald-500" /> What You'll Master
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {course.learningOutcomes.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 dark:bg-slate-900/60 border border-gray-200/70 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-gray-800 dark:text-slate-200"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prerequisites & Requirements */}
                  {course.requirements?.length > 0 && (
                    <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xs">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <FileCode className="w-4 h-4 text-sky-500" /> Prerequisites & Requirements
                      </h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700 dark:text-slate-300">
                        {course.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-center gap-2.5 bg-gray-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-gray-200/60 dark:border-slate-800">
                            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Curriculum Roadmap */}
              {tab === 'curriculum' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-3xl p-6 flex items-center justify-between shadow-2xs">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Course Content & Lectures</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        {course.totalModules || modules.length} Modules • {course.totalLectures || 0} Lectures • {formatDuration(course.totalDurationInSeconds)} Length
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-full">
                      Full Syllabus
                    </span>
                  </div>

                  <CurriculumAccordion modules={modules} />
                </div>
              )}

              {/* Tab 3: Instructor Profile */}
              {tab === 'instructor' && (
                <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <img
                      src={course.instructor?.avatarUrl && !course.instructor.avatarUrl.includes('default.avif') ? course.instructor.avatarUrl : SAFE_DEFAULT_AVATAR}
                      alt={course.instructor?.fullName}
                      onError={(e) => { e.currentTarget.src = SAFE_DEFAULT_AVATAR; }}
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-purple-500/30 border border-gray-200 dark:border-slate-800"
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {course.instructor?.fullName || course.instructor?.name || 'Instructor'}
                        </h3>
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800/60 px-2.5 py-0.5 rounded-full">
                          Mentor
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Senior Full-Stack Architect & Engineering Lead</p>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-slate-300 pt-1">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-purple-600 dark:text-indigo-400" /> Active Instructor</span>
                        <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-emerald-500" /> Verified Credentials</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                    Passionate educator focused on building production-ready architectures and helping students transform into industry-ready software engineers with practical hands-on projects.
                  </p>
                </div>
              )}

              {/* Tab 4: Reviews & Ratings */}
              {tab === 'reviews' && (
                <div className="space-y-8">
                  {/* Rating Breakdown & Stats Card */}
                  <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-8 shadow-2xs">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                      {/* Score Summary */}
                      <div className="md:col-span-4 text-center md:text-left flex flex-col items-center md:items-start justify-center md:border-r md:border-gray-200 dark:md:border-slate-800 md:pr-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
                            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                          </span>
                          <span className="text-gray-400 dark:text-slate-500 font-medium text-lg">/ 5.0</span>
                        </div>

                        <div className="my-2.5">
                          <StarRating rating={averageRating} size={22} />
                        </div>

                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                          Based on {totalReviewsCount} verified {totalReviewsCount === 1 ? 'review' : 'reviews'}
                        </p>
                      </div>

                      {/* Rating Distribution Progress Bars */}
                      <div className="md:col-span-8 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                            Rating Distribution
                          </h4>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-4 h-4 inline" /> Verified Student Reviews
                          </span>
                        </div>

                        {[5, 4, 3, 2, 1].map((starVal) => {
                          const count = ratingBreakdown[starVal] || 0;
                          const total = totalReviewsCount || 1;
                          const percentage = totalReviewsCount ? Math.round((count / total) * 100) : 0;

                          return (
                            <div key={starVal} className="flex items-center gap-3 text-xs">
                              <div className="flex items-center gap-1 w-12 shrink-0 font-semibold text-gray-700 dark:text-slate-300">
                                <span>{starVal}</span>
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              </div>
                              <div className="flex-1 h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="w-10 text-right text-gray-400 dark:text-slate-500 text-[11px] font-mono">
                                {percentage}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Write/Edit Review Card */}
                  {user?.role === 'student' && isEnrolled && (
                    <div className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-3xl p-6 sm:p-7 shadow-2xs space-y-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          {myReview ? 'Your Course Review' : 'Write a Review & Rate'}
                        </h4>
                        {myReview && !editingReview && (
                          <span className="text-xs font-semibold px-3 py-1 bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800/60">
                            Your Review
                          </span>
                        )}
                      </div>

                      {myReview && !editingReview ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <StarRating rating={myReview.rating} size={20} />
                            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                              ({myReview.rating} out of 5 stars)
                            </span>
                          </div>

                          <p className="text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-200/70 dark:border-slate-800 leading-relaxed whitespace-pre-line">
                            {myReview.comment}
                          </p>

                          <div className="flex items-center gap-3 pt-1">
                            <button
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer border border-gray-200 dark:border-slate-700"
                              onClick={() => setEditingReview(true)}
                              id="edit-review-btn"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit Review
                            </button>
                            <button
                              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer border border-rose-200 dark:border-rose-800/40"
                              onClick={handleDeleteReview}
                              id="delete-review-btn"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                              Your Rating
                            </label>
                            <StarRating
                              rating={reviewForm.rating}
                              size={28}
                              interactive
                              showLabel
                              onRate={(r) => setReviewForm((f) => ({ ...f, rating: r }))}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                              Your Feedback & Experience
                            </label>
                            <textarea
                              className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all resize-y min-h-[110px]"
                              placeholder="Share what you learned, the quality of lectures, exercises, and your overall experience..."
                              rows={4}
                              value={reviewForm.comment}
                              onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                              id="review-comment-input"
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                              onClick={submitReview}
                              disabled={reviewLoading}
                              id="submit-review-btn"
                            >
                              {reviewLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  {editingReview ? 'Update Review' : 'Submit Review'}
                                </>
                              )}
                            </button>
                            {editingReview && (
                              <button
                                className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all cursor-pointer"
                                onClick={() => setEditingReview(false)}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Student Comments List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        Student Reviews & Feedback ({totalReviewsCount})
                      </h4>
                    </div>

                    {reviews.map((rev) => (
                      <div
                        key={rev._id}
                        className="bg-white dark:bg-[#161928] border border-gray-200/80 dark:border-[#2a2f4e] rounded-2xl p-5 sm:p-6 space-y-3 hover:border-purple-200 dark:hover:border-slate-700 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={rev.student?.avatarUrl && !rev.student.avatarUrl.includes('default.avif') ? rev.student.avatarUrl : SAFE_DEFAULT_AVATAR}
                              alt={rev.student?.fullName}
                              onError={(e) => { e.currentTarget.src = SAFE_DEFAULT_AVATAR; }}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-100 dark:ring-purple-900 border border-gray-200 dark:border-slate-800"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-gray-900 dark:text-white">
                                  {rev.student?.fullName || 'Enrolled Student'}
                                </p>
                                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                                  Verified Learner
                                </span>
                              </div>
                              <div className="mt-1">
                                <StarRating rating={rev.rating} size={14} />
                              </div>
                            </div>
                          </div>

                          {rev.createdAt && (
                            <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                              {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pl-0.5">
                          {rev.comment}
                        </p>
                      </div>
                    ))}

                    {reviews.length === 0 && (
                      <div className="text-center py-12 px-4 bg-white dark:bg-[#161928] border border-dashed border-gray-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-2xs">
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                          <Star className="w-6 h-6 fill-amber-400" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">No Reviews Yet</h4>
                        <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                          Be the first verified learner to complete this course and share your rating!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}