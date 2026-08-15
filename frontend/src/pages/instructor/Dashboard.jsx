import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses, publishCourse, archiveCourse } from '../../api/course.api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, SkeletonFeed } from '../../components/ui/Spinner';
import {
  Plus,
  Edit,
  BookOpen,
  Eye,
  Globe,
  Archive,
  Users,
  Star,
  CheckSquare,
  Video,
  FileText,
  Megaphone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Layers,
  GraduationCap,
} from 'lucide-react';
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
      const myCourses =
        user?.role === 'admin'
          ? all
          : all.filter((c) => (c.instructor?._id || c.instructor) === (user?.id || user?._id));
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

  const totalStudents = courses.reduce((acc, c) => acc + (c.enrolledStudentsCount || 0), 0);
  const publishedCount = courses.filter((c) => c.isPublished).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f19] text-gray-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── Header Banner ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111827] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
                Instructor Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Welcome back, {user?.fullName?.split(' ')[0] || 'Instructor'}! 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Manage your courses, track student engagement, and launch new interactive learning modules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/instructor/courses/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6C5CE7, #5046d4)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Create New Course</span>
            </Link>
          </div>
        </div>

        {/* ── Quick Action Hub ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <Link
            to="/instructor/courses/new"
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 shadow-2xs hover:border-purple-500 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-slate-200">New Course</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Author content</span>
          </Link>

          <Link
            to="/instructor/quizzes"
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 shadow-2xs hover:border-purple-500 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1">
              Quizzes <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
            </span>
            <span className="text-[10px] text-purple-500 font-semibold mt-0.5">AI Generator</span>
          </Link>

          <Link
            to="/instructor/live-classes"
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 shadow-2xs hover:border-purple-500 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-slate-200">Live Classes</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Host stream</span>
          </Link>

          <Link
            to="/instructor/assignments"
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 shadow-2xs hover:border-purple-500 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-slate-200">Assignments</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Grade submissions</span>
          </Link>

          <Link
            to="/instructor/announcements"
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 shadow-2xs hover:border-purple-500 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-slate-200">Announcements</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Broadcast news</span>
          </Link>

          <Link
            to="/discussions"
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-slate-800 shadow-2xs hover:border-purple-500 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-gray-800 dark:text-slate-200">Discussions</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Student Q&A</span>
          </Link>
        </div>

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Courses</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{courses.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Enrolled Students</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{totalStudents.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Live & Published</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{publishedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Course Drafts</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{courses.length - publishedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* ── Courses Management Section ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Authored Courses</h2>
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
              Showing {courses.length} course{courses.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <SkeletonFeed count={3} />
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center gap-4 hover:border-purple-400/60 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 shrink-0 relative">
                    {course.thumbnailUrl ? (
                      <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen className="w-8 h-8" />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        course.isPublished ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {course.isPublished ? 'Live' : 'Draft'}
                    </span>
                  </div>

                  {/* Course Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                        {course.category?.name || course.level || 'All Levels'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{course.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-purple-500" /> {course.enrolledStudentsCount || 0} students
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />{' '}
                        {course.averageRating ? course.averageRating.toFixed(1) : '5.0'}
                      </span>
                      <span className="font-bold text-gray-700 dark:text-slate-300">
                        {course.price === 0 ? 'Free' : `₹${course.price}`}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-slate-800">
                    <Link
                      to={`/instructor/courses/${course._id}/curriculum`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Curriculum
                    </Link>

                    <Link
                      to={`/instructor/courses/${course._id}/edit`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>

                    <Link
                      to={`/courses/${course.slug}`}
                      className="p-2 rounded-xl text-gray-500 hover:text-purple-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                      title="Preview Public View"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleTogglePublish(course._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        course.isPublished
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {course.isPublished ? 'Unpublish' : 'Publish'}
                    </button>

                    <button
                      onClick={() => handleArchive(course._id)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Archive Course"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111827] p-12 text-center rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No courses created yet</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
                Share your knowledge with thousands of students by publishing your first course.
              </p>
              <Link
                to="/instructor/courses/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md shadow-purple-600/30"
                style={{ background: 'linear-gradient(135deg, #6C5CE7, #5046d4)' }}
              >
                <Plus className="w-4 h-4" /> Create First Course
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
