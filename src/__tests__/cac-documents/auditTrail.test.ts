/**
 * Integration Tests for CAC Document Audit Trail
 * 
 * Tests:
 * - Complete audit trail for document lifecycle (Requirement 5.6)
 * - Audit log queries by user (Requirement 5.4)
 * - Audit log queries by document (Requirement 5.4)
 * - Audit log queries by time range (Requirement 5.4)
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
  type CACAuditLogEntry
} from '../../services/cacAuditLogger';
import { collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';

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

describe('CAC Document Audit Trail Integration Tests', () => {
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

  describe('Complete Document Lifecycle Audit Trail (Requirement 5.6)', () => {
    it('should create complete audit trail for document lifecycle', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-123' } as any);

      const documentId = 'doc-lifecycle-123';
      const documentType = CACDocumentType.CERTIFICATE_OF_INCORPORATION;
      const identityRecordId = 'identity-456';
      const userId = 'user-789';
      const userEmail = 'broker@example.com';
      const userName = 'John Broker';
      const userRole = 'broker';

      // Step 1: Upload document
      await logDocumentUpload({
        documentId,
        documentType,
        identityRecordId,
        userId,
        userEmail,
        userName,
        userRole,
        fileName: 'certificate.pdf',
        fileSize: 1024000
      });

      // Step 2: View document
      await logDocumentView({
        documentId,
        documentType,
        identityRecordId,
        userId: 'admin-user',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        userRole: 'admin'
      });

      // Step 3: Download document
      await logDocumentDownload({
        documentId,
        documentType,
        identityRecordId,
        userId: 'admin-user',
        userEmail: 'admin@example.com',
        userName: 'Admin User',
        userRole: 'admin'
      });

      // Step 4: Failed access attempt
      await logAccessDenied({
        documentId,
        documentType,
        identityRecordId,
        userId: 'unauthorized-user',
        userEmail: 'unauthorized@example.com',
        userName: 'Unauthorized User',
        userRole: 'user',
        attemptedAction: DocumentAction.VIEW,
        reason: 'Insufficient permissions'
      });

      // Verify all operations were logged
      expect(mockAddDoc).toHaveBeenCalledTimes(4);

      // Verify each log entry
      const uploadLog = mockAddDoc.mock.calls[0][1];
      expect(uploadLog.action).toBe(DocumentAction.UPLOAD);
      expect(uploadLog.documentId).toBe(documentId);
      expect(uploadLog.result).toBe('success');

      const viewLog = mockAddDoc.mock.calls[1][1];
      expect(viewLog.action).toBe(DocumentAction.VIEW);
      expect(viewLog.documentId).toBe(documentId);
      expect(viewLog.result).toBe('success');

      const downloadLog = mockAddDoc.mock.calls[2][1];
      expect(downloadLog.action).toBe(DocumentAction.DOWNLOAD);
      expect(downloadLog.documentId).toBe(documentId);
      expect(downloadLog.result).toBe('success');

      const accessDeniedLog = mockAddDoc.mock.calls[3][1];
      expect(accessDeniedLog.action).toBe(DocumentAction.VIEW);
      expect(accessDeniedLog.documentId).toBe(documentId);
      expect(accessDeniedLog.result).toBe('failure');
      expect(accessDeniedLog.failureReason).toBe('Insufficient permissions');
    });

    it('should track multiple operations on same document', async () => {
      const mockAddDoc = vi.mocked(addDoc);
      mockAddDoc.mockResolvedValue({ id: 'log-124' } as any);

      const documentId = 'doc-multi-ops-123';
      const documentType = CACDocumentType.PARTICULARS_OF_DIRECTORS;
      const identityRecordId = 'identity-456';

      // Multiple views by different users
      await logDocumentView({
        documentId,
        documentType,
        identityRecordId,
        userId: 'user-1',
        userEmail: 'user1@example.com',
        userName: 'User One',
        userRole: 'broker'
      });

      await logDocumentView({
        documentId,
        documentType,
        identityRecordId,
        userId: 'user-2',
        userEmail: 'user2@example.com',
        userName: 'User Two',
        userRole: 'admin'
      });

      await logDocumentView({
        documentId,
        documentType,
        identityRecordId,
        userId: 'user-3',
        userEmail: 'user3@example.com',
        userName: 'User Three',
        userRole: 'super_admin'
      });

      // Verify all views were logged
      expect(mockAddDoc).toHaveBeenCalledTimes(3);

      // Verify all logs are for the same document
      mockAddDoc.mock.calls.forEach(call => {
        const logEntry = call[1];
        expect(logEntry.documentId).toBe(documentId);
        expect(logEntry.action).toBe(DocumentAction.VIEW);
      });
    });
  });

  describe('Audit Log Queries by User (Requirement 5.4)', () => {
    it('should query audit logs by user ID', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockWhere = vi.mocked(where);

      const userId = 'user-789';
      const mockLogs: CACAuditLogEntry[] = [
        {
          eventType: 'cac_document_access',
          action: DocumentAction.UPLOAD,
          documentId: 'doc-1',
          documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          identityRecordId: 'identity-1',
          userId,
          userEmail: 'user@example.com',
          userName: 'Test User',
          userRole: 'broker',
          result: 'success',
          createdAt: { _seconds: Date.now() / 1000 }
        },
        {
          eventType: 'cac_document_access',
          action: DocumentAction.VIEW,
          documentId: 'doc-2',
          documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
          identityRecordId: 'identity-2',
          userId,
          userEmail: 'user@example.com',
          userName: 'Test User',
          userRole: 'broker',
          result: 'success',
          createdAt: { _seconds: Date.now() / 1000 }
        }
      ];

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          mockLogs.forEach(log => callback({ data: () => log }));
        }
      } as any);

      const logs = await queryAuditLogs({ userId });

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', userId);
      expect(logs).toHaveLength(2);
      logs.forEach(log => {
        expect(log.userId).toBe(userId);
      });
    });

    it('should get user audit trail', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const userId = 'user-789';

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.DOWNLOAD,
              documentId: 'doc-1',
              documentType: CACDocumentType.SHARE_ALLOTMENT,
              identityRecordId: 'identity-1',
              userId,
              userEmail: 'user@example.com',
              userName: 'Test User',
              userRole: 'admin',
              result: 'success',
              createdAt: { _seconds: Date.now() / 1000 }
            })
          });
        }
      } as any);

      const logs = await getUserAuditTrail(userId);

      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe(userId);
    });
  });

  describe('Audit Log Queries by Document (Requirement 5.4)', () => {
    it('should query audit logs by document ID', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockWhere = vi.mocked(where);

      const documentId = 'doc-123';
      const mockLogs: CACAuditLogEntry[] = [
        {
          eventType: 'cac_document_access',
          action: DocumentAction.UPLOAD,
          documentId,
          documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          identityRecordId: 'identity-1',
          userId: 'user-1',
          userEmail: 'user1@example.com',
          userName: 'User One',
          userRole: 'broker',
          result: 'success',
          createdAt: { _seconds: Date.now() / 1000 }
        },
        {
          eventType: 'cac_document_access',
          action: DocumentAction.VIEW,
          documentId,
          documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          identityRecordId: 'identity-1',
          userId: 'user-2',
          userEmail: 'user2@example.com',
          userName: 'User Two',
          userRole: 'admin',
          result: 'success',
          createdAt: { _seconds: Date.now() / 1000 }
        },
        {
          eventType: 'cac_document_access',
          action: DocumentAction.DOWNLOAD,
          documentId,
          documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          identityRecordId: 'identity-1',
          userId: 'user-3',
          userEmail: 'user3@example.com',
          userName: 'User Three',
          userRole: 'super_admin',
          result: 'success',
          createdAt: { _seconds: Date.now() / 1000 }
        }
      ];

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          mockLogs.forEach(log => callback({ data: () => log }));
        }
      } as any);

      const logs = await queryAuditLogs({ documentId });

      expect(mockWhere).toHaveBeenCalledWith('documentId', '==', documentId);
      expect(logs).toHaveLength(3);
      logs.forEach(log => {
        expect(log.documentId).toBe(documentId);
      });
    });

    it('should get document audit trail', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const documentId = 'doc-123';

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.VIEW,
              documentId,
              documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
              identityRecordId: 'identity-1',
              userId: 'user-1',
              userEmail: 'user@example.com',
              userName: 'Test User',
              userRole: 'broker',
              result: 'success',
              createdAt: { _seconds: Date.now() / 1000 }
            })
          });
        }
      } as any);

      const logs = await getDocumentAuditTrail(documentId);

      expect(logs).toHaveLength(1);
      expect(logs[0].documentId).toBe(documentId);
    });

    it('should query audit logs by identity record ID', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockWhere = vi.mocked(where);

      const identityRecordId = 'identity-456';
      const mockLogs: CACAuditLogEntry[] = [
        {
          eventType: 'cac_document_access',
          action: DocumentAction.UPLOAD,
          documentId: 'doc-1',
          documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          identityRecordId,
          userId: 'user-1',
          userEmail: 'user1@example.com',
          userName: 'User One',
          userRole: 'broker',
          result: 'success',
          createdAt: { _seconds: Date.now() / 1000 }
        },
        {
          eventType: 'cac_document_access',
          action: DocumentAction.UPLOAD,
          documentId: 'doc-2',
          documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
          identityRecordId,
          userId: 'user-1',
          userEmail: 'user1@example.com',
          userName: 'User One',
          userRole: 'broker',
          result: 'success',
          createdAt: { _seconds: Date.now() / 1000 }
        },
        {
          eventType: 'cac_document_access',
          action: DocumentAction.UPLOAD,
          documentId: 'doc-3',
          documentType: CACDocumentType.SHARE_ALLOTMENT,
          identityRecordId,
          userId: 'user-1',
          userEmail: 'user1@example.com',
          userName: 'User One',
          userRole: 'broker',
          result: 'success',
          createdAt: { _seconds: Date.now() / 1000 }
        }
      ];

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          mockLogs.forEach(log => callback({ data: () => log }));
        }
      } as any);

      const logs = await queryAuditLogs({ identityRecordId });

      expect(mockWhere).toHaveBeenCalledWith('identityRecordId', '==', identityRecordId);
      expect(logs).toHaveLength(3);
      logs.forEach(log => {
        expect(log.identityRecordId).toBe(identityRecordId);
      });
    });

    it('should get identity record audit trail', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const identityRecordId = 'identity-456';

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.UPLOAD,
              documentId: 'doc-1',
              documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              identityRecordId,
              userId: 'user-1',
              userEmail: 'user@example.com',
              userName: 'Test User',
              userRole: 'broker',
              result: 'success',
              createdAt: { _seconds: Date.now() / 1000 }
            })
          });
        }
      } as any);

      const logs = await getIdentityRecordAuditTrail(identityRecordId);

      expect(logs).toHaveLength(1);
      expect(logs[0].identityRecordId).toBe(identityRecordId);
    });
  });

  describe('Audit Log Queries by Time Range (Requirement 5.4)', () => {
    it('should query audit logs by start date', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockWhere = vi.mocked(where);
      const mockTimestamp = vi.mocked(Timestamp);

      const startDate = new Date('2024-01-01');

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.VIEW,
              documentId: 'doc-1',
              documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              identityRecordId: 'identity-1',
              userId: 'user-1',
              userEmail: 'user@example.com',
              userName: 'Test User',
              userRole: 'broker',
              result: 'success',
              createdAt: { _seconds: Date.now() / 1000 }
            })
          });
        }
      } as any);

      await queryAuditLogs({ startDate });

      expect(mockTimestamp.fromDate).toHaveBeenCalledWith(startDate);
      expect(mockWhere).toHaveBeenCalledWith('createdAt', '>=', expect.anything());
    });

    it('should query audit logs by end date', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockWhere = vi.mocked(where);
      const mockTimestamp = vi.mocked(Timestamp);

      const endDate = new Date('2024-12-31');

      mockGetDocs.mockResolvedValue({
        forEach: () => {}
      } as any);

      await queryAuditLogs({ endDate });

      expect(mockTimestamp.fromDate).toHaveBeenCalledWith(endDate);
      expect(mockWhere).toHaveBeenCalledWith('createdAt', '<=', expect.anything());
    });

    it('should query audit logs by date range', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockWhere = vi.mocked(where);
      const mockTimestamp = vi.mocked(Timestamp);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action: DocumentAction.DOWNLOAD,
              documentId: 'doc-1',
              documentType: CACDocumentType.SHARE_ALLOTMENT,
              identityRecordId: 'identity-1',
              userId: 'user-1',
              userEmail: 'user@example.com',
              userName: 'Test User',
              userRole: 'admin',
              result: 'success',
              createdAt: { _seconds: new Date('2024-06-15').getTime() / 1000 }
            })
          });
        }
      } as any);

      const logs = await queryAuditLogs({ startDate, endDate });

      expect(mockTimestamp.fromDate).toHaveBeenCalledWith(startDate);
      expect(mockTimestamp.fromDate).toHaveBeenCalledWith(endDate);
      expect(mockWhere).toHaveBeenCalledWith('createdAt', '>=', expect.anything());
      expect(mockWhere).toHaveBeenCalledWith('createdAt', '<=', expect.anything());
      expect(logs).toHaveLength(1);
    });
  });

  describe('Combined Query Filters (Requirement 5.4)', () => {
    it('should query audit logs with multiple filters', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockWhere = vi.mocked(where);

      const userId = 'user-789';
      const action = DocumentAction.VIEW;
      const startDate = new Date('2024-01-01');

      mockGetDocs.mockResolvedValue({
        forEach: (callback: any) => {
          callback({
            data: () => ({
              eventType: 'cac_document_access',
              action,
              documentId: 'doc-1',
              documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
              identityRecordId: 'identity-1',
              userId,
              userEmail: 'user@example.com',
              userName: 'Test User',
              userRole: 'broker',
              result: 'success',
              createdAt: { _seconds: Date.now() / 1000 }
            })
          });
        }
      } as any);

      const logs = await queryAuditLogs({ userId, action, startDate });

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', userId);
      expect(mockWhere).toHaveBeenCalledWith('action', '==', action);
      expect(mockWhere).toHaveBeenCalledWith('createdAt', '>=', expect.anything());
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe(userId);
      expect(logs[0].action).toBe(action);
    });

    it('should apply ordering and limit to query results', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockOrderBy = vi.mocked(orderBy);
      const mockLimit = vi.mocked(limit);

      mockGetDocs.mockResolvedValue({
        forEach: () => {}
      } as any);

      await queryAuditLogs({ limit: 50 });

      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(50);
    });
  });

  describe('Audit Trail Completeness', () => {
    it('should maintain chronological order in audit trail', async () => {
      const mockGetDocs = vi.mocked(getDocs);
      const mockOrderBy = vi.mocked(orderBy);

      mockGetDocs.mockResolvedValue({
        forEach: () => {}
      } as any);

      await queryAuditLogs({ documentId: 'doc-123' });

      // Verify ordering by timestamp descending (most recent first)
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should handle empty audit trail', async () => {
      const mockGetDocs = vi.mocked(getDocs);

      mockGetDocs.mockResolvedValue({
        forEach: () => {}
      } as any);

      const logs = await queryAuditLogs({ documentId: 'non-existent-doc' });

      expect(logs).toHaveLength(0);
    });

    it('should handle query errors gracefully', async () => {
      const mockGetDocs = vi.mocked(getDocs);

      mockGetDocs.mockRejectedValue(new Error('Firestore query error'));

      await expect(queryAuditLogs({ userId: 'user-123' })).rejects.toThrow('Firestore query error');
    });
  });
});
