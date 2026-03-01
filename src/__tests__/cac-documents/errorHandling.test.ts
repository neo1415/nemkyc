/**
 * Unit Tests for CAC Error Handler
 * 
 * Tests error handling service functionality:
 * - Validation error messages
 * - Network error messages
 * - Permission error messages
 * - Security error messages
 * - Storage quota error messages
 * - Error logging
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import {
  handleValidationError,
  handleNetworkError,
  handlePermissionError,
  handleSecurityError,
  handleStorageQuotaError,
  handleUploadError,
  handleDownloadError,
  handlePreviewError,
  handleGenericError,
  getRecentErrors,
  getErrorsByCategory,
  getErrorsBySeverity,
  clearErrorLog,
  formatErrorForDisplay,
  isRetryable,
  getErrorStatistics,
  CACErrorCategory,
  ErrorSeverity
} from '../../services/cacErrorHandler';
import { ValidationErrorCode } from '../../utils/cacFileValidator';

describe('CAC Error Handler', () => {
  beforeEach(() => {
    // Clear error log before each test
    clearErrorLog();
  });

  describe('handleValidationError', () => {
    it('should handle INVALID_FILE_TYPE error', () => {
      const error = handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);

      expect(error.category).toBe(CACErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.WARNING);
      expect(error.message).toContain('Invalid file type');
      expect(error.actionableGuidance).toContain('PDF or image file');
      expect(error.retryable).toBe(true);
      expect(error.errorCode).toBe(ValidationErrorCode.INVALID_FILE_TYPE);
    });

    it('should handle FILE_TOO_LARGE error', () => {
      const error = handleValidationError(ValidationErrorCode.FILE_TOO_LARGE);

      expect(error.category).toBe(CACErrorCategory.VALIDATION);
      expect(error.message).toContain('exceeds');
      expect(error.actionableGuidance).toContain('10MB');
      expect(error.actionableGuidance).toContain('compress');
      expect(error.retryable).toBe(true);
    });

    it('should handle INVALID_MIME_TYPE error', () => {
      const error = handleValidationError(ValidationErrorCode.INVALID_MIME_TYPE);

      expect(error.category).toBe(CACErrorCategory.VALIDATION);
      expect(error.message).toContain('format');
      expect(error.actionableGuidance).toContain('PDF or image file');
      expect(error.retryable).toBe(true);
    });

    it('should handle MALICIOUS_CONTENT error', () => {
      const error = handleValidationError(ValidationErrorCode.MALICIOUS_CONTENT);

      expect(error.category).toBe(CACErrorCategory.VALIDATION);
      expect(error.message).toContain('validation failed');
      expect(error.actionableGuidance).toContain('corrupted');
      expect(error.retryable).toBe(true);
    });

    it('should handle EMPTY_FILE error', () => {
      const error = handleValidationError(ValidationErrorCode.EMPTY_FILE);

      expect(error.category).toBe(CACErrorCategory.VALIDATION);
      expect(error.message).toContain('empty');
      expect(error.actionableGuidance).toContain('valid document');
      expect(error.retryable).toBe(true);
    });

    it('should handle INVALID_FILE error', () => {
      const error = handleValidationError(ValidationErrorCode.INVALID_FILE);

      expect(error.category).toBe(CACErrorCategory.VALIDATION);
      expect(error.message).toContain('Invalid file');
      expect(error.actionableGuidance).toContain('valid document');
      expect(error.retryable).toBe(true);
    });

    it('should accept custom message', () => {
      const customMessage = 'Custom validation error';
      const error = handleValidationError(
        ValidationErrorCode.INVALID_FILE_TYPE,
        customMessage
      );

      expect(error.message).toBe(customMessage);
    });

    it('should log validation errors', () => {
      handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      
      const recentErrors = getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].category).toBe(CACErrorCategory.VALIDATION);
    });
  });

  describe('handleNetworkError', () => {
    it('should handle network error with default operation', () => {
      const originalError = new Error('Network request failed');
      const error = handleNetworkError(originalError);

      expect(error.category).toBe(CACErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.message).toContain('Network error');
      expect(error.actionableGuidance).toContain('internet connection');
      expect(error.actionableGuidance).toContain('try again');
      expect(error.retryable).toBe(true);
      expect(error.technicalDetails).toBe('Network request failed');
      expect(error.errorCode).toBe('NETWORK_ERROR');
    });

    it('should handle network error with specific operation', () => {
      const originalError = new Error('Connection timeout');
      const error = handleNetworkError(originalError, 'upload');

      expect(error.message).toContain('upload');
      expect(error.actionableGuidance).toContain('upload');
    });

    it('should log network errors', () => {
      const originalError = new Error('Network error');
      handleNetworkError(originalError);
      
      const recentErrors = getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].category).toBe(CACErrorCategory.NETWORK);
      expect(recentErrors[0].technicalDetails).toBe('Network error');
    });
  });

  describe('handlePermissionError', () => {
    it('should handle permission error without reason', () => {
      const error = handlePermissionError('view');

      expect(error.category).toBe(CACErrorCategory.PERMISSION);
      expect(error.severity).toBe(ErrorSeverity.WARNING);
      expect(error.message).toContain('do not have permission');
      expect(error.message).toContain('view');
      expect(error.actionableGuidance).toContain('administrator');
      expect(error.actionableGuidance).toContain('broker');
      expect(error.retryable).toBe(false);
      expect(error.errorCode).toBe('PERMISSION_DENIED');
    });

    it('should handle permission error with reason', () => {
      const reason = 'User role is not authorized';
      const error = handlePermissionError('download', reason);

      expect(error.message).toContain('download');
      expect(error.actionableGuidance).toContain(reason);
      expect(error.actionableGuidance).toContain('administrator');
    });

    it('should log permission errors', () => {
      handlePermissionError('upload');
      
      const recentErrors = getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].category).toBe(CACErrorCategory.PERMISSION);
    });
  });

  describe('handleSecurityError', () => {
    it('should handle encryption error', () => {
      const originalError = new Error('Encryption failed');
      const error = handleSecurityError(originalError, 'encryption');

      expect(error.category).toBe(CACErrorCategory.SECURITY);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.message).toContain('encryption');
      expect(error.actionableGuidance).toContain('encrypt');
      expect(error.actionableGuidance).toContain('security requirement');
      expect(error.retryable).toBe(true);
      expect(error.technicalDetails).toBe('Encryption failed');
      expect(error.errorCode).toBe('ENCRYPTION_FAILED');
    });

    it('should handle decryption error', () => {
      const originalError = new Error('Decryption failed');
      const error = handleSecurityError(originalError, 'decryption');

      expect(error.message).toContain('decryption');
      expect(error.actionableGuidance).toContain('decrypt');
      expect(error.actionableGuidance).toContain('corrupted');
      expect(error.retryable).toBe(false);
      expect(error.errorCode).toBe('DECRYPTION_FAILED');
    });

    it('should log security errors', () => {
      const originalError = new Error('Security breach');
      handleSecurityError(originalError, 'encryption');
      
      const recentErrors = getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].category).toBe(CACErrorCategory.SECURITY);
      expect(recentErrors[0].severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('handleStorageQuotaError', () => {
    it('should handle storage quota error without usage details', () => {
      const error = handleStorageQuotaError();

      expect(error.category).toBe(CACErrorCategory.STORAGE_QUOTA);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.message).toContain('quota exceeded');
      expect(error.actionableGuidance).toContain('delete');
      expect(error.actionableGuidance).toContain('administrator');
      expect(error.retryable).toBe(false);
      expect(error.errorCode).toBe('STORAGE_QUOTA_EXCEEDED');
    });

    it('should handle storage quota error with usage details', () => {
      const currentUsage = 100 * 1024 * 1024; // 100MB
      const quota = 50 * 1024 * 1024; // 50MB
      const error = handleStorageQuotaError(currentUsage, quota);

      expect(error.message).toContain('100.00MB');
      expect(error.message).toContain('50.00MB');
      expect(error.actionableGuidance).toContain('delete');
    });

    it('should log storage quota errors', () => {
      handleStorageQuotaError();
      
      const recentErrors = getRecentErrors(1);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].category).toBe(CACErrorCategory.STORAGE_QUOTA);
    });
  });

  describe('handleUploadError', () => {
    it('should detect network errors in upload', () => {
      const originalError = new Error('Network fetch failed');
      const error = handleUploadError(originalError, 'document.pdf');

      expect(error.category).toBe(CACErrorCategory.NETWORK);
      expect(error.message).toContain('upload');
    });

    it('should detect quota errors in upload', () => {
      const originalError = new Error('Storage quota exceeded');
      const error = handleUploadError(originalError);

      expect(error.category).toBe(CACErrorCategory.STORAGE_QUOTA);
    });

    it('should detect permission errors in upload', () => {
      const originalError = new Error('Unauthorized access');
      const error = handleUploadError(originalError);

      expect(error.category).toBe(CACErrorCategory.PERMISSION);
    });

    it('should detect encryption errors in upload', () => {
      const originalError = new Error('Failed to encrypt document');
      const error = handleUploadError(originalError);

      expect(error.category).toBe(CACErrorCategory.SECURITY);
    });

    it('should handle generic upload error', () => {
      const originalError = new Error('Unknown upload error');
      const error = handleUploadError(originalError, 'test.pdf');

      expect(error.category).toBe(CACErrorCategory.UNKNOWN);
      expect(error.message).toContain('test.pdf');
      expect(error.actionableGuidance).toContain('try again');
      expect(error.retryable).toBe(true);
    });
  });

  describe('handleDownloadError', () => {
    it('should detect network errors in download', () => {
      const originalError = new Error('Network connection lost');
      const error = handleDownloadError(originalError);

      expect(error.category).toBe(CACErrorCategory.NETWORK);
      expect(error.message).toContain('download');
    });

    it('should detect permission errors in download', () => {
      const originalError = new Error('Permission denied');
      const error = handleDownloadError(originalError);

      expect(error.category).toBe(CACErrorCategory.PERMISSION);
    });

    it('should detect decryption errors in download', () => {
      const originalError = new Error('Failed to decrypt file');
      const error = handleDownloadError(originalError);

      expect(error.category).toBe(CACErrorCategory.SECURITY);
    });

    it('should handle generic download error with filename', () => {
      const originalError = new Error('Download failed');
      const error = handleDownloadError(originalError, 'document.pdf');

      expect(error.category).toBe(CACErrorCategory.UNKNOWN);
      expect(error.message).toContain('document.pdf');
      expect(error.retryable).toBe(true);
    });
  });

  describe('handlePreviewError', () => {
    it('should detect network errors in preview', () => {
      const originalError = new Error('Fetch failed');
      const error = handlePreviewError(originalError);

      expect(error.category).toBe(CACErrorCategory.NETWORK);
    });

    it('should detect permission errors in preview', () => {
      const originalError = new Error('Unauthorized');
      const error = handlePreviewError(originalError);

      expect(error.category).toBe(CACErrorCategory.PERMISSION);
    });

    it('should detect decryption errors in preview', () => {
      const originalError = new Error('Decryption error');
      const error = handlePreviewError(originalError);

      expect(error.category).toBe(CACErrorCategory.SECURITY);
    });

    it('should handle generic preview error', () => {
      const originalError = new Error('Preview generation failed');
      const error = handlePreviewError(originalError);

      expect(error.category).toBe(CACErrorCategory.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.WARNING);
      expect(error.message).toContain('preview');
      expect(error.actionableGuidance).toContain('download');
      expect(error.retryable).toBe(true);
    });
  });

  describe('handleGenericError', () => {
    it('should handle generic error with default context', () => {
      const originalError = new Error('Something went wrong');
      const error = handleGenericError(originalError);

      expect(error.category).toBe(CACErrorCategory.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.message).toContain('operation');
      expect(error.actionableGuidance).toContain('try again');
      expect(error.retryable).toBe(true);
      expect(error.technicalDetails).toBe('Something went wrong');
    });

    it('should handle generic error with custom context', () => {
      const originalError = new Error('Error occurred');
      const error = handleGenericError(originalError, 'document processing');

      expect(error.message).toContain('document processing');
      expect(error.actionableGuidance).toContain('Error occurred');
    });
  });

  describe('Error Logging', () => {
    it('should log errors to memory', () => {
      handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      handleNetworkError(new Error('Network error'));
      handlePermissionError('view');

      const recentErrors = getRecentErrors(10);
      expect(recentErrors).toHaveLength(3);
    });

    it('should retrieve recent errors', () => {
      for (let i = 0; i < 5; i++) {
        handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      }

      const recentErrors = getRecentErrors(3);
      expect(recentErrors).toHaveLength(3);
    });

    it('should filter errors by category', () => {
      handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      handleNetworkError(new Error('Network error'));
      handleValidationError(ValidationErrorCode.FILE_TOO_LARGE);

      const validationErrors = getErrorsByCategory(CACErrorCategory.VALIDATION);
      expect(validationErrors).toHaveLength(2);
      expect(validationErrors.every(e => e.category === CACErrorCategory.VALIDATION)).toBe(true);
    });

    it('should filter errors by severity', () => {
      handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE); // WARNING
      handleSecurityError(new Error('Security error'), 'encryption'); // CRITICAL
      handleNetworkError(new Error('Network error')); // ERROR

      const criticalErrors = getErrorsBySeverity(ErrorSeverity.CRITICAL);
      expect(criticalErrors).toHaveLength(1);
      expect(criticalErrors[0].severity).toBe(ErrorSeverity.CRITICAL);
    });

    it('should clear error log', () => {
      handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      handleNetworkError(new Error('Network error'));

      expect(getRecentErrors(10)).toHaveLength(2);

      clearErrorLog();

      expect(getRecentErrors(10)).toHaveLength(0);
    });
  });

  describe('Error Utilities', () => {
    it('should format error for display', () => {
      const error = handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      const formatted = formatErrorForDisplay(error);

      expect(formatted).toContain(error.message);
      expect(formatted).toContain(error.actionableGuidance);
    });

    it('should check if error is retryable', () => {
      const retryableError = handleNetworkError(new Error('Network error'));
      const nonRetryableError = handlePermissionError('view');

      expect(isRetryable(retryableError)).toBe(true);
      expect(isRetryable(nonRetryableError)).toBe(false);
    });

    it('should get error statistics', () => {
      clearErrorLog();

      handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      handleValidationError(ValidationErrorCode.FILE_TOO_LARGE);
      handleNetworkError(new Error('Network error'));
      handleSecurityError(new Error('Security error'), 'encryption');

      const stats = getErrorStatistics();

      expect(stats.total).toBe(4);
      expect(stats.byCategory[CACErrorCategory.VALIDATION]).toBe(2);
      expect(stats.byCategory[CACErrorCategory.NETWORK]).toBe(1);
      expect(stats.byCategory[CACErrorCategory.SECURITY]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.WARNING]).toBe(2);
      expect(stats.bySeverity[ErrorSeverity.ERROR]).toBe(1);
      expect(stats.bySeverity[ErrorSeverity.CRITICAL]).toBe(1);
    });
  });

  describe('Error Message Quality', () => {
    it('should provide actionable guidance for all error types', () => {
      const errors = [
        handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE),
        handleNetworkError(new Error('Network error')),
        handlePermissionError('view'),
        handleSecurityError(new Error('Security error'), 'encryption'),
        handleStorageQuotaError()
      ];

      errors.forEach(error => {
        expect(error.actionableGuidance).toBeTruthy();
        expect(error.actionableGuidance.length).toBeGreaterThan(20);
      });
    });

    it('should have clear and user-friendly messages', () => {
      const error = handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);

      // Should not contain technical jargon
      expect(error.message.toLowerCase()).not.toContain('exception');
      expect(error.message.toLowerCase()).not.toContain('null');
      expect(error.message.toLowerCase()).not.toContain('undefined');

      // Should be clear and concise
      expect(error.message.length).toBeLessThan(100);
    });
  });
});
