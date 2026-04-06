// Document AI OCR Engine service for document text extraction
// Replaces Gemini API with Google Cloud Document AI for NDPA compliance

import { 
  ProcessedDocument, 
  CACExtractionResult, 
  IndividualExtractionResult,
  CACData,
  IndividualData
} from '../types/geminiDocumentVerification';
import { 
  GeminiErrorHandler, 
  ErrorCode, 
  withRetry 
} from '../utils/geminiErrorHandling';
import { 
  DocumentValidator, 
  sanitizeExtractedData 
} from '../utils/geminiDocumentValidation';

interface DocumentAIRequest {
  document: {
    content: string; // Base64 encoded document
    mimeType: string;
  };
  documentType: 'individual' | 'cac';
}

interface DocumentAIResponse {
  success: boolean;
  extractedData?: any;
  confidence: number;
  error?: string;
}

export class DocumentAIOCREngine {
  private rateLimiter: Map<string, number[]> = new Map();
  private readonly apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  /**
   * Extract CAC data from document using Document AI
   */
  async extractCACData(document: ProcessedDocument): Promise<CACExtractionResult> {
    const startTime = Date.now();

    try {
      // Check rate limits
      await this.checkRateLimit();

      // Prepare request
      const request = this.buildRequest(document, 'cac');

      // Make API call with retry
      const response = await withRetry(
        () => this.makeApiCall(request),
        3 // retry attempts
      );

      if (!response.success) {
        throw GeminiErrorHandler.createError(
          ErrorCode.OCR_FAILED,
          response.error || 'Document AI extraction failed'
        );
      }

      // Validate extracted data
      const validation = DocumentValidator.validateCACData(response.extractedData);
      if (!validation.isValid) {
        throw GeminiErrorHandler.createError(
          ErrorCode.EXTRACTION_FAILED,
          `Invalid CAC data: ${validation.errors.join(', ')}`,
          validation
        );
      }

      // Sanitize data
      const sanitizedData = sanitizeExtractedData(response.extractedData) as CACData;

      return {
        success: true,
        data: sanitizedData,
        confidence: response.confidence,
        error: undefined
      };

    } catch (error) {
      const geminiError = error instanceof Error 
        ? GeminiErrorHandler.handleApiError(error)
        : error;

      GeminiErrorHandler.logError(geminiError, {
        documentId: document.id,
        fileName: document.metadata.fileName,
        processingTime: Date.now() - startTime
      });

      return {
        success: false,
        data: undefined,
        confidence: 0,
        error: geminiError.userMessage || geminiError.message || 'Document processing failed. Please contact support.'
      };
    }
  }

  /**
   * Extract individual document data using Document AI
   */
  async extractIndividualData(document: ProcessedDocument): Promise<IndividualExtractionResult> {
    const startTime = Date.now();

    try {
      // Check rate limits
      await this.checkRateLimit();

      // Prepare request
      const request = this.buildRequest(document, 'individual');

      // Make API call with retry
      const response = await withRetry(
        () => this.makeApiCall(request),
        3 // retry attempts
      );

      if (!response.success) {
        throw GeminiErrorHandler.createError(
          ErrorCode.OCR_FAILED,
          response.error || 'Document AI extraction failed'
        );
      }

      // Validate extracted data
      const validation = DocumentValidator.validateIndividualData(response.extractedData);
      if (!validation.isValid) {
        throw GeminiErrorHandler.createError(
          ErrorCode.EXTRACTION_FAILED,
          `Invalid individual data: ${validation.errors.join(', ')}`,
          validation
        );
      }

      // Sanitize data
      const sanitizedData = sanitizeExtractedData(response.extractedData) as IndividualData;

      return {
        success: true,
        data: sanitizedData,
        confidence: response.confidence,
        error: undefined
      };

    } catch (error) {
      const geminiError = error instanceof Error 
        ? GeminiErrorHandler.handleApiError(error)
        : error;

      GeminiErrorHandler.logError(geminiError, {
        documentId: document.id,
        fileName: document.metadata.fileName,
        processingTime: Date.now() - startTime
      });

      return {
        success: false,
        data: undefined,
        confidence: 0,
        error: geminiError.userMessage || geminiError.message || 'Document processing failed. Please contact support.'
      };
    }
  }

  /**
   * Build Document AI request
   */
  private buildRequest(document: ProcessedDocument, documentType: 'individual' | 'cac'): DocumentAIRequest {
    // Convert Uint8Array to base64 (browser-compatible)
    const base64Data = this.uint8ArrayToBase64(document.processedContent);

    return {
      document: {
        content: base64Data,
        mimeType: document.metadata.mimeType
      },
      documentType
    };
  }

  /**
   * Convert Uint8Array to base64 string (browser-compatible)
   */
  private uint8ArrayToBase64(uint8Array: Uint8Array): string {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  /**
   * Make API call to Document AI via backend
   */
  private async makeApiCall(request: DocumentAIRequest): Promise<DocumentAIResponse> {
    const url = `${this.apiBaseUrl}/api/document-ai/process`;

    console.log('Making Document AI API call to backend:', url);
    console.log('Request payload structure:', {
      documentType: request.documentType,
      mimeType: request.document.mimeType,
      contentLength: request.document.content.length
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new Error('Request timeout after 30000ms'));
    }, 30000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Backend API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend API error response:', errorData);
        
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        if (response.status === 400) {
          errorMessage = 'Bad Request - Invalid document format or parameters';
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized - Invalid credentials';
        } else if (response.status === 403) {
          errorMessage = 'Forbidden - Access denied';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded - Too many requests';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Document AI API response received successfully');
      return data as DocumentAIResponse;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Document AI API call aborted:', error.message);
        throw new Error(`Request timeout: ${error.message || 'The request took too long to complete'}`);
      }
      
      console.error('Document AI API call failed:', error);
      throw error;
    }
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    const key = 'document_ai_api';

    // Get current requests in window
    const requests = this.rateLimiter.get(key) || [];
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);

    // Check if we're at the limit (60 requests per minute for Document AI)
    if (recentRequests.length >= 60) {
      const oldestRequest = Math.min(...recentRequests);
      const waitTime = oldestRequest + 60000 - now;
      
      throw GeminiErrorHandler.createError(
        ErrorCode.API_RATE_LIMITED,
        `Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)} seconds`,
        { waitTime },
        true
      );
    }

    // Add current request
    recentRequests.push(now);
    this.rateLimiter.set(key, recentRequests);
  }
}

// Export singleton instance
export const documentAIOCREngine = new DocumentAIOCREngine();
