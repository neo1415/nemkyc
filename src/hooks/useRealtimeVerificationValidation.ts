/**
 * useRealtimeVerificationValidation Hook
 * 
 * Core hook that coordinates all real-time verification field validation logic.
 * Validates user-entered data against verification API responses in real-time,
 * provides immediate field-level visual feedback on mismatched fields, and
 * prevents form progression until all fields match verified data.
 * 
 * Key Features:
 * - Verification trigger on identifier field blur
 * - Field-by-field matching with verification data
 * - Per-field revalidation with debouncing
 * - Navigation blocking for mismatched fields
 * - Integration with useAutoFill for verification
 * - Cache-first approach to prevent duplicate API calls
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getVerificationCache } from '@/services/VerificationCache';
import {
  performAllFieldsMatching,
  revalidateSingleField,
  hasAnyMismatches,
  getMismatchedFieldLabels
} from '@/utils/realtimeFieldMatching';
import {
  resetAllFieldStates,
  hasIdentifierChanged,
  createInitialFieldState
} from '@/utils/realtimeValidationStateHelpers';
import {
  UseRealtimeVerificationValidationConfig,
  UseRealtimeVerificationValidationReturn,
  FieldValidationState,
  FieldValidationProps,
  FieldValidationStatus
} from '@/types/realtimeVerificationValidation';

/**
 * Debounce delay for field revalidation (milliseconds)
 */
const REVALIDATION_DEBOUNCE_DELAY = 300;

/**
 * useRealtimeVerificationValidation Hook
 * 
 * Manages real-time validation state and coordinates with existing systems.
 * 
 * @param config - Hook configuration
 * @returns Hook return value with state and functions
 */
