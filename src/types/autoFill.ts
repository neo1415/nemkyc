/**
 * Auto-Fill Type Definitions
 * 
 * This file contains all TypeScript interfaces, types, and enums for the NIN/CAC auto-fill feature.
 * These types support real-time form field population from verification API responses.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Identifier types supported by the auto-fill system
 */
export enum IdentifierType {
  NIN = 'NIN',
  CAC = 'CAC'
}

/**
 * Form types detected by the system
 */
export enum FormType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
  MIXED = 'mixed'
}

/**
 * Error types that can occur during auto-fill operations
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  TIMEOUT = 'timeout',
  API_ERROR = 'api_error'
}

// ============================================================================
// API Response Interfaces
// ============================================================================

/**
 * Response from NIN verification API (Datapro)
 */
export interface NINVerificationResponse {
  success: boolean;
  data?: {
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    phoneNumber?: string;
    birthstate?: string;
    birthlga?: string;
    trackingId?: string;
  };
  error?: {
    code: string;
    message: string;
  };
  cached?: boolean; // True if data came from database cache
  cachedAt?: string; // Timestamp when data was cached
}

/**
 * Response from CAC verification API (VerifyData)
 */
export interface CACVerificationResponse {
  success: boolean;
  data?: {
    name: string; // Company name
    registrationNumber: string;
    companyStatus: string;
    registrationDate: string;
    typeOfEntity?: string;
    address?: string;
    email?: string;
  };
  error?: {
    code: string;
    message: string;
  };
  cached?: boolean; // True if data came from database cache
  cachedAt?: string; // Timestamp when data was cached
}

// ============================================================================
// Field Mapping Interfaces
// ============================================================================

/**
 * Represents a mapping between an API field and a form field
 */
export interface FieldMapping {
  formFieldName: string;
  formFieldElement: HTMLInputElement;
  value: string;
  sourceField: string; // Original API field name
}

// ============================================================================
// Auto-Fill State Interface
// ============================================================================

/**
 * Tracks the current state of the auto-fill operation
 */
export interface AutoFillState {
  // Current verification status
  status: 'idle' | 'loading' | 'success' | 'error';
  
  // Identifier being verified
  identifier: string;
  identifierType: IdentifierType;
  
  // Form type
  formType: FormType;
  
  // Auto-filled fields tracking
  autoFilledFields: Set<string>;
  
  // Original auto-filled values (for audit)
  originalValues: Record<string, string>;
  
  // User-modified fields
  modifiedFields: Set<string>;
  
  // Error information
  error: {
    type: ErrorType;
    message: string;
  } | null;
  
  // Timestamp
  verificationTimestamp: Date | null;
}

// ============================================================================
// Audit Log Interface
// ============================================================================

/**
 * Audit log entry for auto-fill operations
 */
export interface AutoFillAuditLog {
  // Unique log ID
  logId: string;
  
  // Timestamp
  timestamp: Date;
  
  // User information
  userId: string;
  formId: string;
  formType: FormType;
  
  // Verification details
  identifierType: IdentifierType;
  identifierHash: string; // Hashed for privacy
  apiProvider: 'datapro' | 'verifydata';
  
  // Results
  verificationSuccess: boolean;
  populatedFields: string[];
  populatedFieldCount: number;
  
  // User modifications
  modifiedFields: Array<{
    fieldName: string;
    originalValue: string;
    modifiedValue: string;
  }>;
  
  // Error information (if applicable)
  error: {
    type: ErrorType;
    message: string;
  } | null;
}

// ============================================================================
// Configuration Interface
// ============================================================================

/**
 * Configuration options for the auto-fill system
 */
export interface AutoFillConfig {
  // Enable/disable auto-fill per form type
  enabledForIndividual: boolean;
  enabledForCorporate: boolean;
  
  // API timeout in milliseconds
  apiTimeout: number;
  
  // Custom field mappings (overrides default matching)
  customFieldMappings?: Record<string, string>;
  
  // Visual feedback options
  showLoadingIndicator: boolean;
  showSuccessNotification: boolean;
  showAutoFillMarkers: boolean;
  
  // Audit logging options
  enableAuditLogging: boolean;
  maskSensitiveData: boolean;
}
