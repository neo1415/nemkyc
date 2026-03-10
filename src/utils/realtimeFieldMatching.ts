/**
 * Real-Time Field Matching Utilities
 * 
 * Provides functions for comparing form field values with verification data.
 * Supports normalization, similarity matching, and date comparison.
 */

import { FieldValidationConfig, FieldValidationState, FieldValidationStatus, generateFieldErrorMessage, IdentifierType } from '@/types/realtimeVerificationValidation';

// ============================================================================
// Comparison Helper Functions
// ============================================================================

/**
 * Calculate similarity score between two strings (0-1)
 * Uses word-based matching for better company/name comparison
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Simple word-based matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  let matchCount = 0;
  for (const word1 of words1) {
    if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      matchCount++;
    }
  }
  
  return matchCount / Math.max(words1.length, words2.length);
};

/**
 * Compare dates (ignoring time)
 * Uses local date components to avoid timezone shifts
 */
export const datesMatch = (date1: Date | string | undefined, date2: Date | string | undefined): boolean => {
  if (!date1 || !date2) return true; // Skip if either is missing
  
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Check if dates are valid
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return true; // Skip comparison if invalid
    }
    
    // Use local date components to preserve the intended date
    // This prevents timezone shifts (e.g., April 1 in GMT+1 becoming March 31 in UTC)
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  } catch (error) {
    console.warn('Date comparison error:', error);
    return true; // Skip comparison on error
  }
};

/**
 * Check if a single field value matches the verified value
 * 
 * @param fieldValue - User-entered field value
 * @param verifiedValue - Value from verification API
 * @param fieldConfig - Field configuration with normalizer
 * @returns True if values match, false otherwise
 */
export const fieldMatches = (
  fieldValue: any,
  verifiedValue: any,
  fieldConfig: FieldValidationConfig
): boolean => {
  console.log(`    [fieldMatches] Comparing field: ${fieldConfig.fieldName}`);
  console.log(`      - Raw field value: "${fieldValue}" (type: ${typeof fieldValue})`);
  console.log(`      - Raw verified value: "${verifiedValue}" (type: ${typeof verifiedValue})`);
  
  // If no verified value, skip validation
  if (verifiedValue === undefined || verifiedValue === null) {
    console.log(`      - Result: SKIP (no verified value)`);
    return true;
  }
  
  // If field is empty, it doesn't match (will be autofilled)
  if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
    console.log(`      - Result: NO MATCH (empty field)`);
    return false;
  }
  
  // Apply normalizer if provided
  const normalizedFieldValue = fieldConfig.normalizer 
    ? fieldConfig.normalizer(fieldValue)
    : fieldValue;
  const normalizedVerifiedValue = fieldConfig.normalizer
    ? fieldConfig.normalizer(verifiedValue)
    : verifiedValue;
  
  console.log(`      - Normalized field value: "${normalizedFieldValue}"`);
  console.log(`      - Normalized verified value: "${normalizedVerifiedValue}"`);
  
  // For dates, use date comparison
  if (fieldValue instanceof Date || verifiedValue instanceof Date || 
      (typeof fieldValue === 'string' && fieldValue.match(/^\d{4}-\d{2}-\d{2}/)) ||
      (typeof verifiedValue === 'string' && verifiedValue.match(/^\d{4}-\d{2}-\d{2}/))) {
    const result = datesMatch(normalizedFieldValue, normalizedVerifiedValue);
    console.log(`      - Date comparison result: ${result}`);
    return result;
  }
  
  // For strings, use similarity comparison with 80% threshold
  if (typeof fieldValue === 'string' && typeof verifiedValue === 'string') {
    const similarity = calculateSimilarity(normalizedFieldValue, normalizedVerifiedValue);
    const result = similarity >= 0.8;
    console.log(`      - Similarity: ${(similarity * 100).toFixed(1)}% (threshold: 80%)`);
    console.log(`      - Result: ${result ? 'MATCH' : 'NO MATCH'}`);
    return result;
  }
  
  // Default: exact match after normalization
  const result = normalizedFieldValue === normalizedVerifiedValue;
  console.log(`      - Exact match result: ${result}`);
  return result;
};

