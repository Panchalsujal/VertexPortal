import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '../../utils/imageUtils';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function LandingCourseCard({ course, isList = false }) {
  const effectivePrice = course.discountPrice ?? course.price;
  
  // Naked Metadata Array elements
  const metaElements = [];
  if (course.averageRating > 0) {
    metaElements.push(`★ ${course.averageRating.toFixed(1)}`);
  }
  metaElements.push(course.level || 'All Levels');
  if (course.totalDurationInSeconds > 0) {
    metaElements.push(formatDuration(course.totalDurationInSeconds));
  }

  return (
    <Link to={`/courses/${course.slug || course._id}`} className="block group h-full no-underline">
      <div className={`flex bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden hover:border-gray-300 dark:hover:border-neutral-700 transition-all duration-300 ${isList ? 'flex-col md:flex-row gap-8 items-center max-w-4xl p-6' : 'flex-col h-full p-0 sm:p-0'}`}>
        
        {/* Thumbnail */}
        <div className={`relative bg-gray-100 dark:bg-neutral-900 overflow-hidden rounded-lg shrink-0 ${isList ? 'w-full md:w-1/2 aspect-[16/10]' : 'w-full aspect-[16/10] mb-4'}`}>
          {course.thumbnailUrl ? (
            <img
              src={getOptimizedImageUrl(course.thumbnailUrl, { width: 600, quality: 80 })}
              alt={course.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 text-center text-gray-400 dark:text-gray-600 text-sm">
              No Image
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isList ? 'flex-1' : 'flex-1 p-5'}`}>
          {/* Naked Metadata Array */}
          <div className="text-xs text-gray-500 dark:text-neutral-400 font-medium mb-1.5 flex items-center gap-1.5 flex-wrap">
            {metaElements.map((meta, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-700" />}
                {meta}
              </span>
            ))}
          </div>
          
          <h3 className={`font-semibold text-gray-900 dark:text-white leading-tight mb-1 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors ${isList ? 'text-xl' : 'text-base line-clamp-2'}`}>
            {course.title}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-neutral-400 mb-3">
            {course.instructor?.fullName || course.instructor?.name || 'Instructor'}
          </p>
          
          {isList && (
            <p className="text-sm text-gray-600 dark:text-neutral-400 mb-4 line-clamp-3 leading-relaxed">
              {course.subtitle || 'Comprehensive software engineering curriculum designed for real-world application.'}
            </p>
          )}

          <div className="mt-auto pt-2 flex items-center justify-between">
            {effectivePrice === 0 ? (
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Free</span>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">₹{effectivePrice}</span>
                {course.discountPrice !== null && course.discountPrice < course.price && (
                  <span className="text-xs text-gray-500 dark:text-neutral-500 line-through">₹{course.price}</span>
                )}
              </div>
            )}
            <span className="text-xs font-semibold text-gray-900 dark:text-white group-hover:tranneutral-x-1 transition-transform">
              Explore &rarr;
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
