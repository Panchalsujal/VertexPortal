import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Shadcn-style Sheet (Side Drawer Modal)
 * https://ui.shadcn.com/docs/components/base/sheet
 */
export function Sheet({
  open = false,
  onOpenChange,
  side = 'right', // 'top' | 'bottom' | 'left' | 'right'
  title,
  description,
  children,
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

  const sideClasses = {
    top: 'top-0 left-0 right-0 max-h-[80vh] border-b rounded-b-3xl animate-in slide-in-from-top duration-300',
    bottom: 'bottom-0 left-0 right-0 max-h-[85vh] border-t rounded-t-3xl animate-in slide-in-from-bottom duration-300',
    left: 'top-0 bottom-0 left-0 w-full max-w-md border-r rounded-r-3xl animate-in slide-in-from-left duration-300',
    right: 'top-0 bottom-0 right-0 w-full max-w-md border-l rounded-l-3xl animate-in slide-in-from-right duration-300',
  }[side];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={() => onOpenChange && onOpenChange(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Sheet Content Panel */}
      <div
        className={`fixed z-50 bg-white dark:bg-[#161928] border-gray-200 dark:border-[#2a2f4e] shadow-2xl p-6 overflow-y-auto flex flex-col justify-between ${sideClasses} ${className}`}
      >
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
              type="button"
              onClick={() => onOpenChange && onOpenChange(false)}
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

export default Sheet;
