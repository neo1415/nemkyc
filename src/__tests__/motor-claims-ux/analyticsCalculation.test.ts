/**
 * Property-Based Tests for Analytics Calculation
 * 
 * Feature: motor-claims-ux-improvements
 * Property 15: Analytics Calculation Correctness
 * 
 * **Validates: Requirements 11.2, 11.3, 11.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getUserAnalytics, SubmissionCard } from '../../services/userSubmissionsService';

// KYC collections for testing
const KYC_COLLECTIONS = [
  'Individual-kyc-form',
  'corporate-kyc-form',
  'individual-kyc',
  'corporate-kyc',
  'brokers-kyc',
  'agents-kyc',
  'partners-kyc'
];

// Claims collections for testing
const CLAIMS_COLLECTIONS = [
  'motor-claims',
  'fire-claims',
  'burglary-claims',
  'all-risk-claims',
  'goods-in-transit-claims',
  'money-insurance-claims',
  'public-liability-claims',
  'employers-liability-claims',
  'group-personal-accident-claims',
  'fidelity-guarantee-claims',
  'rent-assurance-claims',
  'contractors-plant-machinery-claims',
  'combined-gpa-employers-liability-claims',
  'professional-indemnity'
];

// Arbitrary for generating submission cards
const submissionCardArbitrary = fc.record({
  id: fc.uuid(),
  ticketId: fc.stringMatching(/^[A-Z]{3}-\d{8}$/),
  formType: fc.string({ minLength: 5, maxLength: 50 }),
  submittedAt: fc.date(),
  status: fc.constantFrom('processing', 'approved', 'rejected', 'pending'),
  collection: fc.constantFrom(...KYC_COLLECTIONS, ...CLAIMS_COLLECTIONS)
}) as fc.Arbitrary<SubmissionCard>;

describe('Feature: motor-claims-ux-improvements, Property 15: Analytics Calculation Correctness', () => {
  /**
   * Property: Total Submissions Equals Sum of Categories
   * For any user's analytics display, the following SHALL hold:
   * Total submissions = KYC forms count + Claims forms count
   * 
   * **Validates: Requirements 11.2, 11.3**
   */
  it('should have total submissions equal to sum of KYC and Claims forms', () => {
    fc.assert(
      fc.property(
        fc.array(submissionCardArbitrary, { minLength: 0, maxLength: 100 }),
        (submissions) => {
          const analytics = getUserAnalytics(submissions);
          
          // Total submissions should equal KYC + Claims
          expect(analytics.totalSubmissions).toBe(analytics.kycForms + analytics.claimForms);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Total Submissions Equals Sum of Statuses
   * For any user's analytics display, the following SHALL hold:
   * Total submissions = Pending count + Approved count + Rejected count
   * 
   * **Validates: Requirements 11.4**
   */
  it('should have total submissions equal to sum of status counts', () => {
    fc.assert(
      fc.property(
        fc.array(submissionCardArbitrary, { minLength: 0, maxLength: 100 }),
        (submissions) => {
          const analytics = getUserAnalytics(submissions);
          
          // Total submissions should equal sum of all statuses
          expect(analytics.totalSubmissions).toBe(
            analytics.pendingCount + analytics.approvedCount + analytics.rejectedCount
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All Counts Are Non-Negative Integers
   * For any user's analytics display, each count SHALL be a non-negative integer
   * 
   * **Validates: Requirements 11.2, 11.3, 11.4**
   */
  it('should have all counts as non-negative integers', () => {
    fc.assert(
      fc.property(
        fc.array(submissionCardArbitrary, { minLength: 0, maxLength: 100 }),
        (submissions) => {
          const analytics = getUserAnalytics(submissions);
          
          // All counts should be non-negative integers
          expect(analytics.totalSubmissions).toBeGreaterThanOrEqual(0);
          expect(analytics.kycForms).toBeGreaterThanOrEqual(0);
          expect(analytics.claimForms).toBeGreaterThanOrEqual(0);
          expect(analytics.pendingCount).toBeGreaterThanOrEqual(0);
          expect(analytics.approvedCount).toBeGreaterThanOrEqual(0);
          expect(analytics.rejectedCount).toBeGreaterThanOrEqual(0);
          
          // All counts should be integers
          expect(Number.isInteger(analytics.totalSubmissions)).toBe(true);
          expect(Number.isInteger(analytics.kycForms)).toBe(true);
          expect(Number.isInteger(analytics.claimForms)).toBe(true);
          expect(Number.isInteger(analytics.pendingCount)).toBe(true);
          expect(Number.isInteger(analytics.approvedCount)).toBe(true);
          expect(Number.isInteger(analytics.rejectedCount)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty Submissions Produce Zero Analytics
   * For any empty submissions array, all counts SHALL be zero
   * 
   * **Validates: Requirements 11.2, 11.3, 11.4**
   */
  it('should return all zeros for empty submissions array', () => {
    const analytics = getUserAnalytics([]);
    
    expect(analytics.totalSubmissions).toBe(0);
    expect(analytics.kycForms).toBe(0);
    expect(analytics.claimForms).toBe(0);
    expect(analytics.pendingCount).toBe(0);
    expect(analytics.approvedCount).toBe(0);
    expect(analytics.rejectedCount).toBe(0);
  });

  /**
   * Property: KYC Forms Count Matches KYC Collections
   * For any submissions array, KYC forms count SHALL equal the number of submissions
   * from KYC collections
   * 
   * **Validates: Requirements 11.3**
   */
  it('should correctly count KYC forms from KYC collections', () => {
    fc.assert(
      fc.property(
        fc.array(submissionCardArbitrary, { minLength: 0, maxLength: 100 }),
        (submissions) => {
          const analytics = getUserAnalytics(submissions);
          
          // Manually count KYC forms
          const expectedKycCount = submissions.filter(sub =>
            KYC_COLLECTIONS.includes(sub.collection)
          ).length;
          
          expect(analytics.kycForms).toBe(expectedKycCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Claims Forms Count Matches Claims Collections
   * For any submissions array, Claims forms count SHALL equal the number of submissions
   * from Claims collections
   * 
   * **Validates: Requirements 11.3**
   */
  it('should correctly count Claims forms from Claims collections', () => {
    fc.assert(
      fc.property(
        fc.array(submissionCardArbitrary, { minLength: 0, maxLength: 100 }),
        (submissions) => {
          const analytics = getUserAnalytics(submissions);
          
          // Manually count Claims forms
          const expectedClaimsCount = submissions.filter(sub =>
            CLAIMS_COLLECTIONS.includes(sub.collection)
          ).length;
          
          expect(analytics.claimForms).toBe(expectedClaimsCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Status Counts Match Actual Statuses
   * For any submissions array, each status count SHALL match the actual number
   * of submissions with that status
   * 
   * **Validates: Requirements 11.4**
   */
  it('should correctly count submissions by status', () => {
    fc.assert(
      fc.property(
        fc.array(submissionCardArbitrary, { minLength: 0, maxLength: 100 }),
        (submissions) => {
          const analytics = getUserAnalytics(submissions);
          
          // Manually count by status (pending and processing are grouped)
          const expectedPendingCount = submissions.filter(sub =>
            sub.status === 'pending' || sub.status === 'processing'
          ).length;
          const expectedApprovedCount = submissions.filter(sub =>
            sub.status === 'approved'
          ).length;
          const expectedRejectedCount = submissions.filter(sub =>
            sub.status === 'rejected'
          ).length;
          
          expect(analytics.pendingCount).toBe(expectedPendingCount);
          expect(analytics.approvedCount).toBe(expectedApprovedCount);
          expect(analytics.rejectedCount).toBe(expectedRejectedCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Pending and Processing Are Grouped
   * For any submissions array, pending count SHALL include both 'pending' and 'processing' statuses
   * 
   * **Validates: Requirements 11.4**
   */
  it('should group pending and processing statuses together', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }),
        fc.integer({ min: 0, max: 50 }),
        (pendingCount, processingCount) => {
          // Create submissions with specific pending and processing counts
          const submissions: SubmissionCard[] = [
            ...Array(pendingCount).fill(null).map((_, i) => ({
              id: `pending-${i}`,
              ticketId: `TST-${10000000 + i}`,
              formType: 'Test Form',
              submittedAt: new Date(),
              status: 'pending' as const,
              collection: 'motor-claims'
            })),
            ...Array(processingCount).fill(null).map((_, i) => ({
              id: `processing-${i}`,
              ticketId: `TST-${20000000 + i}`,
              formType: 'Test Form',
              submittedAt: new Date(),
              status: 'processing' as const,
              collection: 'motor-claims'
            }))
          ];
          
          const analytics = getUserAnalytics(submissions);
          
          // Pending count should include both pending and processing
          expect(analytics.pendingCount).toBe(pendingCount + processingCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Analytics Are Deterministic
   * For any submissions array, calling getUserAnalytics multiple times SHALL produce
   * the same results
   * 
   * **Validates: Requirements 11.2, 11.3, 11.4**
   */
  it('should produce deterministic results for the same input', () => {
    fc.assert(
      fc.property(
        fc.array(submissionCardArbitrary, { minLength: 0, maxLength: 100 }),
        (submissions) => {
          const analytics1 = getUserAnalytics(submissions);
          const analytics2 = getUserAnalytics(submissions);
          
          // Both calls should produce identical results
          expect(analytics1).toEqual(analytics2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Category Counts Never Exceed Total
   * For any submissions array, KYC and Claims counts SHALL never exceed total submissions
   * 
   * **Validates: Requirements 11.2, 11.3**
   */
  it('should have category counts not exceeding total', () => {
    fc.assert(
      fc.property(
        fc.array(submissionCardArbitrary, { minLength: 0, maxLength: 100 }),
        (submissions) => {
          const analytics = getUserAnalytics(submissions);
          
          // Individual category counts should not exceed total
          expect(analytics.kycForms).toBeLessThanOrEqual(analytics.totalSubmissions);
          expect(analytics.claimForms).toBeLessThanOrEqual(analytics.totalSubmissions);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Status Counts Never Exceed Total
   * For any submissions array, status counts SHALL never exceed total submissions
   * 
   * **Validates: Requirements 11.4**
   */
  it('should have status counts not exceeding total', () => {
    fc.assert(
      fc.property(
        fc.array(submissionCardArbitrary, { minLength: 0, maxLength: 100 }),
        (submissions) => {
          const analytics = getUserAnalytics(submissions);
          
          // Individual status counts should not exceed total
          expect(analytics.pendingCount).toBeLessThanOrEqual(analytics.totalSubmissions);
          expect(analytics.approvedCount).toBeLessThanOrEqual(analytics.totalSubmissions);
          expect(analytics.rejectedCount).toBeLessThanOrEqual(analytics.totalSubmissions);
        }
      ),
      { numRuns: 100 }
    );
  });
});