export function useRealtimeVerificationValidation(
  config: UseRealtimeVerificationValidationConfig
): UseRealtimeVerificationValidationReturn {
  const {
    formType,
    identifierFieldName,
    identifierType,
    fieldsToValidate,
    formMethods,
    isAuthenticated
  } = config;

  // Get authentication context
  const { user } = useAuth();

  // Get verification cache instance
  const cache = useMemo(() => getVerificationCache(), []);

  // ============================================================================
  // State Management
  // ============================================================================

  // Field validation states (keyed by field name)
  const [fieldValidationStates, setFieldValidationStates] = useState<Record<string, FieldValidationState>>(() => {
    const initialStates: Record<string, FieldValidationState> = {};
    for (const fieldConfig of fieldsToValidate) {
      initialStates[fieldConfig.fieldName] = createInitialFieldState();
    }
    return initialStates;
  });

  // Verification state
  const [isVerificationTriggered, setIsVerificationTriggered] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<any | null>(null);
  const [identifierValue, setIdentifierValue] = useState<string | null>(null);

  // Refs for managing state across renders
  const identifierInputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const matchingExecutedRef = useRef(false); // Prevent matching loop

  // ============================================================================
  // Cache Monitoring (instead of creating separate useAutoFill instance)
  // ============================================================================
  
  // Track last processed identifier to detect new verifications
  const lastProcessedIdentifierRef = useRef<string | null>(null);
  
  // Poll cache after blur to catch async verification completion
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Computed Properties
  // ============================================================================

  // Check if any field is mismatched
  const hasAnyMismatchedFields = useMemo(() => {
    return hasAnyMismatches(fieldValidationStates);
  }, [fieldValidationStates]);

  // Get list of mismatched field labels
  const mismatchedFieldLabels = useMemo(() => {
    return getMismatchedFieldLabels(fieldValidationStates, fieldsToValidate);
  }, [fieldValidationStates, fieldsToValidate]);

  // Create field labels map for accessibility announcements
  const fieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const fieldConfig of fieldsToValidate) {
      labels[fieldConfig.fieldName] = fieldConfig.fieldLabel;
    }
    return labels;
  }, [fieldsToValidate]);

  // Determine if user can proceed to next step
  const canProceedToNextStep = useMemo(() => {
    // Allow navigation if verification hasn't been triggered
    if (!isVerificationTriggered) {
      return true;
    }

    // Allow navigation if verification API error occurred
    if (verificationError) {
      return true;
    }

    // Block navigation if any field is mismatched
    if (hasAnyMismatchedFields) {
      return false;
    }

    // Allow navigation if all fields are matched or not verified
    return true;
  }, [isVerificationTriggered, verificationError, hasAnyMismatchedFields]);

  // ============================================================================
  // Verification Trigger Logic - Monitor identifier field changes
  // ============================================================================

  /**
   * Check for new verification data in cache when identifier changes
   * This runs when the user blurs from the identifier field
   */
  const checkForVerificationData = useCallback((skipProcessedCheck = false) => {
    const currentIdentifier = identifierInputRef.current?.value?.trim() || null;
    
    if (!currentIdentifier) {
      return false;
    }

    // Skip if we already processed this identifier (unless explicitly told not to)
    if (!skipProcessedCheck && lastProcessedIdentifierRef.current === currentIdentifier) {
      return false;
    }

    console.log('[useRealtimeVerificationValidation] Checking for verification data:', currentIdentifier);

    // Check if verification data exists in cache
    const cachedData = cache.get(currentIdentifier);
    if (!cachedData || !cachedData.data) {
      console.log('[useRealtimeVerificationValidation] No cached data found');
      return false;
    }

    console.log('[useRealtimeVerificationValidation] ✅ Found verification data, running matching...');
    console.log('[useRealtimeVerificationValidation] Cached data:', cachedData.data);

    // Store verification data
    setVerificationData(cachedData.data);
    setIsVerifying(false);
    setVerificationError(null);
    
    // CRITICAL: Mark verification as triggered
    setIsVerificationTriggered(true);

    // CRITICAL: Always use CURRENT form values for validation
    // This ensures we validate what the user has currently entered, including any changes they made
    const getCurrentFormData = () => {
      const currentFormData = formMethods.getValues();
      console.log('[useRealtimeVerificationValidation] Current form data for validation:', currentFormData);
      return currentFormData;
    };

    // IMPORTANT: Wait a tick for any pending React updates to complete
    setTimeout(() => {
      // Use the CURRENT form data for validation (not before autofill)
      // This ensures we validate the user's current input, including any changes they made
      const formData = getCurrentFormData();
      
      console.log('[useRealtimeVerificationValidation] ===== FORM DATA RETRIEVED =====');
      console.log('[useRealtimeVerificationValidation] Form data keys:', Object.keys(formData));
      console.log('[useRealtimeVerificationValidation] Full form data:', formData);
      console.log('[useRealtimeVerificationValidation] Specific field values:');
      console.log('  - insured:', formData.insured);
      console.log('  - dateOfIncorporationRegistration:', formData.dateOfIncorporationRegistration);
      console.log('  - officeAddress:', formData.officeAddress);
      console.log('  - typeOfEntity:', formData.typeOfEntity);
      console.log('  - firstName:', formData.firstName);
      console.log('  - lastName:', formData.lastName);
      console.log('  - dateOfBirth:', formData.dateOfBirth);
      console.log('  - gender:', formData.gender);
      
      console.log('[useRealtimeVerificationValidation] Fields to validate:', fieldsToValidate.map(f => ({
        fieldName: f.fieldName,
        fieldLabel: f.fieldLabel,
        verificationKey: f.verificationKey,
        formValue: formData[f.fieldName],
        verifiedValue: cachedData.data[f.verificationKey]
      })));

      // Perform matching for ALL fields ONCE
      const newFieldStates = performAllFieldsMatching(
        formData,
        cachedData.data,
        fieldsToValidate,
        identifierType
      );

      console.log('[useRealtimeVerificationValidation] Field states after matching:', newFieldStates);

      // Update all field states at once
      setFieldValidationStates(newFieldStates);

      // IMPORTANT: Reset the processed identifier tracking to allow re-verification
      // This ensures that if the user changes fields and re-enters the same NIN,
      // it will re-validate with the new field values
      lastProcessedIdentifierRef.current = null;

      console.log('[useRealtimeVerificationValidation] Matching completed, field states updated');
    }, 100); // Wait 100ms for any pending updates to complete
    
    return true;
  }, [cache, fieldsToValidate, identifierType, formMethods]);

  // ============================================================================
  // Identifier Field Attachment
  // ============================================================================

  /**
   * Attach blur listener to identifier field
   * This triggers verification when user completes entering the identifier
   */
  const attachToIdentifierField = useCallback((inputElement: HTMLInputElement) => {
    if (!inputElement) {
      console.warn('[useRealtimeVerificationValidation] Cannot attach to null input element');
      return;
    }

    // Check authentication
    if (!isAuthenticated) {
      console.log('[useRealtimeVerificationValidation] User not authenticated, skipping attachment');
      return;
    }

    console.log('[useRealtimeVerificationValidation] Attaching to identifier field:', inputElement.id);

    // Store reference
    identifierInputRef.current = inputElement;

    // Check if we already have cached data for the current value (handles re-renders during autofill)
    const currentValue = inputElement.value.trim();
    if (currentValue && !lastProcessedIdentifierRef.current) {
      console.log('[useRealtimeVerificationValidation] Checking for existing cached data on attach:', currentValue);
      const cachedData = cache.get(currentValue);
      if (cachedData && cachedData.data) {
        console.log('[useRealtimeVerificationValidation] Found cached data on attach, running matching immediately');
        checkForVerificationData();
      }
    }

    // Attach blur handler to trigger verification data check
    const handleBlur = () => {
      console.log('[useRealtimeVerificationValidation] Identifier field blurred, checking for verification data');
      
      // Try immediate check first
      const found = checkForVerificationData();
      
      // If not found, poll for up to 3 seconds (verification might be in progress)
      if (!found) {
        let attempts = 0;
        const maxAttempts = 15; // 15 attempts * 200ms = 3 seconds max
        
        // Clear any existing poll timer
        if (pollTimerRef.current) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        
        pollTimerRef.current = setInterval(() => {
          attempts++;
          console.log(`[useRealtimeVerificationValidation] Polling for verification data (attempt ${attempts}/${maxAttempts})`);
          
          const foundNow = checkForVerificationData(true); // Skip processed check during polling
          
          if (foundNow || attempts >= maxAttempts) {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }
            
            if (!foundNow && attempts >= maxAttempts) {
              console.log('[useRealtimeVerificationValidation] Polling timeout - verification data not found');
            }
          }
        }, 200); // Poll every 200ms
      }
    };

    inputElement.addEventListener('blur', handleBlur);

    // Track identifier value changes for cache invalidation
    const handleIdentifierChange = () => {
      const newValue = inputElement.value.trim();
      const oldValue = identifierValue;

      if (hasIdentifierChanged(oldValue, newValue)) {
        console.log('[useRealtimeVerificationValidation] Identifier changed, invalidating cache');
        
        // Invalidate cache for old identifier
        if (oldValue) {
          cache.invalidate(oldValue);
        }

        // Reset all field states
        const resetStates = resetAllFieldStates(fieldsToValidate);
        setFieldValidationStates(resetStates);

        // Reset verification state
        setIsVerificationTriggered(false);
        setVerificationData(null);
        setVerificationError(null);
        matchingExecutedRef.current = false;

        // Update identifier value
        setIdentifierValue(newValue || null);
      }
    };

    // Listen for input changes
    inputElement.addEventListener('input', handleIdentifierChange);

    // Cleanup function
    return () => {
      inputElement.removeEventListener('blur', handleBlur);
      inputElement.removeEventListener('input', handleIdentifierChange);
    };
  }, [isAuthenticated, identifierValue, cache, fieldsToValidate, checkForVerificationData]);

  // ============================================================================
  // Per-Field Revalidation
  // ============================================================================

  /**
   * Revalidate a single field using cached verification data
   * This is called on blur of individual fields (not the identifier field)
   */
  const revalidateField = useCallback((fieldName: string) => {
    console.log('[useRealtimeVerificationValidation] Revalidating field:', fieldName);

    // Get cached verification data
    const currentIdentifier = identifierInputRef.current?.value || null;
    if (!currentIdentifier) {
      console.warn('[useRealtimeVerificationValidation] No identifier value for revalidation');
      return;
    }

    const cachedData = cache.get(currentIdentifier);
    if (!cachedData) {
      console.warn('[useRealtimeVerificationValidation] No cached data for revalidation');
      return;
    }

    // Get current field value
    const fieldValue = formMethods.getValues(fieldName);
    
    console.log('[useRealtimeVerificationValidation] Field value from form:', {
      fieldName,
      fieldValue,
      fieldValueType: typeof fieldValue,
      isDate: fieldValue instanceof Date,
      verificationData: cachedData.data
    });

    // Revalidate ONLY this field
    const newFieldState = revalidateSingleField(
      fieldName,
      fieldValue,
      cachedData.data,
      fieldsToValidate,
      identifierType
    );

    // Update ONLY this field's state
    setFieldValidationStates(prev => ({
      ...prev,
      [fieldName]: newFieldState
    }));

    console.log('[useRealtimeVerificationValidation] Field revalidated:', fieldName, newFieldState.status);
  }, [cache, fieldsToValidate, identifierType, formMethods]);

  /**
   * Debounced revalidation for rapid field modifications
   */
  const debouncedRevalidateField = useCallback((fieldName: string) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      revalidateField(fieldName);
      debounceTimerRef.current = null;
    }, REVALIDATION_DEBOUNCE_DELAY);
  }, [revalidateField]);

  // ============================================================================
  // Field Validation Props
  // ============================================================================

  /**
   * Get validation props for a specific field
   * Returns props to apply to the field input element
   */
  const getFieldValidationProps = useCallback((fieldName: string): FieldValidationProps => {
    const fieldState = fieldValidationStates[fieldName];
    const isMismatched = fieldState?.status === FieldValidationStatus.MISMATCHED;
    const isMatched = fieldState?.status === FieldValidationStatus.MATCHED;

    console.log(`[useRealtimeVerificationValidation] getFieldValidationProps called for: ${fieldName}`, {
      status: fieldState?.status,
      isMismatched,
      isMatched,
      errorMessage: fieldState?.errorMessage
    });

    // Generate error message ID for aria-describedby
    const errorId = isMismatched ? `${fieldName}-validation-error` : undefined;

    // Generate className with border colors
    let className = '';
    if (isMismatched) {
      className = 'border-red-500 focus:border-red-500';
    } else if (isMatched) {
      className = 'border-green-500 focus:border-green-500';
    }

    // Create blur handler for revalidation
    const handleBlur = () => {
      console.log(`[useRealtimeVerificationValidation] Blur handler called for: ${fieldName}`, {
        isVerificationTriggered,
        hasVerificationData: !!verificationData
      });
      
      // Only revalidate if verification has been triggered
      if (isVerificationTriggered && verificationData) {
        debouncedRevalidateField(fieldName);
      }
    };

    return {
      'aria-invalid': isMismatched,
      'aria-describedby': errorId,
      className,
      onBlur: handleBlur
    };
  }, [fieldValidationStates, isVerificationTriggered, verificationData, debouncedRevalidateField]);

  // ============================================================================
  // Validation Cleanup
  // ============================================================================

  /**
   * Clear all validation state
   */
  const clearValidation = useCallback(() => {
    console.log('[useRealtimeVerificationValidation] Clearing validation state');

    // Reset all field states
    const resetStates = resetAllFieldStates(fieldsToValidate);
    setFieldValidationStates(resetStates);

    // Reset verification state
    setIsVerificationTriggered(false);
    setIsVerifying(false);
    setVerificationError(null);
    setVerificationData(null);
    setIdentifierValue(null);
    matchingExecutedRef.current = false;

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [fieldsToValidate]);

  // ============================================================================
  // Cleanup on Unmount
  // ============================================================================

  useEffect(() => {
    return () => {
      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Clear poll timer
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    // State
    fieldValidationStates,
    isVerificationTriggered,
    isVerifying,
    canProceedToNextStep,
    verificationError,

    // Functions
    attachToIdentifierField,
    getFieldValidationProps,
    clearValidation,
    revalidateField,

    // Data
    verificationData,
    fieldLabels,
    mismatchedFieldLabels
  };
}
