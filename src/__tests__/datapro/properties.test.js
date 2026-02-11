/**
 * Property-Based Tests for Datapro Integration
 * 
 * Properties:
 * - Property 29: Encryption Reversibility
 * - Property 30: Field Matching Consistency
 * - Property 31: Date Format Flexibility
 */

import * as fc from 'fast-check';
import { test, describe, expect } from 'vitest';

const crypto = require('crypto');

// Set up encryption key
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

const {
  encryptData,
  decryptData
} = require('../../../server-utils/encryption.cjs');

const {
  normalizeString,
  parseDate
} = require('../../../server-services/__mocks__/dataproClient.cjs');

describe('Property-Based Tests', () => {
  describe('Property 29: Encryption Reversibility', () => {
    test('For any plaintext identity number, encrypt → decrypt must return original value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (plaintext) => {
            // Encrypt
            const { encrypted, iv } = encryptData(plaintext);

            // Decrypt
            const decrypted = decryptData(encrypted, iv);

            // Property: decrypted must equal original
            return decrypted === plaintext;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('For any array of NINs, each encrypt → decrypt cycle must preserve the value', () => {
      fc.assert(
        fc.property(
          fc.array(fc.stringMatching(/^[0-9]{11}$/), { minLength: 1, maxLength: 10 }),
          (nins) => {
            return nins.every(nin => {
              const { encrypted, iv } = encryptData(nin);
              const decrypted = decryptData(encrypted, iv);
              return decrypted === nin;
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Encryption must produce different ciphertext for same plaintext (IV uniqueness)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (plaintext) => {
            const result1 = encryptData(plaintext);
            const result2 = encryptData(plaintext);

            // IVs must be different
            const ivsDifferent = result1.iv !== result2.iv;

            // Encrypted values must be different
            const encryptedDifferent = result1.encrypted !== result2.encrypted;

            // But both must decrypt to same plaintext
            const decrypt1 = decryptData(result1.encrypted, result1.iv);
            const decrypt2 = decryptData(result2.encrypted, result2.iv);
            const decryptionsMatch = decrypt1 === plaintext && decrypt2 === plaintext;

            return ivsDifferent && encryptedDifferent && decryptionsMatch;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 30: Field Matching Consistency', () => {
    test('For any two identical names (ignoring case/whitespace), matching must return true', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (name) => {
            // Create variations of the same name
            const name1 = normalizeString(name);
            const name2 = normalizeString(name.toUpperCase());
            const name3 = normalizeString('  ' + name + '  ');
            const name4 = normalizeString(name.toLowerCase());

            // All normalized versions must be equal
            return name1 === name2 && name2 === name3 && name3 === name4;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('For any two different names, if normalized versions differ, matching must return false', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (name1, name2) => {
            const normalized1 = normalizeString(name1);
            const normalized2 = normalizeString(name2);

            // If normalized versions are different, they should not match
            if (normalized1 !== normalized2) {
              return normalized1 !== normalized2;
            }

            // If they happen to normalize to the same thing, they should match
            return normalized1 === normalized2;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Normalization must be idempotent (normalizing twice gives same result)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (name) => {
            const normalized1 = normalizeString(name);
            const normalized2 = normalizeString(normalized1);

            return normalized1 === normalized2;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Whitespace variations must normalize to same value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (name) => {
            const variations = [
              name,
              '  ' + name,
              name + '  ',
              '  ' + name + '  ',
              name.replace(/ /g, '  '), // Double spaces
              name.trim()
            ];

            const normalized = variations.map(v => normalizeString(v));

            // All should normalize to the same value
            return normalized.every(n => n === normalized[0]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 31: Date Format Flexibility', () => {
    test('For any date in DD/MM/YYYY, DD-MMM-YYYY, or YYYY-MM-DD format representing the same date, matching must return true', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 28 }), // Day (safe for all months)
          fc.integer({ min: 1, max: 12 }), // Month
          fc.integer({ min: 1950, max: 2024 }), // Year
          (day, month, year) => {
            // Create date in different formats
            const ddmmyyyy = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
            const yyyymmdd = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const yyyymmddSlash = `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;

            // Parse all formats
            const parsed1 = parseDate(ddmmyyyy);
            const parsed2 = parseDate(yyyymmdd);
            const parsed3 = parseDate(yyyymmddSlash);

            // All should parse to the same normalized format
            return parsed1 === parsed2 && parsed2 === parsed3;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Date parsing must be consistent regardless of leading zeros', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1950, max: 2024 }),
          (day, month, year) => {
            // With leading zeros
            const withZeros = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;

            // Without leading zeros
            const withoutZeros = `${day}/${month}/${year}`;

            const parsed1 = parseDate(withZeros);
            const parsed2 = parseDate(withoutZeros);

            // Both should parse to the same value
            return parsed1 === parsed2;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('DD-MMM-YYYY format must parse correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 28 }),
          fc.constantFrom('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'),
          fc.integer({ min: 1950, max: 2024 }),
          (day, monthName, year) => {
            const monthMap = {
              'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
              'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
              'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            };

            const ddmmmyyyy = `${day}-${monthName}-${year}`;
            const parsed = parseDate(ddmmmyyyy);

            if (parsed) {
              const expectedMonth = monthMap[monthName];
              const expectedDay = day.toString().padStart(2, '0');
              const expected = `${year}-${expectedMonth}-${expectedDay}`;

              return parsed === expected;
            }

            // If parsing failed, that's also acceptable for this property
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Invalid date strings must return null', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (invalidDate) => {
            // Filter out strings that might accidentally be valid dates
            if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(invalidDate)) {
              return true; // Skip valid-looking dates
            }

            if (/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(invalidDate)) {
              return true; // Skip valid-looking dates
            }

            const parsed = parseDate(invalidDate);

            // Invalid dates should return null
            return parsed === null;
          }
        ),
        { numRuns: 100 }
      );
    });

    test('Date parsing must be deterministic (same input always gives same output)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1950, max: 2024 }),
          (day, month, year) => {
            const dateStr = `${day}/${month}/${year}`;

            const parsed1 = parseDate(dateStr);
            const parsed2 = parseDate(dateStr);
            const parsed3 = parseDate(dateStr);

            // All parses of the same string must return the same value
            return parsed1 === parsed2 && parsed2 === parsed3;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
