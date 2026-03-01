/**
 * CAC Document Error Handler
 * 
 * Centralizes error handling for CAC document operations with:
 * - Specific error messages for validation failures
 * - Network error messages with retry options
 * - Permission error messages
 * - Security error messages
 * - Storage quota error messages
 * - Actionable guidance in error messages
 * - Error logging for debugging
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
 */

import { ValidationErrorCode } from '../utils/cacFileValidator';

/**
 * Error categories for CAC document operations
 */
export enum CACErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  PERMISSION = 'permission',
  SECURITY = 'security',
  STORAGE_QUOTA = 'storage_quota',
  ENCRYPTION = 'encryption',
  UNKNOWN = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * CAC Error interface
 */
export interface CACError {
  category: CACErrorCategory;
  severity: ErrorSeverity;
  message: string;
  actionableGuidance: string;
  retryable: boolean;
  technicalDetails?: string;
  errorCode?: string;
}

/**
 * Error log entry
 */
interface ErrorLogEntry {
  timestamp: Date;
  category: CACErrorCategory;
  severity: ErrorSeverity;
  message: string;
  technicalDetails?: string;
  errorCode?: string;
  userId?: string;
  documentId?: string;
  identityRecordId?: string;
  stackTrace?: string;
}

/**
 * In-memory error log for debugging
 * In production, this should be sent to a logging service
 */
const errorLog: ErrorLogEntry[] = [];

/**
 * Maximum number of errors to keep in memory
 */
const MAX_ERROR_LOG_SIZE = 1000;

/**
 * Handles validation errors
 * Requirement 12.1: Specific error messages for validation failures
 * 
 * @param errorCode - Validation error code
 * @param customMessage - Optional custom message
 * @returns CAC Error object
 */
export function handleValidationError(
  errorCode: ValidationErrorCode,
  customMessage?: string
): CACError {
  let message: string;
  let actionableGuidance: string;

  switch (errorCode) {
    case ValidationErrorCode.INVALID_FILE_TYPE:
      message = customMessage || 'Invalid file type selected';
      actionableGuidance = 'Please select a PDF or image file (JPEG, PNG). Other file types are not supported for CAC documents.';
      break;

    case ValidationErrorCode.FILE_TOO_LARGE:
      message = customMessage || 'File size exceeds the maximum limit';
      actionableGuidance = 'Please select a file smaller than 10MB. You can compress the file or scan at a lower resolution to reduce the file size.';
      break;

    case ValidationErrorCode.INVALID_MIME_TYPE:
      message = customMessage || 'File format is not recognized';
      actionableGuidance = 'Please ensure the file is a valid PDF or image file (JPEG, PNG). The file extension may not match the actual file format.';
      break;

    case ValidationErrorCode.MALICIOUS_CONTENT:
      message = customMessage || 'File content validation failed';
      actionableGuidance = 'The file appears to be corrupted or has an invalid format. Please try scanning or saving the document again, then upload the new file.';
      break;

    case ValidationErrorCode.EMPTY_FILE:
      message = customMessage || 'File is empty';
      actionableGuidance = 'The selected file contains no data. Please select a valid document file.';
      break;

    case ValidationErrorCode.INVALID_FILE:
      message = customMessage || 'Invalid file';
      actionableGuidance = 'The file could not be processed. Please ensure you have selected a valid document file.';
      break;

    default:
      message = customMessage || 'File validation failed';
      actionableGuidance = 'Please check that you have selected a valid PDF or image file (JPEG, PNG) under 10MB.';
  }

  const error: CACError = {
    category: CACErrorCategory.VALIDATION,
    severity: ErrorSeverity.WARNING,
    message,
    actionableGuidance,
    retryable: true,
    errorCode
  };

  logError(error);
  return error;
}

/**
 * Handles network errors
 * Requirement 12.2: Network error messages with retry option
 * 
 * @param originalError - Original error object
 * @param operation - Operation that failed (e.g., 'upload', 'download')
 * @returns CAC Error object
 */
