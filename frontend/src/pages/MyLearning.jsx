import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyEnrollments } from '../api/enrollment.api';
import { Spinner } from '../components/ui/Spinner';
import { BookOpen, Play, TrendingUp } from 'lucide-react';

export default function MyLearning() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    getMyEnrollments()
      .then(r => setEnrollments(r.data.enrollments || r.data.data?.enrollments || r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = enrollments.filter(e =>
    tab === 'active' ? e.status === 'active' :
    tab === 'completed' ? e.status === 'completed' : true
  );

  return (
    <div className="page-wrapper">
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
        <div className="container">
          <h1 style={{ marginBottom: '0.5rem' }}>My Learning</h1>
          <p>{enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="tabs">
          {['active', 'completed', 'all'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} id={`tab-${t}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span style={{ marginLeft: 6, fontSize: '0.8rem', opacity: 0.7 }}>
                ({enrollments.filter(e => t === 'all' ? true : e.status === t).length})
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Spinner /></div>
        ) : filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(enr => {
              const course = enr.course;
              const enrId = enr.id || enr._id;
              const pct = enr.progress?.percentage ?? enr.progressPercentage ?? 0;
              const completedCount = enr.progress?.completedLecturesCount ?? enr.completedLecturesCount ?? 0;

              return (
                <div key={enrId} className="glass-card" style={{ overflow: 'hidden' }}>
                  {/* Thumbnail */}
                  <div style={{ height: 160, background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2))', position: 'relative', overflow: 'hidden' }}>
                    {course?.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={40} color="rgba(255,255,255,0.3)" />
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                      padding: '1rem',
                    }}>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '1.25rem' }}>
                    <span className={`badge ${enr.status === 'completed' ? 'badge-success' : 'badge-primary'}`} style={{ marginBottom: '0.75rem' }}>
                      {enr.status}
                    </span>
                    <h4 style={{ marginBottom: '0.5rem', lineHeight: 1.4 }}>{course?.title || 'Course'}</h4>
                    <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                      by {course?.instructor?.fullName || 'Instructor'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <TrendingUp size={14} />
                        {Number(pct).toFixed(0)}% complete
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {completedCount} lectures done
                      </div>
                    </div>

                    <Link
                      to={`/learn/${course?._id}`}
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                      id={`continue-${enrId}-btn`}
                    >
                      <Play size={16} fill="white" />
                      {pct > 0 ? 'Continue Learning' : 'Start Course'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={48} /></div>
            <h3>No {tab === 'all' ? '' : tab + ' '}courses</h3>
            <p>
              {tab === 'active' ? "Start learning today!" : "Complete some courses to see them here."}
            </p>
            <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
