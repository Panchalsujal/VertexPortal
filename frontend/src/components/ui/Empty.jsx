import React from 'react';
import { Layers } from 'lucide-react';

/**
 * Shadcn-style Empty state component
 * https://ui.shadcn.com/docs/components/base/empty
 */
export function Empty({
  icon: Icon = Layers,
  title = 'No items found',
  description = 'There is no data available to display right now.',
  action = null,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs space-y-4 shadow-2xs ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xs">
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export default Empty;
