/**
 * Layer 7: Instructor Guard Hook
 * ────────────────────────────────
 * Performs a live server-side role verification on every instructor page mount.
 * If the user's role is not 'instructor' or 'admin' per the SERVER,
 * immediately redirects to /login.
 *
 * This prevents Redux state tampering via browser DevTools.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchMe, selectUser, logoutUser } from '../store/slices/authSlice';

const ALLOWED_ROLES = ['instructor', 'admin'];

export function useInstructorGuard() {
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
        if (!serverUser || !ALLOWED_ROLES.includes(serverUser.role)) {
          console.warn('[SECURITY] Instructor guard: Server returned non-instructor role. Redirecting.');
          dispatch(logoutUser());
          navigate('/login', { replace: true, state: { reason: 'insufficient_permissions' } });
        }
      })
      .catch(() => {
        console.warn('[SECURITY] Instructor guard: Server verification failed. Redirecting.');
        dispatch(logoutUser());
        navigate('/login', { replace: true, state: { reason: 'session_expired' } });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Also check Redux state as a fast client-side pre-check
  useEffect(() => {
    if (user && !ALLOWED_ROLES.includes(user.role)) {
      navigate('/login', { replace: true, state: { reason: 'insufficient_permissions' } });
    }
  }, [user, navigate]);
}
