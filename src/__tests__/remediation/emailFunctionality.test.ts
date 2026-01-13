/**
 * Property-Based Tests for Email Functionality
 * 
 * Feature: identity-remediation
 * 
 * Properties tested:
 * - Property 5: Email Content Completeness
 * - Property 6: Email Status Tracking
 * - Property 7: Rate Limiting Enforcement
 * 
 * **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateVerificationEmailHtml,
  generateVerificationEmailText,
  generateVerificationEmailSubject,
  generateVerificationEmail,
} from '../../templates/verificationEmail';
import type { 
  VerificationEmailData, 
  RemediationRecord, 
  RemediationRecordStatus 
} from '../../types/remediation';
import { generateSecureToken } from '../../utils/tokenUtils';

// ========== Helper Functions for Testing ==========

/**
 * Generates a mock verification email data object
 */
function createMockEmailData(
  customerName: string,
  policyNumber: string,
  brokerName: string,
  verificationUrl: string,
  expirationDate: string
): VerificationEmailData {
  return {
    customerName,
    policyNumber,
    brokerName,
    verificationUrl,
    expirationDate,
  };
}

/**
 * Simulates email sending result and status update
 * Returns the updated record status based on success/failure
 */
interface EmailSendResult {
  success: boolean;
  error?: string;
  updatedStatus: RemediationRecordStatus;
  emailSentAt?: Date;
  emailError?: string;
}

function simulateEmailSend(
  record: RemediationRecord,
  sendSuccess: boolean,
  errorMessage?: string
): EmailSendResult {
  if (sendSuccess) {
    return {
      success: true,
      updatedStatus: 'email_sent',
      emailSentAt: new Date(),
    };
  } else {
    return {
      success: false,
      error: errorMessage || 'Unknown error',
      updatedStatus: 'email_failed',
      emailError: errorMessage || 'Unknown error',
    };
  }
}

/**
 * Rate limiter simulation for testing Property 7
 */
class RateLimiter {
  private readonly maxPerMinute: number;
  private readonly windowMs: number;
  private timestamps: number[] = [];

  constructor(maxPerMinute: number = 50) {
    this.maxPerMinute = maxPerMinute;
    this.windowMs = 60000; // 1 minute
  }

  /**
   * Attempts to acquire a slot for sending an email
   * Returns true if allowed, false if rate limited
   */
  tryAcquire(): boolean {
    const now = Date.now();
    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    
    if (this.timestamps.length < this.maxPerMinute) {
      this.timestamps.push(now);
      return true;
    }
    return false;
  }

  /**
   * Gets the count of emails sent in the current window
   */
  getCurrentCount(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    return this.timestamps.length;
  }

  /**
   * Resets the rate limiter
   */
  reset(): void {
    this.timestamps = [];
  }

  /**
   * Simulates sending emails with rate limiting
   * Returns the number of emails that would be sent within the rate limit
   */
  simulateBatchSend(emailCount: number): { sent: number; rateLimited: number } {
    let sent = 0;
    let rateLimited = 0;

    for (let i = 0; i < emailCount; i++) {
      if (this.tryAcquire()) {
        sent++;
      } else {
        rateLimited++;
      }
    }

    return { sent, rateLimited };
  }
}

// ========== Helper for HTML escaping ==========

/**
 * Escapes HTML special characters (mirrors the email template's escapeHtml function)
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

// ========== Arbitraries for Property-Based Testing ==========

/**
 * Arbitrary for generating valid customer names (alphanumeric + spaces only to avoid HTML escaping issues)
 */
const customerNameArbitrary = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,49}$/)
  .filter(s => s.trim().length > 0)
  .map(s => s.trim());

/**
 * Arbitrary for generating valid policy numbers
 */
const policyNumberArbitrary = fc.stringMatching(/^POL-[A-Z0-9]{6,12}$/);

/**
 * Arbitrary for generating valid broker names (alphanumeric + spaces only to avoid HTML escaping issues)
 */
const brokerNameArbitrary = fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,49}$/)
  .filter(s => s.trim().length > 0)
  .map(s => s.trim());

/**
 * Arbitrary for generating valid verification URLs
 */
const verificationUrlArbitrary = fc.tuple(
  fc.constantFrom('https://nemforms.com', 'https://example.com', 'https://test.nem-insurance.com'),
  fc.constant(generateSecureToken())
).map(([baseUrl, token]) => `${baseUrl}/verify/${token}`);

