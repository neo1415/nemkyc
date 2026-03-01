/**
 * Performance Tests for CAC Document Preview
 * 
 * Tests preview performance including:
 * - Preview loading time for files under 5MB
 * - Lazy loading behavior
 * - Caching effectiveness
 * - Thumbnail generation performance
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CACDocumentPreview, clearDocumentCache, getDocumentCacheSize } from '../../components/identity/CACDocumentPreview';
import { CACDocumentMetadata, CACDocumentType, DocumentStatus } from '../../types/cacDocuments';
import * as cacStorageService from '../../services/cacStorageService';
import * as cacEncryptionService from '../../services/cacEncryptionService';
import * as cacAccessControl from '../../services/cacAccessControl';

// Mock the services
vi.mock('../../services/cacStorageService');
vi.mock('../../services/cacEncryptionService');
vi.mock('../../services/cacAccessControl');

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-123',
      email: 'test@example.com',
      role: 'broker'
    }
  })
}));

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('Performance Tests: CAC Document Preview', () => {
  const ownerId = 'test-user-123';

  /**
   * Creates a mock document with specified size
   */
  const createMockDocument = (sizeInMB: number, mimeType: string = 'application/pdf'): CACDocumentMetadata => ({
    id: `doc-${Date.now()}`,
    documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
    filename: `document-${sizeInMB}mb.pdf`,
    fileSize: sizeInMB * 1024 * 1024,
    mimeType,
    uploadedAt: new Date(),
    uploaderId: 'test-user-123',
    identityRecordId: 'identity-456',
    storagePath: `cac-documents/identity-456/certificate_of_incorporation/${Date.now()}_document.pdf`,
    encryptionMetadata: {
      algorithm: 'AES-256-GCM',
      keyVersion: 'v1',
      iv: 'mock-iv',
      authTag: 'mock-tag'
    },
    status: DocumentStatus.UPLOADED,
    version: 1,
    isCurrent: true
  });

  /**
   * Creates mock decrypted data of specified size
   */
  const createMockData = (sizeInMB: number): ArrayBuffer => {
    const sizeInBytes = sizeInMB * 1024 * 1024;
    return new ArrayBuffer(sizeInBytes);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearDocumentCache();

    // Default mock implementations
    vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReturnValue(true);
    vi.mocked(cacEncryptionService.createBlobFromDecryptedData).mockImplementation(
      (data, type) => new Blob([data], { type })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Preview loading time', () => {
    /**
     * Requirement 10.3: Preview loading time under 3 seconds for files under 5MB
     */
    it('should load 1MB document preview in under 3 seconds', async () => {
      const document = createMockDocument(1);
      const mockData = createMockData(1);

      // Mock fetch with realistic delay
      vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        return mockData;
      });

      const startTime = performance.now();

      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(cacStorageService.getDocumentForPreview).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      }, { timeout: 3000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds

      unmount();
    });

    it('should load 3MB document preview in under 3 seconds', async () => {
      const document = createMockDocument(3);
      const mockData = createMockData(3);

      vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay
        return mockData;
      });

      const startTime = performance.now();

      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      }, { timeout: 3000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(3000);

      unmount();
    });

    it('should load 5MB document preview in under 3 seconds', async () => {
      const document = createMockDocument(5);
      const mockData = createMockData(5);

      vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1200)); // 1.2s delay
        return mockData;
      });

      const startTime = performance.now();

      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      }, { timeout: 3000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(3000);

      unmount();
    });

    it('should handle small documents (< 100KB) very quickly', async () => {
      const document = createMockDocument(0.1); // 100KB
      const mockData = createMockData(0.1);

      vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
        return mockData;
      });

      const startTime = performance.now();

      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      }, { timeout: 1000 });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(500); // Should be very fast

      unmount();
    });
  });

  describe('Caching effectiveness', () => {
    /**
     * Requirement 10.2: Cache decrypted documents for session
     */
    it('should cache document after first load', async () => {
      const document = createMockDocument(2);
      const mockData = createMockData(2);

      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      expect(getDocumentCacheSize()).toBe(0);

      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(getDocumentCacheSize()).toBe(1);
      });

      unmount();
    });

    it('should use cached document on subsequent loads', async () => {
      const document = createMockDocument(2);
      const mockData = createMockData(2);

      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      // First load
      const { unmount: unmount1 } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);
      });

      unmount1();

      // Second load - should use cache
      const { unmount: unmount2 } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });

      // Should still only have been called once (using cache)
      expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);

      unmount2();
    });

    it('should significantly improve load time with cache', async () => {
      const document = createMockDocument(3);
      const mockData = createMockData(3);

      // First load with delay
      vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
        return mockData;
      });

      // First load
      const startTime1 = performance.now();
      const { unmount: unmount1 } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });

      const endTime1 = performance.now();
      const loadTime1 = endTime1 - startTime1;

      unmount1();

      // Second load (cached)
      const startTime2 = performance.now();
      const { unmount: unmount2 } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });

      const endTime2 = performance.now();
      const loadTime2 = endTime2 - startTime2;

      unmount2();

      // Cached load should be significantly faster
      expect(loadTime2).toBeLessThan(loadTime1 * 0.5); // At least 50% faster
    });

    it('should handle multiple documents in cache', async () => {
      const documents = [
        createMockDocument(1),
        createMockDocument(2),
        createMockDocument(3)
      ];

      for (const document of documents) {
        const mockData = createMockData(document.fileSize / (1024 * 1024));
        vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

        const { unmount } = render(
          <CACDocumentPreview
            open={true}
            onClose={vi.fn()}
            document={document}
            ownerId={ownerId}
          />
        );

        await waitFor(() => {
          expect(URL.createObjectURL).toHaveBeenCalled();
        });

        unmount();
      }

      expect(getDocumentCacheSize()).toBe(3);
    });

    it('should clear cache when clearDocumentCache is called', async () => {
      const document = createMockDocument(2);
      const mockData = createMockData(2);

      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(getDocumentCacheSize()).toBe(1);
      });

      unmount();

      clearDocumentCache();
      expect(getDocumentCacheSize()).toBe(0);
    });
  });

  describe('Lazy loading behavior', () => {
    /**
     * Requirement 10.1: Implement lazy loading for document lists
     * Requirement 10.6: Load previews on-demand as they become visible
     */
    it('should not load document when modal is closed', () => {
      const document = createMockDocument(2);

      render(
        <CACDocumentPreview
          open={false}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      // Should not fetch document when modal is closed
      expect(cacStorageService.getDocumentForPreview).not.toHaveBeenCalled();
    });

    it('should only load document when modal opens', async () => {
      const document = createMockDocument(2);
      const mockData = createMockData(2);

      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const { rerender } = render(
        <CACDocumentPreview
          open={false}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      expect(cacStorageService.getDocumentForPreview).not.toHaveBeenCalled();

      // Open modal
      rerender(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(cacStorageService.getDocumentForPreview).toHaveBeenCalled();
      });
    });

    it('should not load document for unauthorized users', () => {
      const document = createMockDocument(2);

      vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReturnValue(false);

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      // Should not fetch document for unauthorized users
      expect(cacStorageService.getDocumentForPreview).not.toHaveBeenCalled();
    });
  });

  describe('Memory management', () => {
    it('should revoke object URLs to prevent memory leaks', async () => {
      const document = createMockDocument(2);
      const mockData = createMockData(2);

      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });

      unmount();

      // Should revoke URL on unmount
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should handle rapid open/close cycles without memory leaks', async () => {
      const document = createMockDocument(1);
      const mockData = createMockData(1);

      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      // Simulate rapid open/close cycles
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <CACDocumentPreview
            open={true}
            onClose={vi.fn()}
            document={document}
            ownerId={ownerId}
          />
        );

        await waitFor(() => {
          expect(URL.createObjectURL).toHaveBeenCalled();
        });

        unmount();
      }

      // Should revoke URLs for each cycle
      expect(URL.revokeObjectURL).toHaveBeenCalledTimes(10);
    });
  });

  describe('Performance with different file types', () => {
    /**
     * Requirement 10.5: Optimize image previews by generating lower-resolution versions
     */
    it('should handle PDF files efficiently', async () => {
      const document = createMockDocument(3, 'application/pdf');
      const mockData = createMockData(3);

      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const startTime = performance.now();

      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(3000);

      unmount();
    });

    it('should handle JPEG images efficiently', async () => {
      const document = createMockDocument(2, 'image/jpeg');
      const mockData = createMockData(2);

      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const startTime = performance.now();

      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(3000);

      unmount();
    });

    it('should handle PNG images efficiently', async () => {
      const document = createMockDocument(2, 'image/png');
      const mockData = createMockData(2);

      vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

      const startTime = performance.now();

      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeLessThan(3000);

      unmount();
    });
  });

  describe('Concurrent preview requests', () => {
    it('should handle multiple preview requests efficiently', async () => {
      const documents = [
        createMockDocument(1),
        createMockDocument(2),
        createMockDocument(1.5)
      ];

      const startTime = performance.now();

      const renders = documents.map(document => {
        const mockData = createMockData(document.fileSize / (1024 * 1024));
        vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockData);

        return render(
          <CACDocumentPreview
            open={true}
            onClose={vi.fn()}
            document={document}
            ownerId={ownerId}
          />
        );
      });

      await Promise.all(
        renders.map(({ unmount }) =>
          waitFor(() => {
            expect(URL.createObjectURL).toHaveBeenCalled();
          }).then(() => unmount())
        )
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(5000); // All three should load in under 5 seconds
    });
  });
});
