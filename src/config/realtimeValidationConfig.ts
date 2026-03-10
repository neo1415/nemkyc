/**
 * Real-Time Verification Field Validation Configuration
 * 
 * This file contains field validation configurations for all four form types:
 * - Corporate KYC
 * - Corporate NFIU
 * - Individual KYC
 * - Individual NFIU
 * 
 * Each configuration specifies which fields should be validated against
 * verification API responses and how to normalize the data for comparison.
 */

import { FieldValidationConfig, FormTypeWithValidation, IdentifierType } from '@/types/realtimeVerificationValidation';

// ============================================================================
// Normalization Functions
// ============================================================================

/**
 * Normalize text for comparison (case-insensitive, trim whitespace, remove extra spaces)
 */
export const normalizeText = (value: any): string => {
  if (!value) return '';
  return value.toString().toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Normalize date to ISO string format
 * Uses local date components to avoid timezone shifts
 * Handles both Date objects and DD-MM-YYYY string format from API
 */
export const normalizeDate = (value: any): string => {
  if (!value) return '';
  
  // Handle DD-MM-YYYY format from API (e.g., "14-12-1998")
  if (typeof value === 'string' && value.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
    const [day, month, year] = value.split('-');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`; // Convert to YYYY-MM-DD
  }
  
  // Handle Date objects and other date strings
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  
  // Use local date components to preserve the intended date
  // This prevents timezone shifts (e.g., April 1 in GMT+1 becoming March 31 in UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`; // YYYY-MM-DD format
};

/**
 * Normalize gender values (M/Male, F/Female)
 */
export const normalizeGender = (value: any): string => {
  if (!value) return '';
  const normalized = normalizeText(value);
  
  // Map common variations to M or F
  if (['male', 'm', 'man'].includes(normalized)) return 'm';
  if (['female', 'f', 'woman'].includes(normalized)) return 'f';
  
  return normalized;
};

/**
 * Normalize RC number (remove spaces, convert to uppercase)
 */
export const normalizeRCNumber = (value: any): string => {
  if (!value) return '';
  return value.toString().toUpperCase().replace(/\s+/g, '');
};

/**
 * Normalize company name (remove common suffixes for better matching)
 */
export const normalizeCompanyName = (value: any): string => {
  if (!value) return '';
  let normalized = normalizeText(value);
  
  // Remove common company suffixes
  const suffixes = ['ltd', 'limited', 'plc', 'inc', 'llc', 'corp', 'corporation'];
  for (const suffix of suffixes) {
    const regex = new RegExp(`\\b${suffix}\\b\\.?$`, 'i');
    normalized = normalized.replace(regex, '').trim();
  }
  
  return normalized;
};

// ============================================================================
// CAC Field Configurations (Corporate Forms)
// ============================================================================

/**
 * Field validation configuration for Corporate KYC form
 * Uses CAC verification data
 */
export const CAC_FIELDS_CONFIG: FieldValidationConfig[] = [
  {
    fieldName: 'insured',
    fieldLabel: 'Company Name',
    verificationKey: 'name',
    normalizer: normalizeCompanyName
  },
  {
    fieldName: 'dateOfIncorporationRegistration',
    fieldLabel: 'Incorporation Date',
    verificationKey: 'registrationDate',
    normalizer: normalizeDate
  },
  {
    fieldName: 'officeAddress',
    fieldLabel: 'Office Address',
    verificationKey: 'address',
    normalizer: normalizeText
  },
  {
    fieldName: 'natureOfBusiness',
    fieldLabel: 'Business Type/Occupation',
    verificationKey: 'typeOfEntity',
    normalizer: normalizeText
  }
];

/**
 * Field validation configuration for Corporate NFIU form
 * Uses CAC verification data (with incorporationNumber field)
 * Note: Corporate NFIU uses the same field names as Corporate KYC
 */
export const CORPORATE_NFIU_CAC_FIELDS_CONFIG: FieldValidationConfig[] = [
  {
    fieldName: 'insured',
    fieldLabel: 'Company Name',
    verificationKey: 'name',
    normalizer: normalizeCompanyName
  },
  {
    fieldName: 'dateOfIncorporationRegistration',
    fieldLabel: 'Incorporation Date',
    verificationKey: 'registrationDate',
    normalizer: normalizeDate
  },
  {
    fieldName: 'officeAddress',
    fieldLabel: 'Office Address',
    verificationKey: 'address',
    normalizer: normalizeText
  },
  {
    fieldName: 'businessTypeOccupation',
    fieldLabel: 'Business Type/Occupation',
    verificationKey: 'typeOfEntity',
    normalizer: normalizeText
  }
];

// ============================================================================
// NIN Field Configurations (Individual Forms)
// ============================================================================

/**
 * Field validation configuration for Individual KYC form
 * Uses NIN verification data
 */
export const NIN_FIELDS_CONFIG: FieldValidationConfig[] = [
  {
    fieldName: 'firstName',
    fieldLabel: 'First Name',
    verificationKey: 'firstName', // API returns firstName (camelCase)
    normalizer: normalizeText
  },
  {
    fieldName: 'lastName',
    fieldLabel: 'Last Name',
    verificationKey: 'lastName', // API returns lastName (not surname)
    normalizer: normalizeText
  },
  {
    fieldName: 'dateOfBirth',
    fieldLabel: 'Date of Birth',
    verificationKey: 'birthdate',
    normalizer: normalizeDate
  },
  {
    fieldName: 'gender',
    fieldLabel: 'Gender',
    verificationKey: 'gender',
    normalizer: normalizeGender
  }
];

/**
 * Field validation configuration for Individual NFIU form
 * Uses NIN verification data
 */
export const INDIVIDUAL_NFIU_NIN_FIELDS_CONFIG: FieldValidationConfig[] = [
  {
    fieldName: 'firstName',
    fieldLabel: 'First Name',
    verificationKey: 'firstName', // API returns firstName (camelCase)
    normalizer: normalizeText
  },
  {
    fieldName: 'lastName',
    fieldLabel: 'Last Name',
    verificationKey: 'lastName', // API returns lastName (not surname)
    normalizer: normalizeText
  },
  {
    fieldName: 'dateOfBirth',
    fieldLabel: 'Date of Birth',
    verificationKey: 'birthdate',
    normalizer: normalizeDate
  },
  {
    fieldName: 'gender',
    fieldLabel: 'Gender',
    verificationKey: 'gender',
    normalizer: normalizeGender
  }
];

// ============================================================================
// Form Type Configuration Map
// ============================================================================

/**
 * Complete configuration map for all form types
 */
export interface FormValidationConfig {
  identifierFieldName: string;
  identifierType: IdentifierType;
  fieldsToValidate: FieldValidationConfig[];
}

export const FIELD_VALIDATION_CONFIGS: Record<FormTypeWithValidation, FormValidationConfig> = {
  'Corporate KYC': {
    identifierFieldName: 'cacNumber',
    identifierType: 'CAC',
    fieldsToValidate: CAC_FIELDS_CONFIG
  },
  'Corporate NFIU': {
    identifierFieldName: 'incorporationNumber',
    identifierType: 'CAC',
    fieldsToValidate: CORPORATE_NFIU_CAC_FIELDS_CONFIG
  },
  'Individual KYC': {
    identifierFieldName: 'NIN',
    identifierType: 'NIN',
    fieldsToValidate: NIN_FIELDS_CONFIG
  },
  'Individual NFIU': {
    identifierFieldName: 'NIN',
    identifierType: 'NIN',
    fieldsToValidate: INDIVIDUAL_NFIU_NIN_FIELDS_CONFIG
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get validation configuration for a specific form type
 */
export const getValidationConfigForForm = (formType: FormTypeWithValidation): FormValidationConfig => {
  return FIELD_VALIDATION_CONFIGS[formType];
};

/**
 * Get field configuration by field name
 */
export const getFieldConfig = (
  formType: FormTypeWithValidation,
  fieldName: string
): FieldValidationConfig | undefined => {
  const config = FIELD_VALIDATION_CONFIGS[formType];
  return config.fieldsToValidate.find(f => f.fieldName === fieldName);
};

/**
 * Check if a form type supports real-time validation
 */
export const supportsRealtimeValidation = (formType: string): formType is FormTypeWithValidation => {
  return formType in FIELD_VALIDATION_CONFIGS;
};
