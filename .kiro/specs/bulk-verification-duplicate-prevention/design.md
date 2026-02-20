# Design Document: Bulk Verification Duplicate Prevention

## Overview

This design addresses three critical issues in the bulk verification system:
1. **Duplicate Prevention**: Check database before verification to avoid re-verifying already-verified identities
2. **Pre-Verification Confirmation**: Show users a modal with counts and cost estimates before starting
3. **Polling Lifecycle**: Stop frontend polling after job completion instead of continuous polling

The solution adds a duplicate detection layer before API calls, implements a pre-flight analysis endpoint, and enhances the job status response to signal completion.

## Architecture

### High-Level Flow

```
User clicks "Verify Unverified"
    ↓
Frontend calls /analyze-bulk-verify (new endpoint)
    ↓
Backend performs:
  - Format validation
  - Duplicate detection across ALL lists
  - Cost calculation
    ↓
Frontend displays Confirmation Modal
    ↓
User confirms → Frontend calls /bulk-verify
    ↓
Backend processes entries:
  - Skip duplicates (already checked)
  - Skip invalid formats
  - Verify remaining entries
    ↓
Frontend polls /bulk-verify/:jobId/status
    ↓
Backend returns status with "completed" flag
    ↓
Frontend stops polling when completed=true
```

### Key Design Decisions

1. **Two-Phase Approach**: Separate analysis endpoint before verification to enable confirmation modal
2. **Global Duplicate Index**: Query across all identity-entries regardless of listId for comprehensive duplicate detection
3. **Cached Analysis Results**: Store analysis results with jobId to avoid re-computing during actual verification
4. **Completion Signal**: Add explicit "completed" boolean to status response instead of relying on status string matching

## Components and Interfaces

### Backend Components

#### 1. Duplicate Detection Service

**Location**: `server-utils/duplicateDetector.cjs`

**Interface**:
```javascript
/**
 * Check if an identity has been verified before across all lists
 * @param {string} identityType - 'NIN', 'BVN', or 'CAC'
 * @param {string} identityValue - The identity number (decrypted)
 * @returns {Promise<DuplicateCheckResult>}
 */
async function checkDuplicate(identityType, identityValue)

/**
 * Batch check multiple identities for duplicates
 * @param {Array<{type: string, value: string, entryId: string}>} identities
 * @returns {Promise<Map<string, DuplicateCheckResult>>}
 */
async function batchCheckDuplicates(identities)

/**
 * Result type for duplicate checks
 * @typedef {Object} DuplicateCheckResult
 * @property {boolean} isDuplicate
 * @property {string|null} originalListId
 * @property {string|null} originalEntryId
 * @property {Date|null} originalVerificationDate
 * @property {string|null} originalBroker
 * @property {Object|null} originalResult
 */
```

**Implementation Strategy**:
- Query Firestore `identity-entries` collection with compound index on `(identityType, identityValue, status)`
- Filter for `status === 'verified'`
- Return first match (most recent if multiple)
- Handle encrypted identity values by decrypting before comparison
- Cache results in memory for 5 minutes to optimize repeated checks

#### 2. Format Validator

**Location**: `server-utils/identityValidator.cjs`

**Interface**:
```javascript
/**
 * Validate identity format
 * @param {string} identityType - 'NIN', 'BVN', or 'CAC'
 * @param {string} identityValue - The identity number
 * @returns {ValidationResult}
 */
function validateIdentityFormat(identityType, identityValue)

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {string|null} errorReason
 */
```

**Validation Rules**:
- NIN: Exactly 11 digits, no letters or special characters
- BVN: Exactly 11 digits, no letters or special characters
- CAC: Variable format, minimum 5 characters, alphanumeric with hyphens allowed

#### 3. Cost Calculator

**Location**: `server-utils/costCalculator.cjs`

**Interface**:
```javascript
/**
 * Calculate estimated cost for verification batch
 * @param {Object} counts - Breakdown of identity types to verify
 * @param {number} counts.nin - Number of NIN verifications
 * @param {number} counts.bvn - Number of BVN verifications
 * @param {number} counts.cac - Number of CAC verifications
 * @returns {CostEstimate}
 */
function calculateCost(counts)

/**
 * @typedef {Object} CostEstimate
 * @property {number} totalCost - Total in configured currency
 * @property {string} currency - Currency code (e.g., 'NGN')
 * @property {Object} breakdown - Cost per identity type
 * @property {number} breakdown.nin
 * @property {number} breakdown.bvn
 * @property {number} breakdown.cac
 */
```

