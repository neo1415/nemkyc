# Implementation Plan: Analytics Data Fixes

## Overview

This implementation plan fixes critical data integrity issues in the API Analytics Dashboard by:
1. Adding cost tracking to all API call logs
2. Ensuring proper timestamp storage in api-usage-logs
3. Adding broker attribution (userName, userEmail) to logged data
4. Eliminating duplicate audit log entries
5. Fixing analytics endpoint aggregations
6. Implementing functional filters in frontend and backend

The implementation follows a bottom-up approach: fix data collection first, then aggregation, then display.

## Tasks

- [x] 1. Add cost calculation and broker lookup helpers to apiUsageTracker.cjs
  - [x] 1.1 Implement calculateCost() helper function
    - Add function that returns ₦50 for successful Datapro calls, ₦100 for successful VerifyData calls, ₦0 for failures
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 1.2 Write property test for cost calculation
    - **Property 5: Datapro Success Cost**
    - **Property 6: VerifyData Success Cost**
    - **Property 7: Failed Verification Cost**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
  
  - [x] 1.3 Implement lookupBrokerInfo() helper function
    - Add async function that queries identity-lists and users collections to get broker information
    - Return { userId, userName, userEmail } or default to 'unknown' values if not found
    - _Requirements: 4.2, 4.3_
  
  - [x] 1.4 Write property test for broker lookup
    - **Property 8: Broker Attribution Data Presence**
    - **Validates: Requirements 4.2, 4.3**

- [x] 2. Update trackDataproAPICall() to store complete data
  - [x] 2.1 Modify trackDataproAPICall() function
    - Call calculateCost() to get cost value
    - Call lookupBrokerInfo() to get broker information
    - Add cost, userName, userEmail fields to api-usage-logs document
    - Ensure timestamp is stored as Firestore Timestamp (use new Date() or admin.firestore.Timestamp.now())
    - _Requirements: 1.1, 3.1, 3.3, 3.4, 4.2, 4.3_
  
  - [x] 2.2 Write property test for Datapro logging completeness
    - **Property 1: Timestamp Field Presence**
    - **Property 5: Datapro Success Cost**
    - **Property 8: Broker Attribution Data Presence**
    - **Validates: Requirements 1.1, 3.1, 3.4, 4.2, 4.3**

- [x] 3. Update trackVerifydataAPICall() to store complete data
  - [x] 3.1 Modify trackVerifydataAPICall() function
    - Call calculateCost() to get cost value
    - Call lookupBrokerInfo() to get broker information
    - Add cost, userName, userEmail fields to api-usage-logs document
    - Ensure timestamp is stored as Firestore Timestamp
    - _Requirements: 1.1, 3.2, 3.3, 3.4, 4.2, 4.3_
  
  - [x] 3.2 Write property test for VerifyData logging completeness
    - **Property 1: Timestamp Field Presence**
    - **Property 6: VerifyData Success Cost**
    - **Property 8: Broker Attribution Data Presence**
    - **Validates: Requirements 1.1, 3.2, 3.4, 4.2, 4.3**

- [x] 4. Update auditLogger.cjs to include cost and provider
  - [x] 4.1 Modify logVerificationAttempt() function signature
    - Add apiProvider parameter ('datapro' | 'verifydata')
    - Add cost parameter (number)
    - Store both fields in verification-audit-logs document
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.2_
  
  - [x] 4.2 Write property test for audit log completeness
    - **Property 4: Complete User Information in Audit Logs**
    - **Property 14: Broker Information in Customer Verifications**
    - **Validates: Requirements 2.2, 7.2, 7.4**

- [x] 5. Consolidate logging in server.js verification endpoints
  - [x] 5.1 Create logVerificationComplete() helper function in server.js
    - Accept all necessary parameters (provider, verificationType, success, listId, etc.)
    - Look up broker information from listId
    - Calculate cost based on provider and success
    - Call trackDataproAPICall() or trackVerifydataAPICall() with complete data
    - Call logVerificationAttempt() with complete data including cost and provider
    - _Requirements: 2.1, 2.3, 3.4, 7.2_
  
  - [x] 5.2 Replace duplicate logging calls in NIN verification endpoint
    - Find where both trackDataproAPICall() and logVerificationAttempt() are called
    - Replace with single call to logVerificationComplete()
    - _Requirements: 2.1, 2.3_
  
  - [x] 5.3 Replace duplicate logging calls in CAC verification endpoint
    - Find where both trackVerifydataAPICall() and logVerificationAttempt() are called
    - Replace with single call to logVerificationComplete()
    - _Requirements: 2.1, 2.3_
  
  - [x] 5.4 Write property test for single audit entry
    - **Property 3: Single Audit Log Entry Per Verification**
    - **Validates: Requirements 2.1, 2.3**

