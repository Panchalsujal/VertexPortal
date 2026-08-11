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
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 p-4 rounded-2xl shadow-xs mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-purple-500 absolute left-3.5 top-3" />
          <input
            type="text"
            className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            placeholder="Search courses..."
            value={filters.search || ''}
            onChange={e => set('search', e.target.value)}
            id="course-search-input"
          />
        </div>

        {/* Category */}
        <select
          className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 capitalize"
          value={filters.level || ''}
          onChange={e => set('level', e.target.value)}
          id="course-level-filter"
        >
          <option value="">All Levels</option>
          {LEVELS.map(l => (
            <option key={l} value={l}>{l.replace('-', ' ')}</option>
          ))}
        </select>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            className="w-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={filters.sort || ''}
            onChange={e => set('sort', e.target.value)}
            id="course-sort-filter"
          >
            <option value="">Sort: Newest</option>
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Top Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>

          {(filters.search || filters.category || filters.level || filters.sort) && (
            <button
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition shrink-0 cursor-pointer"
              onClick={() => onChange({})}
              title="Clear Filters"
              id="clear-filters-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
