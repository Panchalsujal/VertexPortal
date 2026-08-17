import React from 'react';

/**
 * Shadcn-style Skeleton component
 * https://ui.shadcn.com/docs/components/base/skeleton
 */
export function Skeleton({
  className = '',
  ...props
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gray-200/80 dark:bg-slate-800/80 ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
