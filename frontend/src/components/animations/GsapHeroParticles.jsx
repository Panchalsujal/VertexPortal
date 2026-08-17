import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Optimized GSAP Floating Particle Engine
 * Uses deferred initiation and transform-only animations without DOM layout thrashing
 */
export function GsapHeroParticles({ className = '', count = 16 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ctx = null;
    let timerId = null;

    const initAnimation = () => {
      // Color palette matching VertexPortal brand
      const colors = [
        '#8b5cf6', // Violet
        '#6366f1', // Indigo
        '#38bdf8', // Cyan
        '#a855f7', // Purple
        '#cdf861', // Neon Lime
        '#ec4899', // Pink
      ];

      ctx = gsap.context(() => {
        container.innerHTML = '';

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || 500;
        const particleElements = [];

        for (let i = 0; i < count; i++) {
          const particle = document.createElement('div');
          particle.className = 'pointer-events-none absolute rounded-full';

          const size = Math.floor(Math.random() * 5) + 3; // 3px to 7px
          const color = colors[i % colors.length];
          const posX = Math.random() * width;
          const posY = Math.random() * height;
          const opacity = Math.random() * 0.4 + 0.3;

          particle.style.width = `${size}px`;
          particle.style.height = `${size}px`;
          particle.style.left = `${posX}px`;
          particle.style.top = `${posY}px`;
          particle.style.backgroundColor = color;
          particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
          particle.style.opacity = `${opacity}`;
          particle.style.willChange = 'transform';

          container.appendChild(particle);
          particleElements.push(particle);
        }

        // Smooth sinusoidal GSAP floating
        particleElements.forEach((particle) => {
          const distanceX = (Math.random() * 40 + 20) * (Math.random() > 0.5 ? 1 : -1);
          const distanceY = (Math.random() * 40 + 20) * (Math.random() > 0.5 ? 1 : -1);
          const duration = Math.random() * 4 + 4;

          gsap.to(particle, {
            x: `+=${distanceX}`,
            y: `+=${distanceY}`,
            duration: duration,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: Math.random() * 1.5,
          });
        });
      }, container);
    };

    // Defer initialization so particles don't block critical path (FCP / LCP)
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        timerId = window.requestIdleCallback(initAnimation, { timeout: 1500 });
      } else {
        timerId = setTimeout(initAnimation, 200);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        if ('cancelIdleCallback' in window && typeof timerId === 'number') {
          window.cancelIdleCallback(timerId);
        } else {
          clearTimeout(timerId);
        }
      }
      if (ctx) ctx.revert();
    };
  }, [count]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

export default GsapHeroParticles;
