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
  Globe, BarChart2, Trash2, Edit3, Send
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
    try {
      if (isWishlisted) {
        await removeFromWishlist(course._id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(course._id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (err) { toast.error(err.message); }
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
    try {
      await deleteReview(myReview._id);
      setMyReview(null);
      setReviewForm({ rating: 5, comment: '' });
      toast.success('Review deleted');
      fetchData();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="page-loader"><Spinner /></div>;
  if (!course) return null;

  const effectivePrice = course.discountPrice ?? course.price;

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f0826 0%, #0a1628 100%)', borderBottom: '1px solid var(--color-border)', padding: '3rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '1rem' }}>{course.category?.name}</span>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', marginBottom: '1rem' }}>{course.title}</h1>
            {course.subtitle && <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>{course.subtitle}</p>}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {course.averageRating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <StarRating rating={course.averageRating} size={16} />
                  <span style={{ fontWeight: 600, color: 'var(--color-gold)' }}>{course.averageRating.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>({course.totalReviews} reviews)</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <Users size={14} /> {course.enrolledStudentsCount || 0} students
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={14} /> {course.language}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BarChart2 size={14} /> {course.level}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BookOpen size={14} /> {course.totalLectures} lectures</div>
              {course.totalDurationInSeconds > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {formatDuration(course.totalDurationInSeconds)}</div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Instructor: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{course.instructor?.fullName}</span>
            </div>
          </div>

          {/* Purchase Card */}
          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}>
            {course.thumbnailUrl && (
              <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
            )}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {effectivePrice === 0 ? (
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>Free</span>
                ) : (
                  <>
                    <span style={{ fontSize: '2rem', fontWeight: 800 }}>₹{effectivePrice}</span>
                    {course.discountPrice !== null && course.discountPrice < course.price && (
                      <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{course.price}</span>
                    )}
                  </>
                )}
              </div>

              {isEnrolled || enrollment ? (
                <a
                  href={`/learn/${course._id}`}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
                  id="go-to-course-btn"
                >
                  <Play size={18} fill="white" /> Continue Learning
                </a>
              ) : user?.role === 'student' || !user ? (
                <>
                  {effectivePrice === 0 ? (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
                      onClick={handleFreeEnroll}
                      disabled={cartLoading}
                      id="free-enroll-btn"
                    >
                      {cartLoading ? <div className="spinner spinner-sm" /> : <><Play size={18} /> Enroll for Free</>}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
                      onClick={handleAddToCart}
                      disabled={cartLoading}
                      id="add-to-cart-btn"
                    >
                      {cartLoading ? <div className="spinner spinner-sm" /> : <><ShoppingCart size={18} /> Add to Cart</>}
                    </button>
                  )}
                  {user ? (
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={handleWishlist}
                      id="wishlist-btn"
                    >
                      <Heart size={16} fill={isWishlisted ? 'var(--color-error)' : 'none'} color={isWishlisted ? 'var(--color-error)' : 'currentColor'} />
                      {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
                    </button>
                  ) : (
                    <a href="/login" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
                      Login to access course options
                    </a>
                  )}
                </>
              ) : null}

              {/* Includes */}
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  `${course.totalLectures} on-demand lectures`,
                  `${course.totalModules} course modules`,
                  `${formatDuration(course.totalDurationInSeconds)} total content`,
                  'Full lifetime access',
                  'Certificate of completion',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle size={14} color="var(--color-success)" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Body */}
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="tabs">
          {['overview', 'curriculum', 'reviews'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} id={`detail-tab-${t}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Description */}
            <div>
              <h3 style={{ marginBottom: '1rem' }}>About This Course</h3>
              <p style={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>{course.description}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Requirements */}
              {course.requirements?.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '0.75rem' }}>Requirements</h4>
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {course.requirements.map((r, i) => <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{r}</li>)}
                  </ul>
                </div>
              )}

              {/* Learning Outcomes */}
              {course.learningOutcomes?.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '0.75rem' }}>What You'll Learn</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {course.learningOutcomes.map((o, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <CheckCircle size={16} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{o}</span>
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
          <div style={{ maxWidth: 700 }}>
            {/* Stats */}
            {course.averageRating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--color-gold)' }}>
                    {course.averageRating.toFixed(1)}
                  </div>
                  <StarRating rating={course.averageRating} size={18} />
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>{course.totalReviews} reviews</div>
                </div>
              </div>
            )}

            {/* Write/Edit Review */}
            {user?.role === 'student' && enrollment && (
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>{myReview ? 'Your Review' : 'Write a Review'}</h4>

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
