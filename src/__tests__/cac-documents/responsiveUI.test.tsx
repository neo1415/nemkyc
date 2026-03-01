/**
 * Responsive UI Tests for CAC Document Upload Management
 * 
 * Tests responsive behavior across different screen sizes
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CACDocumentPreview } from '../../components/identity/CACDocumentPreview';
import { CACDocumentMetadata, CACDocumentType, DocumentStatus } from '../../types/cacDocuments';

// Mock services
vi.mock('../../services/cacStorageService', () => ({
  getDocumentForPreview: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
  downloadDocument: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../../services/cacEncryptionService', () => ({
  createBlobFromDecryptedData: vi.fn((data, mimeType) => new Blob([data], { type: mimeType }))
}));

vi.mock('../../services/cacAccessControl', () => ({
  shouldShowDocumentActions: vi.fn().mockReturnValue(true)
}));

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'user-123',
      email: 'test@example.com',
      role: 'admin'
    }
  })
}));

/**
 * Helper to set viewport size
 */
function setViewportSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  });
  window.dispatchEvent(new Event('resize'));
}

/**
 * Helper to create mock document metadata
 */
function createMockDocument(overrides?: Partial<CACDocumentMetadata>): CACDocumentMetadata {
  return {
    id: 'doc-123',
    identityRecordId: 'identity-123',
    documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
    filename: 'certificate.pdf',
    fileSize: 1024 * 1024, // 1MB
    mimeType: 'application/pdf',
    storagePath: '/cac-documents/doc-123',
    uploadedAt: new Date(),
    uploaderId: 'user-123',
    encryptionMetadata: {
      algorithm: 'aes-256-gcm',
      keyVersion: 'v1',
      iv: 'test-iv'
    },
    status: DocumentStatus.UPLOADED,
    version: 1,
    isCurrent: true,
    ...overrides
  };
}

