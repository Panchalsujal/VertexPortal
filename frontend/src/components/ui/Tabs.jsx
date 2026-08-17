import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext(null);

/**
 * Shadcn-style Tabs component
 * http://ui.shadcn.com/docs/components/base/tabs
 */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className = '',
  ...props
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const activeValue = value !== undefined ? value : internalValue;

  const handleSelect = (val) => {
    if (value === undefined) setInternalValue(val);
    if (onValueChange) onValueChange(val);
  };

  return (
    <TabsContext.Provider value={{ activeValue, onSelect: handleSelect }}>
      <div className={`w-full space-y-4 ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children, ...props }) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800/80 p-1 text-gray-600 dark:text-slate-400 border border-gray-200/80 dark:border-slate-700/80 shadow-2xs backdrop-blur-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const { activeValue, onSelect } = useContext(TabsContext);
  const isSelected = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      disabled={disabled}
      aria-selected={isSelected}
      onClick={() => onSelect(value)}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 ${
        isSelected
          ? 'bg-white dark:bg-[#161928] text-purple-600 dark:text-purple-400 shadow-sm border border-gray-200/80 dark:border-[#2a2f4e]'
          : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/50'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className = '',
  ...props
}) {
  const { activeValue } = useContext(TabsContext);
  if (activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      tabIndex={0}
      className={`animate-in fade-in-50 duration-200 focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Tabs;
