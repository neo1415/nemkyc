/**
 * AutoFillEngine - Main Orchestrator
 * 
 * This is the main orchestrator class that coordinates all auto-fill services to provide
 * a complete NIN/CAC auto-fill experience. It integrates:
 * - FormTypeDetector: Detects form type and identifier fields
 * - VerificationAPIClient: Calls backend verification APIs with database caching
 * - DataNormalizer: Normalizes API response data
 * - FieldMapper: Maps API fields to form fields
 * - FormPopulator: Populates form fields with normalized data
 * - VisualFeedbackManager: Provides visual feedback to users
 * 
 * The engine handles the complete workflow from verification to population,
 * including error handling, validation, and user feedback.
 * 
 * Requirements: 1.1, 1.3, 1.4, 2.1, 2.3, 7.1, 7.2, 7.3, 12.4, 12.5
 */

import { FormTypeDetector } from './FormTypeDetector';
import { VerificationAPIClient } from './VerificationAPIClient';
import { DataNormalizer } from './DataNormalizer';
import { FieldMapper } from './FieldMapper';
import { FormPopulator } from './FormPopulator';
import { VisualFeedbackManager } from './VisualFeedbackManager';
import { IdentifierType, FormType, NINVerificationResponse, CACVerificationResponse } from '../../types/autoFill';

/**
 * Configuration for AutoFillEngine
 */
export interface AutoFillEngineConfig {
  formElement: HTMLFormElement;
  userId?: string;
  formId?: string;
  userName?: string;
  userEmail?: string;
  reactHookFormSetValue?: (name: string, value: any) => void;
  onSuccess?: (populatedFieldCount: number) => void;
  onError?: (error: { code: string; message: string }) => void;
  onComplete?: () => void;
}

/**
 * Result of auto-fill execution
 */
export interface AutoFillResult {
  success: boolean;
  populatedFieldCount: number;
  populatedFields: string[];
  cached?: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * AutoFillEngine class
 * 
 * Main orchestrator that coordinates all auto-fill services
 */
export class AutoFillEngine {
  private config: AutoFillEngineConfig;
  private formTypeDetector: FormTypeDetector;
  private apiClient: VerificationAPIClient;
  private dataNormalizer: DataNormalizer;
  private fieldMapper: FieldMapper;
  private formPopulator: FormPopulator;
  private visualFeedback: VisualFeedbackManager;

  constructor(config: AutoFillEngineConfig) {
    this.config = config;
    
    // Initialize all services
    this.formTypeDetector = new FormTypeDetector();
    this.apiClient = new VerificationAPIClient();
    this.dataNormalizer = new DataNormalizer();
    this.fieldMapper = new FieldMapper();
    this.formPopulator = new FormPopulator();
    this.visualFeedback = new VisualFeedbackManager();
    
    // Set React Hook Form setValue if provided
    if (config.reactHookFormSetValue) {
      this.formPopulator.setReactHookFormSetValue(config.reactHookFormSetValue);
    }
  }

