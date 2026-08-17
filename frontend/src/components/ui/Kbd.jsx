import React from 'react';

/**
 * Shadcn-style Kbd component for keyboard shortcuts
 * https://ui.shadcn.com/docs/components/base/kbd
 */
export function Kbd({ children, className = '', ...props }) {
  return (
    <kbd
      className={`pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border border-gray-200 dark:border-slate-800 bg-gray-100 dark:bg-slate-800/80 px-1.5 font-mono text-[10px] font-bold text-gray-600 dark:text-slate-400 shadow-2xs ${className}`}
      {...props}
    >
      {children}
    </kbd>
  );
}

export default Kbd;
