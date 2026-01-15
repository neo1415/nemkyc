import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { getUserAnalytics, SubmissionCard } from '../../services/userSubmissionsService';

/**
 * Property 14: Status Synchronization
 * 
 * **Validates: Requirements 10.2**
 * 
 * For any submission card displayed on the user dashboard, the status shown 
 * SHALL match the current status value in the database.
 * 
 * This test verifies that when status updates occur, the analytics and submission
 * cards reflect the correct status values. While we cannot test real-time Firestore
 * listeners in a unit test environment, we verify the synchronization logic by
 * ensuring that status changes in submission data correctly propagate through
 * the analytics calculation and display logic.
 */

describe('Property 14: Status Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should correctly reflect status in analytics when submissions change', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of submissions with various statuses
        fc.array(
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 20 }),
            ticketId: fc.string({ minLength: 8, maxLength: 15 }),
            formType: fc.string({ minLength: 5, maxLength: 30 }),
            submittedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            status: fc.constantFrom('processing', 'pending', 'approved', 'rejected') as fc.Arbitrary<'processing' | 'pending' | 'approved' | 'rejected'>,
            collection: fc.constantFrom('motor-claims', 'fire-claims', 'individual-kyc', 'corporate-kyc')
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (submissions: SubmissionCard[]) => {
          // Calculate analytics from submissions
          const analytics = getUserAnalytics(submissions);

          // Property 1: Count each status manually and verify it matches analytics
          const manualPendingCount = submissions.filter(
            s => s.status === 'pending' || s.status === 'processing'
          ).length;
          const manualApprovedCount = submissions.filter(
            s => s.status === 'approved'
          ).length;
          const manualRejectedCount = submissions.filter(
            s => s.status === 'rejected'
          ).length;

          expect(analytics.pendingCount).toBe(manualPendingCount);
          expect(analytics.approvedCount).toBe(manualApprovedCount);
          expect(analytics.rejectedCount).toBe(manualRejectedCount);

          // Property 2: Total should equal sum of all statuses
          expect(analytics.totalSubmissions).toBe(
            manualPendingCount + manualApprovedCount + manualRejectedCount
          );

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain status consistency when status changes from one value to another', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate initial submissions
        fc.array(
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 20 }),
            ticketId: fc.string({ minLength: 8, maxLength: 15 }),
            formType: fc.string({ minLength: 5, maxLength: 30 }),
            submittedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            status: fc.constantFrom('processing', 'pending') as fc.Arbitrary<'processing' | 'pending'>,
            collection: fc.constantFrom('motor-claims', 'fire-claims')
          }),
          { minLength: 1, maxLength: 10 }
        ),
        // Generate new status to update to
        fc.constantFrom('approved', 'rejected') as fc.Arbitrary<'approved' | 'rejected'>,
        // Generate index of submission to update
        fc.nat(),
        async (initialSubmissions: SubmissionCard[], newStatus: 'approved' | 'rejected', indexSeed: number) => {
          if (initialSubmissions.length === 0) return true;

          // Calculate initial analytics
          const initialAnalytics = getUserAnalytics(initialSubmissions);

          // Select a submission to update (use modulo to ensure valid index)
          const updateIndex = indexSeed % initialSubmissions.length;
          const oldStatus = initialSubmissions[updateIndex].status;

          // Create updated submissions array with status change
          const updatedSubmissions = initialSubmissions.map((sub, idx) =>
            idx === updateIndex ? { ...sub, status: newStatus } : sub
          );

          // Calculate new analytics
          const newAnalytics = getUserAnalytics(updatedSubmissions);

          // Property: Status counts should reflect the change
          // Pending count should decrease by 1 (since we changed from processing/pending)
          expect(newAnalytics.pendingCount).toBe(initialAnalytics.pendingCount - 1);

          // Approved or rejected count should increase by 1
          if (newStatus === 'approved') {
            expect(newAnalytics.approvedCount).toBe(initialAnalytics.approvedCount + 1);
            expect(newAnalytics.rejectedCount).toBe(initialAnalytics.rejectedCount);
          } else {
            expect(newAnalytics.rejectedCount).toBe(initialAnalytics.rejectedCount + 1);
            expect(newAnalytics.approvedCount).toBe(initialAnalytics.approvedCount);
          }

          // Total should remain the same
          expect(newAnalytics.totalSubmissions).toBe(initialAnalytics.totalSubmissions);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple simultaneous status changes correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate submissions with processing status
        fc.array(
          fc.record({
            id: fc.string({ minLength: 10, maxLength: 20 }),
            ticketId: fc.string({ minLength: 8, maxLength: 15 }),
            formType: fc.string({ minLength: 5, maxLength: 30 }),
            submittedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            status: fc.constant('processing') as fc.Arbitrary<'processing'>,
            collection: fc.constantFrom('motor-claims', 'fire-claims')
          }),
          { minLength: 3, maxLength: 10 }
        ),
        async (submissions: SubmissionCard[]) => {
          // Calculate initial analytics (all should be pending)
          const initialAnalytics = getUserAnalytics(submissions);
          expect(initialAnalytics.pendingCount).toBe(submissions.length);
          expect(initialAnalytics.approvedCount).toBe(0);
          expect(initialAnalytics.rejectedCount).toBe(0);

          // Update all submissions to different statuses
          const updatedSubmissions = submissions.map((sub, idx) => ({
            ...sub,
            status: idx % 3 === 0 ? 'approved' : idx % 3 === 1 ? 'rejected' : 'processing'
          } as SubmissionCard));

          // Calculate new analytics
          const newAnalytics = getUserAnalytics(updatedSubmissions);

          // Manually count expected values
          const expectedApproved = updatedSubmissions.filter(s => s.status === 'approved').length;
          const expectedRejected = updatedSubmissions.filter(s => s.status === 'rejected').length;
          const expectedPending = updatedSubmissions.filter(s => s.status === 'processing').length;

          // Property: Analytics should match actual counts
          expect(newAnalytics.approvedCount).toBe(expectedApproved);
          expect(newAnalytics.rejectedCount).toBe(expectedRejected);
          expect(newAnalytics.pendingCount).toBe(expectedPending);
          expect(newAnalytics.totalSubmissions).toBe(submissions.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain status integrity through rapid changes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 10, maxLength: 20 }),
          ticketId: fc.string({ minLength: 8, maxLength: 15 }),
          formType: fc.string({ minLength: 5, maxLength: 30 }),
          submittedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          status: fc.constant('processing') as fc.Arbitrary<'processing'>,
          collection: fc.constant('motor-claims')
        }),
        fc.array(
          fc.constantFrom('processing', 'approved', 'rejected', 'pending') as fc.Arbitrary<'processing' | 'approved' | 'rejected' | 'pending'>,
          { minLength: 1, maxLength: 10 }
        ),
        async (initialSubmission: SubmissionCard, statusSequence: Array<'processing' | 'approved' | 'rejected' | 'pending'>) => {
          // Simulate rapid status changes
          let currentSubmission = initialSubmission;
          
          for (const newStatus of statusSequence) {
            currentSubmission = { ...currentSubmission, status: newStatus };
            
            // After each change, verify analytics are correct
            const analytics = getUserAnalytics([currentSubmission]);
            
            // Property: Analytics should always reflect the current status
            if (newStatus === 'approved') {
              expect(analytics.approvedCount).toBe(1);
              expect(analytics.rejectedCount).toBe(0);
              expect(analytics.pendingCount).toBe(0);
            } else if (newStatus === 'rejected') {
              expect(analytics.approvedCount).toBe(0);
              expect(analytics.rejectedCount).toBe(1);
              expect(analytics.pendingCount).toBe(0);
            } else {
              expect(analytics.approvedCount).toBe(0);
              expect(analytics.rejectedCount).toBe(0);
              expect(analytics.pendingCount).toBe(1);
            }
            
            expect(analytics.totalSubmissions).toBe(1);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
