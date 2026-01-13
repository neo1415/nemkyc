/**
 * Identity Collection System Types
 * 
 * This module contains all TypeScript interfaces for the Identity Collection System
 * which enables NEM Insurance to collect missing NIN/CAC information from legacy customers.
 * 
 * Key design: Dynamic schema support - accepts any CSV/Excel structure and preserves
 * all original columns while adding verification tracking.
 */

// ========== Status Enums ==========

/**
 * Status of an identity entry
 */
export type EntryStatus = 
  | 'pending'        // Entry created, no link sent yet
  | 'link_sent'      // Verification link sent via email
  | 'verified'       // Identity verified successfully
  | 'failed'         // Verification failed after max attempts
  | 'email_failed';  // Email sending failed

/**
 * Type of identity verification requested
 */
export type VerificationType = 'NIN' | 'CAC';

/**
 * Type of activity log action
 */
export type ActivityAction = 
  | 'list_created'
  | 'list_deleted'
  | 'links_sent'
  | 'link_resent'
  | 'verification_success'
  | 'verification_failed'
  | 'export_generated';

/**
 * Type of actor performing an action
 */
export type ActorType = 'admin' | 'customer' | 'system';

// ========== Firestore Document Interfaces ==========

/**
 * Identity list document stored in Firestore
 * Collection: identity-lists
 * 
 * Represents an uploaded file converted to a customer list.
 * Preserves the original schema (column names) for dynamic table display.
 */
export interface IdentityList {
  id: string;
  name: string;                  // Admin-provided name for the list
  
  // Schema info (preserves original file structure)
  columns: string[];             // Original column names in order
  emailColumn: string;           // Which column contains email addresses
  nameColumns?: NameColumns;     // Auto-detected name columns
  policyColumn?: string;         // Auto-detected policy number column
  
  // Statistics
  totalEntries: number;
  verifiedCount: number;
  pendingCount: number;
  failedCount: number;
  linkSentCount: number;
  
  // Metadata
  createdBy: string;             // Admin UID
  createdAt: Date;
  updatedAt: Date;
  originalFileName: string;
}

/**
 * Identity entry document stored in Firestore
 * Collection: identity-entries
 * 
 * Represents a single row from the uploaded file.
 * The `data` field contains ALL original columns dynamically.
 */
export interface IdentityEntry {
  id: string;
  listId: string;                // Reference to parent list
  
  // Original data (dynamic - all columns from uploaded file)
  data: Record<string, any>;     // { "Column A": "value", "Column B": "value", ... }
  
  // Extracted fields
  email: string;                 // From the detected/selected email column
  displayName?: string;          // Combined name from name columns
  policyNumber?: string;         // Extracted policy number if available
  
  // Verification tracking
  verificationType?: VerificationType;
  status: EntryStatus;
  
  // Token for verification link
  token?: string;
  tokenExpiresAt?: Date;
  
  // Verification results (appended data)
  nin?: string;                  // Verified NIN (11 digits)
  cac?: string;                  // Verified CAC/RC number
  cacCompanyName?: string;       // Verified company name for CAC
  verifiedAt?: Date;
  
  // Tracking
  linkSentAt?: Date;
  resendCount: number;
  verificationAttempts: number;
  lastAttemptAt?: Date;
  lastAttemptError?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Activity log entry document stored in Firestore
 * Collection: identity-logs
 */
export interface ActivityLog {
  id: string;
  listId: string;
  entryId?: string;              // Optional - for entry-specific actions
  
  action: ActivityAction;
  
  details: {
    // Common fields
    count?: number;              // For bulk actions (e.g., "sent 50 emails")
    email?: string;              // For individual actions
    error?: string;              // For failures
    verificationType?: VerificationType;
    
    // List creation fields
    name?: string;               // List name
    entryCount?: number;         // Number of entries
    columns?: string[];          // Column names
    emailColumn?: string;        // Email column name
    originalFileName?: string;   // Original file name
    createdBy?: string;          // Admin email who created
    
    // List deletion fields
    entriesDeleted?: number;     // Number of entries deleted
    deletedBy?: string;          // Admin email who deleted
    
    // Links sent fields
    totalSelected?: number;      // Total entries selected
    sent?: number;               // Successfully sent count
    failed?: number;             // Failed count
    sentBy?: string;             // Admin email who sent
    
    // Resend fields
    resendCount?: number;        // Number of times resent
    resentBy?: string;           // Admin email who resent
    
    // Export fields
    exportedBy?: string;         // Admin email who exported
    filename?: string;           // Export filename
    
    // Verification fields
    attemptsRemaining?: number;  // Remaining verification attempts
  };
  
  actorType: ActorType;
  actorId?: string;              // Admin UID or customer IP
  