**Pricing Configuration**:
```javascript
const API_COSTS = {
  NIN: 50, // NGN per verification
  BVN: 50, // NGN per verification
  CAC: 100 // NGN per verification
};
```

#### 4. Bulk Verification Analyzer

**Location**: `server.js` (new endpoint handler)

**Endpoint**: `POST /api/identity/lists/:listId/analyze-bulk-verify`

**Request Body**:
```json
{
  "batchSize": 10
}
```

**Response**:
```json
{
  "analysisId": "analysis_abc123",
  "totalEntries": 150,
  "toVerify": 120,
  "toSkip": 30,
  "skipReasons": {
    "already_verified": 25,
    "invalid_format": 5
  },
  "costEstimate": {
    "totalCost": 6000,
    "currency": "NGN",
    "breakdown": {
      "nin": 5000,
      "bvn": 500,
      "cac": 500
    }
  },
  "identityTypeBreakdown": {
    "nin": 100,
    "bvn": 10,
    "cac": 10
  }
}
```

**Processing Logic**:
1. Fetch all unverified entries for the list
2. For each entry:
   - Extract identity value (decrypt if needed)
   - Validate format
   - Check for duplicates
   - Categorize as "verify" or "skip" with reason
3. Calculate cost estimate for entries to verify
4. Store analysis results in memory cache with TTL of 10 minutes
5. Return summary to frontend

#### 5. Enhanced Bulk Verification Handler

**Modifications to**: `server.js` - `executeBulkVerification` function

**Changes**:
1. Accept optional `analysisId` parameter to reuse analysis results
2. If `analysisId` provided, retrieve cached analysis and skip re-analysis
3. Add duplicate check before calling `processSingleEntry`
4. Skip entries marked as duplicates with appropriate logging
5. Update job status to include `completed: true` when done

**Modified processSingleEntry**:
```javascript
async function processSingleEntry(entry, entryId, listId, userId, ipData, userAgent, skipDuplicateCheck = false) {
  // ... existing code ...
  
  // NEW: Duplicate check (unless already done in analysis phase)
  if (!skipDuplicateCheck) {
    const duplicateResult = await checkDuplicate(verificationType, identityNumber);
    
    if (duplicateResult.isDuplicate) {
      await createIdentityActivityLog({
        listId,
        entryId,
        action: 'bulk_verify_skipped',
        actorType: 'admin',
        actorId: userId,
        details: {
          reason: 'already_verified',
          email: entry.email,
          originalListId: duplicateResult.originalListId,
          originalVerificationDate: duplicateResult.originalVerificationDate,
          originalBroker: duplicateResult.originalBroker
        },
        ipAddress: ipData?.masked,
        userAgent
      });
      
      return {
        entryId,
        email: entry.email,
        status: 'skipped',
        reason: 'already_verified',
        duplicateInfo: {
          originalListId: duplicateResult.originalListId,
          originalDate: duplicateResult.originalVerificationDate
        }
      };
    }
  }
  
  // ... rest of existing verification logic ...
}
```

#### 6. Job Status Endpoint Enhancement

**Endpoint**: `GET /api/identity/bulk-verify/:jobId/status`

**Modified Response**:
```json
{
  "jobId": "bulk_verify_123",
  "status": "completed",
  "completed": true,
  "progress": 100,
  "totalEntries": 150,
  "processed": 150,
  "verified": 120,
  "failed": 5,
  "skipped": 25,
  "skipReasons": {
    "already_verified": 20,
    "invalid_format": 3,
    "no_identity_data": 2
  },
  "costSavings": {
    "duplicatesSkipped": 20,
    "estimatedSaved": 1000,
    "currency": "NGN"
  }
}
```

**Key Addition**: `completed` boolean field that is `true` when status is 'completed', 'error', or 'paused'

### Frontend Components

#### 1. Confirmation Modal Component

**Location**: `src/components/identity/BulkVerifyConfirmDialog.tsx`

**Props**:
```typescript
interface BulkVerifyConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  analysis: BulkVerifyAnalysis | null;
  loading: boolean;
}

interface BulkVerifyAnalysis {
  totalEntries: number;
  toVerify: number;
  toSkip: number;
  skipReasons: Record<string, number>;
  costEstimate: {
    totalCost: number;
    currency: string;
    breakdown: Record<string, number>;
  };
  identityTypeBreakdown: Record<string, number>;
}
```

