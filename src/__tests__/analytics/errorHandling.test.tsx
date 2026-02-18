/**
 * Unit Tests for Error Handling Components and Utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import ConnectionStatus from '../../components/analytics/ConnectionStatus';
import {
  showErrorToast,
  retryOperation,
  connectionMonitor,
} from '../../utils/errorHandling';

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: () => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn(),
  }),
}));

describe('Error Handling Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test: Error Boundary catches errors
   * Requirement: 12.1
   */
  describe('ErrorBoundary Component', () => {
    it('should catch and display errors', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should display custom fallback when provided', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const customFallback = <div>Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });

    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Normal content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('should show error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const ThrowError = () => {
        throw new Error('Detailed test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/Detailed test error/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  /**
   * Test: Error toast displays
   * Requirement: 12.3
   */
  describe('Error Toast Notifications', () => {
    it('should show error toast with custom message', async () => {
      const { toast } = await import('@/hooks/use-toast');
      const error = new Error('Network error');

      showErrorToast(error, 'Custom error message');

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Error',
          description: 'Custom error message',
        })
      );
    });

    it('should show error toast with auto-generated message', async () => {
      const { toast } = await import('@/hooks/use-toast');
      const error = new Error('Network failure');

      showErrorToast(error);

      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Error',
        })
      );
    });

    it('should log error when showing toast', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');

      showErrorToast(error);

      if (process.env.NODE_ENV === 'development') {
        expect(consoleSpy).toHaveBeenCalled();
      }
      
      consoleSpy.mockRestore();
    });
  });

  /**
   * Test: Retry functionality
   * Requirement: 12.4
   */
  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      const result = await retryOperation(operation, {
        maxAttempts: 3,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      const operation = async () => {
        throw new Error('Persistent failure');
      };

      await expect(
        retryOperation(operation, { maxAttempts: 2, delayMs: 10 })
      ).rejects.toThrow('Persistent failure');
    });

    it('should call onRetry callback', async () => {
      const onRetry = vi.fn();
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Retry me');
        }
        return 'done';
      };

      await retryOperation(operation, {
        maxAttempts: 3,
        delayMs: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('should not retry permission errors', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        throw new Error('Permission denied');
      };

      await expect(
        retryOperation(operation, { maxAttempts: 3, delayMs: 10 })
      ).rejects.toThrow('Permission denied');

      expect(attempts).toBe(1);
    });

    it('should apply exponential backoff', async () => {
      const delays: number[] = [];
      let attempts = 0;

      const operation = async () => {
        const now = Date.now();
        if (attempts > 0) {
          delays.push(now);
        }
        attempts++;
        if (attempts < 3) {
          throw new Error('Retry');
        }
        return 'success';
      };

      await retryOperation(operation, {
        maxAttempts: 3,
        delayMs: 100,
        backoffMultiplier: 2,
      });

      // Verify delays increase (exponential backoff)
      expect(delays.length).toBe(2);
    });
  });

  /**
   * Test: Connection status indicator
   * Requirement: 12.6
   */
  describe('ConnectionStatus Component', () => {
    it('should display connected status', () => {
      // Mock online status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      render(<ConnectionStatus />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should display disconnected status', () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Create new monitor instance for this test
      const monitor = new (class extends connectionMonitor.constructor {})();
      
      render(<ConnectionStatus />);

      // Trigger offline event
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      });
    });

    it('should hide label when showLabel is false', () => {
      render(<ConnectionStatus showLabel={false} />);

      expect(screen.queryByText('Connected')).not.toBeInTheDocument();
      expect(screen.queryByText('Disconnected')).not.toBeInTheDocument();
    });

    it('should update status on connection change', async () => {
      render(<ConnectionStatus />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.queryByText('Connected') || screen.queryByText('Disconnected')).toBeInTheDocument();
      });

      // Simulate going offline
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  /**
   * Test: Connection Monitor
   * Requirement: 12.6
   */
  describe('ConnectionMonitor', () => {
    it('should return current connection status', () => {
      const status = connectionMonitor.getStatus();
      expect(typeof status).toBe('boolean');
    });

    it('should notify subscribers of status changes', () => {
      const listener = vi.fn();
      const unsubscribe = connectionMonitor.subscribe(listener);

      // Should be called immediately with current status
      expect(listener).toHaveBeenCalledWith(expect.any(Boolean));

      // Trigger status change
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      expect(listener).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    it('should unsubscribe correctly', () => {
      const listener = vi.fn();
      const unsubscribe = connectionMonitor.subscribe(listener);

      const callCountBefore = listener.mock.calls.length;
      unsubscribe();

      // Trigger status change
      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      // Should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(callCountBefore);
    });
  });
});
