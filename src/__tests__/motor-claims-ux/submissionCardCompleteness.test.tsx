/**
 * Property-Based Tests for Submission Card Completeness
 * 
 * Feature: motor-claims-ux-improvements
 * Property 5: Submission Card Completeness
 * 
 * **Validates: Requirements 5.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SubmissionCard from '../../components/dashboard/SubmissionCard';
import { SubmissionCard as SubmissionCardType } from '../../services/userSubmissionsService';

// Arbitrary generator for SubmissionCard data
const submissionCardArbitrary = fc.record({
  id: fc.uuid(),
  ticketId: fc.oneof(
    fc.constant('N/A'),
    fc.string({ minLength: 12, maxLength: 12 }).map(s => 
      `${s.substring(0, 3).toUpperCase()}-${s.substring(3, 11).replace(/\D/g, '0').padEnd(8, '0')}`
    )
  ),
  formType: fc.constantFrom(
    'Motor Claim',
    'Fire Special Perils Claim',
    'Burglary Claim',
    'Individual KYC',
    'Corporate KYC',
    'All Risk Claim',
    'Goods In Transit Claim'
  ),
  submittedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).filter(d => !isNaN(d.getTime())),
  status: fc.constantFrom('processing', 'approved', 'rejected', 'pending') as fc.Arbitrary<'processing' | 'approved' | 'rejected' | 'pending'>,
  collection: fc.constantFrom(
    'motor-claims',
    'fire-claims',
    'burglary-claims',
    'individual-kyc',
    'corporate-kyc',
    'all-risk-claims',
    'goods-in-transit-claims'
  )
});

describe('Feature: motor-claims-ux-improvements, Property 5: Submission Card Completeness', () => {
  /**
   * Property: Submission Card Displays All Required Fields
   * For any submission card rendered for a user's submission, the card SHALL display:
   * - form type
   * - ticket ID (or 'N/A' if not present)
   * - submission date
   * - current status
   * 
   * **Validates: Requirements 5.3**
   */
  it('should display all required fields for any submission', () => {
    fc.assert(
      fc.property(
        submissionCardArbitrary,
        (submission: SubmissionCardType) => {
          const { container } = render(
            <BrowserRouter>
              <SubmissionCard submission={submission} />
            </BrowserRouter>
          );

          const html = container.innerHTML;
          const textContent = container.textContent || '';

          // Check that form type is displayed
          expect(html).toContain(submission.formType);

          // Check that ticket ID is displayed (use textContent to avoid HTML escaping issues)
          expect(textContent).toContain(submission.ticketId);

          // Check that status is displayed (as text in badge)
          const statusText = submission.status === 'processing' || submission.status === 'pending' 
            ? 'Processing' 
            : submission.status === 'approved' 
            ? 'Approved' 
            : 'Rejected';
          expect(html).toContain(statusText);

          // Check that date-related text is present (we format dates, so check for common date elements)
          const year = submission.submittedAt.getFullYear().toString();
          expect(html).toContain(year);

          // Check that "Ticket ID:" label is present
          expect(html).toContain('Ticket ID:');

          // Check that "Submitted:" label is present
          expect(html).toContain('Submitted:');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Ticket ID Display Handles N/A
   * For any submission with ticket ID 'N/A', the card SHALL display 'N/A'
   * 
   * **Validates: Requirements 5.3**
   */
  it('should display N/A when ticket ID is not present', () => {
    fc.assert(
      fc.property(
        submissionCardArbitrary.map(sub => ({ ...sub, ticketId: 'N/A' })),
        (submission: SubmissionCardType) => {
          const { container } = render(
            <BrowserRouter>
              <SubmissionCard submission={submission} />
            </BrowserRouter>
          );

          const html = container.innerHTML;

          // Check that N/A is displayed for ticket ID
          expect(html).toContain('N/A');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Status Badge Color Indicators
   * For any submission, the status SHALL be displayed with appropriate visual indicators:
   * - processing/pending: yellow
   * - approved: green
   * - rejected: red
   * 
   * **Validates: Requirements 5.3**
   */
  it('should display status with correct color indicators', () => {
    fc.assert(
      fc.property(
        submissionCardArbitrary,
        (submission: SubmissionCardType) => {
          const { container } = render(
            <BrowserRouter>
              <SubmissionCard submission={submission} />
            </BrowserRouter>
          );

          const html = container.innerHTML;

          // Check for appropriate color classes based on status
          if (submission.status === 'approved') {
            expect(html).toContain('bg-green-100');
            expect(html).toContain('text-green-800');
          } else if (submission.status === 'rejected') {
            expect(html).toContain('bg-red-100');
            expect(html).toContain('text-red-800');
          } else {
            // processing or pending
            expect(html).toContain('bg-yellow-100');
            expect(html).toContain('text-yellow-800');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Form Type Display
   * For any submission, the form type SHALL be displayed prominently
   * 
   * **Validates: Requirements 5.3**
   */
  it('should display form type prominently for any submission', () => {
    fc.assert(
      fc.property(
        submissionCardArbitrary,
        (submission: SubmissionCardType) => {
          const { container } = render(
            <BrowserRouter>
              <SubmissionCard submission={submission} />
            </BrowserRouter>
          );

          const html = container.innerHTML;

          // Form type should be in the HTML
          expect(html).toContain(submission.formType);

          // Form type should be in a title element (CardTitle)
          expect(html).toMatch(new RegExp(`text-lg.*${submission.formType}|${submission.formType}.*text-lg`));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Date Formatting Consistency
   * For any submission date, the displayed date SHALL be formatted consistently
   * and include year, month, and day information
   * 
   * **Validates: Requirements 5.3**
   */
  it('should format submission dates consistently', () => {
    fc.assert(
      fc.property(
        submissionCardArbitrary,
        (submission: SubmissionCardType) => {
          const { container } = render(
            <BrowserRouter>
              <SubmissionCard submission={submission} />
            </BrowserRouter>
          );

          const html = container.innerHTML;

          // Check that year is present
          const year = submission.submittedAt.getFullYear().toString();
          expect(html).toContain(year);

          // Check that the date is formatted (contains common date separators or month names)
          const hasDateFormat = 
            html.includes('Jan') || html.includes('Feb') || html.includes('Mar') ||
            html.includes('Apr') || html.includes('May') || html.includes('Jun') ||
            html.includes('Jul') || html.includes('Aug') || html.includes('Sep') ||
            html.includes('Oct') || html.includes('Nov') || html.includes('Dec') ||
            /\d{1,2}\/\d{1,2}\/\d{4}/.test(html) ||
            /\d{4}-\d{2}-\d{2}/.test(html);

          expect(hasDateFormat).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Collection Type Display
   * For any submission, the collection name SHALL be displayed
   * 
   * **Validates: Requirements 5.3**
   */
  it('should display collection type for any submission', () => {
    fc.assert(
      fc.property(
        submissionCardArbitrary,
        (submission: SubmissionCardType) => {
          const { container } = render(
            <BrowserRouter>
              <SubmissionCard submission={submission} />
            </BrowserRouter>
          );

          const html = container.innerHTML;

          // Collection should be displayed
          expect(html).toContain(submission.collection);

          // "Type:" label should be present
          expect(html).toContain('Type:');
        }
      ),
      { numRuns: 100 }
    );
  });
});

