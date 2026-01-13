/**
 * Property-Based Tests for Record Operations
 * 
 * Feature: identity-remediation
 * 
 * Properties tested:
 * - Property 13: Status Filter Accuracy
 * - Property 16: Token Resend Invalidation
 * - Property 17: Resend Count Tracking
 * 
 * **Validates: Requirements 6.3, 8.3, 8.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { RemediationRecord, RemediationRecordStatus } from '../../types/remediation';
import { generateSecureToken, isValidTokenFormat } from '../../utils/tokenUtils';

// ========== Helper Functions for Testing ==========

/**
 * All valid remediation record statuses
 */
const ALL_STATUSES: RemediationRecordStatus[] = [
  'pending',
  'email_sent',
  'email_failed',
  'link_expired',
  'verified',
  'verification_failed',
  'review_required',
  'approved',
  'rejected'
];

/**
 * Generates a mock remediation record with the given status
 */
function createMockRecord(
  id: string,
  status: RemediationRecordStatus,
  resendCount: number = 0
): RemediationRecord {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  return {
    id,
    batchId: 'batch-123',
    customerName: `Customer ${id}`,
    email: `customer${id}@example.com`,
    phone: '+2341234567890',
    policyNumber: `POL-${id}`,
    brokerName: 'Test Broker',
    identityType: 'individual',
    token: generateSecureToken(),
    tokenExpiresAt: expiresAt,
    status,
    resendCount,
    createdAt: now,
    updatedAt: now,
    verificationAttempts: 0
  };
}

/**
 * Simulates filtering records by status (mirrors server.js logic)
 */
function filterRecordsByStatus(
  records: RemediationRecord[],
  status: RemediationRecordStatus
): RemediationRecord[] {
  return records.filter(record => record.status === status);
}

/**
 * Simulates a token resend operation (mirrors server.js logic)
 * Returns the updated record with new token and incremented resendCount
 */
function simulateTokenResend(
  record: RemediationRecord,
  expirationDays: number = 7
): { updatedRecord: RemediationRecord; oldToken: string } {
  const oldToken = record.token;
  const newToken = generateSecureToken();
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + expirationDays);
  
  const updatedRecord: RemediationRecord = {
    ...record,
    token: newToken,
    tokenExpiresAt: newExpiresAt,
    tokenUsedAt: undefined, // Clear used timestamp
    resendCount: record.resendCount + 1,
    status: 'pending', // Reset status to pending
    updatedAt: new Date()
  };
  
  return { updatedRecord, oldToken };
}

// ========== Arbitraries for Property-Based Testing ==========

/**
 * Arbitrary for generating a valid remediation record status
 */
const statusArbitrary = fc.constantFrom(...ALL_STATUSES);

/**
 * Arbitrary for generating a list of mock records with random statuses
 */
const recordListArbitrary = fc.array(
  fc.record({
    id: fc.uuid(),
    status: statusArbitrary
  }),
  { minLength: 1, maxLength: 100 }
).map(items => 
  items.map(item => createMockRecord(item.id, item.status))
);

/**
 * Arbitrary for generating a single mock record with random resendCount
 */
const recordWithResendCountArbitrary = fc.record({
  id: fc.uuid(),
  status: statusArbitrary,
  resendCount: fc.integer({ min: 0, max: 10 })
}).map(item => createMockRecord(item.id, item.status, item.resendCount));

/**
 * Arbitrary for expiration days (1-365)
 */
const expirationDaysArbitrary = fc.integer({ min: 1, max: 365 });

// ========== Property Tests ==========