  /**
   * Execute auto-fill for NIN
   * 
   * Complete workflow:
   * 1. Detect form type and validate it supports NIN
   * 2. Show loading indicator
   * 3. Call verification API (with database caching)
   * 4. Validate response
   * 5. Normalize data
   * 6. Map fields
   * 7. Populate form
   * 8. Show success/error feedback
   * 
   * @param nin - The 11-digit NIN to verify
   * @returns Promise resolving to auto-fill result
   */
  async executeAutoFillNIN(nin: string): Promise<AutoFillResult> {
    console.log('[AutoFillEngine] Starting NIN auto-fill workflow');

    // Step 1: Detect form type
    const formType = this.formTypeDetector.detectFormType(this.config.formElement);
    
    if (!this.formTypeDetector.supportsIdentifierType(this.config.formElement, IdentifierType.NIN)) {
      const error = {
        code: 'UNSUPPORTED_FORM',
        message: 'This form does not support NIN auto-fill'
      };
      
      if (this.config.onError) {
        this.config.onError(error);
      }
      
      return {
        success: false,
        populatedFieldCount: 0,
        populatedFields: [],
        error
      };
    }

    // Step 2: Get identifier field and show loading
    const identifierField = this.formTypeDetector.getIdentifierField(this.config.formElement, IdentifierType.NIN);
    if (identifierField) {
      this.visualFeedback.showLoading(identifierField);
      this.visualFeedback.disableField(identifierField);
    }

    try {
      // Step 3: Call verification API
      console.log('[AutoFillEngine] Calling NIN verification API');
      const response = await this.apiClient.verifyNIN(
        nin,
        this.config.userId,
        this.config.formId,
        this.config.userName,
        this.config.userEmail
      );

      // Step 4: Validate response
      if (!response.success || !response.data) {
        console.log('[AutoFillEngine] Verification failed:', response.error);
        
        // Hide loading
        if (identifierField) {
          this.visualFeedback.hideLoading(identifierField);
          this.visualFeedback.enableField(identifierField);
        }

        // Show error
        const error = response.error || {
          code: 'VERIFICATION_FAILED',
          message: 'Verification failed'
        };
        
        this.visualFeedback.showError(error.message);
        
        if (this.config.onError) {
          this.config.onError(error);
        }

        return {
          success: false,
          populatedFieldCount: 0,
          populatedFields: [],
          error
        };
      }

      // Step 5: Validate data is not null/empty
      if (!this.validateResponseData(response.data)) {
        console.log('[AutoFillEngine] Response data validation failed - contains null/empty values');
        
        // Hide loading
        if (identifierField) {
          this.visualFeedback.hideLoading(identifierField);
          this.visualFeedback.enableField(identifierField);
        }

        const error = {
          code: 'INVALID_RESPONSE',
          message: 'Verification returned incomplete data'
        };
        
        this.visualFeedback.showError(error.message);
        
        if (this.config.onError) {
          this.config.onError(error);
        }

        return {
          success: false,
          populatedFieldCount: 0,
          populatedFields: [],
          error
        };
      }

      // Step 6: Normalize data
      console.log('[AutoFillEngine] Normalizing NIN data');
      const normalizedData = this.dataNormalizer.normalizeNINData(response.data);

      // Step 7: Map fields
      console.log('[AutoFillEngine] Mapping NIN fields to form');
      const fieldMappings = this.fieldMapper.mapNINFields(normalizedData, this.config.formElement);

      if (fieldMappings.length === 0) {
        console.log('[AutoFillEngine] No fields could be mapped');
        
        // Hide loading
        if (identifierField) {
          this.visualFeedback.hideLoading(identifierField);
          this.visualFeedback.enableField(identifierField);
        }

        const error = {
          code: 'NO_FIELDS_MAPPED',
          message: 'Could not find matching fields in the form'
        };
        
        this.visualFeedback.showError(error.message);
        
        if (this.config.onError) {
          this.config.onError(error);
        }

        return {
          success: false,
          populatedFieldCount: 0,
          populatedFields: [],
          error
        };
      }

      // Step 8: Populate form
      console.log('[AutoFillEngine] Populating form fields');
      const populationResult = this.formPopulator.populateFields(fieldMappings);

      // Step 9: Apply visual markers
      if (populationResult && Array.isArray(populationResult.populatedFields)) {
        populationResult.populatedFields.forEach(fieldName => {
          const mapping = fieldMappings.find(m => m.formFieldName === fieldName);
          if (mapping) {
            this.visualFeedback.markFieldAutoFilled(mapping.formFieldElement);
          }
        });
      }

      // Hide loading
      if (identifierField) {
        this.visualFeedback.hideLoading(identifierField);
        this.visualFeedback.enableField(identifierField);
      }

      // Show success
      this.visualFeedback.showSuccess(`Successfully filled ${populationResult.populatedFields.length} fields`);

      // Call success callback
      if (this.config.onSuccess) {
        this.config.onSuccess(populationResult.populatedFields.length);
      }

      console.log('[AutoFillEngine] NIN auto-fill completed successfully');

      return {
        success: true,
        populatedFieldCount: populationResult.populatedFields.length,
        populatedFields: populationResult.populatedFields,
        cached: response.cached
      };

    } catch (error: any) {
      console.error('[AutoFillEngine] Auto-fill error:', error);

      // Hide loading
      if (identifierField) {
        this.visualFeedback.hideLoading(identifierField);
        this.visualFeedback.enableField(identifierField);
      }

      // Show error
      const errorObj = {
        code: 'EXECUTION_ERROR',
        message: error.message || 'An unexpected error occurred during auto-fill'
      };
      
      this.visualFeedback.showError(errorObj.message);
      
      if (this.config.onError) {
        this.config.onError(errorObj);
      }

      return {
        success: false,
        populatedFieldCount: 0,
        populatedFields: [],
        error: errorObj
      };
    } finally {
      if (this.config.onComplete) {
        this.config.onComplete();
      }
    }
  }

