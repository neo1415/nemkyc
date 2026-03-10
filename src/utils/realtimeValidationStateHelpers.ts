/**
 * Real-Time Validation State Helper Functions
 * 
 * Utility functions for managing validation state, including cache invalidation
 * and field state reset logic.
 */

import { FieldValidationState, FieldValidationStatus, FieldValidationConfig } from '@/types/realtimeVerificationValidation';

/**
 * Create initial field validation state
 * 
 * @returns Initial field validation state (not verified)
 */
export const createInitialFieldState = (): FieldValidationState => {
  return {
    status: FieldValidationStatus.NOT_VERIFIED,
    errorMessage: null,
    showCheckmark: false,
    showError: false
  };
};

/**
 * Reset all field validation states to initial state
 * 
 * This function is called when cache is invalidated due to identifier change.
 * It resets all fields to NOT_VERIFIED status, clearing any error messages
 * and visual indicators.
 * 
 * @param fieldsToValidate - Array of field configurations
 * @returns Object with all fields reset to initial state
 */
export const resetAllFieldStates = (
  fieldsToValidate: FieldValidationConfig[]
): Record<string, FieldValidationState> => {
  const resetStates: Record<string, FieldValidationState> = {};
  
  for (const fieldConfig of fieldsToValidate) {
    resetStates[fieldConfig.fieldName] = createInitialFieldState();
  }
  
  return resetStates;
};

/**
 * Check if identifier has changed
 * 
 * @param oldIdentifier - Previous identifier value
 * @param newIdentifier - New identifier value
 * @returns True if identifier has changed, false otherwise
 */
export const hasIdentifierChanged = (
  oldIdentifier: string | null,
  newIdentifier: string | null
): boolean => {
  // If both are null/empty, no change
  if (!oldIdentifier && !newIdentifier) {
    return false;
  }
  
  // If one is null/empty and the other isn't, it's a change
  if (!oldIdentifier || !newIdentifier) {
    return true;
  }
  
  // Compare the actual values
  return oldIdentifier !== newIdentifier;
};

/**
 * Create validation state reset result
 * 
 * This is returned when cache invalidation occurs, providing information
 * about what was reset.
 * 
 * @param fieldsToValidate - Array of field configurations
 * @param oldIdentifier - The identifier that was invalidated
 * @returns Reset result object
 */
export interface ValidationStateResetResult {
  /** Whether cache was invalidated */
  cacheInvalidated: boolean;
  
  /** The identifier that was invalidated */
  invalidatedIdentifier: string | null;
  
  /** Reset field states */
  resetFieldStates: Record<string, FieldValidationState>;
  
  /** List of field names that were reset */
  resetFieldNames: string[];
}

/**
 * Handle cache invalidation and state reset
 * 
 * This function coordinates cache invalidation with field state reset.
 * It should be called when the identifier field value changes.
 * 
 * @param oldIdentifier - Previous identifier value
 * @param newIdentifier - New identifier value
 * @param fieldsToValidate - Array of field configurations
 * @returns Reset result with cache invalidation status and reset states
 */
export const handleCacheInvalidationAndReset = (
  oldIdentifier: string | null,
  newIdentifier: string | null,
  fieldsToValidate: FieldValidationConfig[]
): ValidationStateResetResult => {
  const identifierChanged = hasIdentifierChanged(oldIdentifier, newIdentifier);
  
  if (!identifierChanged) {
    // No change, return empty result
    return {
      cacheInvalidated: false,
      invalidatedIdentifier: null,
      resetFieldStates: {},
      resetFieldNames: []
    };
  }
  
  // Reset all field states
  const resetStates = resetAllFieldStates(fieldsToValidate);
  const resetFieldNames = fieldsToValidate.map(f => f.fieldName);
  
  return {
    cacheInvalidated: true,
    invalidatedIdentifier: oldIdentifier,
    resetFieldStates: resetStates,
    resetFieldNames
  };
};

/**
 * Merge field states with reset states
 * 
 * This helper merges existing field states with reset states,
 * useful when only some fields need to be reset.
 * 
 * @param currentStates - Current field validation states
 * @param resetStates - States to reset
 * @returns Merged field states
 */
export const mergeFieldStates = (
  currentStates: Record<string, FieldValidationState>,
  resetStates: Record<string, FieldValidationState>
): Record<string, FieldValidationState> => {
  return {
    ...currentStates,
    ...resetStates
  };
};

/**
 * Check if any fields are in mismatched state
 * 
 * @param fieldStates - Current field validation states
 * @returns True if any field is mismatched
 */
export const hasAnyMismatchedFields = (
  fieldStates: Record<string, FieldValidationState>
): boolean => {
  return Object.values(fieldStates).some(
    state => state.status === FieldValidationStatus.MISMATCHED
  );
};

/**
 * Get list of mismatched field labels
 * 
 * @param fieldStates - Current field validation states
 * @param fieldsToValidate - Array of field configurations
 * @returns Array of field labels that are mismatched
 */
export const getMismatchedFieldLabels = (
  fieldStates: Record<string, FieldValidationState>,
  fieldsToValidate: FieldValidationConfig[]
): string[] => {
  const mismatchedLabels: string[] = [];
  
  for (const fieldConfig of fieldsToValidate) {
    const state = fieldStates[fieldConfig.fieldName];
    if (state && state.status === FieldValidationStatus.MISMATCHED) {
      mismatchedLabels.push(fieldConfig.fieldLabel);
    }
  }
  
  return mismatchedLabels;
};

/**
 * Check if all fields have been validated
 * 
 * @param fieldStates - Current field validation states
 * @param fieldsToValidate - Array of field configurations
 * @returns True if all fields have been validated (matched or mismatched)
 */
export const areAllFieldsValidated = (
  fieldStates: Record<string, FieldValidationState>,
  fieldsToValidate: FieldValidationConfig[]
): boolean => {
  for (const fieldConfig of fieldsToValidate) {
    const state = fieldStates[fieldConfig.fieldName];
    if (!state || state.status === FieldValidationStatus.NOT_VERIFIED || state.status === FieldValidationStatus.PENDING) {
      return false;
    }
  }
  
  return true;
};
