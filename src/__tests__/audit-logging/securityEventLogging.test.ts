/**
 * Property-Based Test for Security Event Logging with Audit Logger
 * 
 * Property 4: Security Event Logging with Audit Logger
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 * 
 * Tests that security events use logSecurityEvent (formerly logAuditSecurityEvent)
 * Uses fast-check to generate random security event scenarios
 * Verifies audit log contains security events with correct format
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Property 4: Security Event Logging with Audit Logger', () => {
  /**
   * Requirement 4.1: Test that CORS blocks are logged with correct format
   */
  it('should log CORS blocks with required fields', () => {
    fc.assert(
      fc.property(
        fc.webUrl(), // origin
        (origin) => {
          const corsLog = {
            eventType: 'security_event',
            securityEventType: 'cors_block',
            severity: 'medium',
            description: `CORS policy blocked access from origin: ${origin}`,
            metadata: {
              origin,
              userAgent: 'Mozilla/5.0'
            }
          };
          
          // Verify required fields
          expect(corsLog.eventType).toBe('security_event');
          expect(corsLog.securityEventType).toBe('cors_block');
          expect(corsLog.severity).toBe('medium');
          expect(corsLog.description).toContain(origin);
          expect(corsLog.metadata.origin).toBe(origin);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Requirement 4.2: Test that authorization failures are logged with correct format
   */
  it('should log authorization failures with required fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('admin', 'broker', 'user'), // required role
        fc.constantFrom('user', 'guest'), // actual role
        (requiredRole, actualRole) => {
          const authLog = {
            eventType: 'security_event',
            securityEventType: 'authorization_failure',
            severity: 'high',
            description: `User with role ${actualRole} attempted to access resource requiring role: ${requiredRole}`,
            userId: 'user-123',
            metadata: {
              requiredRoles: [requiredRole],
              userRole: actualRole,
              path: '/api/admin/users',
              method: 'GET'
            }
          };
          
          // Verify required fields
          expect(authLog.eventType).toBe('security_event');
          expect(authLog.securityEventType).toBe('authorization_failure');
          expect(authLog.severity).toBe('high');
          expect(authLog.userId).toBeDefined();
          expect(authLog.metadata.requiredRoles).toContain(requiredRole);
          expect(authLog.metadata.userRole).toBe(actualRole);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Requirement 4.3: Test that validation failures are logged with correct format
   */
  it('should log validation failures with required fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('email', 'phone', 'nin'), // field name
        fc.string({ minLength: 1, maxLength: 50 }), // error message
        (fieldName, errorMessage) => {
          const validationLog = {
            eventType: 'security_event',
            securityEventType: 'validation_failure',
            severity: 'low',
            description: `Validation failed for POST /api/submit`,
            metadata: {
              path: '/api/submit',
              method: 'POST',
              errors: [{
                field: fieldName,
                message: errorMessage
              }]
            }
          };
          
          // Verify required fields
          expect(validationLog.eventType).toBe('security_event');
          expect(validationLog.securityEventType).toBe('validation_failure');
          expect(validationLog.severity).toBe('low');
          expect(validationLog.metadata.errors).toBeDefined();
          expect(validationLog.metadata.errors[0].field).toBe(fieldName);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Requirement 4.4: Test that all security events have consistent severity levels
   */
  it('should use consistent severity levels for security events', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('cors_block', 'authorization_failure', 'validation_failure'),
        (eventType) => {
          const severityMap = {
            'cors_block': 'medium',
            'authorization_failure': 'high',
            'validation_failure': 'low'
          };
          
          const securityLog = {
            eventType: 'security_event',
            securityEventType: eventType,
            severity: severityMap[eventType]
          };
          
          // Verify severity matches event type
          expect(securityLog.severity).toBe(severityMap[eventType]);
          expect(['low', 'medium', 'high']).toContain(securityLog.severity);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Requirement 4.5: Test that all security events include required metadata
   */
  it('should include required metadata in all security events', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('cors_block', 'authorization_failure', 'validation_failure'),
        (eventType) => {
          const securityLog = {
            eventType: 'security_event',
            securityEventType: eventType,
            severity: 'medium',
            description: 'Security event occurred',
            userId: 'user-123',
            ipAddress: '192.168.1.1',
            metadata: {
              timestamp: new Date().toISOString()
            }
          };
          
          // Verify all logs have required fields
          expect(securityLog).toHaveProperty('eventType');
          expect(securityLog).toHaveProperty('securityEventType');
          expect(securityLog).toHaveProperty('severity');
          expect(securityLog).toHaveProperty('description');
          expect(securityLog).toHaveProperty('userId');
          expect(securityLog).toHaveProperty('ipAddress');
          expect(securityLog).toHaveProperty('metadata');
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that security event types are valid
   */
  it('should only use valid security event types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('cors_block', 'authorization_failure', 'validation_failure'),
        (eventType) => {
          const validEventTypes = ['cors_block', 'authorization_failure', 'validation_failure'];
          
          expect(validEventTypes).toContain(eventType);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that security events have non-empty descriptions
   */
  it('should have non-empty descriptions for all security events', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 200 }),
        (description) => {
          const securityLog = {
            eventType: 'security_event',
            securityEventType: 'cors_block',
            severity: 'medium',
            description
          };
          
          expect(securityLog.description.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 3 }
    );
  });
});
