/**
 * Property-Based Tests for CAC Document Access Control
 * 
 * Property 6: Access control consistency
 * Validates: Requirements 4.1, 4.2, 4.3
 * 
 * Tests that authorized users always have access and unauthorized users never have access
 * across various user role combinations.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  canViewDocument,
  canDownloadDocument,
  canUploadDocument,
  PermissionError
} from '../../services/cacAccessControl';
import { User, UserRole } from '../../types';

// Arbitraries for generating test data
const userRoleArbitrary = fc.constantFrom<UserRole>(
  'admin',
  'super admin',
  'broker',
  'default',
  'compliance',
  'claims'
);

const uidArbitrary = fc.string({ minLength: 10, maxLength: 30 }).map(s => `uid-${s}`);

const userArbitrary = fc.record({
  uid: uidArbitrary,
  email: fc.emailAddress(),
  name: fc.string({ minLength: 3, maxLength: 50 }),
  role: userRoleArbitrary,
  notificationPreference: fc.constantFrom('email' as const, 'sms' as const),
  phone: fc.option(fc.string({ minLength: 10, maxLength: 15 }), { nil: undefined }),
  createdAt: fc.date(),
  updatedAt: fc.date()
});

// Helper to check if a role is authorized
const isAuthorizedRole = (role: UserRole): boolean => {
  return role === 'admin' || role === 'super admin';
};

const isBrokerRole = (role: UserRole): boolean => {
  return role === 'broker';
};

describe('Property 6: Access Control Consistency', () => {
  describe('Authorized users always have access', () => {
    it('admin and super admin users can always view any document', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isAuthorizedRole(u.role)),
          uidArbitrary,
          (user, documentOwnerId) => {
            // Admin and super admin should always be able to view any document
            const result = canViewDocument(user, documentOwnerId);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('admin and super admin users can always download any document', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isAuthorizedRole(u.role)),
          uidArbitrary,
          (user, documentOwnerId) => {
            // Admin and super admin should always be able to download any document
            const result = canDownloadDocument(user, documentOwnerId);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('admin and super admin users can always upload to any record', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isAuthorizedRole(u.role)),
          uidArbitrary,
          (user, recordOwnerId) => {
            // Admin and super admin should always be able to upload to any record
            const result = canUploadDocument(user, recordOwnerId);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('broker users can always view their own documents', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isBrokerRole(u.role)),
          (user) => {
            // Broker should always be able to view their own documents
            const result = canViewDocument(user, user.uid);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('broker users can always download their own documents', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isBrokerRole(u.role)),
          (user) => {
            // Broker should always be able to download their own documents
            const result = canDownloadDocument(user, user.uid);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('broker users can always upload to their own records', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isBrokerRole(u.role)),
          (user) => {
            // Broker should always be able to upload to their own records
            const result = canUploadDocument(user, user.uid);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unauthorized users never have access', () => {
    it('broker users can never view documents they do not own', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isBrokerRole(u.role)),
          uidArbitrary,
          (user, documentOwnerId) => {
            // Skip if the document owner ID matches the user's UID
            fc.pre(user.uid !== documentOwnerId);
            
            // Broker should never be able to view documents they don't own
            expect(() => canViewDocument(user, documentOwnerId)).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('broker users can never download documents they do not own', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isBrokerRole(u.role)),
          uidArbitrary,
          (user, documentOwnerId) => {
            // Skip if the document owner ID matches the user's UID
            fc.pre(user.uid !== documentOwnerId);
            
            // Broker should never be able to download documents they don't own
            expect(() => canDownloadDocument(user, documentOwnerId)).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('broker users can never upload to records they do not own', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isBrokerRole(u.role)),
          uidArbitrary,
          (user, recordOwnerId) => {
            // Skip if the record owner ID matches the user's UID
            fc.pre(user.uid !== recordOwnerId);
            
            // Broker should never be able to upload to records they don't own
            expect(() => canUploadDocument(user, recordOwnerId)).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('default users can never view any documents', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => u.role === 'default'),
          uidArbitrary,
          (user, documentOwnerId) => {
            // Default users should never be able to view documents
            expect(() => canViewDocument(user, documentOwnerId)).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('default users can never download any documents', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => u.role === 'default'),
          uidArbitrary,
          (user, documentOwnerId) => {
            // Default users should never be able to download documents
            expect(() => canDownloadDocument(user, documentOwnerId)).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('default users can never upload to any records', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => u.role === 'default'),
          uidArbitrary,
          (user, recordOwnerId) => {
            // Default users should never be able to upload documents
            expect(() => canUploadDocument(user, recordOwnerId)).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('null users can never view any documents', () => {
      fc.assert(
        fc.property(
          uidArbitrary,
          (documentOwnerId) => {
            // Null users should never be able to view documents
            expect(() => canViewDocument(null, documentOwnerId)).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('null users can never download any documents', () => {
      fc.assert(
        fc.property(
          uidArbitrary,
          (documentOwnerId) => {
            // Null users should never be able to download documents
            expect(() => canDownloadDocument(null, documentOwnerId)).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('null users can never upload to any records', () => {
      fc.assert(
        fc.property(
          uidArbitrary,
          (recordOwnerId) => {
            // Null users should never be able to upload documents
            expect(() => canUploadDocument(null, recordOwnerId)).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Access control is consistent across operations', () => {
    it('view and download permissions are always consistent', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          uidArbitrary,
          (user, documentOwnerId) => {
            // If a user can view a document, they should also be able to download it
            let canView = false;
            let canDownload = false;

            try {
              canViewDocument(user, documentOwnerId);
              canView = true;
            } catch (error) {
              canView = false;
            }

            try {
              canDownloadDocument(user, documentOwnerId);
              canDownload = true;
            } catch (error) {
              canDownload = false;
            }

            // View and download permissions should always match
            expect(canView).toBe(canDownload);
          }
        ),
        { numRuns: 200 }
      );
    });

    it('permission checks are deterministic for the same inputs', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          uidArbitrary,
          (user, documentOwnerId) => {
            // Call the permission check twice with the same inputs
            let firstResult: boolean | Error;
            let secondResult: boolean | Error;

            try {
              firstResult = canViewDocument(user, documentOwnerId);
            } catch (error) {
              firstResult = error as Error;
            }

            try {
              secondResult = canViewDocument(user, documentOwnerId);
            } catch (error) {
              secondResult = error as Error;
            }

            // Results should be identical
            if (firstResult instanceof Error && secondResult instanceof Error) {
              expect(firstResult.constructor).toBe(secondResult.constructor);
              expect(firstResult.message).toBe(secondResult.message);
            } else {
              expect(firstResult).toBe(secondResult);
            }
          }
        ),
        { numRuns: 200 }
      );
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('handles empty string owner IDs consistently', () => {
      fc.assert(
        fc.property(
          userArbitrary,
          (user) => {
            // Empty string owner ID should always throw an error
            expect(() => canViewDocument(user, '')).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('handles very long owner IDs', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isAuthorizedRole(u.role)),
          fc.string({ minLength: 100, maxLength: 500 }),
          (user, longOwnerId) => {
            // Admin users should be able to view documents with any owner ID length
            const result = canViewDocument(user, longOwnerId);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('handles owner IDs with special characters', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isAuthorizedRole(u.role)),
          fc.string({ minLength: 10, maxLength: 50 }),
          (user, ownerId) => {
            // Admin users should be able to view documents regardless of special characters in owner ID
            const result = canViewDocument(user, ownerId);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('owner ID matching is case-sensitive', () => {
      fc.assert(
        fc.property(
          userArbitrary.filter(u => isBrokerRole(u.role)),
          (user) => {
            // Assume user.uid has at least one lowercase letter
            fc.pre(user.uid.toLowerCase() !== user.uid.toUpperCase());
            
            const upperCaseUid = user.uid.toUpperCase();
            
            // Should be able to view with exact UID
            expect(canViewDocument(user, user.uid)).toBe(true);
            
            // Should NOT be able to view with different case UID
            expect(() => canViewDocument(user, upperCaseUid)).toThrow(PermissionError);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
