# Design Document: KYC Identity Data Consolidation

## Overview

The KYC Identity Data Consolidation system merges encrypted NIN/CAC identity data from the `identity-entries` collection into existing KYC/CDD/Claims form records across multiple Firestore collections. The system addresses a historical data fragmentation issue where identity verification was implemented after initial form submissions, resulting in two separate data sources that need to be unified.

The consolidation process operates as a backend service with an admin web interface, using a multi-stage matching algorithm to identify corresponding records across databases. All operations maintain encryption throughout, provide comprehensive audit trails, and support dry-run preview mode to ensure safe execution.

### Key Design Principles

1. **Security First**: Never decrypt sensitive data during transfer; maintain AES-256-GCM encryption end-to-end
2. **Idempotency**: Support multiple executions without data duplication or corruption
3. **Auditability**: Log every operation for compliance and debugging
4. **Safety**: Provide dry-run mode and validation before making changes
5. **Performance**: Use batch operations and rate limiting for efficient large-scale processing

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Web Interface                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Consolidation│  │   Progress   │  │  Report Viewer   │  │
│  │   Controls   │  │   Monitor    │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS/Firebase Auth
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Consolidation Service                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Consolidation Orchestrator                  │  │
│  │  - Job management                                     │  │
│  │  - Progress tracking                                  │  │
│  │  - Error handling                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                                │
│     ┌───────────────────────┼───────────────────────┐       │
│     ▼                       ▼                       ▼       │
│  ┌─────────┐         ┌──────────┐          ┌──────────┐    │
│  │Matching │         │  Data    │          │  Audit   │    │
│  │ Engine  │────────▶│Consolidator│────────▶│  Logger  │    │
│  └─────────┘         └──────────┘          └──────────┘    │
│                             │                                │
└─────────────────────────────┼────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firestore Database                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  identity-   │  │  KYC/CDD/    │  │  consolidation-  │  │
│  │   entries    │  │   Claims     │  │   audit-logs     │  │
│  │  (source)    │  │ (targets)    │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Initiation**: Admin triggers consolidation via web interface with selected collections and dry-run flag
2. **Matching**: Matching Engine queries identity-entries and target collections, applying matching algorithms
3. **Validation**: Data Consolidator validates encrypted data structure and checks for existing values
4. **Update/Preview**: In live mode, writes to Firestore; in dry-run mode, generates preview report
5. **Audit**: Audit Logger records all operations to consolidation-audit-logs collection
6. **Reporting**: Consolidation Orchestrator generates summary report and returns to admin interface

## Components and Interfaces

### 1. Consolidation Orchestrator

**Responsibility**: Manages the overall consolidation workflow, coordinates components, tracks progress.

**Interface**:
```typescript
interface ConsolidationOrchestrator {
  /**
   * Start a consolidation job
   * @param config - Job configuration including collections and dry-run flag
   * @param adminUser - User initiating the operation
   * @returns Job ID for tracking
   */
  startConsolidation(
    config: ConsolidationConfig,
    adminUser: AdminUser
  ): Promise<string>;

  /**
   * Get current status of a consolidation job
   * @param jobId - Job identifier
   * @returns Current progress and status
   */
  getJobStatus(jobId: string): Promise<JobStatus>;

  /**
   * Pause a running consolidation job
   * @param jobId - Job identifier
   */
  pauseJob(jobId: string): Promise<void>;

  /**
   * Resume a paused consolidation job
   * @param jobId - Job identifier
   */
  resumeJob(jobId: string): Promise<void>;

  /**
   * Get final report for a completed job
   * @param jobId - Job identifier
   * @returns Consolidation report with statistics
   */
  getJobReport(jobId: string): Promise<ConsolidationReport>;
}

interface ConsolidationConfig {
  collections: string[];        // Target collections to process
  dryRun: boolean;              // Preview mode flag
  batchSize: number;            // Records per batch (default 500)
  matchingStrategies: string[]; // Enabled matching strategies
}

interface JobStatus {
  jobId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: {
    totalRecords: number;
    processedRecords: number;
    matchedRecords: number;
    updatedRecords: number;
    skippedRecords: number;
    failedRecords: number;
  };
  startTime: Date;
  estimatedCompletion?: Date;
  currentCollection?: string;
}
```