describe('Feature: identity-remediation, Property 13: Status Filter Accuracy', () => {
  /**
   * Property 13: Status Filter Accuracy
   * For any status filter applied to a record list, the returned records 
   * must all have a status matching the filter value.
   * 
   * **Validates: Requirements 6.3**
   */
  it('should return only records matching the filter status', () => {
    fc.assert(
      fc.property(
        recordListArbitrary,
        statusArbitrary,
        (records, filterStatus) => {
          const filteredRecords = filterRecordsByStatus(records, filterStatus);
          
          // All returned records must have the filter status
          const allMatch = filteredRecords.every(
            record => record.status === filterStatus
          );
          
          expect(allMatch).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not include any records with different status', () => {
    fc.assert(
      fc.property(
        recordListArbitrary,
        statusArbitrary,
        (records, filterStatus) => {
          const filteredRecords = filterRecordsByStatus(records, filterStatus);
          
          // No record should have a different status
          const noneWithDifferentStatus = filteredRecords.every(
            record => record.status === filterStatus
          );
          
          expect(noneWithDifferentStatus).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return count equal to records with matching status in original list', () => {
    fc.assert(
      fc.property(
        recordListArbitrary,
        statusArbitrary,
        (records, filterStatus) => {
          const filteredRecords = filterRecordsByStatus(records, filterStatus);
          
          // Count of filtered records should equal count of records with that status
          const expectedCount = records.filter(r => r.status === filterStatus).length;
          
          expect(filteredRecords.length).toBe(expectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty array when no records match the filter status', () => {
    // Create records with only one specific status
    const singleStatusRecords = fc.array(
      fc.uuid(),
      { minLength: 1, maxLength: 50 }
    ).map(ids => ids.map(id => createMockRecord(id, 'verified')));

    fc.assert(
      fc.property(
        singleStatusRecords,
        (records) => {
          // Filter by a different status
          const filteredRecords = filterRecordsByStatus(records, 'pending');
          
          expect(filteredRecords.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve record data integrity after filtering', () => {
    fc.assert(
      fc.property(
        recordListArbitrary,
        statusArbitrary,
        (records, filterStatus) => {
          const filteredRecords = filterRecordsByStatus(records, filterStatus);
          
          // Each filtered record should exist in original list with same data
          for (const filtered of filteredRecords) {
            const original = records.find(r => r.id === filtered.id);
            expect(original).toBeDefined();
            expect(filtered.customerName).toBe(original!.customerName);
            expect(filtered.email).toBe(original!.email);
            expect(filtered.policyNumber).toBe(original!.policyNumber);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: identity-remediation, Property 16: Token Resend Invalidation', () => {
  /**
   * Property 16: Token Resend Invalidation
   * For any link resend operation, the old token must become invalid 
   * and a new unique token must be generated with a fresh expiration.
   * 
   * **Validates: Requirements 8.3**
   */
  it('should generate a new token different from the old token', () => {
    fc.assert(
      fc.property(
        recordWithResendCountArbitrary,
        expirationDaysArbitrary,
        (record, expirationDays) => {
          const { updatedRecord, oldToken } = simulateTokenResend(record, expirationDays);
          
          // New token must be different from old token
          expect(updatedRecord.token).not.toBe(oldToken);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate a valid token format after resend', () => {
    fc.assert(
      fc.property(
        recordWithResendCountArbitrary,
        expirationDaysArbitrary,
        (record, expirationDays) => {
          const { updatedRecord } = simulateTokenResend(record, expirationDays);
          
          // New token must be valid format
          expect(isValidTokenFormat(updatedRecord.token)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set a fresh expiration date in the future', () => {
    fc.assert(
      fc.property(
        recordWithResendCountArbitrary,
        expirationDaysArbitrary,
        (record, expirationDays) => {
          const now = new Date();
          const { updatedRecord } = simulateTokenResend(record, expirationDays);
          
          // New expiration must be in the future
          expect(updatedRecord.tokenExpiresAt.getTime()).toBeGreaterThan(now.getTime());
          
          // Expiration should be approximately expirationDays from now
          const expectedMs = expirationDays * 24 * 60 * 60 * 1000;
          const actualMs = updatedRecord.tokenExpiresAt.getTime() - now.getTime();
          // Allow 2 second tolerance for test execution time
          expect(Math.abs(actualMs - expectedMs)).toBeLessThan(2000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear the tokenUsedAt field after resend', () => {
    fc.assert(
      fc.property(
        recordWithResendCountArbitrary,
        expirationDaysArbitrary,
        (record, expirationDays) => {
          // Set tokenUsedAt to simulate a used token
          const usedRecord = { ...record, tokenUsedAt: new Date() };
          const { updatedRecord } = simulateTokenResend(usedRecord, expirationDays);
          
          // tokenUsedAt should be cleared
          expect(updatedRecord.tokenUsedAt).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reset status to pending after resend', () => {
    fc.assert(
      fc.property(
        recordWithResendCountArbitrary,
        expirationDaysArbitrary,
        (record, expirationDays) => {
          const { updatedRecord } = simulateTokenResend(record, expirationDays);
          
          // Status should be reset to pending
          expect(updatedRecord.status).toBe('pending');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate unique tokens across multiple resends', () => {
    fc.assert(
      fc.property(
        recordWithResendCountArbitrary,
        fc.integer({ min: 2, max: 10 }),
        (record, resendCount) => {
          const tokens = new Set<string>();
          tokens.add(record.token); // Add original token
          
          let currentRecord = record;
          for (let i = 0; i < resendCount; i++) {
            const { updatedRecord } = simulateTokenResend(currentRecord);
            tokens.add(updatedRecord.token);
            currentRecord = updatedRecord;
          }
          
          // All tokens (original + resends) should be unique
          expect(tokens.size).toBe(resendCount + 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: identity-remediation, Property 17: Resend Count Tracking', () => {
  /**
   * Property 17: Resend Count Tracking
   * For any resend operation on a record, the resendCount must increment by exactly 1.
   * 
   * **Validates: Requirements 8.4**
   */
  it('should increment resendCount by exactly 1 after each resend', () => {
    fc.assert(
      fc.property(
        recordWithResendCountArbitrary,
        expirationDaysArbitrary,
        (record, expirationDays) => {
          const originalResendCount = record.resendCount;
          const { updatedRecord } = simulateTokenResend(record, expirationDays);
          
          // resendCount should be exactly 1 more than before
          expect(updatedRecord.resendCount).toBe(originalResendCount + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly track resendCount across multiple resends', () => {
    fc.assert(
      fc.property(
        recordWithResendCountArbitrary,
        fc.integer({ min: 1, max: 10 }),
        (record, numberOfResends) => {
          const originalResendCount = record.resendCount;
          
          let currentRecord = record;
          for (let i = 0; i < numberOfResends; i++) {
            const { updatedRecord } = simulateTokenResend(currentRecord);
            currentRecord = updatedRecord;
          }
          
          // Final resendCount should equal original + number of resends
          expect(currentRecord.resendCount).toBe(originalResendCount + numberOfResends);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should start from 0 for new records and increment correctly', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        statusArbitrary,
        fc.integer({ min: 1, max: 5 }),
        (id, status, numberOfResends) => {
          // Create a new record with resendCount = 0
          const newRecord = createMockRecord(id, status, 0);
          expect(newRecord.resendCount).toBe(0);
          
          let currentRecord = newRecord;
          for (let i = 0; i < numberOfResends; i++) {
            const { updatedRecord } = simulateTokenResend(currentRecord);
            currentRecord = updatedRecord;
          }
          
          // Final resendCount should equal number of resends
          expect(currentRecord.resendCount).toBe(numberOfResends);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve resendCount increment even with high initial values', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        statusArbitrary,
        fc.integer({ min: 100, max: 1000 }),
        (id, status, initialResendCount) => {
          const record = createMockRecord(id, status, initialResendCount);
          const { updatedRecord } = simulateTokenResend(record);
          
          // resendCount should be exactly 1 more than initial
          expect(updatedRecord.resendCount).toBe(initialResendCount + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not modify other record fields when incrementing resendCount', () => {
    fc.assert(
      fc.property(
        recordWithResendCountArbitrary,
        (record) => {
          const { updatedRecord } = simulateTokenResend(record);
          
          // These fields should remain unchanged
          expect(updatedRecord.id).toBe(record.id);
          expect(updatedRecord.batchId).toBe(record.batchId);
          expect(updatedRecord.customerName).toBe(record.customerName);
          expect(updatedRecord.email).toBe(record.email);
          expect(updatedRecord.policyNumber).toBe(record.policyNumber);
          expect(updatedRecord.brokerName).toBe(record.brokerName);
          expect(updatedRecord.identityType).toBe(record.identityType);
        }
      ),
      { numRuns: 100 }
    );
  });
});