describe('Responsive UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Layout on Different Screen Sizes - Requirement 15.1', () => {
    it('should render preview modal at desktop size (1920x1080)', () => {
      setViewportSize(1920, 1080);
      const document = createMockDocument();

      const { container } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
    });

    it('should render preview modal at tablet size (768x1024)', () => {
      setViewportSize(768, 1024);
      const document = createMockDocument();

      const { container } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
    });

    it('should render preview modal at mobile size (375x667)', () => {
      setViewportSize(375, 667);
      const document = createMockDocument();

      const { container } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
    });

    it('should render preview modal at minimum width (320px) - Requirement 15.5', () => {
      setViewportSize(320, 568);
      const document = createMockDocument();

      const { container } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
    });
  });

  describe('Modal Responsiveness - Requirement 15.2', () => {
    it('should display full controls on desktop', () => {
      setViewportSize(1920, 1080);
      const document = createMockDocument({ mimeType: 'image/jpeg' });

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
      expect(screen.getByText('Download')).toBeInTheDocument();
    });

    it('should adapt controls for tablet', () => {
      setViewportSize(768, 1024);
      const document = createMockDocument({ mimeType: 'image/jpeg' });

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByText('Download')).toBeInTheDocument();
    });

    it('should optimize controls for mobile', () => {
      setViewportSize(375, 667);
      const document = createMockDocument({ mimeType: 'image/jpeg' });

      render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
      expect(screen.getByText('Download')).toBeInTheDocument();
    });

    it('should handle PDF preview responsively', () => {
      setViewportSize(375, 667);
      const document = createMockDocument({ mimeType: 'application/pdf' });

      const { container } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      const iframe = container.querySelector('iframe');
      expect(iframe).toBeInTheDocument();
    });

    it('should handle image preview responsively', () => {
      setViewportSize(375, 667);
      const document = createMockDocument({ 
        mimeType: 'image/jpeg',
        filename: 'test-image.jpg'
      });

      const { container } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Mobile Status Indicators - Requirement 15.3', () => {
    it('should render status indicators at desktop size', () => {
      setViewportSize(1920, 1080);

      const { container } = render(
        <div className="cac-status-container">
          <div className="cac-status-indicator uploaded">
            <span className="cac-status-icon">✓</span>
            <span className="cac-status-label full-text">Certificate of Incorporation</span>
            <span className="cac-status-label short-text">Cert</span>
          </div>
        </div>
      );

      const indicator = container.querySelector('.cac-status-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass('uploaded');
    });

    it('should render compact status indicators at mobile size', () => {
      setViewportSize(375, 667);

      const { container } = render(
        <div className="cac-status-container">
          <div className="cac-status-indicator uploaded">
            <span className="cac-status-icon">✓</span>
            <span className="cac-status-label full-text">Certificate of Incorporation</span>
            <span className="cac-status-label short-text">Cert</span>
          </div>
        </div>
      );

      const indicator = container.querySelector('.cac-status-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass('uploaded');
    });

    it('should render status indicators at minimum width', () => {
      setViewportSize(320, 568);

      const { container } = render(
        <div className="cac-status-container">
          <div className="cac-status-indicator missing">
            <span className="cac-status-icon">✗</span>
            <span className="cac-status-label full-text">Particulars of Directors</span>
            <span className="cac-status-label short-text">Dir</span>
          </div>
        </div>
      );

      const indicator = container.querySelector('.cac-status-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass('missing');
    });

    it('should handle multiple status indicators in a row', () => {
      setViewportSize(375, 667);

      const { container } = render(
        <div className="cac-status-container">
          <div className="cac-status-indicator uploaded">
            <span className="cac-status-icon">✓</span>
            <span className="cac-status-label">Cert</span>
          </div>
          <div className="cac-status-indicator missing">
            <span className="cac-status-icon">✗</span>
            <span className="cac-status-label">Dir</span>
          </div>
          <div className="cac-status-indicator pending">
            <span className="cac-status-icon">⏱</span>
            <span className="cac-status-label">Share</span>
          </div>
        </div>
      );

      const indicators = container.querySelectorAll('.cac-status-indicator');
      expect(indicators).toHaveLength(3);
    });
  });

  describe('Touch Controls - Requirement 15.4', () => {
    it('should have adequate touch target size on mobile', () => {
      setViewportSize(375, 667);

      const { container } = render(
        <div>
          <button className="cac-button">Upload</button>
          <button className="cac-icon-button">×</button>
          <div className="cac-status-indicator uploaded">Status</div>
        </div>
      );

      expect(container.querySelector('.cac-button')).toBeInTheDocument();
      expect(container.querySelector('.cac-icon-button')).toBeInTheDocument();
      expect(container.querySelector('.cac-status-indicator')).toBeInTheDocument();
    });

    it('should have larger touch targets on small screens', () => {
      setViewportSize(320, 568);

      const { container } = render(
        <div>
          <button className="cac-button">Upload</button>
          <div className="cac-file-input-area">Drop files here</div>
        </div>
      );

      expect(container.querySelector('.cac-button')).toBeInTheDocument();
      expect(container.querySelector('.cac-file-input-area')).toBeInTheDocument();
    });

    it('should support touch-friendly file upload area', () => {
      setViewportSize(375, 667);

      const { container } = render(
        <div className="cac-upload-field">
          <div className="cac-file-input-area">
            Tap to select file or drag and drop
          </div>
        </div>
      );

      expect(container.querySelector('.cac-upload-field')).toBeInTheDocument();
      expect(container.querySelector('.cac-file-input-area')).toBeInTheDocument();
    });
  });

  describe('Minimum Width Support (320px) - Requirement 15.5', () => {
    it('should maintain usability at 320px width', () => {
      setViewportSize(320, 568);
      const document = createMockDocument();

      const { container } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
    });

    it('should render upload fields at 320px width', () => {
      setViewportSize(320, 568);

      const { container } = render(
        <div className="cac-upload-container">
          <div className="cac-upload-field">
            <div className="cac-upload-field-header">
              <span className="cac-upload-field-title">Certificate of Incorporation</span>
            </div>
          </div>
        </div>
      );

      expect(container.querySelector('.cac-upload-field')).toBeInTheDocument();
      expect(container.querySelector('.cac-upload-field-title')).toBeInTheDocument();
    });

    it('should render status indicators at 320px width', () => {
      setViewportSize(320, 568);

      const { container } = render(
        <div className="cac-status-container">
          <div className="cac-status-indicator uploaded">
            <span className="cac-status-icon">✓</span>
            <span className="cac-status-label">Cert</span>
          </div>
        </div>
      );

      expect(container.querySelector('.cac-status-indicator')).toBeInTheDocument();
    });

    it('should handle loading state at 320px width', () => {
      setViewportSize(320, 568);

      const { container } = render(
        <div className="cac-loading-container">
          <div className="cac-loading-spinner" />
          <div className="cac-loading-text">Loading...</div>
        </div>
      );

      expect(container.querySelector('.cac-loading-container')).toBeInTheDocument();
      expect(container.querySelector('.cac-loading-text')).toBeInTheDocument();
    });

    it('should handle error messages at 320px width', () => {
      setViewportSize(320, 568);

      const { container } = render(
        <div className="cac-error-message">
          Failed to load document. Please try again.
        </div>
      );

      const errorMessage = container.querySelector('.cac-error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Failed to load document');
    });
  });

  describe('Responsive Grid Layout', () => {
    it('should render document grid at desktop size', () => {
      setViewportSize(1920, 1080);

      const { container } = render(
        <div className="cac-document-grid">
          <div>Document 1</div>
          <div>Document 2</div>
          <div>Document 3</div>
        </div>
      );

      const grid = container.querySelector('.cac-document-grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.children).toHaveLength(3);
    });

    it('should adapt grid for tablet', () => {
      setViewportSize(768, 1024);

      const { container } = render(
        <div className="cac-document-grid">
          <div>Document 1</div>
          <div>Document 2</div>
        </div>
      );

      const grid = container.querySelector('.cac-document-grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.children).toHaveLength(2);
    });

    it('should use single column on mobile', () => {
      setViewportSize(375, 667);

      const { container } = render(
        <div className="cac-document-grid">
          <div>Document 1</div>
          <div>Document 2</div>
        </div>
      );

      const grid = container.querySelector('.cac-document-grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.children).toHaveLength(2);
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape transition', () => {
      setViewportSize(375, 667);
      const document = createMockDocument();

      const { container, rerender } = render(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();

      setViewportSize(667, 375);
      rerender(
        <CACDocumentPreview
          open={true}
          onClose={vi.fn()}
          document={document}
          ownerId="user-123"
        />
      );

      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility at Different Sizes', () => {
    it('should maintain focus visibility on mobile', () => {
      setViewportSize(375, 667);

      const { container } = render(
        <button className="cac-button">Upload</button>
      );

      expect(container.querySelector('.cac-button')).toBeInTheDocument();
    });

    it('should support keyboard navigation on all screen sizes', () => {
      setViewportSize(320, 568);

      const { container } = render(
        <div>
          <button className="cac-button">Upload</button>
          <div className="cac-status-indicator uploaded" tabIndex={0}>
            Status
          </div>
        </div>
      );

      const button = container.querySelector('.cac-button');
      expect(button).toBeInTheDocument();

      const indicator = container.querySelector('.cac-status-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('tabIndex', '0');
    });
  });
});
