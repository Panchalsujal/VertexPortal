import React, { useState, useRef, useEffect } from 'react';

/**
 * Shadcn-style DropdownMenu component
 * https://ui.shadcn.com/docs/components/base/dropdown-menu
 */
export function DropdownMenu({
  trigger,
  children,
  align = 'end',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  const alignClasses = align === 'start' ? 'left-0' : 'right-0';

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div onClick={() => setOpen((prev) => !prev)} className="inline-block cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className={`absolute top-full mt-1.5 min-w-[12rem] p-1.5 bg-white dark:bg-[#161928] border border-gray-200 dark:border-[#2a2f4e] rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md ${alignClasses} ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  destructive = false,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl text-left transition-colors cursor-pointer ${
        destructive
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50'
          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className = '' }) {
  return <div className={`my-1 h-px bg-gray-100 dark:bg-slate-800 ${className}`} />;
}

export default DropdownMenu;
