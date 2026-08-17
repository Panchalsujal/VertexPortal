import React, { createContext, useContext, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const SidebarContext = createContext({
  open: true,
  setOpen: () => {},
  toggleSidebar: () => {},
});

/**
 * Shadcn-style Sidebar component
 * https://ui.shadcn.com/docs/components/base/sidebar
 */
export function SidebarProvider({
  defaultOpen = true,
  children,
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen);

  const toggleSidebar = () => setOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      <div className={`flex min-h-screen w-full ${className}`}>{children}</div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function Sidebar({ children, className = '' }) {
  const { open } = useSidebar();

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 ${
        open ? 'w-60 translate-x-0' : 'w-16 -translate-x-full lg:translate-x-0'
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

export function SidebarTrigger({ className = '', children }) {
  const { open, toggleSidebar } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      className={`p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0 ${className}`}
      title={open ? 'Collapse Sidebar' : 'Expand Sidebar'}
    >
      {children || (open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />)}
    </button>
  );
}

export default Sidebar;
