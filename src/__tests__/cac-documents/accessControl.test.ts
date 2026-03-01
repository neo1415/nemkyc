/**
 * Unit tests for CAC Document Access Control Service
 * 
 * Tests access control for document viewing, downloading, and uploading
 * based on user roles and ownership.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 12.3
 */

import { describe, it, expect } from 'vitest';
import {
  canViewDocument,
  canDownloadDocument,
  canUploadDocument,
  canDeleteDocument,
  canReplaceDocument,
  checkDocumentPermission,
  shouldShowDocumentActions,
  getPermissionErrorMessage,
  validateUser,
  PermissionError,
  PermissionErrorType,
  DocumentOperation,
  isAdminRole,
  isBrokerRole
} from '../../services/cacAccessControl';
import { User } from '../../types';

// Test user fixtures
const createUser = (uid: string, role: User['role']): User => ({
  uid,
  email: `${uid}@example.com`,
  name: `Test User ${uid}`,
  role,
  notificationPreference: 'email',
  createdAt: new Date(),
  updatedAt: new Date()
});

const adminUser = createUser('admin-123', 'admin');
const superAdminUser = createUser('superadmin-456', 'super admin');
const brokerUser = createUser('broker-789', 'broker');
const otherBrokerUser = createUser('broker-999', 'broker');
const defaultUser = createUser('default-111', 'default');

const documentOwnerId = 'broker-789'; // Owned by brokerUser

