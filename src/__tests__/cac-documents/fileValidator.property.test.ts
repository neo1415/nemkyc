/**
 * Property-Based Tests for CAC Document File Validator
 * 
 * Uses fast-check to test file validation properties across many generated inputs.
 * 
 * Property 1: File type validation consistency
 * - Validates Requirements 2.1, 2.2
 * - Tests that valid file types always pass validation
 * - Tests that invalid file types always fail validation
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateCACDocumentFile, ValidationErrorCode } from '../../utils/cacFileValidator';

describe('Property-Based Tests: File Validator', () => {
  describe('Property 1: File type validation consistency', () => {
    it('should always accept valid PDF files regardless of size (under limit)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 1024 * 1024 }), // File size 1 byte to 10MB
          fc.string({ minLength: 1, maxLength: 100 }), // Filename
          (fileSize, baseName) => {
            const content = new Uint8Array(fileSize);
            const filename = `${baseName}.pdf`;
            const file = new File([content], filename, {
              type: 'application/pdf'
            });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(true);
            expect(result.metadata).toBeDefined();
            expect(result.metadata?.mimeType).toBe('application/pdf');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always accept valid JPEG files regardless of size (under limit)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (fileSize, baseName) => {
            const content = new Uint8Array(fileSize);
            const filename = `${baseName}.jpeg`;
            const file = new File([content], filename, {
              type: 'image/jpeg'
            });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(true);
            expect(result.metadata?.mimeType).toBe('image/jpeg');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always accept valid PNG files regardless of size (under limit)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (fileSize, baseName) => {
            const content = new Uint8Array(fileSize);
            const filename = `${baseName}.png`;
            const file = new File([content], filename, {
              type: 'image/png'
            });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(true);
            expect(result.metadata?.mimeType).toBe('image/png');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always reject invalid file extensions', () => {
      const invalidExtensions = ['.txt', '.doc', '.docx', '.xls', '.xlsx', '.exe', '.js', '.html', '.zip'];

      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom(...invalidExtensions),
          (fileSize, baseName, extension) => {
            const content = new Uint8Array(fileSize);
            const filename = `${baseName}${extension}`;
            const file = new File([content], filename, {
              type: 'application/octet-stream'
            });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always reject invalid MIME types', () => {
      const invalidMimeTypes = [
        'text/plain',
        'text/html',
        'application/javascript',
        'application/x-msdownload',
        'application/zip',
        'video/mp4',
        'audio/mpeg'
      ];

      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom(...invalidMimeTypes),
          (fileSize, baseName, mimeType) => {
            const content = new Uint8Array(fileSize);
            // Use .pdf extension but wrong MIME type
            const filename = `${baseName}.pdf`;
            const file = new File([content], filename, {
              type: mimeType
            });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBe(ValidationErrorCode.INVALID_MIME_TYPE);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case-insensitive file extensions', () => {
      const validExtensions = [
        { ext: '.PDF', mime: 'application/pdf' },
        { ext: '.Pdf', mime: 'application/pdf' },
        { ext: '.JPEG', mime: 'image/jpeg' },
        { ext: '.Jpeg', mime: 'image/jpeg' },
        { ext: '.PNG', mime: 'image/png' },
        { ext: '.Png', mime: 'image/png' }
      ];

      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom(...validExtensions),
          (fileSize, baseName, { ext, mime }) => {
            const content = new Uint8Array(fileSize);
            const filename = `${baseName}${ext}`;
            const file = new File([content], filename, {
              type: mime
            });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: File size boundary validation', () => {
    it('should always accept files under 10MB', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 1024 * 1024 - 1 }), // Just under 10MB
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

    it('should always reject files over 10MB', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10 * 1024 * 1024 + 1, max: 50 * 1024 * 1024 }), // Over 10MB
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
        { numRuns: 100 }
      );
    });

    it('should accept files exactly at 10MB boundary', () => {
      const exactSize = 10 * 1024 * 1024;
      const content = new Uint8Array(exactSize);
      const file = new File([content], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should always reject empty files', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('application/pdf', 'image/jpeg', 'image/png'),
          (filename, mimeType) => {
            const file = new File([], filename, { type: mimeType });

            const result = validateCACDocumentFile(file);

            expect(result.isValid).toBe(false);
            expect(result.errorCode).toBe(ValidationErrorCode.EMPTY_FILE);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Validation result consistency', () => {
    it('should always return consistent results for the same file', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('application/pdf', 'image/jpeg', 'image/png'),
          (fileSize, filename, mimeType) => {
            const content = new Uint8Array(fileSize);
            const extension = mimeType === 'application/pdf' ? '.pdf' :
                            mimeType === 'image/jpeg' ? '.jpeg' : '.png';
            const file = new File([content], `${filename}${extension}`, {
              type: mimeType
            });

            // Validate multiple times
            const result1 = validateCACDocumentFile(file);
            const result2 = validateCACDocumentFile(file);
            const result3 = validateCACDocumentFile(file);

            // Results should be identical
            expect(result1.isValid).toBe(result2.isValid);
            expect(result2.isValid).toBe(result3.isValid);
            expect(result1.errorCode).toBe(result2.errorCode);
            expect(result2.errorCode).toBe(result3.errorCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include metadata for valid files', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom(
            { ext: '.pdf', mime: 'application/pdf' },
            { ext: '.jpeg', mime: 'image/jpeg' },
            { ext: '.png', mime: 'image/png' }
          ),
          (fileSize, baseName, { ext, mime }) => {
            const content = new Uint8Array(fileSize);
            const filename = `${baseName}${ext}`;
            const file = new File([content], filename, { type: mime });

            const result = validateCACDocumentFile(file);

            if (result.isValid) {
              expect(result.metadata).toBeDefined();
              expect(result.metadata?.filename).toBe(filename);
              expect(result.metadata?.fileSize).toBe(fileSize);
              expect(result.metadata?.mimeType).toBe(mime);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include error information for invalid files', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10 * 1024 * 1024 + 1, max: 50 * 1024 * 1024 }), // Over limit
          fc.string({ minLength: 1, maxLength: 100 }),
          (fileSize, filename) => {
            const content = new Uint8Array(fileSize);
            const file = new File([content], `${filename}.pdf`, {
              type: 'application/pdf'
            });

            const result = validateCACDocumentFile(file);

            if (!result.isValid) {
              expect(result.error).toBeDefined();
              expect(result.error).not.toBe('');
              expect(result.errorCode).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Error message quality', () => {
    it('should always provide actionable error messages', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 * 1024 * 1024 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('.txt', '.doc', '.exe', '.js'),
          (fileSize, baseName, extension) => {
            const content = new Uint8Array(fileSize);
            const filename = `${baseName}${extension}`;
            const file = new File([content], filename, {
              type: 'application/octet-stream'
            });

            const result = validateCACDocumentFile(file);

            if (!result.isValid && result.error) {
              // Error messages should be helpful
              expect(result.error.length).toBeGreaterThan(10);
              // Should mention what to do
              expect(result.error.toLowerCase()).toMatch(/please|select|choose/);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
