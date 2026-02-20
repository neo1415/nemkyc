# Implementation Plan: Bulk Verification Duplicate Prevention

## Overview

This implementation adds duplicate prevention, pre-verification confirmation, and proper polling lifecycle management to the bulk verification system. The work is organized into four phases: duplicate detection infrastructure, analysis and confirmation, polling fixes, and link sending enhancements.

## Tasks

- [x] 1. Set up duplicate detection infrastructure
  - [x] 1.1 Create duplicate detector utility module
    - Create `server-utils/duplicateDetector.cjs` with `checkDuplicate` and `batchCheckDuplicates` functions
    - Implement Firestore queries to search across all identity-entries for matching identities
    - Add in-memory caching with 5-minute TTL for duplicate check results
    - Handle encrypted identity values by decrypting before comparison
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 1.2 Write property test for cross-list duplicate detection
    - **Property 2: Cross-List Duplicate Detection**
    - **Validates: Requirements 1.2**
  
  - [x] 1.3 Create identity format validator module
    - Create `server-utils/identityValidator.cjs` with `validateIdentityFormat` function
    - Implement validation rules: NIN (11 digits), BVN (11 digits), CAC (5+ alphanumeric with hyphens)
    - Return validation result with error reason for invalid formats
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 1.4 Write property test for format validation correctness
    - **Property 7: Format Validation Correctness**
    - **Validates: Requirements 8.1, 8.2, 8.3**
  
  - [x] 1.5 Create cost calculator utility module
    - Create `server-utils/costCalculator.cjs` with `calculateCost` function
    - Load API costs from environment variables (NIN_VERIFICATION_COST, BVN_VERIFICATION_COST, CAC_VERIFICATION_COST)
    - Calculate total cost and breakdown by identity type
    - Format currency according to COST_CURRENCY environment variable
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 1.6 Write property test for cost calculation accuracy
    - **Property 11: Cost Calculation Accuracy**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 2. Integrate duplicate detection into verification flow
  - [x] 2.1 Modify processSingleEntry to check duplicates before API calls
    - Add duplicate check call before verification API calls in `server.js`
    - Skip verification if duplicate found, mark entry as "already_verified"
    - Store duplicate metadata (originalListId, originalVerificationDate, originalBroker, originalResult)
    - Create audit log entry for skipped duplicates with full details
    - Handle duplicate check errors gracefully (log and proceed with verification)
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 7.1, 7.2, 7.3_
  
  - [ ]* 2.2 Write property test for duplicate check precedes API calls
    - **Property 1: Duplicate Check Precedes API Calls**
    - **Validates: Requirements 1.1, 1.6**
  
  - [ ]* 2.3 Write property test for duplicate handling completeness
    - **Property 3: Duplicate Handling Completeness**
    - **Validates: Requirements 1.3, 1.4, 1.5, 6.1, 10.1, 10.2, 10.3, 10.4**
  
  - [ ]* 2.4 Write property test for duplicate check error resilience
    - **Property 10: Duplicate Check Error Resilience**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  
  - [x] 2.5 Add format validation before duplicate checks
    - Insert format validation call before duplicate check in `processSingleEntry`
    - Skip entries with invalid format, mark as "invalid_format"
    - Log format validation failures with details
    - _Requirements: 8.4, 8.5_
  
  - [ ]* 2.6 Write property test for invalid format handling
    - **Property 8: Invalid Format Handling**
    - **Validates: Requirements 8.4**
  
  - [ ]* 2.7 Write property test for validation before duplicate check
    - **Property 9: Validation Before Duplicate Check**
    - **Validates: Requirements 8.5**

