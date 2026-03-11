# Gemini Document Verification System

A comprehensive document verification system using Google Gemini 2.5 Flash API for OCR processing with intelligent form integration and real-time verification.

## Overview

This system provides:
- **OCR Processing**: Google Gemini 2.5 Flash API integration for document text extraction
- **Intelligent Verification**: Fuzzy matching against VerifyData/DataPro systems
- **Form Integration**: Blocking behavior based on verification results
- **Security**: AES-256 encryption, access controls, and secure cleanup
- **Real-time Updates**: WebSocket integration for live status updates
- **Comprehensive Auditing**: Full event tracking for compliance

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI Component  │───▶│ Form Controller  │───▶│ Document        │
│                 │    │                  │    │ Processor       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                       ┌──────────────────┐             ▼
                       │ Mismatch         │    ┌─────────────────┐
                       │ Analyzer         │◀───│ OCR Engine      │
                       └──────────────────┘    │ (Gemini API)    │
                                │              └─────────────────┘
                                ▼                       │
                       ┌──────────────────┐             ▼
                       │ Verification     │    ┌─────────────────┐
                       │ Matcher          │◀───│ External APIs   │
                       └──────────────────┘    │ (VerifyData/    │
                                │              │  DataPro)       │
                                ▼              └─────────────────┘
                       ┌──────────────────┐
                       │ Audit Logger     │
                       └──────────────────┘
```

## Core Services

### 1. GeminiOCREngine
- **Purpose**: Extract structured data from documents using Gemini API
- **Features**: Rate limiting, retry logic, confidence scoring
- **Supported**: PDF (50MB/1000 pages), Images (10MB)

```typescript
import { geminiOCREngine } from './services/geminiOCREngine';

const result = await geminiOCREngine.extractCACData(document);
if (result.success) {
  console.log('Extracted data:', result.data);
  console.log('Confidence:', result.confidence);
}
```

### 2. VerificationMatcher
- **Purpose**: Compare extracted data with official records
- **Algorithms**: Levenshtein, Jaro-Winkler, Token Set similarity
- **Thresholds**: 85% company name, 70% address, exact ID numbers

```typescript
import { verificationMatcher } from './services/geminiVerificationMatcher';

const result = await verificationMatcher.verifyCACDocument(
  extractedData,
  formData
);
console.log('Match result:', result.isMatch);
console.log('Confidence:', result.confidence);
console.log('Mismatches:', result.mismatches);
```

### 3. DocumentProcessor
- **Purpose**: Orchestrate complete verification workflow
- **Features**: Async processing, status tracking, cleanup
- **Limits**: 10 concurrent documents, 24-hour retention

```typescript
import { documentProcessor } from './services/geminiDocumentProcessor';

const result = await documentProcessor.processDocument(
  file,
  'cac',
  formData
);
```

### 4. FormSubmissionController
- **Purpose**: Manage form blocking based on verification results
- **Features**: Session management, configurable thresholds
- **Configurations**: Per form type (NFIU/KYC, Individual/Corporate)

```typescript
import { formSubmissionController } from './services/geminiFormSubmissionController';

// Initialize session
const state = await formSubmissionController.initializeFormSession(
  formId,
  userId,
  'nfiu'
);

// Check eligibility
const eligibility = await formSubmissionController.checkSubmissionEligibility(formId);
console.log('Can submit:', eligibility.canSubmit);
```

### 5. MismatchAnalyzer
- **Purpose**: Provide detailed analysis of verification mismatches
- **Categories**: Name variations, address differences, ID mismatches
- **Output**: User-friendly explanations and resolution suggestions

```typescript
import { mismatchAnalyzer } from './services/geminiMismatchAnalyzer';

const analysis = mismatchAnalyzer.analyzeMismatches(mismatches);
console.log('Summary:', analysis.summary);
console.log('Recommendations:', analysis.recommendations);
console.log('Can proceed:', analysis.canProceed);
```

### 6. DocumentSecurity
- **Purpose**: Handle encryption, access control, and secure cleanup
- **Features**: AES-256-GCM encryption, role-based access, PII detection
- **Compliance**: NDPR-compliant data handling

```typescript
import { documentSecurity } from './services/geminiDocumentSecurity';

// Encrypt document
const encrypted = await documentSecurity.encryptDocument(document);

