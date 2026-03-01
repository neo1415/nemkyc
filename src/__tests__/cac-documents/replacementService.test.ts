/**
 * Unit Tests for CAC Document Replacement Service
 * 
 * Tests document replacement functionality including:
 * - Document replacement
 * - Version archiving
 * - Metadata updates
 * - Version history maintenance
 * - Replacement logging
 * 
 * Requirements: 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  replaceDocument,
  canReplaceDocument,
  getReplacementHistory,
  getCurrentVersion,
  hasBeenReplaced,
  batchReplaceDocuments,
  ReplaceDocumentParams
} from '../../services/cacReplacementService';
import {
  CACDocumentType,
  DocumentStatus,
  CACDocumentMetadata
} from '../../types/cacDocuments';

// Mock the dependencies
vi.mock('../../services/cacMetadataService');
vi.mock('../../services/cacStorageService');
vi.mock('../../services/cacAuditLogger');

// Import mocked modules
import * as metadataService from '../../services/cacMetadataService';
import * as storageService from '../../services/cacStorageService';
import * as auditLogger from '../../services/cacAuditLogger';

describe('CAC Document Replacement Service', () => {
  // Sample test data
  const mockOldMetadata: CACDocumentMetadata = {
    id: 'doc-123',
    documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
    filename: 'old-certificate.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    uploadedAt: new Date('2024-01-01'),
    uploaderId: 'user-456',
    identityRecordId: 'identity-789',
    storagePath: 'cac-documents/identity-789/certificate_of_incorporation/old.pdf',
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

  const mockNewMetadata: CACDocumentMetadata = {
    ...mockOldMetadata,
    id: 'doc-456',
    filename: 'new-certificate.pdf',
    fileSize: 2048000,
    uploadedAt: new Date('2024-02-01'),
    storagePath: 'cac-documents/identity-789/certificate_of_incorporation/new.pdf',
    version: 2,
    isCurrent: true
  };

  const mockFile = new File(['test content'], 'new-certificate.pdf', {
    type: 'application/pdf'
  });

  const mockReplaceParams: ReplaceDocumentParams = {
    existingDocumentId: 'doc-123',
    newFile: mockFile,
    userId: 'user-456',
    userEmail: 'user@example.com',
    userName: 'Test User',
    userRole: 'broker',
    replacementReason: 'Updated document'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('replaceDocument', () => {
    it('should successfully replace a document', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(mockOldMetadata);
      vi.spyOn(storageService, 'uploadDocument').mockResolvedValue({
        success: true,
        metadata: mockNewMetadata
      });
      vi.spyOn(metadataService, 'handleDocumentReplacement').mockResolvedValue();
      vi.spyOn(auditLogger, 'logDocumentUpload').mockResolvedValue();

      // Act
      const result = await replaceDocument(mockReplaceParams);

      // Assert
      expect(result.success).toBe(true);
      expect(result.newMetadata).toBeDefined();
      expect(result.oldMetadata).toEqual(mockOldMetadata);
      expect(metadataService.getDocumentMetadata).toHaveBeenCalledWith('doc-123');
      expect(storageService.uploadDocument).toHaveBeenCalled();
      expect(metadataService.handleDocumentReplacement).toHaveBeenCalledWith(
        mockOldMetadata,
        expect.any(Object),
        'Updated document'
      );
      expect(auditLogger.logDocumentUpload).toHaveBeenCalled();
    });

    it('should fail when document not found', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(null);

      // Act
      const result = await replaceDocument(mockReplaceParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Document not found');
      expect(result.errorCode).toBe('DOCUMENT_NOT_FOUND');
    });

    it('should fail when document is not current version', async () => {
      // Arrange
      const nonCurrentMetadata = { ...mockOldMetadata, isCurrent: false };
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(nonCurrentMetadata);

      // Act
      const result = await replaceDocument(mockReplaceParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot replace a non-current document version');
      expect(result.errorCode).toBe('NOT_CURRENT_VERSION');
    });

    it('should fail when upload fails', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(mockOldMetadata);
      vi.spyOn(storageService, 'uploadDocument').mockResolvedValue({
        success: false,
        error: 'Upload failed',
        errorCode: 'UPLOAD_FAILED'
      });

      // Act
      const result = await replaceDocument(mockReplaceParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Upload failed');
      expect(result.errorCode).toBe('UPLOAD_FAILED');
    });

    it('should call progress callback during upload', async () => {
      // Arrange
      const progressCallback = vi.fn();
      const paramsWithProgress = { ...mockReplaceParams, onProgress: progressCallback };
      
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(mockOldMetadata);
      vi.spyOn(storageService, 'uploadDocument').mockImplementation(async (req, onProgress) => {
        onProgress?.(50);
        onProgress?.(100);
        return { success: true, metadata: mockNewMetadata };
      });
      vi.spyOn(metadataService, 'handleDocumentReplacement').mockResolvedValue();
      vi.spyOn(auditLogger, 'logDocumentUpload').mockResolvedValue();

      // Act
      await replaceDocument(paramsWithProgress);

      // Assert
      expect(progressCallback).toHaveBeenCalledWith(50);
      expect(progressCallback).toHaveBeenCalledWith(100);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockRejectedValue(
        new Error('Database error')
      );

      // Act
      const result = await replaceDocument(mockReplaceParams);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
      expect(result.errorCode).toBe('REPLACEMENT_FAILED');
    });
  });

  describe('canReplaceDocument', () => {
    it('should return true for valid current document', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(mockOldMetadata);

      // Act
      const result = await canReplaceDocument('doc-123');

      // Assert
      expect(result.canReplace).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return false when document not found', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(null);

      // Act
      const result = await canReplaceDocument('doc-123');

      // Assert
      expect(result.canReplace).toBe(false);
      expect(result.reason).toBe('Document not found');
    });

    it('should return false when document is not current', async () => {
      // Arrange
      const nonCurrentMetadata = { ...mockOldMetadata, isCurrent: false };
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(nonCurrentMetadata);

      // Act
      const result = await canReplaceDocument('doc-123');

      // Assert
      expect(result.canReplace).toBe(false);
      expect(result.reason).toContain('Cannot replace a non-current document version');
    });

    it('should return false when document status is not uploaded', async () => {
      // Arrange
      const pendingMetadata = { ...mockOldMetadata, status: DocumentStatus.PENDING };
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(pendingMetadata);

      // Act
      const result = await canReplaceDocument('doc-123');

      // Assert
      expect(result.canReplace).toBe(false);
      expect(result.reason).toContain('Cannot replace document with status: pending');
    });
  });

  describe('getReplacementHistory', () => {
    it('should return replacement history', async () => {
      // Arrange
      const mockVersionHistory = [
        {
          version: 1,
          metadata: mockOldMetadata,
          createdAt: new Date('2024-01-01'),
          createdBy: 'user-456'
        },
        {
          version: 2,
          metadata: mockNewMetadata,
          createdAt: new Date('2024-02-01'),
          createdBy: 'user-789',
          replacementReason: 'Updated document',
          previousVersion: 1
        }
      ];

      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(mockNewMetadata);
      vi.spyOn(metadataService, 'getVersionHistory').mockResolvedValue(mockVersionHistory);

      // Act
      const result = await getReplacementHistory('doc-123');

      // Assert
      expect(result).toHaveLength(1); // Only version 2 (replacement)
      expect(result[0].version).toBe(2);
      expect(result[0].replacedBy).toBe('user-789');
      expect(result[0].reason).toBe('Updated document');
    });

    it('should return empty array when document not found', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(null);

      // Act
      const result = await getReplacementHistory('doc-123');

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when no replacements', async () => {
      // Arrange
      const mockVersionHistory = [
        {
          version: 1,
          metadata: mockOldMetadata,
          createdAt: new Date('2024-01-01'),
          createdBy: 'user-456'
        }
      ];

      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(mockOldMetadata);
      vi.spyOn(metadataService, 'getVersionHistory').mockResolvedValue(mockVersionHistory);

      // Act
      const result = await getReplacementHistory('doc-123');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return current version number', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(mockNewMetadata);

      // Act
      const result = await getCurrentVersion('doc-123');

      // Assert
      expect(result).toBe(2);
    });

    it('should return 0 when document not found', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(null);

      // Act
      const result = await getCurrentVersion('doc-123');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('hasBeenReplaced', () => {
    it('should return true for replaced document', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(mockNewMetadata);

      // Act
      const result = await hasBeenReplaced('doc-123');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for original document', async () => {
      // Arrange
      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(mockOldMetadata);

      // Act
      const result = await hasBeenReplaced('doc-123');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('batchReplaceDocuments', () => {
    it('should replace multiple documents', async () => {
      // Arrange
      const params1 = { ...mockReplaceParams, existingDocumentId: 'doc-1' };
      const params2 = { ...mockReplaceParams, existingDocumentId: 'doc-2' };

      vi.spyOn(metadataService, 'getDocumentMetadata').mockResolvedValue(mockOldMetadata);
      vi.spyOn(storageService, 'uploadDocument').mockResolvedValue({
        success: true,
        metadata: mockNewMetadata
      });
      vi.spyOn(metadataService, 'handleDocumentReplacement').mockResolvedValue();
      vi.spyOn(auditLogger, 'logDocumentUpload').mockResolvedValue();

      // Act
      const results = await batchReplaceDocuments([params1, params2]);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle partial failures in batch', async () => {
      // Arrange
      const params1 = { ...mockReplaceParams, existingDocumentId: 'doc-1' };
      const params2 = { ...mockReplaceParams, existingDocumentId: 'doc-2' };

      vi.spyOn(metadataService, 'getDocumentMetadata')
        .mockResolvedValueOnce(mockOldMetadata)
        .mockResolvedValueOnce(null);
      
      vi.spyOn(storageService, 'uploadDocument').mockResolvedValue({
        success: false,
        error: 'Upload failed',
        errorCode: 'UPLOAD_FAILED'
      });

      // Act
      const results = await batchReplaceDocuments([params1, params2]);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false); // First fails due to upload failure
      expect(results[1].success).toBe(false); // Second fails due to not found
    });
  });
});
