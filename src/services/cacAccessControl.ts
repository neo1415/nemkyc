/**
 * CAC Document Access Control Service
 * 
 * Provides role-based access control for CAC document operations.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 12.3
 */

import { User } from '../types';

export enum PermissionErrorType {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INSUFFICIENT_ROLE = 'INSUFFICIENT_ROLE',
  NOT_OWNER = 'NOT_OWNER',
  INVALID_USER = 'INVALID_USER'
}

export enum DocumentOperation {
  VIEW = 'VIEW',
  DOWNLOAD = 'DOWNLOAD',
  UPLOAD = 'UPLOAD',
  DELETE = 'DELETE',
  REPLACE = 'REPLACE'
}

export class PermissionError extends Error {
  constructor(
    public type: PermissionErrorType,
    message: string,
    public requiredRole?: string,
    public userRole?: string
  ) {
    super(message);
    this.name = 'PermissionError';
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

export function isAdminRole(role: User['role'] | undefined): boolean {
  return role === 'admin' || role === 'super admin';
}

export function isBrokerRole(role: User['role'] | undefined): boolean {
  return role === 'broker';
}

export function validateUser(user: User | null): asserts user is User {
  if (!user) {
    throw new PermissionError(
      PermissionErrorType.UNAUTHORIZED,
      'You must be logged in to access documents'
    );
  }

  if (!user.uid || !user.role) {
    throw new PermissionError(
      PermissionErrorType.INVALID_USER,
      'Invalid user data. Please refresh and try again.'
    );
  }
}


export function canViewDocument(user: User | null, ownerId: string): boolean {
  validateUser(user);

  if (isAdminRole(user.role)) {
    return true;
  }

  if (isBrokerRole(user.role)) {
    if (user.uid === ownerId) {
      return true;
    }
    throw new PermissionError(
      PermissionErrorType.NOT_OWNER,
      'You do not have permission to view this document'
    );
  }

  throw new PermissionError(
    PermissionErrorType.INSUFFICIENT_ROLE,
    'You do not have permission to view this document',
    'broker',
    user.role
  );
}

export function canDownloadDocument(user: User | null, ownerId: string): boolean {
  return canViewDocument(user, ownerId);
}

export function canUploadDocument(user: User | null, ownerId: string): boolean {
  validateUser(user);

  if (isAdminRole(user.role)) {
    return true;
  }

  if (isBrokerRole(user.role)) {
    if (user.uid === ownerId) {
      return true;
    }
    throw new PermissionError(
      PermissionErrorType.NOT_OWNER,
      'You do not have permission to upload documents to this record'
    );
  }

  throw new PermissionError(
    PermissionErrorType.INSUFFICIENT_ROLE,
    'You do not have permission to upload documents',
    'broker',
    user.role
  );
}

export function canDeleteDocument(user: User | null, ownerId: string): boolean {
  validateUser(user);

  if (isAdminRole(user.role)) {
    return true;
  }

  if (isBrokerRole(user.role)) {
    if (user.uid === ownerId) {
      return true;
    }
    throw new PermissionError(
      PermissionErrorType.NOT_OWNER,
      'You do not have permission to delete this document'
    );
  }

  throw new PermissionError(
    PermissionErrorType.INSUFFICIENT_ROLE,
    'You do not have permission to delete documents',
    'broker',
    user.role
  );
}

export function canReplaceDocument(user: User | null, ownerId: string): boolean {
  validateUser(user);

  if (isAdminRole(user.role)) {
    return true;
  }

  if (isBrokerRole(user.role)) {
    if (user.uid === ownerId) {
      return true;
    }
    throw new PermissionError(
      PermissionErrorType.NOT_OWNER,
      'You do not have permission to replace this document'
    );
  }

  throw new PermissionError(
    PermissionErrorType.INSUFFICIENT_ROLE,
    'You do not have permission to replace documents',
    'broker',
    user.role
  );
}

export function checkDocumentPermission(
  user: User | null,
  operation: DocumentOperation,
  ownerId: string
): boolean {
  switch (operation) {
    case DocumentOperation.VIEW:
      return canViewDocument(user, ownerId);
    case DocumentOperation.DOWNLOAD:
      return canDownloadDocument(user, ownerId);
    case DocumentOperation.UPLOAD:
      return canUploadDocument(user, ownerId);
    case DocumentOperation.DELETE:
      return canDeleteDocument(user, ownerId);
    case DocumentOperation.REPLACE:
      return canReplaceDocument(user, ownerId);
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

export function shouldShowDocumentActions(user: User | null, ownerId: string): boolean {
  try {
    return canViewDocument(user, ownerId);
  } catch (error) {
    return false;
  }
}

export function getPermissionErrorMessage(error: PermissionError): string {
  switch (error.type) {
    case PermissionErrorType.UNAUTHORIZED:
      return 'You must be logged in to access documents. Please sign in and try again.';
    case PermissionErrorType.INSUFFICIENT_ROLE:
      return error.message;
    case PermissionErrorType.NOT_OWNER:
      return 'This document does not belong to you. Please contact an administrator if you need access.';
    case PermissionErrorType.INVALID_USER:
      return 'Invalid user data. Please refresh the page and try again.';
    default:
      return 'You do not have permission to perform this action.';
  }
}
