/**
 * Identity Format Validator
 * 
 * Validates identity number formats before verification to catch invalid entries early
 * and optimize performance by avoiding unnecessary duplicate checks and API calls.
 * 
 * Validation Rules:
 * - NIN: Exactly 11 digits, no letters or special characters
 * - BVN: Exactly 11 digits, no letters or special characters
 * - CAC: Variable format, minimum 5 characters, alphanumeric with hyphens allowed
 * 
 * Requirements: 8.1, 8.2, 8.3
 */

const { decryptData, isEncrypted } = require('./encryption.cjs');

/**
 * Validation result type
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the identity format is valid
 * @property {string|null} errorReason - Reason for validation failure (null if valid)
 */

/**
 * Validate identity format
 * 
 * @param {string} identityType - 'NIN', 'BVN', or 'CAC'
 * @param {string|Object} identityValue - The identity number (can be encrypted object or plain string)
 * @returns {ValidationResult}
 */
function validateIdentityFormat(identityType, identityValue) {
  try {
    // Handle null or undefined
    if (identityValue === null || identityValue === undefined) {
      return {
        isValid: false,
        errorReason: 'identity_value_missing'
      };
    }

    // Decrypt if encrypted
    let decryptedValue = identityValue;
    if (typeof identityValue === 'object' && isEncrypted(identityValue)) {
      try {
        decryptedValue = decryptData(identityValue.encrypted, identityValue.iv);
      } catch (err) {
        console.error(`Failed to decrypt identity value for format validation:`, err.message);
        return {
          isValid: false,
          errorReason: 'decryption_failed'
        };
      }
    }

    // Ensure we have a string
    if (typeof decryptedValue !== 'string') {
      return {
        isValid: false,
        errorReason: 'invalid_type'
      };
    }

    // Trim whitespace
    const trimmedValue = decryptedValue.trim();

    // Check for empty string
    if (trimmedValue.length === 0) {
      return {
        isValid: false,
        errorReason: 'empty_value'
      };
    }

    // Validate based on identity type
    const upperType = identityType.toUpperCase();

    switch (upperType) {
      case 'NIN':
        return validateNIN(trimmedValue);
      
      case 'BVN':
        return validateBVN(trimmedValue);
      
      case 'CAC':
        return validateCAC(trimmedValue);
      
      default:
        return {
          isValid: false,
          errorReason: 'unknown_identity_type'
        };
    }

  } catch (error) {
    console.error('Identity format validation error:', error.message);
    return {
      isValid: false,
      errorReason: 'validation_error'
    };
  }
}

/**
 * Validate NIN format
 * Rule: Exactly 11 digits, no letters or special characters
 * 
 * @param {string} value - The NIN value to validate
 * @returns {ValidationResult}
 */
function validateNIN(value) {
  // Check length
  if (value.length !== 11) {
    return {
      isValid: false,
      errorReason: 'nin_invalid_length'
    };
  }

  // Check that all characters are digits
  if (!/^\d{11}$/.test(value)) {
    return {
      isValid: false,
      errorReason: 'nin_contains_non_digits'
    };
  }

  return {
    isValid: true,
    errorReason: null
  };
}

/**
 * Validate BVN format
 * Rule: Exactly 11 digits, no letters or special characters
 * 
 * @param {string} value - The BVN value to validate
 * @returns {ValidationResult}
 */
function validateBVN(value) {
  // Check length
  if (value.length !== 11) {
    return {
      isValid: false,
      errorReason: 'bvn_invalid_length'
    };
  }

  // Check that all characters are digits
  if (!/^\d{11}$/.test(value)) {
    return {
      isValid: false,
      errorReason: 'bvn_contains_non_digits'
    };
  }

  return {
    isValid: true,
    errorReason: null
  };
}

/**
 * Validate CAC format
 * Rule: Variable format, minimum 5 characters, alphanumeric with hyphens allowed
 * 
 * @param {string} value - The CAC value to validate
 * @returns {ValidationResult}
 */
function validateCAC(value) {
  // Check minimum length
  if (value.length < 5) {
    return {
      isValid: false,
      errorReason: 'cac_too_short'
    };
  }

  // Check that value contains only alphanumeric characters and hyphens
  // Allow uppercase and lowercase letters, digits, and hyphens
  if (!/^[A-Za-z0-9-]+$/.test(value)) {
    return {
      isValid: false,
      errorReason: 'cac_invalid_characters'
    };
  }

  return {
    isValid: true,
    errorReason: null
  };
}

/**
 * Batch validate multiple identities
 * More convenient when processing multiple entries
 * 
 * @param {Array<{type: string, value: string|Object, entryId: string}>} identities
 * @returns {Map<string, ValidationResult>}
 */
function batchValidateIdentities(identities) {
  const results = new Map();

  for (const identity of identities) {
    const result = validateIdentityFormat(identity.type, identity.value);
    results.set(identity.entryId, result);
  }

  return results;
}

module.exports = {
  validateIdentityFormat,
  batchValidateIdentities
};