- [x] 3. Checkpoint - Ensure duplicate detection works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement analysis endpoint and confirmation modal
  - [x] 4.1 Create bulk verification analysis endpoint
    - Add `POST /api/identity/lists/:listId/analyze-bulk-verify` endpoint in `server.js`
    - Fetch all unverified entries for the list
    - For each entry: validate format, check for duplicates, categorize as verify/skip
    - Calculate cost estimate using cost calculator
    - Store analysis results in memory cache with 10-minute TTL and unique analysisId
    - Return analysis summary (totalEntries, toVerify, toSkip, skipReasons, costEstimate, identityTypeBreakdown)
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 4.2 Write unit tests for analysis endpoint
    - Test with mix of valid, invalid, and duplicate entries
    - Test cache storage and retrieval
    - Test cache expiration after 10 minutes
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [x] 4.3 Create BulkVerifyConfirmDialog component
    - Create `src/components/identity/BulkVerifyConfirmDialog.tsx`
    - Display total entries, entries to verify, entries to skip with breakdown
    - Display estimated cost with breakdown by identity type
    - Display identity type distribution
    - Provide Cancel and Confirm buttons
    - _Requirements: 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 4.4 Write property test for confirmation modal completeness
    - **Property 4: Confirmation Modal Completeness**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
  
  - [x] 4.5 Integrate confirmation modal into IdentityListDetail
    - Modify `handleBulkVerify` in `src/pages/admin/IdentityListDetail.tsx`
    - Call analysis endpoint when "Verify Unverified" is clicked
    - Show loading state during analysis
    - Display BulkVerifyConfirmDialog with analysis results
    - On confirm: call bulk-verify endpoint with analysisId
    - On cancel: close modal and abort operation
    - _Requirements: 3.1, 3.6, 3.7_
  
  - [ ]* 4.6 Write unit tests for confirmation flow
    - Test modal opens after clicking "Verify Unverified"
    - Test confirm proceeds with verification
    - Test cancel aborts without processing
    - _Requirements: 3.1, 3.6, 3.7_
  
  - [x] 4.7 Modify bulk-verify endpoint to accept analysisId
    - Update `POST /api/identity/lists/:listId/bulk-verify` to accept optional analysisId
    - If analysisId provided, retrieve cached analysis results
    - Skip re-analysis if cache hit, use cached categorization for entries
    - Handle cache miss (expired) by returning 410 Gone status
    - _Requirements: 3.6_

- [x] 5. Checkpoint - Ensure confirmation modal works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Fix polling lifecycle management
  - [x] 6.1 Add completed flag to job status response
    - Modify job status endpoint `GET /api/identity/bulk-verify/:jobId/status` in `server.js`
    - Add `completed: boolean` field to response (true when status is 'completed', 'error', or 'paused')
    - Add `skipReasons` breakdown to response
    - Add `costSavings` object with duplicatesSkipped, estimatedSaved, currency
    - _Requirements: 4.2, 6.2, 6.4_
  
  - [ ]* 6.2 Write property test for polling lifecycle termination
    - **Property 5: Polling Lifecycle Termination**
    - **Validates: Requirements 4.2, 4.3**
  
  - [x] 6.3 Update frontend polling logic to check completed flag
    - Modify `pollBulkVerifyProgress` in `src/pages/admin/IdentityListDetail.tsx`
    - Check `status.completed` instead of string matching on status
    - Stop polling when `completed === true`
    - Clear polling interval and set state to null
    - _Requirements: 4.3_
  
  - [ ]* 6.4 Write property test for polling only during active jobs
    - **Property 6: Polling Only During Active Jobs**
    - **Validates: Requirements 4.4**
  
  - [x] 6.5 Implement exponential backoff for polling
    - Modify polling interval logic to use exponential backoff (2s, 4s, 8s, 16s, max 30s)
    - Reset backoff on successful response
    - Increase backoff on network errors
    - _Requirements: 4.5_
  
  - [ ]* 6.6 Write unit tests for polling behavior
    - Test polling stops when completed flag is true
    - Test polling doesn't start without active job
    - Test exponential backoff on errors
    - _Requirements: 4.3, 4.4, 4.5_

