# Gemini Document Verification - Technical Design

## Overview

The Gemini Document Verification feature integrates Google Gemini 2.5 Flash API to provide OCR-based document verification for both CAC certificates and individual documents within NFIU and KYC forms. The system extracts structured data from uploaded documents, compares it against existing verification records, and implements form submission blocking when verification fails.

### Key Capabilities

- **Multi-format Document Support**: Accepts PDF (up to 50MB/1000 pages), PNG, and JPEG files
- **Dual Verification Modes**: 
  - CAC verification with strict matching against VerifyData/DataPro systems
  - Individual document verification with flexible matching (first name, last name, DOB)
- **Form Integration**: Seamless integration with existing NFIU and KYC forms
- **Blocking Behavior**: Prevents form submission until document verification passes
- **Comprehensive Audit Trail**: Logs all verification attempts and results
- **Asynchronous Processing**: Non-blocking UI with real-time status updates

### Business Value

- **Fraud Prevention**: Automated detection of document inconsistencies
- **Compliance Enhancement**: Strengthened KYC/AML processes
- **Operational Efficiency**: Reduced manual document review workload
- **User Experience**: Clear feedback and guidance for document issues

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Form Components] --> B[Document Upload UI]
        B --> C[Verification Status Display]
        C --> D[Form Submission Controller]
    end
    
    subgraph "Service Layer"
        E[Document Processor] --> F[Gemini OCR Engine]
        E --> G[Verification Matcher]
        G --> H[VerifyData Client]
        G --> I[DataPro Client]
        E --> J[Audit Logger]
    end
    
    subgraph "External APIs"
        K[Google Gemini 2.5 Flash]
        L[VerifyData API]
        M[DataPro API]
    end
    
    subgraph "Storage Layer"
        N[Firebase Storage]
        O[Firestore Database]
        P[Audit Logs]
    end
    
    A --> E
    F --> K
    H --> L
    I --> M
    E --> N
    J --> O
    J --> P
```

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Form Component
    participant DP as Document Processor
    participant G as Gemini API
    participant VM as Verification Matcher
    participant VD as VerifyData/DataPro
    participant AL as Audit Logger
    participant FSC as Form Submission Controller
    
    U->>F: Upload Document
    F->>DP: Process Document
    DP->>AL: Log Upload Attempt
    DP->>G: Extract OCR Data
    G-->>DP: Return Structured Data
    DP->>VM: Verify Against Records
    VM->>VD: Query Official Records
    VD-->>VM: Return Verification Result
    VM->>AL: Log Verification Result
    VM-->>DP: Return Match Status
    DP-->>F: Update Verification Status
    F->>FSC: Check Submission Eligibility
    FSC-->>F: Block/Allow Submission
    F-->>U: Display Status & Feedback
```

## Components and Interfaces

### 1. Document Processor Service

**Location**: `src/services/geminiDocumentProcessor.ts`

**Responsibilities**:
- Orchestrates the complete document verification workflow
- Manages file validation and preprocessing
- Coordinates with Gemini API for OCR extraction
- Handles error recovery and retry logic

**Interface**:
```typescript
interface DocumentProcessorService {
  processDocument(file: File, verificationType: 'cac' | 'individual'): Promise<ProcessingResult>
  getProcessingStatus(processingId: string): Promise<ProcessingStatus>
  retryProcessing(processingId: string): Promise<ProcessingResult>
}

interface ProcessingResult {
  success: boolean
  processingId: string
  extractedData?: ExtractedDocumentData
  verificationResult?: VerificationResult
  error?: ProcessingError
}
```

### 2. Gemini OCR Engine

**Location**: `src/services/geminiOCREngine.ts`

**Responsibilities**:
- Interfaces with Google Gemini 2.5 Flash API
- Handles document format conversion and optimization
- Implements structured data extraction prompts
- Manages API rate limiting and error handling

**Interface**:
```typescript
interface GeminiOCREngine {
  extractCACData(document: ProcessedDocument): Promise<CACExtractionResult>
  extractIndividualData(document: ProcessedDocument): Promise<IndividualExtractionResult>
  validateApiKey(): Promise<boolean>
}

interface CACExtractionResult {
  success: boolean
  data?: {
    companyName: string
    rcNumber: string
    registrationDate: string
    companyAddress: string
    companyType: string
    directors: DirectorInfo[]
  }
  confidence: number
  error?: string
}
```

### 3. Verification Matcher

**Location**: `src/services/verificationMatcher.ts`

