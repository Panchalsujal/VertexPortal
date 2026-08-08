import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchStudentLiveClasses,
  selectStudentLiveClasses,
  selectStudentLiveClassesLoading,
} from '../store/slices/student/studentLiveClassesSlice';
import { joinLiveClass } from '../api/student.api';
import { Spinner } from '../components/ui/Spinner';
import { Video, Calendar, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentLiveClasses() {
  const dispatch = useAppDispatch();
  const liveClasses = useAppSelector(selectStudentLiveClasses);
  const loading = useAppSelector(selectStudentLiveClassesLoading);

  useEffect(() => {
    dispatch(fetchStudentLiveClasses());
  }, [dispatch]);

  const handleJoin = async (classId) => {
    try {
      const res = await joinLiveClass(classId);
      const data = res.data.data || res.data;
      if (data.joinUrl || data.meetingLink) {
        window.open(data.joinUrl || data.meetingLink, '_blank');
      } else {
        toast.success('Joined class!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to join live class');
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
        <div className="container">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Video size={28} color="var(--color-primary-light)" /> Live Interactive Classes
          </h1>
          <p>Join live lectures, Q&A sessions, and workshops</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}><Spinner /></div>
        ) : liveClasses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {liveClasses.map(item => (
              <div key={item._id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-primary">{item.course?.title || 'Live Class'}</span>
                    <span className={`badge ${item.status === 'live' ? 'badge-success' : 'badge-warning'}`}>
                      {item.status === 'live' ? '🔴 LIVE NOW' : item.status || 'Scheduled'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.description}</p>
                  <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {new Date(item.scheduledAt || item.startsAt).toLocaleString()}</div>
                    <div><Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {item.duration || 60} minutes</div>
                  </div>
                </div>

                <button
                  className={`btn ${item.status === 'live' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}
                  onClick={() => handleJoin(item._id)}
                >
                  <Video size={16} /> Join Class <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><Video size={48} /></div>
            <h3>No upcoming live classes</h3>
            <p>Scheduled live sessions will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
