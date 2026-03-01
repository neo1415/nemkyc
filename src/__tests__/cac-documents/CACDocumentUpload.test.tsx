/**
 * Unit Tests for CAC Document Upload Component
 * 
 * Tests:
 * - Rendering of three upload fields
 * - File selection handling
 * - Filename and size display
 * - Progress indicator display
 * - Success indicator display
 * - Error message display
 * - Replace button functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CACDocumentUpload } from '../../components/identity/CACDocumentUpload';
import { CACDocumentType, DocumentStatus } from '../../types/cacDocuments';
import type { CACDocumentMetadata } from '../../types/cacDocuments';

// Mock dependencies
vi.mock('../../utils/cacFileValidator', () => ({
  validateCACDocumentFile: vi.fn((file: File) => ({
    isValid: true,
    metadata: {
      filename: file.name,
      fileSize: file.size,
      mimeType: file.type,
    },
  })),
  validateFileContent: vi.fn(() => Promise.resolve({ isValid: true })),
}));

vi.mock('../../services/cacStorageService', () => ({
  uploadDocument: vi.fn(() =>
    Promise.resolve({
      success: true,
      metadata: {
        id: 'test-doc-id',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        filename: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedAt: new Date(),
        uploaderId: 'test-user',
        identityRecordId: 'test-identity',
        storagePath: 'test/path',
        encryptionMetadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'test-iv',
          authTag: 'test-tag',
        },
        status: DocumentStatus.UPLOADED,
        version: 1,
        isCurrent: true,
      },
    })
  ),
}));

vi.mock('../../services/cacMetadataService', () => ({
  storeDocumentMetadata: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../services/cacAuditLogger', () => ({
  logDocumentUpload: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
      role: 'broker',
    },
  }),
}));

vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop }: any) => ({
    getRootProps: () => ({
      onClick: () => {},
    }),
    getInputProps: () => ({}),
    isDragActive: false,
    open: () => {
      // Simulate file selection
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      onDrop([file]);
    },
  }),
}));

describe('CACDocumentUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render three upload fields for each document type', () => {
      render(<CACDocumentUpload identityRecordId="test-identity" />);

      // Check for all three document type labels
      expect(screen.getByText('Certificate of Incorporation')).toBeInTheDocument();
      expect(screen.getByText('Particulars of Directors')).toBeInTheDocument();
      expect(screen.getByText('Share Allotment (Status Update)')).toBeInTheDocument();
    });

    it('should render header and description', () => {
      render(<CACDocumentUpload identityRecordId="test-identity" />);

      expect(screen.getByText('CAC Document Upload')).toBeInTheDocument();
      expect(
        screen.getByText(/Please upload the following three required CAC documents/)
      ).toBeInTheDocument();
    });

    it('should render drag and drop areas for each document type', () => {
      render(<CACDocumentUpload identityRecordId="test-identity" />);

      const dropzones = screen.getAllByText(/Drag & drop a file here, or click to select/);
      expect(dropzones).toHaveLength(3);
    });
  });

  describe('File Selection', () => {
    it('should display filename after file selection', async () => {
      const { container } = render(<CACDocumentUpload identityRecordId="test-identity" />);

      // Simulate file selection for first upload field
      const file = new File(['test content'], 'certificate.pdf', {
        type: 'application/pdf',
      });

      // Find the first dropzone and trigger file selection
      const dropzones = container.querySelectorAll('[role="button"]');
      const firstDropzone = dropzones[0];

      // Simulate drop event
      fireEvent.drop(firstDropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('certificate.pdf')).toBeInTheDocument();
      });
    });

    it('should display file size after file selection', async () => {
      const { container } = render(<CACDocumentUpload identityRecordId="test-identity" />);

      const file = new File(['test content'], 'certificate.pdf', {
        type: 'application/pdf',
      });

      const dropzones = container.querySelectorAll('[role="button"]');
      const firstDropzone = dropzones[0];

      fireEvent.drop(firstDropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        // File size should be displayed (12 bytes for 'test content')
        expect(screen.getByText(/Bytes/)).toBeInTheDocument();
      });
    });

    it('should show upload button after file selection', async () => {
      const { container } = render(<CACDocumentUpload identityRecordId="test-identity" />);

      const file = new File(['test content'], 'certificate.pdf', {
        type: 'application/pdf',
      });

      const dropzones = container.querySelectorAll('[role="button"]');
      const firstDropzone = dropzones[0];

      fireEvent.drop(firstDropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Indicator', () => {
    it('should display progress indicator during upload', async () => {
      const { uploadDocument } = await import('../../services/cacStorageService');
      
      // Mock slow upload to see progress
      (uploadDocument as any).mockImplementation(
        (_request: any, onProgress: (progress: number) => void) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              onProgress(50);
              setTimeout(() => {
                onProgress(100);
                resolve({
                  success: true,
                  metadata: {
                    id: 'test-doc-id',
                    documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
                    filename: 'test.pdf',
                    fileSize: 1024,
                    mimeType: 'application/pdf',
                    uploadedAt: new Date(),
                    uploaderId: 'test-user',
                    identityRecordId: 'test-identity',
                    storagePath: 'test/path',
                    encryptionMetadata: {
                      algorithm: 'AES-256-GCM',
                      keyVersion: 'v1',
                      iv: 'test-iv',
                      authTag: 'test-tag',
                    },
                    status: DocumentStatus.UPLOADED,
                    version: 1,
                    isCurrent: true,
                  },
                });
              }, 100);
            }, 100);
          });
        }
      );

      const { container } = render(<CACDocumentUpload identityRecordId="test-identity" />);

      const file = new File(['test content'], 'certificate.pdf', {
        type: 'application/pdf',
      });

      const dropzones = container.querySelectorAll('[role="button"]');
      const firstDropzone = dropzones[0];

      fireEvent.drop(firstDropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('Upload Document');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument();
      });
    });

    it('should display progress percentage', async () => {
      const { uploadDocument } = await import('../../services/cacStorageService');
      
      (uploadDocument as any).mockImplementation(
        (_request: any, onProgress: (progress: number) => void) => {
          return new Promise((resolve) => {
            onProgress(75);
            setTimeout(() => {
              resolve({
                success: true,
                metadata: {
                  id: 'test-doc-id',
                  documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
                  filename: 'test.pdf',
                  fileSize: 1024,
                  mimeType: 'application/pdf',
                  uploadedAt: new Date(),
                  uploaderId: 'test-user',
                  identityRecordId: 'test-identity',
                  storagePath: 'test/path',
                  encryptionMetadata: {
                    algorithm: 'AES-256-GCM',
                    keyVersion: 'v1',
                    iv: 'test-iv',
                    authTag: 'test-tag',
                  },
                  status: DocumentStatus.UPLOADED,
                  version: 1,
                  isCurrent: true,
                },
              });
            }, 100);
          });
        }
      );

      const { container } = render(<CACDocumentUpload identityRecordId="test-identity" />);

      const file = new File(['test content'], 'certificate.pdf', {
        type: 'application/pdf',
      });

      const dropzones = container.querySelectorAll('[role="button"]');
      const firstDropzone = dropzones[0];

      fireEvent.drop(firstDropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('Upload Document');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument();
      });
    });
  });

  describe('Success Indicator', () => {
    it('should display success message after successful upload', async () => {
      const { container } = render(<CACDocumentUpload identityRecordId="test-identity" />);

      const file = new File(['test content'], 'certificate.pdf', {
        type: 'application/pdf',
      });

      const dropzones = container.querySelectorAll('[role="button"]');
      const firstDropzone = dropzones[0];

      fireEvent.drop(firstDropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('Upload Document');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Document uploaded successfully!')).toBeInTheDocument();
      });
    });

    it('should display "Uploaded" chip after successful upload', async () => {
      const { container } = render(<CACDocumentUpload identityRecordId="test-identity" />);

      const file = new File(['test content'], 'certificate.pdf', {
        type: 'application/pdf',
      });

      const dropzones = container.querySelectorAll('[role="button"]');
      const firstDropzone = dropzones[0];

      fireEvent.drop(firstDropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('Upload Document');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Uploaded')).toBeInTheDocument();
      });
    });

    it('should display completion message when all documents are uploaded', async () => {
      const existingDocuments = {
        certificateOfIncorporation: {
          id: 'doc1',
          documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
          filename: 'cert.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedAt: new Date(),
          uploaderId: 'test-user',
          identityRecordId: 'test-identity',
          storagePath: 'test/path1',
          encryptionMetadata: {
            algorithm: 'AES-256-GCM',
            keyVersion: 'v1',
            iv: 'test-iv',
            authTag: 'test-tag',
          },
          status: DocumentStatus.UPLOADED,
          version: 1,
          isCurrent: true,
        } as CACDocumentMetadata,
        particularsOfDirectors: {
          id: 'doc2',
          documentType: CACDocumentType.PARTICULARS_OF_DIRECTORS,
          filename: 'directors.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedAt: new Date(),
          uploaderId: 'test-user',
          identityRecordId: 'test-identity',
          storagePath: 'test/path2',
          encryptionMetadata: {
            algorithm: 'AES-256-GCM',
            keyVersion: 'v1',
            iv: 'test-iv',
            authTag: 'test-tag',
          },
          status: DocumentStatus.UPLOADED,
          version: 1,
          isCurrent: true,
        } as CACDocumentMetadata,
        shareAllotment: {
          id: 'doc3',
          documentType: CACDocumentType.SHARE_ALLOTMENT,
          filename: 'shares.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          uploadedAt: new Date(),
          uploaderId: 'test-user',
          identityRecordId: 'test-identity',
          storagePath: 'test/path3',
          encryptionMetadata: {
            algorithm: 'AES-256-GCM',
            keyVersion: 'v1',
            iv: 'test-iv',
            authTag: 'test-tag',
          },
          status: DocumentStatus.UPLOADED,
          version: 1,
          isCurrent: true,
        } as CACDocumentMetadata,
      };

      render(
        <CACDocumentUpload
          identityRecordId="test-identity"
          existingDocuments={existingDocuments}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText('All required CAC documents have been uploaded successfully!')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when file validation fails', async () => {
      const { validateCACDocumentFile } = await import('../../utils/cacFileValidator');
      
      (validateCACDocumentFile as any).mockReturnValue({
        isValid: false,
        error: 'File size exceeds 10MB',
        errorCode: 'FILE_TOO_LARGE',
      });

      const { container } = render(<CACDocumentUpload identityRecordId="test-identity" />);

      const file = new File(['test content'], 'large-file.pdf', {
        type: 'application/pdf',
      });

      const dropzones = container.querySelectorAll('[role="button"]');
      const firstDropzone = dropzones[0];

      fireEvent.drop(firstDropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('File size exceeds 10MB')).toBeInTheDocument();
      });
    });

    it('should display error message when upload fails', async () => {
      const { uploadDocument } = await import('../../services/cacStorageService');
      
      (uploadDocument as any).mockResolvedValue({
        success: false,
        error: 'Network error occurred',
        errorCode: 'NETWORK_ERROR',
      });

      const { container } = render(<CACDocumentUpload identityRecordId="test-identity" />);

      const file = new File(['test content'], 'certificate.pdf', {
        type: 'application/pdf',
      });

      const dropzones = container.querySelectorAll('[role="button"]');
      const firstDropzone = dropzones[0];

      fireEvent.drop(firstDropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Upload Document')).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('Upload Document');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      });
    });
  });

  describe('Replace Functionality', () => {
    it('should display "Replace Document" button for existing documents', () => {
      const existingDocument: CACDocumentMetadata = {
        id: 'existing-doc',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        filename: 'existing-cert.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        uploadedAt: new Date('2024-01-01'),
        uploaderId: 'test-user',
        identityRecordId: 'test-identity',
        storagePath: 'test/existing/path',
        encryptionMetadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'test-iv',
          authTag: 'test-tag',
        },
        status: DocumentStatus.UPLOADED,
        version: 1,
        isCurrent: true,
      };

      render(
        <CACDocumentUpload
          identityRecordId="test-identity"
          existingDocuments={{
            certificateOfIncorporation: existingDocument,
          }}
        />
      );

      expect(screen.getByText('Replace Document')).toBeInTheDocument();
    });

    it('should show upload area when replace button is clicked', async () => {
      const existingDocument: CACDocumentMetadata = {
        id: 'existing-doc',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        filename: 'existing-cert.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        uploadedAt: new Date('2024-01-01'),
        uploaderId: 'test-user',
        identityRecordId: 'test-identity',
        storagePath: 'test/existing/path',
        encryptionMetadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'test-iv',
          authTag: 'test-tag',
        },
        status: DocumentStatus.UPLOADED,
        version: 1,
        isCurrent: true,
      };

      render(
        <CACDocumentUpload
          identityRecordId="test-identity"
          existingDocuments={{
            certificateOfIncorporation: existingDocument,
          }}
        />
      );

      const replaceButton = screen.getByText('Replace Document');
      fireEvent.click(replaceButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Drag & drop a file here, or click to select/)
        ).toBeInTheDocument();
      });
    });

    it('should display existing document filename and size', () => {
      const existingDocument: CACDocumentMetadata = {
        id: 'existing-doc',
        documentType: CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        filename: 'my-certificate.pdf',
        fileSize: 5120, // 5KB
        mimeType: 'application/pdf',
        uploadedAt: new Date('2024-01-01'),
        uploaderId: 'test-user',
        identityRecordId: 'test-identity',
        storagePath: 'test/existing/path',
        encryptionMetadata: {
          algorithm: 'AES-256-GCM',
          keyVersion: 'v1',
          iv: 'test-iv',
          authTag: 'test-tag',
        },
        status: DocumentStatus.UPLOADED,
        version: 1,
        isCurrent: true,
      };

      render(
        <CACDocumentUpload
          identityRecordId="test-identity"
          existingDocuments={{
            certificateOfIncorporation: existingDocument,
          }}
        />
      );

      expect(screen.getByText('my-certificate.pdf')).toBeInTheDocument();
      expect(screen.getByText(/5 KB/)).toBeInTheDocument();
    });
  });
});
