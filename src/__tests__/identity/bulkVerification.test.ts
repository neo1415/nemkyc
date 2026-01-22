/**
 * Property-Based Tests for Bulk Verification Selectivity
 * 
 * Feature: identity-remediation
 * Property 22: Bulk Verification Selectivity
 * 
 * Tests that bulk verification operations only process entries with status
 * 'pending' or 'link_sent' that have NIN, BVN, or CAC pre-filled, and must
 * skip all entries with status 'verified'.
 * 
 * **Validates: Requirements 19.3, 19.4, 19.5, 19.8, 19.9**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { IdentityEntry, EntryStatus } from '../../types/remediation';

// ========== Test Utilities ==========

/**
 * Determines if an entry should be processed by bulk verification
 */
function shouldProcessEntry(entry: IdentityEntry): boolean {
  // Skip if already verified
  if (entry.status === 'verified') {
    return false;
  }
  
  // Only process pending or link_sent
  if (entry.status !== 'pending' && entry.status !== 'link_sent') {
    return false;
  }
  
  // Must have at least one identity field pre-filled
  const hasNIN = !!(entry.data?.nin || entry.data?.NIN || entry.nin);
  const hasBVN = !!(entry.data?.bvn || entry.data?.BVN || entry.bvn);
  const hasCAC = !!(entry.data?.cac || entry.data?.CAC || entry.cac);
  
  return hasNIN || hasBVN || hasCAC;
}

/**
 * Simulates bulk verification logic
 */
function simulateBulkVerification(entries: IdentityEntry[]): {
  processed: number;
  verified: number;
  failed: number;
  skipped: number;
  processedEntries: string[];
  skippedEntries: string[];
} {
  const results = {
    processed: 0,
    verified: 0,
    failed: 0,
    skipped: 0,
    processedEntries: [] as string[],
    skippedEntries: [] as string[],
  };
  
  for (const entry of entries) {
    if (shouldProcessEntry(entry)) {
      results.processed++;
      results.processedEntries.push(entry.id);
      // Simulate verification (80% success rate)
      if (Math.random() > 0.2) {
        results.verified++;
      } else {
        results.failed++;
      }
    } else {
      results.skipped++;
      results.skippedEntries.push(entry.id);
    }
  }
  
  return results;
}

// ========== Arbitraries ==========

/**
 * Generates a valid entry status
 */
const statusArbitrary = fc.constantFrom<EntryStatus>(
  'pending',
  'link_sent',
  'verified',
  'failed',
  'email_failed'
);

/**
 * Generates an identity entry with controlled properties
 */
const identityEntryArbitrary = fc.record({
  id: fc.uuid(),
  listId: fc.uuid(),
  email: fc.emailAddress(),
  status: statusArbitrary,
  data: fc.record({
    name: fc.option(fc.string(), { nil: undefined }),
    nin: fc.option(fc.stringMatching(/^\d{11}$/), { nil: undefined }),
    NIN: fc.option(fc.stringMatching(/^\d{11}$/), { nil: undefined }),
    bvn: fc.option(fc.stringMatching(/^\d{11}$/), { nil: undefined }),
    BVN: fc.option(fc.stringMatching(/^\d{11}$/), { nil: undefined }),
    cac: fc.option(fc.stringMatching(/^RC\d{6}$/), { nil: undefined }),
    CAC: fc.option(fc.stringMatching(/^RC\d{6}$/), { nil: undefined }),
  }),
  resendCount: fc.nat(10),
  verificationAttempts: fc.nat(5),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}).map(entry => ({
  ...entry,
  nin: entry.data.nin || entry.data.NIN,
  bvn: entry.data.bvn || entry.data.BVN,
  cac: entry.data.cac || entry.data.CAC,
})) as fc.Arbitrary<IdentityEntry>;

/**
 * Generates an entry that should be processed (pending/link_sent with identity data)
 */
