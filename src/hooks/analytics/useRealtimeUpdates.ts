import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/constants';

/**
 * Hook for managing real-time updates via polling
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 * 
 * This hook polls the backend for updates at a configurable interval
 * and provides connection status tracking.
 */
export function useRealtimeUpdates(
  refreshInterval: number = 30000, // 30 seconds default
  onUpdate?: () => void,
  pauseWhenInteracting: boolean = true
) {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connected, setConnected] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user interaction to pause updates
  useEffect(() => {
    if (!pauseWhenInteracting) return;

    const handleInteraction = () => {
      // Pause updates during interaction
      setIsPaused(true);

      // Clear existing timeout
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }

      // Resume updates after 2 seconds of no interaction
      interactionTimeoutRef.current = setTimeout(() => {
        setIsPaused(false);
      }, 2000);
    };

    // Listen for user interactions
    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, [pauseWhenInteracting]);

  // Set up polling interval
  useEffect(() => {
    const poll = async () => {
      // Skip if paused
      if (isPaused) {
        return;
      }

      try {
        // Test connection with a lightweight endpoint
        const response = await fetch(`${API_BASE_URL}/api/analytics/overview`, {
          method: 'HEAD',
          credentials: 'include'
        });

        if (response.ok) {
          setConnected(true);
          setLastUpdate(new Date());
          
          // Trigger update callback
          if (onUpdate) {
            onUpdate();
          }
        } else {
          setConnected(false);
        }
      } catch (error) {
        console.error('Real-time update poll failed:', error);
        setConnected(false);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, onUpdate, isPaused]);

  // Manual refresh function
  const refresh = () => {
    setLastUpdate(new Date());
    if (onUpdate) {
      onUpdate();
    }
  };

  return {
    connected,
    lastUpdate,
    isPaused,
    refresh
  };
}
