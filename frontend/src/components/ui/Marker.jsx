import React from 'react';

/**
 * Shadcn-style Marker component for highlighted badges, status counters, and tags
 * https://ui.shadcn.com/docs/components/base/marker
 */
export function Marker({
  variant = 'purple',
  size = 'default',
  pulse = false,
  dot = false,
  children,
  className = '',
  ...props
}) {
  const VARIANTS = {
    purple: 'bg-purple-100 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300',
    emerald: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300',
    blue: 'bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300',
    rose: 'bg-rose-100 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300',
  };

  const DOT_COLORS = {
    purple: 'bg-purple-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
  };

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border shadow-2xs ${
        VARIANTS[variant] || VARIANTS.purple
      } ${sizeClasses} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            DOT_COLORS[variant] || DOT_COLORS.purple
          } ${pulse ? 'animate-pulse' : ''}`}
        />
      )}
      {children}
    </span>
  );
}

export default Marker;
