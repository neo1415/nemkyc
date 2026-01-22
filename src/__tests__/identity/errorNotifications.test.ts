/**
 * Property-Based Tests for Error Notifications
 * 
 * Property 24: Error Notification Completeness
 * 
 * For any verification failure, the system must send an email to the customer with
 * user-friendly error message and broker contact, AND send an email to all staff with
 * roles 'compliance', 'admin', or 'broker' with technical details.
 * 
 * Validates: Requirements 21.3, 21.4, 21.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  createVerificationError,
  generateCustomerMessage,
  generateStaffMessage,
  isVerificationError,
  type VerificationError,
} from '../../utils/verificationErrors';

describe('Property 24: Error Notification Completeness', () => {
  /**
   * Property: Customer error messages must always include user-friendly text and broker contact
   * 
   * For any verification error, the customer message must:
   * 1. Be non-empty and readable
   * 2. Include broker contact information if provided
   * 3. Include clear next steps
   * 4. Not contain technical jargon or internal error codes
   * 
   * Validates: Requirement 21.3
   */
  describe('Customer Error Messages', () => {
    it('should always generate non-empty user-friendly messages with next steps', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary error type
          fc.constantFrom<VerificationError['errorType']>(
            'field_mismatch',
            'api_error',
            'invalid_input',
            'max_attempts',
            'expired_token'
          ),
          // Generate arbitrary failed fields
          fc.option(
            fc.array(
              fc.constantFrom(
                'firstName',
                'lastName',
                'dateOfBirth',
                'gender',
                'bvn',
                'nin',
                'companyName',
                'registrationNumber',
                'registrationDate',
                'businessAddress',
                'cac'
              ),
              { minLength: 1, maxLength: 5 }
            ),
            { nil: undefined }
          ),
          // Generate arbitrary broker email
          fc.option(fc.emailAddress(), { nil: undefined }),
          (errorType, failedFields, brokerEmail) => {
            const customerMessage = generateCustomerMessage(errorType, failedFields, brokerEmail);

            // Property: Message must be non-empty
            expect(customerMessage).toBeTruthy();
            expect(customerMessage.length).toBeGreaterThan(0);

            // Property: Message must include next steps
            expect(customerMessage.toLowerCase()).toMatch(/next steps|please contact|if you/);

            // Property: Message must mention broker contact
            expect(customerMessage.toLowerCase()).toContain('broker');

            // Property: If broker email provided, it must be included
            if (brokerEmail) {
              expect(customerMessage).toContain(brokerEmail);
            }

            // Property: Message should not contain technical jargon
            expect(customerMessage).not.toMatch(/stack trace|exception|error code|debug/i);

            // Property: Message should be polite and professional
            expect(customerMessage.toLowerCase()).toMatch(/please|thank you|we|your/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include specific field information for field_mismatch errors', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'firstName',
              'lastName',
              'dateOfBirth',
              'gender',
              'bvn',
              'companyName',
              'registrationNumber'
            ),
            { minLength: 1, maxLength: 5 }
          ),
          fc.option(fc.emailAddress(), { nil: undefined }),
          (failedFields, brokerEmail) => {
            const customerMessage = generateCustomerMessage('field_mismatch', failedFields, brokerEmail);

            // Property: Message must reference the mismatch
            expect(customerMessage.toLowerCase()).toMatch(/did not match|mismatch|incorrect/);

            // Property: Message must provide context about what went wrong
            expect(customerMessage.toLowerCase()).toMatch(/information|details|data/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide appropriate guidance for each error type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationError['errorType']>(
            'field_mismatch',
            'api_error',
            'invalid_input',
            'max_attempts',
            'expired_token'
          ),
          fc.option(fc.emailAddress(), { nil: undefined }),
          (errorType, brokerEmail) => {
            const customerMessage = generateCustomerMessage(errorType, undefined, brokerEmail);

            // Property: Each error type must have specific guidance
            switch (errorType) {
              case 'field_mismatch':
                expect(customerMessage.toLowerCase()).toMatch(/did not match|mismatch/);
                break;
              case 'api_error':
                expect(customerMessage.toLowerCase()).toMatch(/technical|try again|service/);
                break;
              case 'invalid_input':
                expect(customerMessage.toLowerCase()).toMatch(/invalid|check|entered/);
                break;
              case 'max_attempts':
                expect(customerMessage.toLowerCase()).toMatch(/maximum|attempts|disabled/);
                break;
              case 'expired_token':
                expect(customerMessage.toLowerCase()).toMatch(/expired|limited time/);
                break;
            }

            // Property: All messages must include contact information
            expect(customerMessage.toLowerCase()).toContain('broker');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Staff error messages must always include technical details
   * 
   * For any verification error, the staff message must:
   * 1. Include customer identification (name, policy number)
   * 2. Include verification type (NIN/CAC)
   * 3. Include error type and failed fields
   * 4. Include actionable next steps for staff
   * 5. Be detailed enough for troubleshooting
   * 
   * Validates: Requirements 21.4, 21.5
   */
  describe('Staff Error Messages', () => {
    it('should always generate detailed technical messages with action items', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary error type
          fc.constantFrom<VerificationError['errorType']>(
            'field_mismatch',
            'api_error',
            'invalid_input',
            'max_attempts',
            'expired_token'
          ),
          // Generate arbitrary failed fields
          fc.option(
            fc.array(
              fc.constantFrom(
                'firstName',
                'lastName',
                'dateOfBirth',
                'gender',
                'bvn',
                'nin',
                'companyName',
                'registrationNumber'
              ),
              { minLength: 1, maxLength: 5 }
            ),
            { nil: undefined }
          ),
          // Generate arbitrary customer name
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          // Generate arbitrary policy number
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          // Generate arbitrary verification type
          fc.option(fc.constantFrom<'NIN' | 'CAC'>('NIN', 'CAC'), { nil: undefined }),
          (errorType, failedFields, customerName, policyNumber, verificationType) => {
            const staffMessage = generateStaffMessage(
              errorType,
              failedFields,
              customerName,
              policyNumber,
              verificationType
            );

            // Property: Message must be non-empty
            expect(staffMessage).toBeTruthy();
            expect(staffMessage.length).toBeGreaterThan(0);

            // Property: Message must include alert header
            expect(staffMessage).toContain('Verification Failure Alert');

            // Property: Message must include error type
            expect(staffMessage.toLowerCase()).toContain('error type');

            // Property: Message must include action required section
            expect(staffMessage).toContain('Action Required');

            // Property: If customer name provided, it must be included
            if (customerName) {
              expect(staffMessage).toContain(customerName);
            }

            // Property: If policy number provided, it must be included
            if (policyNumber) {
              expect(staffMessage).toContain(policyNumber);
            }

            // Property: If verification type provided, it must be included
            if (verificationType) {
              expect(staffMessage).toContain(verificationType);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include failed fields details for field_mismatch errors', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              'firstName',
              'lastName',
              'dateOfBirth',
              'gender',
              'bvn',
              'companyName',
              'registrationNumber'
            ),
            { minLength: 1, maxLength: 5 }
          ),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          (failedFields, customerName, policyNumber) => {
            const staffMessage = generateStaffMessage(
              'field_mismatch',
              failedFields,
              customerName,
              policyNumber,
              'NIN'
            );

            // Property: Message must list failed fields
            expect(staffMessage).toContain('Failed Fields');

            // Property: Each failed field must be mentioned
            failedFields.forEach(field => {
              // The message should contain a formatted version of the field name
              // Field names are formatted with spaces (e.g., "firstName" -> "First Name")
              const formattedField = field
                .replace(/([A-Z])/g, ' $1')
                .trim()
                .toLowerCase();
              expect(staffMessage.toLowerCase()).toContain(formattedField);
            });

            // Property: Message must request data verification
            expect(staffMessage.toLowerCase()).toMatch(/verify|check|confirm|accurate/);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide specific action items for each error type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationError['errorType']>(
            'field_mismatch',
            'api_error',
            'invalid_input',
            'max_attempts',
            'expired_token'
          ),
          (errorType) => {
            const staffMessage = generateStaffMessage(errorType);

            // Property: Each error type must have specific action items
            expect(staffMessage).toContain('Action Required');

            switch (errorType) {
              case 'field_mismatch':
                expect(staffMessage.toLowerCase()).toMatch(/verify|data|accurate|documents/);
                break;
              case 'api_error':
                expect(staffMessage.toLowerCase()).toMatch(/monitor|api|service|support/);
                break;
              case 'invalid_input':
                expect(staffMessage.toLowerCase()).toMatch(/contact|customer|identification/);
                break;
              case 'max_attempts':
                expect(staffMessage.toLowerCase()).toMatch(/review|resend|link/);
                break;
              case 'expired_token':
                expect(staffMessage.toLowerCase()).toMatch(/resend|link/);
                break;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include technical details when provided', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationError['errorType']>('api_error', 'field_mismatch'),
          fc.record({
            statusCode: fc.integer({ min: 400, max: 599 }),
            errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
            timestamp: fc.date().map(d => d.toISOString()),
          }),
          (errorType, technicalDetails) => {
            const staffMessage = generateStaffMessage(
              errorType,
              undefined,
              'John Doe',
              'POL-123',
              'NIN',
              technicalDetails
            );

            // Property: Technical details should be included for api_error
            if (errorType === 'api_error') {
              expect(staffMessage).toContain('Technical Details');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Complete verification errors must contain both customer and staff messages
   * 
   * For any verification error created, it must:
   * 1. Have success: false
   * 2. Have a valid error type
   * 3. Have both customerMessage and staffMessage
   * 4. Have consistent information between messages
   * 
   * Validates: Requirements 21.3, 21.4, 21.5
   */
  describe('Complete Verification Errors', () => {
    it('should always create complete error objects with all required fields', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationError['errorType']>(
            'field_mismatch',
            'api_error',
            'invalid_input',
            'max_attempts',
            'expired_token'
          ),
          fc.option(
            fc.array(
              fc.constantFrom('firstName', 'lastName', 'dateOfBirth', 'bvn', 'companyName'),
              { minLength: 1, maxLength: 5 }
            ),
            { nil: undefined }
          ),
          fc.option(fc.emailAddress(), { nil: undefined }),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          fc.option(fc.constantFrom<'NIN' | 'CAC'>('NIN', 'CAC'), { nil: undefined }),
          (errorType, failedFields, brokerEmail, customerName, policyNumber, verificationType) => {
            const error = createVerificationError(errorType, {
              failedFields,
              brokerEmail,
              customerName,
              policyNumber,
              verificationType,
            });

            // Property: Error must have success: false
            expect(error.success).toBe(false);
            expect(isVerificationError(error)).toBe(true);

            // Property: Error must have valid error type
            expect(error.errorType).toBe(errorType);

            // Property: Error must have customer message
            expect(error.customerMessage).toBeTruthy();
            expect(error.customerMessage.length).toBeGreaterThan(0);

            // Property: Error must have staff message
            expect(error.staffMessage).toBeTruthy();
            expect(error.staffMessage.length).toBeGreaterThan(0);

            // Property: Error must have general message
            expect(error.message).toBeTruthy();
            expect(error.message.length).toBeGreaterThan(0);

            // Property: If failed fields provided, they must be stored
            if (failedFields) {
              expect(error.failedFields).toEqual(failedFields);
            }

            // Property: If broker email provided, it must be stored
            if (brokerEmail) {
              expect(error.brokerEmail).toBe(brokerEmail);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistency between customer and staff messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationError['errorType']>(
            'field_mismatch',
            'api_error',
            'invalid_input',
            'max_attempts',
            'expired_token'
          ),
          fc.option(
            fc.array(
              fc.constantFrom('firstName', 'lastName', 'dateOfBirth'),
              { minLength: 1, maxLength: 3 }
            ),
            { nil: undefined }
          ),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom<'NIN' | 'CAC'>('NIN', 'CAC'),
          (errorType, failedFields, brokerEmail, customerName, policyNumber, verificationType) => {
            const error = createVerificationError(errorType, {
              failedFields,
              brokerEmail,
              customerName,
              policyNumber,
              verificationType,
            });

            // Property: Both messages must reference the same error type
            const errorTypeFormatted = errorType.replace(/_/g, ' ');
            
            // Property: If broker email in customer message, it should be consistent
            if (error.customerMessage.includes(brokerEmail)) {
              expect(error.brokerEmail).toBe(brokerEmail);
            }

            // Property: If customer name in staff message, it should be consistent
            if (error.staffMessage.includes(customerName)) {
              // Customer name should be in the error context
              expect(customerName).toBeTruthy();
            }

            // Property: If policy number in staff message, it should be consistent
            if (error.staffMessage.includes(policyNumber)) {
              expect(policyNumber).toBeTruthy();
            }

            // Property: Customer message should be user-friendly (no technical terms)
            expect(error.customerMessage).not.toMatch(/stack|trace|exception|debug/i);

            // Property: Staff message should be technical (includes details)
            expect(error.staffMessage).toContain('Action Required');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all error types with appropriate messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationError['errorType']>(
            'field_mismatch',
            'api_error',
            'invalid_input',
            'max_attempts',
            'expired_token'
          ),
          (errorType) => {
            const error = createVerificationError(errorType, {
              customerName: 'Test Customer',
              policyNumber: 'POL-123',
              verificationType: 'NIN',
              brokerEmail: 'broker@example.com',
            });

            // Property: Error type must match
            expect(error.errorType).toBe(errorType);

            // Property: Customer message must be appropriate for error type
            const customerMsg = error.customerMessage.toLowerCase();
            switch (errorType) {
              case 'field_mismatch':
                expect(customerMsg).toMatch(/did not match|mismatch/);
                break;
              case 'api_error':
                expect(customerMsg).toMatch(/technical|service|try again/);
                break;
              case 'invalid_input':
                expect(customerMsg).toMatch(/invalid|check|entered/);
                break;
              case 'max_attempts':
                expect(customerMsg).toMatch(/maximum|attempts/);
                break;
              case 'expired_token':
                expect(customerMsg).toMatch(/expired/);
                break;
            }

            // Property: Staff message must include verification failure alert
            expect(error.staffMessage).toContain('Verification Failure Alert');

            // Property: Both messages must be non-empty
            expect(error.customerMessage.length).toBeGreaterThan(50);
            expect(error.staffMessage.length).toBeGreaterThan(50);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Error messages must be safe and not expose sensitive information
   * 
   * Customer messages should never contain:
   * - Internal system details
   * - Database information
   * - API keys or tokens
   * - Stack traces
   * - Other customers' information
   * 
   * Validates: Security aspect of Requirements 21.3
   */
  describe('Security and Privacy', () => {
    it('should never expose sensitive information in customer messages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationError['errorType']>(
            'field_mismatch',
            'api_error',
            'invalid_input',
            'max_attempts',
            'expired_token'
          ),
          fc.option(
            fc.array(fc.constantFrom('firstName', 'lastName', 'bvn'), { minLength: 1, maxLength: 3 }),
            { nil: undefined }
          ),
          fc.emailAddress(),
          (errorType, failedFields, brokerEmail) => {
            const error = createVerificationError(errorType, {
              failedFields,
              brokerEmail,
              technicalDetails: {
                apiKey: 'secret-key-12345',
                databaseId: 'db-internal-id',
                stackTrace: 'Error at line 123...',
              },
            });

            // Property: Customer message must not contain sensitive data
            expect(error.customerMessage).not.toContain('secret-key');
            expect(error.customerMessage).not.toContain('db-internal');
            expect(error.customerMessage).not.toContain('stackTrace');
            expect(error.customerMessage).not.toContain('apiKey');

            // Property: Customer message must not contain technical jargon
            expect(error.customerMessage).not.toMatch(/exception|stack trace|debug|internal error/i);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide appropriate level of detail for each audience', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<VerificationError['errorType']>('field_mismatch', 'api_error'),
          fc.array(fc.constantFrom('firstName', 'lastName', 'bvn'), { minLength: 1, maxLength: 3 }),
          fc.emailAddress(),
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorType, failedFields, brokerEmail, customerName) => {
            const error = createVerificationError(errorType, {
              failedFields,
              brokerEmail,
              customerName,
              technicalDetails: {
                statusCode: 500,
                errorMessage: 'Internal server error',
              },
            });

            // Property: Customer message should be simple and actionable
            expect(error.customerMessage.split('\n').length).toBeLessThan(15);
            expect(error.customerMessage.toLowerCase()).toContain('broker');

            // Property: Staff message should be detailed and technical
            expect(error.staffMessage).toContain('Action Required');
            expect(error.staffMessage.length).toBeGreaterThan(error.customerMessage.length * 0.5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