// ============================================================================
// Field State Generation Functions
// ============================================================================

/**
 * Generate field validation state for a matched field
 */
export const createMatchedState = (): FieldValidationState => ({
  status: FieldValidationStatus.MATCHED,
  errorMessage: null,
  showCheckmark: true,
  showError: false
});

/**
 * Generate field validation state for a mismatched field
 */
export const createMismatchedState = (
  fieldLabel: string,
  identifierType: IdentifierType
): FieldValidationState => ({
  status: FieldValidationStatus.MISMATCHED,
  errorMessage: generateFieldErrorMessage(fieldLabel, identifierType),
  showCheckmark: false,
  showError: true
});

/**
 * Generate field validation state for a pending field
 */
export const createPendingState = (): FieldValidationState => ({
  status: FieldValidationStatus.PENDING,
  errorMessage: null,
  showCheckmark: false,
  showError: false
});

/**
 * Generate field validation state for a not verified field
 */
export const createNotVerifiedState = (): FieldValidationState => ({
  status: FieldValidationStatus.NOT_VERIFIED,
  errorMessage: null,
  showCheckmark: false,
  showError: false
});

// ============================================================================
// Batch Field Matching Functions
// ============================================================================

/**
 * Perform matching for ALL configured fields after verification
 * This runs ONCE per verification (not in a loop)
 * 
 * @param formData - Current form data
 * @param verificationData - Data from verification API
 * @param fieldsToValidate - Array of field configurations
 * @param identifierType - Type of identifier (CAC or NIN)
 * @returns Record of field validation states
 */
export const performAllFieldsMatching = (
  formData: Record<string, any>,
  verificationData: any,
  fieldsToValidate: FieldValidationConfig[],
  identifierType: IdentifierType
): Record<string, FieldValidationState> => {
  console.log('[performAllFieldsMatching] ===== STARTING FIELD MATCHING =====');
  console.log('[performAllFieldsMatching] Verification data:', verificationData);
  console.log('[performAllFieldsMatching] Verification data keys:', Object.keys(verificationData));
  console.log('[performAllFieldsMatching] Form data:', formData);
  console.log('[performAllFieldsMatching] Form data keys:', Object.keys(formData));
  
  const newFieldStates: Record<string, FieldValidationState> = {};
  
  for (const fieldConfig of fieldsToValidate) {
    // Handle nested field names (e.g., "directors.0.firstName" -> formData.directors[0].firstName)
    let fieldValue;
    if (fieldConfig.fieldName.includes('.')) {
      const fieldPath = fieldConfig.fieldName.split('.');
      fieldValue = fieldPath.reduce((obj, key) => {
        // Handle array indices (e.g., "0" -> 0)
        const arrayIndex = parseInt(key, 10);
        if (!isNaN(arrayIndex) && Array.isArray(obj)) {
          return obj[arrayIndex];
        }
        return obj?.[key];
      }, formData);
    } else {
      fieldValue = formData[fieldConfig.fieldName];
    }
    
    const verifiedValue = verificationData[fieldConfig.verificationKey];
    
    console.log(`\n[performAllFieldsMatching] ===== CHECKING FIELD: ${fieldConfig.fieldName} =====`);
    console.log(`  - Field label: ${fieldConfig.fieldLabel}`);
    console.log(`  - Verification key: ${fieldConfig.verificationKey}`);
    console.log(`  - Form value (raw): "${fieldValue}"`);
    console.log(`  - Verified value (raw): "${verifiedValue}"`);
    console.log(`  - Form value type: ${typeof fieldValue}`);
    console.log(`  - Verified value type: ${typeof verifiedValue}`);
    
    // Skip validation if no verified value exists
    if (verifiedValue === undefined || verifiedValue === null) {
      console.log(`  - Result: NOT_VERIFIED (no verified value)`);
      newFieldStates[fieldConfig.fieldName] = createNotVerifiedState();
      continue;
    }
    
    // Empty field - will be autofilled, mark as matched
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      console.log(`  - Result: MATCHED (empty field, will be autofilled)`);
      newFieldStates[fieldConfig.fieldName] = createMatchedState();
      continue;
    }
    
    // Check if field matches
    const matches = fieldMatches(fieldValue, verifiedValue, fieldConfig);
    console.log(`  - Field matches: ${matches}`);
    
    if (matches) {
      console.log(`  - Result: MATCHED`);
      newFieldStates[fieldConfig.fieldName] = createMatchedState();
    } else {
      console.log(`  - Result: MISMATCHED`);
      newFieldStates[fieldConfig.fieldName] = createMismatchedState(
        fieldConfig.fieldLabel,
        identifierType
      );
    }
  }
  
  console.log('[performAllFieldsMatching] Final field states:', newFieldStates);
  return newFieldStates;
};