export function handleNetworkError(
  originalError: Error,
  operation: string = 'operation'
): CACError {
  const message = `Network error during ${operation}`;
  const actionableGuidance = `Unable to complete ${operation} due to a network issue. Please check your internet connection and try again. If the problem persists, try refreshing the page.`;

  const error: CACError = {
    category: CACErrorCategory.NETWORK,
    severity: ErrorSeverity.ERROR,
    message,
    actionableGuidance,
    retryable: true,
    technicalDetails: originalError.message,
    errorCode: 'NETWORK_ERROR'
  };

  logError(error, originalError);
  return error;
}

/**
 * Handles permission/authorization errors
 * Requirement 12.3: Permission error messages
 * 
 * @param action - Action that was denied (e.g., 'view', 'download', 'upload')
 * @param reason - Optional reason for denial
 * @returns CAC Error object
 */
export function handlePermissionError(
  action: string,
  reason?: string
): CACError {
  const message = `You do not have permission to ${action} this document`;
  let actionableGuidance: string;

  if (reason) {
    actionableGuidance = `Access denied: ${reason}. Please contact your administrator if you believe you should have access to this document.`;
  } else {
    actionableGuidance = `You do not have the required permissions to ${action} this document. Only administrators, super administrators, and the broker who owns this record can access CAC documents. Please contact your administrator if you need access.`;
  }

  const error: CACError = {
    category: CACErrorCategory.PERMISSION,
    severity: ErrorSeverity.WARNING,
    message,
    actionableGuidance,
    retryable: false,
    errorCode: 'PERMISSION_DENIED'
  };

  logError(error);
  return error;
}

/**
 * Handles security/encryption errors
 * Requirement 12.4: Security error messages
 * 
 * @param originalError - Original error object
 * @param operation - Operation that failed (e.g., 'encryption', 'decryption')
 * @returns CAC Error object
 */
export function handleSecurityError(
  originalError: Error,
  operation: 'encryption' | 'decryption' = 'encryption'
): CACError {
  const message = `Security error during ${operation}`;
  let actionableGuidance: string;

  if (operation === 'encryption') {
    actionableGuidance = 'Unable to securely encrypt the document. This is a security requirement for CAC documents. Please try uploading again. If the problem persists, contact support.';
  } else {
    actionableGuidance = 'Unable to decrypt the document. The file may be corrupted or the encryption keys may have changed. Please contact support for assistance.';
  }

  const error: CACError = {
    category: CACErrorCategory.SECURITY,
    severity: ErrorSeverity.CRITICAL,
    message,
    actionableGuidance,
    retryable: operation === 'encryption', // Encryption can be retried, decryption usually cannot
    technicalDetails: originalError.message,
    errorCode: `${operation.toUpperCase()}_FAILED`
  };

  logError(error, originalError);
  return error;
}

/**
 * Handles storage quota errors
 * Requirement 12.5: Storage quota error messages
 * 
 * @param currentUsage - Current storage usage in bytes (optional)
 * @param quota - Storage quota in bytes (optional)
 * @returns CAC Error object
 */
export function handleStorageQuotaError(
  currentUsage?: number,
  quota?: number
): CACError {
  let message = 'Storage quota exceeded';
  let actionableGuidance: string;

  if (currentUsage && quota) {
    const usageMB = (currentUsage / (1024 * 1024)).toFixed(2);
    const quotaMB = (quota / (1024 * 1024)).toFixed(2);
    message = `Storage quota exceeded (${usageMB}MB / ${quotaMB}MB)`;
    actionableGuidance = `Your storage quota has been reached. Please delete old or unnecessary documents to free up space, or contact your administrator to increase your storage quota.`;
  } else {
    actionableGuidance = 'Your storage quota has been reached. Please delete old or unnecessary documents to free up space, or contact your administrator to increase your storage quota.';
  }

  const error: CACError = {
    category: CACErrorCategory.STORAGE_QUOTA,
    severity: ErrorSeverity.ERROR,
    message,
    actionableGuidance,
    retryable: false,
    errorCode: 'STORAGE_QUOTA_EXCEEDED'
  };

  logError(error);
  return error;
}