**Responsibilities**:
- Compares extracted data against official records
- Implements fuzzy matching algorithms with configurable thresholds
- Manages fallback between VerifyData and DataPro systems
- Provides detailed mismatch analysis

**Interface**:
```typescript
interface VerificationMatcher {
  verifyCACDocument(extractedData: CACData, formData: FormData): Promise<CACVerificationResult>
  verifyIndividualDocument(extractedData: IndividualData, formData: FormData): Promise<IndividualVerificationResult>
  calculateSimilarity(text1: string, text2: string): number
}

interface CACVerificationResult {
  matched: boolean
  confidence: number
  mismatches: FieldMismatch[]
  officialData: CACOfficialData
  blockSubmission: boolean
}
```

### 4. Form Submission Controller

**Location**: `src/services/formSubmissionController.ts`

**Responsibilities**:
- Evaluates form submission eligibility based on verification status
- Implements blocking logic for failed verifications
- Provides user-friendly error messages and guidance
- Manages submission state across form sessions

**Interface**:
```typescript
interface FormSubmissionController {
  canSubmitForm(formId: string): Promise<SubmissionEligibility>
  blockSubmission(formId: string, reason: BlockingReason): Promise<void>
  unblockSubmission(formId: string): Promise<void>
  getBlockingReasons(formId: string): Promise<BlockingReason[]>
}

interface SubmissionEligibility {
  canSubmit: boolean
  blockingReasons: BlockingReason[]
  requiredActions: RequiredAction[]
}
```

### 5. Document Upload UI Components

**Location**: `src/components/forms/DocumentUploadSection.tsx`

**Responsibilities**:
- Provides drag-and-drop file upload interface
- Displays real-time verification status
- Shows detailed mismatch information
- Guides users through document correction process

**Interface**:
```typescript
interface DocumentUploadSectionProps {
  formType: 'nfiu-individual' | 'nfiu-corporate' | 'kyc-individual' | 'kyc-corporate'
  documentType: 'cac' | 'individual'
  onVerificationComplete: (result: VerificationResult) => void
  onVerificationFailed: (error: VerificationError) => void
  required: boolean
}
```

### 6. Audit Logger Service

**Location**: `src/services/geminiAuditLogger.ts`

**Responsibilities**:
- Logs all document processing events with appropriate detail levels
- Masks sensitive information while preserving audit trail
- Implements structured logging for compliance requirements
- Manages log retention and archival policies

**Interface**:
```typescript
interface GeminiAuditLogger {
  logDocumentUpload(event: DocumentUploadEvent): Promise<void>
  logOCRProcessing(event: OCRProcessingEvent): Promise<void>
  logVerificationAttempt(event: VerificationEvent): Promise<void>
  logFormBlocking(event: FormBlockingEvent): Promise<void>
  logAPIError(event: APIErrorEvent): Promise<void>
}
```

## Data Models

### Core Data Structures

```typescript
// Document Processing Models
interface ProcessedDocument {
  id: string
  originalFile: File
  processedContent: Buffer
  metadata: DocumentMetadata
  processingTimestamp: Date
}

interface DocumentMetadata {
  fileName: string
  fileSize: number
  mimeType: string
  pageCount?: number
  processingDuration: number
}

// CAC-Specific Models
interface CACData {
  companyName: string
  rcNumber: string
  registrationDate: string
  companyAddress: string
  companyType: string
  directors: DirectorInfo[]
  companyStatus?: string
}

interface DirectorInfo {
  name: string
  position: string
  appointmentDate?: string
  nationality?: string
}

// Individual Document Models
interface IndividualData {
  firstName: string
  lastName: string
  dateOfBirth: string
  documentType?: string
  documentNumber?: string
  issuingAuthority?: string
}

// Verification Results
interface FieldMismatch {
  fieldName: string
  extractedValue: string
  expectedValue: string
  similarity: number
  threshold: number
  critical: boolean
}

interface VerificationResult {
  success: boolean
  verificationType: 'cac' | 'individual'
  confidence: number
  mismatches: FieldMismatch[]
  officialData?: any
  processingTime: number
  apiCost: number
}

// Form Integration Models
interface FormVerificationState {
  formId: string
  documentVerifications: DocumentVerification[]
  canSubmit: boolean
  blockingReasons: string[]
  lastUpdated: Date
}

interface DocumentVerification {
  documentType: string
  status: 'pending' | 'processing' | 'verified' | 'failed'
  result?: VerificationResult
  error?: string
  uploadTimestamp: Date
  verificationTimestamp?: Date
}
```

