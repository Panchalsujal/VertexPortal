import { Link } from 'react-router-dom';
import { GraduationCap, Globe, Share2, MessageSquare } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800 }}>
              <div style={{ width: 36, height: 36, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={20} color="white" />
              </div>
              <span className="gradient-text">Vertex Portal</span>
            </Link>
            <p>Empowering learners worldwide with world-class courses taught by industry experts.</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              {[Globe, Share2, MessageSquare].map((Icon, i) => (
                <a key={i} href="#" style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-primary-light)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Learn */}
          <div className="footer-col">
            <h4>Learn</h4>
            <ul>
              <li><Link to="/courses">Browse Courses</Link></li>
              <li><Link to="/courses?level=beginner">For Beginners</Link></li>
              <li><Link to="/courses?level=advanced">Advanced Tracks</Link></li>
              <li><Link to="/my-learning">My Learning</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Vertex Portal. All rights reserved.</p>
          <p>Built with ❤️ for learners everywhere</p>
        </div>
      </div>
    </footer>
  );
}
