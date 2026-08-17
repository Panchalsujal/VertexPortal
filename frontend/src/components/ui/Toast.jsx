import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toaster as HotToaster } from 'react-hot-toast';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

/**
 * Shadcn-style Toaster configuration wrapper
 * https://ui.shadcn.com/docs/components/base/toast
 */
export function Toaster(props) {
  return (
    <HotToaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        className: '!bg-white dark:!bg-[#161928] !text-gray-900 dark:!text-white !border !border-gray-200 dark:!border-[#2a2f4e] !rounded-2xl !shadow-2xl !py-3 !px-4 !text-xs sm:!text-sm !font-semibold !backdrop-blur-md',
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
          className: '!bg-white dark:!bg-[#161928] !text-gray-900 dark:!text-white !border !border-emerald-500/40 dark:!border-emerald-500/30 !rounded-2xl !shadow-2xl !py-3 !px-4 !text-xs sm:!text-sm !font-semibold',
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
          className: '!bg-white dark:!bg-[#161928] !text-gray-900 dark:!text-white !border !border-rose-500/40 dark:!border-rose-500/30 !rounded-2xl !shadow-2xl !py-3 !px-4 !text-xs sm:!text-sm !font-semibold',
        },
        loading: {
          iconTheme: {
            primary: '#8b5cf6',
            secondary: '#ffffff',
          },
          className: '!bg-white dark:!bg-[#161928] !text-gray-900 dark:!text-white !border !border-purple-500/40 dark:!border-purple-500/30 !rounded-2xl !shadow-2xl !py-3 !px-4 !text-xs sm:!text-sm !font-semibold',
        },
      }}
      {...props}
    />
  );
}

/**
 * Custom Shadcn-style Toast Provider & useToast Hook
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 4000, action }) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, title, description, variant, action };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast Viewport Container */}
      <div
        tabIndex={-1}
        className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onDismiss }) {
  const { title, description, variant = 'default', action } = toast;

  const variantStyles = {
    default: 'bg-white dark:bg-[#161928] border-gray-200 dark:border-[#2a2f4e] text-gray-900 dark:text-white',
    destructive: 'bg-rose-500 border-rose-600 text-white',
    success: 'bg-emerald-600 border-emerald-700 text-white',
    warning: 'bg-amber-500 border-amber-600 text-white',
  }[variant] || 'bg-white dark:bg-[#161928] border-gray-200 dark:border-[#2a2f4e] text-gray-900 dark:text-white';

  const Icon =
    variant === 'destructive' ? AlertCircle :
    variant === 'success' ? CheckCircle2 :
    variant === 'warning' ? AlertTriangle :
    Info;

  return (
    <div
      role="status"
      className={`pointer-events-auto relative flex w-full items-start justify-between space-x-3 overflow-hidden rounded-2xl border p-4 shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 backdrop-blur-md ${variantStyles}`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-90" />
      <div className="grid gap-1 flex-1 min-w-0">
        {title && <h5 className="text-xs sm:text-sm font-bold leading-none">{title}</h5>}
        {description && (
          <p className="text-xs opacity-90 leading-relaxed break-words">{description}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}

      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 text-inherit opacity-60 hover:opacity-100 transition focus:outline-none cursor-pointer shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default Toaster;
