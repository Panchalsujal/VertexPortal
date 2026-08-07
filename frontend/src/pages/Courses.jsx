import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { getAllCourses } from '../api/course.api';
import { CourseCard } from '../components/course/CourseCard';
import { CourseFilters } from '../components/course/CourseFilters';
import { Spinner } from '../components/ui/Spinner';

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
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
      const params = { page, limit: LIMIT };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.level) params.level = filters.level;
      if (filters.sort) params.sort = filters.sort;

      const res = await getAllCourses(params);
      const courseList = res.data.courses || res.data.data?.courses || res.data.data || [];
      const totalCount = res.data.pagination?.totalCourses ?? res.data.total ?? courseList.length;
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
    const handler = setTimeout(() => { fetchCourses(); }, 300);
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

  return (
    <div className="page-wrapper">
      <div style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', padding: '2.5rem 0' }}>
        <div className="container">
          <h1 style={{ marginBottom: '0.5rem' }}>Browse Courses</h1>
          <p>{total > 0 ? `${total} course${total !== 1 ? 's' : ''} available` : 'Discover your next skill'}</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <CourseFilters filters={filters} onChange={handleFiltersChange} />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
            <Spinner />
          </div>
        ) : courses.length > 0 ? (
          <>
            <div className="grid-courses">
              {courses.map(c => <CourseCard key={c._id} course={c} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  id="prev-page-btn"
                >← Prev</button>

                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPage(p)}
                    id={`page-${p}-btn`}
                  >{p}</button>
                ))}

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  id="next-page-btn"
                >Next →</button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><BookOpen size={48} /></div>
            <h3>No published courses found</h3>
            <p>Try adjusting your search or filters, or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
