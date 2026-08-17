import React from 'react';

/**
 * Shadcn-style ButtonGroup component
 * Supports both segmented container style and connected buttons.
 */
export function ButtonGroup({
  className = '',
  children,
  orientation = 'horizontal',
  ...props
}) {
  return (
    <div
      role="group"
      className={`inline-flex ${
        orientation === 'vertical' ? 'flex-col' : 'flex-row'
      } items-center rounded-2xl p-1 bg-gray-100/90 dark:bg-slate-800/80 border border-gray-200/90 dark:border-slate-700/80 shadow-2xs backdrop-blur-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function ButtonGroupItem({
  active = false,
  className = '',
  children,
  onClick,
  ...props
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
        active
          ? 'bg-white dark:bg-[#161928] text-purple-600 dark:text-purple-400 shadow-sm border border-gray-200/80 dark:border-[#2a2f4e]'
          : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Connected variant where child buttons are seamlessly attached
 */
export function ConnectedButtonGroup({ className = '', children, ...props }) {
  return (
    <div
      role="group"
      className={`inline-flex rounded-2xl shadow-2xs [&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:-ml-[1px] [&>*:not(:last-child)]:rounded-r-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
