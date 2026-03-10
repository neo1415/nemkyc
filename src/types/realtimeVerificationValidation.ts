/**
 * Real-Time Verification Field Validation Type Definitions
 * 
 * This file contains all TypeScript interfaces, types, and enums for the real-time
 * verification field validation feature. The system validates user-entered data against
 * verification API responses in real-time, provides immediate field-level visual feedback
 * on mismatched fields, and prevents form progression until all fields match verified data.
 */

import { UseFormReturn } from 'react-hook-form';

// ============================================================================
// Enums
// ============================================================================

/**
 * Validation status for individual fields
 */
export enum FieldValidationStatus {
  NOT_VERIFIED = 'not_verified',
  PENDING = 'pending',
  MATCHED = 'matched',
  MISMATCHED = 'mismatched'
}

/**
 * Error codes for verification API errors
 */
export enum VerificationErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_FORMAT = 'INVALID_FORMAT',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  MALFORMED_RESPONSE = 'MALFORMED_RESPONSE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Identifier types for verification
 */
export type IdentifierType = 'CAC' | 'NIN';

/**
 * Form types that support real-time validation
 */
export type FormTypeWithValidation = 
  | 'Corporate KYC' 
  | 'Corporate NFIU' 
  | 'Individual KYC' 
  | 'Individual NFIU';

// ============================================================================
// Field Configuration Interfaces
// ============================================================================

/**
 * Configuration for a single field to be validated
 */
export interface FieldValidationConfig {
  /** Form field name (matches react-hook-form field name) */
  fieldName: string;
  
  /** Human-readable field label for error messages */
  fieldLabel: string;
  
  /** Key in verification API response that corresponds to this field */
  verificationKey: string;
  
  /** Optional normalization function to apply before comparison */
  normalizer?: (value: any) => any;
}

/**
 * Complete configuration for real-time validation on a form
 */
export interface UseRealtimeVerificationValidationConfig {
  /** Type of form being validated */
  formType: FormTypeWithValidation;
  
  /** Name of the identifier field (e.g., 'cacNumber', 'NIN') */
  identifierFieldName: string;
  
  /** Type of identifier (CAC or NIN) */
  identifierType: IdentifierType;
  
  /** Array of fields to validate against verification data */
  fieldsToValidate: FieldValidationConfig[];
  
  /** React Hook Form methods */
  formMethods: UseFormReturn<any>;
  
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
}

// ============================================================================
// Validation State Interfaces
// ============================================================================

/**
 * Validation state for a single field
 */
export interface FieldValidationState {
  /** Current validation status */
  status: FieldValidationStatus;
  
  /** Error message to display (null if no error) */
  errorMessage: string | null;
  
  /** Whether to show green checkmark icon */
  showCheckmark: boolean;
  
  /** Whether to show error styling and message */
  showError: boolean;
}

/**
 * Props to apply to a field for validation
 */
export interface FieldValidationProps {
  /** ARIA attribute for invalid state */
  'aria-invalid': boolean;
  
  /** ARIA attribute linking to error message */
  'aria-describedby': string | undefined;
  
  /** CSS classes for styling (includes border colors) */
  className: string;
  
  /** Blur handler for revalidation */
  onBlur: (e: React.FocusEvent) => void;
}

/**
 * Return type of useRealtimeVerificationValidation hook
 */
export interface UseRealtimeVerificationValidationReturn {
  // State
  /** Validation states for all fields (keyed by field name) */
  fieldValidationStates: Record<string, FieldValidationState>;
  
  /** Whether verification has been triggered */
  isVerificationTriggered: boolean;
  
  /** Whether verification is currently in progress */
  isVerifying: boolean;
  
  /** Whether user can proceed to next step */
  canProceedToNextStep: boolean;
  
  /** Error from verification API (shown on identifier field) */
  verificationError: string | null;
  
  // Functions
  /** Attach blur listener to identifier field */
  attachToIdentifierField: (inputElement: HTMLInputElement) => void;
  
  /** Get validation props for a specific field */
  getFieldValidationProps: (fieldName: string) => FieldValidationProps;
  
