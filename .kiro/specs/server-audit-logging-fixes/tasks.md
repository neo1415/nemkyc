# Implementation Plan: Server Audit Logging Fixes

## Overview

This implementation plan addresses critical security and compliance gaps by integrating unused audit logging functions into server.js. The work is organized into discrete tasks that build incrementally, with testing integrated throughout to validate functionality early.

## Tasks

- [x] 1. Remove unused QUEUE_CONFIG import
  - Remove QUEUE_CONFIG from the import statement on line ~115
  - Verify queue functionality still works correctly
  - _Requirements: 8.2, 8.3, 8.5_

- [x] 1.1 Write unit test for queue functionality
  - Test that queue operations work without QUEUE_CONFIG
  - _Requirements: 8.5_

- [x] 2. Implement verification attempt logging for NIN endpoint
  - [x] 2.1 Add logVerificationAttempt call before Datapro API call in /api/verify/nin (line ~4394)
    - Log with result: 'pending'
    - Include masked NIN, user ID, IP address
    - _Requirements: 1.1, 1.5_
  
  - [x] 2.2 Add logVerificationAttempt call after Datapro API call
    - Log with result: 'success' or 'failure'
    - Include error code and message if failed
    - Include matched/failed fields
    - _Requirements: 1.2, 1.3, 1.5_
  
  - [x] 2.3 Write property test for NIN verification logging
    - **Property 1: Verification Attempt Logging Completeness**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Test that all NIN verifications are logged with required fields
    - Use fast-check to generate random NIN verification requests
    - Verify audit log contains entries with correct data

- [x] 3. Implement verification attempt logging for CAC endpoint
  - [x] 3.1 Add logVerificationAttempt call before VerifyData API call in /api/verify/cac (line ~4483)
    - Log with result: 'pending'
    - Include masked CAC, user ID, IP address
    - _Requirements: 2.1, 2.5_
  
  - [x] 3.2 Add logVerificationAttempt call after VerifyData API call
    - Log with result: 'success' or 'failure'
    - Include error code and message if failed
    - Include matched/failed fields
    - _Requirements: 2.2, 2.3, 2.5_
  
  - [x] 3.3 Write property test for CAC verification logging
    - **Property 1: Verification Attempt Logging Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - Test that all CAC verifications are logged with required fields
    - Use fast-check to generate random CAC verification requests
    - Verify audit log contains entries with correct data


- [x] 4. Implement verification attempt logging for customer verification endpoint
  - [x] 4.1 Add logVerificationAttempt calls in /api/identity/verify/:token (line ~9818)
    - Add logging before and after NIN verification (around line ~9990)
    - Add logging before and after CAC verification (around line ~10104)
    - Include listId and entryId in metadata
    - _Requirements: 1.4, 2.4_
  
  - [x] 4.2 Write unit test for customer verification logging
    - Test that customer verifications include list and entry IDs
    - _Requirements: 1.4, 2.4_

- [x] 5. Write property test for sensitive data masking
  - **Property 2: Sensitive Data Masking**
  - **Validates: Requirements 1.5, 2.5**
  - Test that all identity numbers in audit logs are masked
  - Use fast-check to generate random identity numbers
  - Verify all logged values match masking pattern (4 digits + asterisks)

- [x] 6. Checkpoint - Verify verification logging works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement API call logging for Datapro
  - [x] 7.1 Add logAPICall after Datapro NIN verification API calls
    - Track start time before API call
    - Calculate duration after API call
    - Include masked request/response data
    - Include cost if available
    - Add to /api/verify/nin endpoint (line ~4394)
    - Add to /api/identity/verify/:token endpoint (line ~9990)
    - _Requirements: 5.1, 5.3, 5.4_
  
  - [x] 7.2 Write unit test for Datapro API call logging
    - Test that API calls are logged with required fields
    - _Requirements: 5.1, 5.3_

- [x] 8. Implement API call logging for VerifyData
  - [x] 8.1 Add logAPICall after VerifyData CAC verification API calls
    - Track start time before API call
    - Calculate duration after API call
    - Include masked request/response data
    - Include cost if available
    - Add to /api/verify/cac endpoint (line ~4483)
    - Add to /api/identity/verify/:token endpoint (line ~10104)
    - _Requirements: 5.2, 5.3, 5.4_
  
  - [x] 8.2 Write unit test for VerifyData API call logging
    - Test that API calls are logged with required fields
    - _Requirements: 5.2, 5.3_

- [x] 9. Write property test for API call logging
  - **Property 5: API Call Logging Completeness**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**
  - Test that all API calls are logged with required fields
  - Use fast-check to generate random API call scenarios
  - Verify audit log contains API call entries with correct data


