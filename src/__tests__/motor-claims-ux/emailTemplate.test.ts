/**
 * Property-Based Tests for Email Confirmation Template
 * 
 * Feature: motor-claims-ux-improvements
 * Property 4: Email Contains Ticket ID
 * 
 * **Validates: Requirements 4.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateSubmissionConfirmationTemplate,
  SubmissionEmailData
} from '../../services/emailService';

describe('Feature: motor-claims-ux-improvements, Property 4: Email Contains Ticket ID', () => {
  /**
   * Property: Email Contains Ticket ID
   * For any submission confirmation email generated, the email HTML content 
   * SHALL contain the ticket ID string.
   * 
   * **Validates: Requirements 4.2**
   */
  it('should include the ticket ID in the generated email HTML', () => {
    // Generate valid ticket IDs matching the pattern: 3 uppercase letters, hyphen, 8 digits
    const ticketIdArb = fc.tuple(
      fc.stringMatching(/^[A-Z]{3}$/),
      fc.stringMatching(/^\d{8}$/)
    ).map(([prefix, number]) => `${prefix}-${number}`);

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),  // userName
        fc.string({ minLength: 1, maxLength: 100 }), // formType
        ticketIdArb,                                  // ticketId
        fc.webUrl(),                                  // dashboardUrl
        (userName, formType, ticketId, dashboardUrl) => {
          const emailData: SubmissionEmailData = {
            userName,
            formType,
            ticketId,
            submissionDate: new Date().toLocaleDateString(),
            dashboardUrl
          };

          const html = generateSubmissionConfirmationTemplate(emailData);

          // The ticket ID should appear in the email HTML
          expect(html).toContain(ticketId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Email Contains Correspondence Reference Message
   * For any submission confirmation email generated, the email HTML content 
   * SHALL contain a message about referencing the ticket ID in correspondence.
   * 
   * **Validates: Requirements 4.3**
   */
  it('should include the correspondence reference message in the email', () => {
    const ticketIdArb = fc.tuple(
      fc.stringMatching(/^[A-Z]{3}$/),
      fc.stringMatching(/^\d{8}$/)
    ).map(([prefix, number]) => `${prefix}-${number}`);

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        ticketIdArb,
        fc.webUrl(),
        (userName, formType, ticketId, dashboardUrl) => {
          const emailData: SubmissionEmailData = {
            userName,
            formType,
            ticketId,
            submissionDate: new Date().toLocaleDateString(),
            dashboardUrl
          };

          const html = generateSubmissionConfirmationTemplate(emailData);

          // Should contain the correspondence reference message
          expect(html).toContain('Please reference this ID in all future correspondence');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Email Contains View/Track Submission Button
   * For any submission confirmation email generated, the email HTML content 
   * SHALL contain a "View or Track Submission" button/link.
   * 
   * **Validates: Requirements 4.4**
   */
  it('should include the View or Track Submission button with dashboard link', () => {
    const ticketIdArb = fc.tuple(
      fc.stringMatching(/^[A-Z]{3}$/),
      fc.stringMatching(/^\d{8}$/)
    ).map(([prefix, number]) => `${prefix}-${number}`);

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        ticketIdArb,
        fc.webUrl(),
        (userName, formType, ticketId, dashboardUrl) => {
          const emailData: SubmissionEmailData = {
            userName,
            formType,
            ticketId,
            submissionDate: new Date().toLocaleDateString(),
            dashboardUrl
          };

          const html = generateSubmissionConfirmationTemplate(emailData);

          // Should contain the View or Track Submission button text
          expect(html).toContain('View or Track Submission');
          
          // Should contain the dashboard URL as a link
          expect(html).toContain(`href="${dashboardUrl}"`);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Email Contains User Name
   * For any submission confirmation email generated, the email HTML content 
   * SHALL contain the user's name in the greeting.
   * 
   * **Validates: Requirements 4.1**
   */
  it('should include the user name in the email greeting', () => {
    const ticketIdArb = fc.tuple(
      fc.stringMatching(/^[A-Z]{3}$/),
      fc.stringMatching(/^\d{8}$/)
    ).map(([prefix, number]) => `${prefix}-${number}`);

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        ticketIdArb,
        fc.webUrl(),
        (userName, formType, ticketId, dashboardUrl) => {
          const emailData: SubmissionEmailData = {
            userName,
            formType,
            ticketId,
            submissionDate: new Date().toLocaleDateString(),
            dashboardUrl
          };

          const html = generateSubmissionConfirmationTemplate(emailData);

          // Should contain the user name
          expect(html).toContain(userName);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Email Contains Form Type
   * For any submission confirmation email generated, the email HTML content 
   * SHALL contain the form type.
   * 
   * **Validates: Requirements 4.1**
   */
  it('should include the form type in the email', () => {
    const ticketIdArb = fc.tuple(
      fc.stringMatching(/^[A-Z]{3}$/),
      fc.stringMatching(/^\d{8}$/)
    ).map(([prefix, number]) => `${prefix}-${number}`);

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        ticketIdArb,
        fc.webUrl(),
        (userName, formType, ticketId, dashboardUrl) => {
          const emailData: SubmissionEmailData = {
            userName,
            formType,
            ticketId,
            submissionDate: new Date().toLocaleDateString(),
            dashboardUrl
          };

          const html = generateSubmissionConfirmationTemplate(emailData);

          // Should contain the form type
          expect(html).toContain(formType);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Ticket ID is Prominently Displayed
   * For any submission confirmation email generated, the ticket ID SHALL be 
   * displayed in a prominent styled section (within a bordered div).
   * 
   * **Validates: Requirements 4.2**
   */
  it('should display the ticket ID in a prominent styled section', () => {
    const ticketIdArb = fc.tuple(
      fc.stringMatching(/^[A-Z]{3}$/),
      fc.stringMatching(/^\d{8}$/)
    ).map(([prefix, number]) => `${prefix}-${number}`);

    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        ticketIdArb,
        fc.webUrl(),
        (userName, formType, ticketId, dashboardUrl) => {
          const emailData: SubmissionEmailData = {
            userName,
            formType,
            ticketId,
            submissionDate: new Date().toLocaleDateString(),
            dashboardUrl
          };

          const html = generateSubmissionConfirmationTemplate(emailData);

          // Should contain the "Your Ticket ID" label
          expect(html).toContain('Your Ticket ID');
          
          // The ticket ID should be in a heading element for prominence
          expect(html).toContain(`<h2 style="margin: 10px 0; color: #800020; font-size: 28px;">${ticketId}</h2>`);
        }
      ),
      { numRuns: 100 }
    );
  });
});
