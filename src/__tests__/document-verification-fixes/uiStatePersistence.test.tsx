/**
 * Test: Document Verification UI State Persistence
 * 
 * Verifies that when a document is successfully verified and shows the success UI,
 * navigating to another section and coming back preserves the success UI state.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DocumentUploadSection } from '@/components/gemini/DocumentUploadSection';
import { VerificationResult } from '@/types/geminiDocumentVerification';

describe('Document Verification UI State Persistence', () => {
  const mockFormData = {
    insured: 'Test Company Ltd',
    incorporationNumber: 'RC123456',
    dateOfIncorporationRegistration: new Date('2020-01-15')
  };

  const mockVerificationResult: VerificationResult = {
    success: true,
    isMatch: true,
    confidence: 95,
    extractedData: {
      companyName: 'Test Company Ltd',
      rcNumber: 'RC123456',
      incorporationDate: '2020-01-15'
    },
    mismatches: []
  };

  const mockFile = new File(['test content'], 'test-cac.pdf', { type: 'application/pdf' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should restore verified UI state when component remounts with currentFile and verificationResult', async () => {
    // First render - simulate initial verification
    const { unmount } = render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={mockFormData}
        currentFile={mockFile}
        verificationResult={mockVerificationResult}
      />
    );

    // Should show verified state
    await waitFor(() => {
      expect(screen.getByText(/successfully verified/i)).toBeInTheDocument();
    });

    // Unmount (simulate navigation away)
    unmount();

    // Remount with same props (simulate navigation back)
    render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={mockFormData}
        currentFile={mockFile}
        verificationResult={mockVerificationResult}
      />
    );

    // Should still show verified state
    await waitFor(() => {
      expect(screen.getByText(/successfully verified/i)).toBeInTheDocument();
    });
  });

  it('should show idle state when component remounts with currentFile but no verificationResult', async () => {
    // Render with file but no verification result
    render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={mockFormData}
        currentFile={mockFile}
        verificationResult={null}
      />
    );

    // Should show file name but not verified state
    await waitFor(() => {
      expect(screen.getByText(/test-cac.pdf/i)).toBeInTheDocument();
      expect(screen.queryByText(/successfully verified/i)).not.toBeInTheDocument();
    });
  });

  it('should clear state when currentFile is removed', async () => {
    const { rerender } = render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={mockFormData}
        currentFile={mockFile}
        verificationResult={mockVerificationResult}
      />
    );

    // Should show verified state
    await waitFor(() => {
      expect(screen.getByText(/successfully verified/i)).toBeInTheDocument();
    });

    // Remove file
    rerender(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={mockFormData}
        currentFile={null}
        verificationResult={null}
      />
    );

    // Should show idle state
    await waitFor(() => {
      expect(screen.queryByText(/successfully verified/i)).not.toBeInTheDocument();
      // Use getAllByText and check that at least one element exists
      const uploadTexts = screen.queryAllByText(/upload your cac certificate/i);
      expect(uploadTexts.length).toBeGreaterThan(0);
    });
  });

  it('should call onStatusChange with verified when restoring verified state', async () => {
    const onStatusChange = vi.fn();

    render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={mockFormData}
        currentFile={mockFile}
        verificationResult={mockVerificationResult}
        onStatusChange={onStatusChange}
      />
    );

    // Should call onStatusChange with 'verified'
    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('verified');
    });
  });
});
