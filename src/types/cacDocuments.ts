/**
 * CAC Document Upload Management - Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the CAC document
 * upload and management system. These types support the three mandatory CAC
 * documents required for corporate clients.
 */

/**
 * Enum for the three required CAC document types
 */
export enum CACDocumentType {
  CERTIFICATE_OF_INCORPORATION = 'certificate_of_incorporation',
  PARTICULARS_OF_DIRECTORS = 'particulars_of_directors',
  SHARE_ALLOTMENT = 'share_allotment'
}

/**
 * Document status indicating upload state
 */
export enum DocumentStatus {
  UPLOADED = 'uploaded',
  MISSING = 'missing',
  PENDING = 'pending',
  FAILED = 'failed'
}

/**
 * Upload progress state for tracking file uploads
 */
export interface UploadProgressState {
  /** Current upload progress percentage (0-100) */
  progress: number;
  /** Whether upload is currently in progress */
  isUploading: boolean;
  /** Error message if upload failed */
  error: string | null;
  /** Whether upload completed successfully */
  isComplete: boolean;
  /** Whether upload was cancelled */
  isCancelled: boolean;
}

/**
 * Encryption metadata stored with each document
 */
export interface EncryptionMetadata {
  /** Encryption algorithm used (e.g., 'AES-256-GCM') */
  algorithm: string;
  /** Key version for key rotation support */
  keyVersion: string;
  /** Initialization vector (IV) used for encryption */
  iv: string;
  /** Authentication tag for GCM mode */
  authTag: string;
}

/**
 * Complete metadata for a CAC document
 */
export interface CACDocumentMetadata {
  /** Unique document identifier */
  id: string;
  /** Type of CAC document */
  documentType: CACDocumentType;
  /** Original filename */
  filename: string;
  /** File size in bytes */
  fileSize: number;
  /** MIME type (e.g., 'application/pdf', 'image/jpeg') */
  mimeType: string;
  /** Upload timestamp */
  uploadedAt: Date;
  /** User ID of uploader */
  uploaderId: string;
  /** Associated identity record ID */
  identityRecordId: string;
  /** Firebase Storage path */
  storagePath: string;
  /** Encryption metadata */
  encryptionMetadata: EncryptionMetadata;
  /** Current document status */
  status: DocumentStatus;
  /** Version number (for document replacement) */
  version: number;
  /** Whether this is the current version */
  isCurrent: boolean;
}

/**
 * Document version history entry
 */
export interface DocumentVersionHistory {
  /** Version number */
  version: number;
  /** Document metadata for this version */
  metadata: CACDocumentMetadata;
  /** Timestamp when this version was created */
  createdAt: Date;
  /** User ID who created this version */
  createdBy: string;
  /** Reason for replacement (if applicable) */
  replacementReason?: string;
  /** Previous version number (if this is a replacement) */
  previousVersion?: number;
}

/**
 * Complete document record including version history
 */
export interface CACDocumentRecord {
  /** Current document metadata */
  current: CACDocumentMetadata;
  /** Version history */
  versions: DocumentVersionHistory[];
  /** Total number of versions */
  versionCount: number;
}

/**
 * Document upload request
 */
export interface DocumentUploadRequest {
  /** File to upload */
  file: File;
  /** Document type */
  documentType: CACDocumentType;
  /** Identity record ID */
  identityRecordId: string;
  /** Whether this is a replacement */
  isReplacement: boolean;
  /** Replacement reason (if applicable) */
  replacementReason?: string;
}

/**
 * Document upload response
 */
export interface DocumentUploadResponse {
  /** Whether upload was successful */
  success: boolean;
  /** Document metadata (if successful) */
  metadata?: CACDocumentMetadata;
  /** Error message (if failed) */
  error?: string;
  /** Error code for programmatic handling */
  errorCode?: string;
}

/**
 * Document download request
 */
export interface DocumentDownloadRequest {
  /** Document ID */
  documentId: string;
  /** Whether to download a specific version */
  version?: number;
}

/**
 * Document preview request
 */
export interface DocumentPreviewRequest {
  /** Document ID */
  documentId: string;
  /** Whether to load thumbnail only */
  thumbnailOnly?: boolean;
  /** Whether to use cached version */
  useCache?: boolean;
}

/**
 * Document status summary for an identity record
 */
export interface DocumentStatusSummary {
  /** Identity record ID */
  identityRecordId: string;
  /** Certificate of Incorporation status */
  certificateOfIncorporation: DocumentStatus;
  /** Particulars of Directors status */
  particularsOfDirectors: DocumentStatus;
  /** Share Allotment status */
  shareAllotment: DocumentStatus;
  /** Upload timestamps for each document type */
  uploadTimestamps: {
    [key in CACDocumentType]?: Date;
  };
  /** Whether all required documents are uploaded */
  isComplete: boolean;
}

/**
 * File validation result
 */
export interface FileValidationResult {
  /** Whether file is valid */
  isValid: boolean;
  /** Validation error message (if invalid) */
  error?: string;
  /** Validation error code */
  errorCode?: string;
  /** Validated file metadata */
  metadata?: {
    filename: string;
    fileSize: number;
    mimeType: string;
  };
}

/**
 * Chunked upload state for large files
 */
export interface ChunkedUploadState {
  /** Upload session ID */
  sessionId: string;
  /** Total file size */
  totalSize: number;
  /** Chunk size in bytes */
  chunkSize: number;
  /** Number of chunks uploaded */
  chunksUploaded: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Upload progress percentage */
  progress: number;
  /** Whether upload can be resumed */
  isResumable: boolean;
}

/**
 * Document access audit log entry
 */
export interface DocumentAccessAuditLog {
  /** Log entry ID */
  id: string;
  /** Document ID */
  documentId: string;
  /** User ID who accessed the document */
  userId: string;
  /** Action performed (view, download, upload, replace, delete) */
  action: 'view' | 'download' | 'upload' | 'replace' | 'delete';
  /** Timestamp of action */
  timestamp: Date;
  /** Whether action was successful */
  success: boolean;
  /** Error message (if action failed) */
  error?: string;
  /** Additional context */
  metadata?: Record<string, any>;
}
