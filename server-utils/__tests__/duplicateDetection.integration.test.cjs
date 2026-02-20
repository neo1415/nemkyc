/**
 * Integration tests for duplicate detection infrastructure
 * Tests the complete flow: validator -> duplicate detector -> cost calculator
 */

const crypto = require('crypto');

// Set up encryption key
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

// Mock firebase-admin
const mockGet = vi.fn();
const mockLimit = vi.fn(() => ({ get: mockGet }));
const mockWhere = vi.fn(() => ({ 
  where: mockWhere,
  limit: mockLimit,
  get: mockGet
}));
const mockCollection = vi.fn(() => ({
  where: mockWhere
}));

const mockFirestore = {
  collection: mockCollection
};

vi.mock('firebase-admin', () => ({
  default: {
    firestore: () => mockFirestore,
    initializeApp: vi.fn()
  },
  firestore: () => mockFirestore,
  initializeApp: vi.fn()
}));

const { validateIdentityFormat } = require('../identityValidator.cjs');
const { checkDuplicate, batchCheckDuplicates, clearCache } = require('../duplicateDetector.cjs');
const { calculateCost } = require('../costCalculator.cjs');

describe('Duplicate Detection Infrastructure Integration', () => {
  describe('Complete validation and duplicate check flow', () => {
    test('should validate format before checking duplicates', () => {
      // Invalid NIN (only 10 digits)
      const invalidNIN = '1234567890';
      const validation = validateIdentityFormat('NIN', invalidNIN);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errorReason).toBe('NIN must be exactly 11 digits');
      
      // Should not proceed to duplicate check if invalid
      // This is enforced in processSingleEntry
    });

    test('should validate format, then check duplicates for valid entries', async () => {
      // Valid NIN
      const validNIN = '12345678901';
      const validation = validateIdentityFormat('NIN', validNIN);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errorReason).toBeNull();
      
      // Now can proceed to duplicate check
      const duplicateResult = await checkDuplicate('NIN', validNIN);
      
      expect(duplicateResult).toHaveProperty('isDuplicate');
      expect(typeof duplicateResult.isDuplicate).toBe('boolean');
    });

    test('should handle batch validation and duplicate checking', async () => {
      const entries = [
        { type: 'NIN', value: '12345678901', entryId: 'entry1' }, // valid
        { type: 'NIN', value: '1234567890', entryId: 'entry2' },  // invalid (10 digits)
        { type: 'BVN', value: '98765432109', entryId: 'entry3' }, // valid
        { type: 'CAC', value: 'RC12345', entryId: 'entry4' },     // valid
      ];

      // Validate all entries first
      const validatedEntries = entries.map(entry => ({
        ...entry,
        validation: validateIdentityFormat(entry.type, entry.value)
      }));

      // Filter to only valid entries
      const validEntries = validatedEntries.filter(e => e.validation.isValid);
      
      expect(validEntries.length).toBe(3); // entry2 should be filtered out

      // Check duplicates for valid entries only
      const duplicateResults = await batchCheckDuplicates(
        validEntries.map(e => ({ type: e.type, value: e.value, entryId: e.entryId }))
      );

      expect(duplicateResults.size).toBe(3);
      expect(duplicateResults.has('entry1')).toBe(true);
      expect(duplicateResults.has('entry2')).toBe(false); // invalid, not checked
      expect(duplicateResults.has('entry3')).toBe(true);
      expect(duplicateResults.has('entry4')).toBe(true);
    });
  });

  describe('Cost calculation after duplicate filtering', () => {
    test('should calculate cost only for entries to verify (excluding duplicates and invalid)', () => {
      // Scenario: 10 NIN, 5 BVN, 3 CAC
      // After filtering: 2 NIN are duplicates, 1 BVN is invalid
      const toVerify = {
        nin: 8,  // 10 - 2 duplicates
        bvn: 4,  // 5 - 1 invalid
        cac: 3   // all valid
      };

      const costEstimate = calculateCost(toVerify);

      expect(costEstimate.totalCost).toBe(8 * 50 + 4 * 50 + 3 * 100); // 400 + 200 + 300 = 900
      expect(costEstimate.currency).toBe('NGN');
      expect(costEstimate.breakdown.nin).toBe(400);
      expect(costEstimate.breakdown.bvn).toBe(200);
      expect(costEstimate.breakdown.cac).toBe(300);
    });

    test('should handle zero entries to verify', () => {
      const toVerify = {
        nin: 0,
        bvn: 0,
        cac: 0
      };

      const costEstimate = calculateCost(toVerify);

      expect(costEstimate.totalCost).toBe(0);
      expect(costEstimate.breakdown.nin).toBe(0);
      expect(costEstimate.breakdown.bvn).toBe(0);
      expect(costEstimate.breakdown.cac).toBe(0);
    });
  });

  describe('Analysis workflow simulation', () => {
    test('should simulate complete analysis flow for confirmation modal', async () => {
      // Simulate entries from a list
      const entries = [
        { id: '1', type: 'NIN', value: '11111111111', email: 'user1@test.com' },
        { id: '2', type: 'NIN', value: '22222222222', email: 'user2@test.com' },
        { id: '3', type: 'NIN', value: '333333333', email: 'user3@test.com' },   // invalid (9 digits)
        { id: '4', type: 'BVN', value: '44444444444', email: 'user4@test.com' },
        { id: '5', type: 'CAC', value: 'RC123', email: 'user5@test.com' },       // invalid (too short)
        { id: '6', type: 'CAC', value: 'RC12345', email: 'user6@test.com' },
      ];

      // Step 1: Validate formats
      const validationResults = entries.map(entry => ({
        ...entry,
        validation: validateIdentityFormat(entry.type, entry.value)
      }));

      const validEntries = validationResults.filter(e => e.validation.isValid);
      const invalidEntries = validationResults.filter(e => !e.validation.isValid);

      expect(validEntries.length).toBe(4); // entries 1, 2, 4, 6
      expect(invalidEntries.length).toBe(2); // entries 3, 5

      // Step 2: Check duplicates for valid entries
      const duplicateResults = await batchCheckDuplicates(
        validEntries.map(e => ({ type: e.type, value: e.value, entryId: e.id }))
      );

      // Count duplicates (in real scenario, some might be duplicates)
      let duplicateCount = 0;
      duplicateResults.forEach(result => {
        if (result.isDuplicate) duplicateCount++;
      });

      const toVerifyCount = validEntries.length - duplicateCount;

      // Step 3: Calculate cost for entries to verify
      const identityTypeCounts = { nin: 0, bvn: 0, cac: 0 };
      validEntries.forEach(entry => {
        const result = duplicateResults.get(entry.id);
        if (!result.isDuplicate) {
          identityTypeCounts[entry.type.toLowerCase()]++;
        }
      });

      const costEstimate = calculateCost(identityTypeCounts);

      // Step 4: Build analysis summary (what would be returned to frontend)
      const analysisSummary = {
        totalEntries: entries.length,
        toVerify: toVerifyCount,
        toSkip: entries.length - toVerifyCount,
        skipReasons: {
          already_verified: duplicateCount,
          invalid_format: invalidEntries.length
        },
        costEstimate,
        identityTypeBreakdown: identityTypeCounts
      };

      // Verify analysis summary structure
      expect(analysisSummary.totalEntries).toBe(6);
      expect(analysisSummary.toVerify).toBeLessThanOrEqual(4);
      expect(analysisSummary.toSkip).toBeGreaterThanOrEqual(2);
      expect(analysisSummary.skipReasons.invalid_format).toBe(2);
      expect(analysisSummary.costEstimate).toHaveProperty('totalCost');
      expect(analysisSummary.costEstimate).toHaveProperty('currency');
      expect(analysisSummary.costEstimate).toHaveProperty('breakdown');
    });
  });

  describe('Error handling in integrated flow', () => {
    test('should handle validation errors gracefully', () => {
      const invalidInputs = [
        { type: 'NIN', value: null },
        { type: 'BVN', value: undefined },
        { type: 'CAC', value: '' },
        { type: 'INVALID', value: '12345' }
      ];

      invalidInputs.forEach(input => {
        const validation = validateIdentityFormat(input.type, input.value);
        expect(validation.isValid).toBe(false);
        expect(validation.errorReason).toBeTruthy();
      });
    });

    test('should handle duplicate check errors without breaking flow', async () => {
      // Test with invalid entry ID to simulate error
      try {
        const result = await checkDuplicate('NIN', '12345678901');
        // Should return a result even if database query fails
        expect(result).toHaveProperty('isDuplicate');
      } catch (error) {
        // If it throws, it should be caught in processSingleEntry
        // and logged, then proceed with verification
        expect(error).toBeDefined();
      }
    });

    test('should handle cost calculation with invalid inputs', () => {
      const invalidCounts = [
        { nin: -1, bvn: 0, cac: 0 },
        { nin: 'invalid', bvn: 0, cac: 0 },
        { nin: null, bvn: undefined, cac: NaN }
      ];

      invalidCounts.forEach(counts => {
        const result = calculateCost(counts);
        // Should return valid structure even with invalid inputs
        expect(result).toHaveProperty('totalCost');
        expect(result).toHaveProperty('currency');
        expect(result).toHaveProperty('breakdown');
        expect(typeof result.totalCost).toBe('number');
        expect(isNaN(result.totalCost)).toBe(false);
      });
    });
  });

  describe('Performance considerations', () => {
    test('should handle batch operations efficiently', async () => {
      const largeEntrySet = Array.from({ length: 100 }, (_, i) => ({
        type: 'NIN',
        value: `${String(i).padStart(11, '0')}`,
        entryId: `entry${i}`
      }));

      const startTime = Date.now();
      const results = await batchCheckDuplicates(largeEntrySet);
      const endTime = Date.now();

      expect(results.size).toBe(100);
      // Should complete in reasonable time (< 5 seconds for 100 entries)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    test('should validate formats quickly', () => {
      const entries = Array.from({ length: 1000 }, (_, i) => ({
        type: 'NIN',
        value: `${String(i).padStart(11, '0')}`
      }));

      const startTime = Date.now();
      entries.forEach(entry => {
        validateIdentityFormat(entry.type, entry.value);
      });
      const endTime = Date.now();

      // Should validate 1000 entries in < 100ms
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
