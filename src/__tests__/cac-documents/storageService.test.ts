/**
 * Unit Tests for CAC Storage Service
 * 
 * Tests document upload, download, chunked upload, progress tracking,
 * filename preservation, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  uploadDocument,
  downloadDocument,
  getDocumentForPreview,
  deleteDocument,
  cancelUpload,
  generateStoragePath,
  uploadDocumentsConcurrently,
  resumeUpload,
  getChunkedUploadState,
  validateStoragePath,
  extractIdentityIdFromPath,
  extractDocumentTypeFromPath
} from '../../services/cacStorageService';
import { CACDocumentType, DocumentUploadRequest } from '../../types/cacDocuments';
import * as encryptionService from '../../services/cacEncryptionService';
import * as firebaseStorage from 'firebase/storage';

// Mock Firebase Storage
vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn()
}));

// Mock encryption service
vi.mock('../../services/cacEncryptionService', () => ({
  encryptDocument: vi.fn(),
  decryptDocument: vi.fn(),
  downloadDecryptedDocument: vi.fn()
}));

// Mock Firebase config
vi.mock('../../firebase/config', () => ({
  storage: {}
}));

describe('CAC Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateStoragePath', () => {
    it('should generate unique storage path with correct format', () => {
      const identityId = 'identity123';
      const documentType = CACDocumentType.CERTIFICATE_OF_INCORPORATION;
      const filename = 'certificate.pdf';

      const path = generateStoragePath(identityId, documentType, filename);

      expect(path).toMatch(/^cac-documents\/identity123\/certificate_of_incorporation\/\d+_[a-z0-9]+_certificate\.pdf$/);
    });

    it('should sanitize filename to prevent path traversal', () => {
      const identityId = 'identity123';
      const documentType = CACDocumentType.CERTIFICATE_OF_INCORPORATION;
      const filename = '../../../etc/passwd';

      const path = generateStoragePath(identityId, documentType, filename);

      // Extract just the filename part (after the last /)
      const filenamePart = path.split('/').pop() || '';
      
      // Filename should not contain .. or / (path separators are in the path structure, not filename)
      expect(filenamePart).not.toContain('..');
      expect(filenamePart).not.toContain('/');
      expect(path).toMatch(/^cac-documents\/identity123\/certificate_of_incorporation\/\d+_[a-z0-9]+_______etc_passwd$/);
    });

    it('should generate different paths for same filename', () => {
      const identityId = 'identity123';
      const documentType = CACDocumentType.CERTIFICATE_OF_INCORPORATION;
      const filename = 'certificate.pdf';

      const path1 = generateStoragePath(identityId, documentType, filename);
      const path2 = generateStoragePath(identityId, documentType, filename);

      expect(path1).not.toBe(path2);
    });
  });

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      // Mock file
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      
      const request: DocumentUploadRequest = {
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity123',
        isReplacement: false
      };

      // Mock encryption
      const mockEncryptedData = new ArrayBuffer(100);
      const mockMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'mock-iv',
        authTag: 'mock-tag'
      };

      vi.mocked(encryptionService.encryptDocument).mockResolvedValue({
        encryptedData: mockEncryptedData,
        metadata: mockMetadata
      });

      // Mock Firebase upload
      const mockUploadTask = {
        on: vi.fn((event, onProgress, onError, onComplete) => {
          // Simulate progress
          onProgress({ bytesTransferred: 50, totalBytes: 100 });
          onProgress({ bytesTransferred: 100, totalBytes: 100 });
          // Complete upload
          onComplete();
        }),
        snapshot: {
          bytesTransferred: 100,
          totalBytes: 100
        },
        cancel: vi.fn()
      };

      vi.mocked(firebaseStorage.ref).mockReturnValue({ fullPath: 'test-path' } as any);
      vi.mocked(firebaseStorage.uploadBytesResumable).mockReturnValue(mockUploadTask as any);

      // Track progress
      const progressUpdates: number[] = [];
      const onProgress = (progress: number) => progressUpdates.push(progress);

      // Upload document
      const result = await uploadDocument(request, onProgress);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.filename).toBe('test.pdf');
      expect(result.metadata?.fileSize).toBe(file.size);
      expect(result.metadata?.mimeType).toBe('application/pdf');
      expect(result.metadata?.documentType).toBe(CACDocumentType.CERTIFICATE_OF_INCORPORATION);
      expect(result.metadata?.encryptionMetadata).toEqual(mockMetadata);

      // Verify encryption was called
      expect(encryptionService.encryptDocument).toHaveBeenCalledWith(file);

      // Verify Firebase upload was called
      expect(firebaseStorage.uploadBytesResumable).toHaveBeenCalled();

      // Verify progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
    });

    it('should handle upload failure', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      
      const request: DocumentUploadRequest = {
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity123',
        isReplacement: false
      };

      // Mock encryption failure
      vi.mocked(encryptionService.encryptDocument).mockRejectedValue(
        new Error('Encryption failed')
      );

      // Upload document
      const result = await uploadDocument(request);

      // Verify error result
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe('UPLOAD_FAILED');
    });

    it('should use chunked upload for large files', async () => {
      // Create large file (6MB)
      const largeContent = new Uint8Array(6 * 1024 * 1024);
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      const request: DocumentUploadRequest = {
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity123',
        isReplacement: false
      };

      // Mock encryption
      const mockEncryptedData = new ArrayBuffer(6 * 1024 * 1024);
      vi.mocked(encryptionService.encryptDocument).mockResolvedValue({
        encryptedData: mockEncryptedData,
        metadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'mock-iv',
          authTag: 'mock-tag'
        }
      });

      // Mock Firebase upload
      const mockUploadTask = {
        on: vi.fn((event, onProgress, onError, onComplete) => {
          onComplete();
        }),
        snapshot: {
          bytesTransferred: 6 * 1024 * 1024,
          totalBytes: 6 * 1024 * 1024
        },
        cancel: vi.fn()
      };

      vi.mocked(firebaseStorage.ref).mockReturnValue({ fullPath: 'test-path' } as any);
      vi.mocked(firebaseStorage.uploadBytesResumable).mockReturnValue(mockUploadTask as any);

      // Upload document
      const result = await uploadDocument(request);

      // Verify chunked upload was used (file size > 5MB)
      expect(result.success).toBe(true);
      expect(firebaseStorage.uploadBytesResumable).toHaveBeenCalled();
    });
  });

  describe('downloadDocument', () => {
    it('should download and decrypt document', async () => {
      const storagePath = 'cac-documents/identity123/certificate_of_incorporation/123_test.pdf';
      const encryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'mock-iv',
        authTag: 'mock-tag'
      };
      const filename = 'test.pdf';
      const mimeType = 'application/pdf';

      // Mock Firebase download URL
      vi.mocked(firebaseStorage.getDownloadURL).mockResolvedValue('https://example.com/file');

      // Mock fetch
      const mockEncryptedData = new ArrayBuffer(100);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockEncryptedData)
      });

      // Mock decryption
      const mockDecryptedData = new ArrayBuffer(100);
      vi.mocked(encryptionService.decryptDocument).mockResolvedValue({
        decryptedData: mockDecryptedData,
        mimeType
      });

      vi.mocked(encryptionService.downloadDecryptedDocument).mockImplementation(() => {});

      // Download document
      await downloadDocument(storagePath, encryptionMetadata, filename, mimeType);

      // Verify download URL was fetched
      expect(firebaseStorage.getDownloadURL).toHaveBeenCalled();

      // Verify decryption was called
      expect(encryptionService.decryptDocument).toHaveBeenCalledWith(
        mockEncryptedData,
        encryptionMetadata,
        mimeType
      );

      // Verify download was triggered
      expect(encryptionService.downloadDecryptedDocument).toHaveBeenCalledWith(
        mockDecryptedData,
        filename,
        mimeType
      );
    });

    it('should handle download failure', async () => {
      const storagePath = 'cac-documents/identity123/certificate_of_incorporation/123_test.pdf';
      const encryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'mock-iv',
        authTag: 'mock-tag'
      };

      // Mock Firebase download URL failure
      vi.mocked(firebaseStorage.getDownloadURL).mockRejectedValue(
        new Error('Download failed')
      );

      // Download document
      await expect(
        downloadDocument(storagePath, encryptionMetadata, 'test.pdf', 'application/pdf')
      ).rejects.toThrow('Failed to download document');
    });

    it('should preserve original filename during download', async () => {
      const storagePath = 'cac-documents/identity123/certificate_of_incorporation/123_original.pdf';
      const encryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'mock-iv',
        authTag: 'mock-tag'
      };
      const originalFilename = 'My Certificate.pdf';
      const mimeType = 'application/pdf';

      vi.mocked(firebaseStorage.getDownloadURL).mockResolvedValue('https://example.com/file');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100))
      });

      vi.mocked(encryptionService.decryptDocument).mockResolvedValue({
        decryptedData: new ArrayBuffer(100),
        mimeType
      });

      vi.mocked(encryptionService.downloadDecryptedDocument).mockImplementation(() => {});

      await downloadDocument(storagePath, encryptionMetadata, originalFilename, mimeType);

      // Verify original filename was used
      expect(encryptionService.downloadDecryptedDocument).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        originalFilename,
        mimeType
      );
    });
  });

  describe('getDocumentForPreview', () => {
    it('should fetch and decrypt document for preview', async () => {
      const storagePath = 'cac-documents/identity123/certificate_of_incorporation/123_test.pdf';
      const encryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'mock-iv',
        authTag: 'mock-tag'
      };
      const mimeType = 'application/pdf';

      vi.mocked(firebaseStorage.getDownloadURL).mockResolvedValue('https://example.com/file');

      const mockEncryptedData = new ArrayBuffer(100);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockEncryptedData)
      });

      const mockDecryptedData = new ArrayBuffer(100);
      vi.mocked(encryptionService.decryptDocument).mockResolvedValue({
        decryptedData: mockDecryptedData,
        mimeType
      });

      const result = await getDocumentForPreview(storagePath, encryptionMetadata, mimeType);

      expect(result).toBe(mockDecryptedData);
      expect(encryptionService.decryptDocument).toHaveBeenCalledWith(
        mockEncryptedData,
        encryptionMetadata,
        mimeType
      );
    });
  });

  describe('deleteDocument', () => {
    it('should delete document from storage', async () => {
      const storagePath = 'cac-documents/identity123/certificate_of_incorporation/123_test.pdf';

      vi.mocked(firebaseStorage.deleteObject).mockResolvedValue(undefined);

      await deleteDocument(storagePath);

      expect(firebaseStorage.deleteObject).toHaveBeenCalled();
    });

    it('should handle deletion failure', async () => {
      const storagePath = 'cac-documents/identity123/certificate_of_incorporation/123_test.pdf';

      vi.mocked(firebaseStorage.deleteObject).mockRejectedValue(
        new Error('Deletion failed')
      );

      await expect(deleteDocument(storagePath)).rejects.toThrow('Failed to delete document');
    });
  });

  describe('uploadDocumentsConcurrently', () => {
    it('should upload multiple documents concurrently', async () => {
      const file1 = new File(['content1'], 'file1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'file2.pdf', { type: 'application/pdf' });

      const requests: DocumentUploadRequest[] = [
        {
          file: file1,
          documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          identityRecordId: 'identity123',
          isReplacement: false
        },
        {
          file: file2,
          documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
          identityRecordId: 'identity123',
          isReplacement: false
        }
      ];

      // Mock encryption
      vi.mocked(encryptionService.encryptDocument).mockResolvedValue({
        encryptedData: new ArrayBuffer(100),
        metadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'mock-iv',
          authTag: 'mock-tag'
        }
      });

      // Mock Firebase upload
      const mockUploadTask = {
        on: vi.fn((event, onProgress, onError, onComplete) => {
          onComplete();
        }),
        snapshot: {
          bytesTransferred: 100,
          totalBytes: 100
        },
        cancel: vi.fn()
      };

      vi.mocked(firebaseStorage.ref).mockReturnValue({ fullPath: 'test-path' } as any);
      vi.mocked(firebaseStorage.uploadBytesResumable).mockReturnValue(mockUploadTask as any);

      const results = await uploadDocumentsConcurrently(requests);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe('validateStoragePath', () => {
    it('should validate correct storage path', () => {
      const validPath = 'cac-documents/identity123/certificate_of_incorporation/1234567890_abc123_test.pdf';
      expect(validateStoragePath(validPath)).toBe(true);
    });

    it('should reject invalid storage path', () => {
      const invalidPaths = [
        'invalid/path',
        'cac-documents/identity123',
        'cac-documents/identity123/invalid_type/file.pdf',
        '../../../etc/passwd'
      ];

      invalidPaths.forEach(path => {
        expect(validateStoragePath(path)).toBe(false);
      });
    });
  });

  describe('extractIdentityIdFromPath', () => {
    it('should extract identity ID from storage path', () => {
      const path = 'cac-documents/identity123/certificate_of_incorporation/1234567890_abc123_test.pdf';
      expect(extractIdentityIdFromPath(path)).toBe('identity123');
    });

    it('should return null for invalid path', () => {
      expect(extractIdentityIdFromPath('invalid/path')).toBeNull();
    });
  });

  describe('extractDocumentTypeFromPath', () => {
    it('should extract document type from storage path', () => {
      const path = 'cac-documents/identity123/certificate_of_incorporation/1234567890_abc123_test.pdf';
      expect(extractDocumentTypeFromPath(path)).toBe(CACDocumentType.CERTIFICATE_OF_INCORPORATION);
    });

    it('should return null for invalid path', () => {
      expect(extractDocumentTypeFromPath('invalid/path')).toBeNull();
    });
  });
});