**UI Layout**:
```
┌─────────────────────────────────────┐
│ Confirm Bulk Verification           │
├─────────────────────────────────────┤
│                                     │
│ Total Entries: 150                  │
│                                     │
│ ✓ To Verify: 120 entries            │
│   • NIN: 100                        │
│   • BVN: 10                         │
│   • CAC: 10                         │
│                                     │
│ ⊘ To Skip: 30 entries               │
│   • Already verified: 25            │
│   • Invalid format: 5               │
│                                     │
│ Estimated Cost: ₦6,000              │
│   • NIN: ₦5,000                     │
│   • BVN: ₦500                       │
│   • CAC: ₦500                       │
│                                     │
│         [Cancel]  [Confirm]         │
└─────────────────────────────────────┘
```

#### 2. Enhanced IdentityListDetail Component

**Location**: `src/pages/admin/IdentityListDetail.tsx`

**Modified Flow**:
```typescript
const handleBulkVerify = async () => {
  // Step 1: Analyze
  setAnalyzing(true);
  const analysis = await fetch(`/api/identity/lists/${listId}/analyze-bulk-verify`, {
    method: 'POST',
    body: JSON.stringify({ batchSize: 10 })
  }).then(r => r.json());
  setAnalyzing(false);
  
  // Step 2: Show confirmation modal
  setAnalysisResult(analysis);
  setConfirmDialogOpen(true);
};

const handleConfirmBulkVerify = async () => {
  // Step 3: Start verification with analysisId
  const result = await fetch(`/api/identity/lists/${listId}/bulk-verify`, {
    method: 'POST',
    body: JSON.stringify({
      batchSize: 10,
      analysisId: analysisResult.analysisId
    })
  }).then(r => r.json());
  
  // Step 4: Start polling
  setBulkVerifyJobId(result.jobId);
  startPolling(result.jobId);
};

const pollBulkVerifyProgress = async (jobId: string) => {
  const status = await fetch(`/api/identity/bulk-verify/${jobId}/status`)
    .then(r => r.json());
  
  setBulkVerifyProgress(status.progress);
  setBulkVerifyStatus(status.status);
  
  // NEW: Check completed flag instead of status string
  if (status.completed) {
    stopPolling();
    showResults(status);
  }
};

const startPolling = (jobId: string) => {
  const interval = setInterval(() => {
    pollBulkVerifyProgress(jobId);
  }, 2000);
  setBulkVerifyPollInterval(interval);
};

const stopPolling = () => {
  if (bulkVerifyPollInterval) {
    clearInterval(bulkVerifyPollInterval);
    setBulkVerifyPollInterval(null);
  }
};
```

#### 3. Link Sending Enhancement

**Location**: `src/pages/admin/IdentityListDetail.tsx` - `handleSendLinks` function

**Modified Logic**:
```typescript
const handleSendLinks = async () => {
  // Perform duplicate check before sending
  const analysis = await fetch(`/api/identity/lists/${listId}/analyze-send-links`, {
    method: 'POST'
  }).then(r => r.json());
  
  // Show confirmation with duplicate info
  const confirmed = await showConfirmDialog({
    title: 'Send Verification Links',
    message: `
      Total: ${analysis.totalEntries}
      To Send: ${analysis.toSend}
      Already Verified: ${analysis.alreadyVerified}
    `
  });
  
  if (confirmed) {
    // Proceed with sending, backend will skip duplicates
    await fetch(`/api/identity/lists/${listId}/send-links`, {
      method: 'POST',
      body: JSON.stringify({ analysisId: analysis.analysisId })
    });
  }
};
```

## Data Models

### Analysis Cache Entry

**Storage**: In-memory Map in server.js

**Structure**:
```javascript
{
  analysisId: string,
  listId: string,
  createdAt: Date,
  expiresAt: Date,
  totalEntries: number,
  entriesToVerify: Array<{
    entryId: string,
    identityType: string,
    identityValue: string, // encrypted
    shouldVerify: boolean,
    skipReason: string | null,
    isDuplicate: boolean,
    duplicateInfo: DuplicateCheckResult | null
  }>,
  costEstimate: CostEstimate,
  identityTypeBreakdown: Object
}
```

