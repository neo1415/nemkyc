/**
 * Unit tests for CAC Document Audit Logging
 * 
 * Tests:
 * - Upload event logging (Requirement 5.3)
 * - View event logging (Requirement 5.1)
 * - Download event logging (Requirement 5.2)
 * - Failed access logging (Requirement 5.7)
 * - Log data completeness (Requirements 5.1, 5.2, 5.3, 5.5)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  logDocumentUpload,
  logDocumentView,
  logDocumentDownload,
  logAccessDenied,
  queryAuditLogs,
  getDocumentAuditTrail,
  getIdentityRecordAuditTrail,
  getUserAuditTrail,
  DocumentAction,
  CACDocumentType,
  type LogUploadParams,
  type LogViewParams,
  type LogDownloadParams,
  type LogAccessDeniedParams
} from '../../services/cacAuditLogger';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

// Mock Firebase
vi.mock('../../firebase/config', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _seconds: Date.now() / 1000 })),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({ _seconds: date.getTime() / 1000 }))
  }
}));

describe('CAC Document Audit Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console logs during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Upload Event Logging (Requirement 5.3)', () => {
    it('should log document upload with all required fields', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-123' } as any);

      const uploadParams: LogUploadParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'broker@example.com',
        userName: 'John Broker',
        userRole: 'broker',
        fileName: 'certificate.pdf',
        fileSize: 1024000,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      };

      await logDocumentUpload(uploadParams);

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const logEntry = mockAddDoc.mock.calls[0][1];

      // Verify all required fields are present
      expect(logEntry).toMatchObject({
        eventType: 'cac_document_access',
        action: DocumentAction.UPLOAD,
        documentId: 'doc-123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'broker@example.com',
        userName: 'John Broker',
        userRole: 'broker',
        result: 'success',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });

      // Verify metadata
      expect(logEntry.metadata).toMatchObject({
        fileName: 'certificate.pdf',
        fileSize: 1024000
      });

      // Verify timestamp is present
      expect(logEntry.createdAt).toBeDefined();
    });

    it('should handle missing optional fields with defaults', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-124' } as any);

      const uploadParams: LogUploadParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'broker@example.com',
        userName: 'John Broker',
        userRole: 'broker',
        fileName: 'directors.pdf',
        fileSize: 512000
        // ipAddress and userAgent omitted
      };

      await logDocumentUpload(uploadParams);

      const logEntry = mockAddDoc.mock.calls[0][1];
      expect(logEntry.ipAddress).toBe('unknown');
      expect(logEntry.userAgent).toBe('unknown');
    });

    it('should not throw error if logging fails', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockRejectedValue(new Error('Firestore error'));

      const uploadParams: LogUploadParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.SHARE_ALLOTMENT,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'broker@example.com',
        userName: 'John Broker',
        userRole: 'broker',
        fileName: 'shares.pdf',
        fileSize: 256000
      };

      // Should not throw
      await expect(logDocumentUpload(uploadParams)).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('View Event Logging (Requirement 5.1)', () => {
    it('should log document view with all required fields', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-125' } as any);

      const viewParams: LogViewParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        userRole: 'admin',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0'
      };

      await logDocumentView(viewParams);

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const logEntry = mockAddDoc.mock.calls[0][1];

      expect(logEntry).toMatchObject({
        eventType: 'cac_document_access',
        action: DocumentAction.VIEW,
        documentId: 'doc-123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        userRole: 'admin',
        result: 'success',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0'
      });

      expect(logEntry.createdAt).toBeDefined();
    });

    it('should handle view logging errors gracefully', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockRejectedValue(new Error('Network error'));

      const viewParams: LogViewParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        userRole: 'admin'
      };

      await expect(logDocumentView(viewParams)).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Download Event Logging (Requirement 5.2)', () => {
    it('should log document download with all required fields', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-126' } as any);

      const downloadParams: LogDownloadParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.SHARE_ALLOTMENT,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'superadmin@example.com',
        userName: 'Super Admin',
        userRole: 'super_admin',
        ipAddress: '192.168.1.3',
        userAgent: 'Mozilla/5.0'
      };

      await logDocumentDownload(downloadParams);

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const logEntry = mockAddDoc.mock.calls[0][1];

      expect(logEntry).toMatchObject({
        eventType: 'cac_document_access',
        action: DocumentAction.DOWNLOAD,
        documentId: 'doc-123',
        documentType: CACDocumentType.SHARE_ALLOTMENT,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'superadmin@example.com',
        userName: 'Super Admin',
        userRole: 'super_admin',
        result: 'success',
        ipAddress: '192.168.1.3',
        userAgent: 'Mozilla/5.0'
      });

      expect(logEntry.createdAt).toBeDefined();
    });

    it('should handle download logging errors gracefully', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockRejectedValue(new Error('Database error'));

      const downloadParams: LogDownloadParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'broker@example.com',
        userName: 'John Broker',
        userRole: 'broker'
      };

      await expect(logDocumentDownload(downloadParams)).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Failed Access Logging (Requirement 5.7)', () => {
    it('should log access denied with failure reason', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-127' } as any);

      const accessDeniedParams: LogAccessDeniedParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity-456',
        userId: 'user-999',
        userEmail: 'unauthorized@example.com',
        userName: 'Unauthorized User',
        userRole: 'user',
        attemptedAction: DocumentAction.VIEW,
        reason: 'Insufficient permissions: user role does not have access',
        ipAddress: '192.168.1.4',
        userAgent: 'Mozilla/5.0'
      };

      await logAccessDenied(accessDeniedParams);

      expect(mockAddDoc).toHaveBeenCalledTimes(1);
      const logEntry = mockAddDoc.mock.calls[0][1];

      expect(logEntry).toMatchObject({
        eventType: 'cac_document_access',
        action: DocumentAction.VIEW,
        documentId: 'doc-123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity-456',
        userId: 'user-999',
        userEmail: 'unauthorized@example.com',
        userName: 'Unauthorized User',
        userRole: 'user',
        result: 'failure',
        failureReason: 'Insufficient permissions: user role does not have access',
        ipAddress: '192.168.1.4',
        userAgent: 'Mozilla/5.0'
      });

      expect(logEntry.createdAt).toBeDefined();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should handle missing document details in access denied logs', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-128' } as any);

      const accessDeniedParams: LogAccessDeniedParams = {
        userId: 'user-999',
        userEmail: 'unauthorized@example.com',
        userName: 'Unauthorized User',
        userRole: 'user',
        attemptedAction: DocumentAction.DOWNLOAD,
        reason: 'Document not found'
      };

      await logAccessDenied(accessDeniedParams);

      const logEntry = mockAddDoc.mock.calls[0][1];
      expect(logEntry.documentId).toBe('unknown');
      expect(logEntry.identityRecordId).toBe('unknown');
      expect(logEntry.result).toBe('failure');
      expect(logEntry.failureReason).toBe('Document not found');
    });

    it('should handle access denied logging errors gracefully', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockRejectedValue(new Error('Logging failed'));

      const accessDeniedParams: LogAccessDeniedParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
        identityRecordId: 'identity-456',
        userId: 'user-999',
        userEmail: 'unauthorized@example.com',
        userName: 'Unauthorized User',
        userRole: 'user',
        attemptedAction: DocumentAction.VIEW,
        reason: 'Access denied'
      };

      await expect(logAccessDenied(accessDeniedParams)).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Log Data Completeness (Requirements 5.1, 5.2, 5.3, 5.5)', () => {
    it('should include action type in all log entries', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-129' } as any);

      const uploadParams: LogUploadParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'broker@example.com',
        userName: 'John Broker',
        userRole: 'broker',
        fileName: 'cert.pdf',
        fileSize: 1024
      };

      await logDocumentUpload(uploadParams);

      const logEntry = mockAddDoc.mock.calls[0][1];
      expect(logEntry.action).toBe(DocumentAction.UPLOAD);
      expect(Object.values(DocumentAction)).toContain(logEntry.action);
    });

    it('should include user ID in all log entries', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-130' } as any);

      const viewParams: LogViewParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        userRole: 'admin'
      };

      await logDocumentView(viewParams);

      const logEntry = mockAddDoc.mock.calls[0][1];
      expect(logEntry.userId).toBe('user-789');
      expect(logEntry.userId).toBeTruthy();
    });

    it('should include document ID in all log entries', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-131' } as any);

      const downloadParams: LogDownloadParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.SHARE_ALLOTMENT,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'broker@example.com',
        userName: 'John Broker',
        userRole: 'broker'
      };

      await logDocumentDownload(downloadParams);

      const logEntry = mockAddDoc.mock.calls[0][1];
      expect(logEntry.documentId).toBe('doc-123');
      expect(logEntry.documentId).toBeTruthy();
    });

    it('should include timestamp in all log entries', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-132' } as any);

      const uploadParams: LogUploadParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'broker@example.com',
        userName: 'John Broker',
        userRole: 'broker',
        fileName: 'cert.pdf',
        fileSize: 1024
      };

      await logDocumentUpload(uploadParams);

      const logEntry = mockAddDoc.mock.calls[0][1];
      expect(logEntry.createdAt).toBeDefined();
    });

    it('should include identity record ID in all log entries', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-133' } as any);

      const viewParams: LogViewParams = {
        documentId: 'doc-123',
        documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
        identityRecordId: 'identity-456',
        userId: 'user-789',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        userRole: 'admin'
      };

      await logDocumentView(viewParams);

      const logEntry = mockAddDoc.mock.calls[0][1];
      expect(logEntry.identityRecordId).toBe('identity-456');
      expect(logEntry.identityRecordId).toBeTruthy();
    });
  });

  describe('Query Audit Logs (Requirement 5.4)', () => {
    it('should query logs by user ID', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockQuery = vi.mocked(query);
      const mockWhere = vi.mocked(where);
      const mockOrderBy = vi.mocked(orderBy);
      const mockLimit = vi.mocked(limit);

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.VIEW,
              userId: 'user-789'
            })
          });
        }
      } as any);

      const logs = await queryAuditLogs({ userId: 'user-789' });

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-789');
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('user-789');
    });

    it('should query logs by document ID', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.DOWNLOAD,
              documentId: 'doc-123'
            })
          });
        }
      } as any);

      const logs = await queryAuditLogs({ documentId: 'doc-123' });

      expect(logs).toHaveLength(1);
      expect(logs[0].documentId).toBe('doc-123');
    });

    it('should query logs by identity record ID', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.UPLOAD,
              identityRecordId: 'identity-456'
            })
          });
        }
      } as any);

      const logs = await queryAuditLogs({ identityRecordId: 'identity-456' });

      expect(logs).toHaveLength(1);
      expect(logs[0].identityRecordId).toBe('identity-456');
    });

    it('should apply default limit of 100 when not specified', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockLimit = vi.mocked(limit);
      mockGetDocs.mockResolvedValue({ forEach: () => {} } as any);

      await queryAuditLogs({});

      expect(mockLimit).toHaveBeenCalledWith(100);
    });

    it('should apply custom limit when specified', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockLimit = vi.mocked(limit);
      mockGetDocs.mockResolvedValue({ forEach: () => {} } as any);

      await queryAuditLogs({ limit: 50 });

      expect(mockLimit).toHaveBeenCalledWith(50);
    });
  });

  describe('Audit Trail Helper Functions', () => {
    it('should get document audit trail', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.VIEW,
              documentId: 'doc-123'
            })
          });
        }
      } as any);

      const logs = await getDocumentAuditTrail('doc-123');

      expect(logs).toHaveLength(1);
      expect(logs[0].documentId).toBe('doc-123');
    });

    it('should get identity record audit trail', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.UPLOAD,
              identityRecordId: 'identity-456'
            })
          });
        }
      } as any);

      const logs = await getIdentityRecordAuditTrail('identity-456');

      expect(logs).toHaveLength(1);
      expect(logs[0].identityRecordId).toBe('identity-456');
    });

    it('should get user audit trail', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.DOWNLOAD,
              userId: 'user-789'
            })
          });
        }
      } as any);

      const logs = await getUserAuditTrail('user-789');

      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('user-789');
    });
  });
});
