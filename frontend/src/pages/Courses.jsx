import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BookOpenIcon,
  ArrowLeftIcon,
  SparklesIcon,
} from '@animateicons/react/lucide';
import { getAllCourses } from '../api/course.api';
import { CourseCard } from '../components/course/CourseCard';
import { CourseFilters } from '../components/course/CourseFilters';
import { SkeletonCard } from '../components/ui/Spinner';
import { Empty } from '../components/ui/Empty';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '../components/ui/Pagination';

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const LIMIT = 12;

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    level: searchParams.get('level') || '',
    sort: searchParams.get('sort') || 'newest',
  });

  const fetchCourses = useCallback(async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit: LIMIT,
      };

      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.level) params.level = filters.level;
      if (filters.sort) params.sort = filters.sort;

      const res = await getAllCourses(params);

      const courseList =
        res.data.courses ||
        res.data.data?.courses ||
        res.data.data ||
        [];

      const totalCount =
        res.data.pagination?.totalCourses ??
        res.data.total ??
        courseList.length;

      setCourses(courseList);
      setTotal(totalCount);
    } catch {
      setCourses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCourses();
    }, 300);

    return () => clearTimeout(handler);
  }, [fetchCourses]);

  const handleFiltersChange = (f) => {
    setFilters(f);
    setPage(1);

    const sp = {};

    if (f.search) sp.search = f.search;
    if (f.category) sp.category = f.category;
    if (f.level) sp.level = f.level;
    if (f.sort) sp.sort = f.sort;

    setSearchParams(sp);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const searchQuery = filters.search?.trim();

  const seoTitle = searchQuery
    ? `${searchQuery} Courses | NavGujarat Academy`
    : 'Online Courses | NavGujarat Academy';

  const seoDescription = searchQuery
    ? `Explore ${searchQuery} courses on NavGujarat Academy. Learn with structured lessons, interactive practice, AI tutor assistance, quizzes, and verified certificates.`
    : 'Explore programming, web development, AI, cloud, frontend, backend and software engineering courses on NavGujarat Academy. Learn with interactive practice, AI assistance and verified certificates.';

  const canonicalUrl = 'https://navgujaratacademy.online/courses';

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>

        <meta
          name="description"
          content={seoDescription}
        />

        <meta
          name="robots"
          content="index, follow"
        />

        <link
          rel="canonical"
          href={canonicalUrl}
        />

        <meta
          property="og:type"
          content="website"
        />

        <meta
          property="og:site_name"
          content="NavGujarat Academy"
        />

        <meta
          property="og:title"
          content={seoTitle}
        />

        <meta
          property="og:description"
          content={seoDescription}
        />

        <meta
          property="og:url"
          content={canonicalUrl}
        />

        <meta
          property="og:image"
          content="https://navgujaratacademy.online/og-image.png"
        />

        <meta
          property="og:image:alt"
          content="NavGujarat Academy Online Course Catalog"
        />

        <meta
          name="twitter:card"
          content="summary_large_image"
        />

        <meta
          name="twitter:title"
          content={seoTitle}
        />

        <meta
          name="twitter:description"
          content={seoDescription}
        />

        <meta
          name="twitter:image"
          content="https://navgujaratacademy.online/og-image.png"
        />
      </Helmet>

      <div className="page-wrapper font-[Inter,sans-serif]">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-slate-900/5 dark:from-purple-950/40 dark:to-slate-900 border-b border-gray-200 dark:border-slate-800 py-8 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => {
                  if (
                    window.history.length > 1 &&
                    window.history.state?.idx > 0
                  ) {
                    navigate(-1);
                  } else {
                    navigate('/dashboard');
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 transition cursor-pointer"
                title="Go back to previous page"
              >
                <ArrowLeftIcon
                  size={14}
                  color="currentColor"
                />

                <span>Back</span>
              </button>

              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 px-3 py-1 rounded-full">
                <SparklesIcon
                  size={13}
                  color="#6C5CE7"
                />

                Course Catalog
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Explore Courses
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              {total > 0
                ? `${total} course${total !== 1 ? 's' : ''} available to master new skills`
                : 'Discover your next skill'}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16">
          <CourseFilters
            filters={filters}
            onChange={handleFiltersChange}
          />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard
                    key={course._id}
                    course={course}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setPage((p) => Math.max(1, p - 1))
                          }
                          disabled={page === 1}
                        />
                      </PaginationItem>

                      {Array.from(
                        {
                          length: Math.min(totalPages, 7),
                        },
                        (_, i) => i + 1,
                      ).map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            isActive={pageNumber === page}
                            onClick={() =>
                              setPage(pageNumber)
                            }
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setPage((p) =>
                              Math.min(totalPages, p + 1),
                            )
                          }
                          disabled={page === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <Empty
              icon={BookOpenIcon}
              title="No published courses found"
              description="Try adjusting your search or category filters to discover courses."
              action={
                <button
                  onClick={() =>
                    handleFiltersChange({
                      search: '',
                      category: '',
                      level: '',
                      sort: 'newest',
                    })
                  }
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition"
                >
                  Reset All Filters
                </button>
              }
            />
          )}
        </div>
      </div>
    </>
  );
}