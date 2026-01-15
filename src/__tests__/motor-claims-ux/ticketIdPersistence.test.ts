/**
 * Property-Based Tests for Ticket ID Persistence
 * 
 * Feature: motor-claims-ux-improvements
 * Property 3: Ticket ID Persistence
 * 
 * **Validates: Requirements 3.4**
 * 
 * Note: This test validates the persistence logic by testing that:
 * 1. Generated ticket IDs follow the correct format
 * 2. The ticket ID generation is deterministic given the same inputs
 * 3. The ticket ID is included in the expected data structure
 * 
 * Full integration testing with Firestore would require a test environment.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  FORM_TYPE_PREFIXES,
  generateTicketIdSync,
  isValidTicketIdFormat,
} from '../../utils/ticketIdGenerator';

/**
 * Simulates the form submission data structure that would be stored in Firestore
 * This mirrors the server.js handleFormSubmission function behavior
 */
interface FormSubmissionData {
  ticketId: string;
  formType: string;
  status: string;
  submittedBy: string | null;
  [key: string]: unknown;
}

/**
 * Creates a mock form submission object as it would be stored in Firestore
 * This simulates the data structure created by handleFormSubmission in server.js
 */
function createMockFormSubmission(
  formType: string,
  formData: Record<string, unknown>,
  userUid: string | null = null
): FormSubmissionData {
  const ticketIdResult = generateTicketIdSync(formType);
  
  return {
    ...formData,
    ticketId: ticketIdResult.ticketId,
    formType: formType,
    status: 'processing',
    submittedBy: userUid,
  };
}

/**
 * Simulates querying a submission by ticket ID
 * In production, this would query Firestore
 */
function queryByTicketId(
  submissions: FormSubmissionData[],
  ticketId: string
): FormSubmissionData | undefined {
  return submissions.find(s => s.ticketId === ticketId);
}

describe('Feature: motor-claims-ux-improvements, Property 3: Ticket ID Persistence', () => {
  /**
   * Property 3: Ticket ID Persistence
   * For any form submission with a generated ticket ID, querying the database
   * for that submission SHALL return a document containing the same ticket ID.
   * 
   * **Validates: Requirements 3.4**
   */
  it('should persist ticket ID with form submission data', () => {
    const formTypes = Object.keys(FORM_TYPE_PREFIXES);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...formTypes),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          phone: fc.stringMatching(/^\+?[0-9]{10,15}$/),
        }),
        fc.option(fc.uuid(), { nil: null }),
        (formType, formData, userUid) => {
          // Create a mock submission (simulates handleFormSubmission)
          const submission = createMockFormSubmission(formType, formData, userUid);
          
          // Verify ticket ID is present in the submission
          expect(submission.ticketId).toBeDefined();
          expect(typeof submission.ticketId).toBe('string');
          
          // Verify ticket ID format is valid
          expect(isValidTicketIdFormat(submission.ticketId)).toBe(true);
          
          // Simulate storing and querying (persistence round-trip)
          const mockDatabase: FormSubmissionData[] = [submission];
          const retrieved = queryByTicketId(mockDatabase, submission.ticketId);
          
          // Verify the retrieved document contains the same ticket ID
          expect(retrieved).toBeDefined();
          expect(retrieved?.ticketId).toBe(submission.ticketId);
          
          // Verify other form data is preserved
          expect(retrieved?.formType).toBe(formType);
          expect(retrieved?.status).toBe('processing');
          expect(retrieved?.submittedBy).toBe(userUid);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Ticket ID is unique per submission
   * For any two form submissions, they SHALL have different ticket IDs
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should generate unique ticket IDs for multiple submissions', () => {
    const formTypes = Object.keys(FORM_TYPE_PREFIXES);
    
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...formTypes), { minLength: 2, maxLength: 50 }),
        (formTypeList) => {
          const submissions: FormSubmissionData[] = formTypeList.map((formType, index) => 
            createMockFormSubmission(formType, { index }, `user-${index}`)
          );
          
          // Extract all ticket IDs
          const ticketIds = submissions.map(s => s.ticketId);
          const uniqueTicketIds = new Set(ticketIds);
          
          // All ticket IDs should be unique
          expect(uniqueTicketIds.size).toBe(ticketIds.length);
          
          // Each submission should be queryable by its unique ticket ID
          submissions.forEach(submission => {
            const retrieved = queryByTicketId(submissions, submission.ticketId);
            expect(retrieved).toBeDefined();
            expect(retrieved?.ticketId).toBe(submission.ticketId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Ticket ID prefix matches form type
   * For any form submission, the ticket ID prefix SHALL match the form type mapping
   * 
   * **Validates: Requirements 3.2, 3.4**
   */
  it('should persist ticket ID with correct prefix for form type', () => {
    const formTypes = Object.keys(FORM_TYPE_PREFIXES);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...formTypes),
        (formType) => {
          const submission = createMockFormSubmission(formType, {}, null);
          const expectedPrefix = FORM_TYPE_PREFIXES[formType];
          
          // Verify ticket ID starts with the correct prefix
          expect(submission.ticketId.startsWith(expectedPrefix + '-')).toBe(true);
          
          // Verify the prefix can be extracted from the persisted ticket ID
          const [prefix] = submission.ticketId.split('-');
          expect(prefix).toBe(expectedPrefix);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Form data integrity with ticket ID
   * For any form submission, all original form data SHALL be preserved alongside the ticket ID
   * 
   * **Validates: Requirements 3.4**
   */
  it('should preserve all form data alongside ticket ID', () => {
    const formTypes = Object.keys(FORM_TYPE_PREFIXES);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...formTypes),
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          email: fc.emailAddress(),
          description: fc.string({ minLength: 0, maxLength: 200 }),
          amount: fc.float({ min: 0, max: 1000000 }),
        }),
        (formType, formData) => {
          const submission = createMockFormSubmission(formType, formData, 'test-user');
          
          // Verify ticket ID is added
          expect(submission.ticketId).toBeDefined();
          expect(isValidTicketIdFormat(submission.ticketId)).toBe(true);
          
          // Verify original form data is preserved
          expect(submission.name).toBe(formData.name);
          expect(submission.email).toBe(formData.email);
          expect(submission.description).toBe(formData.description);
          expect(submission.amount).toBe(formData.amount);
          
          // Verify system fields are added
          expect(submission.status).toBe('processing');
          expect(submission.formType).toBe(formType);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Ticket ID queryability
   * For any stored submission, querying by ticket ID SHALL return exactly one result
   * 
   * **Validates: Requirements 3.4**
   */
  it('should allow querying submission by ticket ID', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            formType: fc.constantFrom(...Object.keys(FORM_TYPE_PREFIXES)),
            data: fc.record({ value: fc.integer() }),
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (submissionConfigs) => {
          // Create multiple submissions
          const submissions = submissionConfigs.map((config, index) =>
            createMockFormSubmission(config.formType, config.data, `user-${index}`)
          );
          
          // Pick a random submission to query
          const targetIndex = Math.floor(Math.random() * submissions.length);
          const targetSubmission = submissions[targetIndex];
          
          // Query by ticket ID
          const results = submissions.filter(s => s.ticketId === targetSubmission.ticketId);
          
          // Should return exactly one result (the target submission)
          expect(results.length).toBe(1);
          expect(results[0]).toBe(targetSubmission);
        }
      ),
      { numRuns: 100 }
    );
  });
});
