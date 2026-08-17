import React, { useState, useRef, useEffect } from 'react';

/**
 * Shadcn-style Popover component
 * https://ui.shadcn.com/docs/components/base/popover
 */
export function Popover({
  trigger,
  children,
  align = 'center', // 'start' | 'center' | 'end'
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

  const alignClasses =
    align === 'start' ? 'left-0' :
    align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2';

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setOpen((prev) => !prev)} className="inline-block cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={`absolute top-full mt-2 w-72 p-4 bg-white dark:bg-[#161928] border border-gray-200 dark:border-[#2a2f4e] rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md ${alignClasses} ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default Popover;
