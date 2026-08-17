import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

/**
 * Shadcn-style Pagination component
 * https://ui.shadcn.com/docs/components/base/pagination
 */
export function Pagination({ className = '', children, ...props }) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={`mx-auto flex w-full justify-center items-center gap-1.5 ${className}`}
      {...props}
    >
      {children}
    </nav>
  );
}

export function PaginationContent({ className = '', children, ...props }) {
  return (
    <ul className={`flex flex-row items-center gap-1.5 ${className}`} {...props}>
      {children}
    </ul>
  );
}

export function PaginationItem({ className = '', children, ...props }) {
  return <li className={`inline-block ${className}`} {...props}>{children}</li>;
}

export function PaginationLink({
  isActive = false,
  disabled = false,
  children,
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center h-9 min-w-9 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
        isActive
          ? 'bg-purple-600 text-white shadow-xs'
          : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
      } ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function PaginationPrevious({ onClick, disabled, className = '', ...props }) {
  return (
    <PaginationLink
      onClick={onClick}
      disabled={disabled}
      aria-label="Go to previous page"
      className={`gap-1 pl-2.5 ${className}`}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Previous</span>
    </PaginationLink>
  );
}

export function PaginationNext({ onClick, disabled, className = '', ...props }) {
  return (
    <PaginationLink
      onClick={onClick}
      disabled={disabled}
      aria-label="Go to next page"
      className={`gap-1 pr-2.5 ${className}`}
      {...props}
    >
      <span className="hidden sm:inline">Next</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

export function PaginationEllipsis({ className = '', ...props }) {
  return (
    <span
      aria-hidden
      className={`flex h-9 w-9 items-center justify-center text-gray-400 dark:text-slate-500 ${className}`}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export default Pagination;
