/**
 * Tests for SimpleVerificationMatcher - Nigerian NIN Name Matching
 * 
 * Focus: Verify that the name matching logic correctly handles:
 * 1. Exact matches
 * 2. Partial matches (form has first name only, document has first + middle)
 * 3. Word-level matching
 */

import { SimpleVerificationMatcher } from '../simpleVerificationMatcher';
import { IndividualData } from '../../types/geminiDocumentVerification';

describe('SimpleVerificationMatcher - Nigerian NIN Name Matching', () => {
  let matcher: SimpleVerificationMatcher;

  beforeEach(() => {
    matcher = new SimpleVerificationMatcher();
  });

  describe('Nigerian NIN Document - First Name + Middle Name Handling', () => {
    test('should match when form has first name only and document has first + middle name', async () => {
      // This is the reported issue: Document AI extracts "DANIEL ADEMOLA" but form has "DANIEL"
      const extractedData: IndividualData = {
        fullName: 'OYENIYI DANIEL ADEMOLA',
        firstName: 'DANIEL ADEMOLA', // First + Middle name combined
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const formData = {
        firstName: 'DANIEL', // Only first name
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
      expect(result.mismatches).toHaveLength(0);
    });

    test('should match when form has first + middle name and document has first + middle name', async () => {
      const extractedData: IndividualData = {
        fullName: 'OYENIYI DANIEL ADEMOLA',
        firstName: 'DANIEL ADEMOLA',
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const formData = {
        firstName: 'DANIEL ADEMOLA', // Full first + middle name
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
      expect(result.mismatches).toHaveLength(0);
    });

    test('should match case-insensitively', async () => {
      const extractedData: IndividualData = {
        fullName: 'OYENIYI DANIEL ADEMOLA',
        firstName: 'DANIEL ADEMOLA',
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const formData = {
        firstName: 'daniel', // lowercase
        lastName: 'oyeniyi', // lowercase
        nin: '12345678901',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
      expect(result.mismatches).toHaveLength(0);
    });

    test('should NOT match when first name is completely different', async () => {
      const extractedData: IndividualData = {
        fullName: 'OYENIYI DANIEL ADEMOLA',
        firstName: 'DANIEL ADEMOLA',
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const formData = {
        firstName: 'JOHN', // Different name
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(false);
      expect(result.mismatches.length).toBeGreaterThan(0);
      expect(result.mismatches[0].field).toBe('firstName');
    });

    test('should NOT match when form has names in different order', async () => {
      const extractedData: IndividualData = {
        fullName: 'OYENIYI DANIEL ADEMOLA',
        firstName: 'DANIEL ADEMOLA',
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const formData = {
        firstName: 'ADEMOLA DANIEL', // Reversed order
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      // Names in different order should NOT match (order matters for identity verification)
      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(false);
      expect(result.mismatches.some(m => m.field === 'firstName')).toBe(true);
    });
  });

  describe('NIN Matching', () => {
    test('should fail when NIN does not match', async () => {
      const extractedData: IndividualData = {
        fullName: 'OYENIYI DANIEL ADEMOLA',
        firstName: 'DANIEL ADEMOLA',
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const formData = {
        firstName: 'DANIEL',
        lastName: 'OYENIYI',
        nin: '99999999999', // Different NIN
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(false);
      expect(result.mismatches.some(m => m.field === 'nin')).toBe(true);
    });
  });

  describe('Last Name Matching', () => {
    test('should fail when last name does not match', async () => {
      const extractedData: IndividualData = {
        fullName: 'OYENIYI DANIEL ADEMOLA',
        firstName: 'DANIEL ADEMOLA',
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const formData = {
        firstName: 'DANIEL',
        lastName: 'SMITH', // Different last name
        nin: '12345678901',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(false);
      expect(result.mismatches.some(m => m.field === 'lastName')).toBe(true);
    });
  });

  describe('Gender Matching', () => {
    test('should not fail verification when gender does not match (non-critical)', async () => {
      const extractedData: IndividualData = {
        fullName: 'OYENIYI DANIEL ADEMOLA',
        firstName: 'DANIEL ADEMOLA',
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const formData = {
        firstName: 'DANIEL',
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Female' // Different gender
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      // Gender mismatch is noted but doesn't fail verification
      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true); // Still matches overall
      expect(result.mismatches.some(m => m.field === 'gender')).toBe(true);
      expect(result.mismatches.find(m => m.field === 'gender')?.isCritical).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing form data gracefully', async () => {
      const extractedData: IndividualData = {
        fullName: 'OYENIYI DANIEL ADEMOLA',
        firstName: 'DANIEL ADEMOLA',
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, null);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
      expect(result.mismatches).toHaveLength(0);
    });

    test('should handle whitespace in names', async () => {
      const extractedData: IndividualData = {
        fullName: 'OYENIYI DANIEL ADEMOLA',
        firstName: '  DANIEL ADEMOLA  ', // Extra whitespace
        lastName: '  OYENIYI  ',
        nin: '12345678901',
        gender: 'Male'
      };

      const formData = {
        firstName: 'DANIEL',
        lastName: 'OYENIYI',
        nin: '12345678901',
        gender: 'Male'
      };

      const result = await matcher.verifyIndividualDocument(extractedData, formData);

      expect(result.success).toBe(true);
      expect(result.isMatch).toBe(true);
    });
  });
});
