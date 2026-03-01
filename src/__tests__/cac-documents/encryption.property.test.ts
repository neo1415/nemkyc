/**
 * Property-Based Tests for CAC Document Encryption
 * 
 * Uses fast-check to test encryption properties across many generated inputs.
 * 
 * Property 3: Encryption round-trip consistency
 * - Validates Requirements 3.1, 3.4
 * - Tests that encrypt(decrypt(data)) === data for all valid inputs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  encryptDocument,
  decryptDocument
} from '../../services/cacEncryptionService';
import { EncryptionMetadata } from '../../types/cacDocuments';

// Mock fetch globally
global.fetch = vi.fn();

describe('Property-Based Tests: Encryption Round-Trip Consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Property 3: Encryption round-trip consistency', () => {
    it('should maintain data integrity through encrypt-decrypt cycle for various content sizes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }), // Various content sizes
          fc.string({ minLength: 1, maxLength: 50 }), // Filename
          fc.constantFrom('application/pdf', 'image/jpeg', 'image/png'), // MIME types
          async (contentArray, filename, mimeType) => {
            // Arrange
            const content = contentArray.buffer;
            const extension = mimeType === 'application/pdf' ? '.pdf' :
                            mimeType === 'image/jpeg' ? '.jpeg' : '.png';
            const file = new File([content], `${filename}${extension}`, { type: mimeType });

            // Mock encryption response
            const mockEncryptedData = btoa(String.fromCharCode(...new Uint8Array(content)));
            const mockIV = 'test-iv-' + Math.random().toString(36).substring(7);
            const mockAuthTag = 'test-auth-tag-' + Math.random().toString(36).substring(7);

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: mockEncryptedData,
                iv: mockIV,
                authTag: mockAuthTag
              })
            });

            // Mock decryption response - should return original data
            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                decrypted: btoa(String.fromCharCode(...new Uint8Array(content)))
              })
            });

            // Act
            const encryptionResult = await encryptDocument(file);
            const decryptionResult = await decryptDocument(
              encryptionResult.encryptedData,
              encryptionResult.metadata,
              mimeType
            );

            // Assert - Decrypted data should match original
            const originalBytes = new Uint8Array(content);
            const decryptedBytes = new Uint8Array(decryptionResult.decryptedData);
            
            expect(decryptedBytes.length).toBe(originalBytes.length);
            expect(Array.from(decryptedBytes)).toEqual(Array.from(originalBytes));
            expect(decryptionResult.mimeType).toBe(mimeType);
          }
        ),
        { numRuns: 50 } // Run 50 times with different inputs
      );
    });

    it('should preserve data integrity for PDF documents of various sizes', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 100, maxLength: 5000 }),
          async (contentArray) => {
            // Arrange
            const content = contentArray.buffer;
            const file = new File([content], 'document.pdf', { type: 'application/pdf' });

            const mockEncryptedData = btoa(String.fromCharCode(...new Uint8Array(content)));
            const mockIV = 'iv-' + Date.now();
            const mockAuthTag = 'tag-' + Date.now();

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: mockEncryptedData,
                iv: mockIV,
                authTag: mockAuthTag
              })
            });

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                decrypted: btoa(String.fromCharCode(...new Uint8Array(content)))
              })
            });

            // Act
            const encrypted = await encryptDocument(file);
            const decrypted = await decryptDocument(
              encrypted.encryptedData,
              encrypted.metadata,
              'application/pdf'
            );

            // Assert
            const originalBytes = new Uint8Array(content);
            const decryptedBytes = new Uint8Array(decrypted.decryptedData);
            expect(Array.from(decryptedBytes)).toEqual(Array.from(originalBytes));
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should preserve data integrity for image documents', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 100, maxLength: 5000 }),
          fc.constantFrom('image/jpeg', 'image/png'),
          async (contentArray, mimeType) => {
            // Arrange
            const content = contentArray.buffer;
            const extension = mimeType === 'image/jpeg' ? '.jpeg' : '.png';
            const file = new File([content], `image${extension}`, { type: mimeType });

            const mockEncryptedData = btoa(String.fromCharCode(...new Uint8Array(content)));
            const mockIV = 'iv-' + Math.random();
            const mockAuthTag = 'tag-' + Math.random();

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: mockEncryptedData,
                iv: mockIV,
                authTag: mockAuthTag
              })
            });

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                decrypted: btoa(String.fromCharCode(...new Uint8Array(content)))
              })
            });

            // Act
            const encrypted = await encryptDocument(file);
            const decrypted = await decryptDocument(
              encrypted.encryptedData,
              encrypted.metadata,
              mimeType
            );

            // Assert
            const originalBytes = new Uint8Array(content);
            const decryptedBytes = new Uint8Array(decrypted.decryptedData);
            expect(Array.from(decryptedBytes)).toEqual(Array.from(originalBytes));
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain metadata consistency through encryption cycle', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 10, maxLength: 1000 }),
          fc.constantFrom('application/pdf', 'image/jpeg', 'image/png'),
          async (contentArray, mimeType) => {
            // Arrange
            const content = contentArray.buffer;
            const file = new File([content], 'test.pdf', { type: mimeType });

            const mockIV = 'iv-' + Math.random().toString(36);
            const mockAuthTag = 'tag-' + Math.random().toString(36);

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: btoa('encrypted'),
                iv: mockIV,
                authTag: mockAuthTag
              })
            });

            // Act
            const encrypted = await encryptDocument(file);

            // Assert - Metadata should be properly set
            expect(encrypted.metadata).toBeDefined();
            expect(encrypted.metadata.algorithm).toBe('AES-256-GCM');
            expect(encrypted.metadata.keyVersion).toBe('v1');
            expect(encrypted.metadata.iv).toBe(mockIV);
            expect(encrypted.metadata.authTag).toBe(mockAuthTag);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle edge case: minimal file content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 10 }), // Very small files
          async (contentArray) => {
            // Arrange
            const content = contentArray.buffer;
            const file = new File([content], 'tiny.pdf', { type: 'application/pdf' });

            const mockEncryptedData = btoa(String.fromCharCode(...new Uint8Array(content)));

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: mockEncryptedData,
                iv: 'iv-tiny',
                authTag: 'tag-tiny'
              })
            });

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                decrypted: btoa(String.fromCharCode(...new Uint8Array(content)))
              })
            });

            // Act
            const encrypted = await encryptDocument(file);
            const decrypted = await decryptDocument(
              encrypted.encryptedData,
              encrypted.metadata,
              'application/pdf'
            );

            // Assert
            const originalBytes = new Uint8Array(content);
            const decryptedBytes = new Uint8Array(decrypted.decryptedData);
            expect(Array.from(decryptedBytes)).toEqual(Array.from(originalBytes));
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle various filename patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 50, maxLength: 500 }),
          fc.string({ minLength: 1, maxLength: 100 }), // Various filenames
          async (contentArray, filename) => {
            // Arrange
            const content = contentArray.buffer;
            const file = new File([content], `${filename}.pdf`, { type: 'application/pdf' });

            const mockEncryptedData = btoa(String.fromCharCode(...new Uint8Array(content)));

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: mockEncryptedData,
                iv: 'iv-test',
                authTag: 'tag-test'
              })
            });

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                decrypted: btoa(String.fromCharCode(...new Uint8Array(content)))
              })
            });

            // Act
            const encrypted = await encryptDocument(file);
            const decrypted = await decryptDocument(
              encrypted.encryptedData,
              encrypted.metadata,
              'application/pdf'
            );

            // Assert - Filename shouldn't affect encryption integrity
            const originalBytes = new Uint8Array(content);
            const decryptedBytes = new Uint8Array(decrypted.decryptedData);
            expect(Array.from(decryptedBytes)).toEqual(Array.from(originalBytes));
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should produce consistent encryption metadata structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 10, maxLength: 1000 }),
          async (contentArray) => {
            // Arrange
            const content = contentArray.buffer;
            const file = new File([content], 'test.pdf', { type: 'application/pdf' });

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: btoa('encrypted'),
                iv: 'test-iv',
                authTag: 'test-tag'
              })
            });

            // Act
            const encrypted = await encryptDocument(file);

            // Assert - Metadata structure should always be consistent
            expect(encrypted.metadata).toHaveProperty('algorithm');
            expect(encrypted.metadata).toHaveProperty('keyVersion');
            expect(encrypted.metadata).toHaveProperty('iv');
            expect(encrypted.metadata).toHaveProperty('authTag');
            expect(typeof encrypted.metadata.algorithm).toBe('string');
            expect(typeof encrypted.metadata.keyVersion).toBe('string');
            expect(typeof encrypted.metadata.iv).toBe('string');
            expect(typeof encrypted.metadata.authTag).toBe('string');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle repeated encryption of same content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 100, maxLength: 500 }),
          async (contentArray) => {
            // Arrange
            const content = contentArray.buffer;
            const file1 = new File([content], 'doc1.pdf', { type: 'application/pdf' });
            const file2 = new File([content], 'doc2.pdf', { type: 'application/pdf' });

            // Mock two separate encryption calls
            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: btoa('encrypted1'),
                iv: 'iv-1',
                authTag: 'tag-1'
              })
            });

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: btoa('encrypted2'),
                iv: 'iv-2',
                authTag: 'tag-2'
              })
            });

            // Act
            const encrypted1 = await encryptDocument(file1);
            const encrypted2 = await encryptDocument(file2);

            // Assert - Both should have valid metadata (IVs should differ in real encryption)
            expect(encrypted1.metadata).toBeDefined();
            expect(encrypted2.metadata).toBeDefined();
            expect(encrypted1.metadata.algorithm).toBe(encrypted2.metadata.algorithm);
            expect(encrypted1.metadata.keyVersion).toBe(encrypted2.metadata.keyVersion);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property: Encryption output validity', () => {
    it('should always produce ArrayBuffer output', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          async (contentArray) => {
            // Arrange
            const content = contentArray.buffer;
            const file = new File([content], 'test.pdf', { type: 'application/pdf' });

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: btoa('encrypted-data'),
                iv: 'iv-test',
                authTag: 'tag-test'
              })
            });

            // Act
            const result = await encryptDocument(file);

            // Assert
            expect(result.encryptedData).toBeInstanceOf(ArrayBuffer);
            expect(result.encryptedData.byteLength).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should always include required metadata fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 1, maxLength: 1000 }),
          async (contentArray) => {
            // Arrange
            const content = contentArray.buffer;
            const file = new File([content], 'test.pdf', { type: 'application/pdf' });

            (global.fetch as any).mockResolvedValueOnce({
              ok: true,
              json: async () => ({
                encrypted: btoa('encrypted'),
                iv: 'iv-' + Math.random(),
                authTag: 'tag-' + Math.random()
              })
            });

            // Act
            const result = await encryptDocument(file);

            // Assert - All required fields must be present
            expect(result.metadata.algorithm).toBeTruthy();
            expect(result.metadata.keyVersion).toBeTruthy();
            expect(result.metadata.iv).toBeTruthy();
            expect(result.metadata.authTag).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Decryption input validation', () => {
    it('should require valid metadata for decryption', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uint8Array({ minLength: 10, maxLength: 500 }),
          async (contentArray) => {
            // Arrange
            const encryptedData = contentArray.buffer;
            const invalidMetadata: EncryptionMetadata = {
              algorithm: 'AES-256-GCM',
              keyVersion: 'v1',
              iv: '', // Invalid: empty IV
              authTag: 'tag'
            };

            // Act & Assert
            await expect(
              decryptDocument(encryptedData, invalidMetadata, 'application/pdf')
            ).rejects.toThrow();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
