// Configuration for Gemini Document Verification system

export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-2.5-flash';
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  retryAttempts: number;
  rateLimitPerMinute: number;
}

export interface VerificationThresholds {
  cac: {
    companyNameSimilarity: number; // 85 (percentage)
    addressSimilarity: number;     // 70 (percentage)
    directorSimilarity: number;    // 80 (percentage)
    exactMatchFields: string[];    // ['rcNumber', 'registrationDate']
  };
  individual: {
    nameSimilarity: number;        // 85 (percentage)
    exactMatchFields: string[];    // ['dateOfBirth']
  };
}

export interface ProcessingLimits {
  maxFileSize: {
    pdf: number;    // 50MB
    image: number;  // 10MB
  };
  maxPages: number; // 1000
  timeoutSeconds: {
    ocr: number;           // 30s for <5MB, 60s for >5MB
    verification: number;  // 15s
    total: number;        // 90s
  };
  concurrentProcessing: number; // 10
}

// Default configuration
export const GEMINI_CONFIG: GeminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCaC6K3pvOiyzVzF3hsYmTovOJ-mp35-xg',
  model: 'gemini-2.5-flash',
  maxTokens: 2048,
  temperature: 0.1,
  timeoutMs: 60000,
  retryAttempts: 3,
  rateLimitPerMinute: 60
};

export const VERIFICATION_THRESHOLDS: VerificationThresholds = {
  cac: {
    companyNameSimilarity: 85,
    addressSimilarity: 70,
    directorSimilarity: 80,
    exactMatchFields: ['rcNumber', 'registrationDate']
  },
  individual: {
    nameSimilarity: 85,
    exactMatchFields: ['dateOfBirth']
  }
};

export const PROCESSING_LIMITS: ProcessingLimits = {
  maxFileSize: {
    pdf: 5 * 1024 * 1024,   // 5MB
    image: 5 * 1024 * 1024  // 5MB
  },
  maxPages: 1000,
  timeoutSeconds: {
    ocr: 30,           // 30s for <5MB, 60s for >5MB
    verification: 15,  // 15s
    total: 90         // 90s
  },
  concurrentProcessing: 10
};

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  pdf: ['application/pdf'],
  image: ['image/png', 'image/jpeg', 'image/jpg']
};

// OCR Prompts
export const CAC_EXTRACTION_PROMPT = `
Extract the following information from this CAC certificate document and return as JSON:
{
  "companyName": "exact company name as shown",
  "rcNumber": "registration number (RC followed by numbers)",
  "registrationDate": "date in DD/MM/YYYY format",
  "companyAddress": "registered office address",
  "companyType": "type of entity (e.g., Private Limited Company)",
  "directors": [
    {
      "name": "director full name",
      "position": "position/title",
      "appointmentDate": "appointment date if available"
    }
  ],
  "companyStatus": "current status if shown"
}

If any field is not clearly visible or available, use null for that field.
Ensure all text is extracted exactly as shown in the document.
`;

export const INDIVIDUAL_EXTRACTION_PROMPT = `
Extract the following personal information from this document and return as JSON:
{
  "fullName": "complete full name (combine first name, middle name, and last name if present)",
  "dateOfBirth": "date of birth in DD/MM/YYYY format if available",
  "gender": "gender if shown (Male/Female)",
  "documentType": "type of document (e.g., National ID, Passport, etc.)",
  "documentNumber": "document number if visible",
  "issuingAuthority": "issuing authority if shown"
}

Important instructions:
- For fullName: Combine all name parts (first name, middle name, surname) into a single field
- If date of birth is not visible or available, use null for that field
- Focus on extracting the fullName field accurately - this is the most important field
- Extract gender if clearly visible on the document
`;

export const INDIVIDUAL_EXTRACTION_PROMPT_FALLBACK = `
Extract the following personal information from this document and return as JSON:
{
  "firstName": "first name as shown",
  "lastName": "last name/surname as shown",
  "middleName": "middle name if present", 
  "dateOfBirth": "date of birth in DD/MM/YYYY format if available",
  "gender": "gender if shown (Male/Female)",
  "documentType": "type of document (e.g., National ID, Passport, etc.)",
  "documentNumber": "document number if visible",
  "issuingAuthority": "issuing authority if shown"
}

If any field is not clearly visible, use null for that field.
Focus on extracting name components accurately.
`;

// Error messages
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  UNSUPPORTED_FORMAT: 'File format is not supported',
  TOO_MANY_PAGES: 'PDF has too many pages',
  OCR_FAILED: 'Failed to extract text from document',
  VERIFICATION_FAILED: 'Document verification failed',
  API_UNAVAILABLE: 'Service is temporarily unavailable',
  PROCESSING_TIMEOUT: 'Document processing timed out',
  INVALID_DOCUMENT: 'Document appears to be invalid or corrupted'
};

// Cache configuration
export const CACHE_CONFIG = {
  documentProcessingTTL: 24 * 60 * 60 * 1000, // 24 hours
  verificationResultTTL: 24 * 60 * 60 * 1000,  // 24 hours
  apiResponseTTL: 60 * 60 * 1000               // 1 hour
};

// Audit configuration
export const AUDIT_CONFIG = {
  retentionYears: 7,
  batchSize: 100,
  maxLogSize: 1024 * 1024, // 1MB per log entry
  sensitiveFields: ['documentNumber', 'dateOfBirth', 'directors']
};