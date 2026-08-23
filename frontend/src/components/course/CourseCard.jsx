import { Link, useNavigate } from 'react-router-dom';
import {
  Star,
  Clock,
  BookOpen,
  Heart,
  ShoppingCart,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import { addToCart } from '../../api/cart.api';
import { addToWishlist, removeFromWishlist } from '../../api/wishlist.api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function CourseCard({ course, wishlisted = false, onWishlistChange }) {
  const user = useAppSelector(selectUser);
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(wishlisted);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishLoading] = useState(false);

  const effectivePrice = course.discountPrice ?? course.price;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    
    const prevWishlisted = isWishlisted;
    const nextWishlisted = !prevWishlisted;
    setIsWishlisted(nextWishlisted);
    toast.success(nextWishlisted ? 'Added to wishlist' : 'Removed from wishlist');
    onWishlistChange?.(course._id, nextWishlisted);

    try {
      if (prevWishlisted) {
        await removeFromWishlist(course._id);
      } else {
        await addToWishlist(course._id);
      }
    } catch (err) {
      setIsWishlisted(prevWishlisted);
      onWishlistChange?.(course._id, prevWishlisted);
      toast.error(err.response?.data?.message || err.message || 'Failed to update wishlist. Rolled back.');
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
        toast.error(err.message || 'Failed to add to cart');
      }
    } finally {
      setCartLoading(false);
    }
  };

  return (
    <Link to={`/courses/${course.slug || course._id}`} className="block group h-full no-underline">
      <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full group-hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-100 dark:bg-slate-800 overflow-hidden">
          {course.thumbnailUrl ? (
            <img
              src={getOptimizedImageUrl(course.thumbnailUrl, { width: 500, quality: 80 })}
              alt={course.title}
              width="400"
              height="225"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full min-h-[160px] bg-gradient-to-br from-purple-600/20 to-indigo-600/20 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-purple-400" />
            </div>
          )}

          {/* Level Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {course.level || 'beginner'}
            </span>
          </div>

          {/* Wishlist Button */}
          {user?.role === 'student' && (
            <button
              type="button"
              onClick={handleWishlist}
              disabled={wishLoading}
              className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-sm hover:bg-black/60 rounded-full text-white transition shadow-xs cursor-pointer flex items-center justify-center"
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-white'}`}
              />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold text-purple-600 dark:text-purple-400 mb-1.5 uppercase tracking-wider">
              {course.category?.name || 'Development'}
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2 mb-1.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {course.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              by <span className="font-semibold text-gray-700 dark:text-gray-300">{course.instructor?.fullName || course.instructor?.name || 'Instructor'}</span>
            </p>
          </div>

          <div>
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-slate-800/80 mb-3">
              {course.averageRating > 0 && (
                <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{course.averageRating.toFixed(1)}</span>
                  <span className="text-gray-400 font-normal">({course.totalReviews})</span>
                </div>
              )}
              {course.totalDurationInSeconds > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatDuration(course.totalDurationInSeconds)}</span>
                </div>
              )}
              {course.totalLectures > 0 && (
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                  <span>{course.totalLectures} lectures</span>
                </div>
              )}
            </div>

            {/* Price & Action */}
            <div className="flex items-center justify-between pt-1">
              <div>
                {effectivePrice === 0 ? (
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">Free</span>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-extrabold text-gray-900 dark:text-white">₹{effectivePrice}</span>
                    {course.discountPrice !== null && course.discountPrice < course.price && (
                      <span className="text-xs text-gray-400 line-through">₹{course.price}</span>
                    )}
                  </div>
                )}
              </div>

              {user?.role === 'student' && (
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl inline-flex items-center gap-1.5 shadow-sm shadow-purple-950/20 transition cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-white" />
                  <span>{cartLoading ? '...' : 'Add'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