const processableEntryArbitrary = fc.record({
  id: fc.uuid(),
  listId: fc.uuid(),
  email: fc.emailAddress(),
  status: fc.constantFrom<EntryStatus>('pending', 'link_sent'),
  data: fc.oneof(
    fc.record({ nin: fc.stringMatching(/^\d{11}$/), name: fc.string() }),
    fc.record({ NIN: fc.stringMatching(/^\d{11}$/), name: fc.string() }),
    fc.record({ bvn: fc.stringMatching(/^\d{11}$/), name: fc.string() }),
    fc.record({ BVN: fc.stringMatching(/^\d{11}$/), name: fc.string() }),
    fc.record({ cac: fc.stringMatching(/^RC\d{6}$/), company: fc.string() }),
    fc.record({ CAC: fc.stringMatching(/^RC\d{6}$/), company: fc.string() })
  ),
  resendCount: fc.nat(10),
  verificationAttempts: fc.nat(5),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<IdentityEntry>;

/**
 * Generates a verified entry (should always be skipped)
 */
const verifiedEntryArbitrary = fc.record({
  id: fc.uuid(),
  listId: fc.uuid(),
  email: fc.emailAddress(),
  status: fc.constant<EntryStatus>('verified'),
  data: fc.record({
    name: fc.string(),
    nin: fc.option(fc.stringMatching(/^\d{11}$/), { nil: undefined }),
  }),
  nin: fc.stringMatching(/^\d{11}$/),
  verifiedAt: fc.date(),
  resendCount: fc.nat(10),
  verificationAttempts: fc.nat(5),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<IdentityEntry>;

/**
 * Generates an entry without identity data (should be skipped)
 */
const noIdentityDataEntryArbitrary = fc.record({
  id: fc.uuid(),
  listId: fc.uuid(),
  email: fc.emailAddress(),
  status: fc.constantFrom<EntryStatus>('pending', 'link_sent'),
  data: fc.record({
    name: fc.string(),
    email: fc.emailAddress(),
    phone: fc.option(fc.string(), { nil: undefined }),
  }),
  resendCount: fc.nat(10),
  verificationAttempts: fc.nat(5),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<IdentityEntry>;

// ========== Property Tests ==========

describe('Feature: identity-remediation, Property 22: Bulk Verification Selectivity', () => {
  describe('Property: Verified entries must always be skipped', () => {
    it('should skip all entries with status "verified" regardless of identity data', () => {
      fc.assert(
        fc.property(
          fc.array(verifiedEntryArbitrary, { minLength: 1, maxLength: 50 }),
          (verifiedEntries) => {
            const results = simulateBulkVerification(verifiedEntries);
            
            // All verified entries must be skipped
            expect(results.processed).toBe(0);
            expect(results.skipped).toBe(verifiedEntries.length);
            expect(results.processedEntries).toHaveLength(0);
            expect(results.skippedEntries).toHaveLength(verifiedEntries.length);
            
            // Verify each entry was correctly identified as skippable
            for (const entry of verifiedEntries) {
              expect(shouldProcessEntry(entry)).toBe(false);
              expect(results.skippedEntries).toContain(entry.id);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Only pending or link_sent entries should be processed', () => {
    it('should only process entries with status "pending" or "link_sent"', () => {
      fc.assert(
        fc.property(
          fc.array(identityEntryArbitrary, { minLength: 10, maxLength: 100 }),
          (entries) => {
            const results = simulateBulkVerification(entries);
            
            // Count entries that should be processed
            const expectedProcessable = entries.filter(e => 
              (e.status === 'pending' || e.status === 'link_sent') &&
              (e.data?.nin || e.data?.NIN || e.nin || 
               e.data?.bvn || e.data?.BVN || e.bvn ||
               e.data?.cac || e.data?.CAC || e.cac)
            );
            
            // Processed count should match expected
            expect(results.processed).toBe(expectedProcessable.length);
            
            // All processed entries must have correct status
            for (const entryId of results.processedEntries) {
              const entry = entries.find(e => e.id === entryId);
              expect(entry).toBeDefined();
              expect(['pending', 'link_sent']).toContain(entry!.status);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Entries must have identity data to be processed', () => {
    it('should skip entries without NIN, BVN, or CAC pre-filled', () => {
      fc.assert(
        fc.property(
          fc.array(noIdentityDataEntryArbitrary, { minLength: 1, maxLength: 50 }),
          (entriesWithoutIdentity) => {
            const results = simulateBulkVerification(entriesWithoutIdentity);
            
            // All entries without identity data must be skipped
            expect(results.processed).toBe(0);
            expect(results.skipped).toBe(entriesWithoutIdentity.length);
            
            // Verify each entry was correctly identified as not processable
            for (const entry of entriesWithoutIdentity) {
              expect(shouldProcessEntry(entry)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should process entries that have at least one identity field', () => {
      fc.assert(
        fc.property(
          fc.array(processableEntryArbitrary, { minLength: 1, maxLength: 50 }),
          (processableEntries) => {
            const results = simulateBulkVerification(processableEntries);
            
            // All processable entries should be processed
            expect(results.processed).toBe(processableEntries.length);
            expect(results.skipped).toBe(0);
            
            // Verify each entry was correctly identified as processable
            for (const entry of processableEntries) {
              expect(shouldProcessEntry(entry)).toBe(true);
              expect(results.processedEntries).toContain(entry.id);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Mixed entry lists should be correctly partitioned', () => {
    it('should correctly partition entries into processed and skipped', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.array(processableEntryArbitrary, { minLength: 1, maxLength: 20 }),
            fc.array(verifiedEntryArbitrary, { minLength: 1, maxLength: 20 }),
            fc.array(noIdentityDataEntryArbitrary, { minLength: 1, maxLength: 20 })
          ),
          ([processable, verified, noIdentity]) => {
            const allEntries = [...processable, ...verified, ...noIdentity];
            const results = simulateBulkVerification(allEntries);
            
            // Total should equal all entries
            expect(results.processed + results.skipped).toBe(allEntries.length);
            
            // Processed should equal processable entries
            expect(results.processed).toBe(processable.length);
            
            // Skipped should equal verified + no identity
            expect(results.skipped).toBe(verified.length + noIdentity.length);
            
            // No overlap between processed and skipped
            const processedSet = new Set(results.processedEntries);
            const skippedSet = new Set(results.skippedEntries);
            
            for (const id of processedSet) {
              expect(skippedSet.has(id)).toBe(false);
            }
            
            // All verified entries must be in skipped
            for (const entry of verified) {
              expect(results.skippedEntries).toContain(entry.id);
            }
            
            // All processable entries must be in processed
            for (const entry of processable) {
              expect(results.processedEntries).toContain(entry.id);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Verification results must be consistent', () => {
    it('should ensure verified + failed equals processed', () => {
      fc.assert(
        fc.property(
          fc.array(identityEntryArbitrary, { minLength: 10, maxLength: 100 }),
          (entries) => {
            const results = simulateBulkVerification(entries);
            
            // Verified + failed must equal processed
            expect(results.verified + results.failed).toBe(results.processed);
            
            // All counts must be non-negative
            expect(results.processed).toBeGreaterThanOrEqual(0);
            expect(results.verified).toBeGreaterThanOrEqual(0);
            expect(results.failed).toBeGreaterThanOrEqual(0);
            expect(results.skipped).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Status-based filtering', () => {
    it('should never process entries with status "failed" or "email_failed"', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              listId: fc.uuid(),
              email: fc.emailAddress(),
              status: fc.constantFrom<EntryStatus>('failed', 'email_failed'),
              data: fc.record({
                nin: fc.stringMatching(/^\d{11}$/),
                name: fc.string(),
              }),
              resendCount: fc.nat(10),
              verificationAttempts: fc.nat(5),
              createdAt: fc.date(),
              updatedAt: fc.date(),
            }) as fc.Arbitrary<IdentityEntry>,
            { minLength: 1, maxLength: 50 }
          ),
          (failedEntries) => {
            const results = simulateBulkVerification(failedEntries);
            
            // No failed/email_failed entries should be processed
            expect(results.processed).toBe(0);
            expect(results.skipped).toBe(failedEntries.length);
            
            for (const entry of failedEntries) {
              expect(shouldProcessEntry(entry)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Identity field detection', () => {
    it('should detect identity fields in both data object and top-level', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.uuid(),
            fc.uuid(),
            fc.emailAddress(),
            fc.stringMatching(/^\d{11}$/),
            fc.boolean()
          ),
          ([id, listId, email, identityNumber, useDataObject]) => {
            const entry: IdentityEntry = {
              id,
              listId,
              email,
              status: 'pending',
              data: useDataObject ? { nin: identityNumber } : {},
              nin: useDataObject ? undefined : identityNumber,
              resendCount: 0,
              verificationAttempts: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            // Should be processable regardless of where identity field is
            expect(shouldProcessEntry(entry)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle case-insensitive identity field names', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.uuid(),
            fc.uuid(),
            fc.emailAddress(),
            fc.stringMatching(/^\d{11}$/),
            fc.constantFrom('nin', 'NIN', 'bvn', 'BVN', 'cac', 'CAC')
          ),
          ([id, listId, email, identityNumber, fieldName]) => {
            const entry: IdentityEntry = {
              id,
              listId,
              email,
              status: 'pending',
              data: { [fieldName]: identityNumber },
              resendCount: 0,
              verificationAttempts: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            // Should be processable with any case variation
            expect(shouldProcessEntry(entry)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty entry list', () => {
      const results = simulateBulkVerification([]);
      
      expect(results.processed).toBe(0);
      expect(results.verified).toBe(0);
      expect(results.failed).toBe(0);
      expect(results.skipped).toBe(0);
      expect(results.processedEntries).toHaveLength(0);
      expect(results.skippedEntries).toHaveLength(0);
    });

    it('should handle entry with multiple identity fields', () => {
      const entry: IdentityEntry = {
        id: 'test-1',
        listId: 'list-1',
        email: 'test@example.com',
        status: 'pending',
        data: {
          nin: '12345678901',
          bvn: '98765432109',
          cac: 'RC123456',
        },
        resendCount: 0,
        verificationAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Should be processable if any identity field exists
      expect(shouldProcessEntry(entry)).toBe(true);
    });

    it('should handle entry with empty string identity fields', () => {
      const entry: IdentityEntry = {
        id: 'test-1',
        listId: 'list-1',
        email: 'test@example.com',
        status: 'pending',
        data: {
          nin: '',
          bvn: '',
          cac: '',
        },
        resendCount: 0,
        verificationAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Empty strings should not count as having identity data
      expect(shouldProcessEntry(entry)).toBe(false);
    });

    it('should handle entry with null identity fields', () => {
      const entry: IdentityEntry = {
        id: 'test-1',
        listId: 'list-1',
        email: 'test@example.com',
        status: 'pending',
        data: {
          nin: null,
          bvn: null,
          cac: null,
        },
        resendCount: 0,
        verificationAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Null values should not count as having identity data
      expect(shouldProcessEntry(entry)).toBe(false);
    });
  });
});
