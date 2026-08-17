import React from 'react';

/**
 * Shadcn-style Switch component
 * https://ui.shadcn.com/docs/components/base/switch
 */
export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className = '',
  id,
  ...props
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? 'bg-purple-600 dark:bg-purple-600'
          : 'bg-gray-200 dark:bg-slate-700'
      } ${className}`}
      {...props}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default Switch;
