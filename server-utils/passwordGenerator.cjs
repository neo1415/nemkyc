/**
 * Password Generator Utility
 * 
 * Generates cryptographically secure passwords for user account creation.
 * Meets complexity requirements: minimum 12 characters with uppercase, lowercase, numbers, and special characters.
 * 
 * Security Features:
 * - Uses crypto.randomInt() for cryptographically secure random generation
 * - Ensures at least one character from each required category
 * - Shuffles password to avoid predictable patterns
 * - Configurable length (default: 12 characters)
 */

const crypto = require('crypto');

// Character sets for password generation
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generates a cryptographically secure password
 * 
 * Password Requirements:
 * - Minimum 12 characters (configurable)
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 numeric digit
 * - At least 1 special character
 * - Shuffled to avoid predictable patterns
 * 
 * @param {number} length - Password length (default: 12, minimum: 12)
 * @returns {string} Generated password
 * @throws {Error} If length is less than 12
 * 
 * @example
 * const password = generateSecurePassword();
 * // Returns: "aB3$xY9!mN2@" (example, actual output is random)
 * 
 * const longerPassword = generateSecurePassword(16);
 * // Returns: "aB3$xY9!mN2@pQ7%" (example, actual output is random)
 */
function generateSecurePassword(length = 12) {
  // Validate length
  if (typeof length !== 'number' || length < 12) {
    throw new Error('Password length must be at least 12 characters');
  }
  
  try {
    // Ensure at least one character from each required category
    let password = '';
    password += UPPERCASE[crypto.randomInt(0, UPPERCASE.length)];
    password += LOWERCASE[crypto.randomInt(0, LOWERCASE.length)];
    password += NUMBERS[crypto.randomInt(0, NUMBERS.length)];
    password += SPECIAL[crypto.randomInt(0, SPECIAL.length)];
    
    // Fill remaining length with random characters from all sets
    const allChars = UPPERCASE + LOWERCASE + NUMBERS + SPECIAL;
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(0, allChars.length)];
    }
    
    // Shuffle the password to avoid predictable patterns
    // Convert to array, shuffle using Fisher-Yates algorithm, join back
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    return passwordArray.join('');
  } catch (error) {
    console.error('❌ Password generation error:', error.message);
    throw new Error('Failed to generate secure password');
  }
}

/**
 * Validates if a password meets complexity requirements
 * 
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 * @returns {boolean} return.valid - Whether password meets all requirements
 * @returns {Object} return.requirements - Individual requirement checks
 * @returns {string[]} return.errors - Array of error messages for failed requirements
 * 
 * @example
 * const result = validatePasswordComplexity('aB3$xY9!mN2@');
 * // Returns: { valid: true, requirements: {...}, errors: [] }
 * 
 * const result2 = validatePasswordComplexity('short');
 * // Returns: { valid: false, requirements: {...}, errors: ['Password must be at least 12 characters'] }
 */
function validatePasswordComplexity(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      requirements: {},
      errors: ['Password must be a non-empty string']
    };
  }
  
  const requirements = {
    hasMinLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
  };
  
  const errors = [];
  if (!requirements.hasMinLength) errors.push('Password must be at least 12 characters');
  if (!requirements.hasUppercase) errors.push('Password must contain at least one uppercase letter');
  if (!requirements.hasLowercase) errors.push('Password must contain at least one lowercase letter');
  if (!requirements.hasNumber) errors.push('Password must contain at least one number');
  if (!requirements.hasSpecialChar) errors.push('Password must contain at least one special character');
  
  return {
    valid: errors.length === 0,
    requirements,
    errors
  };
}

module.exports = {
  generateSecurePassword,
  validatePasswordComplexity
};
