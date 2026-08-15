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

// ── Live Class Card Grid Skeleton ────────────────────────────────────────────
export function SkeletonLiveClassGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-6 bg-purple-100 dark:bg-purple-950/60 rounded-full w-28" />
              <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-full w-20" />
            </div>
            <div className="h-5 bg-purple-50 dark:bg-purple-950/40 rounded-md w-24" />
            <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-xl w-4/5 pt-1" />
            <div className="h-3.5 bg-gray-100 dark:bg-slate-800/60 rounded w-3/5" />
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-1/2" />
            </div>
          </div>
          <div className="h-11 bg-gray-200 dark:bg-slate-800 rounded-2xl w-full" />
        </div>
      ))}
    </div>
  );
}

// ── Attendance List Skeleton ────────────────────────────────────────────────
export function SkeletonAttendanceList({ count = 4 }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs animate-pulse">
      <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-32" />
        <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-full w-20" />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2.5 flex-1">
              <div className="flex gap-2">
                <div className="h-5 bg-purple-100 dark:bg-purple-950/60 rounded-full w-28" />
                <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-full w-20" />
              </div>
              <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-lg w-3/5" />
              <div className="h-3.5 bg-gray-100 dark:bg-slate-800/60 rounded w-2/5" />
            </div>
            <div className="w-48 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-2.5 bg-gray-200 dark:bg-slate-800 rounded-full w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Live Room Skeleton ──────────────────────────────────────────────────────
export function SkeletonLiveRoom() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col animate-pulse">
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-slate-800 rounded-lg" />
          <div className="w-40 h-4 bg-slate-800 rounded-md" />
        </div>
        <div className="w-24 h-6 bg-slate-800 rounded-full" />
      </div>
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4">
        <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 rounded-3xl bg-slate-800 mb-4" />
          <div className="w-48 h-4 bg-slate-800 rounded-md mb-2" />
          <div className="w-32 h-3 bg-slate-800 rounded-md" />
        </div>
        <div className="w-full lg:w-80 bg-slate-900 border border-slate-800 rounded-3xl p-4 hidden lg:flex flex-col gap-3">
          <div className="h-4 bg-slate-800 rounded w-28 mb-2" />
          <div className="space-y-3 flex-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-800/60 rounded-2xl" />
            ))}
          </div>
          <div className="h-10 bg-slate-800 rounded-xl" />
        </div>
      </div>
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
