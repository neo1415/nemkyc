// Gemini OCR Engine service for document text extraction

import { 
  GeminiConfig, 
  GEMINI_CONFIG, 
  CAC_EXTRACTION_PROMPT, 
  INDIVIDUAL_EXTRACTION_PROMPT 
} from '../config/geminiDocumentVerification';
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

interface GeminiRequest {
  contents: [{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string; // Base64 encoded document
      };
    }>;
  }];
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
    responseMimeType: string;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiOCREngine {
  private config: GeminiConfig;
  private rateLimiter: Map<string, number[]> = new Map();

  constructor(config: GeminiConfig = GEMINI_CONFIG) {
    this.config = config;
  }

  /**
   * Extract CAC data from document
   */
  async extractCACData(document: ProcessedDocument): Promise<CACExtractionResult> {
    const startTime = Date.now();

    try {
      // Validate API key
      if (!await this.validateApiKey()) {
        throw GeminiErrorHandler.createError(
          ErrorCode.API_AUTHENTICATION_FAILED,
          'Invalid API key'
        );
      }

      // Check rate limits
      await this.checkRateLimit();

      // Prepare request
      const request = this.buildRequest(CAC_EXTRACTION_PROMPT, document);

      // Make API call with retry
      const response = await withRetry(
        () => this.makeApiCall(request),
        this.config.retryAttempts
      );

      // Parse response
      const extractedData = this.parseResponse(response);

      // Validate extracted data
      const validation = DocumentValidator.validateCACData(extractedData);
      if (!validation.isValid) {
        throw GeminiErrorHandler.createError(
          ErrorCode.EXTRACTION_FAILED,
          `Invalid CAC data: ${validation.errors.join(', ')}`,
          validation
        );
      }

      // Sanitize data
      const sanitizedData = sanitizeExtractedData(extractedData) as CACData;

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(sanitizedData);

      return {
        success: true,
        data: sanitizedData,
        confidence,
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
        error: geminiError.userMessage || geminiError.message || 'Authentication failed. Please contact support.'
      };
    }
  }

  /**
   * Extract individual document data
   */
  async extractIndividualData(document: ProcessedDocument): Promise<IndividualExtractionResult> {
    const startTime = Date.now();

    try {
      // Validate API key
      if (!await this.validateApiKey()) {
        throw GeminiErrorHandler.createError(
          ErrorCode.API_AUTHENTICATION_FAILED,
          'Invalid API key'
        );
      }

      // Check rate limits
      await this.checkRateLimit();

      // Prepare request
      const request = this.buildRequest(INDIVIDUAL_EXTRACTION_PROMPT, document);

      // Make API call with retry
      const response = await withRetry(
        () => this.makeApiCall(request),
        this.config.retryAttempts
      );

      // Parse response
      const extractedData = this.parseResponse(response);

      // Validate extracted data
      const validation = DocumentValidator.validateIndividualData(extractedData);
      if (!validation.isValid) {
        throw GeminiErrorHandler.createError(
          ErrorCode.EXTRACTION_FAILED,
          `Invalid individual data: ${validation.errors.join(', ')}`,
          validation
        );
      }

      // Sanitize data
      const sanitizedData = sanitizeExtractedData(extractedData) as IndividualData;

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(sanitizedData);

      return {
        success: true,
        data: sanitizedData,
        confidence,
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
        error: geminiError.userMessage || geminiError.message || 'Authentication failed. Please contact support.'
      };
    }
  }

  /**
   * Validate API key format and availability
   */
  async validateApiKey(): Promise<boolean> {
    if (!this.config.apiKey || this.config.apiKey.length < 10) {
      console.error('Gemini API key is missing or too short:', this.config.apiKey?.length || 0, 'characters');
      return false;
    }

    // Strict format check for Google API key - must start with AIza and be proper length
    const apiKeyPattern = /^AIza[0-9A-Za-z_-]{35}$/;
    const isValid = apiKeyPattern.test(this.config.apiKey);
    
    if (!isValid) {
      console.error('Gemini API key format is invalid:', this.config.apiKey.substring(0, 10) + '...');
    }
    
    return isValid;
  }

  /**
   * Build Gemini API request
   */
  private buildRequest(prompt: string, document: ProcessedDocument): GeminiRequest {
    // Convert Uint8Array to base64 (browser-compatible)
    const base64Data = this.uint8ArrayToBase64(document.processedContent);

    return {
      contents: [{
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: document.metadata.mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        responseMimeType: "application/json"
      }
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
   * Make API call to Gemini via backend
   */
  private async makeApiCall(request: GeminiRequest): Promise<GeminiResponse> {
    // Use environment variable for API URL with proper fallback
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const url = `${apiBaseUrl}/api/gemini/generate`;

    console.log('Making Gemini API call to backend:', url);
    console.log('Request payload structure:', {
      contents: request.contents.map(c => ({
        parts: c.parts.map(p => ({
          hasText: !!p.text,
          textLength: p.text?.length || 0,
          hasInlineData: !!p.inline_data,
          mimeType: p.inline_data?.mime_type,
          dataLength: p.inline_data?.data?.length || 0
        }))
      })),
      generationConfig: request.generationConfig
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new Error(`Request timeout after ${this.config.timeoutMs}ms`));
    }, this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents: request.contents }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Backend API response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend API error response:', errorData);
        
        // Provide more specific error messages based on status code
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        if (response.status === 400) {
          errorMessage = 'Bad Request - Invalid request format or parameters';
        } else if (response.status === 401) {
          errorMessage = 'Unauthorized - Invalid API key';
        } else if (response.status === 403) {
          errorMessage = 'Forbidden - API key lacks required permissions';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded - Too many requests';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Gemini API response received successfully');
      return data as GeminiResponse;

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle AbortError specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Gemini API call aborted:', error.message);
        throw new Error(`Request timeout: ${error.message || 'The request took too long to complete'}`);
      }
      
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  /**
   * Parse Gemini API response
   */
  private parseResponse(response: GeminiResponse): any {
    let candidate: any = null;
    
    try {
      if (!response.candidates || response.candidates.length === 0) {
        throw GeminiErrorHandler.createError(
          ErrorCode.INVALID_RESPONSE,
          'No candidates in response'
        );
      }

      candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw GeminiErrorHandler.createError(
          ErrorCode.INVALID_RESPONSE,
          'No content in response'
        );
      }

      const textContent = candidate.content.parts[0].text;
      if (!textContent) {
        throw GeminiErrorHandler.createError(
          ErrorCode.INVALID_RESPONSE,
          'No text content in response'
        );
      }

      console.log('Raw Gemini response text:', textContent);

      // Clean and parse JSON response (handles markdown code fences)
      const cleanedText = this.cleanJsonResponse(textContent);
      const parsedData = JSON.parse(cleanedText);
      console.log('Parsed Gemini data:', parsedData);

      // Transform data if needed for individual documents
      if (parsedData.firstName || parsedData.lastName) {
        // If we got firstName/lastName, combine them into fullName
        const nameParts = [];
        if (parsedData.firstName) nameParts.push(parsedData.firstName);
        if (parsedData.middleName) nameParts.push(parsedData.middleName);
        if (parsedData.lastName) nameParts.push(parsedData.lastName);
        
        if (nameParts.length > 0) {
          parsedData.fullName = nameParts.join(' ').trim();
          console.log('Combined fullName:', parsedData.fullName);
        }
      }

      return parsedData;

    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error('JSON parsing error. Raw response:', candidate?.content?.parts?.[0]?.text);
        throw GeminiErrorHandler.createError(
          ErrorCode.PARSING_ERROR,
          'Failed to parse JSON response',
          error
        );
      }
      throw error;
    }
  }

  /**
   * Calculate confidence score based on extracted data completeness
   */
  private calculateConfidence(data: CACData | IndividualData): number {
    if (!data) return 0;

    let totalFields = 0;
    let filledFields = 0;

    Object.entries(data).forEach(([key, value]) => {
      totalFields++;
      if (value !== null && value !== undefined && value !== '') {
        filledFields++;
      }
    });

    return Math.round((filledFields / totalFields) * 100);
  }

  /**
   * Check rate limits
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    const key = 'gemini_api';

    // Get current requests in window
    const requests = this.rateLimiter.get(key) || [];
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);

    // Check if we're at the limit
    if (recentRequests.length >= this.config.rateLimitPerMinute) {
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

  /**
   * Clean JSON response from Gemini API (removes markdown code fences)
   */
  private cleanJsonResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Try to extract JSON from text if it's embedded
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    return cleaned;
  }
}

// Export singleton instance
export const geminiOCREngine = new GeminiOCREngine();