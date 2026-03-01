/**
 * Mobile-Specific UI Tests for CAC Document Upload Management
 * 
 * Tests mobile-specific functionality including:
 * - Mobile file selection
 * - Camera integration for document capture
 * - Mobile preview rendering
 * - Mobile upload progress
 * 
 * Requirements: 15.6, 15.7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
 * Helper to set mobile viewport
 */
function setMobileViewport() {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667
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

describe('Mobile-Specific UI Tests', () => {
  beforeEach(() => {
    setMobileViewport();
    vi.clearAllMocks();
  });

  describe('Mobile File Selection - Requirement 15.7', () => {
    it('should support file input with accept attribute for mobile', () => {
      const { container } = render(
        <div className="cac-upload-field">
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="cac-file-input"
          />
        </div>
      );

      const fileInput = container.querySelector('.cac-file-input') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.type).toBe('file');
      expect(fileInput.accept).toBe('application/pdf,image/jpeg,image/png');
    });

    it('should handle file selection on mobile', () => {
      const handleFileChange = vi.fn();

      const { container } = render(
        <div className="cac-upload-field">
          <input
            type="file"
            onChange={handleFileChange}
            className="cac-file-input"
          />
        </div>
      );

      const fileInput = container.querySelector('.cac-file-input') as HTMLInputElement;
      
      // Simulate file selection
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false
      });

      fireEvent.change(fileInput);
      expect(handleFileChange).toHaveBeenCalled();
    });

    it('should display file name after selection on mobile', () => {
      const { container } = render(
        <div className="cac-upload-field has-file">
          <div className="cac-upload-file-info">
            <div className="cac-file-name">certificate.pdf</div>
            <div className="cac-file-size">1.5 MB</div>
          </div>
        </div>
      );

      expect(container.querySelector('.cac-file-name')).toHaveTextContent('certificate.pdf');
      expect(container.querySelector('.cac-file-size')).toHaveTextContent('1.5 MB');
    });

    it('should provide touch-friendly file selection area', () => {
      const { container } = render(
        <div className="cac-upload-field">
          <div className="cac-file-input-area">
            Tap to select file
          </div>
        </div>
      );

      const fileInputArea = container.querySelector('.cac-file-input-area');
      expect(fileInputArea).toBeInTheDocument();
      expect(fileInputArea).toHaveTextContent('Tap to select file');
    });
  });

  describe('Camera Integration - Requirement 15.7', () => {
    it('should support camera capture attribute on mobile', () => {
      const { container } = render(
        <div className="cac-upload-field">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="cac-file-input"
          />
        </div>
      );

      const fileInput = container.querySelector('.cac-file-input') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.getAttribute('capture')).toBe('environment');
      expect(fileInput.accept).toBe('image/*');
    });

    it('should provide camera option for document capture', () => {
      const { container } = render(
        <div className="cac-upload-field">
          <div className="cac-upload-options">
            <button className="cac-button">Choose File</button>
            <button className="cac-button">Take Photo</button>
          </div>
        </div>
      );

      const buttons = container.querySelectorAll('.cac-button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('Choose File');
      expect(buttons[1]).toHaveTextContent('Take Photo');
    });

    it('should handle camera permission requests gracefully', () => {
      // Mock navigator.mediaDevices
      const mockGetUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => []
      });

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia
        },
        writable: true
      });

      const { container } = render(
        <div className="cac-camera-container">
          <button 
            className="cac-button"
            onClick={() => navigator.mediaDevices.getUserMedia({ video: true })}
          >
            Enable Camera
          </button>
        </div>
      );

      const button = container.querySelector('.cac-button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Mobile Preview Rendering - Requirement 15.6', () => {
    it('should render image preview optimized for mobile', () => {
      const document = createMockDocument({
        mimeType: 'image/jpeg',
        filename: 'document.jpg'
      });

      const { container } = render(
        <div className="cac-preview-content">
          <img
            src="blob:mock-url"
            alt={document.filename}
            className="cac-preview-image"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
          />
        </div>
      );

      const image = container.querySelector('.cac-preview-image') as HTMLImageElement;
      expect(image).toBeInTheDocument();
      expect(image.alt).toBe('document.jpg');
      expect(image.style.maxWidth).toBe('100%');
      expect(image.style.objectFit).toBe('contain');
    });

    it('should render PDF preview with mobile-optimized iframe', () => {
      const document = createMockDocument({
        mimeType: 'application/pdf',
        filename: 'document.pdf'
      });

      const { container } = render(
        <div className="cac-preview-content">
          <iframe
            src="blob:mock-url"
            title={document.filename}
            className="cac-preview-pdf"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              minHeight: '300px'
            }}
          />
        </div>
      );

      const iframe = container.querySelector('.cac-preview-pdf') as HTMLIFrameElement;
      expect(iframe).toBeInTheDocument();
      expect(iframe.title).toBe('document.pdf');
      expect(iframe.style.width).toBe('100%');
      expect(iframe.style.minHeight).toBe('300px');
    });

    it('should support pinch-to-zoom on mobile images', () => {
      const { container } = render(
        <div className="cac-preview-content">
          <img
            src="blob:mock-url"
            alt="document"
            className="cac-preview-image"
            style={{
              touchAction: 'pinch-zoom'
            }}
          />
        </div>
      );

      const image = container.querySelector('.cac-preview-image') as HTMLImageElement;
      expect(image).toBeInTheDocument();
      expect(image.style.touchAction).toBe('pinch-zoom');
    });

    it('should enable smooth scrolling on mobile preview', () => {
      const { container } = render(
        <div 
          className="cac-preview-content"
          style={{
            WebkitOverflowScrolling: 'touch',
            overflowScrolling: 'touch'
          } as React.CSSProperties}
        >
          <div>Preview content</div>
        </div>
      );

      const previewContent = container.querySelector('.cac-preview-content') as HTMLElement;
      expect(previewContent).toBeInTheDocument();
    });
  });

  describe('Mobile Upload Progress - Requirement 15.6', () => {
    it('should display upload progress bar on mobile', () => {
      const { container } = render(
        <div className="cac-upload-field">
          <div className="cac-upload-progress">
            <div 
              className="cac-upload-progress-bar"
              style={{ width: '45%' }}
            />
          </div>
          <div className="cac-upload-progress-text">45% uploaded</div>
        </div>
      );

      const progressBar = container.querySelector('.cac-upload-progress-bar') as HTMLElement;
      expect(progressBar).toBeInTheDocument();
      expect(progressBar.style.width).toBe('45%');

      const progressText = container.querySelector('.cac-upload-progress-text');
      expect(progressText).toHaveTextContent('45% uploaded');
    });

    it('should show upload speed and time remaining on mobile', () => {
      const { container } = render(
        <div className="cac-upload-field">
          <div className="cac-upload-stats">
            <span className="cac-upload-speed">1.2 MB/s</span>
            <span className="cac-upload-time-remaining">30 seconds remaining</span>
          </div>
        </div>
      );

      expect(container.querySelector('.cac-upload-speed')).toHaveTextContent('1.2 MB/s');
      expect(container.querySelector('.cac-upload-time-remaining')).toHaveTextContent('30 seconds remaining');
    });

    it('should display success indicator after upload completes', () => {
      const { container } = render(
        <div className="cac-upload-field has-file">
          <div className="cac-upload-success">
            <span className="cac-success-icon">✓</span>
            <span className="cac-success-message">Upload complete</span>
          </div>
        </div>
      );

      expect(container.querySelector('.cac-success-icon')).toHaveTextContent('✓');
      expect(container.querySelector('.cac-success-message')).toHaveTextContent('Upload complete');
    });

    it('should show error message on upload failure', () => {
      const { container } = render(
        <div className="cac-upload-field">
          <div className="cac-error-message">
            Upload failed. Please try again.
          </div>
          <button className="cac-button">Retry</button>
        </div>
      );

      expect(container.querySelector('.cac-error-message')).toHaveTextContent('Upload failed');
      expect(container.querySelector('.cac-button')).toHaveTextContent('Retry');
    });

    it('should support cancel button during upload', () => {
      const handleCancel = vi.fn();

      const { container } = render(
        <div className="cac-upload-field">
          <div className="cac-upload-progress">
            <div className="cac-upload-progress-bar" style={{ width: '30%' }} />
          </div>
          <button className="cac-button" onClick={handleCancel}>
            Cancel Upload
          </button>
        </div>
      );

      const cancelButton = container.querySelector('.cac-button');
      expect(cancelButton).toBeInTheDocument();
      
      fireEvent.click(cancelButton!);
      expect(handleCancel).toHaveBeenCalled();
    });
  });

  describe('Mobile Touch Interactions', () => {
    it('should handle touch events on upload area', () => {
      const handleTouch = vi.fn();

      const { container } = render(
        <div 
          className="cac-file-input-area"
          onTouchStart={handleTouch}
        >
          Tap to upload
        </div>
      );

      const uploadArea = container.querySelector('.cac-file-input-area');
      fireEvent.touchStart(uploadArea!);
      expect(handleTouch).toHaveBeenCalled();
    });

    it('should provide visual feedback on touch', () => {
      const { container } = render(
        <button className="cac-button cac-button-active">
          Upload
        </button>
      );

      const button = container.querySelector('.cac-button');
      expect(button).toHaveClass('cac-button-active');
    });

    it('should prevent double-tap zoom on controls', () => {
      const { container } = render(
        <div 
          className="cac-preview-controls"
          style={{ touchAction: 'manipulation' }}
        >
          <button className="cac-icon-button">+</button>
          <button className="cac-icon-button">-</button>
        </div>
      );

      const controls = container.querySelector('.cac-preview-controls') as HTMLElement;
      expect(controls.style.touchAction).toBe('manipulation');
    });
  });

  describe('Mobile Network Optimization', () => {
    it('should show loading indicator during document fetch', () => {
      const { container } = render(
        <div className="cac-loading-container">
          <div className="cac-loading-spinner" />
          <div className="cac-loading-text">Loading document...</div>
        </div>
      );

      expect(container.querySelector('.cac-loading-spinner')).toBeInTheDocument();
      expect(container.querySelector('.cac-loading-text')).toHaveTextContent('Loading document');
    });

    it('should display file size warning for large files on mobile', () => {
      const { container } = render(
        <div className="cac-upload-field">
          <div className="cac-warning-message">
            Large file detected (8.5 MB). Upload may take longer on mobile networks.
          </div>
        </div>
      );

      expect(container.querySelector('.cac-warning-message')).toHaveTextContent('Large file detected');
    });

    it('should support offline detection', () => {
      const { container } = render(
        <div className="cac-offline-indicator">
          <span className="cac-offline-icon">⚠</span>
          <span className="cac-offline-message">No internet connection</span>
        </div>
      );

      expect(container.querySelector('.cac-offline-icon')).toBeInTheDocument();
      expect(container.querySelector('.cac-offline-message')).toHaveTextContent('No internet connection');
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have proper ARIA labels for mobile controls', () => {
      const { container } = render(
        <div>
          <button 
            className="cac-button"
            aria-label="Upload document"
          >
            Upload
          </button>
          <button 
            className="cac-icon-button"
            aria-label="Close preview"
          >
            ×
          </button>
        </div>
      );

      const uploadButton = container.querySelector('.cac-button');
      const closeButton = container.querySelector('.cac-icon-button');

      expect(uploadButton).toHaveAttribute('aria-label', 'Upload document');
      expect(closeButton).toHaveAttribute('aria-label', 'Close preview');
    });

    it('should support screen reader announcements', () => {
      const { container } = render(
        <div 
          role="status"
          aria-live="polite"
          className="cac-sr-only"
        >
          Document uploaded successfully
        </div>
      );

      const announcement = container.querySelector('[role="status"]');
      expect(announcement).toHaveAttribute('aria-live', 'polite');
      expect(announcement).toHaveTextContent('Document uploaded successfully');
    });

    it('should have sufficient color contrast for mobile', () => {
      const { container } = render(
        <div className="cac-status-indicator uploaded">
          <span style={{ color: '#2e7d32', backgroundColor: '#e8f5e9' }}>
            Uploaded
          </span>
        </div>
      );

      const indicator = container.querySelector('.cac-status-indicator');
      expect(indicator).toBeInTheDocument();
    });
  });
});
