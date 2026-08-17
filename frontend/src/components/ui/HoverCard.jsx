import React, { useState, useRef, useEffect } from 'react';

/**
 * Shadcn-style HoverCard component
 * https://ui.shadcn.com/docs/components/base/hover-card
 */
export function HoverCard({
  trigger,
  children,
  openDelay = 200,
  closeDelay = 150,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(true), openDelay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsOpen(false), closeDelay);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="inline-block cursor-pointer">{trigger}</div>

      {isOpen && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 p-4 bg-white dark:bg-[#161928] border border-gray-200 dark:border-[#2a2f4e] rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default HoverCard;
