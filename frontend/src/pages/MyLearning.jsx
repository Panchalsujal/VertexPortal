import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyEnrollments } from '../api/enrollment.api';
import { Spinner } from '../components/ui/Spinner';
import {
  BookOpen, Play, TrendingUp, Award, CheckCircle2, Clock,
  Search, ArrowRight, Sparkles, GraduationCap, Layers, Check
} from 'lucide-react';

// Skeleton Card Component
function SkeletonLearningCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800/80 overflow-hidden shadow-sm animate-pulse flex flex-col justify-between">
      <div>
        {/* Thumbnail skeleton */}
        <div className="aspect-video w-full bg-gray-200 dark:bg-gray-800 relative">
          <div className="absolute top-3 left-3 w-24 h-6 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>
        <div className="p-5 sm:p-6 space-y-3.5">
          <div className="flex justify-between items-center">
            <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded-md w-28" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-16" />
          </div>
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-lg w-4/5" />
          <div className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded-md w-3/5" />

          {/* Progress skeleton */}
          <div className="pt-2 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-28" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-10" />
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6 pt-0">
        <div className="w-full h-11 rounded-2xl bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}

export default function MyLearning() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getMyEnrollments()
      .then(r => setEnrollments(r.data.enrollments || r.data.data?.enrollments || r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.status === 'completed' || (e.progress?.percentage ?? e.progressPercentage) >= 100).length;
  const inProgressCourses = totalCourses - completedCourses;

  const filtered = enrollments.filter(e => {
    const isCompleted = e.status === 'completed' || (e.progress?.percentage ?? e.progressPercentage) >= 100;
    const matchesTab =
      tab === 'active' ? !isCompleted :
      tab === 'completed' ? isCompleted : true;

    const courseTitle = e.course?.title || '';
    const instructorName = e.course?.instructor?.fullName || e.course?.instructor?.name || '';
    const matchesSearch =
      courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      instructorName.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-[Inter,sans-serif] py-8 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 mb-8 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  My Learning
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Track your course progress, continue lessons, and claim certificates
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Chips */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Enrolled</p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">{totalCourses}</p>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">In Progress</p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">{inProgressCourses}</p>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Completed</p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white leading-none">{completedCourses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Segmented Tab Buttons */}
          <div className="flex items-center p-1.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs self-stretch sm:self-auto">
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All Courses ({totalCourses})
            </button>

            <button
              onClick={() => setTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === 'active'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              In Progress ({inProgressCourses})
            </button>

            <button
              onClick={() => setTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                tab === 'completed'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Completed ({completedCourses})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
            />
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonLearningCard key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(enr => {
              const course = enr.course || {};
              const enrId = enr.id || enr._id;
              const pct = Number(enr.progress?.percentage ?? enr.progressPercentage ?? 0);
              const completedCount = enr.progress?.completedLecturesCount ?? enr.completedLecturesCount ?? 0;
              const isCompleted = enr.status === 'completed' || pct >= 100;

              return (
                <div
                  key={enrId}
                  className="group bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Course Thumbnail Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                      {course?.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-purple-950/50 to-indigo-950/50">
                          <BookOpen className="w-10 h-10 text-purple-400/40" />
                        </div>
                      )}

                      {/* Status Badge Overlay */}
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm ${
                          isCompleted
                            ? 'bg-emerald-500/90 text-white'
                            : 'bg-black/60 text-white border border-white/20'
                        }`}>
                          {isCompleted ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Completed
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                              {pct > 0 ? `${pct.toFixed(0)}% Done` : 'Not Started'}
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Card Content Body */}
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate">
                          By <span className="font-semibold text-gray-700 dark:text-gray-300">{course?.instructor?.fullName || course?.instructor?.name || 'Instructor'}</span>
                        </span>
                        {course?.category?.name && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold text-[10px]">
                            {course.category.name}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-4">
                        {course?.title || 'Untitled Course'}
                      </h3>

                      {/* Progress Section */}
                      <div className="space-y-2 mb-5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                            {completedCount > 0 ? `${completedCount} lessons completed` : 'Start first lesson'}
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 font-bold font-mono">
                            {pct.toFixed(0)}%
                          </span>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                    <Link
                      to={`/learn/${course?._id}`}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition group-hover:shadow-md cursor-pointer"
                      id={`continue-${enrId}-btn`}
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{pct > 0 ? (isCompleted ? 'Review Course' : 'Continue Learning') : 'Start Course'}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {search ? 'No matching courses found' : `No ${tab === 'all' ? '' : tab} courses`}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {search
                ? 'Try adjusting your search terms to find your enrolled courses.'
                : tab === 'completed'
                ? 'Complete your enrolled courses to see them here and receive certificates.'
                : 'Explore thousands of courses taught by expert instructors.'}
            </p>
            <Link
              to="/courses"
              className="mt-6 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition"
            >
              Browse Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
