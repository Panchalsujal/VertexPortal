import React from 'react';

/**
 * Shadcn-style Table components
 * https://ui.shadcn.com/docs/components/base/table
 */
export function Table({ className = '', children, ...props }) {
  return (
    <div className="relative w-full overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
      <table className={`w-full caption-bottom text-xs sm:text-sm text-left ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className = '', children, ...props }) {
  return (
    <thead className={`border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-800/50 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...props }) {
  return (
    <tbody className={`divide-y divide-gray-100 dark:divide-slate-800/80 [&_tr:last-child]:border-0 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableFooter({ className = '', children, ...props }) {
  return (
    <tfoot className={`border-t border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 font-medium ${className}`} {...props}>
      {children}
    </tfoot>
  );
}

export function TableRow({ className = '', children, ...props }) {
  return (
    <tr className={`transition-colors hover:bg-gray-50/60 dark:hover:bg-slate-800/40 data-[state=selected]:bg-purple-50 dark:data-[state=selected]:bg-purple-950/40 ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className = '', children, ...props }) {
  return (
    <th className={`h-10 sm:h-12 px-4 text-left align-middle font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className = '', children, ...props }) {
  return (
    <td className={`p-4 align-middle text-gray-800 dark:text-slate-200 [&:has([role=checkbox])]:pr-0 ${className}`} {...props}>
      {children}
    </td>
  );
}

export function TableCaption({ className = '', children, ...props }) {
  return (
    <caption className={`mt-4 text-xs text-gray-500 dark:text-slate-400 ${className}`} {...props}>
      {children}
    </caption>
  );
}

export default Table;
