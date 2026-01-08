import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000; // Show warning 2 minutes before logout

/**
 * Hook to automatically log out users after 30 minutes of inactivity.
 * Inactivity is defined as no mouse movement, clicks, key presses, or scroll events.
 * Only applies to authenticated users.
 */
export const useInactivityTimeout = () => {
  const { user, logout } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    try {
      toast.info('You have been logged out due to inactivity');
      await logout();
      // Redirect to login page
      window.location.href = '/signin';
    } catch (error) {
      console.error('Error during inactivity logout:', error);
    }
  }, [logout]);

  const showWarning = useCallback(() => {
    toast.warning('You will be logged out in 2 minutes due to inactivity. Move your mouse or press a key to stay logged in.', {
      duration: 10000, // Show for 10 seconds
    });
  }, []);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    // Only set timeouts if user is logged in
    if (user) {
      // Set warning timeout (28 minutes)
      warningTimeoutRef.current = setTimeout(() => {
        showWarning();
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

      // Set logout timeout (30 minutes)
      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [user, handleLogout, showWarning]);

  useEffect(() => {
    // Don't set up listeners if user is not logged in
    if (!user) {
      return;
    }

    // Activity events to track
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel'
    ];

    // Throttle the reset to avoid excessive calls
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledReset = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          resetTimer();
          throttleTimer = null;
        }, 1000); // Only reset once per second max
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledReset, { passive: true });
    });

    // Also track visibility changes - if user switches tabs and comes back
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if we've been inactive too long while tab was hidden
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          handleLogout();
        } else {
          resetTimer();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledReset);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [user, resetTimer, handleLogout]);

  return {
    resetTimer,
    lastActivity: lastActivityRef.current
  };
};

export default useInactivityTimeout;