**Implementation Notes**:
- Store job state in Firestore `consolidation-jobs` collection for persistence
- Use Firestore transactions to update job status atomically
- Implement progress calculation based on total records vs processed records
- Support resumption by storing last processed document ID per collection

### 2. Matching Engine

**Responsibility**: Identifies corresponding Identity_Entry and Form_Record pairs using multiple matching strategies.

**Interface**:
```typescript
interface MatchingEngine {
  /**
   * Find matching form records for an identity entry
   * @param identityEntry - Source identity data
   * @param targetCollections - Collections to search
   * @returns Array of matched form records with match metadata
   */
  findMatches(
    identityEntry: IdentityEntry,
    targetCollections: string[]
  ): Promise<MatchResult[]>;

  /**
   * Normalize and prepare matching fields
   * @param value - Raw field value
   * @returns Normalized value for comparison
   */
  normalizeField(value: string): string;
}

interface MatchResult {
  formRecord: FormRecord;
  collection: string;
  matchStrategy: 'email' | 'name-dob' | 'policy-number';
  confidence: number; // 0-1 score
  metadata: {
    identityEmail: string;
    formEmail?: string;
    matchedFields: string[];
  };
}
```

**Matching Algorithm**:

```
function findMatches(identityEntry, targetCollections):
  matches = []
  
  // Strategy 1: Email matching (highest confidence)
  normalizedEmail = normalizeField(identityEntry.email)
  for each collection in targetCollections:
    query = collection.where('submittedBy', '==', normalizedEmail)
    results = await query.get()
    for each doc in results:
      matches.push({
        formRecord: doc,
        collection: collection,
        matchStrategy: 'email',
        confidence: 1.0
      })
  
  // Strategy 2: Name + DOB matching (medium confidence)
  if matches.isEmpty() and identityEntry.displayName and identityEntry.dateOfBirth:
    normalizedName = normalizeField(identityEntry.displayName)
    for each collection in targetCollections:
      query = collection
        .where('displayName', '==', normalizedName)
        .where('dateOfBirth', '==', identityEntry.dateOfBirth)
      results = await query.get()
      for each doc in results:
        matches.push({
          formRecord: doc,
          collection: collection,
          matchStrategy: 'name-dob',
          confidence: 0.8
        })
  
  // Strategy 3: Policy number matching (medium confidence)
  if matches.isEmpty() and identityEntry.policyNumber:
    for each collection in targetCollections:
      query = collection.where('policyNumber', '==', identityEntry.policyNumber)
      results = await query.get()
      for each doc in results:
        matches.push({
          formRecord: doc,
          collection: collection,
          matchStrategy: 'policy-number',
          confidence: 0.7
        })
  
  return matches
```

**Normalization Rules**:
- Convert emails to lowercase
- Trim leading/trailing whitespace
- Remove multiple consecutive spaces
- Handle null/undefined as empty string

### 3. Data Consolidator

**Responsibility**: Validates and transfers encrypted identity data to form records.

**Interface**:
```typescript
interface DataConsolidator {
  /**
   * Consolidate identity data into a form record
   * @param identityEntry - Source identity data
   * @param formRecord - Target form record
   * @param dryRun - Preview mode flag
   * @returns Consolidation result
   */
  consolidateRecord(
    identityEntry: IdentityEntry,
    formRecord: FormRecord,
    dryRun: boolean
  ): Promise<ConsolidationResult>;

  /**
   * Validate encrypted data structure
   * @param encryptedData - Data to validate
   * @returns True if valid
   */
  validateEncryptedData(encryptedData: EncryptedField): boolean;

  /**
   * Check if form record already has identity data
   * @param formRecord - Record to check
   * @returns Object indicating which fields exist
   */
  checkExistingData(formRecord: FormRecord): ExistingDataCheck;
}

interface ConsolidationResult {
  success: boolean;
  fieldsUpdated: string[];
  fieldsSkipped: string[];
  errors: string[];
  preview?: {
    before: Partial<FormRecord>;
    after: Partial<FormRecord>;
  };
}

interface ExistingDataCheck {
  hasNIN: boolean;
  hasCAC: boolean;
  hasBVN: boolean;
}
```

