// Robust JSON parsing utilities for Gemini Document Verification

import { CACData, IndividualData, ExtractedDocumentData } from '@/types/geminiDocumentVerification';
import { GeminiError, ErrorCode, GeminiErrorHandler } from './geminiErrorHandling';

export interface ParsedGeminiResponse {
  success: boolean;
  data?: ExtractedDocumentData;
  confidence?: number;
  rawResponse?: string;
  error?: GeminiError;
}

export interface ValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'array';
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  validator?: (value: any) => boolean;
}

export class GeminiJsonParser {
  private static readonly CAC_VALIDATION_RULES: ValidationRule[] = [
    { field: 'companyName', required: true, type: 'string', minLength: 2, maxLength: 200 },
    { field: 'rcNumber', required: true, type: 'string', pattern: /^[A-Za-z0-9]+$/, minLength: 5, maxLength: 20 },
    { field: 'registrationDate', required: true, type: 'date' },
    { field: 'address', required: true, type: 'string', minLength: 10, maxLength: 500 },
    { field: 'companyType', required: false, type: 'string' },
    { field: 'directors', required: false, type: 'array' },
    { field: 'companyStatus', required: false, type: 'string' }
  ];

  private static readonly INDIVIDUAL_VALIDATION_RULES: ValidationRule[] = [
    { field: 'fullName', required: true, type: 'string', minLength: 2, maxLength: 100 },
    { field: 'dateOfBirth', required: false, type: 'date' },
    { field: 'nin', required: false, type: 'string', pattern: /^\d{11}$/ },
    { field: 'bvn', required: false, type: 'string', pattern: /^\d{11}$/ },
    { field: 'gender', required: false, type: 'string', validator: (value) => ['Male', 'Female', 'M', 'F'].includes(value) },
    { field: 'documentType', required: false, type: 'string' },
    { field: 'documentNumber', required: false, type: 'string' },
    { field: 'issuingAuthority', required: false, type: 'string' }
  ];

  /**
   * Parse Gemini API response for CAC documents
   */
  static parseCACResponse(response: string): ParsedGeminiResponse {
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = this.safeJsonParse(cleanedResponse);
      
      if (!parsedData) {
        return {
          success: false,
          error: GeminiErrorHandler.createError(
            ErrorCode.PARSING_ERROR,
            'Failed to parse JSON response',
            { response: response.substring(0, 200) }
          )
        };
      }

      // Validate and normalize CAC data
      const validationResult = this.validateCACData(parsedData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: GeminiErrorHandler.createError(
            ErrorCode.INVALID_RESPONSE,
            'Invalid CAC data structure',
            { errors: validationResult.errors, data: parsedData }
          )
        };
      }

      const normalizedData = this.normalizeCACData(parsedData);
      const confidence = this.calculateConfidence(normalizedData, this.CAC_VALIDATION_RULES);

