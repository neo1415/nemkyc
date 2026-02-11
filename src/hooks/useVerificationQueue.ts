import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface QueueStatus {
  queueId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  position?: number;
  queueSize?: number;
  estimatedWaitTime?: number;
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

interface QueueItem {
  queueId: string;
  type: string;
  status: string;
  position?: number;
  queuedAt: Date;
  startedAt?: Date;
  listId: string;
}

interface QueueStats {
  queueSize: number;
  activeJobs: number;
  maxConcurrent: number;
  maxQueueSize: number;
  isProcessing: boolean;
  utilizationPercent: number;
}

export function useVerificationQueue() {
  const [userQueueItems, setUserQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get status of a specific queue item
   */
  const getQueueStatus = useCallback(async (queueId: string): Promise<QueueStatus | null> => {
    try {
      const response = await axios.get(`/api/identity/queue/status/${queueId}`);
      return response.data;
    } catch (err: any) {
      console.error('Error getting queue status:', err);
      if (err.response?.status === 404) {
        return null; // Queue item not found (may have been cleaned up)
      }
      throw err;
    }
  }, []);

  /**
   * Get all queue items for the current user
   */
  const getUserQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/identity/queue/user');
      setUserQueueItems(response.data.items || []);
      return response.data.items;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to load queue items';
      setError(errorMsg);
      console.error('Error getting user queue:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get queue statistics (admin only)
   */
  const getQueueStats = useCallback(async (): Promise<QueueStats | null> => {
    try {
      const response = await axios.get('/api/identity/queue/stats');
      return response.data;
    } catch (err: any) {
      console.error('Error getting queue stats:', err);
      if (err.response?.status === 403) {
        return null; // Not authorized (not admin)
      }
      throw err;
    }
  }, []);

  /**
   * Poll queue status for a specific item
   */
  const pollQueueStatus = useCallback(
    async (
      queueId: string,
      onUpdate: (status: QueueStatus) => void,
      interval: number = 2000
    ): Promise<() => void> => {
      let isPolling = true;

      const poll = async () => {
        while (isPolling) {
          try {
            const status = await getQueueStatus(queueId);
            
            if (!status) {
              // Queue item not found, stop polling
              isPolling = false;
              break;
            }

            onUpdate(status);

            // Stop polling if completed or failed
            if (status.status === 'completed' || status.status === 'failed') {
              isPolling = false;
              break;
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, interval));
          } catch (err) {
            console.error('Error polling queue status:', err);
            // Continue polling even on error
            await new Promise(resolve => setTimeout(resolve, interval));
          }
        }
      };

      poll();

      // Return cleanup function
      return () => {
        isPolling = false;
      };
    },
    [getQueueStatus]
  );

  /**
   * Auto-refresh user queue items
   */
  useEffect(() => {
    getUserQueue();

    // Refresh every 10 seconds if there are active items
    const interval = setInterval(() => {
      if (userQueueItems.some(item => item.status === 'queued' || item.status === 'processing')) {
        getUserQueue();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return {
    userQueueItems,
    loading,
    error,
    getQueueStatus,
    getUserQueue,
    getQueueStats,
    pollQueueStatus
  };
}
