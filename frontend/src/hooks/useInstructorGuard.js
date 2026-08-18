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
import { selectUser, logoutUser, setUser } from '../store/slices/authSlice';
import { getMe } from '../api/auth.api';

const ALLOWED_ROLES = ['instructor', 'admin'];
let lastInstructorVerifiedAt = 0;

export function useInstructorGuard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isVerifying = useRef(false);

  useEffect(() => {
    const now = Date.now();
    // Skip if verified in the last 60 seconds
    if (now - lastInstructorVerifiedAt < 60000 || isVerifying.current) {
      return;
    }
    isVerifying.current = true;

    // Silent background verification with the server
    getMe()
      .then((res) => {
        const serverUser = res.data?.data?.user || res.data?.user;
        if (!serverUser || !ALLOWED_ROLES.includes(serverUser.role)) {
          console.warn('[SECURITY] Instructor guard: Server returned non-instructor role. Redirecting.');
          dispatch(logoutUser());
          navigate('/login', { replace: true, state: { reason: 'insufficient_permissions' } });
        } else {
          lastInstructorVerifiedAt = Date.now();
          dispatch(setUser(serverUser));
        }
      })
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.warn('[SECURITY] Instructor guard: Server verification failed. Redirecting.');
          dispatch(logoutUser());
          navigate('/login', { replace: true, state: { reason: 'session_expired' } });
        }
      })
      .finally(() => {
        isVerifying.current = false;
      });
  }, [dispatch, navigate]);

  // Also check Redux state as a fast client-side pre-check
  useEffect(() => {
    if (user && !ALLOWED_ROLES.includes(user.role)) {
      navigate('/login', { replace: true, state: { reason: 'insufficient_permissions' } });
    }
  }, [user, navigate]);
}
