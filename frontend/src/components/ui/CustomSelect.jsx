import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = '',
  dropdownClassName = '',
  disabled = false,
  size = 'md',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options: can be array of primitives, { value, label }, or { _id, title }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      const val = opt.value !== undefined ? opt.value : (opt._id !== undefined ? opt._id : opt.id);
      const lbl = opt.label !== undefined ? opt.label : (opt.title !== undefined ? opt.title : opt.name || String(val));
      return { value: val, label: lbl, ...opt };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const sizeClasses = size === 'sm'
    ? 'py-1.5 px-3 text-xs rounded-xl'
    : 'py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm rounded-xl';

  return (
    <div ref={containerRef} className="relative w-full min-w-0 max-w-full inline-block select-none">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full min-w-0 max-w-full flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:border-purple-300 dark:hover:border-purple-700 ${sizeClasses} ${
          isOpen ? 'ring-2 ring-purple-500/50 border-purple-500' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <span className="truncate flex-1 min-w-0 text-left">
          {selectedOption ? selectedOption.label : <span className="text-gray-400">{placeholder}</span>}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-purple-600 dark:text-purple-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Container (Strictly bounded to parent width) */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 w-full max-w-full bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl py-1 z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-gray-400 text-center">No options available</div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full min-w-0 max-w-full flex items-center justify-between gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-left transition-colors cursor-pointer truncate ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white font-medium'
                  }`}
                >
                  <span className="truncate flex-1 min-w-0" title={opt.label}>
                    {opt.label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
