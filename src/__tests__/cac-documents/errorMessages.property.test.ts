/**
 * Property-Based Tests for CAC Error Messages
 * 
 * **Property 12: Error message clarity**
 * **Validates: Requirements 12.1, 12.6**
 * 
 * Tests that error messages always provide actionable guidance across various error scenarios.
 * Uses fast-check to generate diverse error conditions and verify message quality.
 */

import * as fc from 'fast-check';
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
  formatErrorForDisplay,
  CACError,
  CACErrorCategory,
  ErrorSeverity
} from '../../services/cacErrorHandler';
import { ValidationErrorCode } from '../../utils/cacFileValidator';

describe('Property 12: Error Message Clarity', () => {
  describe('Actionable Guidance Property', () => {
    it('should always provide actionable guidance for validation errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ValidationErrorCode)),
          fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
          (errorCode, customMessage) => {
            const error = handleValidationError(errorCode, customMessage);

            // Property: Every error must have actionable guidance
            expect(error.actionableGuidance).toBeTruthy();
            expect(error.actionableGuidance.length).toBeGreaterThan(20);
            
            // Property: Actionable guidance should contain helpful keywords
            const guidance = error.actionableGuidance.toLowerCase();
            const hasActionableKeywords = 
              guidance.includes('please') ||
              guidance.includes('try') ||
              guidance.includes('select') ||
              guidance.includes('ensure') ||
              guidance.includes('contact');
            
            expect(hasActionableKeywords).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should always provide actionable guidance for network errors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.constantFrom('upload', 'download', 'preview', 'operation', 'sync'),
          (errorMessage, operation) => {
            const originalError = new Error(errorMessage);
            const error = handleNetworkError(originalError, operation);

            // Property: Network errors must suggest checking connection
            expect(error.actionableGuidance).toBeTruthy();
            expect(error.actionableGuidance.toLowerCase()).toContain('internet');
            expect(error.actionableGuidance.toLowerCase()).toContain('try again');
            
            // Property: Must be retryable
            expect(error.retryable).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should always provide actionable guidance for permission errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('view', 'download', 'upload', 'delete', 'replace'),
          fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
          (action, reason) => {
            const error = handlePermissionError(action, reason);

            // Property: Permission errors must mention administrator
            expect(error.actionableGuidance).toBeTruthy();
            expect(error.actionableGuidance.toLowerCase()).toContain('administrator');
            
            // Property: Must not be retryable (permission won't change on retry)
            expect(error.retryable).toBe(false);
            
            // Property: Must have appropriate severity
            expect(error.severity).toBe(ErrorSeverity.WARNING);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should always provide actionable guidance for security errors', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.constantFrom('encryption', 'decryption'),
          (errorMessage, operation) => {
            const originalError = new Error(errorMessage);
            const error = handleSecurityError(originalError, operation);

            // Property: Security errors must have critical or high severity
            expect(error.severity).toBe(ErrorSeverity.CRITICAL);
            
            // Property: Must provide actionable guidance
            expect(error.actionableGuidance).toBeTruthy();
            expect(error.actionableGuidance.length).toBeGreaterThan(30);
            
            // Property: Encryption errors should be retryable, decryption should not
            if (operation === 'encryption') {
              expect(error.retryable).toBe(true);
            } else {
              expect(error.retryable).toBe(false);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should always provide actionable guidance for storage quota errors', () => {
      fc.assert(
        fc.property(
          fc.option(fc.nat({ max: 1000000000 }), { nil: undefined }),
          fc.option(fc.nat({ max: 1000000000 }), { nil: undefined }),
          (currentUsage, quota) => {
            const error = handleStorageQuotaError(currentUsage, quota);

            // Property: Storage quota errors must mention deletion or administrator
            expect(error.actionableGuidance).toBeTruthy();
            const guidance = error.actionableGuidance.toLowerCase();
            expect(
              guidance.includes('delete') || guidance.includes('administrator')
            ).toBe(true);
            
            // Property: Must not be retryable (quota won't change on retry)
            expect(error.retryable).toBe(false);
            
            // Property: Must have error severity
            expect(error.severity).toBe(ErrorSeverity.ERROR);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Message Clarity Property', () => {
    it('should produce clear, concise error messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ValidationErrorCode)),
          (errorCode) => {
            const error = handleValidationError(errorCode);

            // Property: Messages should be concise (not too long)
            expect(error.message.length).toBeLessThan(150);
            
            // Property: Messages should not contain technical jargon
            const message = error.message.toLowerCase();
            expect(message).not.toContain('exception');
            expect(message).not.toContain('null');
            expect(message).not.toContain('undefined');
            expect(message).not.toContain('stack trace');
            
            // Property: Messages should be complete sentences or phrases
            expect(error.message.length).toBeGreaterThan(5);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should format errors consistently for display', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ValidationErrorCode)),
          (errorCode) => {
            const error = handleValidationError(errorCode);
            const formatted = formatErrorForDisplay(error);

            // Property: Formatted message must contain both message and guidance
            expect(formatted).toContain(error.message);
            expect(formatted).toContain(error.actionableGuidance);
            
            // Property: Formatted message should be non-empty
            expect(formatted.length).toBeGreaterThan(error.message.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Error Category Consistency Property', () => {
    it('should categorize validation errors consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ValidationErrorCode)),
          (errorCode) => {
            const error = handleValidationError(errorCode);

            // Property: All validation errors must have VALIDATION category
            expect(error.category).toBe(CACErrorCategory.VALIDATION);
            
            // Property: All validation errors must have WARNING severity
            expect(error.severity).toBe(ErrorSeverity.WARNING);
            
            // Property: All validation errors must be retryable
            expect(error.retryable).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should categorize network errors consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.string({ minLength: 3, maxLength: 20 }),
          (errorMessage, operation) => {
            const originalError = new Error(errorMessage);
            const error = handleNetworkError(originalError, operation);

            // Property: All network errors must have NETWORK category
            expect(error.category).toBe(CACErrorCategory.NETWORK);
            
            // Property: All network errors must have ERROR severity
            expect(error.severity).toBe(ErrorSeverity.ERROR);
            
            // Property: All network errors must be retryable
            expect(error.retryable).toBe(true);
            
            // Property: All network errors must have error code
            expect(error.errorCode).toBe('NETWORK_ERROR');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should categorize permission errors consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 20 }),
          (action) => {
            const error = handlePermissionError(action);

            // Property: All permission errors must have PERMISSION category
            expect(error.category).toBe(CACErrorCategory.PERMISSION);
            
            // Property: All permission errors must have WARNING severity
            expect(error.severity).toBe(ErrorSeverity.WARNING);
            
            // Property: All permission errors must not be retryable
            expect(error.retryable).toBe(false);
            
            // Property: All permission errors must have error code
            expect(error.errorCode).toBe('PERMISSION_DENIED');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Error Detection Property', () => {
    it('should correctly detect error types in upload errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'Network fetch failed',
            'Storage quota exceeded',
            'Unauthorized access',
            'Failed to encrypt document',
            'Unknown error'
          ),
          fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
          (errorMessage, fileName) => {
            const originalError = new Error(errorMessage);
            const error = handleUploadError(originalError, fileName);

            // Property: Error category must match error message content
            if (errorMessage.toLowerCase().includes('network') || 
                errorMessage.toLowerCase().includes('fetch')) {
              expect(error.category).toBe(CACErrorCategory.NETWORK);
            } else if (errorMessage.toLowerCase().includes('quota') || 
                       errorMessage.toLowerCase().includes('storage')) {
              expect(error.category).toBe(CACErrorCategory.STORAGE_QUOTA);
            } else if (errorMessage.toLowerCase().includes('unauthorized') || 
                       errorMessage.toLowerCase().includes('permission')) {
              expect(error.category).toBe(CACErrorCategory.PERMISSION);
            } else if (errorMessage.toLowerCase().includes('encrypt')) {
              expect(error.category).toBe(CACErrorCategory.SECURITY);
            }
            
            // Property: Error must have actionable guidance
            expect(error.actionableGuidance).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly detect error types in download errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'Network connection lost',
            'Permission denied',
            'Failed to decrypt file',
            'Download failed'
          ),
          fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
          (errorMessage, fileName) => {
            const originalError = new Error(errorMessage);
            const error = handleDownloadError(originalError, fileName);

            // Property: Error category must match error message content
            if (errorMessage.toLowerCase().includes('network')) {
              expect(error.category).toBe(CACErrorCategory.NETWORK);
            } else if (errorMessage.toLowerCase().includes('permission')) {
              expect(error.category).toBe(CACErrorCategory.PERMISSION);
            } else if (errorMessage.toLowerCase().includes('decrypt')) {
              expect(error.category).toBe(CACErrorCategory.SECURITY);
            }
            
            // Property: Error must have actionable guidance
            expect(error.actionableGuidance).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Retryability Property', () => {
    it('should mark transient errors as retryable', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'Network timeout',
            'Connection refused',
            'Service unavailable',
            'Request timeout'
          ),
          (errorMessage) => {
            const originalError = new Error(errorMessage);
            const error = handleNetworkError(originalError);

            // Property: Network errors are transient and should be retryable
            expect(error.retryable).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should mark permanent errors as non-retryable', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('view', 'download', 'upload', 'delete'),
          (action) => {
            const error = handlePermissionError(action);

            // Property: Permission errors are permanent and should not be retryable
            expect(error.retryable).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should mark validation errors as retryable with different input', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ValidationErrorCode)),
          (errorCode) => {
            const error = handleValidationError(errorCode);

            // Property: Validation errors can be fixed by user and are retryable
            expect(error.retryable).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Error Code Consistency Property', () => {
    it('should always include error codes for categorized errors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ValidationErrorCode)),
          (errorCode) => {
            const error = handleValidationError(errorCode);

            // Property: Validation errors must have error codes
            expect(error.errorCode).toBeTruthy();
            expect(error.errorCode).toBe(errorCode);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should use consistent error code format', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            handleNetworkError(new Error('test')),
            handlePermissionError('view'),
            handleStorageQuotaError()
          ),
          (error) => {
            // Property: Error codes should be uppercase with underscores
            if (error.errorCode) {
              expect(error.errorCode).toMatch(/^[A-Z_]+$/);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Technical Details Property', () => {
    it('should preserve technical details for debugging', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          (errorMessage) => {
            const originalError = new Error(errorMessage);
            const error = handleNetworkError(originalError);

            // Property: Technical details should be preserved
            expect(error.technicalDetails).toBe(errorMessage);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not expose technical details in user-facing messages', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          (errorMessage) => {
            const originalError = new Error(errorMessage);
            const error = handleGenericError(originalError);

            // Property: User-facing message should not contain raw technical details
            // (unless explicitly included in actionable guidance)
            expect(error.message).not.toBe(errorMessage);
            expect(error.message.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Guidance Specificity Property', () => {
    it('should provide specific guidance for file type errors', () => {
      const error = handleValidationError(ValidationErrorCode.INVALID_FILE_TYPE);

      // Property: File type errors must mention allowed types
      expect(error.actionableGuidance.toLowerCase()).toContain('pdf');
      expect(error.actionableGuidance.toLowerCase()).toContain('image');
    });

    it('should provide specific guidance for file size errors', () => {
      const error = handleValidationError(ValidationErrorCode.FILE_TOO_LARGE);

      // Property: File size errors must mention size limit
      expect(error.actionableGuidance).toContain('10MB');
      expect(error.actionableGuidance.toLowerCase()).toContain('compress');
    });

    it('should provide specific guidance for storage quota errors', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000000000 }),
          fc.nat({ max: 1000000000 }),
          (currentUsage, quota) => {
            const error = handleStorageQuotaError(currentUsage, quota);

            // Property: Storage quota errors with details must show usage
            if (currentUsage && quota) {
              expect(error.message).toContain('MB');
            }
            
            // Property: Must suggest deletion or quota increase
            const guidance = error.actionableGuidance.toLowerCase();
            expect(
              guidance.includes('delete') || guidance.includes('increase')
            ).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Error Message Completeness Property', () => {
    it('should always have all required error properties', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(ValidationErrorCode)),
          (errorCode) => {
            const error = handleValidationError(errorCode);

            // Property: All errors must have required properties
            expect(error).toHaveProperty('category');
            expect(error).toHaveProperty('severity');
            expect(error).toHaveProperty('message');
            expect(error).toHaveProperty('actionableGuidance');
            expect(error).toHaveProperty('retryable');
            
            // Property: All properties must have valid values
            expect(Object.values(CACErrorCategory)).toContain(error.category);
            expect(Object.values(ErrorSeverity)).toContain(error.severity);
            expect(typeof error.message).toBe('string');
            expect(typeof error.actionableGuidance).toBe('string');
            expect(typeof error.retryable).toBe('boolean');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
