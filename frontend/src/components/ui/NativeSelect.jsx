import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Shadcn-style NativeSelect component
 * https://ui.shadcn.com/docs/components/base/native-select
 */
export function NativeSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  disabled = false,
  children,
  ...props
}) {
  return (
    <div className="relative w-full min-w-0 inline-block">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full appearance-none h-10 sm:h-11 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 pr-10 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.length > 0
          ? options.map((opt) => {
              const val = typeof opt === 'object' ? (opt.value ?? opt._id ?? opt.id) : opt;
              const lbl = typeof opt === 'object' ? (opt.label ?? opt.name ?? opt.title) : opt;
              return (
                <option key={String(val)} value={String(val)}>
                  {String(lbl)}
                </option>
              );
            })
          : children}
      </select>

      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}

export default NativeSelect;