/**
 * Revalidate a SINGLE field using cached verification data
 * This runs on blur of individual fields
 * 
 * @param fieldName - Name of the field to revalidate
 * @param fieldValue - Current value of the field
 * @param verificationData - Cached verification data
 * @param fieldsToValidate - Array of field configurations
 * @param identifierType - Type of identifier (CAC or NIN)
 * @returns Field validation state for this field
 */
export const revalidateSingleField = (
  fieldName: string,
  fieldValue: any,
  verificationData: any,
  fieldsToValidate: FieldValidationConfig[],
  identifierType: IdentifierType
): FieldValidationState => {
  const fieldConfig = fieldsToValidate.find(f => f.fieldName === fieldName);
  
  if (!fieldConfig) {
    console.warn(`Field config not found for field: ${fieldName}`);
    return createNotVerifiedState();
  }
  
  const verifiedValue = verificationData[fieldConfig.verificationKey];
  
  // Skip validation if no verified value exists
  if (verifiedValue === undefined || verifiedValue === null) {
    return createNotVerifiedState();
  }
  
  // Field was cleared - this is a mismatch
  if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
    return createMismatchedState(fieldConfig.fieldLabel, identifierType);
  }
  
  // Check if field matches
  if (fieldMatches(fieldValue, verifiedValue, fieldConfig)) {
    return createMatchedState();
  } else {
    return createMismatchedState(fieldConfig.fieldLabel, identifierType);
  }
};

// ============================================================================
// Validation State Helpers
// ============================================================================

/**
 * Check if any field is mismatched
 */
export const hasAnyMismatches = (fieldStates: Record<string, FieldValidationState>): boolean => {
  return Object.values(fieldStates).some(
    state => state.status === FieldValidationStatus.MISMATCHED
  );
};

/**
 * Get list of mismatched field labels
 */
export const getMismatchedFieldLabels = (
  fieldStates: Record<string, FieldValidationState>,
  fieldsToValidate: FieldValidationConfig[]
): string[] => {
  const mismatchedFields: string[] = [];
  
  for (const [fieldName, state] of Object.entries(fieldStates)) {
    if (state.status === FieldValidationStatus.MISMATCHED) {
      const config = fieldsToValidate.find(f => f.fieldName === fieldName);
      if (config) {
        mismatchedFields.push(config.fieldLabel);
      }
    }
  }
  
  return mismatchedFields;
};

/**
 * Check if all fields have been validated
 */
export const allFieldsValidated = (
  fieldStates: Record<string, FieldValidationState>,
  fieldsToValidate: FieldValidationConfig[]
): boolean => {
  // Check if all configured fields have a state
  for (const fieldConfig of fieldsToValidate) {
    const state = fieldStates[fieldConfig.fieldName];
    if (!state || state.status === FieldValidationStatus.NOT_VERIFIED) {
      return false;
    }
  }
  
  return true;
};
