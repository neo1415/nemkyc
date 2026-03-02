/**
 * Password Validation Utility
 * 
 * Frontend utility for password strength validation.
 * Validates password complexity requirements and provides strength scoring.
 */

// ========== Type Definitions ==========

export interface PasswordRequirements {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  requirements: PasswordRequirements;
  errors: string[];
  strength: PasswordStrength;
}

export type PasswordStrength = 'weak' | 'medium' | 'strong';

// ========== Constants ==========

const MIN_LENGTH = 12;
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /[0-9]/;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/;

// ========== Validation Functions ==========

/**
 * Validate password strength and requirements
 * 
 * Requirements:
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * 
 * @param password - Password to validate
 * @returns Validation result with requirements and strength
 * 
 * @example
 * const result = validatePasswordStrength('MyP@ssw0rd123');
 * // Returns: { valid: true, requirements: {...}, errors: [], strength: 'strong' }
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      requirements: {
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false
      },
      errors: ['Password is required'],
      strength: 'weak'
    };
  }

  // Check each requirement
  const requirements: PasswordRequirements = {
    hasMinLength: password.length >= MIN_LENGTH,
    hasUppercase: UPPERCASE_REGEX.test(password),
    hasLowercase: LOWERCASE_REGEX.test(password),
    hasNumber: NUMBER_REGEX.test(password),
    hasSpecialChar: SPECIAL_CHAR_REGEX.test(password)
  };

  // Build error messages
  const errors: string[] = [];
  if (!requirements.hasMinLength) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters`);
  }
  if (!requirements.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!requirements.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!requirements.hasNumber) {
    errors.push('Password must contain at least one number');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  // Calculate strength
  const strength = getPasswordStrengthScore(password, requirements);

  return {
    valid: errors.length === 0,
    requirements,
    errors,
    strength
  };
}

/**
 * Get password strength score
 * 
 * Scoring:
 * - Weak: 0-2 requirements met
 * - Medium: 3-4 requirements met
 * - Strong: All 5 requirements met
 * 
 * @param password - Password to score
 * @param requirements - Optional pre-calculated requirements
 * @returns Strength score
 * 
 * @example
 * const strength = getPasswordStrengthScore('MyP@ssw0rd123');
 * // Returns: 'strong'
 */
export function getPasswordStrengthScore(
  password: string,
  requirements?: PasswordRequirements
): PasswordStrength {
  if (!password) {
    return 'weak';
  }

  // Calculate requirements if not provided
  const reqs = requirements || {
    hasMinLength: password.length >= MIN_LENGTH,
    hasUppercase: UPPERCASE_REGEX.test(password),
    hasLowercase: LOWERCASE_REGEX.test(password),
    hasNumber: NUMBER_REGEX.test(password),
    hasSpecialChar: SPECIAL_CHAR_REGEX.test(password)
  };

  // Count met requirements
  const metCount = Object.values(reqs).filter(Boolean).length;

  // Determine strength
  if (metCount === 5) {
    return 'strong';
  } else if (metCount >= 3) {
    return 'medium';
  } else {
    return 'weak';
  }
}

/**
 * Get password strength as percentage (0-100)
 * 
 * @param password - Password to score
 * @returns Percentage (0-100)
 * 
 * @example
 * const percentage = getPasswordStrengthPercentage('MyP@ssw0rd123');
 * // Returns: 100
 */
export function getPasswordStrengthPercentage(password: string): number {
  if (!password) {
    return 0;
  }

  const requirements = {
    hasMinLength: password.length >= MIN_LENGTH,
    hasUppercase: UPPERCASE_REGEX.test(password),
    hasLowercase: LOWERCASE_REGEX.test(password),
    hasNumber: NUMBER_REGEX.test(password),
    hasSpecialChar: SPECIAL_CHAR_REGEX.test(password)
  };

  const metCount = Object.values(requirements).filter(Boolean).length;
  return Math.round((metCount / 5) * 100);
}

/**
 * Get color for password strength indicator
 * 
 * @param strength - Password strength
 * @returns Color code
 */
export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'strong':
      return '#4caf50'; // Green
    case 'medium':
      return '#ff9800'; // Orange
    case 'weak':
    default:
      return '#f44336'; // Red
  }
}

/**
 * Get label for password strength
 * 
 * @param strength - Password strength
 * @returns Human-readable label
 */
export function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'strong':
      return 'Strong';
    case 'medium':
      return 'Medium';
    case 'weak':
    default:
      return 'Weak';
  }
}

/**
 * Check if two passwords match
 * 
 * @param password - First password
 * @param confirmPassword - Second password
 * @returns True if passwords match
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword && password.length > 0;
}

/**
 * Validate password confirmation
 * 
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Validation result
 */
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): { valid: boolean; error?: string } {
  if (!confirmPassword) {
    return {
      valid: false,
      error: 'Please confirm your password'
    };
  }

  if (password !== confirmPassword) {
    return {
      valid: false,
      error: 'Passwords do not match'
    };
  }

  return { valid: true };
}

export default {
  validatePasswordStrength,
  getPasswordStrengthScore,
  getPasswordStrengthPercentage,
  getStrengthColor,
  getStrengthLabel,
  passwordsMatch,
  validatePasswordConfirmation
};