**Consolidation Algorithm**:

```
function consolidateRecord(identityEntry, formRecord, dryRun):
  result = {
    success: true,
    fieldsUpdated: [],
    fieldsSkipped: [],
    errors: []
  }
  
  // Check existing data
  existing = checkExistingData(formRecord)
  
  // Prepare updates
  updates = {}
  
  // Handle NIN
  if identityEntry.nin:
    if not validateEncryptedData(identityEntry.nin):
      result.errors.push('Invalid NIN encryption structure')
    else if existing.hasNIN:
      result.fieldsSkipped.push('nin')
    else:
      updates.nin = identityEntry.nin
      result.fieldsUpdated.push('nin')
  
  // Handle CAC
  if identityEntry.cac:
    if not validateEncryptedData(identityEntry.cac):
      result.errors.push('Invalid CAC encryption structure')
    else if existing.hasCAC:
      result.fieldsSkipped.push('cac')
    else:
      updates.cac = identityEntry.cac
      result.fieldsUpdated.push('cac')
  
  // Handle BVN
  if identityEntry.bvn:
    if not validateEncryptedData(identityEntry.bvn):
      result.errors.push('Invalid BVN encryption structure')
    else if existing.hasBVN:
      result.fieldsSkipped.push('bvn')
    else:
      updates.bvn = identityEntry.bvn
      result.fieldsUpdated.push('bvn')
  
  // Add metadata
  updates.consolidatedAt = new Date()
  updates.consolidatedFrom = identityEntry.id
  
  // Apply updates or generate preview
  if dryRun:
    result.preview = {
      before: extractFields(formRecord, Object.keys(updates)),
      after: { ...formRecord, ...updates }
    }
  else if not isEmpty(updates):
    try:
      await formRecord.ref.update(updates)
    catch error:
      result.success = false
      result.errors.push(error.message)
  
  return result
```

**Validation Rules**:
- Encrypted field must be an object with `encrypted` and `iv` properties
- Both `encrypted` and `iv` must be non-empty strings
- Both must be valid base64 encoded strings
- Identity entry status must be "verified"

### 4. Audit Logger

**Responsibility**: Records all consolidation operations for compliance and debugging.

**Interface**:
```typescript
interface AuditLogger {
  /**
   * Log a consolidation operation
   * @param entry - Audit log entry
   */
  logOperation(entry: AuditLogEntry): Promise<void>;

  /**
   * Log a batch of operations efficiently
   * @param entries - Array of audit log entries
   */
  logBatch(entries: AuditLogEntry[]): Promise<void>;

  /**
   * Query audit logs for a job
   * @param jobId - Job identifier
   * @returns Array of audit log entries
   */
  getJobLogs(jobId: string): Promise<AuditLogEntry[]>;
}

interface AuditLogEntry {
  jobId: string;
  timestamp: Date;
  operation: 'match' | 'update' | 'skip' | 'error';
  adminUser: {
    uid: string;
    email: string;
  };
  identityEntry: {
    id: string;
    email: string;
  };
  formRecord?: {
    id: string;
    collection: string;
  };
  matchStrategy?: string;
  fieldsUpdated?: string[];
  fieldsSkipped?: string[];
  error?: string;
  dryRun: boolean;
}
```

**Storage Strategy**:
- Store in `consolidation-audit-logs` collection
- Index on `jobId` for efficient querying
- Index on `timestamp` for chronological retrieval
- Partition large jobs into sub-collections if needed
- Retain logs for minimum 2 years for compliance

### 5. Admin Interface Components

**ConsolidationControlPanel**:
```typescript
interface ConsolidationControlPanel {
  // State
  selectedCollections: string[];
  dryRunEnabled: boolean;
  jobStatus: JobStatus | null;
  
  // Actions
  onStartConsolidation(): void;
  onPauseJob(): void;
  onResumeJob(): void;
  onViewReport(): void;
}
```

**ProgressMonitor**:
```typescript
interface ProgressMonitor {
  jobStatus: JobStatus;
  refreshInterval: number; // milliseconds
  
  // Display elements
  progressBar: number; // 0-100
  recordsProcessed: string;
  estimatedTimeRemaining: string;
  currentCollection: string;
}
```

