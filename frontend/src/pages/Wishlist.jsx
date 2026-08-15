import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyWishlist } from '../api/wishlist.api';
import { CourseCard } from '../components/course/CourseCard';
import { SkeletonCard } from '../components/ui/Spinner';
import { Heart, ArrowRight } from 'lucide-react';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = () => {
    setLoading(true);
    getMyWishlist()
      .then(r => setWishlist(r.data.wishlist || r.data.data?.wishlist || r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWishlist(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-8 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Top Header */}
        <div className="flex items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                My Wishlist
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {wishlist.length} saved course{wishlist.length !== 1 ? 's' : ''} for later learning
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map(item => {
              const course = item.course || item;
              return (
                <CourseCard
                  key={item._id || course._id}
                  course={course}
                  wishlisted={true}
                  onWishlistChange={fetchWishlist}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your wishlist is empty</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Explore courses and click the heart icon on any course card to bookmark it here.
            </p>
            <Link
              to="/courses"
              className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition"
            >
              Browse Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
