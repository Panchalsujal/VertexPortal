import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, GripHorizontal } from 'lucide-react';

/**
 * Shadcn-style Resizable panel container
 * https://ui.shadcn.com/docs/components/base/resizable
 */
export function ResizablePanelGroup({
  children,
  direction = 'horizontal', // 'horizontal' | 'vertical'
  className = '',
}) {
  return (
    <div
      className={`flex ${
        direction === 'vertical' ? 'flex-col' : 'flex-row'
      } h-full w-full overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function ResizablePanel({
  children,
  defaultSize = 50,
  minSize = 20,
  maxSize = 80,
  className = '',
}) {
  return (
    <div
      style={{ flex: `0 0 ${defaultSize}%` }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function ResizableHandle({
  direction = 'horizontal',
  className = '',
}) {
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={`relative flex items-center justify-center bg-gray-200 dark:bg-slate-800 hover:bg-purple-500/50 transition-colors cursor-col-resize select-none ${
        isHorizontal ? 'w-1.5 h-full' : 'h-1.5 w-full cursor-row-resize'
      } ${className}`}
    >
      <div className="z-10 flex items-center justify-center w-4 h-6 rounded bg-gray-300 dark:bg-slate-700 text-gray-500 shadow-2xs">
        {isHorizontal ? <GripVertical className="w-3 h-3" /> : <GripHorizontal className="w-3 h-3" />}
      </div>
    </div>
  );
}

export default ResizablePanelGroup;
