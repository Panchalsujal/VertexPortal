import React, { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react';
import { SidebarContext, useSidebar } from './useSidebar';

/**
 * Shadcn-style Sidebar component
 * https://ui.shadcn.com/docs/components/base/sidebar
 */
export function SidebarProvider({
  defaultOpen = true,
  children,
  className = '',
}) {
  // Mobile screens (< 1024px) start with sidebar closed by default
  const [open, setOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return false;
    }
    return defaultOpen;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      <div className={`flex min-h-screen w-full ${className}`}>{children}</div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children, className = '' }) {
  const { open } = useSidebar();

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-transform duration-300 w-60 ${
        open ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
      } ${className}`}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ children, className = '' }) {
  return (
    <div className={`flex h-16 items-center px-4 border-b border-gray-100 dark:border-gray-800 shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarContent({ children, className = '' }) {
  return (
    <div className={`flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarFooter({ children, className = '' }) {
  return (
    <div className={`p-3 border-t border-gray-100 dark:border-gray-800 shrink-0 ${className}`}>
      {children}
    </div>
  );
}

export function SidebarTrigger({ className = '', children, onClick }) {
  const { open, toggleSidebar } = useSidebar();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      toggleSidebar();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 ${className}`}
      title={open ? 'Close Sidebar' : 'Open Sidebar'}
    >
      {children || <Menu className="h-5 w-5" />}
    </button>
  );
}

export default Sidebar;
