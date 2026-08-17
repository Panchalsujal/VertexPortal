import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getMyWishlist } from '../api/wishlist.api';
import { CourseCard } from '../components/course/CourseCard';
import { SkeletonCard } from '../components/ui/Spinner';
import { Empty } from '../components/ui/Empty';
import { Marker } from '../components/ui/Marker';
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
    <>
      <Helmet>
        <title>My Saved Wishlist — VertexPortal</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-8 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Top Header */}
        <div className="flex items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center shadow-xs">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  My Wishlist
                </h1>
                <Marker variant="rose" size="sm">
                  {wishlist.length} Saved
                </Marker>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Saved courses ready for future learning
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
                  onWishlistChange={(courseId, isWishlisted) => {
                    if (isWishlisted === false) {
                      setWishlist(prev => prev.filter(it => {
                        const itId = it.course?._id || it.course || it._id;
                        return itId !== courseId && itId !== course._id;
                      }));
                    } else if (isWishlisted === true) {
                      fetchWishlist();
                    }
                  }}
                />
              );
            })}
          </div>
        ) : (
          <Empty
            icon={Heart}
            title="Your wishlist is empty"
            description="Explore courses and click the heart icon on any course card to bookmark it here."
            action={
              <Link
                to="/courses"
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-purple-600/30 transition hover:scale-105"
              >
                <span>Browse Courses</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
        )}
      </div>
    </div>
  </>
);
}
