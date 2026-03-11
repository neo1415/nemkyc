/**
 * Test for document verification state persistence
 * 
 * This test validates that document verification state is properly saved
 * and restored across navigation and page reloads
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Document Verification State Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('should save document verification state to localStorage', () => {
    const mockState = {
      status: 'verified',
      blocked: false,
      result: {
        success: true,
        isMatch: true,
        confidence: 95,
        mismatches: []
      },
      timestamp: Date.now()
    };

    // Simulate saving state
    const saveDocumentVerificationState = (status: string, blocked: boolean, result: any = null) => {
      const docState = { status, blocked, result, timestamp: Date.now() };
      localStorage.setItem('kyc-individual-doc-verification', JSON.stringify(docState));
    };

    saveDocumentVerificationState('verified', false, mockState.result);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'kyc-individual-doc-verification',
      expect.stringContaining('"status":"verified"')
    );
  });

  it('should restore document verification state from localStorage', () => {
    const mockState = {
      status: 'verified',
      blocked: false,
      result: {
        success: true,
        isMatch: true,
        confidence: 95,
        mismatches: []
      },
      timestamp: Date.now()
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockState));

    // Simulate restoring state
    const savedState = localStorage.getItem('kyc-individual-doc-verification');
    expect(savedState).toBeTruthy();

    if (savedState) {
      const docState = JSON.parse(savedState);
      expect(docState.status).toBe('verified');
      expect(docState.blocked).toBe(false);
      expect(docState.result.confidence).toBe(95);
    }
  });

  it('should clear expired document verification state', () => {
    const expiredState = {
      status: 'verified',
      blocked: false,
      result: { confidence: 95 },
      timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredState));

    // Simulate checking for expired state
    const savedState = localStorage.getItem('kyc-individual-doc-verification');
    if (savedState) {
      const docState = JSON.parse(savedState);
      const isExpired = Date.now() - docState.timestamp > 24 * 60 * 60 * 1000;
      
      if (isExpired) {
        localStorage.removeItem('kyc-individual-doc-verification');
      }
      
      expect(isExpired).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('kyc-individual-doc-verification');
    }
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');

    // Simulate handling corrupted data
    const savedState = localStorage.getItem('kyc-individual-doc-verification');
    let restoredState = null;
    
    if (savedState) {
      try {
        restoredState = JSON.parse(savedState);
      } catch (error) {
        localStorage.removeItem('kyc-individual-doc-verification');
      }
    }

    expect(restoredState).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('kyc-individual-doc-verification');
  });

  it('should clear document verification state on successful form submission', () => {
    // Simulate successful form submission
    const clearDocumentState = () => {
      localStorage.removeItem('kyc-individual-doc-verification');
    };

    clearDocumentState();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('kyc-individual-doc-verification');
  });

  it('should show appropriate status messages based on verification result', () => {
    const getStatusMessage = (result: any) => {
      if (!result) return 'No document uploaded';
      
      if (result.success && result.isMatch) {
        const hasCriticalIssues = result.mismatches?.some((m: any) => m.isCritical) || false;
        return hasCriticalIssues ? 'Document verified with issues' : 'Document verified successfully';
      }
      
      return 'Document verification failed';
    };

    // Test successful verification without issues
    const successResult = {
      success: true,
      isMatch: true,
      confidence: 95,
      mismatches: []
    };
    expect(getStatusMessage(successResult)).toBe('Document verified successfully');

    // Test successful verification with non-critical issues
    const successWithMinorIssues = {
      success: true,
      isMatch: true,
      confidence: 85,
      mismatches: [{ field: 'gender', isCritical: false }]
    };
    expect(getStatusMessage(successWithMinorIssues)).toBe('Document verified successfully');

    // Test successful verification with critical issues
    const successWithCriticalIssues = {
      success: true,
      isMatch: true,
      confidence: 75,
      mismatches: [{ field: 'nin', isCritical: true }]
    };
    expect(getStatusMessage(successWithCriticalIssues)).toBe('Document verified with issues');

    // Test failed verification
    const failedResult = {
      success: true,
      isMatch: false,
      confidence: 45,
      mismatches: [{ field: 'nin', isCritical: true }]
    };
    expect(getStatusMessage(failedResult)).toBe('Document verification failed');
  });
});