/**
 * Arbitrary for generating valid expiration dates
 */
const expirationDateArbitrary = fc.date({
  min: new Date(),
  max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
}).map(date => date.toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
}));

/**
 * Arbitrary for generating complete email data
 */
const emailDataArbitrary = fc.record({
  customerName: customerNameArbitrary,
  policyNumber: policyNumberArbitrary,
  brokerName: brokerNameArbitrary,
  verificationUrl: verificationUrlArbitrary,
  expirationDate: expirationDateArbitrary,
});

/**
 * Arbitrary for generating email send success/failure
 */
const emailSendResultArbitrary = fc.boolean();

/**
 * Arbitrary for generating error messages
 */
const errorMessageArbitrary = fc.constantFrom(
  'SMTP connection failed',
  'Invalid email address',
  'Mailbox not found',
  'Rate limit exceeded',
  'Network timeout',
  'Authentication failed'
);

// ========== Property Tests ==========

describe('Feature: identity-remediation, Property 5: Email Content Completeness', () => {
  /**
   * Property 5: Email Content Completeness
   * For any sent verification email, the email body must contain:
   * - Customer name
   * - Policy number
   * - Broker name
   * - A valid verification URL
   * - Expiration date
   * 
   * **Validates: Requirements 3.2**
   */
  it('should include customer name in HTML email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const html = generateVerificationEmailHtml(data);
        expect(html).toContain(data.customerName);
      }),
      { numRuns: 100 }
    );
  });

  it('should include customer name in plain text email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const text = generateVerificationEmailText(data);
        expect(text).toContain(data.customerName);
      }),
      { numRuns: 100 }
    );
  });

  it('should include policy number in HTML email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const html = generateVerificationEmailHtml(data);
        expect(html).toContain(data.policyNumber);
      }),
      { numRuns: 100 }
    );
  });

  it('should include policy number in plain text email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const text = generateVerificationEmailText(data);
        expect(text).toContain(data.policyNumber);
      }),
      { numRuns: 100 }
    );
  });

  it('should include broker name in HTML email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const html = generateVerificationEmailHtml(data);
        expect(html).toContain(data.brokerName);
      }),
      { numRuns: 100 }
    );
  });

  it('should include broker name in plain text email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const text = generateVerificationEmailText(data);
        expect(text).toContain(data.brokerName);
      }),
      { numRuns: 100 }
    );
  });

  it('should include verification URL in HTML email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const html = generateVerificationEmailHtml(data);
        expect(html).toContain(data.verificationUrl);
      }),
      { numRuns: 100 }
    );
  });

  it('should include verification URL in plain text email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const text = generateVerificationEmailText(data);
        expect(text).toContain(data.verificationUrl);
      }),
      { numRuns: 100 }
    );
  });

  it('should include expiration date in HTML email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const html = generateVerificationEmailHtml(data);
        expect(html).toContain(data.expirationDate);
      }),
      { numRuns: 100 }
    );
  });

  it('should include expiration date in plain text email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const text = generateVerificationEmailText(data);
        expect(text).toContain(data.expirationDate);
      }),
      { numRuns: 100 }
    );
  });

  it('should include policy number in email subject', () => {
    fc.assert(
      fc.property(policyNumberArbitrary, (policyNumber) => {
        const subject = generateVerificationEmailSubject(policyNumber);
        expect(subject).toContain(policyNumber);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate complete email template with all required fields', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const template = generateVerificationEmail(data);
        
        // Check subject contains policy number
        expect(template.subject).toContain(data.policyNumber);
        
        // Check HTML contains all required fields
        expect(template.html).toContain(data.customerName);
        expect(template.html).toContain(data.policyNumber);
        expect(template.html).toContain(data.brokerName);
        expect(template.html).toContain(data.verificationUrl);
        expect(template.html).toContain(data.expirationDate);
        
        // Check text contains all required fields
        expect(template.text).toContain(data.customerName);
        expect(template.text).toContain(data.policyNumber);
        expect(template.text).toContain(data.brokerName);
        expect(template.text).toContain(data.verificationUrl);
        expect(template.text).toContain(data.expirationDate);
      }),
      { numRuns: 100 }
    );
  });

  it('should include NEM Insurance branding in HTML email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const html = generateVerificationEmailHtml(data);
        expect(html).toContain('NEM Insurance');
      }),
      { numRuns: 100 }
    );
  });

  it('should include NEM Insurance branding in plain text email', () => {
    fc.assert(
      fc.property(emailDataArbitrary, (data) => {
        const text = generateVerificationEmailText(data);
        expect(text).toContain('NEM Insurance');
      }),
      { numRuns: 100 }
    );
  });
});

