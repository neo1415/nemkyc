/**
 * Unit Tests for CAC Metadata Service
 * 
 * Tests metadata creation, retrieval, updates, version history tracking,
 * and identity record linking.
 * 
 * Requirements: 3.6, 3.7, 11.3, 14.1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  storeDocumentMetadata,
  getDocumentMetadata,
  updateDocumentMetadata,
  deleteDocumentMetadata,
  getDocumentsByIdentityRecord,
  getDocumentsByType,
  getDocumentsByDateRange,
  storeVersionHistory,
  getVersionHistory,
  getDocumentVersion,
  getDocumentRecord,
  handleDocumentReplacement,
  getDocumentStatusSummary,
  linkDocumentToIdentityRecord,
  batchStoreDocumentMetadata,
  getLatestVersionNumber
} from '../../services/cacMetadataService';
import {
  CACDocumentMetadata,
  CACDocumentType,
  DocumentStatus,
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
    fromDate: vi.fn((date) => ({ toDate: () => date, seconds: date.getTime() / 1000 })),
    now: vi.fn(() => ({ toDate: () => new Date(), seconds: Date.now() / 1000 }))
  },
  writeBatch: vi.fn()
}));

// Mock Firebase config
vi.mock('../../firebase/config', () => ({
  db: {}
}));

describe('CAC Metadata Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('storeDocumentMetadata', () => {
    it('should store document metadata successfully', async () => {
      const metadata: CACDocumentMetadata = {
        id: 'doc123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        filename: 'certificate.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedAt: new Date(),
        uploaderId: 'user123',
        identityRecordId: 'identity123',
        storagePath: 'cac-documents/identity123/certificate_of_incorporation/123_cert.pdf',
        encryptionMetadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'mock-iv',
          authTag: 'mock-tag'
        },
        status: DocumentStatus.UPLOADED,
        version: 1,
        isCurrent: true
      };

      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      await storeDocumentMetadata(metadata);

      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should handle storage failure', async () => {
      const metadata: CACDocumentMetadata = {
        id: 'doc123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        filename: 'certificate.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedAt: new Date(),
        uploaderId: 'user123',
        identityRecordId: 'identity123',
        storagePath: 'path',
        encryptionMetadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'iv',
          authTag: 'tag'
        },
        status: DocumentStatus.UPLOADED,
        version: 1,
        isCurrent: true
      };

      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.setDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(storeDocumentMetadata(metadata)).rejects.toThrow(
        'Failed to store document metadata'
      );
    });
  });

  describe('getDocumentMetadata', () => {
    it('should retrieve document metadata successfully', async () => {
      const mockData = {
        id: 'doc123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        filename: 'certificate.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedAt: { toDate: () => new Date('2024-01-01') },
        uploaderId: 'user123',
        identityRecordId: 'identity123',
        storagePath: 'path',
        encryptionMetadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'iv',
          authTag: 'tag'
        },
        status: 'uploaded',
        version: 1,
        isCurrent: true
      };

      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockData
      } as any);

      const result = await getDocumentMetadata('doc123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('doc123');
      expect(result?.filename).toBe('certificate.pdf');
    });

    it('should return null for non-existent document', async () => {
      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => false
      } as any);

      const result = await getDocumentMetadata('doc123');

      expect(result).toBeNull();
    });

    it('should handle retrieval failure', async () => {
      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.getDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(getDocumentMetadata('doc123')).rejects.toThrow(
        'Failed to retrieve document metadata'
      );
    });
  });

  describe('updateDocumentMetadata', () => {
    it('should update document metadata successfully', async () => {
      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      await updateDocumentMetadata('doc123', {
        status: DocumentStatus.UPLOADED
      });

      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should handle update failure', async () => {
      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.setDoc).mockRejectedValue(new Error('Firestore error'));

      await expect(
        updateDocumentMetadata('doc123', { status: DocumentStatus.UPLOADED })
      ).rejects.toThrow('Failed to update document metadata');
    });
  });

  describe('deleteDocumentMetadata', () => {
    it('should delete document metadata and version history', async () => {
      const mockBatch = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(firestore.writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        forEach: (callback: any) => {}
      } as any);

      await deleteDocumentMetadata('doc123');

      expect(mockBatch.delete).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('getDocumentsByIdentityRecord', () => {
    it('should retrieve documents for an identity record', async () => {
      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            uploadedAt: { toDate: () => new Date() },
            status: 'uploaded',
            isCurrent: true
          })
        },
        {
          data: () => ({
            id: 'doc2',
            documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
            uploadedAt: { toDate: () => new Date() },
            status: 'uploaded',
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const result = await getDocumentsByIdentityRecord('identity123');

      expect(result).toHaveLength(2);
      expect(result[0].documentType).toBe(CACDocumentType.CERTIFICATE_OF_INCORPORATION);
    });
  });

  describe('getDocumentsByType', () => {
    it('should retrieve documents by type', async () => {
      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            uploadedAt: { toDate: () => new Date() },
            status: 'uploaded',
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const result = await getDocumentsByType(
        CACDocumentType.CERTIFICATE_OF_INCORPORATION
      );

      expect(result).toHaveLength(1);
      expect(result[0].documentType).toBe(CACDocumentType.CERTIFICATE_OF_INCORPORATION);
    });

    it('should filter by identity record when provided', async () => {
      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
            identityRecordId: 'identity123',
            uploadedAt: { toDate: () => new Date() },
            status: 'uploaded',
            isCurrent: true
          })
        }
      ];

      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const result = await getDocumentsByType(
        CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        'identity123'
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('getDocumentsByDateRange', () => {
    it('should retrieve documents within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const mockDocs = [
        {
          data: () => ({
            id: 'doc1',
            uploadedAt: { toDate: () => new Date('2024-06-01') },
            status: 'uploaded'
          })
        }
      ];

      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const result = await getDocumentsByDateRange(startDate, endDate);

      expect(result).toHaveLength(1);
    });
  });

  describe('storeVersionHistory', () => {
    it('should store version history successfully', async () => {
      const versionHistory: DocumentVersionHistory = {
        version: 1,
        metadata: {
          id: 'doc123',
          documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          filename: 'cert.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedAt: new Date(),
          uploaderId: 'user123',
          identityRecordId: 'identity123',
          storagePath: 'path',
          encryptionMetadata: {
            algorithm: 'AES-256-GCM',
            keyVersion: 'v1',
            iv: 'iv',
            authTag: 'tag'
          },
          status: DocumentStatus.UPLOADED,
          version: 1,
          isCurrent: true
        },
        createdAt: new Date(),
        createdBy: 'user123'
      };

      vi.mocked(firestore.doc).mockReturnValue({ id: 'version123' } as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      await storeVersionHistory('doc123', versionHistory);

      expect(firestore.setDoc).toHaveBeenCalled();
    });
  });

  describe('getVersionHistory', () => {
    it('should retrieve version history for a document', async () => {
      const mockDocs = [
        {
          data: () => ({
            version: 2,
            metadata: {
              uploadedAt: { toDate: () => new Date() },
              status: 'uploaded'
            },
            createdAt: { toDate: () => new Date() },
            createdBy: 'user123'
          })
        },
        {
          data: () => ({
            version: 1,
            metadata: {
              uploadedAt: { toDate: () => new Date() },
              status: 'uploaded'
            },
            createdAt: { toDate: () => new Date() },
            createdBy: 'user123'
          })
        }
      ];

      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const result = await getVersionHistory('doc123');

      expect(result).toHaveLength(2);
      expect(result[0].version).toBe(2);
      expect(result[1].version).toBe(1);
    });
  });

  describe('getDocumentVersion', () => {
    it('should retrieve a specific document version', async () => {
      const mockData = {
        version: 1,
        metadata: {
          uploadedAt: { toDate: () => new Date() },
          status: 'uploaded'
        },
        createdAt: { toDate: () => new Date() },
        createdBy: 'user123'
      };

      vi.mocked(firestore.doc).mockReturnValue({ id: 'version123' } as any);
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockData
      } as any);

      const result = await getDocumentVersion('doc123', 1);

      expect(result).toBeDefined();
      expect(result?.version).toBe(1);
    });

    it('should return null for non-existent version', async () => {
      vi.mocked(firestore.doc).mockReturnValue({ id: 'version123' } as any);
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => false
      } as any);

      const result = await getDocumentVersion('doc123', 1);

      expect(result).toBeNull();
    });
  });

  describe('getDocumentRecord', () => {
    it('should retrieve complete document record with version history', async () => {
      // Mock metadata
      const mockMetadata = {
        id: 'doc123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        uploadedAt: { toDate: () => new Date() },
        status: 'uploaded',
        version: 2,
        isCurrent: true
      };

      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockMetadata
      } as any);

      // Mock version history
      const mockVersionDocs = [
        {
          data: () => ({
            version: 2,
            metadata: {
              uploadedAt: { toDate: () => new Date() },
              status: 'uploaded'
            },
            createdAt: { toDate: () => new Date() },
            createdBy: 'user123'
          })
        },
        {
          data: () => ({
            version: 1,
            metadata: {
              uploadedAt: { toDate: () => new Date() },
              status: 'uploaded'
            },
            createdAt: { toDate: () => new Date() },
            createdBy: 'user123'
          })
        }
      ];

      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockVersionDocs
      } as any);

      const result = await getDocumentRecord('doc123');

      expect(result).toBeDefined();
      expect(result?.current.id).toBe('doc123');
      expect(result?.versions).toHaveLength(2);
      expect(result?.versionCount).toBe(2);
    });

    it('should return null for non-existent document', async () => {
      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.getDoc).mockResolvedValue({
        exists: () => false
      } as any);

      const result = await getDocumentRecord('doc123');

      expect(result).toBeNull();
    });
  });

  describe('linkDocumentToIdentityRecord', () => {
    it('should link document to identity record', async () => {
      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc123' } as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      await linkDocumentToIdentityRecord('doc123', 'identity123');

      expect(firestore.setDoc).toHaveBeenCalled();
    });
  });

  describe('batchStoreDocumentMetadata', () => {
    it('should batch store multiple metadata entries', async () => {
      const metadataList: CACDocumentMetadata[] = [
        {
          id: 'doc1',
          documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          filename: 'cert1.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedAt: new Date(),
          uploaderId: 'user123',
          identityRecordId: 'identity123',
          storagePath: 'path1',
          encryptionMetadata: {
            algorithm: 'AES-256-GCM',
            keyVersion: 'v1',
            iv: 'iv',
            authTag: 'tag'
          },
          status: DocumentStatus.UPLOADED,
          version: 1,
          isCurrent: true
        },
        {
          id: 'doc2',
          documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
          filename: 'cert2.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          uploadedAt: new Date(),
          uploaderId: 'user123',
          identityRecordId: 'identity123',
          storagePath: 'path2',
          encryptionMetadata: {
            algorithm: 'AES-256-GCM',
            keyVersion: 'v1',
            iv: 'iv',
            authTag: 'tag'
          },
          status: DocumentStatus.UPLOADED,
          version: 1,
          isCurrent: true
        }
      ];

      const mockBatch = {
        set: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined)
      };

      vi.mocked(firestore.writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(firestore.doc).mockReturnValue({ id: 'doc' } as any);

      await batchStoreDocumentMetadata(metadataList);

      expect(mockBatch.set).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('getLatestVersionNumber', () => {
    it('should return latest version number', async () => {
      const mockDocs = [
        {
          data: () => ({
            version: 3,
            metadata: {
              uploadedAt: { toDate: () => new Date() },
              status: 'uploaded'
            },
            createdAt: { toDate: () => new Date() },
            createdBy: 'user123'
          })
        },
        {
          data: () => ({
            version: 2,
            metadata: {
              uploadedAt: { toDate: () => new Date() },
              status: 'uploaded'
            },
            createdAt: { toDate: () => new Date() },
            createdBy: 'user123'
          })
        }
      ];

      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: mockDocs
      } as any);

      const result = await getLatestVersionNumber('doc123');

      expect(result).toBe(3);
    });

    it('should return 0 for document with no versions', async () => {
      vi.mocked(firestore.collection).mockReturnValue({} as any);
      vi.mocked(firestore.query).mockReturnValue({} as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: []
      } as any);

      const result = await getLatestVersionNumber('doc123');

      expect(result).toBe(0);
    });
  });
});
