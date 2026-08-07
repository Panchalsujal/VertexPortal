import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyWishlist } from '../api/wishlist.api';
import { CourseCard } from '../components/course/CourseCard';
import { Spinner } from '../components/ui/Spinner';
import { Heart } from 'lucide-react';

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
    <div className="page-wrapper">
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
        <div className="container">
          <h1 style={{ marginBottom: '0.25rem' }}>My Wishlist</h1>
          <p>{wishlist.length} saved course{wishlist.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div>
        ) : wishlist.length > 0 ? (
          <div className="grid-courses">
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
          <div className="empty-state">
            <div className="empty-state-icon"><Heart size={48} /></div>
            <h3>Your wishlist is empty</h3>
            <p>Save courses you're interested in to find them later</p>
            <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
