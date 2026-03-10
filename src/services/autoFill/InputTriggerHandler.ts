/**
 * InputTriggerHandler Service
 * 
 * This service handles the triggering of auto-fill verification when users complete
 * entering their NIN or CAC/RC number. It listens for onBlur events, validates
 * the identifier format, and orchestrates the verification flow.
 * 
 * Key features:
 * - Attaches to NIN/CAC input fields
 * - Validates identifier format before triggering API
 * - Prevents duplicate API calls for the same identifier
 * - Cancels pending requests when identifier changes
 * - Provides cleanup on component unmount
 * 
 * Requirements: 1.1, 2.1, 9.5
 */

import { IdentifierType } from '../../types/autoFill';
import { VerificationAPIClient } from './VerificationAPIClient';
import { getVerificationCache } from '../VerificationCache';

/**
 * Configuration for InputTriggerHandler
 */
export interface InputTriggerConfig {
  identifierType: IdentifierType;
  onVerificationStart?: () => void;
  onVerificationComplete?: (success: boolean, data?: any) => void;
  onVerificationError?: (error: { code: string; message: string }) => void;
  userId?: string;
  formId?: string;
}

/**
 * InputTriggerHandler class
 * 
 * Manages the triggering of verification when users complete identifier input
 */
export class InputTriggerHandler {
  private inputElement: HTMLInputElement | null = null;
  private config: InputTriggerConfig;
  private apiClient: VerificationAPIClient;
  private lastVerifiedValue: string | null = null;
  private isVerifying: boolean = false;
  private blurHandler: ((event: FocusEvent) => void) | null = null;

  constructor(config: InputTriggerConfig) {
    this.config = config;
    this.apiClient = new VerificationAPIClient();
  }

  /**
   * Attach the trigger handler to an input field
   * 
   * Listens for onBlur events and triggers verification when the user
   * completes entering their identifier.
   * 
   * @param inputElement - The input element to attach to
   */
  attachToField(inputElement: HTMLInputElement): void {
    console.log('[InputTriggerHandler] ===== ATTACH TO FIELD START =====');
    console.log('[InputTriggerHandler] Input element:', inputElement);
    console.log('[InputTriggerHandler] Input element ID:', inputElement?.id);
    console.log('[InputTriggerHandler] Input element name:', inputElement?.name);
    console.log('[InputTriggerHandler] Identifier type:', this.config.identifierType);
    
    // Detach from previous field if any
    this.detachFromField();

    this.inputElement = inputElement;

    // Create blur handler
    this.blurHandler = async (event: FocusEvent) => {
      console.log('[InputTriggerHandler] ===== BLUR EVENT FIRED =====');
      console.log('[InputTriggerHandler] Event target:', event.target);
      
      const value = (event.target as HTMLInputElement).value.trim();
      console.log('[InputTriggerHandler] Input value:', value);

      // Skip if empty
      if (!value) {
        console.log('[InputTriggerHandler] Value is empty, skipping');
        return;
      }

      // Skip if already verifying
      if (this.isVerifying) {
        console.log('[InputTriggerHandler] Verification already in progress, skipping');
        return;
      }

      // Skip if same value already verified
      if (value === this.lastVerifiedValue) {
        console.log('[InputTriggerHandler] Value already verified, skipping');
        return;
      }

      // Validate identifier format
      console.log('[InputTriggerHandler] Validating identifier format...');
      const validationResult = this.validateIdentifier(value);
      console.log('[InputTriggerHandler] Validation result:', validationResult);
      
      if (!validationResult.valid) {
        console.log('[InputTriggerHandler] Invalid identifier format:', validationResult.error);
        // Don't trigger verification for invalid format
        // The form's own validation will show the error
        return;
      }

      console.log('[InputTriggerHandler] Validation passed, triggering verification...');
      // Trigger verification
      await this.triggerVerification(value);
    };

    // Attach blur event listener
    this.inputElement.addEventListener('blur', this.blurHandler);
    console.log(`[InputTriggerHandler] ✅ Blur event listener attached to ${this.config.identifierType} field`);
    console.log('[InputTriggerHandler] ===== ATTACH TO FIELD END =====');
  }

  /**
   * Detach the trigger handler from the current input field
   * 
   * Removes event listeners and cleans up resources
   */
  detachFromField(): void {
    if (this.inputElement && this.blurHandler) {
      this.inputElement.removeEventListener('blur', this.blurHandler);
      this.inputElement = null;
      this.blurHandler = null;
      console.log(`[InputTriggerHandler] Detached from ${this.config.identifierType} field`);
    }
  }