**ReportViewer**:
```typescript
interface ReportViewer {
  report: ConsolidationReport;
  
  // Actions
  onDownloadCSV(): void;
  onDownloadJSON(): void;
  onViewDetails(section: string): void;
}
```

## Data Models

### Identity Entry (Source)

```typescript
interface IdentityEntry {
  id: string;
  email: string;
  displayName?: string;
  dateOfBirth?: string;
  policyNumber?: string;
  nin?: EncryptedField;
  cac?: EncryptedField;
  bvn?: EncryptedField;
  status: 'pending' | 'verified' | 'failed';
  createdAt: Date;
  verifiedAt?: Date;
}
```

### Form Record (Target)

```typescript
interface FormRecord {
  id: string;
  submittedBy: string; // email
  submittedAt: Date;
  status: string;
  ticketId?: string;
  formType: string;
  displayName?: string;
  dateOfBirth?: string;
  policyNumber?: string;
  
  // Fields to be added by consolidation
  nin?: EncryptedField;
  cac?: EncryptedField;
  bvn?: EncryptedField;
  consolidatedAt?: Date;
  consolidatedFrom?: string; // identity entry ID
  
  // Collection-specific fields
  [key: string]: any;
}
```

### Encrypted Field

```typescript
interface EncryptedField {
  encrypted: string; // base64 encoded ciphertext
  iv: string;        // base64 encoded initialization vector
}
```

### Consolidation Job

```typescript
interface ConsolidationJob {
  id: string;
  config: ConsolidationConfig;
  adminUser: {
    uid: string;
    email: string;
  };
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: {
    totalRecords: number;
    processedRecords: number;
    matchedRecords: number;
    updatedRecords: number;
    skippedRecords: number;
    failedRecords: number;
  };
  startTime: Date;
  endTime?: Date;
  lastProcessedDoc?: {
    collection: string;
    docId: string;
  };
  error?: string;
}
```

### Consolidation Report

