import React, { useState, useRef, useEffect } from 'react';

/**
 * Shadcn-style DropdownMenu component with seamless Hover & Click support
 * https://ui.shadcn.com/docs/components/base/dropdown-menu
 */
export function DropdownMenu({
  trigger,
  children,
  align = 'end',
  className = '',
  hoverable = true,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Close when clicking outside
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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (!hoverable) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (!hoverable) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  const handleClick = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen((prev) => !prev);
  };

  const alignClasses = align === 'start' ? 'left-0' : 'right-0';

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block text-left"
    >
      <div onClick={handleClick} className="inline-block cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className={`absolute top-full mt-1 min-w-[12rem] p-1.5 bg-white dark:bg-[#161928] border border-gray-200 dark:border-[#2a2f4e] rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 ${alignClasses} ${className}`}
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
          : 'text-gray-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-400'
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
