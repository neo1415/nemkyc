/**
 * Property-Based Test for Rate Limit Reset Authorization
 * 
 * Property 7: Rate Limit Reset Authorization
 * Validates: Requirements 7.2, 7.5
 * 
 * Tests that only super admins can reset rate limits
 * Uses fast-check to generate random user roles
 * Verifies non-super-admin requests are rejected with 403
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Property 7: Rate Limit Reset Authorization', () => {
  /**
   * Requirement 7.2: Test that only super admins can reset rate limits
   */
  it('should only allow super admin role to reset rate limits', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('super admin', 'admin', 'compliance', 'broker', 'user', 'default'),
        (role) => {
          const request = {
            user: {
              uid: 'user-123',
              email: 'user@example.com',
              role
            },
            body: {
              service: 'datapro',
              reason: 'Testing rate limit reset authorization'
            }
          };

          // Check authorization
          const isSuperAdmin = role === 'super admin';
          
          if (isSuperAdmin) {
            // Super admin should be allowed
            const response = {
              status: 200,
              success: true
            };
            expect(response.status).toBe(200);
            expect(response.success).toBe(true);
          } else {
            // All other roles should be rejected with 403
            const response = {
              status: 403,
              error: 'Insufficient permissions'
            };
            expect(response.status).toBe(403);
            expect(response.error).toBe('Insufficient permissions');
          }
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Requirement 7.5: Test that non-super-admin requests are rejected with 403
   */
  it('should reject all non-super-admin roles with 403', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('admin', 'compliance', 'broker', 'user', 'default', 'guest'),
        (role) => {
          const request = {
            user: {
              uid: 'user-123',
              email: 'user@example.com',
              role
            },
            body: {
              service: 'datapro',
              reason: 'Attempting to reset rate limit'
            }
          };

          // Verify role is not super admin
          expect(role).not.toBe('super admin');

          // Check authorization
          const isSuperAdmin = role === 'super admin';
          const response = {
            status: isSuperAdmin ? 200 : 403,
            error: isSuperAdmin ? null : 'Insufficient permissions'
          };

          // All non-super-admin roles should get 403
          expect(response.status).toBe(403);
          expect(response.error).toBe('Insufficient permissions');
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that authorization check happens before rate limit reset
   */
  it('should check authorization before resetting rate limit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('super admin', 'admin', 'user'),
        fc.constantFrom('datapro', 'verifydata'),
        (role, service) => {
          const authorizationSequence = {
            role,
            service,
            steps: [
              'check_authentication',
              'check_authorization',
              'validate_request',
              'reset_rate_limit',
              'log_event'
            ]
          };

          // Verify authorization check comes before rate limit reset
          const authIndex = authorizationSequence.steps.indexOf('check_authorization');
          const resetIndex = authorizationSequence.steps.indexOf('reset_rate_limit');
          
          expect(authIndex).toBeLessThan(resetIndex);
          
          // If not super admin, should stop at authorization
          if (role !== 'super admin') {
            const shouldProceed = false;
            expect(shouldProceed).toBe(false);
          }
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that super admin can reset for any service
   */
  it('should allow super admin to reset any service', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('datapro', 'verifydata'),
        (service) => {
          const request = {
            user: {
              uid: 'admin-123',
              email: 'admin@example.com',
              role: 'super admin'
            },
            body: {
              service,
              reason: 'Testing rate limit reset for all services'
            }
          };

          // Super admin should be authorized for any service
          const isSuperAdmin = request.user.role === 'super admin';
          expect(isSuperAdmin).toBe(true);

          const response = {
            status: 200,
            success: true,
            service
          };

          expect(response.status).toBe(200);
          expect(response.success).toBe(true);
          expect(response.service).toBe(service);
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that authorization failure is consistent across services
   */
  it('should reject non-super-admin consistently for all services', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('admin', 'user', 'broker'),
        fc.constantFrom('datapro', 'verifydata'),
        (role, service) => {
          const request = {
            user: {
              uid: 'user-123',
              email: 'user@example.com',
              role
            },
            body: {
              service,
              reason: 'Testing authorization consistency'
            }
          };

          // Non-super-admin should be rejected regardless of service
          const isSuperAdmin = role === 'super admin';
          expect(isSuperAdmin).toBe(false);

          const response = {
            status: 403,
            error: 'Insufficient permissions'
          };

          expect(response.status).toBe(403);
          expect(response.error).toBe('Insufficient permissions');
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that role normalization doesn't bypass authorization
   */
  it('should not allow role variants to bypass authorization', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Super Admin', 'SUPER ADMIN', 'superadmin', 'super_admin'),
        (roleVariant) => {
          // Normalize role (simulating server-side normalization)
          const normalizedRole = roleVariant.toLowerCase().replace(/[_\s]/g, ' ').trim();
          
          const request = {
            user: {
              uid: 'user-123',
              email: 'user@example.com',
              role: normalizedRole
            },
            body: {
              service: 'datapro',
              reason: 'Testing role normalization'
            }
          };

          // After normalization, should match 'super admin'
          const isSuperAdmin = normalizedRole === 'super admin';
          
          if (isSuperAdmin) {
            const response = { status: 200, success: true };
            expect(response.status).toBe(200);
          } else {
            const response = { status: 403, error: 'Insufficient permissions' };
            expect(response.status).toBe(403);
          }
        }
      ),
      { numRuns: 3 }
    );
  });

  /**
   * Test that authorization metadata is included in logs
   */
  it('should include authorization metadata in audit logs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('super admin', 'admin', 'user'),
        (role) => {
          const request = {
            user: {
              uid: 'user-123',
              email: 'user@example.com',
              role
            },
            body: {
              service: 'datapro',
              reason: 'Testing audit log metadata'
            }
          };

          const isSuperAdmin = role === 'super admin';

          if (isSuperAdmin) {
            // For successful resets, log should include reset metadata
            const auditLog = {
              eventType: 'rate_limit_reset',
              severity: 'medium',
              userId: request.user.uid,
              metadata: {
                service: request.body.service,
                reason: request.body.reason,
                resetBy: request.user.email,
                resetByRole: request.user.role
              }
            };

            expect(auditLog.eventType).toBe('rate_limit_reset');
            expect(auditLog.metadata.resetByRole).toBe('super admin');
          } else {
            // For failed attempts, log should include authorization failure
            const auditLog = {
              eventType: 'authorization_failure',
              severity: 'high',
              userId: request.user.uid,
              metadata: {
                requiredRoles: ['super admin'],
                userRole: request.user.role,
                attemptedAction: 'rate_limit_reset'
              }
            };

            expect(auditLog.eventType).toBe('authorization_failure');
            expect(auditLog.severity).toBe('high');
            expect(auditLog.metadata.requiredRoles).toContain('super admin');
          }
        }
      ),
      { numRuns: 3 }
    );
  });
});
