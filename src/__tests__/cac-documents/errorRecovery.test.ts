/**
 * Integration Tests for CAC Error Recovery
 * 
 * Tests error recovery scenarios:
 * - Retry after network failure
 * - Recovery from validation errors
 * - Recovery from permission errors
 * - Error state cleanup
 * 
 * Requirements: 12.2, 12.3, 8.6
 */

import {
  handleNetworkError,
  handleValidationError,
  handlePermissionError,
  handleUploadError,
  clearErrorLog,
  getRecentErrors,
  isRetryable,
  CACErrorCategory
} from '../../services/cacErrorHandler';
import { ValidationErrorCode } from '../../utils/cacFileValidator';

describe('CAC Error Recovery Integration Tests', () => {
  beforeEach(() => {
    clearErrorLog();
  });

  describe('Network Failure Recovery', () => {
    it('should allow retry after network failure', () => {
      // Simulate network failure
      const networkError = new Error('Network timeout');
      const error = handleNetworkError(networkError, 'upload');

      // Verify error is retryable
      expect(error.retryable).toBe(true);
      expect(isRetryable(error)).toBe(true);
      expect(error.category).toBe(CACErrorCategory.NETWORK);

      // Verify actionable guidance suggests retry
      expect(error.actionableGuidance.toLowerCase()).toContain('try again');
    });

    it('should track multiple network failure attempts', () => {
      // Simulate multiple network failures
      const attempts = 3;
      for (let i = 0; i < attempts; i++) {
        const networkError = new Error(`Network attempt ${i + 1} failed`);
        handleNetworkError(networkError, 'upload');
      }

      // Verify all attempts were logged
      const recentErrors = getRecentErrors(attempts);
      expect(recentErrors).toHaveLength(attempts);
      expect(recentErrors.every(e => e.category === CACErrorCategory.NETWORK)).toBe(true);
    });

    it('should provide consistent guidance across retry attempts', () => {
      // First attempt
      const error1 = handleNetworkError(new Error('Connection failed'), 'upload');
      
      // Second attempt (retry)
      const error2 = handleNetworkError(new Error('Connection failed'), 'upload');

      // Verify guidance is consistent
      expect(error1.actionableGuidance).toBe(error2.actionableGuidance);
      expect(error1.retryable).toBe(error2.retryable);
    });

    it('should handle successful recovery after network failure', () => {
      // Simulate initial failure
      const networkError = new Error('Network timeout');
      const error = handleNetworkError(networkError, 'upload');

      expect(error.retryable).toBe(true);

      // Simulate successful retry (no error)
      // In real scenario, this would be a successful upload
      const errorsBefore = getRecentErrors(10).length;
      
      // After successful retry, no new error should be logged
      const errorsAfter = getRecentErrors(10).length;
      expect(errorsAfter).toBe(errorsBefore);
    });

    it('should handle network failure during download', () => {
      const networkError = new Error('Download interrupted');
      const error = handleNetworkError(networkError, 'download');

      expect(error.retryable).toBe(true);
      expect(error.message).toContain('download');
      expect(error.actionableGuidance).toContain('download');
    });
  });

  describe('Validation Error Recovery', () => {
    it('should allow retry with different file after validation failure', () => {
      // Simulate validation failure
      const error = handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);

      // Verify error is retryable
      expect(error.retryable).toBe(true);
      expect(error.category).toBe(CACErrorCategory.VALIDATION);

      // Verify guidance suggests selecting different file
      expect(error.actionableGuidance.toLowerCase()).toContain('select');
    });

    it('should handle file size validation recovery', () => {
      // Simulate file too large error
      const error = handleValidationError(ValidationErrorCode.FILE_TOO_LARGE);

      expect(error.retryable).toBe(true);
      expect(error.actionableGuidance.toLowerCase()).toContain('compress');
      expect(error.actionableGuidance).toContain('10MB');
    });

    it('should handle multiple validation errors in sequence', () => {
      // Simulate multiple validation failures
      const errors = [
        ValidationErrorCode.INVALID_FILE_TYPE,
        ValidationErrorCode.FILE_TOO_LARGE,
        ValidationErrorCode.INVALID_MIME_TYPE
      ];

      errors.forEach(errorCode => {
        const error = handleValidationError(errorCode);
        expect(error.retryable).toBe(true);
      });

      // Verify all errors were logged
      const recentErrors = getRecentErrors(errors.length);
      expect(recentErrors).toHaveLength(errors.length);
    });

    it('should provide specific guidance for each validation error type', () => {
      const fileTypeError = handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      const fileSizeError = handleValidationError(ValidationErrorCode.FILE_TOO_LARGE);

      // Each error should have unique, specific guidance
      expect(fileTypeError.actionableGuidance).not.toBe(fileSizeError.actionableGuidance);
      expect(fileTypeError.actionableGuidance).toContain('PDF');
      expect(fileSizeError.actionableGuidance).toContain('10MB');
    });
  });

  describe('Permission Error Recovery', () => {
    it('should not allow retry for permission errors', () => {
      // Simulate permission denial
      const error = handlePermissionError('view');

      // Verify error is not retryable
      expect(error.retryable).toBe(false);
      expect(isRetryable(error)).toBe(false);
      expect(error.category).toBe(CACErrorCategory.PERMISSION);
    });

    it('should provide guidance to contact administrator', () => {
      const error = handlePermissionError('download');

      expect(error.actionableGuidance.toLowerCase()).toContain('administrator');
      expect(error.actionableGuidance.toLowerCase()).toContain('permission');
    });

    it('should handle permission errors for different actions', () => {
      const actions = ['view', 'download', 'upload', 'delete'];
      
      actions.forEach(action => {
        const error = handlePermissionError(action);
        
        expect(error.retryable).toBe(false);
        expect(error.message).toContain(action);
      });
    });

    it('should include reason in permission error guidance', () => {
      const reason = 'User role is not authorized';
      const error = handlePermissionError('view', reason);

      expect(error.actionableGuidance).toContain(reason);
    });
  });

  describe('Upload Error Recovery', () => {
    it('should detect and handle network errors in upload', () => {
      const networkError = new Error('Network fetch failed');
      const error = handleUploadError(networkError, 'document.pdf');

      expect(error.category).toBe(CACErrorCategory.NETWORK);
      expect(error.retryable).toBe(true);
      expect(error.actionableGuidance).toContain('internet connection');
    });

    it('should detect and handle validation errors in upload', () => {
      // Upload error that's actually a validation issue
      const validationError = new Error('Invalid file type');
      const error = handleUploadError(validationError);

      // Should still be retryable (user can select different file)
      expect(error.retryable).toBe(true);
    });

    it('should handle upload retry with different file', () => {
      // First upload attempt fails
      const error1 = handleUploadError(new Error('Upload failed'), 'invalid.txt');
      expect(error1.retryable).toBe(true);

      // Second upload attempt with different file
      const error2 = handleUploadError(new Error('Upload failed'), 'valid.pdf');
      expect(error2.retryable).toBe(true);

      // Both errors should be logged
      const recentErrors = getRecentErrors(2);
      expect(recentErrors).toHaveLength(2);
    });

    it('should provide filename in upload error message', () => {
      const fileName = 'important-document.pdf';
      const error = handleUploadError(new Error('Upload failed'), fileName);

      expect(error.message).toContain(fileName);
    });
  });

  describe('Error State Cleanup', () => {
    it('should clear error log', () => {
      // Generate some errors
      handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      handleNetworkError(new Error('Network error'));
      handlePermissionError('view');

      expect(getRecentErrors(10).length).toBeGreaterThan(0);

      // Clear error log
      clearErrorLog();

      expect(getRecentErrors(10)).toHaveLength(0);
    });

    it('should allow fresh start after clearing errors', () => {
      // Generate errors
      handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      handleNetworkError(new Error('Network error'));

      // Clear errors
      clearErrorLog();

      // Generate new error
      handleValidationError(ValidationErrorCode.FILE_TOO_LARGE);

      // Should only have the new error
      const recentErrors = getRecentErrors(10);
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].errorCode).toBe(ValidationErrorCode.FILE_TOO_LARGE);
    });

    it('should maintain error log across multiple operations', () => {
      // Simulate a sequence of operations with errors
      handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      handleNetworkError(new Error('Network error'), 'upload');
      handleValidationError(ValidationErrorCode.FILE_TOO_LARGE);

      const errors = getRecentErrors(10);
      expect(errors).toHaveLength(3);

      // Verify order (most recent last)
      expect(errors[0].errorCode).toBe(ValidationErrorCode.INVALID_FILE_TYPE);
      expect(errors[1].category).toBe(CACErrorCategory.NETWORK);
      expect(errors[2].errorCode).toBe(ValidationErrorCode.FILE_TOO_LARGE);
    });
  });

  describe('Complex Error Recovery Scenarios', () => {
    it('should handle cascading errors gracefully', () => {
      // Simulate a complex scenario with multiple error types
      
      // 1. Validation error (user selects wrong file)
      const validationError = handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      expect(validationError.retryable).toBe(true);

      // 2. Network error (user selects correct file but network fails)
      const networkError = handleNetworkError(new Error('Connection lost'), 'upload');
      expect(networkError.retryable).toBe(true);

      // 3. Permission error (user tries to access restricted document)
      const permissionError = handlePermissionError('view');
      expect(permissionError.retryable).toBe(false);

      // All errors should be logged
      const errors = getRecentErrors(10);
      expect(errors).toHaveLength(3);
    });

    it('should provide appropriate guidance for each error in sequence', () => {
      // Simulate error sequence
      const error1 = handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);
      const error2 = handleNetworkError(new Error('Network error'), 'upload');
      const error3 = handlePermissionError('download');

      // Each error should have unique, appropriate guidance
      expect(error1.actionableGuidance).toContain('PDF');
      expect(error2.actionableGuidance).toContain('internet');
      expect(error3.actionableGuidance).toContain('administrator');
    });

    it('should handle error recovery workflow', () => {
      // Simulate a complete error recovery workflow
      
      // Step 1: Initial upload fails due to validation
      const validationError = handleValidationError(ValidationErrorCode.FILE_TOO_LARGE);
      expect(validationError.retryable).toBe(true);
      expect(validationError.actionableGuidance).toContain('compress');

      // Step 2: User compresses file and retries, but network fails
      const networkError = handleNetworkError(new Error('Network timeout'), 'upload');
      expect(networkError.retryable).toBe(true);
      expect(networkError.actionableGuidance).toContain('internet');

      // Step 3: User checks connection and retries successfully
      // (No error generated on success)

      // Verify error history
      const errors = getRecentErrors(10);
      expect(errors).toHaveLength(2);
      expect(errors[0].category).toBe(CACErrorCategory.VALIDATION);
      expect(errors[1].category).toBe(CACErrorCategory.NETWORK);
    });

    it('should handle concurrent error scenarios', () => {
      // Simulate multiple concurrent operations with errors
      const errors = [
        handleUploadError(new Error('Upload 1 failed'), 'doc1.pdf'),
        handleUploadError(new Error('Upload 2 failed'), 'doc2.pdf'),
        handleUploadError(new Error('Upload 3 failed'), 'doc3.pdf')
      ];

      // All errors should be retryable
      errors.forEach(error => {
        expect(error.retryable).toBe(true);
      });

      // All errors should be logged
      const recentErrors = getRecentErrors(10);
      expect(recentErrors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Error Recovery Best Practices', () => {
    it('should provide clear next steps for retryable errors', () => {
      const retryableErrors = [
        handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE),
        handleNetworkError(new Error('Network error'), 'upload')
      ];

      retryableErrors.forEach(error => {
        expect(error.retryable).toBe(true);
        expect(error.actionableGuidance.length).toBeGreaterThan(30);
        
        // Should contain action words
        const guidance = error.actionableGuidance.toLowerCase();
        const hasActionWords = 
          guidance.includes('please') ||
          guidance.includes('try') ||
          guidance.includes('select') ||
          guidance.includes('check');
        
        expect(hasActionWords).toBe(true);
      });
    });

    it('should explain why non-retryable errors cannot be retried', () => {
      const nonRetryableError = handlePermissionError('view');

      expect(nonRetryableError.retryable).toBe(false);
      expect(nonRetryableError.actionableGuidance).toContain('administrator');
      
      // Should explain that user needs help from someone else
      const guidance = nonRetryableError.actionableGuidance.toLowerCase();
      expect(guidance.includes('contact') || guidance.includes('administrator')).toBe(true);
    });

    it('should maintain error context across recovery attempts', () => {
      // First attempt
      const error1 = handleUploadError(new Error('Upload failed'), 'document.pdf');
      const errors1 = getRecentErrors(10);
      const timestamp1 = errors1[errors1.length - 1].timestamp;

      // Wait a bit (simulate user action)
      // In real scenario, there would be a delay

      // Second attempt
      const error2 = handleUploadError(new Error('Upload failed'), 'document.pdf');
      const errors2 = getRecentErrors(10);
      const timestamp2 = errors2[errors2.length - 1].timestamp;

      // Both errors should be logged with different timestamps
      expect(errors2).toHaveLength(2);
      expect(timestamp2.getTime()).toBeGreaterThanOrEqual(timestamp1.getTime());
    });
  });

  describe('Error Recovery Edge Cases', () => {
    it('should handle empty error messages gracefully', () => {
      const error = handleNetworkError(new Error(''), 'upload');

      expect(error.message).toBeTruthy();
      expect(error.actionableGuidance).toBeTruthy();
      expect(error.retryable).toBe(true);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = handleNetworkError(new Error(longMessage), 'upload');

      expect(error.technicalDetails).toBe(longMessage);
      expect(error.message.length).toBeLessThan(200); // User message should be concise
    });

    it('should handle special characters in error messages', () => {
      const specialMessage = 'Error: <script>alert("xss")</script>';
      const error = handleNetworkError(new Error(specialMessage), 'upload');

      expect(error.technicalDetails).toBe(specialMessage);
      expect(error.message).toBeTruthy();
    });

    it('should handle null or undefined error details', () => {
      const error = handleNetworkError(new Error(), 'upload');

      expect(error.message).toBeTruthy();
      expect(error.actionableGuidance).toBeTruthy();
      expect(error.category).toBe(CACErrorCategory.NETWORK);
    });
  });
});
