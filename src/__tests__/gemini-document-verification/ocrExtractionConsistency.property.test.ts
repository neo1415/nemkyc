/**
 * Property Test: OCR extraction determinism
 * 
 * This test validates that OCR extraction produces consistent results
 * for the same document across multiple processing attempts.
 * 
 * Property: For any valid document D, extracting data multiple times
 * should produce identical results (deterministic behavior).
 * 
 * Validates Requirements: 2.7 - OCR_Engine SHALL return extracted data in structured JSON format
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiOCREngine } from '../../services/geminiOCREngine';
import { ProcessedDocument } from '../../types/geminiDocumentVerification';

// Mock the fetch function
global.fetch = vi.fn();

describe('OCR Extraction Consistency Property Tests', () => {
  let ocrEngine: GeminiOCREngine;
  
  beforeEach(() => {
    ocrEngine = new GeminiOCREngine();
    vi.clearAllMocks();
  });

  /**
   * Property 1: OCR extraction determinism
   * For any valid document, multiple extractions should yield identical results
   */
  it('should produce consistent results for identical CAC documents', async () => {
    // Arrange: Create a mock CAC document
    const mockDocument: ProcessedDocument = {
      id: 'test-doc-1',
      originalFile: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
      processedContent: Buffer.from('mock-pdf-content'),
      metadata: {
        fileName: 'test-cac.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        processingDuration: 100
      },
      processingTimestamp: new Date()
    };

    // Mock successful API response
    const mockApiResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              companyName: "Test Company Limited",
              rcNumber: "RC123456",
              registrationDate: "01/01/2020",
              companyAddress: "123 Test Street, Lagos",
              companyType: "Private Limited Company",
              directors: [
                {
                  name: "John Doe",
                  position: "Director"
                }
              ],
              companyStatus: "Active"
            })
          }]
        }
      }]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    // Act: Extract data multiple times
    const results = await Promise.all([
      ocrEngine.extractCACData(mockDocument),
      ocrEngine.extractCACData(mockDocument),
      ocrEngine.extractCACData(mockDocument)
    ]);

    // Assert: All results should be identical
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    // Compare extracted data for consistency
    const firstResult = results[0];
    results.slice(1).forEach(result => {
      expect(result.data).toEqual(firstResult.data);
      expect(result.confidence).toBe(firstResult.confidence);
    });
  });

  /**
   * Property 2: Individual document extraction consistency
   */
  it('should produce consistent results for identical individual documents', async () => {
    // Arrange: Create a mock individual document
    const mockDocument: ProcessedDocument = {
      id: 'test-doc-2',
      originalFile: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
      processedContent: Buffer.from('mock-image-content'),
      metadata: {
        fileName: 'test-id.jpg',
        fileSize: 512,
        mimeType: 'image/jpeg',
        processingDuration: 50
      },
      processingTimestamp: new Date()
    };

    // Mock successful API response
    const mockApiResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              fullName: "Jane Smith",
              dateOfBirth: "15/06/1990",
              documentType: "National ID",
              documentNumber: "12345678901",
              issuingAuthority: "NIMC"
            })
          }]
        }
      }]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    // Act: Extract data multiple times
    const results = await Promise.all([
      ocrEngine.extractIndividualData(mockDocument),
      ocrEngine.extractIndividualData(mockDocument),
      ocrEngine.extractIndividualData(mockDocument)
    ]);

    // Assert: All results should be identical
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    // Compare extracted data for consistency
    const firstResult = results[0];
    results.slice(1).forEach(result => {
      expect(result.data).toEqual(firstResult.data);
      expect(result.confidence).toBe(firstResult.confidence);
    });
  });

  /**
   * Property 3: Confidence calculation consistency
   * Confidence scores should be deterministic based on data completeness
   */
  it('should calculate consistent confidence scores for same data completeness', async () => {
    const testCases = [
      // Complete data should have high confidence
      {
        data: {
          companyName: "Complete Company Ltd",
          rcNumber: "RC123456",
          registrationDate: "01/01/2020",
          companyAddress: "123 Complete Street",
          companyType: "Private Limited Company",
          directors: [{ name: "Director One", position: "CEO" }],
          companyStatus: "Active"
        },
        expectedMinConfidence: 90
      },
      // Partial data should have lower confidence
      {
        data: {
          companyName: "Partial Company Ltd",
          rcNumber: "RC789012",
          registrationDate: null,
          companyAddress: null,
          companyType: "Private Limited Company",
          directors: [],
          companyStatus: null
        },
        expectedMaxConfidence: 70
      }
    ];

    for (const testCase of testCases) {
      // Mock API response with test data
      const mockApiResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(testCase.data)
            }]
          }
        }]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      });

      const mockDocument: ProcessedDocument = {
        id: `test-doc-${Math.random()}`,
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

      // Extract data multiple times
      const results = await Promise.all([
        ocrEngine.extractCACData(mockDocument),
        ocrEngine.extractCACData(mockDocument)
      ]);

      // Assert confidence consistency
      expect(results[0].confidence).toBe(results[1].confidence);
      
      if (testCase.expectedMinConfidence) {
        expect(results[0].confidence).toBeGreaterThanOrEqual(testCase.expectedMinConfidence);
      }
      
      if (testCase.expectedMaxConfidence) {
        expect(results[0].confidence).toBeLessThanOrEqual(testCase.expectedMaxConfidence);
      }
    }
  });

  /**
   * Property 4: Error handling consistency
   * Same error conditions should produce identical error responses
   */
  it('should handle identical error conditions consistently', async () => {
    const mockDocument: ProcessedDocument = {
      id: 'error-test-doc',
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

    // Mock API error
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    // Act: Try extraction multiple times with same error condition
    const results = await Promise.all([
      ocrEngine.extractCACData(mockDocument),
      ocrEngine.extractCACData(mockDocument),
      ocrEngine.extractCACData(mockDocument)
    ]);

    // Assert: All results should be consistently failed
    results.forEach(result => {
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.confidence).toBe(0);
      expect(result.error).toBeDefined();
    });

    // Error messages should be consistent
    const firstError = results[0].error;
    results.slice(1).forEach(result => {
      expect(result.error).toBe(firstError);
    });
  });

  /**
   * Property 5: Data sanitization consistency
   * Sanitized output should be identical for same input
   */
  it('should consistently sanitize extracted data', async () => {
    // Mock document with potentially unsafe content
    const mockDocument: ProcessedDocument = {
      id: 'sanitization-test',
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

    // Mock API response with potentially unsafe content
    const mockApiResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              companyName: "Test <script>alert('xss')</script> Company",
              rcNumber: "RC123456",
              registrationDate: "01/01/2020",
              companyAddress: "123 <b>Bold</b> Street",
              companyType: "Private Limited Company",
              directors: [],
              companyStatus: "Active"
            })
          }]
        }
      }]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    // Act: Extract data multiple times
    const results = await Promise.all([
      ocrEngine.extractCACData(mockDocument),
      ocrEngine.extractCACData(mockDocument)
    ]);

    // Assert: Sanitization should be consistent
    expect(results[0].data).toEqual(results[1].data);
    
    // Verify HTML/script tags are removed
    expect(results[0].data?.companyName).not.toContain('<script>');
    expect(results[0].data?.companyName).not.toContain('<b>');
    expect(results[0].data?.companyAddress).not.toContain('<b>');
  });
});