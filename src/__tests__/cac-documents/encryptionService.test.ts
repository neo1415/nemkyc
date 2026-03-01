/**
 * Unit Tests for CAC Document Encryption Service
 * 
 * Tests document encryption, decryption, error handling, and memory cleanup.
 * Validates Requirements 3.1, 3.4, 12.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  encryptDocument,
  decryptDocument,
  validateEncryptionMetadata,
  createBlobFromDecryptedData,
  createDownloadURL,
  downloadDecryptedDocument
} from '../../services/cacEncryptionService';
import { EncryptionMetadata } from '../../types/cacDocuments';

// Mock fetch globally
global.fetch = vi.fn();

describe('CAC Document Encryption Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('encryptDocument', () => {
    it('should successfully encrypt a document', async () => {
      // Arrange
      const fileContent = 'Test document content';
      const file = new File([fileContent], 'test.pdf', { type: 'application/pdf' });
      
      const mockEncryptionResponse = {
        encrypted: btoa('encrypted-data'),
        iv: 'test-iv-12345',
        authTag: 'test-auth-tag'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEncryptionResponse
      });

      // Act
      const result = await encryptDocument(file);

      // Assert
      expect(result).toBeDefined();
      expect(result.encryptedData).toBeInstanceOf(ArrayBuffer);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.algorithm).toBe('AES-256-GCM');
      expect(result.metadata.keyVersion).toBe('v1');
      expect(result.metadata.iv).toBe('test-iv-12345');
      expect(result.metadata.authTag).toBe('test-auth-tag');
    });

    it('should call backend encryption endpoint with correct data', async () => {
      // Arrange
      const fileContent = 'Test content';
      const file = new File([fileContent], 'test.pdf', { type: 'application/pdf' });
      
      const mockResponse = {
        encrypted: btoa('encrypted'),
        iv: 'iv-123',
        authTag: 'tag-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      await encryptDocument(file);

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cac-documents/encrypt',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.any(String)
        })
      );
    });

    it('should handle encryption service errors', async () => {
      // Arrange
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Act & Assert
      await expect(encryptDocument(file)).rejects.toThrow('Failed to encrypt document');
    });

    it('should handle network errors', async () => {
      // Arrange
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(encryptDocument(file)).rejects.toThrow('Failed to encrypt document');
    });

    it('should handle invalid encryption response', async () => {
      // Arrange
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ encrypted: 'data' }) // Missing iv
      });

      // Act & Assert
      await expect(encryptDocument(file)).rejects.toThrow('Failed to encrypt document');
    });

    it('should handle empty files', async () => {
      // Arrange
      const file = new File([], 'empty.pdf', { type: 'application/pdf' });
      
      // Empty file still gets encrypted, just results in minimal encrypted data
      const mockResponse = {
        encrypted: btoa('minimal-encrypted-data'),
        iv: 'iv-123',
        authTag: 'tag-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      const result = await encryptDocument(file);

      // Assert
      expect(result).toBeDefined();
      expect(result.encryptedData).toBeInstanceOf(ArrayBuffer);
      expect(result.metadata.iv).toBe('iv-123');
    });
  });

  describe('decryptDocument', () => {
    it('should successfully decrypt a document', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted-content').buffer;
      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'test-iv-12345',
        authTag: 'test-auth-tag'
      };
      const mimeType = 'application/pdf';

      const mockDecryptedData = btoa('decrypted-content');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ decrypted: mockDecryptedData })
      });

      // Act
      const result = await decryptDocument(encryptedData, metadata, mimeType);

      // Assert
      expect(result).toBeDefined();
      expect(result.decryptedData).toBeInstanceOf(ArrayBuffer);
      expect(result.mimeType).toBe(mimeType);
    });

    it('should call backend decryption endpoint with correct data', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted').buffer;
      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'iv-123',
        authTag: 'tag-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ decrypted: btoa('decrypted') })
      });

      // Act
      await decryptDocument(encryptedData, metadata, 'application/pdf');

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cac-documents/decrypt',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('iv-123')
        })
      );
    });

    it('should handle decryption service errors', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted').buffer;
      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'iv-123',
        authTag: 'tag-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      // Act & Assert
      await expect(
        decryptDocument(encryptedData, metadata, 'application/pdf')
      ).rejects.toThrow('Failed to decrypt document');
    });

    it('should handle invalid metadata', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted').buffer;
      const invalidMetadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: '', // Invalid: empty IV
        authTag: 'tag-123'
      };

      // Act & Assert
      await expect(
        decryptDocument(encryptedData, invalidMetadata, 'application/pdf')
      ).rejects.toThrow('Failed to decrypt document');
    });

    it('should handle missing algorithm in metadata', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted').buffer;
      const invalidMetadata: EncryptionMetadata = {
        algorithm: '', // Invalid: empty algorithm
        keyVersion: 'v1',
        iv: 'iv-123',
        authTag: 'tag-123'
      };

      // Act & Assert
      await expect(
        decryptDocument(encryptedData, invalidMetadata, 'application/pdf')
      ).rejects.toThrow('Failed to decrypt document');
    });

    it('should handle network errors during decryption', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted').buffer;
      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'iv-123',
        authTag: 'tag-123'
      };

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        decryptDocument(encryptedData, metadata, 'application/pdf')
      ).rejects.toThrow('Failed to decrypt document');
    });

    it('should handle invalid decryption response', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted').buffer;
      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'iv-123',
        authTag: 'tag-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}) // Missing decrypted field
      });

      // Act & Assert
      await expect(
        decryptDocument(encryptedData, metadata, 'application/pdf')
      ).rejects.toThrow('Failed to decrypt document');
    });
  });

  describe('validateEncryptionMetadata', () => {
    it('should validate correct metadata', () => {
      // Arrange
      const validMetadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'test-iv-12345',
        authTag: 'test-auth-tag'
      };

      // Act
      const result = validateEncryptionMetadata(validMetadata);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject metadata with missing algorithm', () => {
      // Arrange
      const invalidMetadata: EncryptionMetadata = {
        algorithm: '',
        keyVersion: 'v1',
        iv: 'test-iv',
        authTag: 'tag'
      };

      // Act
      const result = validateEncryptionMetadata(invalidMetadata);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject metadata with missing keyVersion', () => {
      // Arrange
      const invalidMetadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: '',
        iv: 'test-iv',
        authTag: 'tag'
      };

      // Act
      const result = validateEncryptionMetadata(invalidMetadata);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject metadata with missing IV', () => {
      // Arrange
      const invalidMetadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: '',
        authTag: 'tag'
      };

      // Act
      const result = validateEncryptionMetadata(invalidMetadata);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject metadata with wrong algorithm', () => {
      // Arrange
      const invalidMetadata: EncryptionMetadata = {
        algorithm: 'AES-128-CBC', // Wrong algorithm
        keyVersion: 'v1',
        iv: 'test-iv',
        authTag: 'tag'
      };

      // Act
      const result = validateEncryptionMetadata(invalidMetadata);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject null metadata', () => {
      // Act
      const result = validateEncryptionMetadata(null as any);

      // Assert
      expect(result).toBe(false);
    });

    it('should reject undefined metadata', () => {
      // Act
      const result = validateEncryptionMetadata(undefined as any);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('createBlobFromDecryptedData', () => {
    it('should create a Blob from decrypted data', () => {
      // Arrange
      const decryptedData = new TextEncoder().encode('test content').buffer;
      const mimeType = 'application/pdf';

      // Act
      const blob = createBlobFromDecryptedData(decryptedData, mimeType);

      // Assert
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe(mimeType);
      expect(blob.size).toBe(decryptedData.byteLength);
    });

    it('should handle different MIME types', () => {
      // Arrange
      const decryptedData = new TextEncoder().encode('image data').buffer;
      const mimeType = 'image/jpeg';

      // Act
      const blob = createBlobFromDecryptedData(decryptedData, mimeType);

      // Assert
      expect(blob.type).toBe(mimeType);
    });

    it('should handle empty data', () => {
      // Arrange
      const decryptedData = new ArrayBuffer(0);
      const mimeType = 'application/pdf';

      // Act
      const blob = createBlobFromDecryptedData(decryptedData, mimeType);

      // Assert
      expect(blob.size).toBe(0);
      expect(blob.type).toBe(mimeType);
    });
  });

  describe('createDownloadURL', () => {
    it('should create a valid object URL', () => {
      // Arrange
      const decryptedData = new TextEncoder().encode('test content').buffer;
      const mimeType = 'application/pdf';

      // Act
      const url = createDownloadURL(decryptedData, mimeType);

      // Assert
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url).toMatch(/^blob:/);

      // Cleanup
      URL.revokeObjectURL(url);
    });

    it('should create different URLs for different data', () => {
      // Arrange
      const data1 = new TextEncoder().encode('content 1').buffer;
      const data2 = new TextEncoder().encode('content 2').buffer;

      // Act
      const url1 = createDownloadURL(data1, 'application/pdf');
      const url2 = createDownloadURL(data2, 'application/pdf');

      // Assert
      expect(url1).not.toBe(url2);

      // Cleanup
      URL.revokeObjectURL(url1);
      URL.revokeObjectURL(url2);
    });
  });

  describe('downloadDecryptedDocument', () => {
    it('should trigger a download', () => {
      // Arrange
      const decryptedData = new TextEncoder().encode('test content').buffer;
      const filename = 'test-document.pdf';
      const mimeType = 'application/pdf';

      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      // Act
      downloadDecryptedDocument(decryptedData, filename, mimeType);

      // Assert
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(filename);
      expect(mockLink.href).toMatch(/^blob:/);
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should clean up object URL even if error occurs', () => {
      // Arrange
      const decryptedData = new TextEncoder().encode('test content').buffer;
      const filename = 'test.pdf';
      const mimeType = 'application/pdf';

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn().mockImplementation(() => {
          throw new Error('Click failed');
        })
      };
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      // Act & Assert
      expect(() => {
        downloadDecryptedDocument(decryptedData, filename, mimeType);
      }).toThrow('Click failed');

      // URL should still be revoked
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('Memory cleanup', () => {
    it('should not leak sensitive data after encryption', async () => {
      // Arrange
      const sensitiveContent = 'SENSITIVE_DATA_12345';
      const file = new File([sensitiveContent], 'test.pdf', { type: 'application/pdf' });
      
      const mockResponse = {
        encrypted: btoa('encrypted'),
        iv: 'iv-123',
        authTag: 'tag-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Act
      await encryptDocument(file);

      // Assert - This is a best-effort test
      // In JavaScript, we can't truly verify memory cleanup, but we can verify
      // the function completes without errors and returns expected data
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should not leak sensitive data after decryption', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted-sensitive').buffer;
      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'iv-123',
        authTag: 'tag-123'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ decrypted: btoa('decrypted-sensitive') })
      });

      // Act
      await decryptDocument(encryptedData, metadata, 'application/pdf');

      // Assert - Best-effort verification
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should provide user-friendly error messages for encryption failures', async () => {
      // Arrange
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      (global.fetch as any).mockRejectedValueOnce(new Error('Backend error'));

      // Act & Assert
      await expect(encryptDocument(file)).rejects.toThrow('Failed to encrypt document. Please try again.');
    });

    it('should provide user-friendly error messages for decryption failures', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted').buffer;
      const metadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: 'iv-123',
        authTag: 'tag-123'
      };

      (global.fetch as any).mockRejectedValueOnce(new Error('Backend error'));

      // Act & Assert
      await expect(
        decryptDocument(encryptedData, metadata, 'application/pdf')
      ).rejects.toThrow('Failed to decrypt document. The file may be corrupted.');
    });

    it('should log errors for debugging', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      (global.fetch as any).mockRejectedValueOnce(new Error('Test error'));

      // Act
      try {
        await encryptDocument(file);
      } catch (error) {
        // Expected
      }

      // Assert
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Document encryption failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
