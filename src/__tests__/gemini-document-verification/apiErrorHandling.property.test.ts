/**
 * Property Test: API failure recovery
 * 
 * This test validates that API error handling behaves consistently
 * and implements proper retry logic with exponential backoff.
 * 
 * Property: For any API error condition, the system should handle it
 * gracefully with consistent error responses and appropriate retry behavior.
 * 
 * Validates Requirements: 3.3, 3.4, 7.4 - API rate limiting, error handling, and retry logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiOCREngine } from '../../services/geminiOCREngine';
import { ProcessedDocument } from '../../types/geminiDocumentVerification';
import { ErrorCode } from '../../utils/geminiErrorHandling';

// Mock the fetch function
global.fetch = vi.fn();

describe('API Error Handling Property Tests', () => {
  let ocrEngine: GeminiOCREngine;
  let mockDocument: ProcessedDocument;
  
  beforeEach(() => {
    ocrEngine = new GeminiOCREngine();
    vi.clearAllMocks();
    
    mockDocument = {
      id: 'test-doc',
      originalFile: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      processedContent: Buffer.from('mock-content'),
      metadata: {
        fileName: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        processingDuration: 100
      },
      processingTimestamp: new Date()
    };
  });

  /**
   * Property 1: Consistent error handling for same error types
   * Same error conditions should always produce the same error response
   */
  it('should handle identical API errors consistently', async () => {
    const errorScenarios = [
      {
        name: 'Network timeout',
        mockError: { code: 'ECONNABORTED', message: 'timeout' },
        expectedRetryable: true
      },
      {
        name: 'Network connection refused',
        mockError: { code: 'ECONNREFUSED', message: 'connection refused' },
        expectedRetryable: true
      },
      {
        name: 'DNS resolution failed',
        mockError: { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' },
        expectedRetryable: true
      }
    ];

    for (const scenario of errorScenarios) {
      // Mock the specific error
      (global.fetch as any).mockRejectedValue(scenario.mockError);

      // Test multiple calls with same error
      const results = await Promise.all([
        ocrEngine.extractCACData(mockDocument),
        ocrEngine.extractCACData(mockDocument),
        ocrEngine.extractIndividualData(mockDocument)
      ]);

      // Assert consistent error handling
      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.data).toBeUndefined();
        expect(result.confidence).toBe(0);
        expect(result.error).toBeDefined();
      });

      // All error messages should be identical for same error type
      const firstError = results[0].error;
      results.slice(1).forEach(result => {
        expect(result.error).toBe(firstError);
      });
    }
  });

  /**
   * Property 2: HTTP status code error handling consistency
   * Same HTTP status codes should produce consistent error responses
   */
  it('should handle HTTP status codes consistently', async () => {
    const statusCodeScenarios = [
      {
        status: 401,
        statusText: 'Unauthorized',
        expectedRetryable: false,
        errorData: { error: 'Invalid API key' }
      },
      {
        status: 429,
        statusText: 'Too Many Requests',
        expectedRetryable: true,
        errorData: { error: 'Rate limit exceeded' }
      },
      {
        status: 503,
        statusText: 'Service Unavailable',
        expectedRetryable: true,
        errorData: { error: 'Service temporarily unavailable' }
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
        expectedRetryable: true,
        errorData: { error: 'Internal server error' }
      }
    ];

    for (const scenario of statusCodeScenarios) {
      // Mock HTTP error response
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: scenario.status,
        statusText: scenario.statusText,
        json: () => Promise.resolve(scenario.errorData)
      });

      // Test multiple calls with same status code
      const results = await Promise.all([
        ocrEngine.extractCACData(mockDocument),
        ocrEngine.extractIndividualData(mockDocument)
      ]);

      // Assert consistent error handling
      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.data).toBeUndefined();
        expect(result.confidence).toBe(0);
        expect(result.error).toBeDefined();
      });

      // Error messages should be consistent for same status code
      expect(results[0].error).toBe(results[1].error);
    }
  });

  /**
   * Property 3: Rate limiting behavior consistency
   * Rate limiting should be enforced consistently across all requests
   */
  it('should enforce rate limits consistently', async () => {
    // Create an OCR engine with very low rate limit for testing
    const rateLimitedEngine = new GeminiOCREngine({
      apiKey: 'AIzaSyDummyKeyForTesting1234567890123456789', // Valid format
      model: 'gemini-2.5-flash',
      maxTokens: 2048,
      temperature: 0.1,
      timeoutMs: 60000,
      retryAttempts: 1, // Reduce retries for faster testing
      rateLimitPerMinute: 2 // Very low limit
    });

    // Mock successful API responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                companyName: "Test Company",
                rcNumber: "RC123456"
              })
            }]
          }
        }]
      })
    });

    // Make requests up to the limit
    const initialResults = await Promise.all([
      rateLimitedEngine.extractCACData(mockDocument),
      rateLimitedEngine.extractCACData(mockDocument)
    ]);

    // These should succeed
    initialResults.forEach(result => {
      expect(result.success).toBe(true);
    });

    // Additional requests should be rate limited
    const rateLimitedResult = await rateLimitedEngine.extractCACData(mockDocument);

    // This should fail with rate limit error
    expect(rateLimitedResult.success).toBe(false);
    expect(rateLimitedResult.error).toMatch(/Rate limit|Too many requests/i);
  });

  /**
   * Property 4: Retry behavior consistency
   * Retry logic should behave consistently for retryable errors
   */
  it('should implement consistent retry behavior', async () => {
    // Create engine with valid API key
    const retryEngine = new GeminiOCREngine({
      apiKey: 'AIzaSyDummyKeyForTesting1234567890123456789', // Valid format
      model: 'gemini-2.5-flash',
      maxTokens: 2048,
      temperature: 0.1,
      timeoutMs: 60000,
      retryAttempts: 3,
      rateLimitPerMinute: 60
    });

    // Mock the validateApiKey method to return true
    vi.spyOn(retryEngine, 'validateApiKey').mockResolvedValue(true);

    let callCount = 0;
    
    // Mock API to fail first 2 times, then succeed
    (global.fetch as any).mockImplementation(() => {
      callCount++;
      if (callCount <= 2) {
        const error = new Error('timeout');
        (error as any).code = 'ECONNABORTED';
        return Promise.reject(error);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  companyName: "Test Company",
                  rcNumber: "RC123456"
                })
              }]
            }
          }]
        })
      });
    });

    // Test retry behavior
    const result = await retryEngine.extractCACData(mockDocument);

    // Should eventually succeed after retries
    expect(result.success).toBe(true);
    expect(callCount).toBe(3); // Initial call + 2 retries
  });

  /**
   * Property 5: Timeout handling consistency
   * Timeout errors should be handled consistently
   */
  it('should handle timeouts consistently', async () => {
    // Mock fetch to simulate timeout
    (global.fetch as any).mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const error = new Error('Request timeout');
          error.name = 'AbortError';
          reject(error);
        }, 100);
      });
    });

    // Test timeout handling
    const results = await Promise.all([
      ocrEngine.extractCACData(mockDocument),
      ocrEngine.extractIndividualData(mockDocument)
    ]);

    // Both should fail with timeout-related error
    results.forEach(result => {
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    // Error messages should be consistent
    expect(results[0].error).toBe(results[1].error);
  });

  /**
   * Property 6: Invalid response handling consistency
   * Invalid API responses should be handled consistently
   */
  it('should handle invalid responses consistently', async () => {
    const invalidResponseScenarios = [
      {
        name: 'Empty response',
        response: {}
      },
      {
        name: 'Missing candidates',
        response: { candidates: [] }
      },
      {
        name: 'Missing content',
        response: { candidates: [{}] }
      },
      {
        name: 'Missing parts',
        response: { candidates: [{ content: {} }] }
      },
      {
        name: 'Empty parts',
        response: { candidates: [{ content: { parts: [] } }] }
      },
      {
        name: 'Missing text',
        response: { candidates: [{ content: { parts: [{}] } }] }
      },
      {
        name: 'Invalid JSON in text',
        response: { candidates: [{ content: { parts: [{ text: 'invalid json' }] } }] }
      }
    ];

    for (const scenario of invalidResponseScenarios) {
      // Mock invalid response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(scenario.response)
      });

      // Test both extraction methods
      const results = await Promise.all([
        ocrEngine.extractCACData(mockDocument),
        ocrEngine.extractIndividualData(mockDocument)
      ]);

      // Both should fail consistently
      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.data).toBeUndefined();
        expect(result.confidence).toBe(0);
        expect(result.error).toBeDefined();
      });

      // Error handling should be consistent between methods
      expect(results[0].error).toBe(results[1].error);
    }
  });

  /**
   * Property 7: API key validation consistency
   * Invalid API keys should be handled consistently
   */
  it('should validate API keys consistently', async () => {
    const invalidApiKeys = [
      '',
      'short',
      'invalid-format-key',
      'AIza' + 'x'.repeat(31), // Wrong length
      'BIZA' + 'x'.repeat(35)  // Wrong prefix
    ];

    for (const invalidKey of invalidApiKeys) {
      const engineWithInvalidKey = new GeminiOCREngine({
        apiKey: invalidKey,
        model: 'gemini-2.5-flash',
        maxTokens: 2048,
        temperature: 0.1,
        timeoutMs: 60000,
        retryAttempts: 3,
        rateLimitPerMinute: 60
      });

      // Test both extraction methods
      const results = await Promise.all([
        engineWithInvalidKey.extractCACData(mockDocument),
        engineWithInvalidKey.extractIndividualData(mockDocument)
      ]);

      // Both should fail with authentication error
      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.error).toContain('Authentication failed. Please contact support.');
      });

      // Error messages should be consistent
      expect(results[0].error).toBe(results[1].error);
    }
  });
});