- [x] 6. Checkpoint - Verify data collection is working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Fix /api/analytics/overview endpoint
  - [x] 7.1 Update provider breakdown aggregation
    - Query api-usage-logs collection for date range
    - Count calls by apiProvider field
    - Return counts for datapro and verifydata
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [x] 7.2 Write property test for provider aggregation
    - **Property 9: Provider Aggregation Accuracy**
    - **Property 10: Non-Zero Provider Counts**
    - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 8. Fix /api/analytics/user-attribution endpoint
  - [x] 8.1 Update cost calculation logic
    - Sum cost field from api-usage-logs where cost > 0
    - Group by userId
    - Calculate individual and total costs
    - _Requirements: 8.1, 8.3, 8.4_
  
  - [x] 8.2 Write property test for cost calculations
    - **Property 15: Cost Calculation Accuracy**
    - **Property 16: Cost Aggregation Consistency**
    - **Validates: Requirements 8.1, 8.3, 8.4, 8.5**

- [x] 9. Add chart data endpoint or fix existing endpoint
  - [x] 9.1 Implement daily usage data aggregation
    - For each day in date range, query api-usage-logs
    - Count totalCalls, successfulCalls, failedCalls per day
    - Return array of daily data objects with date, totalCalls, successfulCalls, failedCalls
    - Sort chronologically by date
    - Return empty array if no data (not null)
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
  
  - [x] 9.2 Write property test for daily data
    - **Property 11: Daily Usage Data Completeness**
    - **Property 12: Chronological Sorting**
    - **Property 13: Empty Array for No Data**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

- [x] 10. Fix /api/analytics/audit-logs endpoint filtering
  - [x] 10.1 Add filter parameter handling
    - Accept startDate, endDate, provider, status, user query parameters
    - Build Firestore query with where clauses for each filter
    - Apply filters to verification-audit-logs query
    - _Requirements: 9.4_
  
  - [x] 10.2 Write property test for filter application
    - **Property 18: Filter Application Correctness**
    - **Validates: Requirements 9.4**

- [x] 11. Update success rate calculation
  - [x] 11.1 Implement success rate calculation helper
    - Calculate (successfulCalls / totalCalls) * 100
    - Handle division by zero (return 0)
    - Round to 2 decimal places
    - Use in overview and other endpoints
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 11.2 Write property test for success rate
    - **Property 19: Success Rate Calculation**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 12. Checkpoint - Verify backend endpoints are working
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Update frontend to pass filter parameters
  - [x] 13.1 Modify AdminAnalyticsDashboard.tsx (or equivalent)
    - Ensure filter state (startDate, endDate, provider, status) is passed to all API calls
    - Add query parameters to fetch requests
    - Trigger data refresh when filters change
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [x] 13.2 Write property test for filter parameter passing
    - **Property 17: Filter Parameter Passing**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 14. Update frontend to display timestamp data
  - [x] 14.1 Modify UserAttributionTable component
    - Ensure lastActivity timestamp is displayed
    - Format timestamp using ISO 8601 or user-friendly format
    - _Requirements: 1.2, 1.3_
  
  - [x] 14.2 Write unit test for timestamp display
    - Test that component renders timestamp when provided
    - Test that "Date unavailable" is shown when timestamp is missing
    - _Requirements: 1.3_

- [x] 15. Update frontend to display cost data
  - [x] 15.1 Modify AuditLogsViewer component
    - Ensure cost field is displayed for each audit log entry
    - Format cost as ₦50, ₦100, or ₦0
    - _Requirements: 3.5_
  
  - [x] 15.2 Write unit test for cost display
    - Test that component renders cost correctly
    - Test formatting of different cost values
    - _Requirements: 3.5_

- [x] 16. Update frontend to display broker names
  - [x] 16.1 Modify AuditLogsViewer and UserAttributionTable components
    - Display userName and userEmail from API response
    - Show actual broker names instead of "anonymous" or "unknown"
    - _Requirements: 4.4, 7.4_
  
  - [x] 16.2 Write unit test for broker name display
    - Test that component renders broker names when provided
    - Test fallback to "unknown" when data is missing
    - _Requirements: 4.4, 7.4_

- [x] 17. Update frontend charts to display data
  - [x] 17.1 Modify UsageCharts component
    - Ensure component receives daily usage data from API
    - Render line charts with totalCalls, successfulCalls, failedCalls
    - Handle empty data gracefully (show "No data" message)
    - _Requirements: 6.4_
  
  - [x] 17.2 Write unit test for chart rendering
    - Test that charts render when data is provided
    - Test that "No data" message shows when array is empty
    - _Requirements: 6.4_

- [x] 18. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for complete bug fixes
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and UI rendering
- The implementation follows a bottom-up approach: data collection → aggregation → display
- All logging operations should be wrapped in try-catch to prevent breaking main flows
