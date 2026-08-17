import { createContext, useContext } from 'react';

export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default useTheme;