  /**
   * Validate identifier format
   * 
   * Checks if the identifier matches the expected format:
   * - NIN: Exactly 11 digits
   * - CAC: Non-empty alphanumeric string
   * 
   * @param value - The identifier value to validate
   * @returns Validation result with valid flag and optional error message
   */
  validateIdentifier(value: string): { valid: boolean; error?: string } {
    if (this.config.identifierType === IdentifierType.NIN) {
      // NIN must be exactly 11 digits
      if (!/^\d{11}$/.test(value)) {
        return {
          valid: false,
          error: 'NIN must be exactly 11 digits'
        };
      }
      return { valid: true };
    } else if (this.config.identifierType === IdentifierType.CAC) {
      // CAC/RC number must be non-empty alphanumeric
      if (!value || value.length === 0) {
        return {
          valid: false,
          error: 'RC number is required'
        };
      }
      // Allow alphanumeric characters, hyphens, and slashes
      if (!/^[A-Za-z0-9\-\/]+$/.test(value)) {
        return {
          valid: false,
          error: 'RC number contains invalid characters'
        };
      }
      return { valid: true };
    }

    return {
      valid: false,
      error: 'Unknown identifier type'
    };
  }

  /**
   * Trigger verification for the given identifier
   * 
   * Orchestrates the verification flow:
   * 1. Cancels any pending requests
   * 2. Calls the appropriate API (NIN or CAC)
   * 3. Invokes callbacks for start, complete, and error
   * 4. Prevents duplicate calls for the same identifier
   * 
   * @param value - The identifier value to verify
   */
  async triggerVerification(value: string): Promise<void> {
    // Cancel any pending request
    if (this.apiClient.isRequestPending()) {
      console.log('[InputTriggerHandler] Cancelling pending request');
      this.apiClient.cancelPendingRequest();
    }

    // Set verifying flag
    this.isVerifying = true;

    // Call onVerificationStart callback
    if (this.config.onVerificationStart) {
      this.config.onVerificationStart();
    }

    try {
      let response;

      if (this.config.identifierType === IdentifierType.NIN) {
        // Verify NIN
        console.log('[InputTriggerHandler] Triggering NIN verification');
        response = await this.apiClient.verifyNIN(
          value,
          this.config.userId,
          this.config.formId
        );
      } else if (this.config.identifierType === IdentifierType.CAC) {
        // Verify CAC
        // The VerifyData API only needs the RC number - it returns company name and other details
        console.log('[InputTriggerHandler] Triggering CAC verification');
        response = await this.apiClient.verifyCAC(
          value,
          this.config.userId,
          this.config.formId
        );
      } else {
        throw new Error('Unknown identifier type');
      }

      // Handle response
      if (response.success && response.data) {
        console.log('[InputTriggerHandler] Verification successful');
        
        // Store in frontend cache for realtime validation
        const cache = getVerificationCache();
        cache.set(value, response.data, this.config.identifierType);
        console.log('[InputTriggerHandler] Stored verification data in frontend cache for:', value);
        
        // Update last verified value
        this.lastVerifiedValue = value;

        // Call onVerificationComplete callback
        if (this.config.onVerificationComplete) {
          this.config.onVerificationComplete(true, response.data);
        }
      } else {
        console.log('[InputTriggerHandler] Verification failed:', response.error);

        // Call onVerificationError callback
        if (this.config.onVerificationError && response.error) {
          this.config.onVerificationError(response.error);
        }

        // Call onVerificationComplete callback with failure
        if (this.config.onVerificationComplete) {
          this.config.onVerificationComplete(false);
        }
      }
    } catch (error: any) {
      console.error('[InputTriggerHandler] Verification error:', error);

      // Call onVerificationError callback
      if (this.config.onVerificationError) {
        this.config.onVerificationError({
          code: 'UNKNOWN_ERROR',
          message: error.message || 'An unexpected error occurred'
        });
      }

      // Call onVerificationComplete callback with failure
      if (this.config.onVerificationComplete) {
        this.config.onVerificationComplete(false);
      }
    } finally {
      this.isVerifying = false;
    }
  }

  /**
   * Reset the handler state
   * 
   * Clears the last verified value, allowing the same identifier to be verified again
   */
  reset(): void {
    this.lastVerifiedValue = null;
    this.isVerifying = false;
    console.log('[InputTriggerHandler] State reset');
  }

  /**
   * Check if verification is currently in progress
   * 
   * @returns True if verification is in progress, false otherwise
   */
  isVerificationInProgress(): boolean {
    return this.isVerifying;
  }

  /**
   * Get the last verified value
   * 
   * @returns The last successfully verified identifier value, or null if none
   */
  getLastVerifiedValue(): string | null {
    return this.lastVerifiedValue;
  }
}
