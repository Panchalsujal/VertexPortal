/**
 * Layer 9: Inactivity Auto-Logout Hook
 * ────────────────────────────────────────
 * Automatically logs out admin/instructor users after IDLE_TIMEOUT_MS of inactivity.
 * Tracks: mousemove, keydown, click, scroll, touchstart events.
 *
 * Usage: Call useInactivityLogout() at the top of admin/instructor page components.
 */
import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { logoutUser } from '../store/slices/authSlice';
import api from '../api/axios';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Show warning 2 minutes before logout
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export function useInactivityLogout({ onWarning } = {}) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const doLogout = useCallback(async () => {
    console.warn('[SECURITY] Inactivity timeout reached — auto-logging out admin/instructor session.');
    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);

    try {
      await dispatch(logoutUser());
    } catch {
      // Proceed even if logout fails
    }

    navigate('/login', {
      replace: true,
      state: { reason: 'inactivity_timeout', message: 'You were logged out due to inactivity.' },
    });
  }, [dispatch, navigate]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);

    // Set warning timer
    warningRef.current = setTimeout(() => {
      if (onWarning) {
        onWarning(WARNING_BEFORE_MS / 1000);
      }
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Set logout timer
    timeoutRef.current = setTimeout(doLogout, IDLE_TIMEOUT_MS);
  }, [doLogout, onWarning]);

  useEffect(() => {
    // Start the timer
    resetTimer();

    // Attach activity listeners
    const handleActivity = () => resetTimer();
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    );

    // Handle browser tab becoming visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= IDLE_TIMEOUT_MS) {
          doLogout();
        } else {
          resetTimer();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [resetTimer, doLogout]);
}
