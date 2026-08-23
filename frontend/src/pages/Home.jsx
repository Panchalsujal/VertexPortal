import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, ArrowRight, Terminal, BookOpen, MessageSquare, Award } from 'lucide-react';

import { getAllCourses } from '../api/course.api';
import { getAllCategories } from '../api/category.api';
import { getFeaturedReviews, getPlatformStats } from '../api/review.api';
import { LandingCourseCard } from '../components/course/LandingCourseCard';

const LEARNING_PATHS = [
  {
    phase: 'Foundation',
    title: 'Core Fundamentals',
    desc: 'Establish an understanding of computer science principles and programming logic.',
    link: '/courses',
  },
  {
    phase: 'Application',
    title: 'Frontend & Backend Architecture',
    desc: 'Build full-stack applications using modern frameworks and databases.',
    link: '/courses',
  },
  {
    phase: 'Production',
    title: 'System Design & Deployment',
    desc: 'Master scalable infrastructure, cloud deployment, and system architecture.',
    link: '/courses',
  }
];

export default function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [platformStats, setPlatformStats] = useState({
    totalStudents: 0,
    averageRating: 0,
  });
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    Promise.allSettled([
      getAllCourses({ limit: 12, sort: 'popular', status: 'published' }),
      getAllCategories(),
      getFeaturedReviews(),
      getPlatformStats(),
    ])
      .then(([cr, catr, revr, statsr]) => {
        if (cr.status === 'fulfilled') {
          setCourses(cr.value.data?.courses || cr.value.data?.data?.courses || cr.value.data?.data || []);
        }
        if (catr.status === 'fulfilled') {
          setCategories(catr.value.data?.categories || catr.value.data?.data?.categories || catr.value.data?.data || []);
        }
        if (revr.status === 'fulfilled') {
          const realRevs = revr.value.data?.data || revr.value.data?.reviews || [];
          if (Array.isArray(realRevs) && realRevs.length > 0) {
            setReviews(realRevs);
          }
        }
        if (statsr.status === 'fulfilled') {
          const s = statsr.value.data?.stats;
          if (s) {
            setPlatformStats({
              totalStudents: s.totalStudents || s.totalEnrollments || 0,
              averageRating: s.averageRating || 0,
            });
          }
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchCat =
        selectedCategory === 'all' ||
        c.category?._id === selectedCategory ||
        c.category?.slug === selectedCategory ||
        c.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [courses, selectedCategory, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>NavGujarat Academy — The Learning Campus</title>
        <meta name="description" content="Master software engineering through structured learning, interactive practice, and peer review." />
      </Helmet>
      <style>{`
        .landing-page-wrapper ::selection {
          background-color: #111827 !important;
          color: #ffffff !important;
        }
        .dark .landing-page-wrapper ::selection {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
      `}</style>

      <div className="landing-page-wrapper min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-neutral-100 font-sans">
        
        {/* =========================================================
            DISCOVERY ANCHOR & HERO
        ========================================================= */}
        <section className="pt-10 pb-10 px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-medium tracking-wide mb-4 text-gray-900 dark:text-white leading-tight">
              Learn skills that you can actually build with.
            </h1>
            <p className="text-base text-gray-600 dark:text-neutral-400 mb-8 max-w-2xl">
              NavGujarat Academy provides structured learning, interactive practice, and verified outcomes for modern engineering.
            </p>
            
            <div className="max-w-2xl">
              {/* Search Input */}
              <form onSubmit={handleSearchSubmit} className="relative flex items-center border border-gray-300 dark:border-neutral-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-gray-900 dark:focus-within:ring-neutral-100 bg-white dark:bg-neutral-900 transition-shadow">
                <div className="pl-4 text-gray-400 dark:text-neutral-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search courses, skills or topics"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none text-sm"
                />
                <button type="submit" className="px-5 py-3 font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm border-l border-gray-300 dark:border-neutral-700 shrink-0">
                  Search
                </button>
              </form>
              
              {/* Category Filters */}
              <div className="flex items-center gap-5 mt-5 overflow-x-auto no-scrollbar pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-1' : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white pb-1'}`}
                >
                  All Courses
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat._id ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white pb-1' : 'text-gray-500 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-white pb-1'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            COURSE PRESENTATION GRID
        ========================================================= */}
        <section className="pb-24 px-6 lg:px-8 max-w-7xl mx-auto border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-xl font-medium mb-6 text-gray-900 dark:text-white">Explore Courses</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[16/10] bg-gray-200 dark:bg-neutral-800 rounded-lg mb-4" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-neutral-800 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="py-8">
              <p className="text-gray-600 dark:text-neutral-400">No courses match this criteria.</p>
            </div>
          ) : filteredCourses.length === 1 ? (
             <div className="w-full max-w-4xl">
                <LandingCourseCard course={filteredCourses[0]} isList={true} />
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredCourses.map((course) => (
                <LandingCourseCard key={course._id} course={course} />
              ))}
            </div>
          )}
        </section>

        {/* =========================================================
            LEARNING PATHS & CAPABILITIES (Integrated)
        ========================================================= */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto border-b border-gray-200 dark:border-neutral-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Learning Path */}
            <div>
              <h2 className="text-2xl font-medium mb-8">The Learning Path</h2>
              <div className="relative pl-6 border-l border-gray-200 dark:border-neutral-800 space-y-12">
                {LEARNING_PATHS.map((path, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[29px] top-1 w-3 h-3 bg-white dark:bg-neutral-950 border-2 border-gray-400 dark:border-neutral-500 rounded-full" />
                    <p className="text-sm font-medium text-gray-500 dark:text-neutral-400 mb-1">Phase {idx + 1}: {path.phase}</p>
                    <h3 className="text-lg font-medium mb-2">{path.title}</h3>
                    <p className="text-gray-600 dark:text-neutral-400 text-sm mb-4 leading-relaxed tracking-wide">{path.desc}</p>
                    <Link to={path.link} className="text-sm font-medium text-gray-900 dark:text-white hover:underline">
                      Explore phase &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Contextual Capabilities */}
            <div>
              <h2 className="text-2xl font-medium mb-8">Platform Capabilities</h2>
              <div className="space-y-10">
                <div className="flex gap-4">
                  <div className="mt-1 flex-shrink-0 text-gray-500 dark:text-neutral-400"><Terminal className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Interactive Playgrounds</h3>
                    <p className="text-gray-600 dark:text-neutral-400 text-sm mb-4 leading-relaxed tracking-wide">
                      Practice coding directly in your browser. Our environments are pre-configured, meaning zero setup time for you.
                    </p>
                    <Link to="/playground" className="text-sm font-medium text-gray-900 dark:text-white hover:underline">
                      Open Playground &rarr;
                    </Link>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 flex-shrink-0 text-gray-500 dark:text-neutral-400"><BookOpen className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">AI Study Assistant</h3>
                    <p className="text-gray-600 dark:text-neutral-400 text-sm mb-4 leading-relaxed tracking-wide">
                      Get immediate explanations for complex concepts or debugging help while you study the course material.
                    </p>
                    <Link to="/ai-chat" className="text-sm font-medium text-gray-900 dark:text-white hover:underline">
                      Meet the AI Tutor &rarr;
                    </Link>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 flex-shrink-0 text-gray-500 dark:text-neutral-400"><MessageSquare className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Student Discussions</h3>
                    <p className="text-gray-600 dark:text-neutral-400 text-sm mb-4 leading-relaxed tracking-wide">
                      Learn collaboratively. Ask questions, share insights, and get help from instructors and peers in dedicated course forums.
                    </p>
                    <Link to="/discussions" className="text-sm font-medium text-gray-900 dark:text-white hover:underline">
                      View Discussions &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================
            HUMAN PROOF (Stats & Reviews)
        ========================================================= */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto">
          {(!loading && platformStats.totalStudents > 0) && (
            <div className="flex flex-wrap items-center gap-x-12 gap-y-6 mb-16 border-b border-gray-200 dark:border-neutral-800 pb-8">
              <div>
                <p className="text-3xl font-medium">{platformStats.totalStudents.toLocaleString()}+</p>
                <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">Students Learning</p>
              </div>
              {platformStats.averageRating > 0 && (
                <div>
                  <p className="text-3xl font-medium">{platformStats.averageRating.toFixed(1)}</p>
                  <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">Average Rating</p>
                </div>
              )}
            </div>
          )}

          {!loading && reviews.length > 0 && (
            <div>
              <h2 className="text-2xl font-medium mb-8">Student Reviews</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {reviews.slice(0, 3).map((rev, idx) => (
                  <div key={idx} className="flex flex-col">
                    <p className="text-base text-gray-700 dark:text-neutral-300 mb-6 flex-1 leading-relaxed">
                      "{rev.comment || rev.text}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center text-gray-500 font-bold">
                        {(rev.student?.fullName || rev.name || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{rev.student?.fullName || rev.name || 'Student'}</p>
                        <p className="text-xs text-gray-500 dark:text-neutral-400">{rev.course?.title || 'Alumni'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </div>
    </>
  );
}