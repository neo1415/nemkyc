/**
 * Unit tests for encryption utility
 * 
 * Tests:
 * - Encryption/decryption round-trip
 * - IV uniqueness
 * - Key validation
 * - Error handling
 */

const crypto = require('crypto');

// Set encryption key before importing module
const TEST_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;

const {
  encryptData,
  decryptData,
  encryptIdentityFields,
  decryptIdentityFields,
  isEncrypted,
  generateEncryptionKey
} = require('../../../server-utils/encryption.cjs');

describe('Encryption Utility', () => {
  // Ensure encryption key is set for all tests
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  });

  describe('encryptData and decryptData', () => {
    test('should encrypt and decrypt data successfully (round-trip)', () => {
      const plaintext = '12345678901';
      
      const { encrypted, iv } = encryptData(plaintext);
      
      expect(encrypted).toBeDefined();
      expect(iv).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(typeof iv).toBe('string');
      
      const decrypted = decryptData(encrypted, iv);
      
      expect(decrypted).toBe(plaintext);
    });

    test('should produce different encrypted values for same plaintext (IV uniqueness)', () => {
      const plaintext = '12345678901';
      
      const result1 = encryptData(plaintext);
      const result2 = encryptData(plaintext);
      
      // IVs should be different
      expect(result1.iv).not.toBe(result2.iv);
      
      // Encrypted values should be different
      expect(result1.encrypted).not.toBe(result2.encrypted);
      
      // But both should decrypt to the same plaintext
      expect(decryptData(result1.encrypted, result1.iv)).toBe(plaintext);
      expect(decryptData(result2.encrypted, result2.iv)).toBe(plaintext);
    });

    test('should handle different data types', () => {
      const testCases = [
        '12345678901', // NIN
        '22123456789', // BVN
        'RC123456', // CAC
        'a'.repeat(100), // Long string
        '1', // Single character
        'Test Data 123!@#' // Special characters
      ];

      testCases.forEach(plaintext => {
        const { encrypted, iv } = encryptData(plaintext);
        const decrypted = decryptData(encrypted, iv);
        expect(decrypted).toBe(plaintext);
      });
    });

    test('should throw error for empty plaintext', () => {
      expect(() => encryptData('')).toThrow('Plaintext must be a non-empty string');
      expect(() => encryptData(null)).toThrow('Plaintext must be a non-empty string');
      expect(() => encryptData(undefined)).toThrow('Plaintext must be a non-empty string');
    });

    test('should throw error for non-string plaintext', () => {
      expect(() => encryptData(123)).toThrow('Plaintext must be a non-empty string');
      expect(() => encryptData({})).toThrow('Plaintext must be a non-empty string');
      expect(() => encryptData([])).toThrow('Plaintext must be a non-empty string');
    });

    test('should throw error for invalid encrypted data', () => {
      expect(() => decryptData('', 'validiv')).toThrow();
      expect(() => decryptData(null, 'validiv')).toThrow('Encrypted data must be a non-empty string');
      expect(() => decryptData('invalid', '')).toThrow();
    });

    test('should throw error for tampered data', () => {
      const plaintext = '12345678901';
      const { encrypted, iv } = encryptData(plaintext);
      
      // Tamper with encrypted data
      const tamperedEncrypted = encrypted.slice(0, -5) + 'XXXXX';
      
      expect(() => decryptData(tamperedEncrypted, iv)).toThrow();
    });

    test('should throw error for wrong IV', () => {
      const plaintext = '12345678901';
      const { encrypted } = encryptData(plaintext);
      const { iv: wrongIv } = encryptData('different');
      
      expect(() => decryptData(encrypted, wrongIv)).toThrow();
    });
  });

  describe('Key validation', () => {
    test('should work with valid 32-byte key', () => {
      // Already tested in round-trip tests above
      const plaintext = '12345678901';
      const { encrypted, iv } = encryptData(plaintext);
      const decrypted = decryptData(encrypted, iv);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('encryptIdentityFields and decryptIdentityFields', () => {
    test('should encrypt specified fields in an object', () => {
      const data = {
        nin: '12345678901',
        bvn: '22123456789',
        name: 'John Doe',
        email: 'john@example.com'
      };

      const encrypted = encryptIdentityFields(data, ['nin', 'bvn']);

      expect(encrypted.name).toBe('John Doe');
      expect(encrypted.email).toBe('john@example.com');
      expect(isEncrypted(encrypted.nin)).toBe(true);
      expect(isEncrypted(encrypted.bvn)).toBe(true);
    });

    test('should decrypt specified fields in an object', () => {
      const data = {
        nin: '12345678901',
        bvn: '22123456789',
        name: 'John Doe'
      };

      const encrypted = encryptIdentityFields(data, ['nin', 'bvn']);
      const decrypted = decryptIdentityFields(encrypted, ['nin', 'bvn']);

      expect(decrypted.nin).toBe('12345678901');
      expect(decrypted.bvn).toBe('22123456789');
      expect(decrypted.name).toBe('John Doe');
    });

    test('should handle missing fields gracefully', () => {
      const data = {
        nin: '12345678901',
        name: 'John Doe'
      };

      const encrypted = encryptIdentityFields(data, ['nin', 'bvn', 'cac']);

      expect(isEncrypted(encrypted.nin)).toBe(true);
      expect(encrypted.bvn).toBeUndefined();
      expect(encrypted.cac).toBeUndefined();
      expect(encrypted.name).toBe('John Doe');
    });

    test('should not double-encrypt already encrypted fields', () => {
      const data = {
        nin: '12345678901',
        name: 'John Doe'
      };

      const encrypted1 = encryptIdentityFields(data, ['nin']);
      const encrypted2 = encryptIdentityFields(encrypted1, ['nin']);

      // Should be the same (not double-encrypted)
      expect(encrypted2.nin).toEqual(encrypted1.nin);
    });

    test('should use default fields if not specified', () => {
      const data = {
        nin: '12345678901',
        bvn: '22123456789',
        cac: 'RC123456',
        name: 'John Doe'
      };

      const encrypted = encryptIdentityFields(data);

      expect(isEncrypted(encrypted.nin)).toBe(true);
      expect(isEncrypted(encrypted.bvn)).toBe(true);
      expect(isEncrypted(encrypted.cac)).toBe(true);
      expect(encrypted.name).toBe('John Doe');
    });
  });

  describe('isEncrypted', () => {
    test('should identify encrypted values correctly', () => {
      const plaintext = '12345678901';
      const { encrypted, iv } = encryptData(plaintext);
      
      const encryptedValue = { encrypted, iv };
      
      expect(isEncrypted(encryptedValue)).toBe(true);
    });

    test('should return false for non-encrypted values', () => {
      expect(isEncrypted('12345678901')).toBe(false);
      expect(isEncrypted(123)).toBe(false);
      expect(isEncrypted(null)).toBe(false);
      expect(isEncrypted(undefined)).toBe(false);
      expect(isEncrypted({})).toBe(false);
      expect(isEncrypted({ encrypted: 'test' })).toBe(false); // Missing iv
      expect(isEncrypted({ iv: 'test' })).toBe(false); // Missing encrypted
      expect(isEncrypted({ encrypted: '', iv: '' })).toBe(false); // Empty strings
    });
  });

  describe('generateEncryptionKey', () => {
    test('should generate a valid 32-byte hex key', () => {
      const key = generateEncryptionKey();
      
      expect(typeof key).toBe('string');
      expect(key.length).toBe(64); // 32 bytes = 64 hex characters
      expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    test('should generate unique keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('Error handling', () => {
    test('should handle decryption errors gracefully in decryptIdentityFields', () => {
      const data = {
        nin: { encrypted: 'invalid', iv: 'invalid' },
        name: 'John Doe'
      };

      const decrypted = decryptIdentityFields(data, ['nin']);

      // Should leave field as is if decryption fails
      expect(decrypted.nin).toEqual({ encrypted: 'invalid', iv: 'invalid' });
      expect(decrypted.name).toBe('John Doe');
    });

    test('should throw error for invalid data type in encryptIdentityFields', () => {
      expect(() => encryptIdentityFields(null)).toThrow('Data must be an object');
      expect(() => encryptIdentityFields('string')).toThrow('Data must be an object');
      expect(() => encryptIdentityFields(123)).toThrow('Data must be an object');
    });

    test('should throw error for invalid data type in decryptIdentityFields', () => {
      expect(() => decryptIdentityFields(null)).toThrow('Data must be an object');
      expect(() => decryptIdentityFields('string')).toThrow('Data must be an object');
      expect(() => decryptIdentityFields(123)).toThrow('Data must be an object');
    });
  });

  describe('Security properties', () => {
    test('IV should be 16 bytes (128 bits)', () => {
      const plaintext = '12345678901';
      const { iv } = encryptData(plaintext);
      
      const ivBuffer = Buffer.from(iv, 'base64');
      expect(ivBuffer.length).toBe(16);
    });

    test('encrypted data should be different from plaintext', () => {
      const plaintext = '12345678901';
      const { encrypted } = encryptData(plaintext);
      
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).not.toContain(plaintext);
    });

    test('should not leak plaintext in error messages', () => {
      const plaintext = '12345678901';
      
      try {
        encryptData(null);
      } catch (error) {
        expect(error.message).not.toContain(plaintext);
      }
    });
  });
});
