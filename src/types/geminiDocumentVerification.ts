// Core types for Gemini Document Verification system

export interface ProcessedDocument {
  id: string;
  originalFile: File;
  processedContent: Uint8Array;
  metadata: DocumentMetadata;
  processingTimestamp: Date;
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  pageCount?: number;
  processingDuration: number;
}

// CAC-Specific Models
export interface CACData {
  companyName: string;
  rcNumber: string;
  registrationDate: string;
  address: string;
  companyType?: string;
  directors?: string[];
  companyStatus?: string;
}

export interface DirectorInfo {
  name: string;
  position: string;
  appointmentDate?: string;
  nationality?: string;
}

// Individual Document Models
export interface IndividualData {
  fullName: string;
  dateOfBirth?: string; // Made optional since not all documents have DOB
  nin?: string;
  bvn?: string;
  gender?: string;
  documentType?: string;
  documentNumber?: string;
  issuingAuthority?: string;
}

// Verification Results
export interface FieldMismatch {
  field: string;
  extractedValue: string;
  expectedValue: string;
  similarity: number;
  isCritical: boolean;
  reason: string;
}

export type MismatchCategory = 
  | 'name_variation'
  | 'address_variation' 
  | 'date_mismatch'
  | 'id_mismatch'
  | 'director_mismatch'
  | 'abbreviation'
  | 'spelling_variation'
  | 'format_difference';

export interface MismatchAnalysis {
  totalMismatches: number;
  criticalMismatches: number;
  majorMismatches: number;
  minorMismatches: number;
  overallSeverity: 'critical' | 'major' | 'minor';
  confidence: number;
  fieldAnalyses: any[];
  summary: string;
  recommendations: string[];
  canProceed: boolean;
  requiresManualReview: boolean;
}

export interface SimilarityScore {
  score: number;
  method: string;
}

export interface VerificationResult {
  success: boolean;
  isMatch: boolean;
  confidence: number;
  mismatches: FieldMismatch[];
  officialData?: any;
  processingTime: number;
  error?: string; // Optional error message for failed verifications
}

// Form Integration Models
export interface FormVerificationState {
  formId: string;
  documentVerifications: DocumentVerification[];
  canSubmit: boolean;
  blockingReasons: string[];
  lastUpdated: Date;
}

export interface DocumentVerification {
  documentType: string;
  status: 'pending' | 'processing' | 'verified' | 'failed';
  result?: VerificationResult;
  error?: string;
  uploadTimestamp: Date;
  verificationTimestamp?: Date;
}

// Processing Results
export interface ProcessingResult {
  success: boolean;
  processingId: string;
  extractedData?: ExtractedDocumentData;
  verificationResult?: VerificationResult;
  error?: ProcessingError;
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  MANUAL_ENTRY_REQUIRED = 'manual_entry_required',
  OFFLINE_MODE = 'offline_mode',
  RETRYING = 'retrying',
  DEGRADED = 'degraded'
}

export interface ProcessingStatusInfo {
  id: string;
  status: ProcessingStatus;
  progress: number;
  message?: string;
  startTime: Date;
  endTime?: Date;
}

export interface ProcessingError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

export type ExtractedDocumentData = CACData | IndividualData;

// Main verification result interface
export interface DocumentVerificationResult {
  documentId: string;
  success: boolean;
  processingStatus: ProcessingStatus;
  extractedData: ExtractedDocumentData | null;
  verificationResult: VerificationResult | null;
  confidence: number;
  processingTime: number;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
    userGuidance?: string;
  };
  metadata?: {
    [key: string]: any;
  };
}

// OCR Results
export interface CACExtractionResult {
  success: boolean;
  data?: CACData;
  confidence: number;
  error?: string;
}

export interface IndividualExtractionResult {
  success: boolean;
  data?: IndividualData;
  confidence: number;
  error?: string;
}

// Verification Results
export interface CACVerificationResult {
  matched: boolean;
  confidence: number;
  mismatches: FieldMismatch[];
  officialData: CACOfficialData;
  blockSubmission: boolean;
}

export interface IndividualVerificationResult {
  matched: boolean;
  confidence: number;
  mismatches: FieldMismatch[];
  blockSubmission: boolean;
}

export interface CACOfficialData {
  companyName: string;
  rcNumber: string;
  registrationDate: string;
  companyAddress: string;
  companyType: string;
  directors: DirectorInfo[];
  companyStatus: string;
}

// Form Submission
export interface SubmissionEligibility {
  canSubmit: boolean;
  blockingReasons: BlockingReason[];
  requiredActions: RequiredAction[];
}

export interface BlockingReason {
  type: 'verification_failed' | 'document_missing' | 'processing_error';
  message: string;
  documentType?: string;
  field?: string;
}

export interface RequiredAction {
  type: 'upload_document' | 'fix_mismatch' | 'retry_processing';
  message: string;
  documentType?: string;
}

// Database Models
export interface DocumentProcessingRecord {
  id: string;
  userId: string;
  formId: string;
  formType: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  extractedData?: any;
  verificationResult?: VerificationResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  processingDuration?: number;
  apiCost: number;
}

export interface FormSubmissionState {
  formId: string;
  userId: string;
  formType: string;
  verificationStatus: {
    [documentType: string]: DocumentVerification;
  };
  canSubmit: boolean;
  blockingReasons: string[];
  lastVerificationUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Events
export interface DocumentUploadEvent {
  userId: string;
  formId: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  timestamp: Date;
}

export interface OCRProcessingEvent {
  processingId: string;
  userId: string;
  documentType: string;
  success: boolean;
  extractedFields: string[];
  confidence: number;
  processingTime: number;
  apiCost: number;
  timestamp: Date;
}

export interface VerificationEvent {
  processingId: string;
  userId: string;
  verificationType: 'cac' | 'individual';
  success: boolean;
  mismatches: FieldMismatch[];
  apiProvider: 'verifydata' | 'datapro' | 'gemini';
  timestamp: Date;
}

export interface FormBlockingEvent {
  formId: string;
  userId: string;
  reason: string;
  documentType: string;
  timestamp: Date;
}

export interface APIErrorEvent {
  service: 'gemini' | 'verifydata' | 'datapro';
  error: string;
  retryAttempt: number;
  timestamp: Date;
}