```typescript
interface ConsolidationReport {
  jobId: string;
  summary: {
    totalIdentityEntries: number;
    totalFormRecords: number;
    matchedRecords: number;
    updatedRecords: number;
    skippedRecords: number;
    failedRecords: number;
    duration: number; // milliseconds
  };
  byCollection: {
    [collectionName: string]: {
      matched: number;
      updated: number;
      skipped: number;
      failed: number;
    };
  };
  byMatchStrategy: {
    email: number;
    'name-dob': number;
    'policy-number': number;
  };
  unmatchedIdentityEntries: Array<{
    id: string;
    email: string;
    reason: string;
  }>;
  errors: Array<{
    identityEntryId: string;
    formRecordId?: string;
    collection?: string;
    error: string;
  }>;
  potentialDuplicates: Array<{
    identityEntryId: string;
    email: string;
    matchCount: number;
  }>;
  sampleUpdates: Array<{
    collection: string;
    before: Partial<FormRecord>;
    after: Partial<FormRecord>;
  }>;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Matching Properties

**Property 1: Email matching correctness**
*For any* identity entry and form record with matching normalized emails, the matching engine should identify them as a match with email strategy and confidence 1.0
**Validates: Requirements 1.1**

**Property 2: Fallback to name-DOB matching**
*For any* identity entry and form record where email matching fails but displayName and dateOfBirth match (after normalization), the matching engine should identify them as a match with name-dob strategy
**Validates: Requirements 1.2**

**Property 3: Fallback to policy number matching**
*For any* identity entry and form record where email and name-DOB matching fail but policyNumber matches, the matching engine should identify them as a match with policy-number strategy
**Validates: Requirements 1.3**

**Property 4: Most recent identity entry selection**
*For any* form record that matches multiple identity entries, the matching engine should select the identity entry with the most recent timestamp
**Validates: Requirements 1.4**

**Property 5: Complete match results**
*For any* identity entry that matches multiple form records, the matching engine should return all matching form records in the results
**Validates: Requirements 1.5**

**Property 6: Email normalization**
*For any* email address with mixed case or whitespace, normalizing it to lowercase and trimmed should enable matching with the canonical form
**Validates: Requirements 1.6, 1.7**

### Data Transfer Properties

**Property 7: Encrypted field preservation**
*For any* valid encrypted field (NIN, CAC, or BVN) in an identity entry, transferring it to a form record should result in deep equality between source and destination encrypted objects
**Validates: Requirements 2.1, 2.2, 2.3**

**Property 8: Encrypted data validation**
*For any* encrypted field, validation should pass if and only if it contains non-empty base64-encoded `encrypted` and `iv` fields
**Validates: Requirements 2.5, 11.1, 11.2**

**Property 9: Invalid data handling**
*For any* identity entry with invalid or missing encrypted data, the consolidation service should skip that record and log an error without throwing an exception
**Validates: Requirements 2.6, 10.2**

### Collection Processing Properties

**Property 10: Multi-collection support**
*For any* collection in the supported list (individual-kyc, corporate-kyc, Individual-kyc-form, corporate-kyc-form, brokers-kyc, agentsCDD, partnersCDD, motor-claims), the consolidation service should be able to process records from that collection
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

**Property 11: Collection selection filtering**
*For any* consolidation job with a subset of collections selected, only form records from the selected collections should be processed
**Validates: Requirements 3.10**

### Idempotency Properties

**Property 12: Existing data preservation**
*For any* form record that already contains encrypted identity data (NIN, CAC, or BVN), running consolidation should not modify those existing fields
**Validates: Requirements 4.1, 4.2, 4.3**

**Property 13: Idempotent execution**
*For any* unchanged dataset, running consolidation multiple times should produce identical final form record states
**Validates: Requirements 4.5**

**Property 14: Skip audit logging**
*For any* form record skipped due to existing data, there should be a corresponding audit log entry with operation type "skip" and the skipped field names
**Validates: Requirements 4.4**

### Audit Trail Properties

**Property 15: Match audit completeness**
*For any* successful match operation, the audit log should contain an entry with the matching strategy, identity entry email, form record ID, and collection name
**Validates: Requirements 5.1**

**Property 16: Update audit completeness**
*For any* form record update operation, the audit log should contain an entry with document ID, collection name, fields updated, and timestamp
**Validates: Requirements 5.2**

**Property 17: Failed match audit logging**
*For any* identity entry that fails to match any form records, the audit log should contain an entry with the identity entry email and failure reason
**Validates: Requirements 5.3**

**Property 18: Error audit logging**
*For any* error during consolidation, the audit log should contain an entry with error message and affected record identifiers
**Validates: Requirements 5.4**

**Property 19: Admin attribution**
*For any* consolidation job, all audit log entries for that job should contain the same admin user UID and email
**Validates: Requirements 5.5, 12.3**

**Property 20: Job timing audit**
*For any* completed consolidation job, the audit log should contain start time, end time, and duration information
**Validates: Requirements 5.6**

**Property 21: Report accuracy**
*For any* completed consolidation job, the summary counts in the report (matched, updated, skipped, failed) should equal the actual count of audit log entries with those operation types
**Validates: Requirements 5.8**

### Dry Run Properties

**Property 22: Dry run non-modification**
*For any* consolidation job run in dry run mode, the state of all form records before and after execution should be identical
**Validates: Requirements 6.1**

**Property 23: Dry run report generation**
*For any* consolidation job run in dry run mode, a complete consolidation report with preview data should be generated
**Validates: Requirements 6.2, 6.4**

**Property 24: Dry run audit trail**
*For any* consolidation job run in dry run mode, all audit log entries should have the dryRun flag set to true
**Validates: Requirements 6.3**

**Property 25: Issue detection in report**
*For any* consolidation job where multiple identity entries match the same form record, the report should include those cases in the potentialDuplicates section
**Validates: Requirements 6.5**

### Performance Properties

**Property 26: Batch size limit**
*For any* batch operation during consolidation, the number of documents in that batch should not exceed 500
**Validates: Requirements 7.1**

**Property 27: Retry behavior**
*For any* failed batch operation, the consolidation service should retry that batch up to 3 times before marking it as permanently failed
**Validates: Requirements 7.3, 10.4**

**Property 28: Progress reporting frequency**
*For any* consolidation job processing more than 100 records, progress updates should occur at intervals of approximately 100 records
**Validates: Requirements 7.5**

**Property 29: Pause and resume consistency**
*For any* consolidation job that is paused and then resumed, the final state should be identical to running the job without interruption
**Validates: Requirements 7.6, 10.7**

### Access Control Properties

**Property 30: Role-based access control**
*For any* user without super-admin or data-admin role, attempting to access consolidation controls should result in access denied
**Validates: Requirements 8.7, 12.2**

**Property 31: Unauthorized access logging**
*For any* unauthorized access attempt to consolidation endpoints, an audit log entry should be created and an error response returned
**Validates: Requirements 12.5**

**Property 32: Session expiration enforcement**
*For any* consolidation operation initiated with a session older than 30 minutes, the service should require re-authentication
**Validates: Requirements 12.6**

### Report Structure Properties

**Property 33: Report completeness**
*For any* consolidation report, it should contain all required sections: summary statistics, byCollection breakdown, byMatchStrategy breakdown, unmatchedIdentityEntries, errors, and potentialDuplicates
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9**

**Property 34: Export format validity**
*For any* consolidation report exported as CSV or JSON, the exported file should be parseable and contain all report data
**Validates: Requirements 8.6**

### Validation Properties

**Property 35: Verified status requirement**
*For any* identity entry with status other than "verified", the consolidation service should skip that entry
**Validates: Requirements 11.3**

**Property 36: Validation error handling**
*For any* record that fails validation checks, the consolidation service should log the validation error and skip that record without halting the entire job
**Validates: Requirements 11.5, 10.3**

**Property 37: Write verification**
*For any* form record updated during consolidation, reading that record immediately after the update should return the newly written values
**Validates: Requirements 11.6**

### Transaction Properties

**Property 38: Transaction rollback on failure**
*For any* Firestore write operation that fails, no partial updates should be visible in the database (atomic rollback)
**Validates: Requirements 10.1**

**Property 39: Failed record tracking**
*For any* record that fails during consolidation, it should appear in the failed records list in the consolidation report with the error reason
**Validates: Requirements 10.6**

**Property 40: Critical error halting**
*For any* critical error (authentication failure, permission denied, database unavailable), the consolidation service should halt processing and not continue with remaining records
**Validates: Requirements 10.5**

## Error Handling

### Error Categories

**Validation Errors** (Non-Critical):
- Invalid encrypted data structure
- Missing required fields for matching
- Non-verified identity entry status
- Malformed document IDs

**Handling**: Log error, skip record, continue processing

**Transient Errors** (Retryable):
- Network timeouts
- Firestore quota exceeded
- Temporary service unavailability

**Handling**: Retry with exponential backoff (3 attempts), log each attempt

**Critical Errors** (Halt Processing):
- Authentication failure
- Permission denied
- Database connection lost
- Invalid job configuration

**Handling**: Halt processing, log error, notify admin, mark job as failed

### Error Recovery Strategy

```
function handleError(error, context):
  if error is ValidationError:
    logError(error, context)
    skipRecord(context.recordId)
    incrementFailedCount()
    return CONTINUE
  
  else if error is TransientError:
    if context.retryCount < 3:
      wait(exponentialBackoff(context.retryCount))
      context.retryCount++
      return RETRY
    else:
      logError(error, context)
      skipRecord(context.recordId)
      incrementFailedCount()
      return CONTINUE
  
  else if error is CriticalError:
    logCriticalError(error, context)
    notifyAdmin(error)
    markJobFailed()
    return HALT
  
  else:
    // Unknown error - treat as critical
    logCriticalError(error, context)
    return HALT
