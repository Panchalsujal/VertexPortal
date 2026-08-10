import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Star, Award, TrendingUp, Zap, BookOpen, Bot, MessageSquare, Shield } from 'lucide-react';
import { getAllCourses } from '../api/course.api';
import { getAllCategories } from '../api/category.api';
import { CourseCard } from '../components/course/CourseCard';
import { PageLoader } from '../components/ui/Spinner';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';

const STATS = [
  { value: '50K+', label: 'Students Enrolled' },
  { value: '200+', label: 'Expert Courses' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '95%', label: 'Completion Rate' },
];

const FEATURES = [
  { icon: Bot, title: 'AI Tutor Assistant', desc: 'Ask questions anytime with our intelligent RAG-powered course AI assistant.' },
  { icon: MessageSquare, title: 'Community Discussions', desc: 'Ask questions, share code, and get answers from instructors & peers.' },
  { icon: Award, title: 'Certificates of Completion', desc: 'Earn verifiable digital certificates for every completed course.' },
  { icon: Zap, title: 'Interactive Learning', desc: 'Assessments, quizzes, live video classes, and structured assignments.' },
];

export default function Home() {
  const user = useAppSelector(selectUser);
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
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200 py-16 lg:py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" /> Trusted by 50,000+ Students & Professionals
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Master Modern Skills with <span className="text-blue-600">AI-Powered</span> Learning
              </h1>
              <p className="text-base text-gray-600 leading-relaxed">
                VertexPortal brings together courses, interactive quizzes, AI study tutors, community discussions, and live video sessions for a complete LMS experience.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/courses"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 py-3 rounded-lg shadow-sm transition inline-flex items-center gap-2"
                >
                  Explore Courses <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/ai-chat"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-sm px-6 py-3 rounded-lg transition inline-flex items-center gap-2"
                >
                  <Bot className="w-4 h-4 text-blue-600" /> Try AI Tutor
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                {STATS.map(s => (
                  <div key={s.label}>
                    <div className="text-xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Card Mockup */}
            <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-xl border border-gray-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-xl">
                  <Play className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Fullstack Web Development 2026</h3>
                  <p className="text-xs text-gray-400">Section 4 — React & Node.js Architecture</p>
                </div>
              </div>

              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[65%]" />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Lecture 8 of 12</span>
                <span>65% Complete</span>
              </div>

              <div className="space-y-2 pt-2">
                {['Introduction to Express Routes', 'JWT Authentication Flow', 'AI Tutor Context Search'].map((t, idx) => (
                  <div key={t} className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${idx === 1 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-gray-800/50 text-gray-400'}`}>
                    <span>{t}</span>
                    {idx === 1 ? <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">Active</span> : <span className="text-[10px] text-gray-500">Video</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Explore by Category</h2>
            <p className="text-sm text-gray-500">Find courses tailored to your career path</p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {categories.slice(0, 8).map(cat => (
              <Link
                key={cat._id}
                to={`/courses?category=${cat._id}`}
                className="bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-600 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-full shadow-sm transition inline-flex items-center gap-2"
              >
                <BookOpen className="w-3.5 h-3.5" /> {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Popular Courses */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Popular Courses</h2>
              <p className="text-sm text-gray-500">Top-rated learning paths chosen by thousands</p>
            </div>
            <Link to="/courses" className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <PageLoader />
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(c => <CourseCard key={c._id} course={c} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">
              No courses published yet.
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900">Why Choose VertexPortal?</h2>
          <p className="text-sm text-gray-500">A comprehensive suite of modern learning tools</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg w-fit">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
