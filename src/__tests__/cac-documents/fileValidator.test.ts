/**
 * Unit Tests for CAC Document File Validator
 * 
 * Tests file validation logic including type, size, and content validation.
 */

import { describe, it, expect } from 'vitest';
import {
  validateCACDocumentFile,
  validateFileContent,
  ValidationErrorCode,
  getValidationErrorMessage
} from '../../utils/cacFileValidator';

describe('validateCACDocumentFile', () => {
  describe('Valid file types', () => {
    it('should accept valid PDF files', () => {
      const file = new File(['test content'], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.filename).toBe('document.pdf');
      expect(result.metadata?.mimeType).toBe('application/pdf');
    });

    it('should accept valid JPEG files', () => {
      const file = new File(['test content'], 'document.jpeg', {
        type: 'image/jpeg'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(true);
      expect(result.metadata?.mimeType).toBe('image/jpeg');
    });

    it('should accept valid JPG files', () => {
      const file = new File(['test content'], 'document.jpg', {
        type: 'image/jpg'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should accept valid PNG files', () => {
      const file = new File(['test content'], 'document.png', {
        type: 'image/png'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(true);
      expect(result.metadata?.mimeType).toBe('image/png');
    });
  });

  describe('Invalid file types', () => {
    it('should reject files with invalid extensions', () => {
      const file = new File(['test content'], 'document.txt', {
        type: 'text/plain'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ValidationErrorCode.INVALID_FILE_TYPE);
      expect(result.error).toContain('PDF or image file');
    });

    it('should reject files with invalid MIME types', () => {
      const file = new File(['test content'], 'document.pdf', {
        type: 'text/plain'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ValidationErrorCode.INVALID_MIME_TYPE);
    });

    it('should reject executable files', () => {
      const file = new File(['test content'], 'malicious.exe', {
        type: 'application/x-msdownload'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(false);
    });

    it('should reject script files', () => {
      const file = new File(['test content'], 'script.js', {
        type: 'application/javascript'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(false);
    });
  });

  describe('File size validation', () => {
    it('should accept files under 10MB', () => {
      const content = new Uint8Array(5 * 1024 * 1024); // 5MB
      const file = new File([content], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should accept files exactly at 10MB', () => {
      const content = new Uint8Array(10 * 1024 * 1024); // 10MB
      const file = new File([content], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(true);
    });

    it('should reject files over 10MB', () => {
      const content = new Uint8Array(11 * 1024 * 1024); // 11MB
      const file = new File([content], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ValidationErrorCode.FILE_TOO_LARGE);
      expect(result.error).toContain('10MB');
    });

    it('should include file size in error message', () => {
      const content = new Uint8Array(15 * 1024 * 1024); // 15MB
      const file = new File([content], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = validateCACDocumentFile(file);

      expect(result.error).toContain('15');
    });
  });

  describe('Empty file validation', () => {
    it('should reject empty files', () => {
      const file = new File([], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = validateCACDocumentFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ValidationErrorCode.EMPTY_FILE);
      expect(result.error).toContain('empty');
    });
  });

  describe('Null/undefined file validation', () => {
    it('should reject null file', () => {
      const result = validateCACDocumentFile(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ValidationErrorCode.INVALID_FILE);
    });

    it('should reject undefined file', () => {
      const result = validateCACDocumentFile(undefined as any);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ValidationErrorCode.INVALID_FILE);
    });
  });

  describe('Error message formatting', () => {
    it('should provide actionable error messages', () => {
      const file = new File(['test'], 'document.txt', {
        type: 'text/plain'
      });

      const result = validateCACDocumentFile(file);

      expect(result.error).toContain('Please');
      expect(result.error).toContain('PDF or image');
    });
  });
});

describe('validateFileContent', () => {
  describe('PDF signature validation', () => {
    it('should accept files with valid PDF signature', async () => {
      // PDF signature: %PDF
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);
      const file = new File([pdfHeader], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = await validateFileContent(file);

      expect(result.isValid).toBe(true);
    });

    it('should reject files with invalid PDF signature', async () => {
      const invalidHeader = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      const file = new File([invalidHeader], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = await validateFileContent(file);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe(ValidationErrorCode.MALICIOUS_CONTENT);
    });
  });

  describe('JPEG signature validation', () => {
    it('should accept files with valid JPEG signature', async () => {
      // JPEG signature: FF D8 FF
      const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const file = new File([jpegHeader], 'document.jpeg', {
        type: 'image/jpeg'
      });

      const result = await validateFileContent(file);

      expect(result.isValid).toBe(true);
    });
  });

  describe('PNG signature validation', () => {
    it('should accept files with valid PNG signature', async () => {
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const file = new File([pngHeader], 'document.png', {
        type: 'image/png'
      });

      const result = await validateFileContent(file);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Malicious content detection', () => {
    it('should reject files with mismatched signatures', async () => {
      // Text content in a PDF file
      const textContent = new TextEncoder().encode('This is not a PDF');
      const file = new File([textContent], 'document.pdf', {
        type: 'application/pdf'
      });

      const result = await validateFileContent(file);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('content does not match');
    });
  });
});

describe('getValidationErrorMessage', () => {
  it('should return appropriate message for INVALID_FILE_TYPE', () => {
    const message = getValidationErrorMessage(ValidationErrorCode.INVALID_FILE_TYPE);
    expect(message).toContain('PDF or image');
  });

  it('should return appropriate message for FILE_TOO_LARGE', () => {
    const message = getValidationErrorMessage(ValidationErrorCode.FILE_TOO_LARGE);
    expect(message).toContain('10MB');
  });

  it('should return appropriate message for INVALID_MIME_TYPE', () => {
    const message = getValidationErrorMessage(ValidationErrorCode.INVALID_MIME_TYPE);
    expect(message).toContain('Invalid file format');
  });

  it('should return appropriate message for MALICIOUS_CONTENT', () => {
    const message = getValidationErrorMessage(ValidationErrorCode.MALICIOUS_CONTENT);
    expect(message).toContain('corrupted');
  });

  it('should return appropriate message for EMPTY_FILE', () => {
    const message = getValidationErrorMessage(ValidationErrorCode.EMPTY_FILE);
    expect(message).toContain('empty');
  });

  it('should return default message for unknown error code', () => {
    const message = getValidationErrorMessage('UNKNOWN' as any);
    expect(message).toContain('validation failed');
  });
});
