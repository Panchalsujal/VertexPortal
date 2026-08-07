import { Star } from 'lucide-react';

export function StarRating({ rating = 0, max = 5, size = 16, interactive = false, onRate }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div className="stars" aria-label={`Rating: ${rating} out of ${max}`}>
      {stars.map((star) => (
        <Star
          key={star}
          size={size}
          fill={star <= Math.round(rating) ? 'var(--color-gold)' : 'none'}
          color={star <= Math.round(rating) ? 'var(--color-gold)' : 'var(--text-muted)'}
          style={{ cursor: interactive ? 'pointer' : 'default', transition: 'all 0.15s' }}
          onClick={() => interactive && onRate && onRate(star)}
        />
      ))}
    </div>
  );
}
