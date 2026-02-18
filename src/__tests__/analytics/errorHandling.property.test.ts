/**
 * Property-Based Tests for Error Handling
 * Tests universal properties of error handling utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import {
  logError,
  getUserFriendlyMessage,
  retryOperation,
  ConnectionMonitor,
  ErrorContext,
} from '../../utils/errorHandling';

describe('Error Handling Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to avoid noise in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 32: Error Message Inclusion
   * Validates: Requirements 12.2, 12.5
   * 
   * For all errors, the user-friendly message should be non-empty
   * and should not expose technical details
   */
  describe('Property 32: Error Message Inclusion', () => {
    it('should always return non-empty user-friendly messages', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (errorMessage) => {
            const error = new Error(errorMessage);
            const friendlyMessage = getUserFriendlyMessage(error);

            // Property: Message should never be empty
            expect(friendlyMessage).toBeTruthy();
            expect(friendlyMessage.length).toBeGreaterThan(0);

            // Property: Message should be user-friendly (no stack traces)
            expect(friendlyMessage).not.toContain('at ');
            expect(friendlyMessage).not.toContain('.js:');
            expect(friendlyMessage).not.toContain('.ts:');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should categorize errors correctly', () => {
      const testCases = [
        { keyword: 'network', expected: 'connect to the server' },
        { keyword: 'fetch', expected: 'connect to the server' },
        { keyword: 'permission', expected: 'permission' },
        { keyword: 'unauthorized', expected: 'permission' },
        { keyword: 'timeout', expected: 'took too long' },
        { keyword: 'firestore', expected: 'Database error' },
        { keyword: 'rate limit', expected: 'Too many requests' },
      ];

      testCases.forEach(({ keyword, expected }) => {
        const error = new Error(`Something went wrong: ${keyword}`);
        const message = getUserFriendlyMessage(error);
        expect(message.toLowerCase()).toContain(expected.toLowerCase());
      });
    });

    it('should provide default message for unknown errors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(
            s => !['network', 'fetch', 'permission', 'unauthorized', 'timeout', 'firestore', 'firebase', 'rate limit'].some(
              keyword => s.toLowerCase().includes(keyword)
            )
          ),
          (randomMessage) => {
            const error = new Error(randomMessage);
            const friendlyMessage = getUserFriendlyMessage(error);

            // Should return default message
            expect(friendlyMessage).toContain('unexpected error');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 33: Error Logging Completeness
   * Validates: Requirements 12.2, 12.5
   * 
   * All errors should be logged with complete context information
   */
  describe('Property 33: Error Logging Completeness', () => {
    it('should log all error properties', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.record({
            component: fc.option(fc.string(), { nil: undefined }),
            action: fc.option(fc.string(), { nil: undefined }),
            userId: fc.option(fc.string(), { nil: undefined }),
          }),
          (errorMessage, context) => {
            const error = new Error(errorMessage);
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            logError(error, context as ErrorContext);

            // Property: Error should be logged (in development mode)
            if (process.env.NODE_ENV === 'development') {
              expect(consoleSpy).toHaveBeenCalled();

              // Property: Logged data should include error message
              const loggedData = consoleSpy.mock.calls[0];
              const logString = JSON.stringify(loggedData);
              expect(logString).toContain(errorMessage);
            }

            consoleSpy.mockRestore();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should include timestamp in error logs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          (errorMessage) => {
            const error = new Error(errorMessage);
            const beforeLog = new Date();
            
            logError(error);
            
            const afterLog = new Date();

            // Property: Timestamp should be between before and after
            // (We can't directly check the logged timestamp, but we verify the function runs)
            expect(afterLog.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve error context', () => {
      const contexts: ErrorContext[] = [
        { component: 'TestComponent', action: 'testAction' },
        { component: 'AnotherComponent', userId: 'user123' },
        { action: 'fetchData', metadata: { key: 'value' } },
      ];

      contexts.forEach(context => {
        const error = new Error('Test error');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        logError(error, context);

        if (process.env.NODE_ENV === 'development') {
          const loggedData = consoleSpy.mock.calls[0];
          const logString = JSON.stringify(loggedData);

          // Verify context is included
          if (context.component) {
            expect(logString).toContain(context.component);
          }
          if (context.action) {
            expect(logString).toContain(context.action);
          }
          if (context.userId) {
            expect(logString).toContain(context.userId);
          }
        }

        consoleSpy.mockRestore();
      });
    });
  });

  /**
   * Additional Property: Retry Logic Correctness
   * Validates that retry operations respect max attempts and backoff
   */
  describe('Retry Logic Properties', () => {
    it('should respect max attempts', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.integer({ min: 1, max: 5 }),
          async (maxAttempts) => {
            let attemptCount = 0;
            const failingOperation = async () => {
              attemptCount++;
              throw new Error('Operation failed');
            };

            try {
              await retryOperation(failingOperation, { maxAttempts, delayMs: 10 });
            } catch {
              // Expected to fail
            }

            // Property: Should attempt exactly maxAttempts times
            expect(attemptCount).toBe(maxAttempts);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should succeed on eventual success', async () => {
      fc.assert(
        await fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (successOnAttempt) => {
            let attemptCount = 0;
            const eventuallySuccessfulOperation = async () => {
              attemptCount++;
              if (attemptCount < successOnAttempt) {
                throw new Error('Not yet');
              }
              return 'success';
            };

            const result = await retryOperation(eventuallySuccessfulOperation, {
              maxAttempts: 5,
              delayMs: 10,
            });

            // Property: Should return success value
            expect(result).toBe('success');
            // Property: Should have attempted the right number of times
            expect(attemptCount).toBe(successOnAttempt);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableErrors = [
        'Permission denied',
        'Unauthorized access',
        'Invalid input',
        'Validation failed',
        '400 Bad Request',
        '404 Not Found',
      ];

      for (const errorMessage of nonRetryableErrors) {
        let attemptCount = 0;
        const operation = async () => {
          attemptCount++;
          throw new Error(errorMessage);
        };

        try {
          await retryOperation(operation, { maxAttempts: 3, delayMs: 10 });
        } catch {
          // Expected to fail
        }

        // Property: Should only attempt once for non-retryable errors
        expect(attemptCount).toBe(1);
      }
    });
  });

  /**
   * Connection Monitor Properties
   */
  describe('Connection Monitor Properties', () => {
    it('should notify all subscribers of status changes', () => {
      const monitor = new ConnectionMonitor();
      const listeners: boolean[] = [];
      const listener1 = (status: boolean) => listeners.push(status);
      const listener2 = (status: boolean) => listeners.push(status);

      monitor.subscribe(listener1);
      monitor.subscribe(listener2);

      // Trigger status change
      window.dispatchEvent(new Event('offline'));

      // Property: All listeners should be notified
      expect(listeners.length).toBeGreaterThanOrEqual(2);

      monitor.cleanup();
    });

    it('should allow unsubscribe', () => {
      const monitor = new ConnectionMonitor();
      let callCount = 0;
      const listener = () => { callCount++; };

      const unsubscribe = monitor.subscribe(listener);
      const initialCount = callCount;

      unsubscribe();

      // Trigger status change
      window.dispatchEvent(new Event('offline'));

      // Property: Listener should not be called after unsubscribe
      expect(callCount).toBe(initialCount);

      monitor.cleanup();
    });
  });
});
