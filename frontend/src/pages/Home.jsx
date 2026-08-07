import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Play, Star, Award, TrendingUp, Zap, BookOpen } from 'lucide-react';
import { getAllCourses } from '../api/course.api';
import { getAllCategories } from '../api/category.api';
import { CourseCard } from '../components/course/CourseCard';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';

const STATS = [
  { value: '50K+', label: 'Students Enrolled' },
  { value: '200+', label: 'Expert Courses' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '95%', label: 'Completion Rate' },
];

const FEATURES = [
  { icon: Zap, title: 'Learn at Your Pace', desc: 'Access courses anytime, anywhere — on your schedule.' },
  { icon: Award, title: 'Expert Instructors', desc: 'Learn from industry professionals with real-world experience.' },
  { icon: TrendingUp, title: 'Track Your Progress', desc: 'Visual dashboards keep you motivated and on track.' },
  { icon: BookOpen, title: 'Rich Curriculum', desc: 'In-depth modules with videos, documents, and quizzes.' },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllCourses({ limit: 6, sort: 'popular' }),
      getAllCategories(),
    ]).then(([cr, catr]) => {
      setCourses(cr.data.courses || cr.data.data?.courses || cr.data.data || []);
      setCategories(catr.data.categories || catr.data.data?.categories || catr.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      {/* ---- Hero ---- */}
      <section className="hero-section">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="container">
          <div className="hero-inner">
            <div className="hero-content animate-fade-in-up">
              <div className="hero-badge">
                <Star size={14} fill="var(--color-gold)" color="var(--color-gold)" />
                Trusted by 50,000+ learners
              </div>
              <h1>
                Master <span className="gradient-text">In-Demand Skills</span>{' '}
                With Expert Guidance
              </h1>
              <p>
                Vertex Portal connects ambitious learners with world-class instructors.
                Start your journey today with curated, hands-on courses.
              </p>
              <div className="hero-cta">
                <Link to="/courses" className="btn btn-primary btn-lg" id="hero-browse-btn">
                  Explore Courses <ArrowRight size={18} />
                </Link>
                {!user && (
                  <Link to="/register" className="btn btn-secondary btn-lg" id="hero-register-btn">
                    Join Free
                  </Link>
                )}
              </div>
              <div className="hero-stats">
                {STATS.map(s => (
                  <div key={s.label}>
                    <div className="hero-stat-value">{s.value}</div>
                    <div className="hero-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="hero-visual animate-fade-in">
              <div className="hero-card-floating">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={22} color="white" fill="white" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600 }}>Now Playing</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Introduction to React</p>
                  </div>
                </div>
                <div className="progress-bar-wrap" style={{ marginBottom: '1rem' }}>
                  <div className="progress-bar-fill" style={{ width: '68%' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  <span>Lecture 12 of 18</span>
                  <span>68% Complete</span>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['React Hooks Deep Dive', 'State Management', 'API Integration'].map((t, i) => (
                    <div key={t} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem', borderRadius: 'var(--radius-sm)',
                      background: i === 0 ? 'rgba(124,58,237,0.1)' : 'transparent',
                      border: i === 0 ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
                    }}>
                      {i === 0 ? (
                        <Play size={14} color="var(--color-primary-light)" />
                      ) : (
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--text-muted)' }} />
                      )}
                      <span style={{ fontSize: '0.875rem', color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Categories ---- */}
      {categories.length > 0 && (
        <section style={{ padding: 'var(--space-20) 0', background: 'var(--color-bg-secondary)' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Categories</span>
              <h2>Explore by Topic</h2>
              <p>Find the perfect course in your area of interest</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
              {categories.slice(0, 8).map(cat => (
                <Link
                  key={cat._id}
                  to={`/courses?category=${cat._id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.75rem 1.25rem',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.color = 'var(--color-primary-light)';
                    e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--color-surface)';
                  }}
                >
                  <BookOpen size={16} />
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---- Featured Courses ---- */}
      <section style={{ padding: 'var(--space-20) 0' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Featured</span>
            <h2>Most Popular Courses</h2>
            <p>Join thousands of learners in our top-rated courses</p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Spinner />
            </div>
          ) : courses.length > 0 ? (
            <>
              <div className="grid-courses">
                {courses.map(c => <CourseCard key={c._id} course={c} />)}
              </div>
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <Link to="/courses" className="btn btn-secondary btn-lg">
                  View All Courses <ArrowRight size={18} />
                </Link>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>No courses available yet</h3>
              <p>Check back soon for new published courses</p>
            </div>
          )}
        </div>
      </section>

      {/* ---- Features ---- */}
      <section style={{ padding: 'var(--space-20) 0', background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Why Vertex</span>
            <h2>Everything You Need to Succeed</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card" style={{ padding: '2rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}>
                  <Icon size={22} color="var(--color-primary-light)" />
                </div>
                <h4 style={{ marginBottom: '0.5rem' }}>{title}</h4>
                <p style={{ fontSize: '0.9375rem' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA Banner ---- */}
      {!user && (
        <section style={{ padding: 'var(--space-20) 0' }}>
          <div className="container">
            <div style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.1) 100%)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 'var(--radius-2xl)',
              padding: '4rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -80, right: -80,
                width: 300, height: 300, borderRadius: '50%',
                background: 'rgba(124,58,237,0.08)', filter: 'blur(60px)',
              }} />
              <h2 style={{ marginBottom: '1rem' }}>Ready to Start Learning?</h2>
              <p style={{ fontSize: '1.125rem', marginBottom: '2rem', maxWidth: 500, margin: '0 auto 2rem' }}>
                Join over 50,000 learners and start your journey today — it's free to sign up.
              </p>
              <Link to="/register" className="btn btn-primary btn-lg" id="cta-register-btn">
                Create Free Account <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
