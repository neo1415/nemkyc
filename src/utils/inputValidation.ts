/**
 * Input Validation Utilities
 * Runtime validation for user inputs before API calls
 */

/**
 * Sanitize string input
 * Removes potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number
 * Accepts various formats: +234..., 0..., etc.
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSizeInMB: number = 3): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();
  
  return allowedTypes.some(type => 
    type.toLowerCase() === fileExtension || 
    type.toLowerCase() === mimeType
  );
}

/**
 * Validate date is not in the future
 */
export function isNotFutureDate(date: string | Date): boolean {
  const inputDate = new Date(date);
  const now = new Date();
  return inputDate <= now;
}

/**
 * Validate date is not too old
 */
export function isNotTooOld(date: string | Date, maxYears: number = 150): boolean {
  const inputDate = new Date(date);
  const now = new Date();
  const yearsDiff = (now.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return yearsDiff <= maxYears;
}

/**
 * Validate BVN (Bank Verification Number)
 * Must be exactly 11 digits
 */
export function isValidBVN(bvn: string): boolean {
  return /^\d{11}$/.test(bvn);
}

/**
 * Validate currency amount
 * Must be a positive number
 */
export function isValidCurrency(amount: string | number): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(num) && num >= 0;
}

/**
 * Validate required field
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate string length
 */
export function isValidLength(value: string, min: number, max: number): boolean {
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate form data before submission
 * Returns array of error messages
 */
export function validateFormData(data: Record<string, any>, rules: Record<string, ValidationRule[]>): string[] {
  const errors: string[] = [];
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      const error = rule.validate(value, field);
      if (error) {
        errors.push(error);
      }
    }
  }
  
  return errors;
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
  validate: (value: any, fieldName: string) => string | null;
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (message?: string): ValidationRule => ({
    validate: (value, fieldName) => 
      isRequired(value) ? null : (message || `${fieldName} is required`)
  }),
  
  email: (message?: string): ValidationRule => ({
    validate: (value, fieldName) => 
      !value || isValidEmail(value) ? null : (message || `${fieldName} must be a valid email`)
  }),
  
  phone: (message?: string): ValidationRule => ({
    validate: (value, fieldName) => 
      !value || isValidPhone(value) ? null : (message || `${fieldName} must be a valid phone number`)
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value, fieldName) => 
      !value || value.length >= min ? null : (message || `${fieldName} must be at least ${min} characters`)
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value, fieldName) => 
      !value || value.length <= max ? null : (message || `${fieldName} must be at most ${max} characters`)
  }),
  
  bvn: (message?: string): ValidationRule => ({
    validate: (value, fieldName) => 
      !value || isValidBVN(value) ? null : (message || `${fieldName} must be exactly 11 digits`)
  }),
  
  currency: (message?: string): ValidationRule => ({
    validate: (value, fieldName) => 
      !value || isValidCurrency(value) ? null : (message || `${fieldName} must be a valid amount`)
  }),
};

/**
 * Example usage:
 * 
 * const errors = validateFormData(formData, {
 *   email: [ValidationRules.required(), ValidationRules.email()],
 *   phone: [ValidationRules.required(), ValidationRules.phone()],
 *   bvn: [ValidationRules.required(), ValidationRules.bvn()],
 * });
 * 
 * if (errors.length > 0) {
 *   // Show errors to user
 * }
 */