      return {
        success: true,
        data: normalizedData,
        confidence,
        rawResponse: response
      };

    } catch (error) {
      return {
        success: false,
        error: GeminiErrorHandler.createError(
          ErrorCode.PARSING_ERROR,
          'JSON parsing failed',
          { error: error instanceof Error ? error.message : 'Unknown error', response: response.substring(0, 200) }
        )
      };
    }
  }

  /**
   * Parse Gemini API response for individual documents
   */
  static parseIndividualResponse(response: string): ParsedGeminiResponse {
    try {
      const cleanedResponse = this.cleanJsonResponse(response);
      const parsedData = this.safeJsonParse(cleanedResponse);
      
      if (!parsedData) {
        return {
          success: false,
          error: GeminiErrorHandler.createError(
            ErrorCode.PARSING_ERROR,
            'Failed to parse JSON response',
            { response: response.substring(0, 200) }
          )
        };
      }

      // Validate and normalize individual data
      const validationResult = this.validateIndividualData(parsedData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: GeminiErrorHandler.createError(
            ErrorCode.INVALID_RESPONSE,
            'Invalid individual data structure',
            { errors: validationResult.errors, data: parsedData }
          )
        };
      }

      const normalizedData = this.normalizeIndividualData(parsedData);
      const confidence = this.calculateConfidence(normalizedData, this.INDIVIDUAL_VALIDATION_RULES);

      return {
        success: true,
        data: normalizedData,
        confidence,
        rawResponse: response
      };

    } catch (error) {
      return {
        success: false,
        error: GeminiErrorHandler.createError(
          ErrorCode.PARSING_ERROR,
          'JSON parsing failed',
          { error: error instanceof Error ? error.message : 'Unknown error', response: response.substring(0, 200) }
        )
      };
    }
  }

  /**
   * Serialize data for API requests
   */
  static serializeForAPI(data: any, apiType: 'verifydata' | 'datapro'): string {
    try {
      // Create API-specific payload
      const payload = this.createApiPayload(data, apiType);
      
      // Validate payload structure
      this.validateApiPayload(payload, apiType);
      
      return JSON.stringify(payload, null, 0);
    } catch (error) {
      throw GeminiErrorHandler.createError(
        ErrorCode.PARSING_ERROR,
        'Failed to serialize API request',
        { error: error instanceof Error ? error.message : 'Unknown error', data }
      );
    }
  }

  /**
   * Validate round-trip consistency
   */
  static validateRoundTrip(originalData: any): {
    success: boolean;
    error?: string;
  } {
    try {
      const serialized = JSON.stringify(originalData);
      const parsed = JSON.parse(serialized);
      
      // Deep comparison
      const isEqual = this.deepEqual(originalData, parsed);
      
      return {
        success: isEqual,
        error: isEqual ? undefined : 'Round-trip validation failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Round-trip validation error'
      };
    }
  }

  /**
   * Clean JSON response from Gemini API
   */
  private static cleanJsonResponse(response: string): string {
    // Remove markdown code blocks
    let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Try to extract JSON from text if it's embedded
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    // Fix common JSON issues
    cleaned = this.fixCommonJsonIssues(cleaned);
    
    return cleaned;
  }

  /**
   * Fix common JSON formatting issues
   */
  private static fixCommonJsonIssues(json: string): string {
    // Fix trailing commas
    json = json.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unquoted keys
    json = json.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Fix single quotes to double quotes
    json = json.replace(/'/g, '"');
    
    // Fix escaped quotes issues
    json = json.replace(/\\"/g, '\\"');
    
    return json;
  }

  /**
   * Safe JSON parsing with error handling
   */
  private static safeJsonParse(jsonString: string): any | null {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      // Try to fix and parse again
      try {
        const fixed = this.attemptJsonFix(jsonString);
        return JSON.parse(fixed);
      } catch (secondError) {
        return null;
      }
    }
  }

  /**
   * Attempt to fix malformed JSON
   */
  private static attemptJsonFix(json: string): string {
    // Remove control characters
    json = json.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Fix incomplete objects/arrays
    const openBraces = (json.match(/\{/g) || []).length;
    const closeBraces = (json.match(/\}/g) || []).length;
    const openBrackets = (json.match(/\[/g) || []).length;
    const closeBrackets = (json.match(/\]/g) || []).length;
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      json += '}';
    }
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      json += ']';
    }
    
    return json;
  }

  /**
   * Validate CAC data structure
   */
  private static validateCACData(data: any): { valid: boolean; errors: string[] } {
    return this.validateDataStructure(data, this.CAC_VALIDATION_RULES);
  }

  /**
   * Validate individual data structure
   */
  private static validateIndividualData(data: any): { valid: boolean; errors: string[] } {
    return this.validateDataStructure(data, this.INDIVIDUAL_VALIDATION_RULES);
  }

  /**
   * Generic data structure validation
   */
  private static validateDataStructure(data: any, rules: ValidationRule[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Data must be an object');
      return { valid: false, errors };
    }

    for (const rule of rules) {
      const value = data[rule.field];

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`Required field '${rule.field}' is missing or empty`);
        continue;
      }

      // Skip validation for optional empty fields
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (!this.validateFieldType(value, rule)) {
        errors.push(`Field '${rule.field}' has invalid type. Expected ${rule.type}`);
        continue;
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`Field '${rule.field}' does not match required pattern`);
      }

      // Length validation
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`Field '${rule.field}' is too short. Minimum length: ${rule.minLength}`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`Field '${rule.field}' is too long. Maximum length: ${rule.maxLength}`);
        }
      }

      // Custom validator
      if (rule.validator && !rule.validator(value)) {
        errors.push(`Field '${rule.field}' failed custom validation`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate field type
   */
  private static validateFieldType(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'date':
        return typeof value === 'string' && !isNaN(Date.parse(value));
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * Normalize CAC data
   */
  private static normalizeCACData(data: any): CACData {
    return {
      companyName: this.normalizeString(data.companyName),
      rcNumber: this.normalizeString(data.rcNumber).toUpperCase(),
      registrationDate: this.normalizeDate(data.registrationDate),
      address: this.normalizeString(data.address),
      companyType: data.companyType ? this.normalizeString(data.companyType) : undefined,
      directors: Array.isArray(data.directors) ? data.directors.map(d => this.normalizeString(d)) : undefined,
      companyStatus: data.companyStatus ? this.normalizeString(data.companyStatus) : undefined
    };
  }

  /**
   * Normalize individual data
   */
  private static normalizeIndividualData(data: any): IndividualData {
    return {
      fullName: this.normalizeString(data.fullName),
      dateOfBirth: data.dateOfBirth ? this.normalizeDate(data.dateOfBirth) : null,
      nin: data.nin ? this.normalizeString(data.nin) : undefined,
      bvn: data.bvn ? this.normalizeString(data.bvn) : undefined,
      gender: data.gender ? this.normalizeGender(data.gender) : undefined,
      documentType: data.documentType ? this.normalizeString(data.documentType) : undefined,
      documentNumber: data.documentNumber ? this.normalizeString(data.documentNumber) : undefined,
      issuingAuthority: data.issuingAuthority ? this.normalizeString(data.issuingAuthority) : undefined
    };
  }

  /**
   * Normalize string values
   */
  private static normalizeString(value: any): string {
    if (typeof value !== 'string') {
      return String(value || '');
    }
    return value.trim().replace(/\s+/g, ' ');
  }

  /**
   * Normalize date values
   */
  private static normalizeDate(value: any): string | null {
    if (!value || value === null || value === undefined) return null;
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return String(value); // Return original if can't parse
    }
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Normalize gender values
   */
  private static normalizeGender(value: any): string {
    if (typeof value !== 'string') return '';
    
    const normalized = value.toLowerCase().trim();
    if (normalized.startsWith('m')) return 'Male';
    if (normalized.startsWith('f')) return 'Female';
    return value;
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private static calculateConfidence(data: any, rules: ValidationRule[]): number {
    let totalFields = 0;
    let completedFields = 0;
    let requiredFields = 0;
    let completedRequiredFields = 0;

    for (const rule of rules) {
      totalFields++;
      if (rule.required) {
        requiredFields++;
      }

      const value = data[rule.field];
      const hasValue = value !== undefined && value !== null && value !== '';

      if (hasValue) {
        completedFields++;
        if (rule.required) {
          completedRequiredFields++;
        }
      }
    }

    // Weight required fields more heavily
    const requiredScore = requiredFields > 0 ? (completedRequiredFields / requiredFields) * 0.8 : 0;
    const optionalScore = totalFields > requiredFields ? ((completedFields - completedRequiredFields) / (totalFields - requiredFields)) * 0.2 : 0;

    return Math.round((requiredScore + optionalScore) * 100);
  }

  /**
   * Create API-specific payload
   */
  private static createApiPayload(data: any, apiType: 'verifydata' | 'datapro'): any {
    if (apiType === 'verifydata') {
      return {
        service: 'cac_verification',
        data: {
          rc_number: data.rcNumber,
          company_name: data.companyName
        }
      };
    } else if (apiType === 'datapro') {
      return {
        request_type: 'cac_lookup',
        parameters: {
          registration_number: data.rcNumber,
          company_name: data.companyName
        }
      };
    }
    
    return data;
  }

  /**
   * Validate API payload structure
   */
  private static validateApiPayload(payload: any, apiType: 'verifydata' | 'datapro'): void {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be an object');
    }

    if (apiType === 'verifydata') {
      if (!payload.service || !payload.data) {
        throw new Error('VerifyData payload must have service and data fields');
      }
    } else if (apiType === 'datapro') {
      if (!payload.request_type || !payload.parameters) {
        throw new Error('DataPro payload must have request_type and parameters fields');
      }
    }
  }

  /**
   * Deep equality comparison
   */
  private static deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }
}