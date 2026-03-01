# CAC Document Upload State Synchronization Fix - Design Document

## Overview

This design addresses a critical bug in the CAC document upload flow where customers select 3 CAC documents (all showing green checkmarks in the UI), but only 1 document is actually uploaded to the server. The root cause is a React state synchronization issue where the `cacDocuments` state object does not contain all selected files when the verification function executes, despite the UI displaying visual confirmation for all 3 files.

The fix involves:
1. Identifying the root cause of state desynchronization
2. Implementing immediate upload on file selection (not on Verify click)
3. Adding comprehensive logging to track state changes and uploads
4. Investigating missing document visibility in admin UI
5. Ensuring all 3 documents are properly stored and queryable

## Glossary

- **Bug_Condition (C)**: The condition where 3 CAC documents are selected (UI shows green checkmarks) but only 1 document exists in the `cacDocuments` state when verification executes
- **Property (P)**: The desired behavior where all selected files are immediately uploaded with progress indicators, and verification only proceeds after all uploads complete
- **Preservation**: Existing validation, error handling, and storage path logic that must remain unchanged
- **cacDocuments**: React state object that should contain all 3 selected CAC document files
- **handleVerify**: The function that processes CAC verification after documents are uploaded
- **CACDocumentUpload**: Modern component in `src/components/identity/CACDocumentUpload.tsx` with immediate upload capability
- **State Desynchronization**: When React state does not reflect the actual UI state due to asynchronous updates or batching

## Bug Details

### Fault Condition

The bug manifests when a customer selects 3 CAC documents (certificate_of_incorporation, particulars_of_directors, share_allotment) in rapid succession. The UI displays green checkmarks for all 3 files, but the `cacDocuments` React state only contains 1 file when the `handleVerify` function executes.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { 
    selectedFiles: File[], 
    cacDocumentsState: Record<string, File>,
    uiCheckmarks: number 
  }
  OUTPUT: boolean
  
  RETURN input.selectedFiles.length == 3
         AND input.uiCheckmarks == 3
         AND Object.keys(input.cacDocumentsState).length < 3
         AND verifyButtonClicked == true
END FUNCTION
```

### Examples

- **Example 1**: Customer selects certificate_of_incorporation.pdf, then particulars_of_directors.pdf, then share_allotment.pdf. UI shows 3 green checkmarks. Customer clicks "Verify CAC". Only share_allotment.pdf is uploaded to server.

- **Example 2**: Customer selects all 3 documents quickly. UI shows 3 green checkmarks. `cacDocuments` state contains only 1 document. Verification proceeds with incomplete data.

- **Example 3**: Customer selects 3 documents. Admin checks the verification record and sees "No CAC documents have been uploaded" despite customer seeing success confirmation.

- **Edge Case**: Customer selects 2 documents, waits 5 seconds, then selects the 3rd document. All 3 documents upload correctly because state updates had time to settle.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- File validation (PDF/PNG, under 10MB) must continue to work exactly as before
- Storage path format `cac-documents/{customerId}/{documentType}_{timestamp}` must remain unchanged
- Firestore metadata collection `cac-document-metadata` structure must remain unchanged
- Error handling for network failures must continue to display error messages and allow retry
- Document replacement functionality must continue to work for already uploaded documents

**Scope:**
All inputs that do NOT involve the 3-document selection flow should be completely unaffected by this fix. This includes:
- Single document uploads
- Document replacement operations
- Admin document viewing queries
- Existing document display on page reload

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Legacy Integration Point**: While `CACDocumentUpload.tsx` has modern immediate-upload UX, there may be a legacy integration point (possibly in CorporateKYC.tsx or a verification dialog) that still uses the old pattern of collecting files in state and uploading on "Verify" click.

2. **React State Batching**: If using the old pattern, React may batch multiple `setState` calls for the 3 file selections, causing only the last update to be applied. This is especially likely in React 18+ with automatic batching.

3. **Asynchronous State Updates**: The file selection handlers may be setting state asynchronously, and the `handleVerify` function reads from stale state before all updates complete.

4. **Missing Upload Trigger**: The integration may not be calling the upload function for each document immediately upon selection, instead relying on a batch upload that fails to capture all files.

5. **Admin Query Issue**: The admin UI may be querying with incorrect filters or the metadata may not be written correctly, causing documents to appear missing even when they exist in storage.

## Correctness Properties

Property 1: Fault Condition - All Selected Documents Uploaded

_For any_ file selection event where 3 CAC documents are selected (one for each required type), the system SHALL immediately upload each document to Firebase Storage with visible progress indicators, store metadata in Firestore, and only enable the "Verify CAC" button after all 3 uploads complete successfully.

**Validates: Requirements 2.1, 2.2, 2.4, 2.5**

Property 2: Preservation - Existing Upload Behavior

_For any_ upload operation that does NOT involve the 3-document selection flow (single uploads, replacements, admin operations), the system SHALL produce exactly the same behavior as the original code, preserving all existing validation, storage paths, metadata structure, and error handling.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**Investigation Phase:**

1. **Locate Legacy Integration**: Search codebase for where CAC documents are collected in state before upload
   - Check `CorporateKYC.tsx` for `cacDocuments` state
   - Check for verification dialogs or modals that handle CAC uploads
   - Look for `handleVerify` or similar functions that read from document state

2. **Identify State Update Pattern**: Examine how file selections update state
   - Check if using `setState` with object spread
   - Check if updates are synchronous or asynchronous
   - Verify if React 18 automatic batching is affecting updates

3. **Trace Upload Flow**: Follow the upload execution path
   - Identify when uploads are triggered (selection vs verification)
   - Check if uploads are sequential or parallel
   - Verify metadata is written for each upload

4. **Admin Query Analysis**: Examine admin document viewing logic
   - Check Firestore query filters
   - Verify metadata field names match between write and read
   - Test if documents exist in storage but not in query results

**Implementation Changes:**

**File**: `[To be determined after investigation]`

**Function**: `[handleFileSelection / handleVerify / similar]`

**Specific Changes**:

1. **Replace State-Based Upload with Immediate Upload**:
   - Remove `cacDocuments` state object that collects files
   - Call upload function immediately when each file is selected
   - Store upload promises or metadata references instead of File objects
   - Use `CACDocumentUpload` component pattern as reference

2. **Add Upload Progress Tracking**:
   - Create `uploadProgress` state for each document type
   - Display progress bars during upload
   - Show success checkmarks only after upload completes
   - Disable "Verify CAC" button until all uploads complete

3. **Implement Comprehensive Logging**:
   - Log each file selection event with timestamp
   - Log state updates with before/after snapshots
   - Log upload start/complete for each document
   - Log metadata write operations
   - Log verification button click with state snapshot

4. **Fix Admin Document Query** (if needed):
   - Verify query uses correct collection name
   - Ensure filters match metadata field names
   - Add error logging for failed queries
   - Test query with known uploaded documents

5. **Add State Validation**:
   - Before verification, validate all 3 documents are uploaded
   - Display clear error if any document is missing
   - Prevent verification from proceeding with incomplete uploads

### Logging Strategy

**Client-Side Logging** (Console + Firestore audit logs):

```typescript
// File selection
console.log('[CAC Upload] File selected:', {
  documentType,
  filename: file.name,
  fileSize: file.size,
  timestamp: new Date().toISOString()
});

