/**
 * Integration Tests for CAC Metadata Queries
 * 
 * Tests querying documents by identity record, type, upload date,
 * and version history retrieval.
 * 
 * Requirements: 14.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDocumentsByIdentityRecord,
  getDocumentsByType,
  getDocumentsByDateRange,
  getVersionHistory,
  storeDocumentMetadata,
  storeVersionHistory
} from '../../services/cacMetadataService';
import {
  CACDocumentType,
  DocumentStatus,
  CACDocumentMetadata,
  DocumentVersionHistory
} from '../../types/cacDocuments';
import * as firestore from 'firebase/firestore';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date) => ({ toDate: () => date })),
    now: vi.fn(() => ({ toDate: () => new Date() }))
  },
  writeBatch: vi.fn()
}));

// Mock Firebase config
vi.mock('../../firebase/config', () => ({
  db: {}
}));

describe('CAC Metadata Queries Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Query Documents by Identity Record', () => {
    it('should retrieve all documents for an identity record', async () => {
      const identityRecordId = 'identity123';
      
      // Mock Firestore query response
      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            filename: 'certificate.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-01') },
            uploaderId: 'user1',
            identityRecordId,
            storagePath: 'path/to/doc1',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv1',
              authTag: 'tag1'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        },
        {
          data: () => ({
            id: 'doc2',
            documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
            filename: 'directors.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-02') },
            uploaderId: 'user1',
            identityRecordId,
            storagePath: 'path/to/doc2',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv2',
              authTag: 'tag2'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const documents = await getDocumentsByIdentityRecord(identityRecordId);

      expect(documents).toHaveLength(2);
      expect(documents[0].documentType).toBe(CACDocumentType.CERTIFICATE_OF_INCORPORATION);
      expect(documents[1].documentType).toBe(CACDocumentType.PARTICULARS_OF_DIRECTORS);
      expect(documents[0].identityRecordId).toBe(identityRecordId);
      expect(documents[1].identityRecordId).toBe(identityRecordId);
    });

    it('should return only current versions of documents', async () => {
      const identityRecordId = 'identity123';
      
      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            filename: 'certificate.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-01') },
            uploaderId: 'user1',
            identityRecordId,
            storagePath: 'path/to/doc1',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv1',
              authTag: 'tag1'
            },
            status: DocumentStatus.UPLOADED,
            version: 2,
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const documents = await getDocumentsByIdentityRecord(identityRecordId);

      expect(documents).toHaveLength(1);
      expect(documents[0].isCurrent).toBe(true);
      expect(documents[0].version).toBe(2);
    });

    it('should return empty array for identity with no documents', async () => {
      const identityRecordId = 'identity-no-docs';
      
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: []
      } as any);

      const documents = await getDocumentsByIdentityRecord(identityRecordId);

      expect(documents).toHaveLength(0);
    });

    it('should order documents by upload date descending', async () => {
      const identityRecordId = 'identity123';
      
      const mockDocs = [
        {
          data: () => ({
            id: 'doc2',
            documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
            filename: 'directors.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-03') },
            uploaderId: 'user1',
            identityRecordId,
            storagePath: 'path/to/doc2',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv2',
              authTag: 'tag2'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        },
        {
          data: () => ({
            id: 'doc1',
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            filename: 'certificate.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-01') },
            uploaderId: 'user1',
            identityRecordId,
            storagePath: 'path/to/doc1',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv1',
              authTag: 'tag1'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const documents = await getDocumentsByIdentityRecord(identityRecordId);

      expect(documents).toHaveLength(2);
      // Most recent first
      expect(documents[0].uploadedAt.getTime()).toBeGreaterThan(documents[1].uploadedAt.getTime());
    });
  });

  describe('Query Documents by Type', () => {
    it('should retrieve all documents of a specific type', async () => {
      const documentType = CACDocumentType.CERTIFICATE_OF_INCORPORATION;
      
      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            documentType,
            filename: 'certificate1.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-01') },
            uploaderId: 'user1',
            identityRecordId: 'identity1',
            storagePath: 'path/to/doc1',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv1',
              authTag: 'tag1'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        },
        {
          data: () => ({
            id: 'doc2',
            documentType,
            filename: 'certificate2.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-02') },
            uploaderId: 'user2',
            identityRecordId: 'identity2',
            storagePath: 'path/to/doc2',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv2',
              authTag: 'tag2'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const documents = await getDocumentsByType(documentType);

      expect(documents).toHaveLength(2);
      documents.forEach(doc => {
        expect(doc.documentType).toBe(documentType);
      });
    });

    it('should filter by identity record when provided', async () => {
      const documentType = CACDocumentType.PARTICULARS_OF_DIRECTORS;
      const identityRecordId = 'identity123';
      
      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            documentType,
            filename: 'directors.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-01') },
            uploaderId: 'user1',
            identityRecordId,
            storagePath: 'path/to/doc1',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv1',
              authTag: 'tag1'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const documents = await getDocumentsByType(documentType, identityRecordId);

      expect(documents).toHaveLength(1);
      expect(documents[0].documentType).toBe(documentType);
      expect(documents[0].identityRecordId).toBe(identityRecordId);
    });

    it('should return empty array for type with no documents', async () => {
      const documentType = CACDocumentType.SHARE_ALLOTMENT;
      
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: []
      } as any);

      const documents = await getDocumentsByType(documentType);

      expect(documents).toHaveLength(0);
    });

    it('should handle all three document types', async () => {
      for (const docType of Object.values(CACDocumentType)) {
        const mockDocs = [
          {
            data: () => ({
              id: `doc-${docType}`,
              documentType: docType,
              filename: `${docType}.pdf`,
              fileSize: 1024,
              mimeType: 'application/pdf',
              uploadedAt: { toDate: () => new Date('2024-01-01') },
              uploaderId: 'user1',
              identityRecordId: 'identity1',
              storagePath: `path/to/${docType}`,
              encryptionMetadata: {
                algorithm: 'AES-256-GCM',
                keyVersion: 'v1',
                iv: 'iv1',
                authTag: 'tag1'
              },
              status: DocumentStatus.UPLOADED,
              version: 1,
              isCurrent: true
            })
          }
        ];

        vi.mocked(firestore.query).mockReturnValue({} as any);
        vi.mocked(firestore.getDocs).mockResolvedValue({
          docs: mockDocs
        } as any);

        const documents = await getDocumentsByType(docType);

        expect(documents).toHaveLength(1);
        expect(documents[0].documentType).toBe(docType);
      }
    });
  });

  describe('Query Documents by Upload Date Range', () => {
    it('should retrieve documents within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            filename: 'certificate.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-15') },
            uploaderId: 'user1',
            identityRecordId: 'identity1',
            storagePath: 'path/to/doc1',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv1',
              authTag: 'tag1'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        },
        {
          data: () => ({
            id: 'doc2',
            documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
            filename: 'directors.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-20') },
            uploaderId: 'user1',
            identityRecordId: 'identity1',
            storagePath: 'path/to/doc2',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv2',
              authTag: 'tag2'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const documents = await getDocumentsByDateRange(startDate, endDate);

      expect(documents).toHaveLength(2);
      documents.forEach(doc => {
        expect(doc.uploadedAt.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(doc.uploadedAt.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should filter by identity record when provided', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const identityRecordId = 'identity123';
      
      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            filename: 'certificate.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-15') },
            uploaderId: 'user1',
            identityRecordId,
            storagePath: 'path/to/doc1',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv1',
              authTag: 'tag1'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const documents = await getDocumentsByDateRange(startDate, endDate, identityRecordId);

      expect(documents).toHaveLength(1);
      expect(documents[0].identityRecordId).toBe(identityRecordId);
      expect(documents[0].uploadedAt.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(documents[0].uploadedAt.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    it('should return empty array for date range with no documents', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: []
      } as any);

      const documents = await getDocumentsByDateRange(startDate, endDate);

      expect(documents).toHaveLength(0);
    });

    it('should handle single day date range', async () => {
      const singleDay = new Date('2024-01-15');
      
      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            filename: 'certificate.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-15T10:00:00') },
            uploaderId: 'user1',
            identityRecordId: 'identity1',
            storagePath: 'path/to/doc1',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv1',
              authTag: 'tag1'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const documents = await getDocumentsByDateRange(singleDay, singleDay);

      expect(documents).toHaveLength(1);
    });

    it('should order documents by upload date descending', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const mockDocs = [
        {
          data: () => ({
            id: 'doc2',
            documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
            filename: 'directors.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-20') },
            uploaderId: 'user1',
            identityRecordId: 'identity1',
            storagePath: 'path/to/doc2',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv2',
              authTag: 'tag2'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        },
        {
          data: () => ({
            id: 'doc1',
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            filename: 'certificate.pdf',
            fileSize: 1024,
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date('2024-01-10') },
            uploaderId: 'user1',
            identityRecordId: 'identity1',
            storagePath: 'path/to/doc1',
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: 'iv1',
              authTag: 'tag1'
            },
            status: DocumentStatus.UPLOADED,
            version: 1,
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const documents = await getDocumentsByDateRange(startDate, endDate);

      expect(documents).toHaveLength(2);
      // Most recent first
      expect(documents[0].uploadedAt.getTime()).toBeGreaterThan(documents[1].uploadedAt.getTime());
    });
  });

  describe('Version History Retrieval', () => {
    it('should retrieve complete version history for a document', async () => {
      const documentId = 'doc123';
      
      const mockVersions = [
        {
          data: () => ({
            documentId,
            version: 3,
            metadata: {
              id: documentId,
              documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              filename: 'certificate-v3.pdf',
              fileSize: 3072,
              mimeType: 'application/pdf',
              uploadedAt: { toDate: () => new Date('2024-01-15') },
              uploaderId: 'user1',
              identityRecordId: 'identity1',
              storagePath: 'path/to/doc-v3',
              encryptionMetadata: {
                algorithm: 'AES-256-GCM',
                keyVersion: 'v1',
                iv: 'iv3',
                authTag: 'tag3'
              },
              status: DocumentStatus.UPLOADED,
              version: 3,
              isCurrent: true
            },
            createdAt: { toDate: () => new Date('2024-01-15') },
            createdBy: 'user1',
            replacementReason: 'Updated information',
            previousVersion: 2
          })
        },
        {
          data: () => ({
            documentId,
            version: 2,
            metadata: {
              id: documentId,
              documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              filename: 'certificate-v2.pdf',
              fileSize: 2048,
              mimeType: 'application/pdf',
              uploadedAt: { toDate: () => new Date('2024-01-10') },
              uploaderId: 'user1',
              identityRecordId: 'identity1',
              storagePath: 'path/to/doc-v2',
              encryptionMetadata: {
                algorithm: 'AES-256-GCM',
                keyVersion: 'v1',
                iv: 'iv2',
                authTag: 'tag2'
              },
              status: DocumentStatus.UPLOADED,
              version: 2,
              isCurrent: false
            },
            createdAt: { toDate: () => new Date('2024-01-10') },
            createdBy: 'user1',
            replacementReason: 'Corrected error',
            previousVersion: 1
          })
        },
        {
          data: () => ({
            documentId,
            version: 1,
            metadata: {
              id: documentId,
              documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              filename: 'certificate-v1.pdf',
              fileSize: 1024,
              mimeType: 'application/pdf',
              uploadedAt: { toDate: () => new Date('2024-01-01') },
              uploaderId: 'user1',
              identityRecordId: 'identity1',
              storagePath: 'path/to/doc-v1',
              encryptionMetadata: {
                algorithm: 'AES-256-GCM',
                keyVersion: 'v1',
                iv: 'iv1',
                authTag: 'tag1'
              },
              status: DocumentStatus.UPLOADED,
              version: 1,
              isCurrent: false
            },
            createdAt: { toDate: () => new Date('2024-01-01') },
            createdBy: 'user1'
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockVersions
      } as any);

      const versions = await getVersionHistory(documentId);

      expect(versions).toHaveLength(3);
      expect(versions[0].version).toBe(3);
      expect(versions[1].version).toBe(2);
      expect(versions[2].version).toBe(1);
    });

    it('should order versions by version number descending', async () => {
      const documentId = 'doc123';
      
      const mockVersions = [
        {
          data: () => ({
            documentId,
            version: 2,
            metadata: {
              id: documentId,
              documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              filename: 'certificate-v2.pdf',
              fileSize: 2048,
              mimeType: 'application/pdf',
              uploadedAt: { toDate: () => new Date('2024-01-10') },
              uploaderId: 'user1',
              identityRecordId: 'identity1',
              storagePath: 'path/to/doc-v2',
              encryptionMetadata: {
                algorithm: 'AES-256-GCM',
                keyVersion: 'v1',
                iv: 'iv2',
                authTag: 'tag2'
              },
              status: DocumentStatus.UPLOADED,
              version: 2,
              isCurrent: true
            },
            createdAt: { toDate: () => new Date('2024-01-10') },
            createdBy: 'user1',
            previousVersion: 1
          })
        },
        {
          data: () => ({
            documentId,
            version: 1,
            metadata: {
              id: documentId,
              documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              filename: 'certificate-v1.pdf',
              fileSize: 1024,
              mimeType: 'application/pdf',
              uploadedAt: { toDate: () => new Date('2024-01-01') },
              uploaderId: 'user1',
              identityRecordId: 'identity1',
              storagePath: 'path/to/doc-v1',
              encryptionMetadata: {
                algorithm: 'AES-256-GCM',
                keyVersion: 'v1',
                iv: 'iv1',
                authTag: 'tag1'
              },
              status: DocumentStatus.UPLOADED,
              version: 1,
              isCurrent: false
            },
            createdAt: { toDate: () => new Date('2024-01-01') },
            createdBy: 'user1'
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockVersions
      } as any);

      const versions = await getVersionHistory(documentId);

      expect(versions).toHaveLength(2);
      // Most recent version first
      expect(versions[0].version).toBeGreaterThan(versions[1].version);
    });

    it('should include replacement reasons in version history', async () => {
      const documentId = 'doc123';
      
      const mockVersions = [
        {
          data: () => ({
            documentId,
            version: 2,
            metadata: {
              id: documentId,
              documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              filename: 'certificate-v2.pdf',
              fileSize: 2048,
              mimeType: 'application/pdf',
              uploadedAt: { toDate: () => new Date('2024-01-10') },
              uploaderId: 'user1',
              identityRecordId: 'identity1',
              storagePath: 'path/to/doc-v2',
              encryptionMetadata: {
                algorithm: 'AES-256-GCM',
                keyVersion: 'v1',
                iv: 'iv2',
                authTag: 'tag2'
              },
              status: DocumentStatus.UPLOADED,
              version: 2,
              isCurrent: true
            },
            createdAt: { toDate: () => new Date('2024-01-10') },
            createdBy: 'user1',
            replacementReason: 'Document expired, uploaded new version',
            previousVersion: 1
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockVersions
      } as any);

      const versions = await getVersionHistory(documentId);

      expect(versions).toHaveLength(1);
      expect(versions[0].replacementReason).toBe('Document expired, uploaded new version');
      expect(versions[0].previousVersion).toBe(1);
    });

    it('should return empty array for document with no version history', async () => {
      const documentId = 'doc-no-history';
      
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: []
      } as any);

      const versions = await getVersionHistory(documentId);

      expect(versions).toHaveLength(0);
    });

    it('should include creator information in version history', async () => {
      const documentId = 'doc123';
      
      const mockVersions = [
        {
          data: () => ({
            documentId,
            version: 1,
            metadata: {
              id: documentId,
              documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              filename: 'certificate.pdf',
              fileSize: 1024,
              mimeType: 'application/pdf',
              uploadedAt: { toDate: () => new Date('2024-01-01') },
              uploaderId: 'user123',
              identityRecordId: 'identity1',
              storagePath: 'path/to/doc',
              encryptionMetadata: {
                algorithm: 'AES-256-GCM',
                keyVersion: 'v1',
                iv: 'iv1',
                authTag: 'tag1'
              },
              status: DocumentStatus.UPLOADED,
              version: 1,
              isCurrent: true
            },
            createdAt: { toDate: () => new Date('2024-01-01') },
            createdBy: 'user123'
          })
        }
      ];

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockVersions
      } as any);

      const versions = await getVersionHistory(documentId);

      expect(versions).toHaveLength(1);
      expect(versions[0].createdBy).toBe('user123');
      expect(versions[0].metadata.uploaderId).toBe('user123');
    });

    it('should handle version history with multiple replacements', async () => {
      const documentId = 'doc123';
      
      const mockVersions = Array.from({ length: 5 }, (_, i) => ({
        data: () => ({
          documentId,
          version: 5 - i,
          metadata: {
            id: documentId,
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            filename: `certificate-v${5 - i}.pdf`,
            fileSize: 1024 * (5 - i),
            mimeType: 'application/pdf',
            uploadedAt: { toDate: () => new Date(`2024-01-${(5 - i) * 5}`) },
            uploaderId: 'user1',
            identityRecordId: 'identity1',
            storagePath: `path/to/doc-v${5 - i}`,
            encryptionMetadata: {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: `iv${5 - i}`,
              authTag: `tag${5 - i}`
            },
            status: DocumentStatus.UPLOADED,
            version: 5 - i,
            isCurrent: i === 0
          },
          createdAt: { toDate: () => new Date(`2024-01-${(5 - i) * 5}`) },
          createdBy: 'user1',
          replacementReason: i > 0 ? `Replacement ${5 - i}` : undefined,
          previousVersion: i < 4 ? 5 - i - 1 : undefined
        })
      }));

      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockVersions
      } as any);

      const versions = await getVersionHistory(documentId);

      expect(versions).toHaveLength(5);
      // Verify descending order
      for (let i = 0; i < versions.length - 1; i++) {
        expect(versions[i].version).toBeGreaterThan(versions[i + 1].version);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore query errors gracefully', async () => {
      const identityRecordId = 'identity123';
      
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockRejectedValue(new Error('Firestore error'));

      await expect(getDocumentsByIdentityRecord(identityRecordId)).rejects.toThrow(
        'Failed to query documents'
      );
    });

    it('should handle network errors during queries', async () => {
      const documentType = CACDocumentType.CERTIFICATE_OF_INCORPORATION;
      
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockRejectedValue(new Error('Network error'));

      await expect(getDocumentsByType(documentType)).rejects.toThrow(
        'Failed to query documents'
      );
    });

    it('should handle permission errors during queries', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockRejectedValue(new Error('Permission denied'));

      await expect(getDocumentsByDateRange(startDate, endDate)).rejects.toThrow(
        'Failed to query documents'
      );
    });

    it('should handle errors during version history retrieval', async () => {
      const documentId = 'doc123';
      
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockRejectedValue(new Error('Database error'));

      await expect(getVersionHistory(documentId)).rejects.toThrow(
        'Failed to retrieve version history'
      );
    });
  });
});
