/**
 * Integration Tests for Dashboard CAC Document Lifecycle
 * 
 * Tests the complete document lifecycle in the IdentityListsDashboard:
 * - Status updates after upload
 * - Status updates after replacement
 * - Preview opening from status indicator
 * - Real-time status updates
 * 
 * Requirements tested:
 * - 7.5: Make status indicators clickable to preview documents
 * - 7.6: Update status in real-time when documents are uploaded
 * - 7.7: Update status in real-time when documents are uploaded (duplicate of 7.6)
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import IdentityListsDashboard from '../../pages/admin/IdentityListsDashboard';
import * as cacMetadataService from '../../services/cacMetadataService';
import * as cacStorageService from '../../services/cacStorageService';
import { DocumentStatus, CACDocumentType } from '../../types/cacDocuments';
import type { CACDocumentMetadata, DocumentStatusSummary } from '../../types/cacDocuments';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock CSS imports
vi.mock('../../styles/broker-tour.css', () => ({}));

// Mock IdentityListDetail to avoid DataGrid CSS import issues
vi.mock('../../pages/admin/IdentityListDetail', () => ({
  default: ({ listId, onBack }: { listId: string; onBack: () => void }) => (
    <div data-testid="identity-list-detail">
      <button onClick={onBack}>Back</button>
      <div>List ID: {listId}</div>
    </div>
  )
}));

// Mock services
vi.mock('../../services/cacMetadataService');
vi.mock('../../services/cacStorageService');
vi.mock('../../services/cacAccessControl', () => ({
  shouldShowDocumentActions: vi.fn(() => true),
  canViewDocument: vi.fn(() => true),
  canDownloadDocument: vi.fn(() => true)
}));

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@example.com', role: 'admin' },
    loading: false
  })
}));

// Mock fetch
global.fetch = vi.fn();

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockObjectURL = 'blob:mock-url';
global.URL.createObjectURL = vi.fn(() => mockObjectURL);
global.URL.revokeObjectURL = vi.fn();

const mockCorporateList = {
  id: 'corporate-list-1',
  name: 'Corporate List 1',
  listType: 'corporate',
  totalEntries: 10,
  verifiedCount: 5,
  pendingCount: 5,
  failedCount: 0,
  linkSentCount: 10,
  progress: 50,
  createdAt: new Date('2024-01-01'),
  originalFileName: 'corporate-list-1.csv'
};

const mockIndividualList = {
  id: 'individual-list-1',
  name: 'Individual List 1',
  listType: 'individual',
  totalEntries: 20,
  verifiedCount: 10,
  pendingCount: 10,
  failedCount: 0,
  linkSentCount: 20,
  progress: 50,
  createdAt: new Date('2024-01-02'),
  originalFileName: 'individual-list-1.csv'
};

const createMockDocument = (
  documentType: CACDocumentType,
  listId: string,
  uploadDate: Date = new Date('2024-01-10')
): CACDocumentMetadata => ({
  id: `doc-${documentType}-${listId}`,
  documentType,
  filename: `${documentType}.pdf`,
  fileSize: 1024000,
  mimeType: 'application/pdf',
  uploadedAt: uploadDate,
  uploaderId: 'test-user',
  identityRecordId: listId,
  storagePath: `cac-documents/${listId}/${documentType}/doc.pdf`,
  encryptionMetadata: {
    algorithm: 'AES-256-GCM',
    keyVersion: 'v1',
    iv: 'test-iv',
    authTag: 'test-tag'
  },
  status: DocumentStatus.UPLOADED,
  version: 1,
  isCurrent: true
});

const createDocumentStatusSummary = (
  listId: string,
  certStatus: DocumentStatus = DocumentStatus.MISSING,
  directorsStatus: DocumentStatus = DocumentStatus.MISSING,
  sharesStatus: DocumentStatus = DocumentStatus.MISSING,
  timestamps: Record<CACDocumentType, Date> = {}
): DocumentStatusSummary => ({
  identityRecordId: listId,
  certificateOfIncorporation: certStatus,
  particularsOfDirectors: directorsStatus,
  shareAllotment: sharesStatus,
  uploadTimestamps: timestamps,
  isComplete: certStatus === DocumentStatus.UPLOADED && 
              directorsStatus === DocumentStatus.UPLOADED && 
              sharesStatus === DocumentStatus.UPLOADED
});

describe('Dashboard Integration Tests: Document Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch for lists
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ lists: [mockCorporateList, mockIndividualList] })
    });

    // Default mock for document preview
    vi.mocked(cacStorageService.getDocumentForPreview).mockResolvedValue(new ArrayBuffer(1024));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test: Complete document lifecycle - upload to display
   * Requirement: 7.6, 7.7 - Update status in real-time when documents are uploaded
   */
  it('should update document status after upload', async () => {
    // Start with no documents uploaded
    const initialStatus = createDocumentStatusSummary(mockCorporateList.id);
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(initialStatus);

    const { rerender } = render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    // Wait for initial status to load (all missing)
    await waitFor(() => {
      expect(screen.getByText(/CAC Documents/i)).toBeInTheDocument();
    });

    // Verify all documents show as missing
    const cancelIcons = screen.getAllByTestId('CancelIcon');
    expect(cancelIcons.length).toBeGreaterThanOrEqual(3);

    // Simulate document upload by updating the mock
    const uploadedStatus = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.MISSING,
      DocumentStatus.MISSING,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-10'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date(),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date()
      }
    );
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(uploadedStatus);

    // Switch tabs to trigger refresh
    const individualTab = screen.getByRole('tab', { name: /individual lists/i });
    fireEvent.click(individualTab);
    await waitFor(() => {
      expect(screen.getByText('Individual List 1')).toBeInTheDocument();
    });

    fireEvent.click(corporateTab);

    // Wait for updated status to load
    await waitFor(() => {
      const checkIcons = screen.queryAllByTestId('CheckCircleOutlineIcon');
      expect(checkIcons.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  /**
   * Test: Document replacement updates status
   * Requirement: 7.6, 7.7 - Update status after replacement
   */
  it('should update document status after replacement', async () => {
    // Start with one document uploaded
    const initialStatus = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.MISSING,
      DocumentStatus.MISSING,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-10'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date(),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date()
      }
    );
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(initialStatus);

    render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    // Wait for initial status
    await waitFor(() => {
      expect(screen.getByText(/CAC Documents/i)).toBeInTheDocument();
    });

    // Verify certificate is uploaded
    await waitFor(() => {
      const checkIcons = screen.queryAllByTestId('CheckCircleOutlineIcon');
      expect(checkIcons.length).toBeGreaterThanOrEqual(1);
    });

    // Simulate document replacement with new timestamp
    const replacedStatus = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.MISSING,
      DocumentStatus.MISSING,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-15'), // New timestamp
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date(),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date()
      }
    );
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(replacedStatus);

    // Trigger refresh by switching tabs
    const individualTab = screen.getByRole('tab', { name: /individual lists/i });
    fireEvent.click(individualTab);
    await waitFor(() => {
      expect(screen.getByText('Individual List 1')).toBeInTheDocument();
    });

    fireEvent.click(corporateTab);

    // Wait for updated status with new timestamp
    await waitFor(() => {
      expect(cacMetadataService.getDocumentStatusSummary).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });
  });

  /**
   * Test: Clicking status indicator opens preview
   * Requirement: 7.5 - Make status indicators clickable to preview documents
   */
  it('should open preview when clicking on uploaded document status', async () => {
    const uploadedStatus = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.UPLOADED,
      DocumentStatus.UPLOADED,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-10'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date('2024-01-11'),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date('2024-01-12')
      }
    );
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(uploadedStatus);

    const mockDocument = createMockDocument(
      CACDocumentType.CERTIFICATE_OF_INCORPORATION,
      mockCorporateList.id
    );
    vi.mocked(cacMetadataService.getDocumentsByType).mockResolvedValue([mockDocument]);

    render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    // Wait for document status to load
    await waitFor(() => {
      expect(screen.getByText(/CAC Documents/i)).toBeInTheDocument();
    });

    // Find and click on Certificate status indicator
    const certificateStatus = screen.getByText(/Certificate/i);
    fireEvent.click(certificateStatus);

    // Verify getDocumentsByType was called
    await waitFor(() => {
      expect(cacMetadataService.getDocumentsByType).toHaveBeenCalledWith(
        CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        mockCorporateList.id
      );
    });

    // Verify preview dialog opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  /**
   * Test: Missing documents are not clickable
   * Requirement: 7.5 - Only uploaded documents should be clickable
   */
  it('should not open preview when clicking on missing document status', async () => {
    const missingStatus = createDocumentStatusSummary(mockCorporateList.id);
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(missingStatus);

    const getDocumentsByTypeSpy = vi.mocked(cacMetadataService.getDocumentsByType);

    render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    // Wait for document status to load
    await waitFor(() => {
      expect(screen.getByText(/CAC Documents/i)).toBeInTheDocument();
    });

    // Click on missing Certificate status
    const certificateStatus = screen.getByText(/Certificate/i);
    fireEvent.click(certificateStatus);

    // Verify getDocumentsByType was NOT called
    await waitFor(() => {
      expect(getDocumentsByTypeSpy).not.toHaveBeenCalled();
    });

    // Verify preview dialog does not open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  /**
   * Test: Complete lifecycle - all three documents
   * Requirement: 7.6, 7.7 - Complete document lifecycle
   */
  it('should handle complete lifecycle for all three document types', async () => {
    // Start with no documents
    const noDocsStatus = createDocumentStatusSummary(mockCorporateList.id);
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(noDocsStatus);

    const { rerender } = render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    await waitFor(() => {
      expect(screen.getByText(/CAC Documents/i)).toBeInTheDocument();
    });

    // Step 1: Upload Certificate of Incorporation
    const oneDocStatus = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.MISSING,
      DocumentStatus.MISSING,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-10'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date(),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date()
      }
    );
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(oneDocStatus);

    // Trigger refresh
    const individualTab = screen.getByRole('tab', { name: /individual lists/i });
    fireEvent.click(individualTab);
    await waitFor(() => {
      expect(screen.getByText('Individual List 1')).toBeInTheDocument();
    });
    fireEvent.click(corporateTab);

    await waitFor(() => {
      const checkIcons = screen.queryAllByTestId('CheckCircleOutlineIcon');
      expect(checkIcons.length).toBeGreaterThanOrEqual(1);
    });

    // Step 2: Upload Particulars of Directors
    const twoDocsStatus = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.UPLOADED,
      DocumentStatus.MISSING,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-10'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date('2024-01-11'),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date()
      }
    );
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(twoDocsStatus);

    fireEvent.click(individualTab);
    await waitFor(() => {
      expect(screen.getByText('Individual List 1')).toBeInTheDocument();
    });
    fireEvent.click(corporateTab);

    await waitFor(() => {
      const checkIcons = screen.queryAllByTestId('CheckCircleOutlineIcon');
      expect(checkIcons.length).toBeGreaterThanOrEqual(2);
    });

    // Step 3: Upload Share Allotment (complete)
    const allDocsStatus = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.UPLOADED,
      DocumentStatus.UPLOADED,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-10'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date('2024-01-11'),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date('2024-01-12')
      }
    );
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(allDocsStatus);

    fireEvent.click(individualTab);
    await waitFor(() => {
      expect(screen.getByText('Individual List 1')).toBeInTheDocument();
    });
    fireEvent.click(corporateTab);

    await waitFor(() => {
      const checkIcons = screen.queryAllByTestId('CheckCircleOutlineIcon');
      expect(checkIcons.length).toBeGreaterThanOrEqual(3);
    });

    // Verify all three documents can be previewed
    vi.mocked(cacMetadataService.getDocumentsByType).mockImplementation(async (type, listId) => {
      return [createMockDocument(type, listId)];
    });

    // Click on each document status
    const certificateStatus = screen.getByText(/Certificate/i);
    fireEvent.click(certificateStatus);

    await waitFor(() => {
      expect(cacMetadataService.getDocumentsByType).toHaveBeenCalledWith(
        CACDocumentType.CERTIFICATE_OF_INCORPORATION,
        mockCorporateList.id
      );
    });

    // Close preview
    const closeButton = screen.getAllByRole('button').find(
      btn => btn.querySelector('[data-testid="CloseIcon"]')
    );
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Preview shows correct document content
   * Requirement: 7.5 - Preview opening from status indicator
   */
  it('should display correct document in preview when status is clicked', async () => {
    const uploadedStatus = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.UPLOADED,
      DocumentStatus.MISSING,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-10'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date('2024-01-11'),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date()
      }
    );
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(uploadedStatus);

    const certDoc = createMockDocument(
      CACDocumentType.CERTIFICATE_OF_INCORPORATION,
      mockCorporateList.id
    );
    certDoc.filename = 'certificate-of-incorporation.pdf';

    const directorsDoc = createMockDocument(
      CACDocumentType.PARTICULARS_OF_DIRECTORS,
      mockCorporateList.id
    );
    directorsDoc.filename = 'particulars-of-directors.pdf';

    vi.mocked(cacMetadataService.getDocumentsByType).mockImplementation(async (type) => {
      if (type === CACDocumentType.CERTIFICATE_OF_INCORPORATION) {
        return [certDoc];
      } else if (type === CACDocumentType.PARTICULARS_OF_DIRECTORS) {
        return [directorsDoc];
      }
      return [];
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    await waitFor(() => {
      expect(screen.getByText(/CAC Documents/i)).toBeInTheDocument();
    });

    // Click on Certificate status
    const certificateStatus = screen.getByText(/Certificate/i);
    fireEvent.click(certificateStatus);

    // Verify correct document is shown in preview
    await waitFor(() => {
      expect(screen.getByText('certificate-of-incorporation.pdf')).toBeInTheDocument();
    });

    // Close preview
    const closeButton = screen.getAllByRole('button').find(
      btn => btn.querySelector('[data-testid="CloseIcon"]')
    );
    if (closeButton) {
      fireEvent.click(closeButton);
    }

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Click on Directors status
    const directorsStatus = screen.getByText(/Directors/i);
    fireEvent.click(directorsStatus);

    // Verify correct document is shown in preview
    await waitFor(() => {
      expect(screen.getByText('particulars-of-directors.pdf')).toBeInTheDocument();
    });
  });

  /**
   * Test: Error handling during preview
   * Requirement: 7.5 - Handle preview failures gracefully
   */
  it('should handle errors when opening preview', async () => {
    const uploadedStatus = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.MISSING,
      DocumentStatus.MISSING,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-10'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date(),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date()
      }
    );
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(uploadedStatus);
    vi.mocked(cacMetadataService.getDocumentsByType).mockRejectedValue(
      new Error('Failed to load document')
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    await waitFor(() => {
      expect(screen.getByText(/CAC Documents/i)).toBeInTheDocument();
    });

    // Click on Certificate status
    const certificateStatus = screen.getByText(/Certificate/i);
    fireEvent.click(certificateStatus);

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to load document preview/i)).toBeInTheDocument();
    });

    // Verify preview dialog does not open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  /**
   * Test: Multiple lists with different document statuses
   * Requirement: 7.6, 7.7 - Handle multiple lists correctly
   */
  it('should display correct status for multiple corporate lists', async () => {
    const mockCorporateList2 = {
      ...mockCorporateList,
      id: 'corporate-list-2',
      name: 'Corporate List 2'
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ lists: [mockCorporateList, mockCorporateList2, mockIndividualList] })
    });

    // List 1: All documents uploaded
    const list1Status = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.UPLOADED,
      DocumentStatus.UPLOADED,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-10'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date('2024-01-11'),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date('2024-01-12')
      }
    );

    // List 2: Only one document uploaded
    const list2Status = createDocumentStatusSummary(
      mockCorporateList2.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.MISSING,
      DocumentStatus.MISSING,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-15'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date(),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date()
      }
    );

    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockImplementation(async (listId) => {
      if (listId === mockCorporateList.id) {
        return list1Status;
      } else if (listId === mockCorporateList2.id) {
        return list2Status;
      }
      return createDocumentStatusSummary(listId);
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    await waitFor(() => {
      expect(screen.getByText('Corporate List 1')).toBeInTheDocument();
      expect(screen.getByText('Corporate List 2')).toBeInTheDocument();
    });

    // Verify both lists show CAC Documents section
    const cacDocumentsSections = screen.getAllByText(/CAC Documents/i);
    expect(cacDocumentsSections.length).toBe(2);

    // Verify correct number of uploaded indicators
    await waitFor(() => {
      const checkIcons = screen.queryAllByTestId('CheckCircleOutlineIcon');
      // List 1 has 3 uploaded, List 2 has 1 uploaded = 4 total
      expect(checkIcons.length).toBeGreaterThanOrEqual(4);
    });
  });

  /**
   * Test: Real-time updates when switching between tabs
   * Requirement: 7.6, 7.7 - Real-time status updates
   */
  it('should fetch fresh document status when switching to corporate tab', async () => {
    const getDocumentStatusSummarySpy = vi.mocked(cacMetadataService.getDocumentStatusSummary);
    getDocumentStatusSummarySpy.mockResolvedValue(
      createDocumentStatusSummary(mockCorporateList.id)
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Start on individual tab (default)
    await waitFor(() => {
      expect(screen.getByText('Individual List 1')).toBeInTheDocument();
    });

    // Verify no document status calls yet
    expect(getDocumentStatusSummarySpy).not.toHaveBeenCalled();

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    // Verify document status is fetched
    await waitFor(() => {
      expect(getDocumentStatusSummarySpy).toHaveBeenCalledWith(mockCorporateList.id);
    });

    const firstCallCount = getDocumentStatusSummarySpy.mock.calls.length;

    // Switch back to individual tab
    const individualTab = screen.getByRole('tab', { name: /individual lists/i });
    fireEvent.click(individualTab);

    await waitFor(() => {
      expect(screen.getByText('Individual List 1')).toBeInTheDocument();
    });

    // Switch back to corporate tab
    fireEvent.click(corporateTab);

    // Verify document status is fetched again (real-time update)
    await waitFor(() => {
      expect(getDocumentStatusSummarySpy.mock.calls.length).toBeGreaterThan(firstCallCount);
    }, { timeout: 3000 });
  });

  /**
   * Test: Loading state during document status fetch
   * Requirement: 7.6, 7.7 - Show loading indicator
   */
  it('should show loading indicator while fetching document statuses', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockReturnValue(promise as any);

    render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('Corporate List 1')).toBeInTheDocument();
    });

    // Should show loading indicator for document status
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);

    // Resolve the promise
    resolvePromise!(createDocumentStatusSummary(mockCorporateList.id));

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText(/CAC Documents/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Document status not shown for individual lists
   * Requirement: 7.1 - Only show for corporate lists
   */
  it('should not show document status for individual lists', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Stay on individual tab (default)
    await waitFor(() => {
      expect(screen.getByText('Individual List 1')).toBeInTheDocument();
    });

    // Verify CAC Documents section is not shown
    expect(screen.queryByText(/CAC Documents/i)).not.toBeInTheDocument();

    // Verify getDocumentStatusSummary was not called
    expect(cacMetadataService.getDocumentStatusSummary).not.toHaveBeenCalled();
  });

  /**
   * Test: Partial document upload scenario
   * Requirement: 7.6, 7.7 - Handle partial uploads
   */
  it('should correctly display mixed status indicators', async () => {
    const partialStatus = createDocumentStatusSummary(
      mockCorporateList.id,
      DocumentStatus.UPLOADED,
      DocumentStatus.MISSING,
      DocumentStatus.UPLOADED,
      {
        [CACDocumentType.CERTIFICATE_OF_INCORPORATION]: new Date('2024-01-10'),
        [CACDocumentType.PARTICULARS_OF_DIRECTORS]: new Date(),
        [CACDocumentType.SHARE_ALLOTMENT]: new Date('2024-01-12')
      }
    );
    vi.mocked(cacMetadataService.getDocumentStatusSummary).mockResolvedValue(partialStatus);

    render(
      <BrowserRouter>
        <AuthProvider>
          <IdentityListsDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Switch to corporate tab
    const corporateTab = screen.getByRole('tab', { name: /corporate lists/i });
    fireEvent.click(corporateTab);

    await waitFor(() => {
      expect(screen.getByText(/CAC Documents/i)).toBeInTheDocument();
    });

    // Verify 2 uploaded (check icons) and 1 missing (cancel icon)
    await waitFor(() => {
      const checkIcons = screen.queryAllByTestId('CheckCircleOutlineIcon');
      const cancelIcons = screen.queryAllByTestId('CancelIcon');
      expect(checkIcons.length).toBeGreaterThanOrEqual(2);
      expect(cancelIcons.length).toBeGreaterThanOrEqual(1);
    });
  });
});
