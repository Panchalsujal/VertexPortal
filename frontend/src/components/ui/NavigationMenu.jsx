import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Shadcn-style NavigationMenu component
 * https://ui.shadcn.com/docs/components/base/navigation-menu
 */
export function NavigationMenu({ children, className = '' }) {
  return (
    <nav className={`relative z-10 flex max-w-max flex-1 items-center justify-center ${className}`}>
      <ul className="group flex flex-1 list-none items-center justify-center space-x-1">
        {children}
      </ul>
    </nav>
  );
}

export function NavigationMenuItem({ trigger, children, className = '' }) {
  const [open, setOpen] = useState(false);
  const itemRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (itemRef.current && !itemRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <li
      ref={itemRef}
      className={`relative ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group inline-flex h-9 w-max items-center justify-center rounded-xl bg-transparent px-3 py-2 text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-200 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400 focus:outline-none cursor-pointer"
      >
        <span>{trigger}</span>
        <ChevronDown
          className={`relative top-[1px] ml-1 h-3.5 w-3.5 transition duration-200 ${
            open ? 'rotate-180 text-purple-600' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-64 md:w-80 rounded-2xl border border-gray-200 dark:border-[#2a2f4e] bg-white dark:bg-[#161928] p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          {children}
        </div>
      )}
    </li>
  );
}

export default NavigationMenu;