### Enhanced Identity Entry

**Collection**: `identity-entries`

**New Fields**:
```javascript
{
  // ... existing fields ...
  
  // NEW: Duplicate tracking
  isDuplicateOf: string | null, // entryId of original verification
  duplicateDetectedAt: Timestamp | null,
  duplicateSkippedBy: string | null, // userId who triggered the skip
  
  // NEW: Skip reason tracking
  skipReason: string | null, // 'already_verified', 'invalid_format', etc.
  skipDetails: Object | null // Additional context for skip
}
```

### Enhanced Job Status

**Storage**: `bulkVerificationJobs` Map in server.js

**Modified Structure**:
```javascript
{
  jobId: string,
  listId: string,
  userId: string,
  status: 'running' | 'completed' | 'error' | 'paused',
  completed: boolean, // NEW: explicit completion flag
  startedAt: Date,
  completedAt: Date | null,
  totalEntries: number,
  processed: number,
  verified: number,
  failed: number,
  skipped: number,
  skipReasons: { // NEW: breakdown of skip reasons
    already_verified: number,
    invalid_format: number,
    no_identity_data: number
  },
  costSavings: { // NEW: cost savings from duplicates
    duplicatesSkipped: number,
    estimatedSaved: number,
    currency: string
  },
  details: Array,
  progress: number
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Duplicate Check Precedes API Calls

*For any* verification entry being processed, the duplicate check must complete before any API provider call is made, ensuring no API credits are wasted on already-verified identities.

**Validates: Requirements 1.1, 1.6, 2.1, 2.4**

### Property 2: Cross-List Duplicate Detection

*For any* identity value (NIN, BVN, or CAC), if that identity has been verified in any identity list in the system, the duplicate check must find it regardless of which list contains the original verification.

**Validates: Requirements 1.2**

### Property 3: Duplicate Handling Completeness

*For any* duplicate identity detected, the system must skip verification, mark the entry as "already_verified", record complete metadata (original timestamp, list name, broker, and result), and create an audit log entry with all details.

**Validates: Requirements 1.3, 1.4, 1.5, 2.2, 2.3, 6.1, 10.1, 10.2, 10.3, 10.4**

### Property 4: Confirmation Modal Completeness

*For any* bulk verification analysis result, the confirmation modal must display all required information: total entries, entries to verify, entries to skip with breakdown by reason, estimated cost with breakdown by identity type, and identity type distribution.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 5: Polling Lifecycle Termination

*For any* bulk verification job that reaches a terminal state (completed, error, or paused), the status response must include a completion indicator, and the frontend must stop polling upon receiving this indicator.

**Validates: Requirements 4.2, 4.3**

### Property 6: Polling Only During Active Jobs

*For any* time when no bulk verification job is in progress, the frontend must not initiate or continue polling for job status.

**Validates: Requirements 4.4**

### Property 7: Format Validation Correctness

*For any* identity value, format validation must correctly identify valid formats (NIN: exactly 11 digits, BVN: exactly 11 digits, CAC: minimum 5 alphanumeric characters with hyphens) and reject all other formats.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 8: Invalid Format Handling

*For any* identity that fails format validation, the system must mark it as "invalid_format", skip verification, and not make any API calls for that entry.

**Validates: Requirements 8.4**

### Property 9: Validation Before Duplicate Check

*For any* verification entry, format validation must complete before duplicate checking to avoid unnecessary database queries for invalid identities.

**Validates: Requirements 8.5**

### Property 10: Duplicate Check Error Resilience

*For any* duplicate check that fails due to database error or timeout, the system must log the error with details, and proceed with verification rather than blocking the request.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 11: Cost Calculation Accuracy

*For any* set of entries to verify, the cost calculation must use current API provider pricing, produce a breakdown by identity type, and format the result in the configured currency.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 12: Audit Log Completeness

*For any* completed bulk verification operation, the audit log must include a summary with total entries processed, duplicates skipped, estimated API credits saved, and duplicate skip counts.

**Validates: Requirements 6.2, 6.4**

## Error Handling

### Duplicate Check Failures

**Scenario**: Database query fails during duplicate check

**Handling**:
1. Log error with full context (entry ID, identity type, error message)
2. Increment failure counter for monitoring
3. Proceed with verification (fail-open approach to avoid blocking legitimate requests)
4. Include error in audit log

**Rationale**: Duplicate prevention is a cost optimization, not a correctness requirement. Better to occasionally verify a duplicate than to block all verifications when duplicate detection fails.

### Analysis Cache Expiration

**Scenario**: User confirms verification after analysis cache expires (>10 minutes)

**Handling**:
1. Return 410 Gone status code
2. Frontend shows message: "Analysis expired, please try again"
3. User must click "Verify Unverified" again to get fresh analysis

**Rationale**: Prevents stale analysis data from being used. 10-minute TTL is generous for user decision time.

### Format Validation Edge Cases

**Scenario**: Identity value is encrypted object instead of string

**Handling**:
1. Attempt to decrypt using encryption utility
2. If decryption fails, mark as "invalid_format" with reason "decryption_failed"
3. Log decryption failure for investigation
4. Skip verification

### Polling Connection Failures

**Scenario**: Network error during polling request

**Handling**:
1. Frontend retries with exponential backoff (2s, 4s, 8s, 16s, max 30s)
2. After 5 consecutive failures, show error message to user
3. Provide "Retry" button to resume polling
4. Job continues running on backend regardless of polling failures

### Concurrent Verification Attempts

**Scenario**: User clicks "Verify Unverified" while previous job is still running

**Handling**:
1. Backend checks for existing active job for the list
2. If found, return 409 Conflict with existing job ID
3. Frontend shows message: "Verification already in progress" with link to view status
4. User can view progress of existing job

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of duplicate detection (e.g., NIN "12345678901" verified in List A, then attempted in List B)
- Edge cases like encrypted identity values, malformed data, empty strings
- Error conditions like database timeouts, network failures
- UI interactions like modal open/close, button clicks
- Integration between components (analysis → confirmation → verification flow)

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs (see Correctness Properties section)
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test to catch edge cases

### Property Test Configuration

**Testing Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
```javascript
import fc from 'fast-check';

