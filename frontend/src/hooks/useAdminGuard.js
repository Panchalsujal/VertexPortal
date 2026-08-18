/**
 * Layer 7: Admin Guard Hook
 * ─────────────────────────
 * Performs a live server-side role verification on every admin page mount.
 * If the user's role is not 'admin' according to the SERVER (not just Redux state),
 * immediately redirects to /login.
 *
 * This prevents Redux state tampering via browser DevTools.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUser, logoutUser, setUser } from '../store/slices/authSlice';
import { getMe } from '../api/auth.api';

// Cache verification for 60 seconds to avoid repeating on fast navigations
let lastAdminVerifiedAt = 0;

export function useAdminGuard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isVerifying = useRef(false);

  useEffect(() => {
    const now = Date.now();
    // Skip if verified in the last 60 seconds
    if (now - lastAdminVerifiedAt < 60000 || isVerifying.current) {
      return;
    }
    isVerifying.current = true;

    // Silent background verification with the server
    getMe()
      .then((res) => {
        const serverUser = res.data?.data?.user || res.data?.user;
        if (!serverUser || serverUser.role !== 'admin') {
          console.warn('[SECURITY] Admin guard: Server returned non-admin role. Redirecting.');
          dispatch(logoutUser());
          navigate('/login', { replace: true, state: { reason: 'insufficient_permissions' } });
        } else {
          lastAdminVerifiedAt = Date.now();
          dispatch(setUser(serverUser));
        }
      })
      .catch((err) => {
        // Only redirect if unauthorized/forbidden, not on temporary network hiccup
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.warn('[SECURITY] Admin guard: Server verification failed. Redirecting.');
          dispatch(logoutUser());
          navigate('/login', { replace: true, state: { reason: 'session_expired' } });
        }
      })
      .finally(() => {
        isVerifying.current = false;
      });
  }, [dispatch, navigate]);
}
