# Implementation Plan: Analytics and Audit Fixes

## Overview

This implementation plan addresses three critical bugs in the analytics and audit logging system:
1. Cost Tracker missing failed verification costs
2. Budget save button providing no user feedback
3. Audit logs showing broker context instead of customer context

The implementation follows an incremental approach, fixing each issue independently with comprehensive testing.

## Tasks

- [x] 1. Fix Cost Tracker to include failed verification costs
  - [x] 1.1 Update backend cost tracking API to include failed calls
    - Modify `server.js` endpoint `/api/analytics/cost-tracking`
    - Change cost calculation to sum both `successCalls` and `failedCalls`
    - Update both Datapro and VerifyData cost calculations
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 1.2 Write property test for cost calculation completeness
    - **Property 1: Cost Calculation Completeness**
    - **Validates: Requirements 1.1, 1.2, 1.4**
  
  - [ ]* 1.3 Write property test for cost consistency across components
    - **Property 2: Cost Consistency Across Components**
    - **Validates: Requirements 1.3**
  
  - [ ]* 1.4 Write unit tests for cost calculation edge cases
    - Test with only successful calls
    - Test with only failed calls
    - Test with missing fields (defaults to 0)
    - Test for both providers (Datapro ₦50, VerifyData ₦100)
    - _Requirements: 1.1, 1.2_

- [x] 2. Add user feedback for budget save operations
  - [x] 2.1 Update CostTracker component to show toast notifications
    - Import `toast` from 'sonner' in `src/components/analytics/CostTracker.tsx`
    - Make `handleSaveBudget` function async
    - Wrap `onUpdateBudget` call in try-catch block
    - Display success toast on successful save
    - Display error toast on failure
    - Only close dialog on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 2.2 Write unit tests for budget save feedback
    - Test success toast is displayed on successful save
    - Test error toast is displayed on failed save
    - Test dialog closes on success
    - Test dialog remains open on failure
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Checkpoint - Verify cost tracking and budget feedback fixes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Fix audit logs to show customer context instead of broker context
  - [x] 4.1 Verify customer data extraction in verification endpoint
    - Review `server.js` POST `/api/identity/verify/:token` endpoint
    - Verify customer name extraction from `entry.data` (lines 10207-10217)
    - Verify customer email extraction from `entry.email`
    - Ensure extraction handles multiple field name variations (firstName, first_name, 'First Name')
    - _Requirements: 3.1, 3.2, 5.2_
  
  - [x] 4.2 Add logging for missing customer data
    - Add console warning when customer data fields are missing
    - Log which field variations were attempted
    - Help diagnose CSV upload issues
    - _Requirements: 5.3_
  
  - [x] 4.3 Verify audit log calls use customer context
    - Review `logVerificationComplete` calls in verification endpoint
    - Verify `userId`, `userName`, and `userEmail` parameters use customer data
    - Ensure `userType` is set to 'customer' for token-based verifications
    - _Requirements: 3.1, 3.2, 3.6_
  
  - [ ]* 4.4 Write property test for customer context in audit logs
    - **Property 3: Customer Context in Audit Logs**
    - **Validates: Requirements 3.1, 3.2, 3.6, 5.2, 5.4**
  
  - [ ]* 4.5 Write property test for audit log completeness
    - **Property 5: Audit Log Completeness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**
  
  - [ ]* 4.6 Write unit tests for customer context extraction
    - Test extraction with standard field names (firstName, lastName)
    - Test extraction with alternate field names (first_name, last_name)
    - Test extraction with Excel-style field names ('First Name', 'Last Name')
    - Test extraction for CAC (companyName variations)
    - Test fallback to "anonymous" when fields are missing
    - Test error logging when Identity_Entry not found
    - _Requirements: 3.1, 3.2, 5.2, 5.3_

- [x] 5. Verify AuditLogsViewer displays customer information correctly
  - [x] 5.1 Review AuditLogsViewer component
    - Verify "User" column displays `log.userName` (customer name)
    - Verify expanded row details display customer email
    - Ensure no broker information is displayed
    - _Requirements: 3.4, 3.5_
  
  - [ ]* 5.2 Write property test for customer info display in AuditLogsViewer
    - **Property 4: Customer Info Display in AuditLogsViewer**
    - **Validates: Requirements 3.4, 3.5**
  
  - [ ]* 5.3 Write unit tests for AuditLogsViewer display
    - Test customer name appears in "User" column
    - Test customer email appears in expanded row details
    - Test with multiple audit log entries
    - _Requirements: 3.4, 3.5_

- [ ] 6. Integration testing and verification
  - [ ]* 6.1 Write end-to-end test for cost tracking
    - Create test verifications (successful and failed)
    - Query cost tracking API
    - Verify total cost includes both types
    - Verify CostTracker and MetricsOverview show same value
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 6.2 Write end-to-end test for budget save feedback
    - Open Budget Configuration dialog
    - Change budget value
    - Click Save
    - Verify toast appears
    - Verify dialog closes (on success) or stays open (on failure)
    - Verify budget value is persisted
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 6.3 Write end-to-end test for audit logging
    - Create identity entry with customer data
    - Submit verification through token link
    - Query audit logs
    - Verify customer name and email appear in logs
    - Verify broker information does not appear
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The fixes are independent and can be implemented in any order
- Cost tracking fix is backend-only (server.js)
- Budget feedback fix is frontend-only (CostTracker.tsx)
- Audit logging fix requires verification of existing code, not major changes
