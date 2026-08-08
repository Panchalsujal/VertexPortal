// Backward-compatibility shim — AuthContext is replaced by Redux authSlice.
// All imports of useAuth from this path continue to work unchanged.
export { useAuth } from '../store/slices/authSlice';

// AuthProvider is no longer needed (Provider is in main.jsx) but kept as
// a no-op so any existing JSX that wraps <AuthProvider> still compiles.
export function AuthProvider({ children }) {
  return children;
}
