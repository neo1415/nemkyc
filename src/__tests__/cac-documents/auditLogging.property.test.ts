/**
 * Property-Based Tests for CAC Document Audit Logging
 * 
 * Property 7: Audit log completeness
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.5**
 * 
 * Tests that every document operation generates an audit log with complete data.
 * Uses fast-check to generate various operation sequences.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  logDocumentUpload,
  logDocumentView,
  logDocumentDownload,
  logAccessDenied,
  DocumentAction,
  CACDocumentType,
  type LogUploadParams,
  type LogViewParams,
  type LogDownloadParams,
  type LogAccessDeniedParams
} from '../../services/cacAuditLogger';
import { addDoc } from 'firebase/firestore';

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

describe('Property 7: Audit Log Completeness', () => {
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

  // Arbitraries for generating test data
  const documentIdArb = fc.string({ minLength: 1, maxLength: 50 });
  const userIdArb = fc.string({ minLength: 1, maxLength: 50 });
  const emailArb = fc.emailAddress();
  const nameArb = fc.string({ minLength: 1, maxLength: 100 });
  const roleArb = fc.constantFrom('admin', 'super_admin', 'broker', 'user');
  const documentTypeArb = fc.constantFrom(
    CACDocumentType.CERTIFICATE_OF_INCORPORATION,
    CACDocumentType.PARTICULARS_OF_DIRECTORS,
    CACDocumentType.SHARE_ALLOTMENT
  );
  const fileNameArb = fc.string({ minLength: 1, maxLength: 100 }).map(s => s + '.pdf');
  const fileSizeArb = fc.integer({ min: 1, max: 10485760 }); // 1 byte to 10MB
  const ipAddressArb = fc.ipV4();
  const userAgentArb = fc.constantFrom(
    'Mozilla/5.0',
    'Chrome/91.0',
    'Safari/14.0',
    'Edge/91.0'
  );

  describe('Upload Operation Completeness (Requirement 5.3)', () => {
    it('should always generate a complete audit log for upload operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentIdArb,
          documentTypeArb,
          userIdArb,
          emailArb,
          nameArb,
          roleArb,
          fileNameArb,
          fileSizeArb,
          ipAddressArb,
          userAgentArb,
          async (docId, docType, userId, email, name, role, fileName, fileSize, ip, ua) => {
            const mockAddDoc = vi.mocked(addDoc);
            mockAddDoc.mockResolvedValue({ id: 'log-' + Math.random() } as any);

            const uploadParams: LogUploadParams = {
              documentId: docId,
              documentType: docType,
              identityRecordId: 'identity-' + userId,
              userId,
              userEmail: email,
              userName: name,
              userRole: role,
              fileName,
              fileSize,
              ipAddress: ip,
              userAgent: ua
            };

            await logDocumentUpload(uploadParams);

            // Verify addDoc was called
            expect(mockAddDoc).toHaveBeenCalled();

            const logEntry = mockAddDoc.mock.calls[mockAddDoc.mock.calls.length - 1][1];

            // Property: All required fields must be present
            expect(logEntry.eventType).toBe('cac_document_access');
            expect(logEntry.action).toBe(DocumentAction.UPLOAD);
            expect(logEntry.documentId).toBe(docId);
            expect(logEntry.documentType).toBe(docType);
            expect(logEntry.identityRecordId).toBe('identity-' + userId);
            expect(logEntry.userId).toBe(userId);
            expect(logEntry.userEmail).toBe(email);
            expect(logEntry.userName).toBe(name);
            expect(logEntry.userRole).toBe(role);
            expect(logEntry.result).toBe('success');
            expect(logEntry.createdAt).toBeDefined();

            // Property: Metadata must contain file information
            expect(logEntry.metadata).toBeDefined();
            expect(logEntry.metadata.fileName).toBe(fileName);
            expect(logEntry.metadata.fileSize).toBe(fileSize);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('View Operation Completeness (Requirement 5.1)', () => {
    it('should always generate a complete audit log for view operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentIdArb,
          documentTypeArb,
          userIdArb,
          emailArb,
          nameArb,
          roleArb,
          ipAddressArb,
          userAgentArb,
          async (docId, docType, userId, email, name, role, ip, ua) => {
            const mockAddDoc = vi.mocked(addDoc);
            mockAddDoc.mockResolvedValue({ id: 'log-' + Math.random() } as any);

            const viewParams: LogViewParams = {
              documentId: docId,
              documentType: docType,
              identityRecordId: 'identity-' + userId,
              userId,
              userEmail: email,
              userName: name,
              userRole: role,
              ipAddress: ip,
              userAgent: ua
            };

            await logDocumentView(viewParams);

            expect(mockAddDoc).toHaveBeenCalled();

            const logEntry = mockAddDoc.mock.calls[mockAddDoc.mock.calls.length - 1][1];

            // Property: All required fields must be present
            expect(logEntry.eventType).toBe('cac_document_access');
            expect(logEntry.action).toBe(DocumentAction.VIEW);
            expect(logEntry.documentId).toBe(docId);
            expect(logEntry.documentType).toBe(docType);
            expect(logEntry.identityRecordId).toBe('identity-' + userId);
            expect(logEntry.userId).toBe(userId);
            expect(logEntry.userEmail).toBe(email);
            expect(logEntry.userName).toBe(name);
            expect(logEntry.userRole).toBe(role);
            expect(logEntry.result).toBe('success');
            expect(logEntry.createdAt).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Download Operation Completeness (Requirement 5.2)', () => {
    it('should always generate a complete audit log for download operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentIdArb,
          documentTypeArb,
          userIdArb,
          emailArb,
          nameArb,
          roleArb,
          ipAddressArb,
          userAgentArb,
          async (docId, docType, userId, email, name, role, ip, ua) => {
            const mockAddDoc = vi.mocked(addDoc);
            mockAddDoc.mockResolvedValue({ id: 'log-' + Math.random() } as any);

            const downloadParams: LogDownloadParams = {
              documentId: docId,
              documentType: docType,
              identityRecordId: 'identity-' + userId,
              userId,
              userEmail: email,
              userName: name,
              userRole: role,
              ipAddress: ip,
              userAgent: ua
            };

            await logDocumentDownload(downloadParams);

            expect(mockAddDoc).toHaveBeenCalled();

            const logEntry = mockAddDoc.mock.calls[mockAddDoc.mock.calls.length - 1][1];

            // Property: All required fields must be present
            expect(logEntry.eventType).toBe('cac_document_access');
            expect(logEntry.action).toBe(DocumentAction.DOWNLOAD);
            expect(logEntry.documentId).toBe(docId);
            expect(logEntry.documentType).toBe(docType);
            expect(logEntry.identityRecordId).toBe('identity-' + userId);
            expect(logEntry.userId).toBe(userId);
            expect(logEntry.userEmail).toBe(email);
            expect(logEntry.userName).toBe(name);
            expect(logEntry.userRole).toBe(role);
            expect(logEntry.result).toBe('success');
            expect(logEntry.createdAt).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Failed Access Completeness (Requirement 5.7)', () => {
    it('should always generate a complete audit log for failed access attempts', async () => {
      const actionArb = fc.constantFrom(
        DocumentAction.VIEW,
        DocumentAction.DOWNLOAD,
        DocumentAction.UPLOAD
      );
      const reasonArb = fc.string({ minLength: 1, maxLength: 200 });

      await fc.assert(
        fc.asyncProperty(
          documentIdArb,
          documentTypeArb,
          userIdArb,
          emailArb,
          nameArb,
          roleArb,
          actionArb,
          reasonArb,
          ipAddressArb,
          userAgentArb,
          async (docId, docType, userId, email, name, role, action, reason, ip, ua) => {
            const mockAddDoc = vi.mocked(addDoc);
            mockAddDoc.mockResolvedValue({ id: 'log-' + Math.random() } as any);

            const accessDeniedParams: LogAccessDeniedParams = {
              documentId: docId,
              documentType: docType,
              identityRecordId: 'identity-' + userId,
              userId,
              userEmail: email,
              userName: name,
              userRole: role,
              attemptedAction: action,
              reason,
              ipAddress: ip,
              userAgent: ua
            };

            await logAccessDenied(accessDeniedParams);

            expect(mockAddDoc).toHaveBeenCalled();

            const logEntry = mockAddDoc.mock.calls[mockAddDoc.mock.calls.length - 1][1];

            // Property: All required fields must be present
            expect(logEntry.eventType).toBe('cac_document_access');
            expect(logEntry.action).toBe(action);
            expect(logEntry.documentId).toBe(docId);
            expect(logEntry.documentType).toBe(docType);
            expect(logEntry.identityRecordId).toBe('identity-' + userId);
            expect(logEntry.userId).toBe(userId);
            expect(logEntry.userEmail).toBe(email);
            expect(logEntry.userName).toBe(name);
            expect(logEntry.userRole).toBe(role);
            expect(logEntry.result).toBe('failure');
            expect(logEntry.failureReason).toBe(reason);
            expect(logEntry.createdAt).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Action Type Consistency (Requirement 5.5)', () => {
    it('should always include valid action type in audit logs', async () => {
      const operationArb = fc.constantFrom('upload', 'view', 'download');

      await fc.assert(
        fc.asyncProperty(
          operationArb,
          documentIdArb,
          documentTypeArb,
          userIdArb,
          emailArb,
          nameArb,
          roleArb,
          async (operation, docId, docType, userId, email, name, role) => {
            const mockAddDoc = vi.mocked(addDoc);
            mockAddDoc.mockResolvedValue({ id: 'log-' + Math.random() } as any);

            if (operation === 'upload') {
              await logDocumentUpload({
                documentId: docId,
                documentType: docType,
                identityRecordId: 'identity-' + userId,
                userId,
                userEmail: email,
                userName: name,
                userRole: role,
                fileName: 'test.pdf',
                fileSize: 1024
              });
            } else if (operation === 'view') {
              await logDocumentView({
                documentId: docId,
                documentType: docType,
                identityRecordId: 'identity-' + userId,
                userId,
                userEmail: email,
                userName: name,
                userRole: role
              });
            } else {
              await logDocumentDownload({
                documentId: docId,
                documentType: docType,
                identityRecordId: 'identity-' + userId,
                userId,
                userEmail: email,
                userName: name,
                userRole: role
              });
            }

            const logEntry = mockAddDoc.mock.calls[mockAddDoc.mock.calls.length - 1][1];

            // Property: Action type must be one of the valid DocumentAction values
            expect(Object.values(DocumentAction)).toContain(logEntry.action);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Operation Sequence Completeness', () => {
    it('should generate complete audit logs for sequences of operations', async () => {
      const operationSequenceArb = fc.array(
        fc.record({
          operation: fc.constantFrom('upload', 'view', 'download'),
          documentId: documentIdArb,
          documentType: documentTypeArb,
          userId: userIdArb,
          userEmail: emailArb,
          userName: nameArb,
          userRole: roleArb
        }),
        { minLength: 1, maxLength: 10 }
      );

      await fc.assert(
        fc.asyncProperty(operationSequenceArb, async (operations) => {
          const mockAddDoc = vi.mocked(addDoc);
          mockAddDoc.mockResolvedValue({ id: 'log-' + Math.random() } as any);

          const initialCallCount = mockAddDoc.mock.calls.length;

          // Execute all operations
          for (const op of operations) {
            if (op.operation === 'upload') {
              await logDocumentUpload({
                documentId: op.documentId,
                documentType: op.documentType,
                identityRecordId: 'identity-' + op.userId,
                userId: op.userId,
                userEmail: op.userEmail,
                userName: op.userName,
                userRole: op.userRole,
                fileName: 'test.pdf',
                fileSize: 1024
              });
            } else if (op.operation === 'view') {
              await logDocumentView({
                documentId: op.documentId,
                documentType: op.documentType,
                identityRecordId: 'identity-' + op.userId,
                userId: op.userId,
                userEmail: op.userEmail,
                userName: op.userName,
                userRole: op.userRole
              });
            } else {
              await logDocumentDownload({
                documentId: op.documentId,
                documentType: op.documentType,
                identityRecordId: 'identity-' + op.userId,
                userId: op.userId,
                userEmail: op.userEmail,
                userName: op.userName,
                userRole: op.userRole
              });
            }
          }

          // Property: Every operation must generate exactly one audit log
          const newCallCount = mockAddDoc.mock.calls.length;
          expect(newCallCount - initialCallCount).toBe(operations.length);

          // Property: All logs must have complete data
          for (let i = initialCallCount; i < newCallCount; i++) {
            const logEntry = mockAddDoc.mock.calls[i][1];
            expect(logEntry.eventType).toBe('cac_document_access');
            expect(logEntry.action).toBeDefined();
            expect(logEntry.documentId).toBeDefined();
            expect(logEntry.userId).toBeDefined();
            expect(logEntry.result).toBe('success');
            expect(logEntry.createdAt).toBeDefined();
          }
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Timestamp Consistency', () => {
    it('should always include a timestamp in audit logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentIdArb,
          documentTypeArb,
          userIdArb,
          emailArb,
          nameArb,
          roleArb,
          async (docId, docType, userId, email, name, role) => {
            const mockAddDoc = vi.mocked(addDoc);
            mockAddDoc.mockResolvedValue({ id: 'log-' + Math.random() } as any);

            await logDocumentView({
              documentId: docId,
              documentType: docType,
              identityRecordId: 'identity-' + userId,
              userId,
              userEmail: email,
              userName: name,
              userRole: role
            });

            const logEntry = mockAddDoc.mock.calls[mockAddDoc.mock.calls.length - 1][1];

            // Property: Timestamp must always be present and valid
            expect(logEntry.createdAt).toBeDefined();
            expect(logEntry.createdAt).not.toBeNull();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('User Information Completeness', () => {
    it('should always include complete user information in audit logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          documentIdArb,
          documentTypeArb,
          userIdArb,
          emailArb,
          nameArb,
          roleArb,
          async (docId, docType, userId, email, name, role) => {
            const mockAddDoc = vi.mocked(addDoc);
            mockAddDoc.mockResolvedValue({ id: 'log-' + Math.random() } as any);

            await logDocumentDownload({
              documentId: docId,
              documentType: docType,
              identityRecordId: 'identity-' + userId,
              userId,
              userEmail: email,
              userName: name,
              userRole: role
            });

            const logEntry = mockAddDoc.mock.calls[mockAddDoc.mock.calls.length - 1][1];

            // Property: All user information fields must be present
            expect(logEntry.userId).toBe(userId);
            expect(logEntry.userEmail).toBe(email);
            expect(logEntry.userName).toBe(name);
            expect(logEntry.userRole).toBe(role);
            expect(logEntry.userId).toBeTruthy();
            expect(logEntry.userEmail).toBeTruthy();
            expect(logEntry.userName).toBeTruthy();
            expect(logEntry.userRole).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
