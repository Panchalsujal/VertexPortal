import React, { useEffect, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { ThemeContext, useTheme } from './useTheme';

export { useTheme };

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      console.error('Theme synchronization error:', e);
    }
  }, [isDark]);

  // Sync theme changes across browser tabs/windows
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'theme') {
        const nextDark = e.newValue === 'dark';
        setIsDark(nextDark);
        if (nextDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  /**
   * Buttery-Smooth Real-Time Circular Theme Reveal
   * Uses hardware View Transitions + Quintic Ease-Out clipPath
   */
  const toggleTheme = useCallback((event) => {
    const willBeDark = !isDark;
    const root = document.documentElement;

    // Fallback for browsers without View Transitions API or reduced motion
    if (
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsDark(willBeDark);
      if (willBeDark) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return;
    }

    // Get origin coordinates from click event or button center
    let x = event?.clientX;
    let y = event?.clientY;

    if (x === undefined || y === undefined || (x === 0 && y === 0)) {
      if (event?.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else {
        x = window.innerWidth - 80;
        y = 36;
      }
    }

    // Calculate maximum radius to completely cover all viewport corners
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Run View Transition with synchronous DOM update
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setIsDark(willBeDark);
        if (willBeDark) {
          root.classList.add('dark');
          localStorage.setItem('theme', 'dark');
        } else {
          root.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 520,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  }, [isDark]);

  const setTheme = useCallback((theme) => {
    const willBeDark = theme === 'dark';
    const root = document.documentElement;
    setIsDark(willBeDark);
    if (willBeDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
