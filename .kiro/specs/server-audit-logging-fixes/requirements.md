# Requirements Document

## Introduction

This specification addresses critical security and compliance gaps in server.js where several imported audit logging and security functions are not being used. The server imports functions for logging verification attempts, security events, bulk operations, and API calls, but these functions are never invoked at the appropriate points in the code. This creates audit trail gaps that violate security compliance requirements and make it difficult to monitor system behavior, detect security incidents, and track API usage for billing purposes.

## Glossary

- **Server**: The Express.js backend application (server.js)
- **Audit_Logger**: The audit logging module (auditLogger.cjs) that provides functions for recording security and operational events
- **Security_Middleware**: The security middleware module (securityMiddleware.cjs) that provides security event logging
- **Verification_Endpoint**: API endpoints that perform NIN or CAC identity verification
- **Bulk_Operation**: Operations that process multiple verification requests in a batch
- **Health_Monitor**: The health monitoring service that tracks system health metrics
- **Rate_Limiter**: The rate limiting service that controls API request frequency
- **NIN**: National Identification Number (Nigerian identity document)
- **CAC**: Corporate Affairs Commission (Nigerian business registration)
- **CORS_Block**: Cross-Origin Resource Sharing policy violation
- **Authorization_Failure**: Access denial due to insufficient permissions
- **Graceful_Shutdown**: Orderly server termination that cleans up resources

## Requirements

### Requirement 1: NIN Verification Audit Logging

**User Story:** As a compliance officer, I want all NIN verification attempts to be logged to the audit trail, so that I can track identity verification activities for regulatory compliance.

#### Acceptance Criteria

1. WHEN a NIN verification request is received at /api/verify/nin, THE Server SHALL log the verification attempt before calling the verification API
2. WHEN a NIN verification succeeds, THE Server SHALL log the successful verification with masked NIN and matched fields
3. WHEN a NIN verification fails, THE Server SHALL log the failure with error code and reason
4. WHEN a customer verifies their NIN via /api/identity/verify/:token, THE Server SHALL log the verification attempt with the list ID and entry ID
5. THE Server SHALL mask sensitive NIN data in all audit logs (show only first 4 digits)

### Requirement 2: CAC Verification Audit Logging

**User Story:** As a compliance officer, I want all CAC verification attempts to be logged to the audit trail, so that I can track business verification activities for regulatory compliance.

#### Acceptance Criteria

1. WHEN a CAC verification request is received at /api/verify/cac, THE Server SHALL log the verification attempt before calling the verification API
2. WHEN a CAC verification succeeds, THE Server SHALL log the successful verification with masked RC number and matched fields
3. WHEN a CAC verification fails, THE Server SHALL log the failure with error code and reason
4. WHEN a customer verifies their CAC via /api/identity/verify/:token, THE Server SHALL log the verification attempt with the list ID and entry ID
5. THE Server SHALL mask sensitive CAC data in all audit logs (show only first 4 digits)

### Requirement 3: Bulk Verification Audit Logging

**User Story:** As a system administrator, I want bulk verification operations to be logged, so that I can track large-scale verification activities and identify potential abuse.

#### Acceptance Criteria

1. WHEN a bulk verification job starts at /api/identity/lists/:listId/bulk-verify, THE Server SHALL log the bulk operation start with list ID, entry count, and user ID
2. WHEN a bulk verification job completes, THE Server SHALL log the completion with success count, failure count, and duration
3. WHEN a bulk verification job is paused, THE Server SHALL log the pause event with current progress
4. WHEN a bulk verification job is resumed, THE Server SHALL log the resume event
5. WHEN a bulk verification job fails, THE Server SHALL log the failure with error details

### Requirement 4: Security Event Logging

**User Story:** As a security analyst, I want security events like CORS blocks and authorization failures to be properly logged, so that I can detect and respond to security threats.

#### Acceptance Criteria

1. WHEN a CORS policy blocks a request, THE Server SHALL use logSecurityEvent from securityMiddleware.cjs instead of the local logCORSBlock function
2. WHEN an authorization failure occurs, THE Server SHALL use logAuditSecurityEvent from auditLogger.cjs to record the security event
3. WHEN a validation failure occurs, THE Server SHALL use logAuditSecurityEvent to record the security event
4. THE Server SHALL include origin, IP address, user agent, and timestamp in all security event logs
5. THE Server SHALL categorize security events by severity (low, medium, high, critical)

