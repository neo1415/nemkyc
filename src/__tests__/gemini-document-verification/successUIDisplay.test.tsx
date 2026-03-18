/**
 * Test: Document Verification Success UI Display
 * 
 * This test verifies that when document verification succeeds with isMatch: true,
 * the component displays the success UI and maintains the verified state.
 * 
 * Bug Context:
 * - Verification was succeeding (isMatch: true, confidence: 100)
 * - But the success UI was not displaying
 * - State was resetting to idle immediately after verification
 * 
 * Root Cause:
 * - Race condition in useEffect that monitors currentFile changes
 * - The effect was resetting state to idle when currentFile wasn't set yet
 * - This happened during the verification workflow before state could be set to 'verified'
 * 
 * Fix:
 * - Added status checks to prevent reset during uploading/processing/verified states
 * - Ensures verified state is maintained after successful verification
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentUploadSection } from '../../components/gemini/DocumentUploadSection';
import { documentProcessor } from '../../services/geminiDocumentProcessor';
import { ProcessingResult, VerificationResult } from '../../types/geminiDocumentVerification';

// Mock the document processor
vi.mock('../../services/geminiDocumentProcessor', () => ({
  documentProcessor: {
    processDocument: vi.fn()
  }
}));

// Mock the form submission controller
vi.mock('../../services/geminiFormSubmissionController', () => ({
  formSubmissionController: {
    hasFormSession: vi.fn(() => false),
    updateDocumentVerification: vi.fn()
  }
}));

// Mock the mismatch analyzer
vi.mock('../../services/geminiMismatchAnalyzer', () => ({
  mismatchAnalyzer: {
    analyzeMismatches: vi.fn(() => ({
      totalMismatches: 0,
      criticalMismatches: 0,
      minorMismatches: 0,
      fieldAnalyses: []
    }))
  }
}));

describe('DocumentUploadSection - Success UI Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display success UI when verification succeeds with isMatch: true', async () => {
    // Arrange: Create a successful verification result
    const successfulVerificationResult: VerificationResult = {
      success: true,
      isMatch: true,
      confidence: 100,
      mismatches: [],
      extractedData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      },
      formData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      }
    };

    const successfulProcessingResult: ProcessingResult = {
      success: true,
      processingId: 'test_proc_123',
      verificationResult: successfulVerificationResult,
      extractedData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      }
    };

    // Mock the document processor to return success
    vi.mocked(documentProcessor.processDocument).mockResolvedValue(successfulProcessingResult);

    const onVerificationComplete = vi.fn();
    const onStatusChange = vi.fn();
    const onFileSelect = vi.fn();

    // Act: Render the component
    const { container } = render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={{ companyName: 'Test Company Ltd', rcNumber: 'RC123456' }}
        onVerificationComplete={onVerificationComplete}
        onStatusChange={onStatusChange}
        onFileSelect={onFileSelect}
      />
    );

    // Create a test file
    const testFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });

    // Find the file input and upload the file
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    // Wait for the upload and verification to complete
    await waitFor(() => {
      expect(documentProcessor.processDocument).toHaveBeenCalledWith(
        testFile,
        'cac',
        { companyName: 'Test Company Ltd', rcNumber: 'RC123456' }
      );
    }, { timeout: 10000 });

    // Assert: Check that success UI is displayed
    await waitFor(() => {
      // Should show success message
      expect(screen.getByText(/Document successfully verified/i)).toBeInTheDocument();
      
      // Should show green checkmark icon (CheckCircle component)
      const successIcon = container.querySelector('.text-green-500');
      expect(successIcon).toBeInTheDocument();
      
      // Should show success details
      expect(screen.getByText(/Document verified successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/File is ready for submission/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    // Assert: Check that status was set to 'verified'
    expect(onStatusChange).toHaveBeenCalledWith('verified');
    
    // Assert: Check that verification complete callback was called
    expect(onVerificationComplete).toHaveBeenCalledWith(successfulVerificationResult);
    
    // Assert: Check that file select callback was called
    expect(onFileSelect).toHaveBeenCalledWith(testFile);
  });

  it('should maintain verified state and not reset to idle', async () => {
    // Arrange: Create a successful verification result
    const successfulVerificationResult: VerificationResult = {
      success: true,
      isMatch: true,
      confidence: 100,
      mismatches: [],
      extractedData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      },
      formData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      }
    };

    const successfulProcessingResult: ProcessingResult = {
      success: true,
      processingId: 'test_proc_123',
      verificationResult: successfulVerificationResult,
      extractedData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      }
    };

    vi.mocked(documentProcessor.processDocument).mockResolvedValue(successfulProcessingResult);

    const onStatusChange = vi.fn();

    // Act: Render the component
    const { container } = render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={{ companyName: 'Test Company Ltd', rcNumber: 'RC123456' }}
        onStatusChange={onStatusChange}
      />
    );

    // Upload a file
    const testFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    // Wait for verification to complete
    await waitFor(() => {
      expect(screen.getByText(/Document successfully verified/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    // Assert: Verify that status is 'verified' and not 'idle'
    const statusCalls = onStatusChange.mock.calls.map(call => call[0]);
    expect(statusCalls).toContain('verified');
    
    // The last status should be 'verified', not 'idle'
    const lastStatus = statusCalls[statusCalls.length - 1];
    expect(lastStatus).toBe('verified');
    expect(lastStatus).not.toBe('idle');

    // Wait a bit more to ensure state doesn't reset
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Assert: Success UI should still be visible
    expect(screen.getByText(/Document successfully verified/i)).toBeInTheDocument();
    
    // Assert: Status should still be 'verified'
    const finalStatusCalls = onStatusChange.mock.calls.map(call => call[0]);
    const finalStatus = finalStatusCalls[finalStatusCalls.length - 1];
    expect(finalStatus).toBe('verified');
  });

  it('should restore verified state when currentFile and verificationResult are provided', () => {
    // Arrange: Create a file and verification result
    const testFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
    
    const verificationResult: VerificationResult = {
      success: true,
      isMatch: true,
      confidence: 100,
      mismatches: [],
      extractedData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      },
      formData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      }
    };

    const onStatusChange = vi.fn();

    // Act: Render with existing file and verification result
    render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        currentFile={testFile}
        verificationResult={verificationResult}
        onStatusChange={onStatusChange}
      />
    );

    // Assert: Should show verified state immediately
    expect(screen.getByText(/Document successfully verified/i)).toBeInTheDocument();
    expect(onStatusChange).toHaveBeenCalledWith('verified');
  });

  it('should not reset to idle when onFileSelect is called during verification', async () => {
    // This test specifically checks for the race condition bug
    
    // Arrange
    const successfulVerificationResult: VerificationResult = {
      success: true,
      isMatch: true,
      confidence: 100,
      mismatches: [],
      extractedData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      },
      formData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      }
    };

    const successfulProcessingResult: ProcessingResult = {
      success: true,
      processingId: 'test_proc_123',
      verificationResult: successfulVerificationResult,
      extractedData: {
        companyName: 'Test Company Ltd',
        rcNumber: 'RC123456'
      }
    };

    vi.mocked(documentProcessor.processDocument).mockResolvedValue(successfulProcessingResult);

    const onStatusChange = vi.fn();
    const onFileSelect = vi.fn();

    // Act: Render the component
    const { container, rerender } = render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={{ companyName: 'Test Company Ltd', rcNumber: 'RC123456' }}
        onStatusChange={onStatusChange}
        onFileSelect={onFileSelect}
      />
    );

    // Upload a file
    const testFile = new File(['test content'], 'test-document.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    // Wait for processing to start
    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('processing');
    }, { timeout: 5000 });

    // Simulate parent component updating currentFile (this happens when onFileSelect is called)
    rerender(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={{ companyName: 'Test Company Ltd', rcNumber: 'RC123456' }}
        onStatusChange={onStatusChange}
        onFileSelect={onFileSelect}
        currentFile={testFile}
      />
    );

    // Wait for verification to complete
    await waitFor(() => {
      expect(screen.getByText(/Document successfully verified/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    // Assert: Status should be 'verified', not 'idle'
    const statusCalls = onStatusChange.mock.calls.map(call => call[0]);
    const lastStatus = statusCalls[statusCalls.length - 1];
    expect(lastStatus).toBe('verified');
    expect(lastStatus).not.toBe('idle');
  });
});
