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

// ── #19 Canvas Loading Animation (Constellation Network) ────────────────────
export function CanvasLoader({ width = 240, height = 240, color = '#6C5CE7' }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let time = 0;

    // Handle high DPI displays for sharp rendering
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cx = width / 2;
    const cy = height / 2;
    const numPoints = 26;
    const maxDist = 58;

    // Palette: Purple, Indigo, Sky Blue, Violet
    const colors = [
      '#6C5CE7',
      '#8B5CF6',
      '#A78BFA',
      '#38BDF8',
      '#818CF8',
      '#C084FC',
    ];

    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const baseRadius = 42 + (i % 3) * 16;
      points.push({
        angle,
        speed: (0.015 + (i % 4) * 0.005) * (i % 2 === 0 ? 1 : -0.85),
        baseRadius,
        radiusSpeed: 0.02 + (i % 3) * 0.015,
        radiusOffset: i * 0.45,
        radiusAmp: 14 + (i % 3) * 6,
        size: 2.2 + (i % 3) * 0.8,
        color: colors[i % colors.length],
        x: cx,
        y: cy,
      });
    }

    const render = () => {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // 1. Update point positions
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.angle += p.speed;
        const currentR = p.baseRadius + Math.sin(time * p.radiusSpeed + p.radiusOffset) * p.radiusAmp;
        p.x = cx + Math.cos(p.angle) * currentR;
        p.y = cy + Math.sin(p.angle) * currentR;
      }

      // 2. Draw connecting dynamic constellation lines
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const p1 = points[i];
          const p2 = points[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = ((1 - dist / maxDist) * 0.55).toFixed(3);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      }

      // 3. Draw soft center pulse aura
      const pulseRadius = 18 + Math.sin(time * 0.05) * 4;
      const gradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, pulseRadius + 14);
      gradient.addColorStop(0, 'rgba(108, 92, 231, 0.4)');
      gradient.addColorStop(0.6, 'rgba(139, 92, 246, 0.15)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseRadius + 14, 0, Math.PI * 2);
      ctx.fill();

      // 4. Draw glowing points
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: `${width}px`, height: `${height}px` }}
      className="block mx-auto select-none"
    />
  );
}

// ── Full Page Modern SaaS Loader with Canvas Animation ──────────────────────
export function PageLoader({ text = 'Loading VertexPortal...' }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 relative overflow-hidden font-[Inter,sans-serif] select-none">
      {/* Soft Ambient Background Glow */}
      <div className="absolute w-80 h-80 rounded-full bg-purple-500/10 dark:bg-purple-600/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-64 h-64 rounded-full bg-sky-500/10 dark:bg-sky-600/10 blur-3xl pointer-events-none animate-pulse [animation-delay:1s]" />

      <div className="relative z-10 flex flex-col items-center max-w-sm text-center">
        {/* Canvas Constellation Animation */}
        <div className="relative flex items-center justify-center">
          <CanvasLoader width={220} height={220} />
          {/* Center Brand Icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-purple-200/60 dark:border-purple-800/60 shadow-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Dynamic Title and Status */}
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">
              Vertex<span className="text-purple-600 dark:text-purple-400">Portal</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide animate-pulse">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