### Requirement 5: API Call Logging

**User Story:** As a billing administrator, I want all external API calls to be logged, so that I can track API usage for cost allocation and billing purposes.

#### Acceptance Criteria

1. WHEN the Server calls the Datapro NIN verification API, THE Server SHALL use logAPICall from auditLogger.cjs to record the API call
2. WHEN the Server calls the VerifyData CAC verification API, THE Server SHALL use logAPICall to record the API call
3. THE Server SHALL include API endpoint, request parameters (masked), response status, and duration in API call logs
4. THE Server SHALL log API call costs if available from the API response
5. THE Server SHALL track API call success and failure rates for monitoring

### Requirement 6: Graceful Shutdown

**User Story:** As a system administrator, I want the server to shut down gracefully, so that all resources are properly cleaned up and no data is lost.

#### Acceptance Criteria

1. WHEN the Server receives a SIGTERM signal, THE Server SHALL initiate graceful shutdown
2. WHEN the Server receives a SIGINT signal (Ctrl+C), THE Server SHALL initiate graceful shutdown
3. WHEN graceful shutdown starts, THE Server SHALL call stopHealthMonitor to stop the health monitoring service
4. WHEN graceful shutdown starts, THE Server SHALL stop accepting new requests
5. WHEN graceful shutdown starts, THE Server SHALL wait for in-flight requests to complete before exiting
6. WHEN graceful shutdown completes, THE Server SHALL log the shutdown event and exit with code 0

### Requirement 7: Rate Limit Reset Endpoint

**User Story:** As a system administrator, I want an admin endpoint to reset rate limits, so that I can manually clear rate limits for legitimate users who have been blocked.

#### Acceptance Criteria

1. THE Server SHALL provide a POST endpoint at /api/admin/rate-limit/reset
2. WHEN the reset endpoint is called, THE Server SHALL require super admin authentication
3. WHEN the reset endpoint is called with a valid identifier, THE Server SHALL call resetDataproRateLimit to clear the rate limit
4. WHEN the rate limit is reset, THE Server SHALL log the reset action with admin user ID and target identifier
5. WHEN the reset endpoint is called without proper authentication, THE Server SHALL return 403 Forbidden

### Requirement 8: Queue Configuration Usage

**User Story:** As a developer, I want to understand if QUEUE_CONFIG is needed, so that I can either use it properly or remove the unused import.

#### Acceptance Criteria

1. THE Server SHALL review all queue-related code to determine if QUEUE_CONFIG is needed
2. IF QUEUE_CONFIG contains configuration values used by the queue system, THEN THE Server SHALL use QUEUE_CONFIG where appropriate
3. IF QUEUE_CONFIG is not needed, THEN THE Server SHALL remove the import to reduce code clutter
4. THE Server SHALL document the decision about QUEUE_CONFIG usage in code comments
5. THE Server SHALL ensure queue functionality works correctly regardless of QUEUE_CONFIG usage

### Requirement 9: Audit Log Consolidation

**User Story:** As a developer, I want to consolidate audit logging to use the proper audit logger functions, so that all audit logs are consistent and stored in the correct location.

#### Acceptance Criteria

1. THE Server SHALL replace all calls to local logging functions (logCORSBlock, logAuthorizationFailure, logValidationFailure) with calls to auditLogger.cjs functions
2. THE Server SHALL ensure all audit logs use consistent field names and formats
3. THE Server SHALL ensure all audit logs include required metadata (timestamp, user ID, IP address, action type)
4. THE Server SHALL ensure audit logs are written to the correct Firestore collection
5. THE Server SHALL maintain backward compatibility with existing audit log queries

### Requirement 10: Verification Attempt Tracking

**User Story:** As a compliance officer, I want to track all verification attempts including retries and failures, so that I can identify patterns of fraudulent activity.

#### Acceptance Criteria

1. WHEN a verification attempt is made, THE Server SHALL log the attempt before making the API call
2. WHEN a verification is retried due to rate limiting, THE Server SHALL log each retry attempt
3. WHEN a verification fails due to invalid data, THE Server SHALL log the validation errors
4. WHEN a verification fails due to API errors, THE Server SHALL log the API error code and message
5. THE Server SHALL track verification attempt counts per user and per list for rate limiting purposes
