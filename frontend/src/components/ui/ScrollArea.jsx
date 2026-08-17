import React from 'react';

/**
 * Shadcn-style ScrollArea component
 * https://ui.shadcn.com/docs/components/base/scroll-area
 */
export function ScrollArea({
  children,
  className = '',
  maxHeight = 'max-h-96',
  ...props
}) {
  return (
    <div
      className={`relative overflow-y-auto overflow-x-hidden custom-scrollbar ${maxHeight} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default ScrollArea;
