/**
 * Identity Format Validator
 * 
 * Provides client-side format validation for identity numbers (NIN and CAC/RC)
 * without making API calls. This is used to provide instant feedback to users
 * and prevent invalid formats from triggering expensive verification APIs.
 */

export interface FormatValidationResult {
  valid: boolean;
  error?: string;
  fieldName: string;
}

/**
 * Validates NIN (National Identity Number) format
 * 
 * Requirements:
 * - Must be exactly 11 digits
 * - No letters, spaces, or special characters allowed
 * 
 * @param nin - The NIN string to validate
 * @returns FormatValidationResult with validation status and error message if invalid
 */
export function validateNINFormat(nin: string): FormatValidationResult {
  const fieldName = 'NIN';
  
  // Check for null, undefined, or empty string
  if (!nin || nin.trim() === '') {
    return {
      valid: false,
      error: 'NIN is required',
      fieldName
    };
  }
  
  // Remove any whitespace for validation
  const trimmedNIN = nin.trim();
  
  // Check if it contains only digits
  if (!/^\d+$/.test(trimmedNIN)) {
    return {
      valid: false,
      error: 'NIN must contain only numbers',
      fieldName
    };
  }
  
  // Check if it's exactly 11 digits
  if (trimmedNIN.length !== 11) {
    return {
      valid: false,
      error: 'NIN must be exactly 11 digits',
      fieldName
    };
  }
  
  return {
    valid: true,
    fieldName
  };
}

/**
 * Validates CAC/RC (Corporate Affairs Commission Registration) number format
 * 
 * Requirements:
 * - Must start with "RC" (case-insensitive)
 * - Must be followed by one or more digits
 * 
 * @param cac - The CAC/RC number string to validate
 * @returns FormatValidationResult with validation status and error message if invalid
 */
export function validateCACFormat(cac: string): FormatValidationResult {
  const fieldName = 'CAC/RC';
  
  // Check for null, undefined, or empty string
  if (!cac || cac.trim() === '') {
    return {
      valid: false,
      error: 'CAC/RC number is required',
      fieldName
    };
  }
  
  // Remove any whitespace for validation
  const trimmedCAC = cac.trim();
  
  // Check if it starts with "RC" (case-insensitive) followed by digits only
  // This single regex checks both conditions: starts with RC and has only digits after
  if (!/^RC\d+$/i.test(trimmedCAC)) {
    // Determine specific error message
    if (!/^RC/i.test(trimmedCAC)) {
      return {
        valid: false,
        error: 'CAC/RC number must start with "RC"',
        fieldName
      };
    } else {
      return {
        valid: false,
        error: 'CAC/RC number must have digits after "RC"',
        fieldName
      };
    }
  }
  
  return {
    valid: true,
    fieldName
  };
}