### Database Schema

```typescript
// Firestore Collections
interface DocumentProcessingRecord {
  id: string
  userId: string
  formId: string
  formType: string
  documentType: string
  fileName: string
  fileSize: number
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
  extractedData?: any
  verificationResult?: VerificationResult
  error?: string
  createdAt: Date
  updatedAt: Date
  processingDuration?: number
  apiCost: number
}

interface FormSubmissionState {
  formId: string
  userId: string
  formType: string
  verificationStatus: {
    [documentType: string]: DocumentVerification
  }
  canSubmit: boolean
  blockingReasons: string[]
  lastVerificationUpdate: Date
  createdAt: Date
  updatedAt: Date
}
```

### Configuration Models

```typescript
interface GeminiConfig {
  apiKey: string
  model: 'gemini-2.5-flash'
  maxTokens: number
  temperature: number
  timeoutMs: number
  retryAttempts: number
  rateLimitPerMinute: number
}

interface VerificationThresholds {
  cac: {
    companyNameSimilarity: number // 85%
    addressSimilarity: number     // 70%
    exactMatchFields: string[]    // ['rcNumber', 'registrationDate']
  }
  individual: {
    nameSimilarity: number        // 85%
    exactMatchFields: string[]    // ['dateOfBirth']
  }
}

interface ProcessingLimits {
  maxFileSize: {
    pdf: number    // 50MB
    image: number  // 10MB
  }
  maxPages: number // 1000
  timeoutSeconds: {
    ocr: number           // 30s for <5MB, 60s for >5MB
    verification: number  // 15s
    total: number        // 90s
  }
  concurrentProcessing: number // 10
}
```

## API Integration

### Google Gemini 2.5 Flash Integration

**Authentication**:
- API Key: `AIzaSyCaC6K3pvOiyzVzF3hsYmTovOJ-mp35-xg`
- Stored securely in environment variables with AES-256 encryption
- Key validation on service initialization

**Request Structure**:
```typescript
interface GeminiRequest {
  contents: [{
    parts: [{
      text: string // Structured prompt
      inline_data?: {
        mime_type: string
        data: string // Base64 encoded document
      }
    }]
  }]
  generationConfig: {
    temperature: 0.1
    maxOutputTokens: 2048
    responseMimeType: "application/json"
  }
}
```

**CAC Document Extraction Prompt**:
```
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
```

**Individual Document Extraction Prompt**:
```
Extract the following personal information from this document and return as JSON:
{
  "firstName": "first name as shown",
  "lastName": "last name/surname as shown", 
  "dateOfBirth": "date of birth in DD/MM/YYYY format",
  "documentType": "type of document (e.g., National ID, Passport, etc.)",
  "documentNumber": "document number if visible",
  "issuingAuthority": "issuing authority if shown"
}

If any field is not clearly visible, use null for that field.
Focus on extracting the three main fields: firstName, lastName, and dateOfBirth.
```

**Error Handling**:
- Rate limiting with exponential backoff (max 3 retries)
- Timeout handling (30s for <5MB files, 60s for larger files)
- API quota monitoring and alerting
- Graceful degradation to manual entry when API unavailable

### VerifyData/DataPro Integration

**Integration Pattern**:
- Primary: VerifyData API for CAC verification
- Fallback: DataPro API when VerifyData unavailable
- Existing client implementations in `server-services/`
- Consistent error handling and response formatting

**Verification Flow**:
1. Extract RC number from Gemini OCR result
2. Query VerifyData API with extracted RC number
3. If VerifyData fails, fallback to DataPro API
4. Compare API response with extracted document data
5. Apply similarity thresholds and exact match requirements
6. Return detailed match/mismatch analysis

## Security and Privacy

### Data Protection Measures

**Document Security**:
- AES-256 encryption for documents at rest
- HTTPS encryption for all API communications
- Automatic deletion of processed documents within 24 hours
- Access controls limiting document access to authorized users only

**API Security**:
- Secure storage of API keys using environment variables
- API key rotation support without system downtime
- Request signing and validation
- Rate limiting to prevent abuse

**Privacy Compliance**:
- NDPR compliance for data processing logs
- PII masking in audit logs (show only first 4 characters of sensitive data)
- Minimal data retention policies
- User consent tracking for document processing

**Audit Trail Security**:
- Immutable audit logs with cryptographic integrity
- Structured logging with appropriate detail levels
- 7-year retention for compliance requirements
- Administrator alerts for audit log failures

