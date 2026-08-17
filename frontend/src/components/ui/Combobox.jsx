import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronsUpDown, Check, Search, X } from 'lucide-react';

/**
 * Shadcn-style Combobox component with built-in search filter & popover.
 * https://ui.shadcn.com/docs/components/base/combobox
 */
export function Combobox({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  className = '',
  popoverClassName = '',
  disabled = false,
  size = 'default',
  allowClear = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options: handles primitives, { value, label }, or { _id, name/title }
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        const val = opt.value !== undefined ? opt.value : (opt._id !== undefined ? opt._id : opt.id);
        const lbl = opt.label !== undefined ? opt.label : (opt.name !== undefined ? opt.name : opt.title || String(val));
        return { ...opt, value: String(val), label: String(lbl) };
      }
      return { value: String(opt), label: String(opt) };
    });
  }, [options]);

  const selected = useMemo(() => {
    if (value === undefined || value === null || value === '') return null;
    return normalizedOptions.find((opt) => opt.value === String(value));
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const q = search.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, search]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      // Auto-focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  // Reset search query when closed
  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const sizeClasses = size === 'sm'
    ? 'h-9 px-3 py-1.5 text-xs rounded-xl'
    : 'h-10 sm:h-11 px-3.5 sm:px-4 py-2 text-xs sm:text-sm rounded-xl';

  return (
    <div ref={containerRef} className="relative w-full min-w-0 inline-block select-none">
      {/* Combobox Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 font-medium transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/40 hover:border-purple-300 dark:hover:border-purple-700 shadow-2xs ${sizeClasses} ${
          open ? 'ring-2 ring-purple-500/40 border-purple-500' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <span className="truncate flex-1 min-w-0 text-left">
          {selected ? (
            <span className="font-semibold text-gray-900 dark:text-white">{selected.label}</span>
          ) : (
            <span className="text-gray-400 dark:text-slate-500">{placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronsUpDown className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
        </div>
      </button>

      {/* Popover Dropdown (Command Menu) */}
      {open && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 w-full bg-white dark:bg-[#161928] rounded-2xl border border-gray-200 dark:border-[#2a2f4e] shadow-xl p-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md ${popoverClassName}`}
        >
          {/* Command Search Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-slate-800/80 mb-1">
            <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Command List Options */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-4 text-xs text-gray-400 dark:text-slate-500 text-center">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selected && selected.value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm text-left rounded-xl transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold'
                        : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100/80 dark:hover:bg-slate-800/80 hover:text-gray-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <span className="truncate flex-1 min-w-0" title={opt.label}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Combobox;
