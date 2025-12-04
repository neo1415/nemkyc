/**
 * Centralized API Client
 * Handles all HTTP requests with consistent error handling, retries, and authentication
 */

import { API_BASE_URL, API_ENDPOINTS, REQUEST_CONFIG } from '../config/constants';
import { toast } from 'sonner';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipCSRF?: boolean;
  skipTimestamp?: boolean;
  retries?: number;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
}

/**
 * Get CSRF token from server
 */
async function getCSRFToken(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CSRF_TOKEN}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }
    
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('CSRF token error:', error);
    throw error;
  }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    skipAuth = false,
    skipCSRF = false,
    skipTimestamp = false,
    retries = REQUEST_CONFIG.MAX_RETRIES,
    ...fetchOptions
  } = options;

  let lastError: ApiError | null = null;

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Build headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      };

      // Add CSRF token if not skipped
      if (!skipCSRF) {
        const csrfToken = await getCSRFToken();
        headers['CSRF-Token'] = csrfToken;
      }

      // Add timestamp if not skipped
      if (!skipTimestamp) {
        headers['x-timestamp'] = Date.now().toString();
      }

      // Make request
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include',
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = new Error(errorData.error || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.code = errorData.code;
        throw error;
      }

      // Parse and return response
      const data = await response.json();
      return data as T;

    } catch (error) {
      lastError = error as ApiError;
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (lastError.status && lastError.status >= 400 && lastError.status < 500 && lastError.status !== 429) {
        break;
      }

      // Don't retry on last attempt
      if (attempt === retries) {
        break;
      }

      // Wait before retrying
      await sleep(REQUEST_CONFIG.RETRY_DELAY * (attempt + 1));
      console.log(`Retrying request (attempt ${attempt + 1}/${retries})...`);
    }
  }

  // If we get here, all retries failed
  console.error('API request failed:', lastError);
  throw lastError;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Handle API errors with user-friendly messages
 */
export function handleApiError(error: any, defaultMessage: string = 'An error occurred'): string {
  if (error?.message) {
    return error.message;
  }
  
  if (error?.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  
  if (error?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error?.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (error?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  return defaultMessage;
}