- [x] 7. Enhance audit logging for cost savings
  - [x] 7.1 Update bulk verification completion logging
    - Modify `executeBulkVerification` to track duplicates skipped
    - Calculate cost savings (duplicates * API cost per type)
    - Include cost savings in completion audit log
    - Include skip reasons breakdown in audit log
    - _Requirements: 6.2, 6.4_
  
  - [ ]* 7.2 Write property test for audit log completeness
    - **Property 12: Audit Log Completeness**
    - **Validates: Requirements 6.2, 6.4**
  
  - [x] 7.3 Add duplicate skip tracking to job status
    - Update `bulkVerificationJobs` Map structure to include skipReasons and costSavings
    - Increment skipReasons counters when entries are skipped
    - Calculate costSavings based on duplicates skipped
    - _Requirements: 6.2, 6.4_

- [x] 8. Checkpoint - Ensure polling and audit logging work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Apply duplicate prevention to link sending
  - [x] 9.1 Create link sending analysis endpoint
    - Add `POST /api/identity/lists/:listId/analyze-send-links` endpoint in `server.js`
    - Perform same analysis as bulk-verify (format validation, duplicate detection)
    - Return analysis summary for link sending
    - Cache results with analysisId
    - _Requirements: 2.1_
  
  - [x] 9.2 Add duplicate check to link sending handler
    - Modify link sending endpoint to accept optional analysisId
    - Check for duplicates before generating/sending links
    - Skip duplicates with same metadata as bulk verification
    - Log skipped links with duplicate information
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 9.3 Write unit tests for link sending duplicate prevention
    - Test duplicate detection before link generation
    - Test metadata consistency with bulk verification
    - Test audit logging for skipped links
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 9.4 Add confirmation dialog for link sending
    - Create or reuse confirmation dialog for link sending in `src/pages/admin/IdentityListDetail.tsx`
    - Show analysis results before sending links
    - Display duplicates that will be skipped
    - Require user confirmation before proceeding
    - _Requirements: 2.1_

- [x] 10. Add database indexes and environment configuration
  - [x] 10.1 Create Firestore composite index
    - Add index definition to `firestore.indexes.json`
    - Index fields: identityType (Ascending), identityValue (Ascending), status (Ascending)
    - Deploy index to Firestore
    - _Requirements: 5.1_
  
  - [x] 10.2 Add cost configuration to environment variables
    - Add NIN_VERIFICATION_COST, BVN_VERIFICATION_COST, CAC_VERIFICATION_COST to `.env.example`
    - Add COST_CURRENCY to `.env.example`
    - Document configuration in README or deployment guide
    - _Requirements: 9.1, 9.3_
  
  - [x] 10.3 Update data model for duplicate tracking
    - Add optional fields to identity-entries: isDuplicateOf, duplicateDetectedAt, duplicateSkippedBy, skipReason, skipDetails
    - Update TypeScript types in `src/types/` if applicable
    - Document new fields in data model documentation
    - _Requirements: 1.3, 1.4_

- [x] 11. Integration testing and validation
  - [x]* 11.1 Write end-to-end integration test for duplicate prevention
    - Test: Create List A with verified entry, List B with same identity unverified
    - Verify: Bulk verification on List B skips duplicate with correct metadata
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x]* 11.2 Write integration test for confirmation modal flow
    - Test: List with valid, invalid, and duplicate entries
    - Verify: Modal shows correct counts, confirmation proceeds correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 11.3 Write integration test for polling lifecycle
    - Test: Start bulk verification, poll for status
    - Verify: Polling stops when job completes
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x]* 11.4 Write integration test for cost savings tracking
    - Test: Bulk verification with 50 entries, 20 duplicates
    - Verify: Audit log shows correct cost savings calculation
    - _Requirements: 6.2, 6.4_

- [x] 12. Final checkpoint - Complete system validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation follows a phased approach: infrastructure → integration → UI → enhancements
