import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const SelectContext = createContext(null);

/**
 * Shadcn-style Select component
 * https://ui.shadcn.com/docs/components/base/select
 */
export function Select({
  value,
  onValueChange,
  children,
  defaultValue = '',
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const activeValue = value !== undefined ? value : internalValue;

  const handleSelect = (val) => {
    if (value === undefined) setInternalValue(val);
    if (onValueChange) onValueChange(val);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ activeValue, onSelect: handleSelect, open, setOpen }}>
      <div className="relative inline-block w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  children,
  className = '',
  disabled = false,
  ...props
}) {
  const { open, setOpen } = useContext(SelectContext);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setOpen(!open)}
      className={`flex h-10 sm:h-11 w-full items-center justify-between rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/40 hover:border-purple-300 dark:hover:border-purple-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-2xs cursor-pointer ${
        open ? 'ring-2 ring-purple-500/40 border-purple-500' : ''
      } ${className}`}
      {...props}
    >
      {children}
      <ChevronDown
        className={`h-4 w-4 text-gray-400 dark:text-slate-500 transition-transform duration-200 ${
          open ? 'rotate-180 text-purple-600' : ''
        }`}
      />
    </button>
  );
}

export function SelectValue({ placeholder = 'Select an option...', children }) {
  const { activeValue } = useContext(SelectContext);
  return (
    <span className="truncate flex-1 text-left">
      {activeValue || children || <span className="text-gray-400 dark:text-slate-500">{placeholder}</span>}
    </span>
  );
}

export function SelectContent({ children, className = '', ...props }) {
  const { open, setOpen } = useContext(SelectContext);
  const contentRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contentRef.current && !contentRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute left-0 right-0 top-full mt-1.5 w-full bg-white dark:bg-[#161928] rounded-2xl border border-gray-200 dark:border-[#2a2f4e] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className = '',
  ...props
}) {
  const { activeValue, onSelect } = useContext(SelectContext);
  const isSelected = String(activeValue) === String(value);

  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-left transition-colors cursor-pointer ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 font-bold'
          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
      } ${className}`}
      {...props}
    >
      <span className="truncate flex-1">{children}</span>
      {isSelected && <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />}
    </button>
  );
}

export default Select;
