/**
 * Error Handling Utilities for Analytics Dashboard
 * Provides centralized error handling, logging, and retry logic
 */

import { toast } from '@/hooks/use-toast';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Logs error to console and optionally to external service
 */
export function logError(error: Error, context?: ErrorContext): void {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context: {
      ...context,
      timestamp: context?.timestamp || new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    },
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorLog);
  }

  // In production, you would send to error tracking service
  // Example: Sentry.captureException(error, { contexts: { custom: errorLog.context } });
}

/**
 * Shows user-friendly error toast notification
 */
export function showErrorToast(
  error: Error,
  customMessage?: string,
  context?: ErrorContext
): void {
  // Log the error
  logError(error, context);

  // Determine user-friendly message
  const userMessage = customMessage || getUserFriendlyMessage(error);

  // Show toast
  toast({
    variant: 'destructive',
    title: 'Error',
    description: userMessage,
    duration: 5000,
  });
}

/**
 * Converts technical error messages to user-friendly ones
 */
export function getUserFriendlyMessage(error: Error): string {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  // Permission errors
  if (message.includes('permission') || message.includes('unauthorized')) {
    return 'You do not have permission to perform this action.';
  }

  // Timeout errors
  if (message.includes('timeout')) {
    return 'The request took too long. Please try again.';
  }

  // Firestore errors
  if (message.includes('firestore') || message.includes('firebase')) {
    return 'Database error. Please try again later.';
  }

  // Rate limit errors
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Default message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Retry logic with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on certain errors
      if (shouldNotRetry(error as Error)) {
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Determines if an error should not be retried
 */
function shouldNotRetry(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Don't retry permission/auth errors
  if (message.includes('permission') || message.includes('unauthorized')) {
    return true;
  }

  // Don't retry validation errors
  if (message.includes('invalid') || message.includes('validation')) {
    return true;
  }

  // Don't retry 4xx errors (except 429 rate limit)
  if (message.includes('400') || message.includes('404') || message.includes('403')) {
    return true;
  }

  return false;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      showErrorToast(error as Error, undefined, context);
      throw error;
    }
  }) as T;
}

/**
 * Connection status checker
 */
export class ConnectionMonitor {
  private listeners: Set<(connected: boolean) => void> = new Set();
  private isConnected: boolean = navigator.onLine;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = (): void => {
    this.isConnected = true;
    this.notifyListeners();
  };

  private handleOffline = (): void => {
    this.isConnected = false;
    this.notifyListeners();
  };

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isConnected));
  }

  public subscribe(listener: (connected: boolean) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.isConnected);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): boolean {
    return this.isConnected;
  }

  public startPeriodicCheck(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(async () => {
      try {
        // Try to fetch a small resource to verify connectivity
        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        const wasConnected = this.isConnected;
        this.isConnected = response.ok;
        
        if (wasConnected !== this.isConnected) {
          this.notifyListeners();
        }
      } catch {
        const wasConnected = this.isConnected;
        this.isConnected = false;
        
        if (wasConnected !== this.isConnected) {
          this.notifyListeners();
        }
      }
    }, intervalMs);
  }

  public stopPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public cleanup(): void {
    this.stopPeriodicCheck();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners.clear();
  }
}

// Singleton instance
export const connectionMonitor = new ConnectionMonitor();
