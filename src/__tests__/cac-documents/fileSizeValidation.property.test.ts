/**
 * Property-Based Tests for File Size Validation
 * 
 * Property 2: File size boundary validation
 * - Validates Requirements 2.2, 2.4
 * - Tests that files under 10MB always pass
 * - Tests that files over 10MB always fail
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateCACDocumentFile, ValidationErrorCode } from '../../utils/cacFileValidator';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

describe('Property 2: File size boundary validation', () => {
  describe('Files under size limit', () => {
    it('should always pass validation for files under 10MB with valid types', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MAX_FILE_SIZE - 1 }),
          fc.constantFrom(
            { ext: '.pdf', mime: 'application/pdf' },
            { ext: '.jpeg', mime: 'image/jpeg' },
            { ext: '.jpg', mime: 'image/jpg' },
            { ext: '.png', mime: 'image/png' }
          ),
          (fileSize, { ext, mime }) => {
            const content = new Uint8Array(fileSize);
            const file = new File([content], `document${ext}`, { type: mime });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.errorCode).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept very small files (1 byte to 1KB)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1024 }),
          (fileSize) => {
            const content = new Uint8Array(fileSize);
            const file = new File([content], 'document.pdf', {
              type: 'application/pdf'
            });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept medium files (1MB to 5MB)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1024 * 1024, max: 5 * 1024 * 1024 }),
          (fileSize) => {
            const content = new Uint8Array(fileSize);
            const file = new File([content], 'document.pdf', {
              type: 'application/pdf'
            });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept large files (5MB to just under 10MB)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5 * 1024 * 1024, max: MAX_FILE_SIZE - 1 }),
          (fileSize) => {
            const content = new Uint8Array(fileSize);
            const file = new File([content], 'document.pdf', {
              type: 'application/pdf'
            });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Files at exact size limit', () => {
    it('should accept files exactly at 10MB boundary', () => {
      const content = new Uint8Array(MAX_FILE_SIZE);
      const file = new File([content], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(true);
      expect(result.metadata?.fileSize).toBe(MAX_FILE_SIZE);
    });

    it('should accept files at 10MB for all valid file types', () => {
      const validTypes = [
        { ext: '.pdf', mime: 'application/pdf' },
        { ext: '.jpeg', mime: 'image/jpeg' },
        { ext: '.jpg', mime: 'image/jpg' },
        { ext: '.png', mime: 'image/png' }
      ];

      validTypes.forEach(({ ext, mime }) => {
        const content = new Uint8Array(MAX_FILE_SIZE);
        const file = new File([content], `document${ext}`, { type: mime });

        const result = validateCACDocumentFile(file);

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Files over size limit', () => {
    it('should always fail validation for files over 10MB', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_FILE_SIZE + 1, max: 50 * 1024 * 1024 }),
          fc.constantFrom(
            { ext: '.pdf', mime: 'application/pdf' },
            { ext: '.jpeg', mime: 'image/jpeg' },
            { ext: '.png', mime: 'image/png' }
          ),
          (fileSize, { ext, mime }) => {
            const content = new Uint8Array(fileSize);
            const file = new File([content], `document${ext}`, { type: mime });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBe(ValidationErrorCode.FILE_TOO_LARGE);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail for files just over 10MB (10MB + 1 byte)', () => {
      const content = new Uint8Array(MAX_FILE_SIZE + 1);
      const file = new File([content], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ValidationErrorCode.FILE_TOO_LARGE);
    });

    it('should fail for very large files (20MB+)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 20 * 1024 * 1024, max: 100 * 1024 * 1024 }),
          (fileSize) => {
            const content = new Uint8Array(fileSize);
            const file = new File([content], 'document.pdf', {
              type: 'application/pdf'
            });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBe(ValidationErrorCode.FILE_TOO_LARGE);
          }
        ),
        { numRuns: 50 } // Fewer runs for very large files
      );
    });

    it('should include size information in error message', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_FILE_SIZE + 1, max: 50 * 1024 * 1024 }),
          (fileSize) => {
            const content = new Uint8Array(fileSize);
            const file = new File([content], 'document.pdf', {
              type: 'application/pdf'
            });

            const result = validateCACDocumentFile(file);

            expect(result.error).toBeDefined();
            expect(result.error).toContain('10MB');
            expect(result.error).toContain('MB'); // Should mention size unit
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Size validation consistency', () => {
    it('should produce consistent results for the same file size', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 * 1024 * 1024 }),
          (fileSize) => {
            const content = new Uint8Array(fileSize);
            const file = new File([content], 'document.pdf', {
              type: 'application/pdf'
            });

            // Validate multiple times
            const result1 = validateCACDocumentFile(file);
            const result2 = validateCACDocumentFile(file);
            const result3 = validateCACDocumentFile(file);

            // All results should be identical
            expect(result1.isValid).toBe(result2.isValid);
            expect(result2.isValid).toBe(result3.isValid);
            expect(result1.errorCode).toBe(result2.errorCode);
            expect(result2.errorCode).toBe(result3.errorCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate size independently of file type', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_FILE_SIZE + 1, max: 50 * 1024 * 1024 }),
          fc.constantFrom(
            { ext: '.pdf', mime: 'application/pdf' },
            { ext: '.jpeg', mime: 'image/jpeg' },
            { ext: '.png', mime: 'image/png' }
          ),
          (fileSize, { ext, mime }) => {
            const content = new Uint8Array(fileSize);
            const file = new File([content], `document${ext}`, { type: mime });

            const result = validateCACDocumentFile(file);

            // All should fail due to size, regardless of type
            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBe(ValidationErrorCode.FILE_TOO_LARGE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Boundary testing', () => {
    it('should handle sizes around the 10MB boundary correctly', () => {
      const testSizes = [
        MAX_FILE_SIZE - 1000,  // Just under
        MAX_FILE_SIZE - 1,     // 1 byte under
        MAX_FILE_SIZE,         // Exactly at limit
        MAX_FILE_SIZE + 1,     // 1 byte over
        MAX_FILE_SIZE + 1000   // Just over
      ];

      testSizes.forEach((size) => {
        const content = new Uint8Array(size);
        const file = new File([content], 'document.pdf', {
          type: 'application/pdf'
        });

        const result = validateCACDocumentFile(file);

        if (size <= MAX_FILE_SIZE) {
          expect(result.isValid).toBe(true);
        } else {
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe(ValidationErrorCode.FILE_TOO_LARGE);
        }
      });
    });
  });

  describe('Zero and empty file handling', () => {
    it('should always reject empty files (0 bytes)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            { ext: '.pdf', mime: 'application/pdf' },
            { ext: '.jpeg', mime: 'image/jpeg' },
            { ext: '.png', mime: 'image/png' }
          ),
          ({ ext, mime }) => {
            const file = new File([], `document${ext}`, { type: mime });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBe(ValidationErrorCode.EMPTY_FILE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
