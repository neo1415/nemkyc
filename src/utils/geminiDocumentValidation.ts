// Validation utilities for Gemini Document Verification

import { PROCESSING_LIMITS, SUPPORTED_FILE_TYPES } from '../config/geminiDocumentVerification';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DocumentValidator {
  /**
   * Validate file size and format
   */
  static validateFile(file: File): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check file size
    const isPDF = file.type === 'application/pdf';
    const maxSize = isPDF ? PROCESSING_LIMITS.maxFileSize.pdf : PROCESSING_LIMITS.maxFileSize.image;
    
    if (file.size > maxSize) {
      result.isValid = false;
      result.errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum limit of ${this.formatFileSize(maxSize)}`);
    }

    // Check file type
    const allSupportedTypes = [
      ...SUPPORTED_FILE_TYPES.pdf,
      ...SUPPORTED_FILE_TYPES.image
    ];

    if (!allSupportedTypes.includes(file.type)) {
      result.isValid = false;
      result.errors.push(`File type ${file.type} is not supported. Supported types: PDF, PNG, JPEG`);
    }

    // Add warnings for large files
    if (file.size > 5 * 1024 * 1024) { // 5MB
      result.warnings.push('Large files may take longer to process');
    }

    return result;
  }

  /**
   * Validate extracted CAC data
   */
  static validateCACData(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Required fields - be more lenient for testing
    const requiredFields = ['companyName', 'rcNumber'];
    
    for (const field of requiredFields) {
      if (!data[field] || typeof data[field] !== 'string' || data[field].trim().length < 2) {
        result.isValid = false;
        result.errors.push(`Missing or invalid ${field}`);
      }
    }

    // Validate RC number format - be more lenient
    if (data.rcNumber && data.rcNumber.trim().length >= 6 && !this.isValidRCNumber(data.rcNumber)) {
      result.warnings.push('RC number format may be non-standard');
    }

    // Validate date format
    if (data.registrationDate && !this.isValidDate(data.registrationDate)) {
      result.warnings.push('Registration date format may be incorrect');
    }

    // Validate directors array
    if (data.directors && Array.isArray(data.directors)) {
      data.directors.forEach((director: any, index: number) => {
        if (typeof director === 'string') {
          // Handle string directors
          if (!director || director.trim().length < 2) {
            result.warnings.push(`Director ${index + 1} name too short`);
          }
        } else if (!director.name || typeof director.name !== 'string') {
          result.warnings.push(`Director ${index + 1} missing name`);
        }
      });
    }

    return result;
  }

  /**
   * Validate extracted individual data
   */
  static validateIndividualData(data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Handle case where we get firstName/lastName instead of fullName
    if (!data.fullName && (data.firstName || data.lastName)) {
      const nameParts = [];
      if (data.firstName) nameParts.push(data.firstName);
      if (data.middleName) nameParts.push(data.middleName);
      if (data.lastName) nameParts.push(data.lastName);
      data.fullName = nameParts.join(' ').trim();
    }

    // Required fields - fullName is the only truly required field
    if (!data.fullName || typeof data.fullName !== 'string' || data.fullName.trim().length < 2) {
      result.isValid = false;
      result.errors.push('Missing or invalid fullName');
    }

    // dateOfBirth is now optional - only validate if present
    if (data.dateOfBirth && typeof data.dateOfBirth === 'string' && data.dateOfBirth.trim() !== '') {
      // Validate date of birth format if provided
      if (!this.isValidDate(data.dateOfBirth) && !data.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
        result.warnings.push('Date of birth format may be incorrect');
      }
    } else if (data.dateOfBirth === null || data.dateOfBirth === undefined || data.dateOfBirth === '') {
      // dateOfBirth is missing but that's okay now
      result.warnings.push('Date of birth not found in document');
    }

    // Check for reasonable names
    if (data.fullName && data.fullName.trim().length < 3) {
      result.warnings.push('Full name seems too short');
    }

    // Check if we have at least some useful information
    if (!data.fullName && !data.firstName && !data.lastName) {
      result.isValid = false;
      result.errors.push('No name information found in document');
    }

    return result;
  }

  /**
   * Validate RC number format (RC followed by numbers)
   */
  private static isValidRCNumber(rcNumber: string): boolean {
    const rcPattern = /^RC\d+$/i;
    return rcPattern.test(rcNumber.replace(/\s+/g, ''));
  }

  /**
   * Validate date format (DD/MM/YYYY)
   */
  private static isValidDate(dateString: string): boolean {
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!datePattern.test(dateString)) {
      return false;
    }

    const [day, month, year] = dateString.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.getDate() === day && 
           date.getMonth() === month - 1 && 
           date.getFullYear() === year;
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Sanitize extracted data to remove potential security risks
 */
export function sanitizeExtractedData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };

  // Remove any script tags or HTML
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
  });

  return sanitized;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: any, sensitiveFields: string[] = []): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const masked = { ...data };

  sensitiveFields.forEach(field => {
    if (masked[field] && typeof masked[field] === 'string') {
      const value = masked[field];
      if (value.length > 4) {
        masked[field] = value.substring(0, 4) + '*'.repeat(value.length - 4);
      } else {
        masked[field] = '*'.repeat(value.length);
      }
    }
  });

  return masked;
}