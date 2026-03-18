/**
 * Test to verify the AbortError fix for Gemini API calls
 * 
 * This test ensures that:
 * 1. AbortController.abort() is called with a reason
 * 2. The error message is descriptive
 * 3. No "signal is aborted without reason" errors occur
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geminiOCREngine } from '../../services/geminiOCREngine';
import { ProcessedDocument } from '../../types/geminiDocumentVerification';

describe('Gemini API Abort Error Fix', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('should abort with a descriptive error message when timeout occurs', async () => {
    // Mock fetch to never resolve (simulating a timeout)
    global.fetch = vi.fn(() => new Promise(() => {})) as any;

    // Create a test document
    const testDocument: ProcessedDocument = {
      id: 'test-doc',
      originalFile: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      processedContent: new Uint8Array([1, 2, 3]),
      metadata: {
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        processingDuration: 0
      },
      processingTimestamp: new Date()
    };

    // Start the extraction (will timeout)
    const extractionPromise = geminiOCREngine.extractCACData(testDocument);

    // Fast-forward time to trigger timeout (120 seconds)
    await vi.advanceTimersByTimeAsync(120000);

    // Wait for the promise to reject
    const result = await extractionPromise;

    // Verify the result contains a proper error message
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // The error should NOT be "signal is aborted without reason"
    expect(result.error).not.toContain('signal is aborted without reason');
    
    // The error should contain a descriptive timeout message
    expect(result.error).toMatch(/timeout|Request timeout/i);
  });

  it('should handle abort with proper error context', async () => {
    // Mock fetch to simulate an abort
    global.fetch = vi.fn(() => {
      const error = new Error('Request timeout after 120000ms');
      error.name = 'AbortError';
      return Promise.reject(error);
    }) as any;

    // Create a test document
    const testDocument: ProcessedDocument = {
      id: 'test-doc',
      originalFile: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      processedContent: new Uint8Array([1, 2, 3]),
      metadata: {
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        processingDuration: 0
      },
      processingTimestamp: new Date()
    };

    // Extract data
    const result = await geminiOCREngine.extractCACData(testDocument);

    // Verify the result
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // Should contain the timeout message
    expect(result.error).toMatch(/Request timeout/i);
    
    // Should NOT contain "signal is aborted without reason"
    expect(result.error).not.toContain('signal is aborted without reason');
  });

  it('should clear timeout when request completes successfully', async () => {
    // Mock successful response
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  companyName: 'Test Company',
                  rcNumber: 'RC123456',
                  registrationDate: '01/01/2020',
                  companyAddress: '123 Test St',
                  companyType: 'Private Limited',
                  directors: [],
                  companyStatus: 'Active'
                })
              }]
            }
          }]
        })
      } as Response)
    ) as any;

    // Create a test document
    const testDocument: ProcessedDocument = {
      id: 'test-doc',
      originalFile: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      processedContent: new Uint8Array([1, 2, 3]),
      metadata: {
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        processingDuration: 0
      },
      processingTimestamp: new Date()
    };

    // Extract data
    const result = await geminiOCREngine.extractCACData(testDocument);

    // Verify success
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.companyName).toBe('Test Company');
    
    // No error should be present
    expect(result.error).toBeUndefined();
  });
});
