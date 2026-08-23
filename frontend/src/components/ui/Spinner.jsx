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

// ── Animated 3-Dots Loader ──────────────────────────────────────────────────
export function AnimatedThreeDots({ className = '', color }) {
  return (
    <span className={`inline-flex items-center gap-1.5 py-1 ${className}`}>
      <span
        className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.3s]"
        style={color ? { backgroundColor: color } : undefined}
      />
      <span
        className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:-0.15s]"
        style={color ? { backgroundColor: color } : undefined}
      />
      <span
        className="w-2 h-2 rounded-full bg-purple-600 animate-bounce"
        style={color ? { backgroundColor: color } : undefined}
      />
    </span>
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
// Full-bleed studio skeleton — matches actual LiveClassRoom layout exactly
export function SkeletonLiveRoom() {
  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen bg-slate-950 flex flex-col overflow-hidden font-[Inter,sans-serif]">
      {/* Shimmer keyframe via inline style */}
      <style>{`
        @keyframes skshimmer {
          0% { background-position: -600px 0; }
          100% { background-position: 600px 0; }
        }
        .sk-shimmer {
          background: linear-gradient(90deg, #1e293b 25%, #293548 50%, #1e293b 75%);
          background-size: 600px 100%;
          animation: skshimmer 1.6s infinite linear;
          border-radius: 0.75rem;
        }
      `}</style>

      {/* ── Top Header Bar (matches real header) ── */}
      <header className="h-14 shrink-0 bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
        {/* Left: back button + LIVE pill + title */}
        <div className="flex items-center gap-3">
          <div className="sk-shimmer w-8 h-8 rounded-xl shrink-0" />
          <div className="flex items-center gap-2">
            <div className="sk-shimmer w-2.5 h-2.5 rounded-full" />
            <div className="sk-shimmer w-10 h-3.5 rounded-full" />
            <div className="sk-shimmer w-44 h-4 rounded-lg hidden sm:block" />
          </div>
        </div>
        {/* Right: layout switch + role badge + participants */}
        <div className="flex items-center gap-2">
          <div className="sk-shimmer w-8 h-8 rounded-xl" />
          <div className="sk-shimmer w-32 h-7 rounded-full hidden sm:block" />
          <div className="sk-shimmer w-14 h-7 rounded-full" />
        </div>
      </header>

      {/* ── Main Stage ── */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Video grid area */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-950 p-2 sm:p-3 gap-2 sm:gap-3">
          {/* Video tile grid — 2×2 on mobile/tablet, 3×2 on desktop */}
          <div className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="sk-shimmer rounded-2xl relative overflow-hidden"
                style={{ display: i >= 4 ? 'none' : undefined }}
              >
                {/* Avatar placeholder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                  <div
                    className="rounded-full"
                    style={{
                      width: 44,
                      height: 44,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1.5px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <div
                    style={{
                      width: 72,
                      height: 10,
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.07)',
                    }}
                  />
                </div>
                {/* Name tag at bottom */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                  <div style={{ width: 80, height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.07)' }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Floating Control Bar ── */}
          <div className="h-16 pt-2 flex items-center justify-center shrink-0">
            <div className="sk-shimmer flex items-center gap-2 sm:gap-3 px-4 py-2 rounded-2xl" style={{ minWidth: 260, height: 52 }}>
              {/* Mic */}
              <div style={{ width: 72, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.07)' }} />
              {/* Cam */}
              <div style={{ width: 72, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.07)' }} />
              {/* Screen / Hand */}
              <div style={{ width: 64, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.07)' }} />
              {/* Chat */}
              <div style={{ width: 80, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.07)' }} />
              {/* End */}
              <div style={{ width: 88, height: 36, borderRadius: 12, background: 'rgba(239,68,68,0.18)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Connecting overlay text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="flex flex-col items-center gap-3 bg-slate-950/70 backdrop-blur-sm px-8 py-6 rounded-3xl border border-slate-800/60 shadow-2xl">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-purple-500"
                style={{ animation: `skshimmer 1.2s ${i * 0.2}s infinite alternate`, animationName: 'bounce' }}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-400 tracking-wide">Setting up your live room…</p>
        </div>
      </div>
    </div>
  );
}

/**
 * ── Minimal Global PageLoader ──────────────────────────────────────────────────
 * Designed for the 'Learning Campus' aesthetic.
 * Features:
 * • No blocking flashes (fade-in delay-150)
 * • Minimal 2px neutral progress track
 * • Hardware accelerated smooth motion
 * • motion-safe wrappers for reduced motion
 */
export function PageLoader({ text = 'Loading...' }) {
  return (
    <div 
      className="min-h-[75vh] flex flex-col items-center justify-center p-4 bg-transparent font-[Inter,sans-serif] select-none"
      role="status"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center max-w-xs text-center space-y-4 opacity-0 animate-in fade-in duration-500 delay-150 fill-mode-forwards">
        
        {/* Simple Brand Wordmark */}
        <div className="text-gray-900 dark:text-gray-100">
          <span className="font-bold tracking-tight text-sm">NavGujarat Academy</span>
        </div>

        {/* Minimal Progress Track (Low Contrast) */}
        <div className="w-32 h-[2px] bg-gray-200 dark:bg-neutral-800 overflow-hidden relative rounded-full">
          <div className="absolute inset-y-0 w-1/3 bg-gray-500 dark:bg-neutral-400 rounded-full animate-[progress_2.5s_ease-in-out_infinite] motion-reduce:animate-none" />
        </div>

        {/* Minimal Text */}
        <p className="text-[11px] font-medium text-gray-500 dark:text-neutral-500">
          {text}
        </p>

      </div>

      <style>{`
        @keyframes progress {
          0% { left: -33%; width: 33%; }
          50% { left: 33%; width: 50%; }
          100% { left: 100%; width: 33%; }
        }
      `}</style>
    </div>
  );
}

// CanvasLoader alias for backwards compatibility if needed
export function CanvasLoader(props) {
  return <PageLoader {...props} />;
}

export default PageLoader;

