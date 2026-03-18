/**
 * Test: Date Format Display Fix
 * 
 * Verifies that date mismatches are displayed in normalized YYYY-MM-DD format
 * instead of GMT string format in the DocumentUploadSection error display.
 * 
 * Issue: Error messages were showing:
 * Expected: Wed Apr 01 1970 00:00:00 GMT+0100 (West Africa Standard Time)
 * Found: 01/04/1970
 * 
 * Fix: Error messages should show:
 * Expected: 1970-04-01
 * Found: 1970-04-01
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DocumentUploadSection } from '@/components/gemini/DocumentUploadSection';
import { documentProcessor } from '@/services/geminiDocumentProcessor';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock the document processor
vi.mock('@/services/geminiDocumentProcessor', () => ({
  documentProcessor: {
    processDocument: vi.fn()
  }
}));

// Mock form submission controller
vi.mock('@/services/geminiFormSubmissionController', () => ({
  formSubmissionController: {
    hasFormSession: vi.fn(() => false),
    updateDocumentVerification: vi.fn()
  }
}));

describe('Date Format Display Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display date mismatches in YYYY-MM-DD format, not GMT string format', async () => {
    // Create a mock file
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    // Mock form data with a Date object
    const formData = {
      incorporationDate: new Date('1970-04-01T00:00:00.000Z')
    };
    
    // Mock document processor to return a date mismatch
    const mockProcessorResult = {
      success: true,
      verificationResult: {
        success: true,
        isMatch: false,
        confidence: 0,
        mismatches: [
          {
            field: 'registrationDate',
            extractedValue: '1970-04-01', // Normalized format from OCR
            expectedValue: new Date('1970-04-01T00:00:00.000Z'), // Date object from form
            similarity: 0,
            isCritical: true,
            reason: 'Registration dates do not match'
          }
        ],
        officialData: {
          companyName: 'Test Company',
          rcNumber: 'RC123456',
          registrationDate: '1970-04-01'
        },
        processingTime: 100
      }
    };
    
    vi.mocked(documentProcessor.processDocument).mockResolvedValue(mockProcessorResult);
    
    // Render component
    const { container } = render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={formData}
      />
    );
    
    // Simulate file selection by triggering the file input
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create a mock FileList
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(mockFile);
    
    // Trigger file selection
    Object.defineProperty(fileInput, 'files', {
      value: dataTransfer.files,
      writable: false
    });
    
    // Manually trigger the change event
    const changeEvent = new Event('change', { bubbles: true });
    fileInput.dispatchEvent(changeEvent);
    
    // Wait for processing to complete
    await waitFor(() => {
      expect(documentProcessor.processDocument).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    // Wait for error display
    await waitFor(() => {
      const errorSection = screen.queryByText(/Document Verification Failed/i);
      expect(errorSection).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Check that dates are displayed in YYYY-MM-DD format
    await waitFor(() => {
      // Look for the normalized date format
      const expectedText = screen.queryByText(/Expected: 1970-04-01/i);
      const foundText = screen.queryByText(/Found: 1970-04-01/i);
      
      expect(expectedText).toBeInTheDocument();
      expect(foundText).toBeInTheDocument();
      
      // Ensure GMT format is NOT present
      const gmtText = screen.queryByText(/GMT/i);
      expect(gmtText).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should handle DD/MM/YYYY format and convert to YYYY-MM-DD for display', async () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    const formData = {
      incorporationDate: new Date('1970-04-01T00:00:00.000Z')
    };
    
    const mockProcessorResult = {
      success: true,
      verificationResult: {
        success: true,
        isMatch: false,
        confidence: 0,
        mismatches: [
          {
            field: 'registrationDate',
            extractedValue: '01/04/1970', // DD/MM/YYYY format from OCR
            expectedValue: new Date('1970-04-01T00:00:00.000Z'),
            similarity: 0,
            isCritical: true,
            reason: 'Registration dates do not match'
          }
        ],
        officialData: {
          companyName: 'Test Company',
          rcNumber: 'RC123456',
          registrationDate: '01/04/1970'
        },
        processingTime: 100
      }
    };
    
    (documentProcessor.processDocument as any).mockResolvedValue(mockProcessorResult);
    
    const { container } = render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={formData}
      />
    );
    
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(mockFile);
    
    Object.defineProperty(fileInput, 'files', {
      value: dataTransfer.files,
      writable: false
    });
    
    const changeEvent = new Event('change', { bubbles: true });
    fileInput.dispatchEvent(changeEvent);
    
    await waitFor(() => {
      expect(documentProcessor.processDocument).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    await waitFor(() => {
      const errorSection = screen.queryByText(/Document Verification Failed/i);
      expect(errorSection).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Check that DD/MM/YYYY is converted to YYYY-MM-DD
    await waitFor(() => {
      const expectedText = screen.queryByText(/Expected: 1970-04-01/i);
      const foundText = screen.queryByText(/Found: 1970-04-01/i);
      
      expect(expectedText).toBeInTheDocument();
      expect(foundText).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should handle string dates already in YYYY-MM-DD format', async () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    
    const formData = {
      incorporationDate: '1970-04-01' // Already normalized
    };
    
    const mockProcessorResult = {
      success: true,
      verificationResult: {
        success: true,
        isMatch: false,
        confidence: 0,
        mismatches: [
          {
            field: 'registrationDate',
            extractedValue: '1970-04-01',
            expectedValue: '1970-04-01',
            similarity: 0,
            isCritical: true,
            reason: 'Registration dates do not match'
          }
        ],
        officialData: {
          companyName: 'Test Company',
          rcNumber: 'RC123456',
          registrationDate: '1970-04-01'
        },
        processingTime: 100
      }
    };
    
    (documentProcessor.processDocument as any).mockResolvedValue(mockProcessorResult);
    
    const { container } = render(
      <DocumentUploadSection
        formId="test-form"
        documentType="cac"
        formData={formData}
      />
    );
    
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(mockFile);
    
    Object.defineProperty(fileInput, 'files', {
      value: dataTransfer.files,
      writable: false
    });
    
    const changeEvent = new Event('change', { bubbles: true });
    fileInput.dispatchEvent(changeEvent);
    
    await waitFor(() => {
      expect(documentProcessor.processDocument).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    await waitFor(() => {
      const errorSection = screen.queryByText(/Document Verification Failed/i);
      expect(errorSection).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Check that YYYY-MM-DD format is preserved
    await waitFor(() => {
      const expectedText = screen.queryByText(/Expected: 1970-04-01/i);
      const foundText = screen.queryByText(/Found: 1970-04-01/i);
      
      expect(expectedText).toBeInTheDocument();
      expect(foundText).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
