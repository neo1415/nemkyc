/**
 * Property-Based Tests for CAC Storage Paths
 * 
 * **Property 4: Storage path uniqueness**
 * **Validates: Requirements 3.3**
 * 
 * Tests that each document gets a unique storage path using fast-check
 * to generate various document metadata combinations.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateStoragePath } from '../../services/cacStorageService';
import { CACDocumentType } from '../../types/cacDocuments';

describe('Property 4: Storage Path Uniqueness', () => {
  it('should generate unique paths for different documents', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary identity IDs
        fc.string({ minLength: 1, maxLength: 50 }),
        // Generate arbitrary document types
        fc.constantFrom(
          CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          CACDocumentType.PARTICULARS_OF_DIRECTORS,
          CACDocumentType.SHARE_ALLOTMENT
        ),
        // Generate arbitrary filenames
        fc.string({ minLength: 1, maxLength: 100 }),
        (identityId, documentType, filename) => {
          // Generate two paths with same inputs
          const path1 = generateStoragePath(identityId, documentType, filename);
          const path2 = generateStoragePath(identityId, documentType, filename);
          
          // Paths should be different due to timestamp and random ID
          expect(path1).not.toBe(path2);
          
          // Both paths should be valid
          expect(path1).toMatch(/^cac-documents\//);
          expect(path2).toMatch(/^cac-documents\//);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate paths with correct structure for all document types', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(
          CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          CACDocumentType.PARTICULARS_OF_DIRECTORS,
          CACDocumentType.SHARE_ALLOTMENT
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        (identityId, documentType, filename) => {
          const path = generateStoragePath(identityId, documentType, filename);
          
          // Path should follow the structure: cac-documents/{identityId}/{documentType}/{uniqueId}_{filename}
          const parts = path.split('/');
          
          expect(parts[0]).toBe('cac-documents');
          expect(parts[1]).toBeDefined();
          expect(parts[2]).toBe(documentType);
          expect(parts[3]).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique paths even with identical metadata', () => {
    fc.assert(
      fc.property(
        fc.record({
          identityId: fc.string({ minLength: 1, maxLength: 50 }),
          documentType: fc.constantFrom(
            CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            CACDocumentType.PARTICULARS_OF_DIRECTORS,
            CACDocumentType.SHARE_ALLOTMENT
          ),
          filename: fc.string({ minLength: 1, maxLength: 100 })
        }),
        (metadata) => {
          // Generate multiple paths with same metadata
          const paths = new Set<string>();
          const numPaths = 10;
          
          for (let i = 0; i < numPaths; i++) {
            const path = generateStoragePath(
              metadata.identityId,
              metadata.documentType,
              metadata.filename
            );
            paths.add(path);
          }
          
          // All paths should be unique
          expect(paths.size).toBe(numPaths);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should sanitize all filenames to prevent path traversal', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(
          CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          CACDocumentType.PARTICULARS_OF_DIRECTORS,
          CACDocumentType.SHARE_ALLOTMENT
        ),
        // Generate filenames with potentially dangerous characters
        fc.string({ minLength: 1, maxLength: 100 }),
        (identityId, documentType, filename) => {
          const path = generateStoragePath(identityId, documentType, filename);
          
          // Extract the filename part (last segment)
          const filenamePart = path.split('/').pop() || '';
          
          // Filename should not contain path traversal sequences
          expect(filenamePart).not.toContain('..');
          expect(filenamePart).not.toContain('/');
          expect(filenamePart).not.toContain('\\');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate paths that include identity ID or sanitized version', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(
          CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          CACDocumentType.PARTICULARS_OF_DIRECTORS,
          CACDocumentType.SHARE_ALLOTMENT
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        (identityId, documentType, filename) => {
          const path = generateStoragePath(identityId, documentType, filename);
          
          // Path should contain the identity ID or its sanitized version
          // If identity ID contains only safe characters, it should be in the path as-is
          // Otherwise, it will be sanitized
          const sanitizedIdentityId = identityId
            .replace(/\.\./g, '_')
            .replace(/[/\\]/g, '_')
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .substring(0, 255);
          
          expect(path).toContain(sanitizedIdentityId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate paths that include document type', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(
          CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          CACDocumentType.PARTICULARS_OF_DIRECTORS,
          CACDocumentType.SHARE_ALLOTMENT
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        (identityId, documentType, filename) => {
          const path = generateStoragePath(identityId, documentType, filename);
          
          // Path should contain the document type
          expect(path).toContain(documentType);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate paths with reasonable length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(
          CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          CACDocumentType.PARTICULARS_OF_DIRECTORS,
          CACDocumentType.SHARE_ALLOTMENT
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        (identityId, documentType, filename) => {
          const path = generateStoragePath(identityId, documentType, filename);
          
          // Path should not be excessively long (Firebase Storage has limits)
          // Max path length is typically 1024 characters
          expect(path.length).toBeLessThan(1024);
          
          // Path should have minimum length
          expect(path.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate paths that are URL-safe', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(
          CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          CACDocumentType.PARTICULARS_OF_DIRECTORS,
          CACDocumentType.SHARE_ALLOTMENT
        ),
        fc.string({ minLength: 1, maxLength: 100 }),
        (identityId, documentType, filename) => {
          const path = generateStoragePath(identityId, documentType, filename);
          
          // Path should not contain characters that need URL encoding (except /)
          // Allow alphanumeric, dash, underscore, dot, and forward slash
          const urlSafePattern = /^[a-zA-Z0-9\-_.\/]+$/;
          expect(path).toMatch(urlSafePattern);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case filenames gracefully', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom(
          CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          CACDocumentType.PARTICULARS_OF_DIRECTORS,
          CACDocumentType.SHARE_ALLOTMENT
        ),
        // Generate edge case filenames
        fc.oneof(
          fc.constant(''),
          fc.constant('.'),
          fc.constant('..'),
          fc.constant('...'),
          fc.constant('/'),
          fc.constant('\\'),
          fc.constant('../../../etc/passwd'),
          fc.constant('file with spaces.pdf'),
          fc.constant('file@#$%^&*().pdf'),
          fc.string({ minLength: 1, maxLength: 500 }) // Very long filename
        ),
        (identityId, documentType, filename) => {
          // Should not throw error
          const path = generateStoragePath(identityId, documentType, filename);
          
          // Path should still be valid
          expect(path).toMatch(/^cac-documents\//);
          
          // Filename part should be sanitized
          const filenamePart = path.split('/').pop() || '';
          expect(filenamePart).not.toContain('..');
          expect(filenamePart).not.toContain('/');
          expect(filenamePart).not.toContain('\\');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate collision-resistant paths', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            identityId: fc.string({ minLength: 1, maxLength: 50 }),
            documentType: fc.constantFrom(
              CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              CACDocumentType.PARTICULARS_OF_DIRECTORS,
              CACDocumentType.SHARE_ALLOTMENT
            ),
            filename: fc.string({ minLength: 1, maxLength: 100 })
          }),
          { minLength: 10, maxLength: 50 }
        ),
        (metadataArray) => {
          const paths = new Set<string>();
          
          // Generate paths for all metadata
          for (const metadata of metadataArray) {
            const path = generateStoragePath(
              metadata.identityId,
              metadata.documentType,
              metadata.filename
            );
            paths.add(path);
          }
          
          // All paths should be unique (no collisions)
          expect(paths.size).toBe(metadataArray.length);
        }
      ),
      { numRuns: 20 }
    );
  });
});