/**
 * Handles upload errors
 * 
 * @param originalError - Original error object
 * @param fileName - Name of file being uploaded
 * @returns CAC Error object
 */
export function handleUploadError(
  originalError: Error,
  fileName?: string
): CACError {
  const errorMessage = originalError.message.toLowerCase();
  
  // Check for specific error types
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return handleNetworkError(originalError, 'upload');
  }
  
  if (errorMessage.includes('quota') || errorMessage.includes('storage limit')) {
    return handleStorageQuotaError();
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return handlePermissionError('upload');
  }
  
  if (errorMessage.includes('encrypt')) {
    return handleSecurityError(originalError, 'encryption');
  }

  // Generic upload error
  const message = fileName 
    ? `Failed to upload ${fileName}`
    : 'Document upload failed';
  
  const actionableGuidance = 'The document upload failed. Please check your internet connection and try again. If the problem persists, try uploading a different file or contact support.';

  const error: CACError = {
    category: CACErrorCategory.UNKNOWN,
    severity: ErrorSeverity.ERROR,
    message,
    actionableGuidance,
    retryable: true,
    technicalDetails: originalError.message,
    errorCode: 'UPLOAD_FAILED'
  };

  logError(error, originalError);
  return error;
}

/**
 * Handles download errors
 * 
 * @param originalError - Original error object
 * @param fileName - Name of file being downloaded
 * @returns CAC Error object
 */
export function handleDownloadError(
  originalError: Error,
  fileName?: string
): CACError {
  const errorMessage = originalError.message.toLowerCase();
  
  // Check for specific error types
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return handleNetworkError(originalError, 'download');
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return handlePermissionError('download');
  }
  
  if (errorMessage.includes('decrypt')) {
    return handleSecurityError(originalError, 'decryption');
  }

  // Generic download error
  const message = fileName 
    ? `Failed to download ${fileName}`
    : 'Document download failed';
  
  const actionableGuidance = 'The document download failed. Please check your internet connection and try again. If the problem persists, contact support.';

  const error: CACError = {
    category: CACErrorCategory.UNKNOWN,
    severity: ErrorSeverity.ERROR,
    message,
    actionableGuidance,
    retryable: true,
    technicalDetails: originalError.message,
    errorCode: 'DOWNLOAD_FAILED'
  };

  logError(error, originalError);
  return error;
}

/**
 * Handles preview errors
 * 
 * @param originalError - Original error object
 * @returns CAC Error object
 */
export function handlePreviewError(originalError: Error): CACError {
  const errorMessage = originalError.message.toLowerCase();
  
  // Check for specific error types
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return handleNetworkError(originalError, 'preview');
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return handlePermissionError('preview');
  }
  
  if (errorMessage.includes('decrypt')) {
    return handleSecurityError(originalError, 'decryption');
  }

  // Generic preview error
  const message = 'Failed to load document preview';
  const actionableGuidance = 'Unable to display the document preview. Please try again or download the document to view it. If the problem persists, the document may be corrupted.';

  const error: CACError = {
    category: CACErrorCategory.UNKNOWN,
    severity: ErrorSeverity.WARNING,
    message,
    actionableGuidance,
    retryable: true,
    technicalDetails: originalError.message,
    errorCode: 'PREVIEW_FAILED'
  };

  logError(error, originalError);
  return error;
}

/**
 * Handles generic errors
 * 
 * @param originalError - Original error object
 * @param context - Context of the error
 * @returns CAC Error object
 */
export function handleGenericError(
  originalError: Error,
  context: string = 'operation'
): CACError {
  const message = `An error occurred during ${context}`;
  const actionableGuidance = `Something went wrong while performing this operation. Please try again. If the problem persists, contact support with the following error: ${originalError.message}`;

  const error: CACError = {
    category: CACErrorCategory.UNKNOWN,
    severity: ErrorSeverity.ERROR,
    message,
    actionableGuidance,
    retryable: true,
    technicalDetails: originalError.message,
    errorCode: 'UNKNOWN_ERROR'
  };

  logError(error, originalError);
  return error;
}

