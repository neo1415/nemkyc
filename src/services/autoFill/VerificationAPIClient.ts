/**
 * VerificationAPIClient Service
 * 
 * This service provides a unified interface for calling NIN and CAC verification APIs
 * with timeout handling, request cancellation, and database-backed caching.
 * 
 * It calls the backend auto-fill endpoints which handle:
 * - Database cache checking (verified-identities collection)
 * - API calls to Datapro/VerifyData when cache misses
 * - Audit logging with metadata.source = 'auto-fill'
 * - Cost tracking and savings
 * 
 * Requirements: 1.1, 2.1, 9.1, 9.2, 8.1, 8.3, 12.4, 12.5
 */

import { NINVerificationResponse, CACVerificationResponse } from '../../types/autoFill';

// API configuration
const API_TIMEOUT = 15000; // 15 seconds timeout for auto-fill (increased from 5s to handle slow API responses)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * VerificationAPIClient class
 * 
 * Provides methods to verify NIN and CAC with timeout, cancellation, and database-backed caching
 */
export class VerificationAPIClient {
  private abortController: AbortController | null = null;
  private pendingRequest: boolean = false;

  /**
   * Verify NIN using Datapro API with database-backed caching
   * 
   * Makes a request to the backend auto-fill endpoint which:
   * 1. Checks database cache first (verified-identities collection)
   * 2. If cache HIT: returns cached data (cost = ₦0)
   * 3. If cache MISS: calls Datapro API (cost = ₦50) and caches result
   * 4. Logs all attempts with metadata.source = 'auto-fill'
   * 
   * @param nin - The 11-digit NIN to verify
   * @param userId - Optional user ID for audit logging
   * @param formId - Optional form ID for tracking
   * @param userName - Optional user name for audit logging
   * @param userEmail - Optional user email for audit logging
   * @returns Promise resolving to NIN verification response
   */
  async verifyNIN(nin: string, userId?: string, formId?: string, userName?: string, userEmail?: string): Promise<NINVerificationResponse> {
    // Validate input
    if (!nin || typeof nin !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'NIN is required'
        }
      };
    }

    // Validate NIN format (11 digits)
    if (!/^\d{11}$/.test(nin)) {
      return {
        success: false,
        error: {
          code: 'INVALID_FORMAT',
          message: 'Invalid NIN format. NIN must be 11 digits.'
        }
      };
    }

    // Cancel any pending request
    if (this.pendingRequest) {
      this.cancelPendingRequest();
    }

    // Create new AbortController for this request
    this.abortController = new AbortController();
    this.pendingRequest = true;

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, API_TIMEOUT);
      });

      // Create fetch + parse promise - call new auto-fill endpoint
      const fetchPromise = fetch(`${API_BASE_URL}/api/autofill/verify-nin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          nin,
          userId,
          formId,
          userName,
          userEmail
        }),
        signal: this.abortController.signal
      }).then(async (response) => {
        // Check if request was aborted
        if (this.abortController.signal.aborted) {
          throw new Error('AbortError');
        }
        // Parse JSON immediately
        const data = await response.json();
        return { response, data };
      });

      // Race between timeout and fetch+parse
      const { response, data } = await Promise.race([fetchPromise, timeoutPromise]);

      // Check HTTP status
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.errorCode || 'API_ERROR',
            message: data.message || data.error || 'Verification failed'
          }
        };
      }

      // Transform backend response to NINVerificationResponse format
      if (data.status && data.data) {
        // Log full API response for debugging
        console.log('🔍 [DEBUG] Full NIN API response:', JSON.stringify(data.data, null, 2));
        
        const result: NINVerificationResponse = {
          success: true,
          data: {
            firstName: data.data.firstname || data.data.firstName || '',
            middleName: data.data.middlename || data.data.middleName || undefined,
            lastName: data.data.surname || data.data.lastName || '',
            gender: data.data.gender || '',
            dateOfBirth: data.data.birthdate || data.data.dateOfBirth || '',
            phoneNumber: data.data.phone || data.data.phoneNumber || undefined,
            birthstate: data.data.birthstate || undefined,
            birthlga: data.data.birthlga || undefined,
            trackingId: data.data.trackingId || undefined
          },
          cached: data.cached || false,
          cachedAt: data.cachedAt || undefined
        };

        // Log cache status
        if (data.cached) {
          console.log('[VerificationAPIClient] NIN verification - CACHE HIT (cost = ₦0)');
        } else {
          console.log('[VerificationAPIClient] NIN verification - CACHE MISS (cost = ₦100, now cached)');
        }

        return result;
      } else {
        return {
          success: false,
          error: {
            code: data.errorCode || 'VERIFICATION_FAILED',
            message: data.message || 'NIN verification failed'
          }
        };
      }
    } catch (error: any) {
      // Handle timeout
      if (error.message === 'Request timeout') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Verification is taking longer than expected. You can continue manually or try again.'
          }
        };
      }
      // Handle abort
      else if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'REQUEST_CANCELLED',
            message: 'Request was cancelled'
          }
        };
      }
      // Handle network errors
      else {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error. Please check your connection and try again.'
          }
        };
      }
    } finally {
      this.pendingRequest = false;
      this.abortController = null;
    }
  }

  /**
   * Verify CAC using VerifyData API with database-backed caching
   * 
   * Makes a request to the backend auto-fill endpoint which:
   * 1. Checks database cache first (verified-identities collection)
   * 2. If cache HIT: returns cached data (cost = ₦0)
   * 3. If cache MISS: calls VerifyData API (cost = ₦100) and caches result
   * 4. Logs all attempts with metadata.source = 'auto-fill'
   * 
   * @param rcNumber - The RC number to verify
   * @param companyName - The company name (required by VerifyData API)
   * @param userId - Optional user ID for audit logging
   * @param formId - Optional form ID for tracking
   * @param userName - Optional user name for audit logging
   * @param userEmail - Optional user email for audit logging
   * @returns Promise resolving to CAC verification response
   */
  async verifyCAC(rcNumber: string, companyName: string, userId?: string, formId?: string, userName?: string, userEmail?: string): Promise<CACVerificationResponse> {
    // Validate input
    if (!rcNumber || typeof rcNumber !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'RC number is required'
        }
      };
    }

    if (!companyName || typeof companyName !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Company name is required'
        }
      };
    }

    // Cancel any pending request
    if (this.pendingRequest) {
      this.cancelPendingRequest();
    }

    // Create new AbortController for this request
    this.abortController = new AbortController();
    this.pendingRequest = true;

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, API_TIMEOUT);
      });

      // Create fetch + parse promise - call new auto-fill endpoint
      const fetchPromise = fetch(`${API_BASE_URL}/api/autofill/verify-cac`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          rc_number: rcNumber,
          company_name: companyName,
          userId,
          formId,
          userName,
          userEmail
        }),
        signal: this.abortController.signal
      }).then(async (response) => {
        // Check if request was aborted
        if (this.abortController.signal.aborted) {
          throw new Error('AbortError');
        }
        // Parse JSON immediately
        const data = await response.json();
        return { response, data };
      });

      // Race between timeout and fetch+parse
      const { response, data } = await Promise.race([fetchPromise, timeoutPromise]);

      // Check HTTP status
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.errorCode || 'API_ERROR',
            message: data.message || data.error || 'Verification failed'
          }
        };
      }

      // Transform backend response to CACVerificationResponse format
      if (data.status && data.data) {
        const result: CACVerificationResponse = {
          success: true,
          data: {
            name: data.data.company_name || data.data.name || '',
            registrationNumber: data.data.rc_number || data.data.registrationNumber || '',
            companyStatus: data.data.status || data.data.companyStatus || '',
            registrationDate: data.data.date_of_registration || data.data.registrationDate || '',
            typeOfEntity: data.data.company_type || data.data.typeOfEntity || undefined,
            address: data.data.address || undefined,
            email: data.data.email || undefined
          },
          cached: data.cached || false,
          cachedAt: data.cachedAt || undefined
        };

        // Log cache status
        if (data.cached) {
          console.log('[VerificationAPIClient] CAC verification - CACHE HIT (cost = ₦0)');
        } else {
          console.log('[VerificationAPIClient] CAC verification - CACHE MISS (cost = ₦100, now cached)');
        }

        return result;
      } else {
        return {
          success: false,
          error: {
            code: data.errorCode || 'VERIFICATION_FAILED',
            message: data.message || 'CAC verification failed'
          }
        };
      }
    } catch (error: any) {
      // Handle timeout
      if (error.message === 'Request timeout') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Verification is taking longer than expected. You can continue manually or try again.'
          }
        };
      }
      // Handle abort
      else if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'REQUEST_CANCELLED',
            message: 'Request was cancelled'
          }
        };
      }
      // Handle network errors
      else {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error. Please check your connection and try again.'
          }
        };
      }
    } finally {
      this.pendingRequest = false;
      this.abortController = null;
    }
  }

  /**
   * Cancel any pending verification request
   * 
   * Aborts the current request if one is in progress
   */
  cancelPendingRequest(): void {
    if (this.abortController && this.pendingRequest) {
      this.abortController.abort();
      this.abortController = null;
      this.pendingRequest = false;
    }
  }

  /**
   * Check if a request is currently pending
   * 
   * @returns True if a request is in progress, false otherwise
   */
  isRequestPending(): boolean {
    return this.pendingRequest;
  }
}

