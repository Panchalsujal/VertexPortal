import React from 'react';

/**
 * Shadcn-style Input & Label components
 * https://ui.shadcn.com/docs/components/base/input
 * https://ui.shadcn.com/docs/components/base/label
 */
export function Input({
  className = '',
  type = 'text',
  error = false,
  ...props
}) {
  return (
    <input
      type={type}
      className={`flex h-10 sm:h-11 w-full rounded-2xl border ${
        error
          ? 'border-red-500 focus:ring-red-500/40'
          : 'border-gray-200 dark:border-slate-800 focus:border-purple-500 focus:ring-purple-500/40'
      } bg-white dark:bg-slate-900 px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 transition-all duration-150 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-2xs ${className}`}
      {...props}
    />
  );
}

export function Label({
  className = '',
  required = false,
  children,
  ...props
}) {
  return (
    <label
      className={`text-xs sm:text-sm font-bold text-gray-800 dark:text-slate-200 select-none flex items-center gap-1 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 font-black">*</span>}
    </label>
  );
}

export default Input;