/**
 * Logs an error for debugging
 * Requirement 12.7: Log all errors for debugging
 * 
 * @param error - CAC Error object
 * @param originalError - Original error object (optional)
 * @param metadata - Additional metadata (optional)
 */
function logError(
  error: CACError,
  originalError?: Error,
  metadata?: Record<string, any>
): void {
  const logEntry: ErrorLogEntry = {
    timestamp: new Date(),
    category: error.category,
    severity: error.severity,
    message: error.message,
    technicalDetails: error.technicalDetails,
    errorCode: error.errorCode,
    stackTrace: originalError?.stack,
    ...metadata
  };

  // Add to in-memory log
  errorLog.push(logEntry);

  // Trim log if it exceeds max size
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift();
  }

  // Console logging based on severity
  const logMessage = `[CAC Error] ${error.category.toUpperCase()}: ${error.message}`;
  
  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      console.error(logMessage, {
        error,
        originalError,
        metadata
      });
      break;
    case ErrorSeverity.ERROR:
      console.error(logMessage, error);
      break;
    case ErrorSeverity.WARNING:
      console.warn(logMessage, error);
      break;
    case ErrorSeverity.INFO:
      console.info(logMessage, error);
      break;
  }

  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    sendToLoggingService(logEntry).catch(err => {
      console.error('Failed to send error to logging service:', err);
    });
  }
}

/**
 * Sends error to external logging service
 * 
 * @param logEntry - Error log entry
 */
async function sendToLoggingService(logEntry: ErrorLogEntry): Promise<void> {
  // TODO: Implement integration with logging service (e.g., Sentry, LogRocket)
  // For now, this is a placeholder
  try {
    // Example: await fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEntry) });
  } catch (error) {
    // Silently fail - don't want logging errors to break the app
  }
}

/**
 * Gets recent errors from the log
 * 
 * @param count - Number of recent errors to retrieve
 * @returns Array of recent error log entries
 */
export function getRecentErrors(count: number = 10): ErrorLogEntry[] {
  return errorLog.slice(-count);
}

/**
 * Gets errors by category
 * 
 * @param category - Error category to filter by
 * @param count - Maximum number of errors to retrieve
 * @returns Array of error log entries
 */
export function getErrorsByCategory(
  category: CACErrorCategory,
  count: number = 10
): ErrorLogEntry[] {
  return errorLog
    .filter(entry => entry.category === category)
    .slice(-count);
}

/**
 * Gets errors by severity
 * 
 * @param severity - Error severity to filter by
 * @param count - Maximum number of errors to retrieve
 * @returns Array of error log entries
 */
export function getErrorsBySeverity(
  severity: ErrorSeverity,
  count: number = 10
): ErrorLogEntry[] {
  return errorLog
    .filter(entry => entry.severity === severity)
    .slice(-count);
}

/**
 * Clears the error log
 * Useful for testing or after errors have been reviewed
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}

/**
 * Formats an error for display to the user
 * 
 * @param error - CAC Error object
 * @returns Formatted error message
 */
export function formatErrorForDisplay(error: CACError): string {
  return `${error.message}\n\n${error.actionableGuidance}`;
}

/**
 * Checks if an error is retryable
 * 
 * @param error - CAC Error object
 * @returns True if the operation can be retried
 */
export function isRetryable(error: CACError): boolean {
  return error.retryable;
}

/**
 * Gets error statistics
 * 
 * @returns Error statistics object
 */
export function getErrorStatistics(): {
  total: number;
  byCategory: Record<CACErrorCategory, number>;
  bySeverity: Record<ErrorSeverity, number>;
} {
  const stats = {
    total: errorLog.length,
    byCategory: {} as Record<CACErrorCategory, number>,
    bySeverity: {} as Record<ErrorSeverity, number>
  };

  // Initialize counters
  Object.values(CACErrorCategory).forEach(category => {
    stats.byCategory[category] = 0;
  });
  Object.values(ErrorSeverity).forEach(severity => {
    stats.bySeverity[severity] = 0;
  });

  // Count errors
  errorLog.forEach(entry => {
    stats.byCategory[entry.category]++;
    stats.bySeverity[entry.severity]++;
  });

  return stats;
}
