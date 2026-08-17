import React, { useState } from 'react';
import { Star } from 'lucide-react';

export function StarRating({
  rating = 0,
  max = 5,
  size = 18,
  interactive = false,
  onRate,
  showLabel = false,
  className = '',
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  const activeRating = hoverRating || rating;

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`} aria-label={`Rating: ${rating} out of ${max}`}>
      <div className="flex items-center gap-1">
        {stars.map((star) => {
          const isFilled = star <= Math.round(activeRating);
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onClick={() => interactive && onRate && onRate(star)}
              className={`p-0.5 rounded transition-all duration-150 focus:outline-none ${
                interactive
                  ? 'cursor-pointer hover:scale-120 active:scale-95'
                  : 'cursor-default pointer-events-none'
              }`}
            >
              <Star
                size={size}
                className={`transition-colors duration-150 ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                    : 'text-gray-300 dark:text-slate-600 fill-none'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && interactive && (
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 min-w-16 transition-all">
          {ratingLabels[activeRating] || 'Select Rating'}
        </span>
      )}
    </div>
  );
}

export default StarRating;
