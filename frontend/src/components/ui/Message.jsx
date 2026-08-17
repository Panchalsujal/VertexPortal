import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

const VARIANTS = {
  info: {
    container: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    container: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    container: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    container: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200',
    icon: AlertCircle,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
};

/**
 * Shadcn-style Message / Callout component
 * https://ui.shadcn.com/docs/components/base/message
 */
export function Message({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) {
  const currentVariant = VARIANTS[variant] || VARIANTS.info;
  const Icon = currentVariant.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xs text-xs sm:text-sm shadow-2xs ${currentVariant.container} ${className}`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${currentVariant.iconColor}`} />
      <div className="flex-1 min-w-0 space-y-1">
        {title && <h5 className="font-bold leading-tight">{title}</h5>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Message;
