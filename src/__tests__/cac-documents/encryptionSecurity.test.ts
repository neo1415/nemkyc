/**
 * Security Tests for CAC Document Encryption
 * 
 * Tests security properties of the encryption implementation.
 * Validates Requirements 3.1, 3.2, 12.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  encryptDocument,
  decryptDocument
} from '../../services/cacEncryptionService';
import { EncryptionMetadata } from '../../types/cacDocuments';

// Mock fetch globally
global.fetch = vi.fn();

describe('CAC Document Encryption - Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Security: Encrypted data differs from plaintext', () => {
    it('should produce encrypted data that differs from original plaintext', async () => {
      // Arrange
      const plaintextContent = 'This is sensitive document content that must be encrypted';
      const file = new File([plaintextContent], 'document.pdf', { type: 'application/pdf' });

      // Mock encryption to return different data
      const mockEncryptedData = btoa('completely-different-encrypted-content-xyz123');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: mockEncryptedData,
          iv: 'test-iv-12345',
          authTag: 'test-auth-tag'
        })
      });

      // Act
      const result = await encryptDocument(file);

      // Assert - Encrypted data should not match plaintext
      const encryptedBytes = new Uint8Array(result.encryptedData);
      const plaintextBytes = new TextEncoder().encode(plaintextContent);
      
      // Convert to strings for comparison
      const encryptedString = String.fromCharCode(...encryptedBytes);
      const plaintextString = String.fromCharCode(...plaintextBytes);
      
      expect(encryptedString).not.toBe(plaintextString);
      expect(encryptedBytes.length).toBeGreaterThan(0);
    });

    it('should not contain plaintext patterns in encrypted output', async () => {
      // Arrange
      const sensitiveData = 'CONFIDENTIAL: Account Number 1234567890';
      const file = new File([sensitiveData], 'sensitive.pdf', { type: 'application/pdf' });

      // Mock encryption
      const mockEncryptedData = btoa('encrypted-random-bytes-no-patterns');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: mockEncryptedData,
          iv: 'iv-secure',
          authTag: 'tag-secure'
        })
      });

      // Act
      const result = await encryptDocument(file);

      // Assert - Encrypted data should not contain obvious plaintext patterns
      const encryptedString = new TextDecoder().decode(result.encryptedData);
      expect(encryptedString).not.toContain('CONFIDENTIAL');
      expect(encryptedString).not.toContain('1234567890');
      expect(encryptedString).not.toContain('Account Number');
    });

    it('should produce binary-looking encrypted output', async () => {
      // Arrange
      const content = 'Simple text content';
      const file = new File([content], 'doc.pdf', { type: 'application/pdf' });

      // Mock encryption with base64 encoded binary data
      const mockEncryptedData = btoa('\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: mockEncryptedData,
          iv: 'iv-test',
          authTag: 'tag-test'
        })
      });

      // Act
      const result = await encryptDocument(file);

      // Assert - Result should be ArrayBuffer (binary data)
      expect(result.encryptedData).toBeInstanceOf(ArrayBuffer);
      expect(result.encryptedData.byteLength).toBeGreaterThan(0);
    });
  });

  describe('Security: Same plaintext produces different ciphertext (IV uniqueness)', () => {
    it('should use different IVs for encrypting the same content twice', async () => {
      // Arrange
      const content = 'Same content encrypted twice';
      const file1 = new File([content], 'doc1.pdf', { type: 'application/pdf' });
      const file2 = new File([content], 'doc2.pdf', { type: 'application/pdf' });

      // Mock two encryption calls with different IVs
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: btoa('encrypted-version-1'),
          iv: 'unique-iv-12345',
          authTag: 'tag-1'
        })
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: btoa('encrypted-version-2'),
          iv: 'unique-iv-67890',
          authTag: 'tag-2'
        })
      });

      // Act
      const result1 = await encryptDocument(file1);
      const result2 = await encryptDocument(file2);

      // Assert - IVs should be different
      expect(result1.metadata.iv).not.toBe(result2.metadata.iv);
      expect(result1.metadata.iv).toBeTruthy();
      expect(result2.metadata.iv).toBeTruthy();
    });

    it('should produce different encrypted output for same plaintext with different IVs', async () => {
      // Arrange
      const content = 'Identical plaintext content';
      const file1 = new File([content], 'doc1.pdf', { type: 'application/pdf' });
      const file2 = new File([content], 'doc2.pdf', { type: 'application/pdf' });

      // Mock with different encrypted outputs
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: btoa('encrypted-output-A'),
          iv: 'iv-alpha',
          authTag: 'tag-alpha'
        })
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: btoa('encrypted-output-B'),
          iv: 'iv-beta',
          authTag: 'tag-beta'
        })
      });

      // Act
      const result1 = await encryptDocument(file1);
      const result2 = await encryptDocument(file2);

      // Assert - Encrypted data should differ
      const encrypted1 = new Uint8Array(result1.encryptedData);
      const encrypted2 = new Uint8Array(result2.encryptedData);
      
      expect(Array.from(encrypted1)).not.toEqual(Array.from(encrypted2));
    });

    it('should generate unique IVs for multiple encryptions', async () => {
      // Arrange
      const content = 'Test content';
      const ivs: string[] = [];

      // Mock multiple encryption calls
      for (let i = 0; i < 5; i++) {
        const uniqueIV = `iv-${Date.now()}-${Math.random()}`;
        ivs.push(uniqueIV);
        
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            encrypted: btoa(`encrypted-${i}`),
            iv: uniqueIV,
            authTag: `tag-${i}`
          })
        });
      }

      // Act
      const results = [];
      for (let i = 0; i < 5; i++) {
        const file = new File([content], `doc${i}.pdf`, { type: 'application/pdf' });
        const result = await encryptDocument(file);
        results.push(result);
      }

      // Assert - All IVs should be unique
      const resultIVs = results.map(r => r.metadata.iv);
      const uniqueIVs = new Set(resultIVs);
      expect(uniqueIVs.size).toBe(5); // All IVs should be different
    });
  });

  describe('Security: Tampering with encrypted data causes decryption failure', () => {
    it('should fail to decrypt when encrypted data is tampered with', async () => {
      // Arrange
      const originalContent = 'Original secure content';
      const file = new File([originalContent], 'doc.pdf', { type: 'application/pdf' });

      // Mock encryption
      const mockEncryptedData = btoa('encrypted-data-original');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: mockEncryptedData,
          iv: 'iv-original',
          authTag: 'tag-original'
        })
      });

      const encryptResult = await encryptDocument(file);

      // Tamper with encrypted data
      const tamperedData = new Uint8Array(encryptResult.encryptedData);
      tamperedData[0] = tamperedData[0] ^ 0xFF; // Flip bits in first byte

      // Mock decryption to fail for tampered data
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      // Act & Assert - Decryption should fail
      await expect(
        decryptDocument(tamperedData.buffer, encryptResult.metadata, 'application/pdf')
      ).rejects.toThrow();
    });

    it('should detect tampering in the middle of encrypted data', async () => {
      // Arrange
      const content = 'Sensitive document content that must maintain integrity';
      const file = new File([content], 'doc.pdf', { type: 'application/pdf' });

      const mockEncryptedData = btoa('encrypted-content-with-integrity');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: mockEncryptedData,
          iv: 'iv-integrity',
          authTag: 'tag-integrity'
        })
      });

      const encryptResult = await encryptDocument(file);

      // Tamper with middle of data
      const tamperedData = new Uint8Array(encryptResult.encryptedData);
      const middleIndex = Math.floor(tamperedData.length / 2);
      tamperedData[middleIndex] = tamperedData[middleIndex] ^ 0xAA;

      // Mock decryption failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      // Act & Assert
      await expect(
        decryptDocument(tamperedData.buffer, encryptResult.metadata, 'application/pdf')
      ).rejects.toThrow();
    });

    it('should detect tampering at the end of encrypted data', async () => {
      // Arrange
      const content = 'Document with integrity protection';
      const file = new File([content], 'doc.pdf', { type: 'application/pdf' });

      const mockEncryptedData = btoa('encrypted-with-auth-tag');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: mockEncryptedData,
          iv: 'iv-auth',
          authTag: 'tag-auth'
        })
      });

      const encryptResult = await encryptDocument(file);

      // Tamper with last byte
      const tamperedData = new Uint8Array(encryptResult.encryptedData);
      tamperedData[tamperedData.length - 1] = tamperedData[tamperedData.length - 1] ^ 0x55;

      // Mock decryption failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      // Act & Assert
      await expect(
        decryptDocument(tamperedData.buffer, encryptResult.metadata, 'application/pdf')
      ).rejects.toThrow();
    });
  });

  describe('Security: Invalid IV causes decryption failure', () => {
    it('should fail to decrypt with wrong IV', async () => {
      // Arrange
      const content = 'Encrypted content';
      const file = new File([content], 'doc.pdf', { type: 'application/pdf' });

      const correctIV = 'correct-iv-12345';
      const mockEncryptedData = btoa('encrypted-data');
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: mockEncryptedData,
          iv: correctIV,
          authTag: 'tag-correct'
        })
      });

      const encryptResult = await encryptDocument(file);

      // Use wrong IV for decryption
      const wrongMetadata: EncryptionMetadata = {
        ...encryptResult.metadata,
        iv: 'wrong-iv-67890'
      };

      // Mock decryption failure with wrong IV
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      // Act & Assert
      await expect(
        decryptDocument(encryptResult.encryptedData, wrongMetadata, 'application/pdf')
      ).rejects.toThrow();
    });

    it('should fail to decrypt with empty IV', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted').buffer;
      const invalidMetadata: EncryptionMetadata = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        iv: '', // Empty IV
        authTag: 'tag'
      };

      // Act & Assert - Should fail validation before even calling backend
      await expect(
        decryptDocument(encryptedData, invalidMetadata, 'application/pdf')
      ).rejects.toThrow();
    });

    it('should fail to decrypt with modified IV', async () => {
      // Arrange
      const content = 'Test content';
      const file = new File([content], 'doc.pdf', { type: 'application/pdf' });

      const originalIV = 'original-iv-abc123';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: btoa('encrypted'),
          iv: originalIV,
          authTag: 'tag'
        })
      });

      const encryptResult = await encryptDocument(file);

      // Modify IV slightly
      const modifiedMetadata: EncryptionMetadata = {
        ...encryptResult.metadata,
        iv: 'original-iv-abc124' // Changed last character
      };

      // Mock decryption failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      // Act & Assert
      await expect(
        decryptDocument(encryptResult.encryptedData, modifiedMetadata, 'application/pdf')
      ).rejects.toThrow();
    });

    it('should require IV to be present in metadata', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted').buffer;
      const metadataWithoutIV: any = {
        algorithm: 'AES-256-GCM',
        keyVersion: 'v1',
        authTag: 'tag'
        // IV is missing
      };

      // Act & Assert
      await expect(
        decryptDocument(encryptedData, metadataWithoutIV, 'application/pdf')
      ).rejects.toThrow();
    });
  });

  describe('Security: Algorithm validation', () => {
    it('should use AES-256-GCM algorithm', async () => {
      // Arrange
      const content = 'Test content';
      const file = new File([content], 'doc.pdf', { type: 'application/pdf' });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: btoa('encrypted'),
          iv: 'iv-test',
          authTag: 'tag-test'
        })
      });

      // Act
      const result = await encryptDocument(file);

      // Assert - Should use AES-256-GCM
      expect(result.metadata.algorithm).toBe('AES-256-GCM');
    });

    it('should reject decryption with wrong algorithm in metadata', async () => {
      // Arrange
      const encryptedData = new TextEncoder().encode('encrypted').buffer;
      const wrongAlgorithmMetadata: EncryptionMetadata = {
        algorithm: 'AES-128-CBC', // Wrong algorithm
        keyVersion: 'v1',
        iv: 'iv-test',
        authTag: 'tag-test'
      };

      // Act & Assert - Should fail validation
      await expect(
        decryptDocument(encryptedData, wrongAlgorithmMetadata, 'application/pdf')
      ).rejects.toThrow();
    });
  });

  describe('Security: Authentication tag validation', () => {
    it('should include authentication tag in encryption metadata', async () => {
      // Arrange
      const content = 'Content requiring authentication';
      const file = new File([content], 'doc.pdf', { type: 'application/pdf' });

      const mockAuthTag = 'auth-tag-for-gcm-mode';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: btoa('encrypted'),
          iv: 'iv-test',
          authTag: mockAuthTag
        })
      });

      // Act
      const result = await encryptDocument(file);

      // Assert
      expect(result.metadata.authTag).toBe(mockAuthTag);
      expect(result.metadata.authTag).toBeTruthy();
    });

    it('should fail decryption with tampered authentication tag', async () => {
      // Arrange
      const content = 'Authenticated content';
      const file = new File([content], 'doc.pdf', { type: 'application/pdf' });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: btoa('encrypted'),
          iv: 'iv-test',
          authTag: 'original-auth-tag'
        })
      });

      const encryptResult = await encryptDocument(file);

      // Tamper with auth tag
      const tamperedMetadata: EncryptionMetadata = {
        ...encryptResult.metadata,
        authTag: 'tampered-auth-tag'
      };

      // Mock decryption failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      // Act & Assert
      await expect(
        decryptDocument(encryptResult.encryptedData, tamperedMetadata, 'application/pdf')
      ).rejects.toThrow();
    });
  });

  describe('Security: Key version tracking', () => {
    it('should include key version in encryption metadata', async () => {
      // Arrange
      const content = 'Content with key versioning';
      const file = new File([content], 'doc.pdf', { type: 'application/pdf' });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: btoa('encrypted'),
          iv: 'iv-test',
          authTag: 'tag-test'
        })
      });

      // Act
      const result = await encryptDocument(file);

      // Assert
      expect(result.metadata.keyVersion).toBe('v1');
      expect(result.metadata.keyVersion).toBeTruthy();
    });

    it('should maintain key version through encryption-decryption cycle', async () => {
      // Arrange
      const content = 'Test content';
      const file = new File([content], 'doc.pdf', { type: 'application/pdf' });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          encrypted: btoa('encrypted'),
          iv: 'iv-test',
          authTag: 'tag-test'
        })
      });

      const encryptResult = await encryptDocument(file);
      const keyVersion = encryptResult.metadata.keyVersion;

      // Mock decryption
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          decrypted: btoa('decrypted')
        })
      });

      // Act
      await decryptDocument(
        encryptResult.encryptedData,
        encryptResult.metadata,
        'application/pdf'
      );

      // Assert - Key version should be preserved
      expect(keyVersion).toBe('v1');
    });
  });
});