  timestamp: Date;
  ipAddress?: string;
}

// ========== Frontend/API Interfaces ==========

/**
 * Summary view of a list for the dashboard
 */
export interface ListSummary {
  id: string;
  name: string;
  totalEntries: number;
  verifiedCount: number;
  pendingCount: number;
  failedCount: number;
  linkSentCount: number;
  progress: number;              // Percentage (0-100)
  createdAt: Date;
  originalFileName: string;
}

/**
 * Full list details including schema
 */
export interface ListDetails extends IdentityList {
  // Inherited from IdentityList
}

/**
 * Public entry info returned to customers via token validation
 */
export interface PublicEntryInfo {
  name?: string;                 // Extracted from data if available
  policyNumber?: string;         // Extracted from data if available
  verificationType: VerificationType;
  expiresAt: Date;
}

/**
 * Result of file parsing
 */
export interface FileParseResult {
  columns: string[];             // All column names in order
  rows: Record<string, any>[];   // All rows with original data
  detectedEmailColumn: string | null;  // Auto-detected email column or null
  detectedNameColumns?: NameColumns;   // Auto-detected name columns
  detectedPolicyColumn?: string | null; // Auto-detected policy column
  detectedFileType?: FileType;   // Auto-detected file type (corporate/individual)
  totalRows: number;
}

/**
 * Auto-detected name columns from file parsing
 * Used to build displayName for each entry
 */
export interface NameColumns {
  firstName?: string;            // Column name for first name
  middleName?: string;           // Column name for middle name
  lastName?: string;             // Column name for last name
  fullName?: string;             // Column name for full/combined name
  insured?: string;              // Column name for insured name
  companyName?: string;          // Column name for company/corporate name
}

/**
 * File type detection result
 * Corporate files have company names, directors, etc.
 * Individual files have first/last names
 */
export type FileType = 'corporate' | 'individual' | 'unknown';

// ========== API Request/Response Types ==========

/**
 * Request body for creating a new list
 */
export interface CreateListRequest {
  name: string;
  columns: string[];
  emailColumn: string;
  entries: Record<string, any>[];
  originalFileName: string;
}

/**
 * Response from list creation
 */
export interface CreateListResponse {
  listId: string;
  entryCount: number;
}

/**
 * Query parameters for listing entries
 */
export interface ListEntriesQuery {
  status?: EntryStatus;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Response from listing entries
 */
export interface ListEntriesResponse {
  entries: IdentityEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Request body for sending verification links
 */
export interface SendLinksRequest {
  entryIds: string[];
  verificationType: VerificationType;
}

/**
 * Response from sending verification links
 */
export interface SendLinksResponse {
  sent: number;
  failed: number;
  errors: SendError[];
}

/**
 * Error details for failed email sends
 */
export interface SendError {
  entryId: string;
  email: string;
  error: string;
}

/**
 * Response from resending a verification link
 */
export interface ResendLinkResponse {
  success: boolean;
  newExpiresAt: Date;
  resendCount: number;
  warning?: string;              // Warning if resendCount > 3
}

/**
 * Response from token validation
 */
export interface TokenValidationResponse {
  valid: boolean;
  entryInfo?: PublicEntryInfo;
  expired?: boolean;
  used?: boolean;
}

/**
 * Request body for verification submission
 */
export interface VerificationSubmitRequest {
  identityNumber: string;
  companyName?: string;          // Required for CAC verification
}

/**
 * Response from verification submission
 */
export interface VerificationSubmitResponse {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
}

/**
 * Query parameters for activity logs
 */
export interface ListActivityQuery {
  action?: ActivityAction;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Response from listing activity logs
 */
export interface ListActivityResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========== Email Template Types ==========

/**
 * Data for verification email template (new Identity Collection System)
 */
export interface VerificationEmailData {
  recipientName?: string;        // From entry data if available
  verificationUrl: string;
  expirationDate: string;
  verificationType: VerificationType;
}

/**
 * Data for legacy remediation email template
 * Used by the original remediation system with policy/broker info
 */
export interface LegacyVerificationEmailData {
  customerName: string;
  policyNumber: string;
  brokerName: string;
  verificationUrl: string;
  expirationDate: string;
}

// ========== Legacy Type Aliases (for backward compatibility) ==========
// These can be removed once all code is migrated

export type RemediationBatchStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type RemediationRecordStatus = EntryStatus | 'link_expired' | 'review_required' | 'approved' | 'rejected';
export type IdentityType = 'individual' | 'corporate';

export interface RemediationBatch extends Omit<IdentityList, 'columns' | 'emailColumn'> {
  status: RemediationBatchStatus;
  description?: string;
  expirationDays: number;
  totalRecords: number;
  pendingCount: number;
  emailSentCount: number;
  verifiedCount: number;
  failedCount: number;
  reviewRequiredCount: number;
}

export interface RemediationRecord extends Omit<IdentityEntry, 'data' | 'nin' | 'cac' | 'cacCompanyName'> {
  batchId: string;
  customerName: string;
  phone?: string;
  policyNumber: string;
  brokerName: string;
  identityType: IdentityType;
  existingName?: string;
  existingDob?: string;
  tokenUsedAt?: Date;
  emailSentAt?: Date;
  emailError?: string;
  submittedIdentityNumber?: string;
  submittedCompanyName?: string;
  verificationResponse?: Record<string, unknown>;
  nameMatchScore?: number;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComment?: string;
}

export interface BatchSummary extends ListSummary {
  status: RemediationBatchStatus;
}

export interface PublicRecordInfo extends PublicEntryInfo {
  customerName: string;
  policyNumber: string;
  brokerName: string;
  identityType: IdentityType;
}
