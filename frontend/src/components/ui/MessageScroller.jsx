import React, { useRef, useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';

/**
 * Shadcn-style MessageScroller component with auto-scroll & scroll to bottom trigger
 * https://ui.shadcn.com/docs/components/base/message-scroller
 */
export function MessageScroller({
  children,
  className = '',
  autoScroll = true,
  ...props
}) {
  const containerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollBottom(!isNearBottom);
    }
  };

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [children, autoScroll]);

  return (
    <div className="relative w-full h-full flex flex-col min-h-0">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar ${className}`}
        {...props}
      >
        {children}
      </div>

      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default MessageScroller;