// Check access
const hasAccess = await documentSecurity.checkDocumentAccess(
  documentId,
  userContext,
  'read'
);
```

## UI Components

### DocumentUploadSection
A comprehensive React component providing:
- Drag-and-drop file upload
- Real-time processing status
- Verification results display
- Mismatch analysis presentation
- Error handling and retry

```tsx
import { DocumentUploadSection } from './components/gemini/DocumentUploadSection';

<DocumentUploadSection
  formId={formId}
  documentType="cac"
  formData={formData}
  onVerificationComplete={(result) => {
    console.log('Verification completed:', result);
  }}
/>
```

## Configuration

### Environment Variables
```env
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.1
GEMINI_MAX_TOKENS=8192

# Document Security
DOCUMENT_ENCRYPTION_KEY=your_encryption_key

# Processing Limits
MAX_CONCURRENT_PROCESSING=10
PROCESSING_TIMEOUT_SECONDS=300
DOCUMENT_RETENTION_HOURS=24
```

### Verification Thresholds
```typescript
const VERIFICATION_THRESHOLDS = {
  cac: {
    companyNameSimilarity: 85,
    addressSimilarity: 70,
    directorSimilarity: 80
  },
  individual: {
    nameSimilarity: 85,
    minimumConfidence: 70
  }
};
```

## Integration Examples

### NFIU Corporate Form
```tsx
import { GeminiDocumentVerificationExample } from './examples/GeminiDocumentVerificationExample';

<GeminiDocumentVerificationExample
  formType="nfiu"
  formSubtype="corporate"
/>
```

### KYC Individual Form
```tsx
<GeminiDocumentVerificationExample
  formType="kyc"
  formSubtype="individual"
/>
```

## Testing

The system includes comprehensive property-based tests:

```bash
# Run all Gemini verification tests
npm test src/__tests__/gemini-document-verification/

# Run specific test suites
npm test ocrExtractionConsistency.property.test.ts
npm test similarityCalculations.property.test.ts
npm test securityMeasures.property.test.ts
npm test mismatchDetection.property.test.ts
```

### Property Tests Coverage
- **OCR Extraction Consistency**: Validates deterministic extraction
- **Similarity Calculations**: Tests fuzzy matching algorithms
- **Security Measures**: Verifies encryption and access control
- **Mismatch Detection**: Validates analysis accuracy

## Error Handling

The system provides comprehensive error handling:

```typescript
import { GeminiErrorHandler, ErrorCode } from './utils/geminiErrorHandling';

try {
  const result = await geminiOCREngine.extractCACData(document);
} catch (error) {
  if (error.code === ErrorCode.API_RATE_LIMITED) {
    // Handle rate limiting
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (error.retryable) {
    // Retry the operation
    console.log('Retryable error:', error.userMessage);
  }
}
```

## Performance Considerations

- **Concurrent Processing**: Limited to 10 simultaneous documents
- **Memory Management**: Automatic cleanup of large PDF processing
- **Caching**: 24-hour TTL for verification results
- **Rate Limiting**: Configurable per-minute API limits
- **Connection Pooling**: Optimized external API connections

## Security Features

- **Encryption**: AES-256-GCM for documents at rest
- **Access Control**: Role-based permissions (user/broker/admin/super_admin)
- **PII Detection**: Automatic identification of sensitive data
- **Audit Logging**: Comprehensive event tracking
- **Secure Cleanup**: Memory overwriting and scheduled deletion
- **Data Minimization**: NDPR-compliant retention policies

## Monitoring and Alerting

- **Real-time Metrics**: Processing times, success rates, error rates
- **API Quota Monitoring**: Track usage against limits
- **Performance Alerts**: Automated notifications for issues
- **User Experience Metrics**: Form completion rates, verification success

## Deployment

1. **Install Dependencies**:
   ```bash
   npm install fast-check crypto
   ```

2. **Configure Environment**:
   Set up environment variables for API keys and encryption

3. **Initialize Services**:
   ```typescript
   import './services/geminiDocumentProcessor';
   import './services/geminiFormSubmissionController';
   ```

4. **Add UI Components**:
   Import and use DocumentUploadSection in your forms

## Support and Maintenance

- **Logs**: All operations are logged for debugging
- **Metrics**: Performance and usage statistics available
- **Configuration**: Runtime configuration updates supported
- **Scaling**: Horizontal scaling supported with session persistence

## License

This implementation follows the project's existing license terms and includes proper attribution for external dependencies.