import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

const TooltipContext = createContext({ delayDuration: 200 });

/**
 * Shadcn-style Tooltip components
 * https://ui.shadcn.com/docs/components/base/tooltip
 */
export function TooltipProvider({ delayDuration = 200, children }) {
  return (
    <TooltipContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipContext.Provider>
  );
}

export function Tooltip({ children, delayDuration }) {
  const context = useContext(TooltipContext);
  const delay = delayDuration ?? context.delayDuration;
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(true), delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(false), 100);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { open });
        }
        return child;
      })}
    </div>
  );
}

export function TooltipTrigger({ children, asChild = false, className = '', ...props }) {
  return (
    <div className={`inline-flex items-center cursor-pointer ${className}`} {...props}>
      {children}
    </div>
  );
}

export function TooltipContent({
  children,
  side = 'top', // 'top' | 'bottom' | 'left' | 'right'
  open = false,
  className = '',
  ...props
}) {
  if (!open) return null;

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  return (
    <div
      role="tooltip"
      className={`absolute z-50 overflow-hidden rounded-xl border border-gray-200 dark:border-[#2a2f4e] bg-gray-900 dark:bg-[#161928] px-3 py-1.5 text-xs font-semibold text-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-150 pointer-events-none whitespace-nowrap backdrop-blur-md ${sideClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Tooltip;