```

### Rollback Mechanism

All Firestore updates use transactions to ensure atomicity:

```typescript
async function updateFormRecord(
  formRecordRef: DocumentReference,
  updates: Partial<FormRecord>
): Promise<void> {
  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(formRecordRef);
    
    if (!doc.exists) {
      throw new Error('Form record not found');
    }
    
    // Verify no existing data (idempotency check)
    const existing = doc.data();
    if (updates.nin && existing.nin) {
      throw new Error('NIN already exists');
    }
    if (updates.cac && existing.cac) {
      throw new Error('CAC already exists');
    }
    if (updates.bvn && existing.bvn) {
      throw new Error('BVN already exists');
    }
    
    transaction.update(formRecordRef, updates);
  });
}
```

If the transaction fails, Firestore automatically rolls back all changes within that transaction.

## Testing Strategy

### Dual Testing Approach

The consolidation system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific matching scenarios (exact email match, case differences, whitespace)
- Specific error conditions (missing fields, invalid encryption)
- Integration points between components
- UI component rendering and interactions

**Property Tests**: Verify universal properties across all inputs
- Matching correctness across random identity entries and form records
- Idempotency across random datasets
- Audit trail completeness across random operations
- Encryption preservation across random encrypted data

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing Configuration

**Testing Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `Feature: kyc-identity-data-consolidation, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check';

