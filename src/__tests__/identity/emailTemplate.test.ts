/**
 * Unit tests for dynamic email template
 * 
 * Tests verify that the email template correctly adjusts based on verificationType
 * and includes all required regulatory text and contact information.
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateIdentityVerificationEmail,
  generateIdentityVerificationEmailHtml,
  generateIdentityVerificationEmailText,
  generateIdentityVerificationEmailSubject,
  type IdentityVerificationEmailData,
  type VerificationType,
} from '../../templates/verificationEmail';

describe('Dynamic Email Template', () => {
  const baseData: IdentityVerificationEmailData = {
    verificationType: 'NIN',
    customerName: 'John Doe',
    policyNumber: 'POL-12345',
    verificationLink: 'https://example.com/verify/token123',
    expiresAt: new Date('2026-01-25'),
  };

  describe('NIN Verification Email', () => {
    it('should use "Dear Client" as greeting', () => {
      const html = generateIdentityVerificationEmailHtml(baseData);
      const text = generateIdentityVerificationEmailText(baseData);

      expect(html).toContain('Dear Client,');
      expect(text).toContain('Dear Client,');
    });

    it('should mention "Individual Clients" for NIN', () => {
      const html = generateIdentityVerificationEmailHtml(baseData);
      const text = generateIdentityVerificationEmailText(baseData);

      expect(html).toContain('For Individual Clients: National Identification Number (NIN)');
      expect(text).toContain('For Individual Clients: National Identification Number (NIN)');
    });

    it('should include full NAICOM regulatory text', () => {
      const html = generateIdentityVerificationEmailHtml(baseData);
      const text = generateIdentityVerificationEmailText(baseData);

      const regulatoryText = 'in line with the directives of the National Insurance Commission (NAICOM)';
      const kycText = 'Know Your Customer (KYC) and data integrity';
      const mandateText = 'are mandated to obtain and update the identification details';

      expect(html).toContain(regulatoryText);
      expect(html).toContain(kycText);
      expect(html).toContain(mandateText);

      expect(text).toContain(regulatoryText);
      expect(text).toContain(kycText);
      expect(text).toContain(mandateText);
    });

    it('should include contact information', () => {
      const html = generateIdentityVerificationEmailHtml(baseData);
      const text = generateIdentityVerificationEmailText(baseData);

      expect(html).toContain('nemsupport@nem-insurance.com');
      expect(html).toContain('0201-4489570-2');

      expect(text).toContain('nemsupport@nem-insurance.com');
      expect(text).toContain('0201-4489570-2');
    });

    it('should include verification link', () => {
      const html = generateIdentityVerificationEmailHtml(baseData);
      const text = generateIdentityVerificationEmailText(baseData);

      expect(html).toContain(baseData.verificationLink);
      expect(text).toContain(baseData.verificationLink);
    });

    it('should include expiration date', () => {
      const html = generateIdentityVerificationEmailHtml(baseData);
      const text = generateIdentityVerificationEmailText(baseData);

      const dateString = baseData.expiresAt.toLocaleDateString();
      expect(html).toContain(dateString);
      expect(text).toContain(dateString);
    });

    it('should generate correct subject line for NIN', () => {
      const subject = generateIdentityVerificationEmailSubject('NIN', 'POL-12345');
      expect(subject).toContain('NIN Verification');
      expect(subject).toContain('POL-12345');
    });
  });

  describe('CAC Verification Email', () => {
    const cacData: IdentityVerificationEmailData = {
      ...baseData,
      verificationType: 'CAC',
    };

    it('should use "Dear Client" as greeting', () => {
      const html = generateIdentityVerificationEmailHtml(cacData);
      const text = generateIdentityVerificationEmailText(cacData);

      expect(html).toContain('Dear Client,');
      expect(text).toContain('Dear Client,');
    });

    it('should mention "Corporate Clients" for CAC', () => {
      const html = generateIdentityVerificationEmailHtml(cacData);
      const text = generateIdentityVerificationEmailText(cacData);

      expect(html).toContain('For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number');
      expect(text).toContain('For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number');
    });

    it('should include full NAICOM regulatory text', () => {
      const html = generateIdentityVerificationEmailHtml(cacData);
      const text = generateIdentityVerificationEmailText(cacData);

      const regulatoryText = 'in line with the directives of the National Insurance Commission (NAICOM)';
      const kycText = 'Know Your Customer (KYC) and data integrity';

      expect(html).toContain(regulatoryText);
      expect(html).toContain(kycText);

      expect(text).toContain(regulatoryText);
      expect(text).toContain(kycText);
    });

    it('should include contact information', () => {
      const html = generateIdentityVerificationEmailHtml(cacData);
      const text = generateIdentityVerificationEmailText(cacData);

      expect(html).toContain('nemsupport@nem-insurance.com');
      expect(html).toContain('0201-4489570-2');

      expect(text).toContain('nemsupport@nem-insurance.com');
      expect(text).toContain('0201-4489570-2');
    });

    it('should generate correct subject line for CAC', () => {
      const subject = generateIdentityVerificationEmailSubject('CAC', 'POL-12345');
      expect(subject).toContain('CAC Verification');
      expect(subject).toContain('POL-12345');
    });
  });

  describe('Complete Email Template', () => {
    it('should generate complete email with subject, html, and text', () => {
      const email = generateIdentityVerificationEmail(baseData);

      expect(email).toHaveProperty('subject');
      expect(email).toHaveProperty('html');
      expect(email).toHaveProperty('text');

      expect(email.subject).toBeTruthy();
      expect(email.html).toBeTruthy();
      expect(email.text).toBeTruthy();
    });

    it('should work without optional fields', () => {
      const minimalData: IdentityVerificationEmailData = {
        verificationType: 'NIN',
        verificationLink: 'https://example.com/verify/token123',
        expiresAt: new Date('2026-01-25'),
      };

      const email = generateIdentityVerificationEmail(minimalData);

      expect(email.html).toContain('Dear Client,');
      expect(email.text).toContain('Dear Client,');
      expect(email.html).not.toContain('Policy Reference');
    });
  });

  describe('Regulatory Compliance Text', () => {
    it('should include policy administration warning', () => {
      const html = generateIdentityVerificationEmailHtml(baseData);
      const text = generateIdentityVerificationEmailText(baseData);

      const warningText = 'failure to update these details may affect the continued administration of your policy';

      expect(html).toContain(warningText);
      expect(text).toContain(warningText);
    });

    it('should include NAICOM compliance statement', () => {
      const html = generateIdentityVerificationEmailHtml(baseData);
      const text = generateIdentityVerificationEmailText(baseData);

      const complianceText = 'remain fully compliant with NAICOM regulations';

      expect(html).toContain(complianceText);
      expect(text).toContain(complianceText);
    });

    it('should include professional closing', () => {
      const html = generateIdentityVerificationEmailHtml(baseData);
      const text = generateIdentityVerificationEmailText(baseData);

      expect(html).toContain('Thank you for your cooperation');
      expect(html).toContain('Yours faithfully');
      expect(html).toContain('NEM Insurance');

      expect(text).toContain('Thank you for your cooperation');
      expect(text).toContain('Yours faithfully');
      expect(text).toContain('NEM Insurance');
    });
  });

  /**
   * Property-Based Tests
   * 
   * Property 19: Email Template Dynamic Content
   * 
   * For any verification email sent, if verificationType is "NIN", the email must contain
   * "Individual Clients" and "National Identification Number (NIN)". If verificationType is "CAC",
   * the email must contain "Corporate Clients" and "Corporate Affairs Commission (CAC) Registration Number".
   * 
   * Validates: Requirements 14.1, 14.2, 14.4, 14.7
   */
  describe('Property 19: Email Template Dynamic Content', () => {
    /**
     * Helper function to escape HTML entities in a string
     * This matches the escapeHtml function used in the email template
     */
    function escapeHtml(text: string): string {
      const htmlEntities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
    }

    it('should always include correct client type and document type based on verificationType', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary verification type
          fc.constantFrom<VerificationType>('NIN', 'CAC'),
          // Generate arbitrary customer name (optional)
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          // Generate arbitrary policy number (optional)
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          // Generate arbitrary verification link
          fc.webUrl(),
          // Generate arbitrary future date
          fc.date({ min: new Date() }),
          (verificationType, customerName, policyNumber, verificationLink, expiresAt) => {
            const emailData: IdentityVerificationEmailData = {
              verificationType,
              customerName,
              policyNumber,
              verificationLink,
              expiresAt,
            };

            const html = generateIdentityVerificationEmailHtml(emailData);
            const text = generateIdentityVerificationEmailText(emailData);
            const subject = generateIdentityVerificationEmailSubject(verificationType, policyNumber);

            // Property: NIN emails must contain Individual Clients text
            if (verificationType === 'NIN') {
              expect(html).toContain('For Individual Clients: National Identification Number (NIN)');
              expect(text).toContain('For Individual Clients: National Identification Number (NIN)');
              expect(subject).toContain('NIN Verification');
            }

            // Property: CAC emails must contain Corporate Clients text
            if (verificationType === 'CAC') {
              expect(html).toContain('For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number');
              expect(text).toContain('For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number');
              expect(subject).toContain('CAC Verification');
            }

            // Property: All emails must use "Dear Client" greeting (Requirement 14.3)
            expect(html).toContain('Dear Client,');
            expect(text).toContain('Dear Client,');

            // Property: All emails must include NAICOM regulatory text (Requirement 14.4)
            expect(html).toContain('National Insurance Commission (NAICOM)');
            expect(html).toContain('Know Your Customer (KYC)');
            expect(text).toContain('National Insurance Commission (NAICOM)');
            expect(text).toContain('Know Your Customer (KYC)');

            // Property: All emails must include contact information (Requirement 14.6)
            expect(html).toContain('nemsupport@nem-insurance.com');
            expect(html).toContain('0201-4489570-2');
            expect(text).toContain('nemsupport@nem-insurance.com');
            expect(text).toContain('0201-4489570-2');

            // Property: All emails must include the verification link
            // HTML version escapes special characters for security
            const escapedLink = escapeHtml(verificationLink);
            expect(html).toContain(escapedLink);
            // Text version uses raw link
            expect(text).toContain(verificationLink);

            // Property: All emails must include the expiration date
            const dateString = expiresAt.toLocaleDateString();
            expect(html).toContain(dateString);
            expect(text).toContain(dateString);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never mix NIN and CAC terminology in the same email', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationType>('NIN', 'CAC'),
          fc.webUrl(),
          fc.date({ min: new Date() }),
          (verificationType, verificationLink, expiresAt) => {
            const emailData: IdentityVerificationEmailData = {
              verificationType,
              verificationLink,
              expiresAt,
            };

            const html = generateIdentityVerificationEmailHtml(emailData);
            const text = generateIdentityVerificationEmailText(emailData);

            // Property: NIN emails should not contain Corporate Clients text
            if (verificationType === 'NIN') {
              expect(html).not.toContain('For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number');
              expect(text).not.toContain('For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number');
            }

            // Property: CAC emails should not contain Individual Clients text
            if (verificationType === 'CAC') {
              expect(html).not.toContain('For Individual Clients: National Identification Number (NIN)');
              expect(text).not.toContain('For Individual Clients: National Identification Number (NIN)');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent content between HTML and text versions', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationType>('NIN', 'CAC'),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          fc.webUrl(),
          fc.date({ min: new Date() }),
          (verificationType, customerName, policyNumber, verificationLink, expiresAt) => {
            const emailData: IdentityVerificationEmailData = {
              verificationType,
              customerName,
              policyNumber,
              verificationLink,
              expiresAt,
            };

            const html = generateIdentityVerificationEmailHtml(emailData);
            const text = generateIdentityVerificationEmailText(emailData);

            // Property: Both versions must have the same client type text
            const clientTypeText = verificationType === 'NIN'
              ? 'For Individual Clients: National Identification Number (NIN)'
              : 'For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number';

            expect(html).toContain(clientTypeText);
            expect(text).toContain(clientTypeText);

            // Property: Both versions must have the same greeting
            expect(html).toContain('Dear Client,');
            expect(text).toContain('Dear Client,');

            // Property: Both versions must have the same contact info
            expect(html).toContain('nemsupport@nem-insurance.com');
            expect(text).toContain('nemsupport@nem-insurance.com');
            expect(html).toContain('0201-4489570-2');
            expect(text).toContain('0201-4489570-2');

            // Property: Both versions must have the verification link (accounting for HTML escaping)
            // HTML version escapes special characters
            const escapedLink = escapeHtml(verificationLink);
            expect(html).toContain(escapedLink);
            // Text version uses raw link
            expect(text).toContain(verificationLink);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate complete email template with all required fields', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationType>('NIN', 'CAC'),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          fc.webUrl(),
          fc.date({ min: new Date() }),
          (verificationType, customerName, policyNumber, verificationLink, expiresAt) => {
            const emailData: IdentityVerificationEmailData = {
              verificationType,
              customerName,
              policyNumber,
              verificationLink,
              expiresAt,
            };

            const email = generateIdentityVerificationEmail(emailData);

            // Property: Complete email must have subject, html, and text
            expect(email).toHaveProperty('subject');
            expect(email).toHaveProperty('html');
            expect(email).toHaveProperty('text');

            // Property: All fields must be non-empty strings
            expect(email.subject).toBeTruthy();
            expect(typeof email.subject).toBe('string');
            expect(email.html).toBeTruthy();
            expect(typeof email.html).toBe('string');
            expect(email.text).toBeTruthy();
            expect(typeof email.text).toBe('string');

            // Property: Subject must contain verification type
            const docType = verificationType === 'NIN' ? 'NIN' : 'CAC';
            expect(email.subject).toContain(docType);
            expect(email.subject).toContain('Verification');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
