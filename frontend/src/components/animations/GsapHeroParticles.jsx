import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * GSAP Floating Particle Engine (Inspired by https://gsap-particle-animation.webflow.io/)
 * Creates smooth, floating neon particles with sinusoidal GSAP motion
 */
export function GsapHeroParticles({ className = '', count = 45 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Color palette matching VertexPortal brand + Webflow reference
    const colors = [
      '#8b5cf6', // Violet
      '#6366f1', // Indigo
      '#38bdf8', // Cyan
      '#a855f7', // Purple
      '#cdf861', // Reference Neon Lime
      '#ec4899', // Pink
    ];

    const ctx = gsap.context(() => {
      // Clear any previous particles
      container.innerHTML = '';

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || 600;

      const particleElements = [];

      for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'gsap-particle pointer-events-none absolute rounded-full';

        const size = Math.floor(Math.random() * 6) + 3; // 3px to 8px
        const color = colors[i % colors.length];
        const posX = Math.random() * width;
        const posY = Math.random() * height;
        const opacity = Math.random() * 0.5 + 0.35; // 0.35 to 0.85

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}66`;
        particle.style.opacity = `${opacity}`;
        particle.style.filter = 'blur(0.4px)';
        particle.style.willChange = 'transform, opacity';

        container.appendChild(particle);
        particleElements.push(particle);
      }

      // GSAP Animation Loop for each particle (Webflow reference algorithm)
      particleElements.forEach((particle) => {
        const distanceX = (Math.random() * 60 + 30) * (Math.random() > 0.5 ? 1 : -1);
        const distanceY = (Math.random() * 60 + 30) * (Math.random() > 0.5 ? 1 : -1);
        const duration = Math.random() * 4 + 3.5; // 3.5s to 7.5s
        const scaleTo = Math.random() * 0.8 + 0.7; // 0.7 to 1.5

        gsap.to(particle, {
          x: `+=${distanceX}`,
          y: `+=${distanceY}`,
          scale: scaleTo,
          opacity: `+=${(Math.random() - 0.5) * 0.3}`,
          duration: duration,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 2,
        });
      });

      // Mouse interactive deflection
      const handleMouseMove = (e) => {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        particleElements.forEach((p) => {
          const pRect = p.getBoundingClientRect();
          const pX = pRect.left + pRect.width / 2 - rect.left;
          const pY = pRect.top + pRect.height / 2 - rect.top;

          const dx = mouseX - pX;
          const dy = mouseY - pY;
          const dist = Math.hypot(dx, dy);

          if (dist < 120) {
            const force = (120 - dist) / 120;
            gsap.to(p, {
              x: `-=${(dx / dist) * force * 25}`,
              y: `-=${(dy / dist) * force * 25}`,
              duration: 0.6,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          }
        });
      };

      window.addEventListener('mousemove', handleMouseMove, { passive: true });

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }, container);

    return () => ctx.revert();
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