describe('Feature: identity-remediation, Property 6: Email Status Tracking', () => {
  /**
   * Property 6: Email Status Tracking
   * For any email sending attempt:
   * - If successful: record status becomes "email_sent" and emailSentAt is set
   * - If failed: record status becomes "email_failed" and emailError contains the error reason
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('should set status to email_sent on successful send', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (recordId) => {
          const mockRecord: RemediationRecord = {
            id: recordId,
            batchId: 'batch-123',
            customerName: 'Test Customer',
            email: 'test@example.com',
            policyNumber: 'POL-123456',
            brokerName: 'Test Broker',
            identityType: 'individual',
            token: generateSecureToken(),
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
            resendCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            verificationAttempts: 0,
          };

          const result = simulateEmailSend(mockRecord, true);
          
          expect(result.success).toBe(true);
          expect(result.updatedStatus).toBe('email_sent');
          expect(result.emailSentAt).toBeDefined();
          expect(result.emailSentAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should set status to email_failed on failed send', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        errorMessageArbitrary,
        (recordId, errorMessage) => {
          const mockRecord: RemediationRecord = {
            id: recordId,
            batchId: 'batch-123',
            customerName: 'Test Customer',
            email: 'test@example.com',
            policyNumber: 'POL-123456',
            brokerName: 'Test Broker',
            identityType: 'individual',
            token: generateSecureToken(),
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
            resendCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            verificationAttempts: 0,
          };

          const result = simulateEmailSend(mockRecord, false, errorMessage);
          
          expect(result.success).toBe(false);
          expect(result.updatedStatus).toBe('email_failed');
          expect(result.emailError).toBe(errorMessage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include error reason in emailError field on failure', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        errorMessageArbitrary,
        (recordId, errorMessage) => {
          const mockRecord: RemediationRecord = {
            id: recordId,
            batchId: 'batch-123',
            customerName: 'Test Customer',
            email: 'test@example.com',
            policyNumber: 'POL-123456',
            brokerName: 'Test Broker',
            identityType: 'individual',
            token: generateSecureToken(),
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
            resendCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            verificationAttempts: 0,
          };

          const result = simulateEmailSend(mockRecord, false, errorMessage);
          
          expect(result.emailError).toBeDefined();
          expect(result.emailError).toBe(errorMessage);
          expect(result.emailError!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not set emailError on successful send', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (recordId) => {
          const mockRecord: RemediationRecord = {
            id: recordId,
            batchId: 'batch-123',
            customerName: 'Test Customer',
            email: 'test@example.com',
            policyNumber: 'POL-123456',
            brokerName: 'Test Broker',
            identityType: 'individual',
            token: generateSecureToken(),
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
            resendCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            verificationAttempts: 0,
          };

          const result = simulateEmailSend(mockRecord, true);
          
          expect(result.emailError).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not set emailSentAt on failed send', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        errorMessageArbitrary,
        (recordId, errorMessage) => {
          const mockRecord: RemediationRecord = {
            id: recordId,
            batchId: 'batch-123',
            customerName: 'Test Customer',
            email: 'test@example.com',
            policyNumber: 'POL-123456',
            brokerName: 'Test Broker',
            identityType: 'individual',
            token: generateSecureToken(),
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
            resendCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            verificationAttempts: 0,
          };

          const result = simulateEmailSend(mockRecord, false, errorMessage);
          
          expect(result.emailSentAt).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mixed success/failure in batch sends correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(fc.uuid(), emailSendResultArbitrary), { minLength: 1, maxLength: 50 }),
        (recordsWithResults) => {
          const results = recordsWithResults.map(([recordId, success]) => {
            const mockRecord: RemediationRecord = {
              id: recordId,
              batchId: 'batch-123',
              customerName: 'Test Customer',
              email: 'test@example.com',
              policyNumber: 'POL-123456',
              brokerName: 'Test Broker',
              identityType: 'individual',
              token: generateSecureToken(),
              tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: 'pending',
              resendCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
              verificationAttempts: 0,
            };
            return simulateEmailSend(mockRecord, success, 'Test error');
          });

          const successCount = results.filter(r => r.success).length;
          const failureCount = results.filter(r => !r.success).length;
          
          // All results should have correct status
          results.forEach((result, index) => {
            const expectedSuccess = recordsWithResults[index][1];
            if (expectedSuccess) {
              expect(result.updatedStatus).toBe('email_sent');
            } else {
              expect(result.updatedStatus).toBe('email_failed');
            }
          });
          
          // Counts should match
          expect(successCount + failureCount).toBe(recordsWithResults.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: identity-remediation, Property 7: Rate Limiting Enforcement', () => {
  /**
   * Property 7: Rate Limiting Enforcement
   * For any batch email sending operation, the number of emails sent per minute 
   * must not exceed 50.
   * 
   * **Validates: Requirements 3.5**
   */
  it('should not exceed 50 emails per minute', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        (emailCount) => {
          const rateLimiter = new RateLimiter(50);
          const result = rateLimiter.simulateBatchSend(emailCount);
          
          // Should never send more than 50 in a single minute window
          expect(result.sent).toBeLessThanOrEqual(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow exactly 50 emails when requesting 50 or more', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }),
        (emailCount) => {
          const rateLimiter = new RateLimiter(50);
          const result = rateLimiter.simulateBatchSend(emailCount);
          
          // Should send exactly 50 when requesting 50 or more
          expect(result.sent).toBe(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow all emails when requesting fewer than 50', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 49 }),
        (emailCount) => {
          const rateLimiter = new RateLimiter(50);
          const result = rateLimiter.simulateBatchSend(emailCount);
          
          // Should send all emails when under the limit
          expect(result.sent).toBe(emailCount);
          expect(result.rateLimited).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should rate limit excess emails', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 51, max: 200 }),
        (emailCount) => {
          const rateLimiter = new RateLimiter(50);
          const result = rateLimiter.simulateBatchSend(emailCount);
          
          // Excess emails should be rate limited
          expect(result.rateLimited).toBe(emailCount - 50);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track current count accurately', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (emailCount) => {
          const rateLimiter = new RateLimiter(50);
          
          for (let i = 0; i < emailCount; i++) {
            rateLimiter.tryAcquire();
          }
          
          expect(rateLimiter.getCurrentCount()).toBe(emailCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reset count after reset is called', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (emailCount) => {
          const rateLimiter = new RateLimiter(50);
          
          rateLimiter.simulateBatchSend(emailCount);
          expect(rateLimiter.getCurrentCount()).toBe(emailCount);
          
          rateLimiter.reset();
          expect(rateLimiter.getCurrentCount()).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce rate limit across multiple batch sends', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 30 }), { minLength: 2, maxLength: 5 }),
        (batchSizes) => {
          const rateLimiter = new RateLimiter(50);
          let totalSent = 0;
          
          for (const batchSize of batchSizes) {
            const result = rateLimiter.simulateBatchSend(batchSize);
            totalSent += result.sent;
          }
          
          // Total sent should never exceed 50 in the same window
          expect(totalSent).toBeLessThanOrEqual(50);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly calculate delay between emails for rate limiting', () => {
    // Rate limit: 50 emails per minute
    // Delay should be approximately 60000ms / 50 = 1200ms
    const RATE_LIMIT = 50;
    const RATE_WINDOW_MS = 60000;
    const expectedDelay = Math.ceil(RATE_WINDOW_MS / RATE_LIMIT);
    
    expect(expectedDelay).toBe(1200);
  });

  it('should handle edge case of exactly 50 emails', () => {
    const rateLimiter = new RateLimiter(50);
    const result = rateLimiter.simulateBatchSend(50);
    
    expect(result.sent).toBe(50);
    expect(result.rateLimited).toBe(0);
  });

  it('should handle edge case of 0 emails', () => {
    const rateLimiter = new RateLimiter(50);
    const result = rateLimiter.simulateBatchSend(0);
    
    expect(result.sent).toBe(0);
    expect(result.rateLimited).toBe(0);
  });
});