- [x] 10. Implement bulk operation logging
  - [x] 10.1 Add logBulkOperation at bulk verification start
    - Add to /api/identity/lists/:listId/bulk-verify (line ~11668)
    - Log operation type: 'bulk_verification_start'
    - Include list ID, entry count, user ID
    - _Requirements: 3.1_
  
  - [x] 10.2 Add logBulkOperation at bulk verification completion
    - Add after bulk job completes
    - Log operation type: 'bulk_verification_complete'
    - Include success count, failure count, duration
    - _Requirements: 3.2_
  
  - [x] 10.3 Add logBulkOperation at bulk verification pause
    - Add to /api/identity/bulk-verify/:jobId/pause (line ~11879)
    - Log operation type: 'bulk_verification_pause'
    - Include current progress
    - _Requirements: 3.3_
  
  - [x] 10.4 Add logBulkOperation at bulk verification resume
    - Add to /api/identity/bulk-verify/:jobId/resume (line ~11940)
    - Log operation type: 'bulk_verification_resume'
    - Include resume progress
    - _Requirements: 3.4_
  
  - [x] 10.5 Add logBulkOperation for bulk verification failures
    - Add error handling to log failures
    - Include error details
    - _Requirements: 3.5_
  
  - [x] 10.6 Write property test for bulk operation logging
    - **Property 3: Bulk Operation Lifecycle Logging**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - Test that bulk operations are logged throughout lifecycle
    - Use fast-check to generate random bulk operation scenarios
    - Verify audit log contains all lifecycle events

- [x] 11. Checkpoint - Verify API and bulk logging works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Replace CORS block logging with logAuditSecurityEvent
  - [x] 12.1 Replace logCORSBlock call on line ~451
    - Use logAuditSecurityEvent instead
    - Set eventType: 'cors_block'
    - Set severity: 'medium'
    - Include origin, IP address, user agent
    - _Requirements: 4.1, 4.4, 4.5_
  
  - [x] 12.2 Remove local logCORSBlock function (line ~1896)
    - Delete the function definition
    - _Requirements: 9.1_

- [x] 13. Replace authorization failure logging with logAuditSecurityEvent
  - [x] 13.1 Replace logAuthorizationFailure call on line ~754
    - Use logAuditSecurityEvent instead
    - Set eventType: 'authorization_failure'
    - Set severity: 'high'
    - Include user ID, required roles, user role
    - _Requirements: 4.2, 4.4, 4.5_
  
  - [x] 13.2 Remove local logAuthorizationFailure function (line ~1791)
    - Delete the function definition
    - _Requirements: 9.1_


- [x] 14. Replace validation failure logging with logAuditSecurityEvent
  - [x] 14.1 Replace logValidationFailure call on line ~864
    - Use logAuditSecurityEvent instead
    - Set eventType: 'validation_failure'
    - Set severity: 'low'
    - Include validation errors, path, method
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [x] 14.2 Remove local logValidationFailure function (line ~1827)
    - Delete the function definition
    - _Requirements: 9.1_

- [x] 15. Write property test for security event logging
  - **Property 4: Security Event Logging with Audit Logger**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
  - Test that security events use logAuditSecurityEvent
  - Use fast-check to generate random security event scenarios
  - Verify audit log contains security events with correct format

- [x] 16. Write property test for audit log consistency
  - **Property 9: Audit Log Consistency**
  - **Validates: Requirements 9.2, 9.3, 9.4, 9.5**
  - Test that all audit logs have consistent field names and formats
  - Use fast-check to generate random audit events
  - Verify all logs include required metadata
  - Verify logs are written to correct Firestore collection
  - Verify backward compatibility with existing queries

- [x] 17. Checkpoint - Verify security event logging works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Implement graceful shutdown handlers
  - [x] 18.1 Create gracefulShutdown function at end of server.js
    - Stop accepting new connections (server.close())
    - Call stopHealthMonitor()
    - Log shutdown event with logAuditSecurityEvent
    - Wait for in-flight requests with 10-second timeout
    - Exit with code 0
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [x] 18.2 Register SIGTERM handler
    - Call gracefulShutdown('SIGTERM')
    - _Requirements: 6.1_
  
  - [x] 18.3 Register SIGINT handler
    - Call gracefulShutdown('SIGINT')
    - _Requirements: 6.2_
  
  - [x] 18.4 Register uncaughtException handler
    - Log critical error with logAuditSecurityEvent
    - Call gracefulShutdown
    - _Requirements: 6.6_
  
  - [x] 18.5 Register unhandledRejection handler
    - Log critical error with logAuditSecurityEvent
    - Don't exit (just log)
    - _Requirements: 6.6_
  
  - [x] 18.6 Write unit tests for graceful shutdown
    - Test SIGTERM handling
    - Test SIGINT handling
    - Test that stopHealthMonitor is called
    - Test shutdown event logging
    - _Requirements: 6.1, 6.2, 6.3, 6.6_


