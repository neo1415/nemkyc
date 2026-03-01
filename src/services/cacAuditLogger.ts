/**
 * CAC Document Audit Logger
 * 
 * Logs all CAC document access events for compliance and security monitoring.
 * Integrates with existing audit logging infrastructure (server-utils/auditLogger.cjs).
 * 
 * Requirements:
 * - Log document upload events (5.3)
 * - Log document view events (5.1)
 * - Log document download events (5.2)
 * - Log failed access attempts with reasons (5.7)
 * - Include user ID, document ID, timestamp, and action type (5.1, 5.2, 5.3, 5.5)
 * - Store logs in Firestore with queryable indexes (5.4)
 * - Integrate with existing audit logging infrastructure (5.6)
 */

import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

/**
 * Document action types for audit logging
 */
export enum DocumentAction {
  UPLOAD = 'upload',
  VIEW = 'view',
  DOWNLOAD = 'download',
  REPLACE = 'replace',
  DELETE = 'delete',
  ACCESS_DENIED = 'access_denied'
}

/**
 * Document types for CAC documents
 */
export enum CACDocumentType {
  CERTIFICATE_OF_INCORPORATION = 'certificate_of_incorporation',
  PARTICULARS_OF_DIRECTORS = 'particulars_of_directors',
  SHARE_ALLOTMENT = 'share_allotment'
}

/**
 * Audit log entry interface
 */
export interface CACAuditLogEntry {
  eventType: 'cac_document_access';
  action: DocumentAction;
  documentId: string;
  documentType: CACDocumentType;
  identityRecordId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  result: 'success' | 'failure';
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: any; // Firestore Timestamp
}

/**
 * Parameters for logging document upload
 */