### Access Control

**Role-Based Permissions**:
- Users: Can upload and verify their own documents
- Brokers: Can view verification status for their clients
- Admins: Can view all verification attempts and audit logs
- Super Admins: Can manage API configurations and system settings

**API Access Control**:
- Service-to-service authentication for internal APIs
- Request validation and sanitization
- Input validation for all user-provided data
- SQL injection and XSS prevention

## Performance and Scalability

### Processing Optimization

**Asynchronous Architecture**:
- Non-blocking document upload and processing
- Real-time status updates via WebSocket connections
- Background job processing for heavy OCR operations
- Progress indicators for long-running operations

**Caching Strategy**:
- Document processing result caching (24-hour TTL)
- Verification result caching for identical documents
- API response caching for official records
- Client-side caching for form state

**Resource Management**:
- Concurrent processing limit: 10 documents
- Memory optimization for large PDF processing
- Automatic cleanup of temporary files
- Connection pooling for external API calls

### Scalability Considerations

**Horizontal Scaling**:
- Stateless service design for easy scaling
- Load balancing across multiple service instances
- Database connection pooling and optimization
- CDN integration for static assets

**Performance Targets**:
- Document upload: < 2 seconds for files up to 10MB
- OCR processing: < 30 seconds for files up to 5MB, < 60 seconds for larger files
- Verification matching: < 15 seconds
- Total processing time: < 90 seconds end-to-end
- 99.9% uptime availability

**Monitoring and Alerting**:
- Real-time performance metrics
- API response time monitoring
- Error rate tracking and alerting
- Resource utilization monitoring
- User experience metrics

## Error Handling and Recovery

### Error Classification

**User Errors**:
- Invalid file format or size
- Corrupted or unreadable documents
- Missing required information in documents
- Network connectivity issues

**System Errors**:
- API service unavailability
- Processing timeouts
- Database connection failures
- Storage service errors

**Integration Errors**:
- External API rate limiting
- Authentication failures
- Data format mismatches
- Network timeouts

### Recovery Strategies

**Graceful Degradation**:
- Manual data entry fallback when OCR fails
- Offline mode for form completion
- Cached data usage during API outages
- Progressive enhancement for feature availability

**Retry Logic**:
- Exponential backoff for transient failures
- Maximum retry limits to prevent infinite loops
- Circuit breaker pattern for external services
- Queue-based retry for background processing

**User Experience**:
- Clear error messages with actionable guidance
- Progress indicators during processing
- Ability to retry failed operations
- Support contact information for complex issues

### Error Monitoring

**Logging Strategy**:
- Structured logging with correlation IDs
- Error categorization and severity levels
- Performance metrics and timing data
- User journey tracking for debugging

**Alerting System**:
- Real-time alerts for critical errors
- Threshold-based alerts for error rates
- Integration with monitoring tools
- Escalation procedures for service outages

## Testing Strategy

### Testing Approach

The testing strategy employs a dual approach combining unit tests for specific scenarios and property-based tests for comprehensive input coverage:

**Unit Testing Focus**:
- Specific document format examples
- Edge cases and error conditions
- Integration points between components
- API response handling scenarios

**Property-Based Testing Focus**:
- Universal properties across all document types
- Comprehensive input validation
- Data transformation correctness
- System behavior under various conditions

**Testing Configuration**:
- Minimum 100 iterations per property test
- Each property test references its design document property
- Structured test organization by component and functionality
- Automated test execution in CI/CD pipeline

### Test Categories

**Document Processing Tests**:
- File format validation and conversion
- OCR extraction accuracy and consistency
- Error handling for corrupted files
- Performance under various file sizes

**Verification Logic Tests**:
- Field matching algorithms and thresholds
- Similarity calculation accuracy
- Fallback mechanism between APIs
- Data normalization consistency

**Integration Tests**:
- End-to-end document verification workflow
- Form submission blocking behavior
- Real-time status update functionality
- External API integration reliability

**Security Tests**:
- Input validation and sanitization
- Access control enforcement
- Data encryption and privacy protection
- Audit trail integrity and completeness

### Mock and Test Data

**Mock Services**:
- Gemini API mock with realistic response patterns
- VerifyData/DataPro API mocks with various scenarios
- File system mocks for document storage testing
- Database mocks for state management testing

**Test Document Library**:
- Valid CAC certificates in multiple formats
- Individual identity documents (anonymized)
- Corrupted and invalid file samples
- Edge case documents with missing information
