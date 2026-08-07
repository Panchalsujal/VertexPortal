import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses, publishCourse, archiveCourse } from '../../api/course.api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/ui/Spinner';
import { Plus, Edit, BookOpen, Eye, Globe, Archive, Users, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await getAllCourses({ limit: 100 });
      const all = res.data.courses || res.data.data?.courses || res.data.data || [];
      const myCourses = user?.role === 'admin' ? all : all.filter(c => (c.instructor?._id || c.instructor) === (user?.id || user?._id));
      setCourses(myCourses.length > 0 ? myCourses : all);
    } catch (err) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleTogglePublish = async (courseId) => {
    try {
      await publishCourse(courseId);
      toast.success('Course status updated!');
      fetchCourses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleArchive = async (courseId) => {
    if (!window.confirm('Are you sure you want to archive this course?')) return;
    try {
      await archiveCourse(courseId);
      toast.success('Course archived');
      fetchCourses();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Instructor Dashboard</h1>
            <p>Manage your courses and curriculum</p>
          </div>
          <Link to="/instructor/courses/new" className="btn btn-primary" id="create-course-btn">
            <Plus size={18} /> Create New Course
          </Link>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Spinner />
          </div>
        ) : courses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {courses.map(course => (
              <div key={course._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ width: 120, height: 75, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-surface-hover)', flexShrink: 0 }}>
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BookOpen size={28} color="var(--text-muted)" />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="badge badge-primary">{course.level}</span>
                  </div>
                  <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{course.title}</h3>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <span><Users size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} /> {course.enrolledStudentsCount || 0} students</span>
                    <span><Star size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} /> {course.averageRating ? course.averageRating.toFixed(1) : 'N/A'}</span>
                    <span>Price: {course.price === 0 ? 'Free' : `₹${course.price}`}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link to={`/courses/${course.slug}`} className="btn btn-ghost btn-sm" title="Preview Public Page">
                    <Eye size={16} /> Preview
                  </Link>
                  <Link to={`/instructor/courses/${course._id}/curriculum`} className="btn btn-secondary btn-sm">
                    <BookOpen size={16} /> Curriculum
                  </Link>
                  <Link to={`/instructor/courses/${course._id}/edit`} className="btn btn-secondary btn-sm">
                    <Edit size={16} /> Edit Info
                  </Link>
                  <button
                    className={`btn btn-sm ${course.isPublished ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => handleTogglePublish(course._id)}
                  >
                    <Globe size={14} /> {course.isPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleArchive(course._id)} title="Archive Course">
                    <Archive size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={48} /></div>
            <h3>No courses created yet</h3>
            <p>Start sharing your knowledge by creating your first course.</p>
            <Link to="/instructor/courses/new" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
              <Plus size={18} /> Create First Course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