describe('CAC Access Control Service', () => {
  describe('Role checking utilities', () => {
    it('should identify admin roles correctly', () => {
      expect(isAdminRole('admin')).toBe(true);
      expect(isAdminRole('super admin')).toBe(true);
      expect(isAdminRole('broker')).toBe(false);
      expect(isAdminRole('default')).toBe(false);
      expect(isAdminRole(undefined)).toBe(false);
    });

    it('should identify broker roles correctly', () => {
      expect(isBrokerRole('broker')).toBe(true);
      expect(isBrokerRole('admin')).toBe(false);
      expect(isBrokerRole('super admin')).toBe(false);
      expect(isBrokerRole('default')).toBe(false);
      expect(isBrokerRole(undefined)).toBe(false);
    });
  });

  describe('canViewDocument', () => {
    // Requirement 4.2: Admin access
    it('should allow admin users to view any document', () => {
      expect(canViewDocument(adminUser, documentOwnerId)).toBe(true);
      expect(canViewDocument(adminUser, 'any-other-owner')).toBe(true);
    });

    // Requirement 4.2: Super admin access
    it('should allow super admin users to view any document', () => {
      expect(canViewDocument(superAdminUser, documentOwnerId)).toBe(true);
      expect(canViewDocument(superAdminUser, 'any-other-owner')).toBe(true);
    });

    // Requirement 4.2: Broker owner access
    it('should allow broker users to view their own documents', () => {
      expect(canViewDocument(brokerUser, documentOwnerId)).toBe(true);
    });

    // Requirement 4.3: Unauthorized user access denial
    it('should deny broker users from viewing documents they do not own', () => {
      expect(() => canViewDocument(otherBrokerUser, documentOwnerId)).toThrow(PermissionError);
      expect(() => canViewDocument(otherBrokerUser, documentOwnerId)).toThrow(
        'You do not have permission to view this document'
      );
    });

    // Requirement 4.3: Deny access for users without sufficient permissions
    it('should deny default users from viewing documents', () => {
      expect(() => canViewDocument(defaultUser, documentOwnerId)).toThrow(PermissionError);
      
      try {
        canViewDocument(defaultUser, documentOwnerId);
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionError);
        expect((error as PermissionError).type).toBe(PermissionErrorType.INSUFFICIENT_ROLE);
      }
    });

    // Requirement 4.1: Verify user has sufficient permissions
    it('should deny unauthenticated users from viewing documents', () => {
      expect(() => canViewDocument(null, documentOwnerId)).toThrow(PermissionError);
      
      try {
        canViewDocument(null, documentOwnerId);
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionError);
        expect((error as PermissionError).type).toBe(PermissionErrorType.UNAUTHORIZED);
        expect((error as PermissionError).message).toContain('logged in');
      }
    });
  });

  describe('canDownloadDocument', () => {
    // Requirement 4.6: Apply same permission rules to downloads
    it('should allow admin users to download any document', () => {
      expect(canDownloadDocument(adminUser, documentOwnerId)).toBe(true);
      expect(canDownloadDocument(superAdminUser, documentOwnerId)).toBe(true);
    });

    it('should allow broker users to download their own documents', () => {
      expect(canDownloadDocument(brokerUser, documentOwnerId)).toBe(true);
    });

    it('should deny broker users from downloading documents they do not own', () => {
      expect(() => canDownloadDocument(otherBrokerUser, documentOwnerId)).toThrow(PermissionError);
    });

    it('should deny unauthenticated users from downloading documents', () => {
      expect(() => canDownloadDocument(null, documentOwnerId)).toThrow(PermissionError);
    });
  });

  describe('canUploadDocument', () => {
    it('should allow admin users to upload to any record', () => {
      expect(canUploadDocument(adminUser, documentOwnerId)).toBe(true);
      expect(canUploadDocument(superAdminUser, 'any-owner')).toBe(true);
    });

    it('should allow broker users to upload to their own records', () => {
      expect(canUploadDocument(brokerUser, documentOwnerId)).toBe(true);
    });

    it('should deny broker users from uploading to records they do not own', () => {
      expect(() => canUploadDocument(otherBrokerUser, documentOwnerId)).toThrow(PermissionError);
    });

    it('should deny unauthenticated users from uploading documents', () => {
      expect(() => canUploadDocument(null, documentOwnerId)).toThrow(PermissionError);
    });
  });

  describe('canDeleteDocument', () => {
    it('should allow admin users to delete any document', () => {
      expect(canDeleteDocument(adminUser, documentOwnerId)).toBe(true);
      expect(canDeleteDocument(superAdminUser, documentOwnerId)).toBe(true);
    });

    it('should allow broker users to delete their own documents', () => {
      expect(canDeleteDocument(brokerUser, documentOwnerId)).toBe(true);
    });

    it('should deny broker users from deleting documents they do not own', () => {
      expect(() => canDeleteDocument(otherBrokerUser, documentOwnerId)).toThrow(PermissionError);
    });

    it('should deny unauthenticated users from deleting documents', () => {
      expect(() => canDeleteDocument(null, documentOwnerId)).toThrow(PermissionError);
    });
  });

  describe('canReplaceDocument', () => {
    it('should allow admin users to replace any document', () => {
      expect(canReplaceDocument(adminUser, documentOwnerId)).toBe(true);
      expect(canReplaceDocument(superAdminUser, documentOwnerId)).toBe(true);
    });

    it('should allow broker users to replace their own documents', () => {
      expect(canReplaceDocument(brokerUser, documentOwnerId)).toBe(true);
    });

    it('should deny broker users from replacing documents they do not own', () => {
      expect(() => canReplaceDocument(otherBrokerUser, documentOwnerId)).toThrow(PermissionError);
    });

    it('should deny unauthenticated users from replacing documents', () => {
      expect(() => canReplaceDocument(null, documentOwnerId)).toThrow(PermissionError);
    });
  });

  describe('checkDocumentPermission', () => {
    it('should check VIEW permission correctly', () => {
      expect(checkDocumentPermission(adminUser, DocumentOperation.VIEW, documentOwnerId)).toBe(true);
      expect(checkDocumentPermission(brokerUser, DocumentOperation.VIEW, documentOwnerId)).toBe(true);
      expect(() => checkDocumentPermission(otherBrokerUser, DocumentOperation.VIEW, documentOwnerId)).toThrow();
    });

    it('should check DOWNLOAD permission correctly', () => {
      expect(checkDocumentPermission(adminUser, DocumentOperation.DOWNLOAD, documentOwnerId)).toBe(true);
      expect(checkDocumentPermission(brokerUser, DocumentOperation.DOWNLOAD, documentOwnerId)).toBe(true);
      expect(() => checkDocumentPermission(otherBrokerUser, DocumentOperation.DOWNLOAD, documentOwnerId)).toThrow();
    });

    it('should check UPLOAD permission correctly', () => {
      expect(checkDocumentPermission(adminUser, DocumentOperation.UPLOAD, documentOwnerId)).toBe(true);
      expect(checkDocumentPermission(brokerUser, DocumentOperation.UPLOAD, documentOwnerId)).toBe(true);
      expect(() => checkDocumentPermission(otherBrokerUser, DocumentOperation.UPLOAD, documentOwnerId)).toThrow();
    });

    it('should check DELETE permission correctly', () => {
      expect(checkDocumentPermission(adminUser, DocumentOperation.DELETE, documentOwnerId)).toBe(true);
      expect(checkDocumentPermission(brokerUser, DocumentOperation.DELETE, documentOwnerId)).toBe(true);
      expect(() => checkDocumentPermission(otherBrokerUser, DocumentOperation.DELETE, documentOwnerId)).toThrow();
    });

    it('should check REPLACE permission correctly', () => {
      expect(checkDocumentPermission(adminUser, DocumentOperation.REPLACE, documentOwnerId)).toBe(true);
      expect(checkDocumentPermission(brokerUser, DocumentOperation.REPLACE, documentOwnerId)).toBe(true);
      expect(() => checkDocumentPermission(otherBrokerUser, DocumentOperation.REPLACE, documentOwnerId)).toThrow();
    });
  });

  describe('shouldShowDocumentActions', () => {
    // Requirement 4.7: Hide preview and download buttons from unauthorized users
    it('should show actions for admin users', () => {
      expect(shouldShowDocumentActions(adminUser, documentOwnerId)).toBe(true);
      expect(shouldShowDocumentActions(superAdminUser, documentOwnerId)).toBe(true);
    });

    it('should show actions for broker users viewing their own documents', () => {
      expect(shouldShowDocumentActions(brokerUser, documentOwnerId)).toBe(true);
    });

    it('should hide actions for broker users viewing documents they do not own', () => {
      expect(shouldShowDocumentActions(otherBrokerUser, documentOwnerId)).toBe(false);
    });

    it('should hide actions for default users', () => {
      expect(shouldShowDocumentActions(defaultUser, documentOwnerId)).toBe(false);
    });

    it('should hide actions for unauthenticated users', () => {
      expect(shouldShowDocumentActions(null, documentOwnerId)).toBe(false);
    });
  });

  describe('getPermissionErrorMessage', () => {
    // Requirement 4.4: Display permission error message when access is denied
    // Requirement 12.3: Return clear permission error messages
    it('should return clear error message for UNAUTHORIZED', () => {
      const error = new PermissionError(
        PermissionErrorType.UNAUTHORIZED,
        'You must be logged in'
      );
      const message = getPermissionErrorMessage(error);
      expect(message).toContain('logged in');
      expect(message).toContain('sign in');
    });

    it('should return clear error message for INSUFFICIENT_ROLE', () => {
      const error = new PermissionError(
        PermissionErrorType.INSUFFICIENT_ROLE,
        'You do not have permission to view this document'
      );
      const message = getPermissionErrorMessage(error);
      expect(message).toBe('You do not have permission to view this document');
    });

    it('should return clear error message for NOT_OWNER', () => {
      const error = new PermissionError(
        PermissionErrorType.NOT_OWNER,
        'Not owner'
      );
      const message = getPermissionErrorMessage(error);
      expect(message).toContain('belong to you');
      expect(message).toContain('administrator');
    });

    it('should return clear error message for INVALID_USER', () => {
      const error = new PermissionError(
        PermissionErrorType.INVALID_USER,
        'Invalid user'
      );
      const message = getPermissionErrorMessage(error);
      expect(message).toContain('Invalid user');
      expect(message).toContain('refresh');
    });

    it('should return default error message for unknown error types', () => {
      const error = new PermissionError(
        'UNKNOWN' as PermissionErrorType,
        'Unknown error'
      );
      const message = getPermissionErrorMessage(error);
      expect(message).toContain('do not have permission');
    });
  });

  describe('validateUser', () => {
    it('should not throw for valid users', () => {
      expect(() => validateUser(adminUser)).not.toThrow();
      expect(() => validateUser(brokerUser)).not.toThrow();
    });

    it('should throw for null user', () => {
      expect(() => validateUser(null)).toThrow(PermissionError);
      expect(() => validateUser(null)).toThrow('logged in');
    });

    it('should throw for user without uid', () => {
      const invalidUser = { ...brokerUser, uid: '' };
      expect(() => validateUser(invalidUser as User)).toThrow(PermissionError);
      expect(() => validateUser(invalidUser as User)).toThrow('Invalid user data');
    });

    it('should throw for user without role', () => {
      const invalidUser = { ...brokerUser, role: undefined as any };
      expect(() => validateUser(invalidUser)).toThrow(PermissionError);
      expect(() => validateUser(invalidUser)).toThrow('Invalid user data');
    });
  });

  describe('PermissionError', () => {
    it('should create error with correct properties', () => {
      const error = new PermissionError(
        PermissionErrorType.INSUFFICIENT_ROLE,
        'Test message',
        'admin',
        'broker'
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PermissionError);
      expect(error.name).toBe('PermissionError');
      expect(error.type).toBe(PermissionErrorType.INSUFFICIENT_ROLE);
      expect(error.message).toBe('Test message');
      expect(error.requiredRole).toBe('admin');
      expect(error.userRole).toBe('broker');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string owner ID', () => {
      expect(() => canViewDocument(brokerUser, '')).toThrow(PermissionError);
    });

    it('should handle special characters in owner ID', () => {
      const specialOwnerId = 'owner-with-special-chars-!@#$%';
      expect(canViewDocument(adminUser, specialOwnerId)).toBe(true);
    });

    it('should be case-sensitive for owner ID matching', () => {
      const upperCaseOwnerId = documentOwnerId.toUpperCase();
      // Should not match because UIDs are case-sensitive
      expect(() => canViewDocument(brokerUser, upperCaseOwnerId)).toThrow(PermissionError);
    });
  });
});
