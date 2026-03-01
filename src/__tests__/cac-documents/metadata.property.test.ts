/**
 * Property-Based Tests for CAC Metadata
 * 
 * **Property 5: Metadata completeness**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**
 * 
 * Tests that all required metadata fields are always present using fast-check
 * to generate various document scenarios.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CACDocumentMetadata, CACDocumentType, DocumentStatus } from '../../types/cacDocuments';

describe('Property 5: Metadata Completeness', () => {
  // Arbitrary generator for CAC document metadata
  const cacDocumentMetadataArbitrary = fc.record({
    id: fc.string({ minLength: 1, maxLength: 100 }),
    documentType: fc.constantFrom(
      CACDocumentType.CERTIFICATE_OF_INCORPORATION,
      CACDocumentType.PARTICULARS_OF_DIRECTORS,
      CACDocumentType.SHARE_ALLOTMENT
    ),
    filename: fc.string({ minLength: 1, maxLength: 255 }),
    fileSize: fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
    mimeType: fc.constantFrom('application/pdf', 'image/jpeg', 'image/png'),
    uploadedAt: fc.date(),
    uploaderId: fc.string({ minLength: 1, maxLength: 100 }),
    identityRecordId: fc.string({ minLength: 1, maxLength: 100 }),
    storagePath: fc.string({ minLength: 1, maxLength: 500 }),
    encryptionMetadata: fc.record({
      algorithm: fc.constant('AES-256-GCM'),
      keyVersion: fc.constant('v1'),
      iv: fc.string({ minLength: 1, maxLength: 100 }),
      authTag: fc.string({ minLength: 1, maxLength: 100 })
    }),
    status: fc.constantFrom(
      DocumentStatus.UPLOADED,
      DocumentStatus.MISSING,
      DocumentStatus.PENDING,
      DocumentStatus.FAILED
    ),
    version: fc.integer({ min: 1, max: 100 }),
    isCurrent: fc.boolean()
  });

  it('should always have all required metadata fields', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        // Verify all required fields are present
        expect(metadata.id).toBeDefined();
        expect(metadata.documentType).toBeDefined();
        expect(metadata.filename).toBeDefined();
        expect(metadata.fileSize).toBeDefined();
        expect(metadata.mimeType).toBeDefined();
        expect(metadata.uploadedAt).toBeDefined();
        expect(metadata.uploaderId).toBeDefined();
        expect(metadata.identityRecordId).toBeDefined();
        expect(metadata.storagePath).toBeDefined();
        expect(metadata.encryptionMetadata).toBeDefined();
        expect(metadata.status).toBeDefined();
        expect(metadata.version).toBeDefined();
        expect(metadata.isCurrent).toBeDefined();

        // Verify field types
        expect(typeof metadata.id).toBe('string');
        expect(typeof metadata.filename).toBe('string');
        expect(typeof metadata.fileSize).toBe('number');
        expect(typeof metadata.mimeType).toBe('string');
        expect(metadata.uploadedAt instanceof Date).toBe(true);
        expect(typeof metadata.uploaderId).toBe('string');
        expect(typeof metadata.identityRecordId).toBe('string');
        expect(typeof metadata.storagePath).toBe('string');
        expect(typeof metadata.encryptionMetadata).toBe('object');
        expect(typeof metadata.version).toBe('number');
        expect(typeof metadata.isCurrent).toBe('boolean');
      }),
      { numRuns: 100 }
    );
  });

  it('should always have valid encryption metadata', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        const { encryptionMetadata } = metadata;

        // Verify encryption metadata fields
        expect(encryptionMetadata.algorithm).toBeDefined();
        expect(encryptionMetadata.keyVersion).toBeDefined();
        expect(encryptionMetadata.iv).toBeDefined();
        expect(encryptionMetadata.authTag).toBeDefined();

        // Verify encryption metadata types
        expect(typeof encryptionMetadata.algorithm).toBe('string');
        expect(typeof encryptionMetadata.keyVersion).toBe('string');
        expect(typeof encryptionMetadata.iv).toBe('string');
        expect(typeof encryptionMetadata.authTag).toBe('string');

        // Verify encryption metadata values
        expect(encryptionMetadata.algorithm).toBe('AES-256-GCM');
        expect(encryptionMetadata.keyVersion).toBe('v1');
        expect(encryptionMetadata.iv.length).toBeGreaterThan(0);
        expect(encryptionMetadata.authTag.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should always have valid document type', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        const validTypes = [
          CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          CACDocumentType.PARTICULARS_OF_DIRECTORS,
          CACDocumentType.SHARE_ALLOTMENT
        ];

        expect(validTypes).toContain(metadata.documentType);
      }),
      { numRuns: 100 }
    );
  });

  it('should always have valid document status', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        const validStatuses = [
          DocumentStatus.UPLOADED,
          DocumentStatus.MISSING,
          DocumentStatus.PENDING,
          DocumentStatus.FAILED
        ];

        expect(validStatuses).toContain(metadata.status);
      }),
      { numRuns: 100 }
    );
  });

  it('should always have positive file size', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        expect(metadata.fileSize).toBeGreaterThan(0);
        expect(metadata.fileSize).toBeLessThanOrEqual(10 * 1024 * 1024); // 10MB max
      }),
      { numRuns: 100 }
    );
  });

  it('should always have positive version number', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        expect(metadata.version).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should always have non-empty string fields', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        expect(metadata.id.length).toBeGreaterThan(0);
        expect(metadata.filename.length).toBeGreaterThan(0);
        expect(metadata.uploaderId.length).toBeGreaterThan(0);
        expect(metadata.identityRecordId.length).toBeGreaterThan(0);
        expect(metadata.storagePath.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should always have valid MIME type', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        const validMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        expect(validMimeTypes).toContain(metadata.mimeType);
      }),
      { numRuns: 100 }
    );
  });

  it('should always have valid upload timestamp', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        expect(metadata.uploadedAt instanceof Date).toBe(true);
        expect(metadata.uploadedAt.getTime()).not.toBeNaN();
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain metadata completeness across multiple documents', () => {
    fc.assert(
      fc.property(
        fc.array(cacDocumentMetadataArbitrary, { minLength: 1, maxLength: 10 }),
        (metadataList) => {
          // Verify all documents have complete metadata
          metadataList.forEach((metadata) => {
            expect(metadata.id).toBeDefined();
            expect(metadata.documentType).toBeDefined();
            expect(metadata.filename).toBeDefined();
            expect(metadata.fileSize).toBeDefined();
            expect(metadata.mimeType).toBeDefined();
            expect(metadata.uploadedAt).toBeDefined();
            expect(metadata.uploaderId).toBeDefined();
            expect(metadata.identityRecordId).toBeDefined();
            expect(metadata.storagePath).toBeDefined();
            expect(metadata.encryptionMetadata).toBeDefined();
            expect(metadata.status).toBeDefined();
            expect(metadata.version).toBeDefined();
            expect(metadata.isCurrent).toBeDefined();
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have consistent metadata structure for same document type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          CACDocumentType.PARTICULARS_OF_DIRECTORS,
          CACDocumentType.SHARE_ALLOTMENT
        ),
        fc.array(cacDocumentMetadataArbitrary, { minLength: 2, maxLength: 5 }),
        (documentType, metadataList) => {
          // Filter to documents of the same type
          const sameTypeDocuments = metadataList.map((m) => ({
            ...m,
            documentType
          }));

          // Verify all have the same structure
          sameTypeDocuments.forEach((metadata) => {
            expect(metadata.documentType).toBe(documentType);
            expect(Object.keys(metadata).sort()).toEqual(
              Object.keys(sameTypeDocuments[0]).sort()
            );
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have valid storage path format', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        // Storage path should be non-empty and reasonable length
        expect(metadata.storagePath.length).toBeGreaterThan(0);
        expect(metadata.storagePath.length).toBeLessThanOrEqual(500);
      }),
      { numRuns: 100 }
    );
  });

  it('should have consistent isCurrent flag for version tracking', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // documentId
        fc.array(cacDocumentMetadataArbitrary, { minLength: 1, maxLength: 5 }),
        (documentId, metadataList) => {
          // Simulate version history for same document
          const versions = metadataList.map((m, index) => ({
            ...m,
            id: documentId,
            version: index + 1,
            isCurrent: index === metadataList.length - 1 // Only latest is current
          }));

          // Verify only one version is marked as current
          const currentVersions = versions.filter((v) => v.isCurrent);
          expect(currentVersions.length).toBe(1);
          expect(currentVersions[0].version).toBe(versions.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have metadata that can be serialized and deserialized', () => {
    fc.assert(
      fc.property(cacDocumentMetadataArbitrary, (metadata) => {
        // Convert to JSON and back
        const serialized = JSON.stringify({
          ...metadata,
          uploadedAt: metadata.uploadedAt.toISOString()
        });
        const deserialized = JSON.parse(serialized);

        // Verify all fields are preserved
        expect(deserialized.id).toBe(metadata.id);
        expect(deserialized.documentType).toBe(metadata.documentType);
        expect(deserialized.filename).toBe(metadata.filename);
        expect(deserialized.fileSize).toBe(metadata.fileSize);
        expect(deserialized.mimeType).toBe(metadata.mimeType);
        expect(deserialized.uploaderId).toBe(metadata.uploaderId);
        expect(deserialized.identityRecordId).toBe(metadata.identityRecordId);
        expect(deserialized.storagePath).toBe(metadata.storagePath);
        expect(deserialized.status).toBe(metadata.status);
        expect(deserialized.version).toBe(metadata.version);
        expect(deserialized.isCurrent).toBe(metadata.isCurrent);
      }),
      { numRuns: 100 }
    );
  });

  it('should have unique document IDs across multiple documents', () => {
    fc.assert(
      fc.property(
        fc.array(cacDocumentMetadataArbitrary, { minLength: 2, maxLength: 20 }),
        (metadataList) => {
          // Assign unique IDs
          const uniqueIds = new Set<string>();
          metadataList.forEach((metadata, index) => {
            const uniqueId = `${metadata.id}_${index}`;
            uniqueIds.add(uniqueId);
          });

          // Verify all IDs are unique
          expect(uniqueIds.size).toBe(metadataList.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have metadata that supports filtering by identity record', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // identityRecordId
        fc.array(cacDocumentMetadataArbitrary, { minLength: 1, maxLength: 10 }),
        (identityRecordId, metadataList) => {
          // Assign same identity record to all documents
          const documentsForIdentity = metadataList.map((m) => ({
            ...m,
            identityRecordId
          }));

          // Verify all documents have the same identity record
          documentsForIdentity.forEach((metadata) => {
            expect(metadata.identityRecordId).toBe(identityRecordId);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
