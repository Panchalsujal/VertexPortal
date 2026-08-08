import { Link, useNavigate } from 'react-router-dom';
import { Star, Clock, Users, BookOpen, Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { addToCart } from '../../api/cart.api';
import { addToWishlist, removeFromWishlist } from '../../api/wishlist.api';
import { useState } from 'react';
import toast from 'react-hot-toast';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function CourseCard({ course, wishlisted = false, onWishlistChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(wishlisted);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);

  const effectivePrice = course.discountPrice ?? course.price;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setWishLoading(true);
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
      onWishlistChange?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWishLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'student') { toast.error('Only students can add to cart'); return; }
    setCartLoading(true);
    try {
      await addToCart(course._id);
      toast.success('Added to cart!');
    } catch (err) {
      if (err.message?.toLowerCase().includes('already enrolled')) {
        toast.success('You are already enrolled! Opening course...');
        navigate(`/learn/${course._id}`);
      } else {
        toast.error(err.message);
      }
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <Link to={`/courses/${course.slug}`} style={{ textDecoration: 'none' }}>
      <div className="course-card">
        {/* Thumbnail */}
        <div className="course-card-thumb">
          {course.thumbnailUrl ? (
            <img src={course.thumbnailUrl} alt={course.title} />
          ) : (
            <div style={{
              width: '100%', height: '100%', minHeight: 170,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(59,130,246,0.2) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={40} color="rgba(255,255,255,0.3)" />
            </div>
          )}
          {/* Level Badge */}
          <div className="course-card-badge">
            <span className="badge badge-primary">{course.level || 'beginner'}</span>
          </div>
          {/* Wishlist */}
          {user?.role === 'student' && (
            <button
              className="course-card-wishlist"
              onClick={handleWishlist}
              disabled={wishLoading}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                size={16}
                fill={isWishlisted ? 'var(--color-error)' : 'none'}
                color={isWishlisted ? 'var(--color-error)' : 'white'}
              />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="course-card-body">
          <div className="course-card-category">
            {course.category?.name || 'General'}
          </div>
          <h3 className="course-card-title">{course.title}</h3>
          <p className="course-card-instructor">
            by {course.instructor?.fullName || 'Instructor'}
          </p>

          <div className="course-card-meta">
            {course.averageRating > 0 && (
              <div className="course-card-rating">
                <Star size={13} fill="var(--color-gold)" color="var(--color-gold)" />
                <span>{course.averageRating.toFixed(1)}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({course.totalReviews})</span>
              </div>
            )}
            {course.totalDurationInSeconds > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} />
                <span>{formatDuration(course.totalDurationInSeconds)}</span>
              </div>
            )}
            {course.totalLectures > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <BookOpen size={12} />
                <span>{course.totalLectures} lectures</span>
              </div>
            )}
          </div>

          <div className="course-card-footer">
            <div className="course-card-price">
              {effectivePrice === 0 ? (
                <span className="price-free">Free</span>
              ) : (
                <>
                  <span className="price-current">₹{effectivePrice}</span>
                  {course.discountPrice !== null && course.discountPrice < course.price && (
                    <span className="price-original">₹{course.price}</span>
                  )}
                </>
              )}
            </div>

            {user?.role === 'student' && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddToCart}
                disabled={cartLoading}
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
              >
                <ShoppingCart size={13} />
                {cartLoading ? '…' : 'Add'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
