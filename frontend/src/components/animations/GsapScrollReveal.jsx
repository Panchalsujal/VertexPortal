import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * GSAP Scroll & Entrance Reveal Wrapper
 * Uses GSAP timelines for smooth, staggered spring entrances
 */
export function GsapStagger({
  children,
  stagger = 0.12,
  duration = 0.8,
  yOffset = 30,
  className = '',
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const items = el.children;
    if (!items || items.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        {
          opacity: 0,
          y: yOffset,
          scale: 0.96,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: duration,
          stagger: stagger,
          ease: 'power3.out',
          clearProps: 'transform,scale',
        }
      );
    }, el);

    return () => ctx.revert();
  }, [stagger, duration, yOffset]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

/**
 * GSAP Animated Counter for Statistics
 */
export function GsapCounter({ value = 0, suffix = '', duration = 2, className = '' }) {
  const countRef = useRef(null);

  useEffect(() => {
    const el = countRef.current;
    if (!el) return;

    const targetVal = typeof value === 'number' ? value : parseInt(value, 10) || 0;
    const obj = { val: 0 };

    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: targetVal,
        duration: duration,
        ease: 'power2.out',
        onUpdate: () => {
          if (el) {
            el.textContent = Math.floor(obj.val).toLocaleString() + suffix;
          }
        },
      });
    }, el);

    return () => ctx.revert();
  }, [value, suffix, duration]);

  return (
    <span ref={countRef} className={className}>
      {value + suffix}
    </span>
  );
}

export default GsapStagger;
