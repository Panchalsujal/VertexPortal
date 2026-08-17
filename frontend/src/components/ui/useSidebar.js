import { createContext, useContext } from 'react';

export const SidebarContext = createContext({
  open: false,
  setOpen: () => {},
  toggleSidebar: () => {},
});

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export default useSidebar;
