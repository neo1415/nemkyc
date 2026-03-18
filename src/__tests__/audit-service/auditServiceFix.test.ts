/**
 * Audit Service Fix Tests
 * 
 * Tests to verify:
 * 1. Audit service uses correct port (3001 instead of 8080)
 * 2. 403 Forbidden errors are handled gracefully
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { auditService } from '../../services/auditService';

describe('Audit Service Fix', () => {
  let fetchSpy: any;

  beforeEach(() => {
    // Mock fetch
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Port Configuration', () => {
    it('should use port 3001 instead of 8080', async () => {
      // Mock successful response
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      await auditService.logFormView({
        userId: 'test-user',
        userRole: 'broker',
        userEmail: 'test@example.com',
        formType: 'kyc',
        formVariant: 'individual'
      });

      // Verify fetch was called with correct port
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:3001/api/audit'),
        expect.any(Object)
      );

      // Verify it's NOT using port 8080
      expect(fetchSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:8080'),
        expect.any(Object)
      );
    });

    it('should use correct endpoint for document upload', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK'
      });

      await auditService.logDocumentUpload({
        userId: 'test-user',
        userRole: 'broker',
        userEmail: 'test@example.com',
        formType: 'kyc',
        documentType: 'cac',
        fileName: 'test.pdf',
        fileSize: 1024
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3001/api/audit/document_upload',
        expect.any(Object)
      );
    });
  });

  describe('403 Forbidden Error Handling', () => {
    it('should handle 403 errors gracefully without throwing', async () => {
      // Mock 403 response
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      // Should not throw
      await expect(
        auditService.logFormView({
          userId: 'test-user',
          userRole: 'broker',
          userEmail: 'test@example.com',
          formType: 'kyc',
          formVariant: 'individual'
        })
      ).resolves.not.toThrow();
    });

    it('should handle 403 errors for document upload without throwing', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      await expect(
        auditService.logDocumentUpload({
          userId: 'test-user',
          userRole: 'broker',
          userEmail: 'test@example.com',
          formType: 'kyc',
          documentType: 'cac',
          fileName: 'test.pdf',
          fileSize: 1024
        })
      ).resolves.not.toThrow();
    });

    it('should handle 403 errors for form submission without throwing', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      await expect(
        auditService.logFormSubmission({
          userId: 'test-user',
          userRole: 'broker',
          userEmail: 'test@example.com',
          formType: 'kyc',
          formVariant: 'individual',
          submissionId: 'test-submission-id'
        })
      ).resolves.not.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await expect(
        auditService.logFormView({
          userId: 'test-user',
          userRole: 'broker',
          userEmail: 'test@example.com',
          formType: 'kyc',
          formVariant: 'individual'
        })
      ).resolves.not.toThrow();
    });

    it('should handle timeout errors gracefully', async () => {
      fetchSpy.mockRejectedValue(new Error('Timeout'));

      await expect(
        auditService.logDocumentUpload({
          userId: 'test-user',
          userRole: 'broker',
          userEmail: 'test@example.com',
          formType: 'kyc',
          documentType: 'cac',
          fileName: 'test.pdf',
          fileSize: 1024
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Non-Critical Failure Behavior', () => {
    it('should not break app flow when audit logging fails', async () => {
      fetchSpy.mockRejectedValue(new Error('Server error'));

      // Should complete without throwing
      await auditService.logFormView({
        userId: 'test-user',
        userRole: 'broker',
        userEmail: 'test@example.com',
        formType: 'kyc',
        formVariant: 'individual'
      });

      // Verify fetch was attempted
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should handle 500 errors gracefully', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(
        auditService.logFormSubmission({
          userId: 'test-user',
          userRole: 'broker',
          userEmail: 'test@example.com',
          formType: 'kyc',
          formVariant: 'individual',
          submissionId: 'test-submission-id'
        })
      ).resolves.not.toThrow();
    });
  });
});
