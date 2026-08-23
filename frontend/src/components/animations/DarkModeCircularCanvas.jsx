import { useEffect, useRef } from 'react';

/**
 * Celikk.me Canvas-Powered Circular Ripple Dark Mode Transition
 * Exact implementation of https://celikk.me/blog/darkModeAnimation
 * Draws an expanding circular wave originating from the clicked sun/moon button
 */
export function DarkModeCircularCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleToggleEvent = (e) => {
      const { x, y, isTargetDark } = e.detail;

      // Adjust canvas resolution
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // Target color to draw
      const fillColor = isTargetDark ? '#0d0f1a' : '#f8fafc';

      // Max radius to fully engulf the viewport corners
      const maxRadius = Math.hypot(
        Math.max(x, width - x),
        Math.max(y, height - y)
      );

      let currentRadius = 0;
      const startTime = performance.now();
      const duration = 550; // ms

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Exponential ease-out curve (celikk.me style)
        const ease = 1 - Math.pow(1 - progress, 3);
        currentRadius = ease * maxRadius;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(0, currentRadius), 0, 2 * Math.PI);
        ctx.fill();

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          // Finished engulfing: instantly apply dark class & clear canvas
          if (isTargetDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
          }

          // Small delay before clearing to prevent any sub-frame flicker
          setTimeout(() => {
            if (ctx) ctx.clearRect(0, 0, width, height);
          }, 40);
        }
      };

      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('celikkDarkModeToggle', handleToggleEvent);

    return () => {
      window.removeEventListener('celikkDarkModeToggle', handleToggleEvent);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 99999,
        width: '100vw',
        height: '100vh',
      }}
      aria-hidden="true"
    />
  );
}

export default DarkModeCircularCanvas;
