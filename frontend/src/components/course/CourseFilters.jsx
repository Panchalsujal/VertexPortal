import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { getAllCategories } from '../../api/category.api';
import { Combobox } from '../ui/Combobox';

const LEVELS = [
  { value: '', label: 'All Levels' },
  { value: 'all-levels', label: 'All Levels (Open)' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

export function CourseFilters({ filters, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getAllCategories()
      .then(r => setCategories(r.data.categories || r.data.data?.categories || r.data.data || []))
      .catch(() => {});
  }, []);

  const categoryOptions = useMemo(() => {
    return [
      { value: '', label: 'All Categories' },
      ...categories.map(c => ({ value: c._id, label: c.name }))
    ];
  }, [categories]);

  const set = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 p-4 rounded-2xl shadow-xs mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-purple-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full h-10 sm:h-11 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl pl-9 pr-3 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            placeholder="Search courses..."
            value={filters.search || ''}
            onChange={e => set('search', e.target.value)}
            id="course-search-input"
          />
        </div>

        {/* Category Combobox */}
        <Combobox
          value={filters.category || ''}
          onChange={val => set('category', val)}
          options={categoryOptions}
          placeholder="Select Category"
          searchPlaceholder="Search categories..."
        />

        {/* Level Combobox */}
        <Combobox
          value={filters.level || ''}
          onChange={val => set('level', val)}
          options={LEVELS}
          placeholder="Select Level"
          searchPlaceholder="Search levels..."
        />

        {/* Sort Combobox & Clear */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <Combobox
              value={filters.sort || 'newest'}
              onChange={val => set('sort', val)}
              options={SORT_OPTIONS}
              placeholder="Sort By"
              searchPlaceholder="Search sort..."
            />
          </div>

          {(filters.search || filters.category || filters.level || (filters.sort && filters.sort !== 'newest')) && (
            <button
              className="p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200/80 dark:border-red-900/50 transition shrink-0 cursor-pointer"
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
