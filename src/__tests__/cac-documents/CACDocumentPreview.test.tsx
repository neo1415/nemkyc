/**
 * Unit tests for CAC Document Preview Component
 * 
 * Tests preview component functionality including:
 * - Modal rendering
 * - PDF rendering
 * - Image rendering with zoom
 * - Loading indicator
 * - Error message display
 * - Download button visibility for authorized users
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CACDocumentPreview, useDocumentPreview, clearDocumentCache, getDocumentCacheSize } from '../../components/identity/CACDocumentPreview';
import { CACDocumentMetadata, CACDocumentType, DocumentStatus } from '../../types/cacDocuments';
import * as cacStorageService from '../../services/cacStorageService';
import * as cacEncryptionService from '../../services/cacEncryptionService';
import * as cacAccessControl from '../../services/cacAccessControl';

// Mock the services
vi.mock('../../services/cacStorageService');
vi.mock('../../services/cacEncryptionService');
vi.mock('../../services/cacAccessControl', () => ({
  shouldShowDocumentActions: vi.fn(),
  canViewDocument: vi.fn(),
  canDownloadDocument: vi.fn()
}));

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

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockObjectURL = 'blob:mock-url';
global.URL.createObjectURL = vi.fn(() => mockObjectURL);
global.URL.revokeObjectURL = vi.fn();

describe('CACDocumentPreview Component', () => {
  const mockPDFDocument: CACDocumentMetadata = {
    id: 'doc-123',
    documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
    filename: 'certificate.pdf',
    fileSize: 2 * 1024 * 1024, // 2MB
    mimeType: 'application/pdf',
    uploadedAt: new Date('2024-01-01'),
    uploaderId: 'test-user-123',
    identityRecordId: 'identity-456',
    storagePath: 'cac-documents/identity-456/certificate_of_incorporation/123_certificate.pdf',
    encryptionMetadata: {
      algorithm: 'AES-256-GCM',
      keyVersion: 'v1',
      iv: 'mock-iv',
      authTag: 'mock-tag'
    },
    status: DocumentStatus.UPLOADED,
    version: 1,
    isCurrent: true
  };

  const mockImageDocument: CACDocumentMetadata = {
    ...mockPDFDocument,
    id: 'doc-456',
    filename: 'certificate.jpg',
    mimeType: 'image/jpeg'
  };

  const mockDecryptedData = new ArrayBuffer(1024);
  const ownerId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    clearDocumentCache();

    // Default mock implementations
    vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReturnValue(true);
    vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(mockDecryptedData);
    vi.mocked(cacEncryptionService.createBlobFromDecryptedData).mockReturnValue(
      new Blob([mockDecryptedData], { type: 'application/pdf' })
    );
    vi.mocked(cacStorageService.downloadDocument).mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Modal rendering', () => {
    // Requirement 6.1: Display documents in modal dialog
    it('should render modal when open is true', () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
    });

    it('should not render modal when open is false', () => {
      render(
        <CACDocumentPreview
          open={false}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display filename and file size in title', () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
      expect(screen.getByText(/2\.00 MB/)).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(
        <CACDocumentPreview
          open={true}
          onClose={onClose}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      const closeButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('[data-testid="CloseIcon"]')
      );
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('PDF rendering', () => {
    // Requirement 6.2: Render PDF documents using PDF viewer
    it('should render PDF in iframe', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        const iframe = screen.getByTitle('certificate.pdf');
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute('src', mockObjectURL);
      });
    });

    it('should fetch and decrypt PDF document', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledWith(
          mockPDFDocument.storagePath,
          mockPDFDocument.encryptionMetadata,
          mockPDFDocument.mimeType
        );
      });
    });

    it('should create object URL for PDF', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });
    });
  });

  describe('Image rendering with zoom', () => {
    // Requirement 6.3: Display images with zoom controls
    it('should render image with zoom controls', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockImageDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        const image = screen.getByAltText('certificate.jpg');
        expect(image).toBeInTheDocument();
      });

      // Check for zoom controls
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should zoom in when zoom in button is clicked', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockImageDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });

      const zoomInButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('[data-testid="ZoomInIcon"]')
      );
      
      if (zoomInButton) {
        fireEvent.click(zoomInButton);
        await waitFor(() => {
          expect(screen.getByText('125%')).toBeInTheDocument();
        });
      }
    });

    it('should zoom out when zoom out button is clicked', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockImageDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });

      const zoomOutButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('[data-testid="ZoomOutIcon"]')
      );
      
      if (zoomOutButton) {
        fireEvent.click(zoomOutButton);
        await waitFor(() => {
          expect(screen.getByText('75%')).toBeInTheDocument();
        });
      }
    });

    it('should not zoom beyond maximum (200%)', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockImageDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });

      const zoomInButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('[data-testid="ZoomInIcon"]')
      );
      
      if (zoomInButton) {
        // Click 5 times to try to exceed 200%
        for (let i = 0; i < 5; i++) {
          fireEvent.click(zoomInButton);
        }

        await waitFor(() => {
          const zoomText = screen.getByText(/\d+%/);
          const zoomValue = parseInt(zoomText.textContent || '0');
          expect(zoomValue).toBeLessThanOrEqual(200);
        });
      }
    });

    it('should not zoom below minimum (50%)', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockImageDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
      });

      const zoomOutButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('[data-testid="ZoomOutIcon"]')
      );
      
      if (zoomOutButton) {
        // Click 5 times to try to go below 50%
        for (let i = 0; i < 5; i++) {
          fireEvent.click(zoomOutButton);
        }

        await waitFor(() => {
          const zoomText = screen.getByText(/\d+%/);
          const zoomValue = parseInt(zoomText.textContent || '0');
          expect(zoomValue).toBeGreaterThanOrEqual(50);
        });
      }
    });
  });

  describe('Loading indicator', () => {
    // Requirement 6.5: Show loading indicator while fetching
    it('should show loading indicator while fetching document', () => {
      vi.mocked(cacStorageService.getDocumentForPreview).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      expect(screen.getByText('Loading document preview...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should hide loading indicator after document loads', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading document preview...')).not.toBeInTheDocument();
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error message display', () => {
    // Requirement 6.6: Display error message on preview failure
    it('should display error message when document fetch fails', async () => {
      const errorMessage = 'Failed to fetch document';
      vi.mocked(cacStorageService.getDocumentForPreview).mockRejectedValue(
        new Error(errorMessage)
      );

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      vi.mocked(cacStorageService.getDocumentForPreview).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button is clicked', async () => {
      vi.mocked(cacStorageService.getDocumentForPreview)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockDecryptedData);

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Download button visibility', () => {
    // Requirement 6.7: Include download button for authorized users
    it('should show download button for authorized users', async () => {
      vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReturnValue(true);

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Download')).toBeInTheDocument();
      });
    });

    // Requirement 6.7: Hide download button from unauthorized users
    it('should hide download button for unauthorized users', () => {
      vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReturnValue(false);

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      expect(screen.queryByText('Download')).not.toBeInTheDocument();
    });

    it('should call downloadDocument when download button is clicked', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Download')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(cacStorageService.downloadDocument).toHaveBeenCalledWith(
          mockPDFDocument.storagePath,
          mockPDFDocument.encryptionMetadata,
          mockPDFDocument.filename,
          mockPDFDocument.mimeType
        );
      });
    });

    it('should show downloading state when download is in progress', async () => {
      vi.mocked(cacStorageService.downloadDocument).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Download')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText('Downloading...')).toBeInTheDocument();
      });
    });

    it('should display error when download fails', async () => {
      vi.mocked(cacStorageService.downloadDocument).mockRejectedValue(
        new Error('Download failed')
      );

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Download')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText('Download failed')).toBeInTheDocument();
      });
    });
  });

  describe('Document caching', () => {
    // Requirement 10.2: Cache decrypted documents for session
    it('should cache decrypted document after first load', async () => {
      const { rerender } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);
      });

      // Close and reopen
      rerender(
        <CACDocumentPreview
          open={false}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      rerender(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      // Should use cached version, not fetch again
      await waitFor(() => {
        expect(cacStorageService.getDocumentForPreview).toHaveBeenCalledTimes(1);
      });
    });

    it('should track cache size', async () => {
      expect(getDocumentCacheSize()).toBe(0);

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(getDocumentCacheSize()).toBe(1);
      });
    });

    it('should clear cache when clearDocumentCache is called', async () => {
      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(getDocumentCacheSize()).toBe(1);
      });

      clearDocumentCache();
      expect(getDocumentCacheSize()).toBe(0);
    });
  });

  describe('useDocumentPreview hook', () => {
    it('should manage preview state', async () => {
      const { result } = renderHook(() => useDocumentPreview());

      expect(result.current.previewOpen).toBe(false);
      expect(result.current.previewDocument).toBeNull();

      await waitFor(() => {
        result.current.openPreview(mockPDFDocument, ownerId);
      });

      await waitFor(() => {
        expect(result.current.previewOpen).toBe(true);
        expect(result.current.previewDocument).toEqual(mockPDFDocument);
        expect(result.current.previewOwnerId).toBe(ownerId);
      });

      await waitFor(() => {
        result.current.closePreview();
      });

      await waitFor(() => {
        expect(result.current.previewOpen).toBe(false);
      });
    });
  });

  describe('Permission checks', () => {
    // Requirement 6.4: Only display previews to authorized users
    it('should show permission warning for unauthorized users', () => {
      vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReturnValue(false);

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      expect(screen.getByText(/do not have permission/)).toBeInTheDocument();
    });

    it('should not fetch document for unauthorized users', () => {
      vi.mocked(cacAccessControl.shouldShowDocumentActions).mockReturnValue(false);

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      expect(cacStorageService.getDocumentForPreview).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should revoke object URL on unmount', async () => {
      const { unmount } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });

      unmount();

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
    });

    it('should revoke object URL when modal closes', async () => {
      const { rerender } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      await waitFor(() => {
        expect(URL.createObjectURL).toHaveBeenCalled();
      });

      rerender(
        <CACDocumentPreview
          open={false}
          onClose={vi.fn()}
          document={mockPDFDocument}
          ownerId={ownerId}
        />
      );

      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectURL);
    });
  });
});

// Helper for renderHook
function renderHook<T>(hook: () => T) {
  let result: { current: T } = { current: undefined as any };
  
  function TestComponent() {
    result.current = hook();
    return null;
  }

  const rendered = render(<TestComponent />);
  
  return { result, ...rendered };
}
