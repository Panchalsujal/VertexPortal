import React from 'react';

export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4 border-2' : size === 'lg' ? 'w-10 h-10 border-3' : 'w-6 h-6 border-2';
  return (
    <div
      className={`animate-spin rounded-full border-gray-200 dark:border-gray-700 border-t-purple-600 ${sizeClasses} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

// ── Course Card Skeleton (16:9) ──────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-3xl overflow-hidden shadow-xs animate-pulse flex flex-col justify-between">
      <div>
        <div className="aspect-video bg-gray-200 dark:bg-gray-800 w-full relative">
          <div className="absolute top-3 left-3 w-20 h-5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-14" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/5" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        </div>
      </div>
      <div className="p-5 pt-0 flex justify-between items-center">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-16" />
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-28" />
      </div>
    </div>
  );
}

// ── Table Skeleton ───────────────────────────────────────────────────────────
export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-3xl overflow-hidden shadow-xs animate-pulse">
      <div className="h-12 bg-gray-100 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 gap-6">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-3.5 bg-gray-300 dark:bg-gray-700 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-6">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-3.5 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feed / List Skeleton ─────────────────────────────────────────────────────
export function SkeletonFeed({ count = 4 }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-800 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16" />
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard Skeleton ───────────────────────────────────────────────────────
export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16" />
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-72 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 p-6" />
    </div>
  );
}

// ── Curriculum / Modules Skeleton ────────────────────────────────────────────
export function SkeletonCurriculum({ count = 3 }) {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-20 h-6 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="w-48 h-5 rounded-md bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="w-24 h-8 rounded-xl bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-14 bg-gray-100 dark:bg-gray-800/40 rounded-2xl p-4 flex items-center justify-between" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Banner / Hero Skeleton ───────────────────────────────────────────────────
export function SkeletonBanner() {
  return (
    <div className="w-full h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-3xl animate-pulse p-6 flex flex-col justify-center gap-3">
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3" />
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3" />
    </div>
  );
}

// ── PageLoader fallback ──────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-600 border border-purple-500/30 flex items-center justify-center animate-bounce">
        <div className="w-5 h-5 rounded-md bg-purple-600" />
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider animate-pulse">Loading VertexPortal...</p>
    </div>
  );
}
