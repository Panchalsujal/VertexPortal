import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { getAllCategories } from '../../api/category.api';

const LEVELS = ['all-levels', 'beginner', 'intermediate', 'advanced'];

export function CourseFilters({ filters, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getAllCategories()
      .then(r => setCategories(r.data.categories || r.data.data?.categories || r.data.data || []))
      .catch(() => {});
  }, []);

  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center',
      padding: '1rem 1.5rem',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: '2rem',
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 260px' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input-field"
          placeholder="Search courses…"
          value={filters.search || ''}
          onChange={e => set('search', e.target.value)}
          style={{ paddingLeft: 38 }}
          id="course-search-input"
        />
      </div>

      {/* Category */}
      <select
        className="input-field"
        style={{ flex: '0 0 auto', minWidth: 160 }}
        value={filters.category || ''}
        onChange={e => set('category', e.target.value)}
        id="course-category-filter"
      >
        <option value="">All Categories</option>
        {categories.map(c => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>

      {/* Level */}
      <select
        className="input-field"
        style={{ flex: '0 0 auto', minWidth: 140 }}
        value={filters.level || ''}
        onChange={e => set('level', e.target.value)}
        id="course-level-filter"
      >
        <option value="">All Levels</option>
        {LEVELS.map(l => (
          <option key={l} value={l}>{l.replace('-', ' ')}</option>
        ))}
      </select>

      {/* Sort matching backend sortOptions */}
      <select
        className="input-field"
        style={{ flex: '0 0 auto', minWidth: 160 }}
        value={filters.sort || ''}
        onChange={e => set('sort', e.target.value)}
        id="course-sort-filter"
      >
        <option value="">Sort: Default (Newest)</option>
        <option value="newest">Newest First</option>
        <option value="popular">Most Popular</option>
        <option value="rating">Top Rated</option>
        <option value="price_low">Price: Low to High</option>
        <option value="price_high">Price: High to Low</option>
      </select>

      {/* Clear Filters */}
      {(filters.search || filters.category || filters.level || filters.sort) && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onChange({})}
          style={{ color: 'var(--color-error)' }}
          id="clear-filters-btn"
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  );
}