  /** Clear all validation state */
  clearValidation: () => void;
  
  /** Revalidate a single field using cached data */
  revalidateField: (fieldName: string) => void;
  
  // Data
  /** Cached verification data */
  verificationData: any | null;
  
  /** Map of field names to labels for accessibility */
  fieldLabels: Record<string, string>;
  
  /** List of mismatched field labels */
  mismatchedFieldLabels: string[];
}

// ============================================================================
// Cache Interfaces
// ============================================================================

/**
 * Cached verification entry
 */
export interface CachedVerification {
  /** Verification API response data */
  data: any;
  
  /** Type of identifier (CAC or NIN) */
  identifierType: IdentifierType;
  
  /** Timestamp when cached */
  timestamp: number;
  
  /** The identifier value */
  identifier: string;
}

// ============================================================================
// Error Message Constants
// ============================================================================

/**
 * Error messages for identifier field (verification errors only)
 */
export const IDENTIFIER_FIELD_ERRORS: Record<VerificationErrorCode, string> = {
  [VerificationErrorCode.NETWORK_ERROR]: 
    'Network error. Please check your connection and try again.',
  [VerificationErrorCode.TIMEOUT]: 
    'Verification timed out. You may proceed, but data accuracy cannot be guaranteed.',
  [VerificationErrorCode.RATE_LIMIT]: 
    'Rate limit exceeded. Please wait 60 seconds before trying again.',
  [VerificationErrorCode.INVALID_FORMAT]: 
    'Invalid format. Please enter a valid identifier.',
  [VerificationErrorCode.AUTH_REQUIRED]: 
    'Please sign in to use verification.',
  [VerificationErrorCode.MALFORMED_RESPONSE]: 
    'Verification failed due to invalid response. Please try again.',
  [VerificationErrorCode.UNKNOWN_ERROR]: 
    'Verification failed. You may proceed, but please verify your data manually.'
};

/**
 * Generate field-level error message
 */
export const generateFieldErrorMessage = (fieldLabel: string, identifierType: IdentifierType): string => {
  const recordType = identifierType === 'CAC' ? 'CAC records' : 'NIN records';
  return `This ${fieldLabel.toLowerCase()} doesn't match ${recordType}`;
};

// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * Props for FieldValidationIndicator component
 */
export interface FieldValidationIndicatorProps {
  /** Current validation status */
  status: FieldValidationStatus;
  
  /** Error message to display (null if no error) */
  errorMessage: string | null;
  
  /** Field ID for ARIA association */
  fieldId: string;
  
  /** Field label for error message */
  fieldLabel: string;
}

/**
 * Props for IdentifierFieldError component
 */
export interface IdentifierFieldErrorProps {
  /** Verification API error message (null if no error) */
  verificationError: string | null;
  
  /** Whether verification is in progress */
  isVerifying: boolean;
}

/**
 * Props for ValidationTooltip component
 */
export interface ValidationTooltipProps {
  /** Whether to show the tooltip */
  show: boolean;
  
  /** Tooltip message */
  message: string;
  
  /** List of field labels that are mismatched */
  mismatchedFields: string[];
  
  /** ID for aria-describedby association */
  id?: string;
}

// ============================================================================
// Validation State Store Interface
// ============================================================================

/**
 * Complete validation state for the form
 */
export interface ValidationStateStore {
  /** Per-field validation states (keyed by field name) */
  fields: Record<string, FieldValidationState>;
  
  /** Whether verification has been triggered */
  isVerificationTriggered: boolean;
  
  /** Whether verification is in progress */
  isVerifying: boolean;
  
  /** Cached verification data */
  verificationData: any | null;
  
  /** Verification API error (shown on identifier field) */
  verificationError: string | null;
  
  /** Current identifier value */
  identifierValue: string | null;
  
  /** Computed: whether any field is mismatched */
  hasAnyMismatches: boolean;
  
  /** Computed: whether all fields have been validated */
  allFieldsValidated: boolean;
  
  /** Computed: list of mismatched field labels */
  mismatchedFieldLabels: string[];
}
