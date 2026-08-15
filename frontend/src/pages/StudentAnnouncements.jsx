import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchStudentAnnouncements,
  markRead,
  selectStudentAnnouncements,
  selectStudentAnnouncementsLoading,
} from '../store/slices/student/studentAnnouncementsSlice';
import { Spinner, SkeletonFeed } from '../components/ui/Spinner';
import { Megaphone } from 'lucide-react';

export default function StudentAnnouncements() {
  const dispatch = useAppDispatch();
  const announcements = useAppSelector(selectStudentAnnouncements);
  const loading = useAppSelector(selectStudentAnnouncementsLoading);

  useEffect(() => {
    dispatch(fetchStudentAnnouncements());
  }, [dispatch]);

  const handleRead = (id) => {
    dispatch(markRead(id));
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Megaphone size={28} color="var(--color-primary-light)" /> Course Announcements
          </h1>
          <p>Important updates and news from your course instructors</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <SkeletonFeed count={4} />
        ) : announcements.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {announcements.map(ann => (
              <div key={ann._id} className="glass-card" style={{ padding: '1.5rem' }} onClick={() => !ann.isRead && handleRead(ann._id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary">{ann.course?.title || 'Course News'}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{ann.title}</h3>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>{ann.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Megaphone size={48} /></div>
            <h3>No announcements</h3>
            <p>Your instructors have not published any announcements yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