export interface LogUploadParams {
  documentId: string;
  documentType: CACDocumentType;
  identityRecordId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  fileName: string;
  fileSize: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging document view
 */
export interface LogViewParams {
  documentId: string;
  documentType: CACDocumentType;
  identityRecordId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging document download
 */
export interface LogDownloadParams {
  documentId: string;
  documentType: CACDocumentType;
  identityRecordId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Parameters for logging failed access attempts
 */
export interface LogAccessDeniedParams {
  documentId?: string;
  documentType?: CACDocumentType;
  identityRecordId?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  attemptedAction: DocumentAction;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Query filters for audit logs
 */
export interface AuditLogQueryFilters {
  userId?: string;
  documentId?: string;
  identityRecordId?: string;
  action?: DocumentAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Log document upload event
 * Requirement 5.3: Log document upload with user ID, document ID, and timestamp
 */
export async function logDocumentUpload(params: LogUploadParams): Promise<void> {
  try {
    const logEntry: CACAuditLogEntry = {
      eventType: 'cac_document_access',
      action: DocumentAction.UPLOAD,
      documentId: params.documentId,
      documentType: params.documentType,
      identityRecordId: params.identityRecordId,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      userRole: params.userRole,
      result: 'success',
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
      metadata: {
        fileName: params.fileName,
        fileSize: params.fileSize
      },
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'cac-document-audit-logs'), logEntry);
    console.log(`📝 [CAC AUDIT] Document upload logged: ${params.documentType} by ${params.userEmail}`);
  } catch (error) {
    console.error('❌ Failed to log document upload:', error);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Log document view event
 * Requirement 5.1: Log document view with user ID, document ID, and timestamp
 */
export async function logDocumentView(params: LogViewParams): Promise<void> {
  try {
    const logEntry: CACAuditLogEntry = {
      eventType: 'cac_document_access',
      action: DocumentAction.VIEW,
      documentId: params.documentId,
      documentType: params.documentType,
      identityRecordId: params.identityRecordId,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      userRole: params.userRole,
      result: 'success',
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'cac-document-audit-logs'), logEntry);
    console.log(`📝 [CAC AUDIT] Document view logged: ${params.documentType} by ${params.userEmail}`);
  } catch (error) {
    console.error('❌ Failed to log document view:', error);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Log document download event
 * Requirement 5.2: Log document download with user ID, document ID, and timestamp
 */
export async function logDocumentDownload(params: LogDownloadParams): Promise<void> {
  try {
    const logEntry: CACAuditLogEntry = {
      eventType: 'cac_document_access',
      action: DocumentAction.DOWNLOAD,
      documentId: params.documentId,
      documentType: params.documentType,
      identityRecordId: params.identityRecordId,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      userRole: params.userRole,
      result: 'success',
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'cac-document-audit-logs'), logEntry);
    console.log(`📝 [CAC AUDIT] Document download logged: ${params.documentType} by ${params.userEmail}`);
  } catch (error) {
    console.error('❌ Failed to log document download:', error);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Log failed access attempt
 * Requirement 5.7: Log failed access attempts with reason for failure
 */
export async function logAccessDenied(params: LogAccessDeniedParams): Promise<void> {
  try {
    const logEntry: CACAuditLogEntry = {
      eventType: 'cac_document_access',
      action: params.attemptedAction,
      documentId: params.documentId || 'unknown',
      documentType: params.documentType || CACDocumentType.CERTIFICATE_OF_INCORPORATION,
      identityRecordId: params.identityRecordId || 'unknown',
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      userRole: params.userRole,
      result: 'failure',
      failureReason: params.reason,
      ipAddress: params.ipAddress || 'unknown',
      userAgent: params.userAgent || 'unknown',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'cac-document-audit-logs'), logEntry);
    console.warn(`🔒 [CAC AUDIT] Access denied: ${params.attemptedAction} by ${params.userEmail} - ${params.reason}`);
  } catch (error) {
    console.error('❌ Failed to log access denied:', error);
    // Don't throw - logging failures shouldn't break the application
  }
}

/**
 * Query audit logs with filters
 * Requirement 5.4: Store logs in Firestore with queryable indexes
 */
export async function queryAuditLogs(filters: AuditLogQueryFilters = {}): Promise<CACAuditLogEntry[]> {
  try {
    const logsCollection = collection(db, 'cac-document-audit-logs');
    const constraints: any[] = [];

    // Apply filters
    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }

    if (filters.documentId) {
      constraints.push(where('documentId', '==', filters.documentId));
    }

    if (filters.identityRecordId) {
      constraints.push(where('identityRecordId', '==', filters.identityRecordId));
    }

    if (filters.action) {
      constraints.push(where('action', '==', filters.action));
    }

    if (filters.startDate) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
    }

    if (filters.endDate) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
    }

    // Order by timestamp descending
    constraints.push(orderBy('createdAt', 'desc'));

    // Limit results
    const resultLimit = filters.limit || 100;
    constraints.push(limit(resultLimit));

    const q = query(logsCollection, ...constraints);
    const snapshot = await getDocs(q);

    const logs: CACAuditLogEntry[] = [];
    snapshot.forEach(doc => {
      logs.push({
        ...doc.data() as CACAuditLogEntry
      });
    });

    return logs;
  } catch (error) {
    console.error('❌ Failed to query audit logs:', error);
    throw error;
  }
}

/**
 * Get audit trail for a specific document
 * Returns all audit log entries for a document, ordered by timestamp
 */
export async function getDocumentAuditTrail(documentId: string): Promise<CACAuditLogEntry[]> {
  return queryAuditLogs({ documentId, limit: 1000 });
}

/**
 * Get audit trail for a specific identity record
 * Returns all audit log entries for an identity record's documents
 */
export async function getIdentityRecordAuditTrail(identityRecordId: string): Promise<CACAuditLogEntry[]> {
  return queryAuditLogs({ identityRecordId, limit: 1000 });
}

/**
 * Get audit trail for a specific user
 * Returns all audit log entries for a user's actions
 */
export async function getUserAuditTrail(userId: string): Promise<CACAuditLogEntry[]> {
  return queryAuditLogs({ userId, limit: 1000 });
}
