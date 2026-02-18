/**
 * Property-Based Tests for API Usage Tracker
 * 
 * Tests universal correctness properties for cost calculation and broker lookup
 */

const fc = require('fast-check');
const { calculateCost, lookupBrokerInfo } = require('../apiUsageTracker.cjs');

describe('API Usage Tracker - Property Tests', () => {
  describe('Property 5: Datapro Success Cost', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     * 
     * Property: All successful Datapro API calls must cost exactly ₦50
     */
    it('should always return ₦50 for successful Datapro calls', () => {
      fc.assert(
        fc.property(
          fc.constant('datapro'),
          fc.constant(true),
          (provider, success) => {
            const cost = calculateCost(provider, success);
            return cost === 50;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: VerifyData Success Cost', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3**
     * 
     * Property: All successful VerifyData API calls must cost exactly ₦100
     */
    it('should always return ₦100 for successful VerifyData calls', () => {
      fc.assert(
        fc.property(
          fc.constant('verifydata'),
          fc.constant(true),
          (provider, success) => {
            const cost = calculateCost(provider, success);
            return cost === 100;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Failed Verification Cost', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
     * 
     * Property: All failed API calls must cost ₦0 regardless of provider
     */
    it('should always return ₦0 for failed calls regardless of provider', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.constant('datapro'), fc.constant('verifydata'), fc.string()),
          fc.constant(false),
          (provider, success) => {
            const cost = calculateCost(provider, success);
            return cost === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Broker Attribution Data Presence', () => {
    /**
     * **Validates: Requirements 4.2, 4.3**
     * 
     * Property: lookupBrokerInfo must always return an object with userId, userName, and userEmail fields
     */
    it('should always return an object with required fields', async () => {
      // Create a simple mock db that returns non-existent documents
      const createMockDb = () => ({
        collection: function() { return this; },
        doc: function() { return this; },
        get: async function() { return { exists: false }; }
      });

      await fc.assert(
        fc.asyncProperty(
          fc.oneof(fc.string(), fc.constant(null), fc.constant(undefined)),
          async (listId) => {
            const mockDb = createMockDb();
            const result = await lookupBrokerInfo(mockDb, listId);
            
            // Must have all required fields
            const hasUserId = typeof result.userId === 'string';
            const hasUserName = typeof result.userName === 'string';
            const hasUserEmail = typeof result.userEmail === 'string';
            
            return hasUserId && hasUserName && hasUserEmail;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return "unknown" values when listId is missing or invalid', async () => {
      const createMockDb = () => ({
        collection: function() { return this; },
        doc: function() { return this; },
        get: async function() { return { exists: false }; }
      });

      await fc.assert(
        fc.asyncProperty(
          fc.oneof(fc.constant(null), fc.constant(undefined), fc.constant('')),
          async (listId) => {
            const mockDb = createMockDb();
            const result = await lookupBrokerInfo(mockDb, listId);
            
            return (
              result.userId === 'unknown' &&
              result.userName === 'Unknown User' &&
              result.userEmail === 'unknown'
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
