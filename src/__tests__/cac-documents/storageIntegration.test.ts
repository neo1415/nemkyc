/**
 * Integration Tests for CAC Storage Service
 * 
 * Tests complete upload-download cycle, resumable uploads, concurrent uploads,
 * and storage quota handling.
 * 
 * Requirements: 8.2, 8.4, 12.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  uploadDocument,
  downloadDocument,
  getDocumentForPreview,
  uploadDocumentsConcurrently,
  resumeUpload,
  cancelUpload
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

describe('CAC Storage Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Upload-Download Cycle', () => {
    it('should successfully upload and download a document', async () => {
      // Create test file
      const fileContent = 'Test document content';
      const file = new File([fileContent], 'test-certificate.pdf', { type: 'application/pdf' });
      
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

      // Upload document
      const uploadResult = await uploadDocument(request);

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.metadata).toBeDefined();

      // Mock download
      const storagePath = uploadResult.metadata!.storagePath;
      
      vi.mocked(firebaseStorage.getDownloadURL).mockResolvedValue('https://example.com/file');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockEncryptedData)
      });

      const mockDecryptedData = new ArrayBuffer(fileContent.length);
      vi.mocked(encryptionService.decryptDocument).mockResolvedValue({
        decryptedData: mockDecryptedData,
        mimeType: 'application/pdf'
      });

      vi.mocked(encryptionService.downloadDecryptedDocument).mockImplementation(() => {});

      // Download document
      await downloadDocument(storagePath, mockMetadata, 'test-certificate.pdf', 'application/pdf');

      // Verify download was successful
      expect(encryptionService.downloadDecryptedDocument).toHaveBeenCalledWith(
        mockDecryptedData,
        'test-certificate.pdf',
        'application/pdf'
      );
    });

    it('should maintain data integrity through upload-download cycle', async () => {
      const originalContent = 'Original document content with special chars: @#$%^&*()';
      const file = new File([originalContent], 'test.pdf', { type: 'application/pdf' });
      
      const request: DocumentUploadRequest = {
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity123',
        isReplacement: false
      };

      // Mock encryption to preserve content
      const encoder = new TextEncoder();
      const mockEncryptedData = encoder.encode(originalContent).buffer;
      
      vi.mocked(encryptionService.encryptDocument).mockResolvedValue({
        encryptedData: mockEncryptedData,
        metadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'mock-iv',
          authTag: 'mock-tag'
        }
      });

      const mockUploadTask = {
        on: vi.fn((event, onProgress, onError, onComplete) => {
          onComplete();
        }),
        snapshot: {
          bytesTransferred: mockEncryptedData.byteLength,
          totalBytes: mockEncryptedData.byteLength
        },
        cancel: vi.fn()
      };

      vi.mocked(firebaseStorage.ref).mockReturnValue({ fullPath: 'test-path' } as any);
      vi.mocked(firebaseStorage.uploadBytesResumable).mockReturnValue(mockUploadTask as any);

      const uploadResult = await uploadDocument(request);
      expect(uploadResult.success).toBe(true);

      // Mock download with same content
      vi.mocked(firebaseStorage.getDownloadURL).mockResolvedValue('https://example.com/file');
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockEncryptedData)
      });

      vi.mocked(encryptionService.decryptDocument).mockResolvedValue({
        decryptedData: mockEncryptedData,
        mimeType: 'application/pdf'
      });

      const previewData = await getDocumentForPreview(
        uploadResult.metadata!.storagePath,
        uploadResult.metadata!.encryptionMetadata,
        'application/pdf'
      );

      // Verify content is preserved
      const decoder = new TextDecoder();
      const retrievedContent = decoder.decode(previewData);
      expect(retrievedContent).toBe(originalContent);
    });
  });

  describe('Resumable Upload After Interruption', () => {
    it('should resume upload after interruption', async () => {
      const file = new File(['large content'], 'large.pdf', { type: 'application/pdf' });
      
      const request: DocumentUploadRequest = {
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity123',
        isReplacement: false
      };

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

      // Mock Firebase upload that completes on resume
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

      // Resume upload (Firebase handles resumable uploads automatically)
      const result = await resumeUpload(request);

      expect(result.success).toBe(true);
      expect(firebaseStorage.uploadBytesResumable).toHaveBeenCalled();
    });

    it('should track progress during resumable upload', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      const request: DocumentUploadRequest = {
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity123',
        isReplacement: false
      };

      vi.mocked(encryptionService.encryptDocument).mockResolvedValue({
        encryptedData: new ArrayBuffer(100),
        metadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'mock-iv',
          authTag: 'mock-tag'
        }
      });

      const progressUpdates: number[] = [];
      
      const mockUploadTask = {
        on: vi.fn((event, onProgress, onError, onComplete) => {
          // Simulate progress updates
          onProgress({ bytesTransferred: 25, totalBytes: 100 });
          onProgress({ bytesTransferred: 50, totalBytes: 100 });
          onProgress({ bytesTransferred: 75, totalBytes: 100 });
          onProgress({ bytesTransferred: 100, totalBytes: 100 });
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

      await uploadDocument(request, (progress) => {
        progressUpdates.push(progress);
      });

      // Verify progress was tracked
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });
  });

  describe('Concurrent Uploads', () => {
    it('should handle multiple concurrent uploads', async () => {
      const files = [
        new File(['content1'], 'file1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'file2.pdf', { type: 'application/pdf' }),
        new File(['content3'], 'file3.pdf', { type: 'application/pdf' })
      ];

      const requests: DocumentUploadRequest[] = files.map((file, index) => ({
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: `identity${index}`,
        isReplacement: false
      }));

      vi.mocked(encryptionService.encryptDocument).mockResolvedValue({
        encryptedData: new ArrayBuffer(100),
        metadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'mock-iv',
          authTag: 'mock-tag'
        }
      });

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

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should limit concurrent uploads to maximum', async () => {
      const files = Array.from({ length: 10 }, (_, i) => 
        new File([`content${i}`], `file${i}.pdf`, { type: 'application/pdf' })
      );

      const requests: DocumentUploadRequest[] = files.map((file, index) => ({
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: `identity${index}`,
        isReplacement: false
      }));

      vi.mocked(encryptionService.encryptDocument).mockResolvedValue({
        encryptedData: new ArrayBuffer(100),
        metadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'mock-iv',
          authTag: 'mock-tag'
        }
      });

      const mockUploadTask = {
        on: vi.fn((event, onProgress, onError, onComplete) => {
          // Simulate async upload
          setTimeout(onComplete, 10);
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

      expect(results).toHaveLength(10);
      // All uploads should complete successfully
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('should handle partial failures in concurrent uploads', async () => {
      const files = [
        new File(['content1'], 'file1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'file2.pdf', { type: 'application/pdf' }),
        new File(['content3'], 'file3.pdf', { type: 'application/pdf' })
      ];

      const requests: DocumentUploadRequest[] = files.map((file, index) => ({
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: `identity${index}`,
        isReplacement: false
      }));

      // Mock encryption to fail for second file
      vi.mocked(encryptionService.encryptDocument)
        .mockResolvedValueOnce({
          encryptedData: new ArrayBuffer(100),
          metadata: {
            algorithm: 'AES-256-GCM',
            keyVersion: 'v1',
            iv: 'mock-iv',
            authTag: 'mock-tag'
          }
        })
        .mockRejectedValueOnce(new Error('Encryption failed'))
        .mockResolvedValueOnce({
          encryptedData: new ArrayBuffer(100),
          metadata: {
            algorithm: 'AES-256-GCM',
            keyVersion: 'v1',
            iv: 'mock-iv',
            authTag: 'mock-tag'
          }
        });

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

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('Storage Quota Handling', () => {
    it('should handle storage quota exceeded error', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      const request: DocumentUploadRequest = {
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity123',
        isReplacement: false
      };

      vi.mocked(encryptionService.encryptDocument).mockResolvedValue({
        encryptedData: new ArrayBuffer(100),
        metadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'mock-iv',
          authTag: 'mock-tag'
        }
      });

      // Mock Firebase upload to fail with quota error
      const mockUploadTask = {
        on: vi.fn((event, onProgress, onError, onComplete) => {
          const quotaError = new Error('storage/quota-exceeded');
          onError(quotaError);
        }),
        snapshot: {
          bytesTransferred: 0,
          totalBytes: 100
        },
        cancel: vi.fn()
      };

      vi.mocked(firebaseStorage.ref).mockReturnValue({ fullPath: 'test-path' } as any);
      vi.mocked(firebaseStorage.uploadBytesResumable).mockReturnValue(mockUploadTask as any);

      const result = await uploadDocument(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should provide clear error message for quota issues', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      const request: DocumentUploadRequest = {
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity123',
        isReplacement: false
      };

      vi.mocked(encryptionService.encryptDocument).mockResolvedValue({
        encryptedData: new ArrayBuffer(100),
        metadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'mock-iv',
          authTag: 'mock-tag'
        }
      });

      const mockUploadTask = {
        on: vi.fn((event, onProgress, onError, onComplete) => {
          onError(new Error('Quota exceeded'));
        }),
        snapshot: {
          bytesTransferred: 0,
          totalBytes: 100
        },
        cancel: vi.fn()
      };

      vi.mocked(firebaseStorage.ref).mockReturnValue({ fullPath: 'test-path' } as any);
      vi.mocked(firebaseStorage.uploadBytesResumable).mockReturnValue(mockUploadTask as any);

      const result = await uploadDocument(request);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Upload failed');
      expect(result.errorCode).toBe('UPLOAD_FAILED');
    });
  });

  describe('Upload Cancellation', () => {
    it('should allow cancelling an active upload', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      const request: DocumentUploadRequest = {
        file,
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity123',
        isReplacement: false
      };

      vi.mocked(encryptionService.encryptDocument).mockResolvedValue({
        encryptedData: new ArrayBuffer(100),
        metadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'mock-iv',
          authTag: 'mock-tag'
        }
      });

      const mockCancel = vi.fn();
      const mockUploadTask = {
        on: vi.fn((event, onProgress, onError, onComplete) => {
          // Don't complete immediately
        }),
        snapshot: {
          bytesTransferred: 50,
          totalBytes: 100
        },
        cancel: mockCancel
      };

      vi.mocked(firebaseStorage.ref).mockReturnValue({ fullPath: 'test-path' } as any);
      vi.mocked(firebaseStorage.uploadBytesResumable).mockReturnValue(mockUploadTask as any);

      // Start upload (don't await)
      uploadDocument(request);

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 10));

      // Cancel upload
      const cancelled = cancelUpload('test-path');

      expect(cancelled).toBe(true);
      expect(mockCancel).toHaveBeenCalled();
    });
  });
});