  /**
   * Execute auto-fill for CAC
   * 
   * Complete workflow:
   * 1. Detect form type and validate it supports CAC
   * 2. Show loading indicator
   * 3. Call verification API (with database caching)
   * 4. Validate response
   * 5. Normalize data
   * 6. Map fields
   * 7. Populate form
   * 8. Show success/error feedback
   * 
   * @param rcNumber - The RC number to verify
   * @param companyName - The company name (required by VerifyData API)
   * @returns Promise resolving to auto-fill result
   */
  async executeAutoFillCAC(rcNumber: string, companyName: string): Promise<AutoFillResult> {
    console.log('[AutoFillEngine] Starting CAC auto-fill workflow');

    // Step 1: Detect form type
    const formType = this.formTypeDetector.detectFormType(this.config.formElement);
    
    if (!this.formTypeDetector.supportsIdentifierType(this.config.formElement, IdentifierType.CAC)) {
      const error = {
        code: 'UNSUPPORTED_FORM',
        message: 'This form does not support CAC auto-fill'
      };
      
      if (this.config.onError) {
        this.config.onError(error);
      }
      
      return {
        success: false,
        populatedFieldCount: 0,
        populatedFields: [],
        error
      };
    }

    // Step 2: Get identifier field and show loading
    const identifierField = this.formTypeDetector.getIdentifierField(this.config.formElement, IdentifierType.CAC);
    if (identifierField) {
      this.visualFeedback.showLoading(identifierField);
      this.visualFeedback.disableField(identifierField);
    }

    try {
      // Step 3: Call verification API
      console.log('[AutoFillEngine] Calling CAC verification API');
      const response = await this.apiClient.verifyCAC(
        rcNumber,
        companyName,
        this.config.userId,
        this.config.formId,
        this.config.userName,
        this.config.userEmail
      );

      // Step 4: Validate response
      if (!response.success || !response.data) {
        console.log('[AutoFillEngine] Verification failed:', response.error);
        
        // Hide loading
        if (identifierField) {
          this.visualFeedback.hideLoading(identifierField);
          this.visualFeedback.enableField(identifierField);
        }

        // Show error
        const error = response.error || {
          code: 'VERIFICATION_FAILED',
          message: 'Verification failed'
        };
        
        this.visualFeedback.showError(error.message);
        
        if (this.config.onError) {
          this.config.onError(error);
        }

        return {
          success: false,
          populatedFieldCount: 0,
          populatedFields: [],
          error
        };
      }

      // Step 5: Validate data is not null/empty
      if (!this.validateResponseData(response.data)) {
        console.log('[AutoFillEngine] Response data validation failed - contains null/empty values');
        
        // Hide loading
        if (identifierField) {
          this.visualFeedback.hideLoading(identifierField);
          this.visualFeedback.enableField(identifierField);
        }

        const error = {
          code: 'INVALID_RESPONSE',
          message: 'Verification returned incomplete data'
        };
        
        this.visualFeedback.showError(error.message);
        
        if (this.config.onError) {
          this.config.onError(error);
        }

        return {
          success: false,
          populatedFieldCount: 0,
          populatedFields: [],
          error
        };
      }

      // Step 6: Normalize data
      console.log('[AutoFillEngine] Normalizing CAC data');
      const normalizedData = this.dataNormalizer.normalizeCACData(response.data);

      // Step 7: Map fields
      console.log('[AutoFillEngine] Mapping CAC fields to form');
      const fieldMappings = this.fieldMapper.mapCACFields(normalizedData, this.config.formElement);

      if (fieldMappings.length === 0) {
        console.log('[AutoFillEngine] No fields could be mapped');
        
        // Hide loading
        if (identifierField) {
          this.visualFeedback.hideLoading(identifierField);
          this.visualFeedback.enableField(identifierField);
        }

        const error = {
          code: 'NO_FIELDS_MAPPED',
          message: 'Could not find matching fields in the form'
        };
        
        this.visualFeedback.showError(error.message);
        
        if (this.config.onError) {
          this.config.onError(error);
        }

        return {
          success: false,
          populatedFieldCount: 0,
          populatedFields: [],
          error
        };
      }

      // Step 8: Populate form
      console.log('[AutoFillEngine] Populating form fields');
      const populationResult = this.formPopulator.populateFields(fieldMappings);

      // Step 9: Apply visual markers
      if (populationResult && Array.isArray(populationResult.populatedFields)) {
        populationResult.populatedFields.forEach(fieldName => {
          const mapping = fieldMappings.find(m => m.formFieldName === fieldName);
          if (mapping) {
            this.visualFeedback.markFieldAutoFilled(mapping.formFieldElement);
          }
        });
      }

      // Hide loading
      if (identifierField) {
        this.visualFeedback.hideLoading(identifierField);
        this.visualFeedback.enableField(identifierField);
      }

      // Show success
      this.visualFeedback.showSuccess(`Successfully filled ${populationResult.populatedFields.length} fields`);

      // Call success callback
      if (this.config.onSuccess) {
        this.config.onSuccess(populationResult.populatedFields.length);
      }

      console.log('[AutoFillEngine] CAC auto-fill completed successfully');

      return {
        success: true,
        populatedFieldCount: populationResult.populatedFields.length,
        populatedFields: populationResult.populatedFields,
        cached: response.cached
      };

    } catch (error: any) {
      console.error('[AutoFillEngine] Auto-fill error:', error);

      // Hide loading
      if (identifierField) {
        this.visualFeedback.hideLoading(identifierField);
        this.visualFeedback.enableField(identifierField);
      }

      // Show error
      const errorObj = {
        code: 'EXECUTION_ERROR',
        message: error.message || 'An unexpected error occurred during auto-fill'
      };
      
      this.visualFeedback.showError(errorObj.message);
      
      if (this.config.onError) {
        this.config.onError(errorObj);
      }

      return {
        success: false,
        populatedFieldCount: 0,
        populatedFields: [],
        error: errorObj
      };
    } finally {
      if (this.config.onComplete) {
        this.config.onComplete();
      }
    }
  }

  /**
   * Validate response data
   * 
   * Checks that the response data contains valid values (not null, undefined, or empty strings)
   * for at least some fields.
   * 
   * @param data - The response data to validate
   * @returns True if data is valid, false otherwise
   */
  private validateResponseData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Count non-empty values
    let validFieldCount = 0;
    
    for (const key in data) {
      const value = data[key];
      
      // Skip null, undefined, and empty strings
      if (value !== null && value !== undefined && value !== '') {
        validFieldCount++;
      }
    }

    // Require at least 2 valid fields
    return validFieldCount >= 2;
  }

  /**
   * Cleanup resources
   * 
   * Should be called when the engine is no longer needed (e.g., component unmount)
   */
  cleanup(): void {
    // Cancel any pending API requests
    this.apiClient.cancelPendingRequest();
    
    console.log('[AutoFillEngine] Cleanup complete');
  }
}
