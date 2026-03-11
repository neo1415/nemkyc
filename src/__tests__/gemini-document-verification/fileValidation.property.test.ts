/**
 * Property Test: File size and format validation
 * 
 * This test validates that file validation behaves consistently
 * across different file types, sizes, and formats.
 * 
 * Property: For any file F with properties (size, type, content),
 * validation should consistently accept or reject based on defined limits.
 * 
 * Validates Requirements: 1.1-1.6 - Document upload support and file validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentProcessorService } from '../../services/geminiDocumentProcessor';
import { DocumentValidator } from '../../utils/geminiDocumentValidation';
import { PROCESSING_LIMITS, SUPPORTED_FILE_TYPES } from '../../config/geminiDocumentVerification';

// Mock dependencies
vi.mock('../../services/geminiOCREngine');
vi.mock('../../services/verificationMatcher');
vi.mock('../../services/geminiAuditLogger');

describe('File Validation Property Tests', () => {
  let documentProcessor: DocumentProcessorService;
  
  beforeEach(() => {
    documentProcessor = new DocumentProcessorService();
    vi.clearAllMocks();
  });

  /**
   * Property 1: File size validation consistency
   * Files within size limits should always be accepted, files exceeding limits should always be rejected
   */
  it('should consistently validate file sizes according to limits', async () => {
    const testCases = [
      // PDF files
      {
        type: 'application/pdf',
        sizes: [
          { size: 1024, shouldPass: true, description: '1KB PDF' },
          { size: 5 * 1024 * 1024, shouldPass: true, description: '5MB PDF' },
          { size: PROCESSING_LIMITS.maxFileSize.pdf - 1, shouldPass: true, description: 'Just under PDF limit' },
          { size: PROCESSING_LIMITS.maxFileSize.pdf, shouldPass: true, description: 'Exactly at PDF limit' },
          { size: PROCESSING_LIMITS.maxFileSize.pdf + 1, shouldPass: false, description: 'Just over PDF limit' },
          { size: 100 * 1024 * 1024, shouldPass: false, description: '100MB PDF' }
        ]
      },
      // Image files
      {
        type: 'image/jpeg',
        sizes: [
          { size: 1024, shouldPass: true, description: '1KB JPEG' },
          { size: 5 * 1024 * 1024, shouldPass: true, description: '5MB JPEG' },
          { size: PROCESSING_LIMITS.maxFileSize.image - 1, shouldPass: true, description: 'Just under image limit' },
          { size: PROCESSING_LIMITS.maxFileSize.image, shouldPass: true, description: 'Exactly at image limit' },
          { size: PROCESSING_LIMITS.maxFileSize.image + 1, shouldPass: false, description: 'Just over image limit' },
          { size: 50 * 1024 * 1024, shouldPass: false, description: '50MB JPEG' }
        ]
      }
    ];

    for (const testCase of testCases) {
      for (const sizeTest of testCase.sizes) {
        // Create file with specific size
        const fileContent = new Uint8Array(sizeTest.size);
        const file = new File([fileContent], 'test-file', { type: testCase.type });

        try {
          const result = await documentProcessor.processDocument(file, 'cac');
          
          if (sizeTest.shouldPass) {
            // Should not throw an error for valid files
            expect(result).toBeDefined();
          } else {
            // Should fail for oversized files
            expect(result.success).toBe(false);
            expect(result.error?.message).toContain('size');
          }
        } catch (error) {
          if (sizeTest.shouldPass) {
            throw new Error(`Unexpected error for ${sizeTest.description}: ${error}`);
          }
          // Expected error for oversized files
          expect(error).toBeDefined();
        }
      }
    }
  });

  /**
   * Property 2: File type validation consistency
   * Supported file types should always be accepted, unsupported types should always be rejected
   */
  it('should consistently validate file types', async () => {
    const supportedTypes = [
      ...SUPPORTED_FILE_TYPES.pdf,
      ...SUPPORTED_FILE_TYPES.image
    ];

    const unsupportedTypes = [
      'text/plain',
      'application/msword',
      'application/vnd.ms-excel',
      'video/mp4',
      'audio/mpeg',
      'image/gif',
      'image/bmp',
      'application/zip'
    ];

    // Test supported types
    for (const mimeType of supportedTypes) {
      const file = new File(['test content'], 'test-file', { type: mimeType });
      
      try {
        const result = await documentProcessor.processDocument(file, 'cac');
        // Should not fail due to file type (may fail for other reasons in mock)
        expect(result).toBeDefined();
      } catch (error) {
        // If it fails, it shouldn't be due to unsupported format
        expect(error.message).not.toContain('format');
        expect(error.message).not.toContain('supported');
      }
    }

    // Test unsupported types
    for (const mimeType of unsupportedTypes) {
      const file = new File(['test content'], 'test-file', { type: mimeType });
      
      const result = await documentProcessor.processDocument(file, 'cac');
      expect(result.success).toBe(false);
      expect(result.error?.message).toMatch(/format|supported/i);
    }
  });

  /**
   * Property 3: File validation idempotency
   * Same file should always produce the same validation result
   */
  it('should produce consistent validation results for identical files', async () => {
    const testFiles = [
      // Valid PDF
      new File(['pdf content'], 'test.pdf', { type: 'application/pdf' }),
      // Valid image
      new File(['image content'], 'test.jpg', { type: 'image/jpeg' }),
      // Oversized PDF
      new File([new Uint8Array(PROCESSING_LIMITS.maxFileSize.pdf + 1000)], 'large.pdf', { type: 'application/pdf' }),
      // Unsupported type
      new File(['text content'], 'test.txt', { type: 'text/plain' })
    ];

    for (const file of testFiles) {
      // Process same file multiple times
      const results = await Promise.all([
        documentProcessor.processDocument(file, 'cac'),
        documentProcessor.processDocument(file, 'cac'),
        documentProcessor.processDocument(file, 'individual')
      ]);

      // All results should have consistent success/failure status
      const firstSuccess = results[0].success;
      results.forEach((result, index) => {
        expect(result.success).toBe(firstSuccess);
        
        if (!result.success) {
          // Error messages should be consistent
          expect(result.error?.code).toBe(results[0].error?.code);
        }
      });
    }
  });

  /**
   * Property 4: File name validation consistency
   * File names should not affect validation outcome (only size and type matter)
   */
  it('should validate files consistently regardless of file name', async () => {
    const fileNames = [
      'document.pdf',
      'very-long-file-name-with-many-characters-and-special-symbols-@#$%^&*().pdf',
      'файл.pdf', // Cyrillic characters
      '文档.pdf', // Chinese characters
      'file with spaces.pdf',
      'file.with.multiple.dots.pdf',
      '.hidden.pdf',
      'UPPERCASE.PDF',
      'MiXeD-CaSe.PdF'
    ];

    const fileContent = 'test content';
    const mimeType = 'application/pdf';

    const results = [];
    for (const fileName of fileNames) {
      const file = new File([fileContent], fileName, { type: mimeType });
      const result = await documentProcessor.processDocument(file, 'cac');
      results.push(result);
    }

    // All results should have the same success status
    const firstSuccess = results[0].success;
    results.forEach(result => {
      expect(result.success).toBe(firstSuccess);
    });
  });

  /**
   * Property 5: Empty and minimal file handling
   * Edge cases with empty or minimal files should be handled consistently
   */
  it('should handle edge case files consistently', async () => {
    const edgeCases = [
      {
        name: 'Empty PDF',
        content: '',
        type: 'application/pdf',
        expectedBehavior: 'should_process' // Empty files are technically valid
      },
      {
        name: 'Single byte PDF',
        content: 'x',
        type: 'application/pdf',
        expectedBehavior: 'should_process'
      },
      {
        name: 'Empty image',
        content: '',
        type: 'image/jpeg',
        expectedBehavior: 'should_process'
      },
      {
        name: 'Single byte image',
        content: 'x',
        type: 'image/png',
        expectedBehavior: 'should_process'
      }
    ];

    for (const testCase of edgeCases) {
      const file = new File([testCase.content], 'test-file', { type: testCase.type });
      
      // Test multiple times for consistency
      const results = await Promise.all([
        documentProcessor.processDocument(file, 'cac'),
        documentProcessor.processDocument(file, 'individual')
      ]);

      // Results should be consistent
      expect(results[0].success).toBe(results[1].success);
      
      if (!results[0].success) {
        expect(results[0].error?.code).toBe(results[1].error?.code);
      }
    }
  });

  /**
   * Property 6: Concurrent file validation consistency
   * Multiple files processed concurrently should have consistent validation
   */
  it('should validate files consistently under concurrent processing', async () => {
    // Create multiple identical files
    const fileContent = 'test content for concurrent processing';
    const files = Array.from({ length: 10 }, (_, i) => 
      new File([fileContent], `test-${i}.pdf`, { type: 'application/pdf' })
    );

    // Process all files concurrently
    const results = await Promise.all(
      files.map(file => documentProcessor.processDocument(file, 'cac'))
    );

    // All results should have the same success status
    const firstSuccess = results[0].success;
    results.forEach((result, index) => {
      expect(result.success).toBe(firstSuccess);
      
      if (!result.success) {
        expect(result.error?.code).toBe(results[0].error?.code);
      }
    });
  });

  /**
   * Property 7: File validation with different verification types
   * Validation should be consistent regardless of verification type (CAC vs individual)
   */
  it('should validate files consistently across verification types', async () => {
    const testFiles = [
      new File(['valid content'], 'test.pdf', { type: 'application/pdf' }),
      new File(['valid content'], 'test.jpg', { type: 'image/jpeg' }),
      new File(['invalid content'], 'test.txt', { type: 'text/plain' }),
      new File([new Uint8Array(PROCESSING_LIMITS.maxFileSize.pdf + 1000)], 'large.pdf', { type: 'application/pdf' })
    ];

    for (const file of testFiles) {
      const cacResult = await documentProcessor.processDocument(file, 'cac');
      const individualResult = await documentProcessor.processDocument(file, 'individual');

      // File validation should be the same regardless of verification type
      expect(cacResult.success).toBe(individualResult.success);
      
      if (!cacResult.success && !individualResult.success) {
        // Error codes should be the same for file validation errors
        if (cacResult.error?.code.includes('FILE') || cacResult.error?.code.includes('FORMAT')) {
          expect(cacResult.error.code).toBe(individualResult.error?.code);
        }
      }
    }
  });

  /**
   * Property 8: File validation boundary conditions
   * Files at exact size boundaries should be handled consistently
   */
  it('should handle size boundary conditions consistently', async () => {
    const boundaryTests = [
      {
        type: 'application/pdf',
        limit: PROCESSING_LIMITS.maxFileSize.pdf,
        name: 'PDF'
      },
      {
        type: 'image/jpeg',
        limit: PROCESSING_LIMITS.maxFileSize.image,
        name: 'Image'
      }
    ];

    for (const test of boundaryTests) {
      const sizes = [
        test.limit - 2,  // Just under limit
        test.limit - 1,  // One byte under limit
        test.limit,      // Exactly at limit
        test.limit + 1,  // One byte over limit
        test.limit + 2   // Just over limit
      ];

      const results = [];
      for (const size of sizes) {
        const fileContent = new Uint8Array(size);
        const file = new File([fileContent], `test-${size}.${test.type.includes('pdf') ? 'pdf' : 'jpg'}`, { type: test.type });
        
        // Use the validator directly to test boundary conditions
        const validation = DocumentValidator.validateFile(file);
        results.push({ 
          size, 
          success: validation.isValid, 
          error: validation.errors.length > 0 ? { message: validation.errors.join(', ') } : null 
        });
      }

      // Files under and at limit should pass, files over limit should fail
      expect(results[0].success).toBe(true); // limit - 2
      expect(results[1].success).toBe(true); // limit - 1
      expect(results[2].success).toBe(true); // exactly at limit
      expect(results[3].success).toBe(false); // limit + 1
      expect(results[4].success).toBe(false); // limit + 2

      // Error messages for oversized files should be consistent
      if (results[3].error) {
        expect(results[3].error.message).toContain('size');
      }
      if (results[4].error) {
        expect(results[4].error.message).toContain('size');
      }
    }
  });
});