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
    // Detach from previous field if any
    this.detachFromField();

    this.inputElement = inputElement;

    // Create blur handler
    this.blurHandler = async (event: FocusEvent) => {
      const value = (event.target as HTMLInputElement).value.trim();

      // Skip if empty
      if (!value) {
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
      const validationResult = this.validateIdentifier(value);
      if (!validationResult.valid) {
        console.log('[InputTriggerHandler] Invalid identifier format:', validationResult.error);
        // Don't trigger verification for invalid format
        // The form's own validation will show the error
        return;
      }

      // Trigger verification
      await this.triggerVerification(value);
    };

    // Attach blur event listener
    this.inputElement.addEventListener('blur', this.blurHandler);
    console.log(`[InputTriggerHandler] Attached to ${this.config.identifierType} field`);
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
        // Note: For CAC, we need the company name which should be provided separately
        // For now, we'll skip CAC verification in the trigger handler
        // The form will need to handle CAC verification differently since it requires both RC number and company name
        console.log('[InputTriggerHandler] CAC verification requires company name - skipping auto-trigger');
        this.isVerifying = false;
        return;
      } else {
        throw new Error('Unknown identifier type');
      }

      // Handle response
      if (response.success && response.data) {
        console.log('[InputTriggerHandler] Verification successful');
        
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
