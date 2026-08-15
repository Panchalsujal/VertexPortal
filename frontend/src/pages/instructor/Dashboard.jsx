import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses, publishCourse, archiveCourse } from '../../api/course.api';
import { useAuth } from '../../context/AuthContext';
import { SkeletonFeed } from '../../components/ui/Spinner';
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
  Search,
  SlidersHorizontal,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'

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

  const isCoursePublished = (c) => Boolean(c?.isPublished === true || c?.status === 'published');

  const totalStudents = courses.reduce((acc, c) => acc + (c.enrolledStudentsCount || 0), 0);
  const publishedCourses = courses.filter((c) => isCoursePublished(c));
  const draftCourses = courses.filter((c) => !isCoursePublished(c));
  const publishedCount = publishedCourses.length;
  const draftCount = draftCourses.length;

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.level?.toLowerCase().includes(searchQuery.toLowerCase());

      if (statusFilter === 'published') return matchesSearch && isCoursePublished(course);
      if (statusFilter === 'draft') return matchesSearch && !isCoursePublished(course);
      return matchesSearch;
    });
  }, [courses, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] text-gray-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ── Header Banner ── */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-slate-800 shadow-sm">
          {/* Decorative ambient gradients */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Instructor Command Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  {user?.fullName?.split(' ')[0] || 'Instructor'}
                </span>
                ! 👋
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 leading-relaxed">
                Manage your authored courses, monitor real-time student engagement, and launch interactive learning modules seamlessly.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/instructor/courses/new"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 hover:-translate-y-0.5 transition-all active:translate-y-0 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #6C5CE7, #4f46e5)' }}
              >
                <Plus className="w-4 h-4" />
                <span>Create New Course</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Quick Action Hub ── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Quick Actions
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* New Course */}
            <Link
              to="/instructor/courses/new"
              className="group relative flex flex-col p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-slate-800 hover:border-purple-500/70 dark:hover:border-purple-500/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs">
                <PlusCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                New Course
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Author content</span>
            </Link>

            {/* Quizzes */}
            <Link
              to="/instructor/quizzes"
              className="group relative flex flex-col p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-slate-800 hover:border-amber-500/70 dark:hover:border-amber-500/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-xs">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Quizzes
                </span>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Generate tests</span>
            </Link>

            {/* Live Classes */}
            <Link
              to="/instructor/live-classes"
              className="group relative flex flex-col p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-slate-800 hover:border-rose-500/70 dark:hover:border-rose-500/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all shadow-xs">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Live Classes
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Host stream</span>
            </Link>

            {/* Assignments */}
            <Link
              to="/instructor/assignments"
              className="group relative flex flex-col p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-slate-800 hover:border-blue-500/70 dark:hover:border-blue-500/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Assignments
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Grade work</span>
            </Link>

            {/* Announcements */}
            <Link
              to="/instructor/announcements"
              className="group relative flex flex-col p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-slate-800 hover:border-emerald-500/70 dark:hover:border-emerald-500/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                <Megaphone className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Announce
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Broadcast news</span>
            </Link>

            {/* Discussions */}
            <Link
              to="/discussions"
              className="group relative flex flex-col p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200/80 dark:border-slate-800 hover:border-fuchsia-500/70 dark:hover:border-fuchsia-500/70 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-fuchsia-600 group-hover:text-white transition-all shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                Discussions
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Student Q&A</span>
            </Link>
          </div>
        </div>

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-sm transition">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Courses</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{courses.length}</h3>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">Authored catalog</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-sm transition">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Enrolled Students</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{totalStudents.toLocaleString()}</h3>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">Active learners</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-sm transition">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Live & Published</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{publishedCount}</h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Public on catalog</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Globe className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between hover:shadow-sm transition">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Course Drafts</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{draftCount}</h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">In preparation</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ── Courses Management Section ── */}
        <div className="space-y-4">
          {/* Controls Bar: Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Your Authored Courses</h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
                {filteredCourses.length}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-xs rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All ({courses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('published')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'published'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Live ({publishedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('draft')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'draft'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Drafts ({draftCount})
                </button>
              </div>
            </div>
          </div>

          {/* Course List */}
          {loading ? (
            <SkeletonFeed count={3} />
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredCourses.map((course) => {
                const isPub = isCoursePublished(course);
                return (
                  <div
                    key={course._id}
                    className="group bg-white dark:bg-[#111827] p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-purple-400/60 dark:hover:border-purple-500/50 transition-all flex flex-col md:flex-row md:items-center gap-4 sm:gap-5"
                  >
                    {/* Thumbnail container */}
                    <div className="w-full md:w-52 h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 shrink-0 relative shadow-inner">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-1">
                          <BookOpen className="w-8 h-8 opacity-60" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">No Preview</span>
                        </div>
                      )}

                      {/* Status badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                            isPub
                              ? 'bg-emerald-600/90 text-white border border-emerald-400/40'
                              : 'bg-amber-500/90 text-white border border-amber-300/40'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPub ? 'bg-emerald-200 animate-pulse' : 'bg-amber-200'
                            }`}
                          />
                          {isPub ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    {/* Course Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 uppercase tracking-wider">
                          {course.category?.name || course.level || 'All Levels'}
                        </span>
                        {course.level && (
                          <span className="text-[11px] text-gray-400 dark:text-slate-500 font-semibold capitalize">
                            • {course.level}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                        {course.title}
                      </h3>

                      {/* Meta stats bar */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-slate-400 flex-wrap pt-0.5">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Users className="w-3.5 h-3.5 text-purple-500" />
                          <strong className="text-gray-900 dark:text-white">{course.enrolledStudentsCount || 0}</strong> students
                        </span>

                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <strong className="text-gray-900 dark:text-white">
                            {course.averageRating ? course.averageRating.toFixed(1) : '5.0'}
                          </strong>
                        </span>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200">
                          {course.price === 0 ? 'Free' : `₹${course.price?.toLocaleString()}`}
                        </span>
                      </div>
                    </div>

                    {/* Cohesive Action Toolbar */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-slate-800/80">
                      <Link
                        to={`/instructor/courses/${course._id}/curriculum`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/60 dark:border-purple-800/60 transition shadow-2xs cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Curriculum</span>
                      </Link>

                      <Link
                        to={`/instructor/courses/${course._id}/edit`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition shadow-2xs cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
                        <span>Edit</span>
                      </Link>

                      <Link
                        to={`/courses/${course.slug}`}
                        className="p-2 rounded-xl text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 border border-gray-200/80 dark:border-slate-700/80 transition cursor-pointer"
                        title="Preview Public Course Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => handleTogglePublish(course._id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer border ${
                          isPub
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border-amber-200 dark:border-amber-800/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800/60'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{isPub ? 'Unpublish' : 'Publish'}</span>
                      </button>

                      <button
                        onClick={() => handleArchive(course._id)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 transition cursor-pointer"
                        title="Archive Course"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111827] p-10 sm:p-14 text-center rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {searchQuery || statusFilter !== 'all' ? 'No matching courses found' : 'No courses created yet'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try clearing your search filters to find what you are looking for.'
                    : 'Share your knowledge with thousands of students by publishing your first course today.'}
                </p>
              </div>

              {searchQuery || statusFilter !== 'all' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 transition cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <Link
                  to="/instructor/courses/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/30 hover:scale-105 transition"
                  style={{ background: 'linear-gradient(135deg, #6C5CE7, #4f46e5)' }}
                >
                  <Plus className="w-4 h-4" /> Create First Course
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
