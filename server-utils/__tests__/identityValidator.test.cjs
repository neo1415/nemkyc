/**
 * Unit Tests for Identity Format Validator
 * 
 * Tests validation rules for NIN, BVN, and CAC identity formats
 */

const { validateIdentityFormat, batchValidateIdentities } = require('../identityValidator.cjs');

// Mock encryption functions for testing
let encryptData;
try {
  const encryption = require('../encryption.cjs');
  encryptData = encryption.encryptData;
} catch (err) {
  // If encryption fails (no key), create a mock
  encryptData = (data) => {
    throw new Error('ENCRYPTION_KEY not set');
  };
}

describe('Identity Format Validator', () => {
  describe('validateIdentityFormat - NIN', () => {
    test('accepts valid 11-digit NIN', () => {
      const result = validateIdentityFormat('NIN', '12345678901');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test('accepts valid NIN with case-insensitive type', () => {
      const result = validateIdentityFormat('nin', '12345678901');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test('rejects NIN with less than 11 digits', () => {
      const result = validateIdentityFormat('NIN', '1234567890');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('nin_invalid_length');
    });

    test('rejects NIN with more than 11 digits', () => {
      const result = validateIdentityFormat('NIN', '123456789012');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('nin_invalid_length');
    });

    test('rejects NIN with letters', () => {
      const result = validateIdentityFormat('NIN', '1234567890A');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('nin_contains_non_digits');
    });

    test('rejects NIN with special characters', () => {
      const result = validateIdentityFormat('NIN', '12345-67890');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('nin_contains_non_digits');
    });

    test('rejects NIN with spaces', () => {
      const result = validateIdentityFormat('NIN', '12345 67890');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('nin_contains_non_digits');
    });

    test('accepts NIN with leading/trailing whitespace (trimmed)', () => {
      const result = validateIdentityFormat('NIN', '  12345678901  ');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });
  });

  describe('validateIdentityFormat - BVN', () => {
    test('accepts valid 11-digit BVN', () => {
      const result = validateIdentityFormat('BVN', '22345678901');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test('accepts valid BVN with case-insensitive type', () => {
      const result = validateIdentityFormat('bvn', '22345678901');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test('rejects BVN with less than 11 digits', () => {
      const result = validateIdentityFormat('BVN', '2234567890');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('bvn_invalid_length');
    });

    test('rejects BVN with more than 11 digits', () => {
      const result = validateIdentityFormat('BVN', '223456789012');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('bvn_invalid_length');
    });

    test('rejects BVN with letters', () => {
      const result = validateIdentityFormat('BVN', '2234567890B');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('bvn_contains_non_digits');
    });

    test('rejects BVN with special characters', () => {
      const result = validateIdentityFormat('BVN', '22345-67890');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('bvn_contains_non_digits');
    });
  });

  describe('validateIdentityFormat - CAC', () => {
    test('accepts valid CAC with minimum 5 characters', () => {
      const result = validateIdentityFormat('CAC', 'RC123');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test('accepts CAC with alphanumeric characters', () => {
      const result = validateIdentityFormat('CAC', 'RC1234567');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test('accepts CAC with hyphens', () => {
      const result = validateIdentityFormat('CAC', 'RC-123-456');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test('accepts CAC with mixed case', () => {
      const result = validateIdentityFormat('CAC', 'Rc123XyZ');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test('accepts CAC with only letters', () => {
      const result = validateIdentityFormat('CAC', 'ABCDEF');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test('accepts CAC with only numbers', () => {
      const result = validateIdentityFormat('CAC', '123456');
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test('rejects CAC with less than 5 characters', () => {
      const result = validateIdentityFormat('CAC', 'RC12');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('cac_too_short');
    });

    test('rejects CAC with special characters other than hyphen', () => {
      const result = validateIdentityFormat('CAC', 'RC@12345');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('cac_invalid_characters');
    });

    test('rejects CAC with spaces', () => {
      const result = validateIdentityFormat('CAC', 'RC 12345');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('cac_invalid_characters');
    });

    test('rejects CAC with underscores', () => {
      const result = validateIdentityFormat('CAC', 'RC_12345');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('cac_invalid_characters');
    });
  });

  describe('validateIdentityFormat - Edge Cases', () => {
    test('rejects null value', () => {
      const result = validateIdentityFormat('NIN', null);
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('identity_value_missing');
    });

    test('rejects undefined value', () => {
      const result = validateIdentityFormat('NIN', undefined);
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('identity_value_missing');
    });

    test('rejects empty string', () => {
      const result = validateIdentityFormat('NIN', '');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('empty_value');
    });

    test('rejects whitespace-only string', () => {
      const result = validateIdentityFormat('NIN', '   ');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('empty_value');
    });

    test('rejects unknown identity type', () => {
      const result = validateIdentityFormat('UNKNOWN', '12345678901');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('unknown_identity_type');
    });

    test('rejects non-string value', () => {
      const result = validateIdentityFormat('NIN', 12345678901);
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('invalid_type');
    });
  });

  describe('validateIdentityFormat - Encrypted Values', () => {
    // Skip encryption tests if ENCRYPTION_KEY is not set
    const hasEncryptionKey = process.env.ENCRYPTION_KEY !== undefined;

    test.skipIf(!hasEncryptionKey)('accepts valid encrypted NIN', () => {
      const encrypted = encryptData('12345678901');
      const result = validateIdentityFormat('NIN', encrypted);
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test.skipIf(!hasEncryptionKey)('accepts valid encrypted BVN', () => {
      const encrypted = encryptData('22345678901');
      const result = validateIdentityFormat('BVN', encrypted);
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test.skipIf(!hasEncryptionKey)('accepts valid encrypted CAC', () => {
      const encrypted = encryptData('RC-123456');
      const result = validateIdentityFormat('CAC', encrypted);
      expect(result.isValid).toBe(true);
      expect(result.errorReason).toBeNull();
    });

    test.skipIf(!hasEncryptionKey)('rejects invalid encrypted NIN', () => {
      const encrypted = encryptData('123456789'); // Too short
      const result = validateIdentityFormat('NIN', encrypted);
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('nin_invalid_length');
    });

    test('handles decryption failure gracefully', () => {
      const malformedEncrypted = {
        encrypted: 'invalid-encrypted-data',
        iv: 'invalid-iv'
      };
      const result = validateIdentityFormat('NIN', malformedEncrypted);
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toBe('decryption_failed');
    });
  });

  describe('batchValidateIdentities', () => {
    test('validates multiple identities correctly', () => {
      const identities = [
        { entryId: 'entry1', type: 'NIN', value: '12345678901' },
        { entryId: 'entry2', type: 'BVN', value: '22345678901' },
        { entryId: 'entry3', type: 'CAC', value: 'RC-123456' }
      ];

      const results = batchValidateIdentities(identities);

      expect(results.size).toBe(3);
      expect(results.get('entry1').isValid).toBe(true);
      expect(results.get('entry2').isValid).toBe(true);
      expect(results.get('entry3').isValid).toBe(true);
    });

    test('identifies invalid entries in batch', () => {
      const identities = [
        { entryId: 'entry1', type: 'NIN', value: '12345678901' }, // Valid
        { entryId: 'entry2', type: 'BVN', value: '223456789' },   // Invalid - too short
        { entryId: 'entry3', type: 'CAC', value: 'RC1' }          // Invalid - too short
      ];

      const results = batchValidateIdentities(identities);

      expect(results.size).toBe(3);
      expect(results.get('entry1').isValid).toBe(true);
      expect(results.get('entry2').isValid).toBe(false);
      expect(results.get('entry2').errorReason).toBe('bvn_invalid_length');
      expect(results.get('entry3').isValid).toBe(false);
      expect(results.get('entry3').errorReason).toBe('cac_too_short');
    });

    test('handles empty batch', () => {
      const results = batchValidateIdentities([]);
      expect(results.size).toBe(0);
    });

    test.skipIf(!process.env.ENCRYPTION_KEY)('handles batch with encrypted values', () => {
      const identities = [
        { entryId: 'entry1', type: 'NIN', value: encryptData('12345678901') },
        { entryId: 'entry2', type: 'BVN', value: encryptData('22345678901') }
      ];

      const results = batchValidateIdentities(identities);

      expect(results.size).toBe(2);
      expect(results.get('entry1').isValid).toBe(true);
      expect(results.get('entry2').isValid).toBe(true);
    });
  });
});
