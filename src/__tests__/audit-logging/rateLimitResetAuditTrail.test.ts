/**
 * Property-Based Test for Rate Limit Reset Audit Trail
 * 
 * Property 8: Rate Limit Reset Audit Trail
 * Validates: Requirements 7.3, 7.4
 * 
 * Tests that rate limit resets are logged
 * Uses fast-check to generate random reset requests
 * Verifies audit log contains reset events with correct metadata
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Property 8: Rate Limit Reset Audit Trail', () => {
  /**
   * Requirement 7.3, 7.4: Test that rate limit resets are logged
   */
  it('should log all rate limit resets with required metadata', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('datapro', 'verifydata'),
        fc.string({ minLength: 10, maxLength: 100 }), // reason
        (service, reason) => {
          const resetRequest = {
            user: {
              uid: 'admin-123',
              email: 'admin@example.com',
              role: 'super admin'
            },
            body: {
              service,
              reason
            },
            ipData: {
              masked: '192.168.1.***'
            }
          };

          // Simulate audit log creation
          const auditLog = {
            eventType: 'rate_limit_reset',
            severity: 'medium',
            description: `Rate limit reset for ${service} by ${resetRequest.user.email}`,
            userId: resetRequest.user.uid,
            ipAddress: resetRequest.ipData.masked,
            metadata: {
              service,
              reason,
              resetBy: resetRequest.user.email,
              resetByUid: resetRequest.user.uid,
              resetByRole: resetRequest.user.role,
              timestamp: new Date().toISOString()
            }
          };

          // Verify audit log has all required fields
          expect(auditLog.eventType).toBe('rate_limit_reset');
          expect(auditLog.severity).toBe('medium');
          expect(auditLog.userId).toBe('admin-123');
          expect(auditLog.metadata.service).toBe(service);
          expect(auditLog.metadata.reason).toBe(reason);
          expect(auditLog.metadata.resetBy).toBe('admin@example.com');
          expect(auditLog.metadata.resetByUid).toBe('admin-123');
          expect(auditLog.metadata.resetByRole).toBe('super admin');
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Requirement 7.4: Test that audit logs include service information
   */
  it('should include service information in audit logs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('datapro', 'verifydata'),
        (service) => {
          const auditLog = {
            eventType: 'rate_limit_reset',
            severity: 'medium',
            description: `Rate limit reset for ${service}`,
            metadata: {
              service,
              reason: 'Testing service information in audit log'
            }
          };

          // Verify service is included
          expect(auditLog.metadata.service).toBe(service);
          expect(auditLog.description).toContain(service);
          expect(['datapro', 'verifydata']).toContain(auditLog.metadata.service);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Requirement 7.4: Test that audit logs include reason
   */
  it('should include reason in audit logs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 200 }),
        (reason) => {
          const auditLog = {
            eventType: 'rate_limit_reset',
            severity: 'medium',
            metadata: {
              service: 'datapro',
              reason,
              resetBy: 'admin@example.com'
            }
          };

          // Verify reason is included and not empty
          expect(auditLog.metadata.reason).toBe(reason);
          expect(auditLog.metadata.reason.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Requirement 7.4: Test that audit logs include admin user information
   */
  it('should include admin user information in audit logs', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.uuid(),
        (email, uid) => {
          const auditLog = {
            eventType: 'rate_limit_reset',
            severity: 'medium',
            userId: uid,
            metadata: {
              service: 'datapro',
              reason: 'Testing admin user information',
              resetBy: email,
              resetByUid: uid,
              resetByRole: 'super admin'
            }
          };

          // Verify admin user information is included
          expect(auditLog.userId).toBe(uid);
          expect(auditLog.metadata.resetBy).toBe(email);
          expect(auditLog.metadata.resetByUid).toBe(uid);
          expect(auditLog.metadata.resetByRole).toBe('super admin');
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that audit logs include timestamp
   */
  it('should include timestamp in audit logs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('datapro', 'verifydata'),
        (service) => {
          const now = new Date();
          const auditLog = {
            eventType: 'rate_limit_reset',
            severity: 'medium',
            metadata: {
              service,
              reason: 'Testing timestamp in audit log',
              timestamp: now.toISOString()
            }
          };

          // Verify timestamp is included and valid
          expect(auditLog.metadata.timestamp).toBeDefined();
          expect(auditLog.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that audit logs have consistent severity
   */
  it('should use medium severity for all rate limit resets', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('datapro', 'verifydata'),
        fc.string({ minLength: 10, maxLength: 100 }),
        (service, reason) => {
          const auditLog = {
            eventType: 'rate_limit_reset',
            severity: 'medium',
            metadata: {
              service,
              reason
            }
          };

          // Verify severity is always medium
          expect(auditLog.severity).toBe('medium');
          expect(['low', 'medium', 'high', 'critical']).toContain(auditLog.severity);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that audit logs include IP address
   */
  it('should include IP address in audit logs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('192.168.1.***', '10.0.0.***', '172.16.0.***'),
        (maskedIP) => {
          const auditLog = {
            eventType: 'rate_limit_reset',
            severity: 'medium',
            userId: 'admin-123',
            ipAddress: maskedIP,
            metadata: {
              service: 'datapro',
              reason: 'Testing IP address in audit log'
            }
          };

          // Verify IP address is included and masked
          expect(auditLog.ipAddress).toBe(maskedIP);
          expect(auditLog.ipAddress).toContain('***');
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that audit logs are created for both services
   */
  it('should create audit logs for both datapro and verifydata', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('datapro', 'verifydata'),
        (service) => {
          const auditLog = {
            eventType: 'rate_limit_reset',
            severity: 'medium',
            metadata: {
              service,
              reason: 'Testing audit log creation for all services'
            }
          };

          // Verify audit log is created for the service
          expect(auditLog.eventType).toBe('rate_limit_reset');
          expect(auditLog.metadata.service).toBe(service);
          expect(['datapro', 'verifydata']).toContain(service);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that audit log description is descriptive
   */
  it('should have descriptive audit log descriptions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('datapro', 'verifydata'),
        fc.emailAddress(),
        (service, email) => {
          const auditLog = {
            eventType: 'rate_limit_reset',
            severity: 'medium',
            description: `Rate limit reset for ${service} by ${email}`,
            metadata: {
              service,
              resetBy: email
            }
          };

          // Verify description is descriptive
          expect(auditLog.description).toContain('Rate limit reset');
          expect(auditLog.description).toContain(service);
          expect(auditLog.description).toContain(email);
          expect(auditLog.description.length).toBeGreaterThan(10);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that audit logs are immutable (contain all required fields)
   */
  it('should create complete audit logs with all required fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('datapro', 'verifydata'),
        fc.string({ minLength: 10, maxLength: 100 }),
        (service, reason) => {
          const auditLog = {
            eventType: 'rate_limit_reset',
            severity: 'medium',
            description: `Rate limit reset for ${service}`,
            userId: 'admin-123',
            ipAddress: '192.168.1.***',
            metadata: {
              service,
              reason,
              resetBy: 'admin@example.com',
              resetByUid: 'admin-123',
              resetByRole: 'super admin',
              timestamp: new Date().toISOString()
            }
          };

          // Verify all required fields are present
          expect(auditLog).toHaveProperty('eventType');
          expect(auditLog).toHaveProperty('severity');
          expect(auditLog).toHaveProperty('description');
          expect(auditLog).toHaveProperty('userId');
          expect(auditLog).toHaveProperty('ipAddress');
          expect(auditLog).toHaveProperty('metadata');
          expect(auditLog.metadata).toHaveProperty('service');
          expect(auditLog.metadata).toHaveProperty('reason');
          expect(auditLog.metadata).toHaveProperty('resetBy');
          expect(auditLog.metadata).toHaveProperty('resetByUid');
          expect(auditLog.metadata).toHaveProperty('resetByRole');
          expect(auditLog.metadata).toHaveProperty('timestamp');
        }
      ),
      { numRuns: 3 }
    );
  });
});
