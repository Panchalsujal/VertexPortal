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
import { fetchMe, selectUser, logoutUser, clearUser } from '../store/slices/authSlice';

export function useAdminGuard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    // Always re-fetch from server — never trust local state alone
    dispatch(fetchMe())
      .unwrap()
      .then((result) => {
        const serverUser = result?.user || result;
        if (!serverUser || serverUser.role !== 'admin') {
          console.warn('[SECURITY] Admin guard: Server returned non-admin role. Redirecting.');
          dispatch(logoutUser());
          navigate('/login', { replace: true, state: { reason: 'insufficient_permissions' } });
        }
      })
      .catch(() => {
        console.warn('[SECURITY] Admin guard: Server verification failed. Redirecting.');
        dispatch(logoutUser());
        navigate('/login', { replace: true, state: { reason: 'session_expired' } });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Also check the elevated session cookie exists (Layer 2 client-side check)
  useEffect(() => {
    // If we already know the user isn't admin from Redux, redirect immediately
    if (user && user.role !== 'admin') {
      navigate('/login', { replace: true, state: { reason: 'insufficient_permissions' } });
    }
  }, [user, navigate]);
}