describe('Feature: kyc-identity-data-consolidation', () => {
  test('Property 1: Email matching correctness', () => {
    fc.assert(
      fc.property(
        fc.record({
          email: fc.emailAddress(),
          displayName: fc.string(),
          nin: fc.record({
            encrypted: fc.base64String(),
            iv: fc.base64String()
          })
        }),
        (identityEntry) => {
          const formRecord = {
            submittedBy: identityEntry.email.toUpperCase(), // Test case insensitivity
            submittedAt: new Date()
          };
          
          const matches = matchingEngine.findMatches(
            identityEntry,
            ['individual-kyc']
          );
          
          expect(matches).toHaveLength(1);
          expect(matches[0].matchStrategy).toBe('email');
          expect(matches[0].confidence).toBe(1.0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Data Generators

**Custom Generators for Property Tests**:

```typescript
// Generate valid encrypted fields
const encryptedFieldArb = fc.record({
  encrypted: fc.base64String({ minLength: 32, maxLength: 128 }),
  iv: fc.base64String({ minLength: 16, maxLength: 32 })
});

// Generate identity entries
const identityEntryArb = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  displayName: fc.option(fc.fullName()),
  dateOfBirth: fc.option(fc.date()),
  policyNumber: fc.option(fc.string({ minLength: 8, maxLength: 20 })),
  nin: fc.option(encryptedFieldArb),
  cac: fc.option(encryptedFieldArb),
  bvn: fc.option(encryptedFieldArb),
  status: fc.constantFrom('pending', 'verified', 'failed'),
  createdAt: fc.date(),
  verifiedAt: fc.option(fc.date())
});

// Generate form records
const formRecordArb = fc.record({
  id: fc.uuid(),
  submittedBy: fc.emailAddress(),
  submittedAt: fc.date(),
  status: fc.constantFrom('pending', 'approved', 'rejected'),
  formType: fc.constantFrom('individual-kyc', 'corporate-kyc', 'motor-claims'),
  displayName: fc.option(fc.fullName()),
  dateOfBirth: fc.option(fc.date()),
  policyNumber: fc.option(fc.string({ minLength: 8, maxLength: 20 }))
});
```

### Integration Testing

**End-to-End Consolidation Flow**:
1. Set up test Firestore instance with sample data
2. Create identity entries with known encrypted data
3. Create form records with matching criteria
4. Run consolidation in dry-run mode
5. Verify report accuracy
6. Run consolidation in live mode
7. Verify form records updated correctly
8. Verify audit trail completeness
9. Run consolidation again (idempotency test)
10. Verify no changes on second run

**Admin Interface Testing**:
1. Test role-based access control
2. Test collection selection UI
3. Test dry-run toggle
4. Test progress monitoring
5. Test report display and download
6. Test error message display

### Performance Testing

**Load Testing Scenarios**:
- 1,000 identity entries × 10,000 form records
- 10,000 identity entries × 100,000 form records
- Measure: execution time, memory usage, Firestore read/write counts

**Optimization Targets**:
- Process 1,000 records in under 2 minutes
- Memory usage under 512MB
- Firestore operations under quota limits

### Security Testing

**Access Control Tests**:
- Verify non-admin users cannot access consolidation endpoints
- Verify session expiration enforcement
- Verify audit logging of unauthorized attempts

**Data Security Tests**:
- Verify encrypted data never decrypted during transfer
- Verify encrypted data structure preserved exactly
- Verify no plaintext identity data in logs or reports