// Each property test runs 100+ iterations
fc.assert(
  fc.property(
    // generators here
    (input) => {
      // property assertion here
    }
  ),
  { numRuns: 100 }
);
```

**Test Tagging**: Each property test must include a comment referencing the design property:

```javascript
// Feature: bulk-verification-duplicate-prevention, Property 1: Duplicate Check Precedes API Calls
test('duplicate check happens before API call', () => {
  fc.assert(
    fc.property(
      identityGenerator(),
      async (identity) => {
        const apiCallOrder = [];
        const mockAPI = () => apiCallOrder.push('api');
        const mockDuplicateCheck = () => apiCallOrder.push('duplicate');
        
        await processEntry(identity, mockDuplicateCheck, mockAPI);
        
        expect(apiCallOrder[0]).toBe('duplicate');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Data Generators

**Identity Generator**:
```javascript
const identityGenerator = () => fc.record({
  type: fc.constantFrom('NIN', 'BVN', 'CAC'),
  value: fc.oneof(
    fc.stringOf(fc.integer(0, 9), { minLength: 11, maxLength: 11 }), // valid NIN/BVN
    fc.string({ minLength: 5, maxLength: 20 }), // valid CAC
    fc.string({ minLength: 0, maxLength: 50 }) // invalid formats
  ),
  email: fc.emailAddress(),
  data: fc.record({
    firstName: fc.string(),
    lastName: fc.string(),
    dateOfBirth: fc.date()
  })
});
```

**Analysis Result Generator**:
```javascript
const analysisResultGenerator = () => fc.record({
  totalEntries: fc.integer({ min: 1, max: 1000 }),
  toVerify: fc.integer({ min: 0, max: 1000 }),
  toSkip: fc.integer({ min: 0, max: 1000 }),
  skipReasons: fc.record({
    already_verified: fc.integer({ min: 0, max: 500 }),
    invalid_format: fc.integer({ min: 0, max: 500 })
  }),
  costEstimate: fc.record({
    totalCost: fc.integer({ min: 0, max: 100000 }),
    currency: fc.constant('NGN'),
    breakdown: fc.record({
      nin: fc.integer({ min: 0, max: 50000 }),
      bvn: fc.integer({ min: 0, max: 50000 }),
      cac: fc.integer({ min: 0, max: 50000 })
    })
  })
});
```

### Integration Test Scenarios

1. **End-to-End Duplicate Prevention**:
   - Create List A with verified entry (NIN: 12345678901)
   - Create List B with unverified entry (same NIN)
   - Trigger bulk verification on List B
   - Verify entry is skipped with duplicate metadata pointing to List A

2. **Confirmation Modal Flow**:
   - Create list with mix of valid, invalid, and duplicate entries
   - Click "Verify Unverified"
   - Verify modal shows correct counts
   - Confirm and verify only valid non-duplicates are verified

3. **Polling Lifecycle**:
   - Start bulk verification
   - Poll for status multiple times
   - Verify polling stops when job completes
   - Verify no more polling requests after completion

4. **Cost Savings Tracking**:
   - Create list with 50 entries, 20 are duplicates
   - Run bulk verification
   - Verify audit log shows 20 duplicates skipped
   - Verify cost savings calculation is correct (20 * API_COST)

### Performance Testing

**Duplicate Check Performance**:
- Test with 1000 entries, measure duplicate check time per entry
- Verify average time < 2 seconds
- Verify batch checking is used (not individual queries)

**Analysis Endpoint Performance**:
- Test with 1000 entries
- Verify analysis completes within 10 seconds
- Verify results are cached for subsequent requests

### Security Testing

**Encrypted Identity Handling**:
- Verify encrypted identities are decrypted before duplicate checking
- Verify decrypted values are not logged in plain text
- Verify encryption errors are handled gracefully

**Authorization**:
- Verify only list owners and admins can trigger bulk verification
- Verify duplicate metadata doesn't leak information across brokers
- Verify audit logs respect user permissions

## Implementation Notes

### Database Indexes Required

**Firestore Composite Index**:
```
Collection: identity-entries
Fields:
  - identityType (Ascending)
  - identityValue (Ascending)
  - status (Ascending)
```

This index enables efficient duplicate lookups across all lists.

### Cache Management

**Analysis Cache**:
- Store in-memory Map with TTL of 10 minutes
- Clean up expired entries every 5 minutes
- Maximum 1000 cached analyses (LRU eviction)

**Duplicate Check Cache**:
- Store in-memory Map with TTL of 5 minutes
- Key: `${identityType}:${identityValue}`
- Value: DuplicateCheckResult
- Maximum 10000 cached results (LRU eviction)

### API Cost Configuration

**Environment Variables**:
```
NIN_VERIFICATION_COST=50
BVN_VERIFICATION_COST=50
CAC_VERIFICATION_COST=100
COST_CURRENCY=NGN
```

### Monitoring and Alerts

**Metrics to Track**:
- Duplicate detection rate (duplicates / total entries)
- Cost savings from duplicate prevention (NGN per day)
- Duplicate check failure rate (failures / total checks)
- Average duplicate check latency (milliseconds)
- Analysis cache hit rate

**Alerts**:
- Duplicate check failure rate > 5%
- Average duplicate check latency > 2 seconds
- Analysis cache hit rate < 50%

### Migration Considerations

**Existing Data**:
- No migration needed for existing entries
- Duplicate detection works with existing verified entries
- New fields (isDuplicateOf, skipReason) are optional

**Backward Compatibility**:
- Old clients without confirmation modal will still work (analysis is optional)
- Polling behavior is backward compatible (completed flag is additive)
- API endpoints are versioned (/api/identity/...)

### Rollout Plan

**Phase 1**: Backend duplicate detection (1 week)
- Implement duplicate checker
- Add duplicate check to processSingleEntry
- Deploy and monitor duplicate detection rate

**Phase 2**: Analysis endpoint and confirmation modal (1 week)
- Implement analysis endpoint
- Build confirmation modal UI
- Deploy and monitor user adoption

**Phase 3**: Polling lifecycle fixes (3 days)
- Add completed flag to status response
- Update frontend polling logic
- Deploy and verify polling stops correctly

**Phase 4**: Link sending duplicate prevention (3 days)
- Apply duplicate detection to link sending
- Add confirmation for link sending
- Deploy and monitor

### Success Metrics

**Cost Savings**:
- Target: 20% reduction in API costs from duplicate prevention
- Measure: Compare API call volume before/after deployment

**User Experience**:
- Target: 90% of users confirm verification after seeing modal
- Measure: Track confirmation rate vs. cancellation rate

**System Performance**:
- Target: No increase in average verification time
- Measure: P50, P95, P99 latency for bulk verification

**Reliability**:
- Target: <1% duplicate check failure rate
- Measure: Monitor error logs and failure metrics