- [x] 19. Write property test for graceful shutdown
  - **Property 6: Graceful Shutdown Resource Cleanup**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
  - Test that shutdown handlers clean up resources properly
  - Test with different shutdown signals
  - Verify stopHealthMonitor is called
  - Verify shutdown event is logged

- [x] 20. Implement rate limit reset endpoint
  - [x] 20.1 Create POST /api/admin/rate-limit/reset endpoint
    - Add after existing admin endpoints
    - Require authentication (requireAuth)
    - Require super admin role (requireSuperAdmin)
    - Validate request body (service, reason)
    - _Requirements: 7.1, 7.2_
  
  - [x] 20.2 Implement rate limit reset logic
    - Call resetDataproRateLimit() or resetVerifydataRateLimit()
    - Based on service parameter
    - _Requirements: 7.3_
  
  - [x] 20.3 Add audit logging for rate limit resets
    - Use logAuditSecurityEvent
    - Set eventType: 'rate_limit_reset'
    - Set severity: 'medium'
    - Include service, reason, admin user ID
    - _Requirements: 7.4_
  
  - [x] 20.4 Return success response
    - Include service, resetBy, timestamp
    - _Requirements: 7.3_
  
  - [x] 20.5 Write unit tests for rate limit reset endpoint
    - Test with super admin (should succeed)
    - Test with non-super-admin (should return 403)
    - Test with invalid service (should return 400)
    - Test with missing reason (should return 400)
    - _Requirements: 7.1, 7.2, 7.5_

- [x] 21. Write property test for rate limit reset authorization
  - **Property 7: Rate Limit Reset Authorization**
  - **Validates: Requirements 7.2, 7.5**
  - Test that only super admins can reset rate limits
  - Use fast-check to generate random user roles
  - Verify non-super-admin requests are rejected with 403

- [x] 22. Write property test for rate limit reset audit trail
  - **Property 8: Rate Limit Reset Audit Trail**
  - **Validates: Requirements 7.3, 7.4**
  - Test that rate limit resets are logged
  - Use fast-check to generate random reset requests
  - Verify audit log contains reset events with correct metadata

- [x] 23. Checkpoint - Verify shutdown and rate limit reset works
  - Ensure all tests pass, ask the user if questions arise.


- [x] 24. Write property test for verification attempt ordering
  - **Property 10: Verification Attempt Ordering**
  - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
  - Test that verification attempts are logged before API calls
  - Use fast-check to generate random verification scenarios
  - Verify audit log entries are created before API calls
  - Test retry logging when rate limited
  - Test validation error logging
  - Test API error logging

- [ ] 25. Write integration tests
  - [ ] 25.1 End-to-end NIN verification with audit logging
    - Make NIN verification request
    - Verify audit log contains verification attempt
    - Verify audit log contains API call
    - _Requirements: 1.1, 1.2, 5.1_
  
  - [ ] 25.2 End-to-end CAC verification with audit logging
    - Make CAC verification request
    - Verify audit log contains verification attempt
    - Verify audit log contains API call
    - _Requirements: 2.1, 2.2, 5.2_
  
  - [ ] 25.3 End-to-end bulk verification with audit logging
    - Start bulk verification job
    - Verify audit log contains start event
    - Wait for completion
    - Verify audit log contains completion event
    - _Requirements: 3.1, 3.2_
  
  - [ ] 25.4 Server startup and shutdown cycle
    - Start server
    - Send SIGTERM
    - Verify graceful shutdown
    - Verify shutdown event logged
    - _Requirements: 6.1, 6.3, 6.6_
  
  - [ ] 25.5 Rate limit reset by super admin
    - Authenticate as super admin
    - Call rate limit reset endpoint
    - Verify rate limit is reset
    - Verify reset event logged
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 26. Final checkpoint - Ensure all tests pass
  - Run all unit tests
  - Run all property tests
  - Run all integration tests
  - Verify no regressions in existing functionality
  - Ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- All audit logging calls should be wrapped in try-catch to prevent failures from breaking core functionality
- Sensitive data (NIN, CAC) must be masked in all audit logs
- Graceful shutdown should have a 10-second timeout for in-flight requests
- Rate limit reset requires super admin authentication