// Upload start
console.log('[CAC Upload] Upload started:', {
  documentType,
  identityRecordId,
  timestamp: new Date().toISOString()
});

// Upload progress
console.log('[CAC Upload] Upload progress:', {
  documentType,
  progress: percentage,
  timestamp: new Date().toISOString()
});

// Upload complete
console.log('[CAC Upload] Upload complete:', {
  documentType,
  storagePath,
  metadataId,
  timestamp: new Date().toISOString()
});

// State snapshot before verification
console.log('[CAC Upload] Verification initiated:', {
  uploadedDocuments: Object.keys(uploadedDocuments),
  allUploadsComplete: boolean,
  timestamp: new Date().toISOString()
});
```

**Server-Side Logging** (Audit logs):

```javascript
// Metadata write
auditLogger.log({
  action: 'CAC_DOCUMENT_METADATA_WRITTEN',
  documentType,
  identityRecordId,
  metadataId,
  userId,
  timestamp: new Date()
});

// Admin query
auditLogger.log({
  action: 'CAC_DOCUMENTS_QUERIED',
  identityRecordId,
  resultsCount,
  userId,
  timestamp: new Date()
});
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate rapid selection of 3 CAC documents and capture the state at verification time. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Rapid Selection Test**: Select 3 documents in quick succession (< 100ms between selections), then click verify (will fail on unfixed code - only 1 document in state)
2. **State Snapshot Test**: Capture `cacDocuments` state after each selection and at verification time (will show missing documents on unfixed code)
3. **UI vs State Mismatch Test**: Count green checkmarks in UI and compare to state object size (will show mismatch on unfixed code)
4. **Admin Query Test**: Upload 3 documents, then query as admin (may show "No documents" on unfixed code)

**Expected Counterexamples**:
- `cacDocuments` state contains only 1 file when 3 are selected
- Verification proceeds with incomplete document set
- Admin query returns 0 results despite successful uploads
- Possible causes: state batching, asynchronous updates, missing upload triggers, incorrect query filters

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleFileSelection_fixed(input)
  ASSERT all 3 documents are uploaded immediately
  ASSERT uploadProgress shows 100% for each document
  ASSERT verifyButton is disabled until all uploads complete
  ASSERT cacDocumentsMetadata contains 3 entries
  ASSERT admin query returns 3 documents
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleFileSelection_original(input) = handleFileSelection_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for single uploads and replacements, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Single Document Upload Preservation**: Verify uploading 1 document works exactly as before
2. **Document Replacement Preservation**: Verify replacing an existing document works exactly as before
3. **Validation Preservation**: Verify file type and size validation continues to work
4. **Error Handling Preservation**: Verify network error handling continues to work

### Unit Tests

- Test immediate upload trigger on file selection
- Test upload progress tracking for each document type
- Test verification button disabled state until all uploads complete
- Test state validation before verification
- Test logging output for each operation
- Test admin query with correct filters

### Property-Based Tests

- Generate random file selection sequences and verify all files are uploaded
- Generate random file sizes/types and verify validation continues to work
- Generate random network error scenarios and verify error handling works
- Test that admin queries always return uploaded documents

### Integration Tests

- Test full flow: select 3 documents → uploads complete → verification succeeds
- Test admin viewing: upload 3 documents → query as admin → verify all 3 visible
- Test error recovery: upload fails → retry → verify success
- Test replacement flow: upload 3 documents → replace 1 → verify all 3 still visible
