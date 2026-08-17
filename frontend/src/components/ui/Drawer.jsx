import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Shadcn-style Drawer component
 * https://ui.shadcn.com/docs/components/base/drawer
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  position = 'bottom', // 'bottom' | 'right'
  className = '',
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const isBottom = position === 'bottom';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div
        className={`relative z-10 bg-white dark:bg-[#161928] border-gray-200 dark:border-[#2a2f4e] shadow-2xl p-6 overflow-y-auto flex flex-col justify-between ${
          isBottom
            ? 'w-full max-h-[85vh] rounded-t-3xl border-t bottom-0 self-end animate-in slide-in-from-bottom duration-300'
            : 'w-full max-w-md h-full rounded-l-3xl border-l animate-in slide-in-from-right duration-300'
        } ${className}`}
      >
        {isBottom && (
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-slate-700 rounded-full mx-auto mb-4 shrink-0" />
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              {title && (
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Drawer;
