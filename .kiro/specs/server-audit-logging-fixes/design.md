# Design Document: Server Audit Logging Fixes

## Overview

This design addresses critical security and compliance gaps in server.js where imported audit logging and security functions are not being used. The server currently imports functions from `auditLogger.cjs`, `securityMiddleware.cjs`, `healthMonitor.cjs`, and `rateLimiter.cjs` but fails to invoke them at appropriate points in the code. This creates audit trail gaps that violate security compliance requirements.

The solution involves integrating these unused functions into the appropriate locations in server.js to ensure:
- All verification attempts (NIN/CAC) are logged to the audit trail
- Security events (CORS blocks, authorization failures) are properly logged
- Bulk operations are audited
- API calls are logged for compliance and billing
- The server shuts down gracefully with proper resource cleanup
- Rate limits can be manually reset by administrators

## Architecture

### Current State

The server.js file imports the following functions but never uses them:
- `resetDataproRateLimit` from rateLimiter.cjs
- `logSecurityEvent` from securityMiddleware.cjs
- `logVerificationAttempt` from auditLogger.cjs
- `logAPICall` from auditLogger.cjs
- `logAuditSecurityEvent` from auditLogger.cjs (aliased as logAuditSecurityEvent)
- `logBulkOperation` from auditLogger.cjs
- `QUEUE_CONFIG` from verificationQueue.cjs
- `stopHealthMonitor` from healthMonitor.cjs

Additionally, server.js has local logging functions that should be replaced:
- `logCORSBlock` - should use `logAuditSecurityEvent` instead
- `logAuthorizationFailure` - should use `logAuditSecurityEvent` instead
- `logValidationFailure` - should use `logAuditSecurityEvent` instead

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         server.js                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Verification Endpoints                      │    │
│  │  - /api/verify/nin                                  │    │
│  │  - /api/verify/cac                                  │    │
│  │  - /api/identity/verify/:token                      │    │
│  │  - /api/identity/lists/:listId/bulk-verify          │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Audit Logging Integration                   │    │
│  │  - logVerificationAttempt()                         │    │
│  │  - logAPICall()                                     │    │
│  │  - logBulkOperation()                               │    │
│  │  - logAuditSecurityEvent()                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Security Event Logging                      │    │
│  │  - CORS blocks                                      │    │
│  │  - Authorization failures                           │    │
│  │  - Validation failures                              │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Graceful Shutdown Handler                   │    │
│  │  - SIGTERM/SIGINT listeners                         │    │
│  │  - stopHealthMonitor()                              │    │
│  │  - Close server connections                         │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Admin Endpoints                             │    │
│  │  - POST /api/admin/rate-limit/reset                 │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Modules                           │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  auditLogger.cjs │  │securityMiddleware│                │
│  │                  │  │      .cjs        │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ healthMonitor    │  │  rateLimiter     │                │
│  │      .cjs        │  │      .cjs        │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐                                       │
│  │verificationQueue │                                       │
│  │      .cjs        │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      Firestore                               │
│                                                              │
│  - verification-audit-logs (audit trail)                    │
│  - api-usage (cost tracking)                                │
│  - system-alerts (health monitoring)                        │
└─────────────────────────────────────────────────────────────┘
```


## Components and Interfaces

### 1. Verification Logging Integration

**Location:** Verification endpoints in server.js
- `/api/verify/nin` (line ~4394)
- `/api/verify/cac` (line ~4483)
- `/api/identity/verify/:token` (line ~9818)

**Integration Points:**

```javascript
// Before calling verification API
await logVerificationAttempt({
  verificationType: 'NIN' | 'CAC',
  identityNumber: nin || cac, // Will be masked by function
  userId: req.user?.uid || 'anonymous',
  userEmail: req.user?.email || 'anonymous',
  ipAddress: req.ip,
  result: 'pending',
  metadata: {
    userAgent: req.headers['user-agent'],
    listId: entry?.listId,
    entryId: entryDoc?.id
  }
});

// After verification completes
await logVerificationAttempt({
  verificationType: 'NIN' | 'CAC',
  identityNumber: nin || cac,
  userId: req.user?.uid || 'anonymous',
  userEmail: req.user?.email || 'anonymous',
  ipAddress: req.ip,
  result: verificationResult.success ? 'success' : 'failure',
  errorCode: verificationResult.errorCode,
  errorMessage: verificationResult.message,
  metadata: {
    userAgent: req.headers['user-agent'],
    fieldsValidated: verificationResult.fieldsValidated,
    failedFields: verificationResult.failedFields,
    listId: entry?.listId,
    entryId: entryDoc?.id
  }
});
```


### 2. API Call Logging Integration

**Location:** After Datapro and VerifyData API calls

**Integration Points:**

```javascript
// After Datapro NIN verification API call
const startTime = Date.now();
const dataproResult = await dataproVerifyNIN(decryptedNIN);
const duration = Date.now() - startTime;

await logAPICall({
  apiName: 'Datapro',
  endpoint: '/verifynin',
  method: 'GET',
  requestData: { nin: decryptedNIN }, // Will be masked
  statusCode: dataproResult.success ? 200 : 400,
  responseData: dataproResult, // Will be masked
  duration,
  userId: req.user?.uid || 'anonymous',
  ipAddress: req.ip,
  metadata: {
    listId: entry?.listId,
    entryId: entryDoc?.id,
    cost: dataproResult.cost || 0
  }
});

// After VerifyData CAC verification API call
const startTime = Date.now();
const verifydataResult = await verifydataVerifyCAC(decryptedCAC);
const duration = Date.now() - startTime;

await logAPICall({
  apiName: 'VerifyData',
  endpoint: '/api/ValidateRcNumber/Initiate',
  method: 'POST',
  requestData: { rcNumber: decryptedCAC }, // Will be masked
  statusCode: verifydataResult.success ? 200 : 400,
  responseData: verifydataResult, // Will be masked
  duration,
  userId: req.user?.uid || 'anonymous',
  ipAddress: req.ip,
  metadata: {
    listId: entry?.listId,
    entryId: entryDoc?.id,
    cost: verifydataResult.cost || 0
  }
});
```


### 3. Bulk Operation Logging Integration

**Location:** Bulk verification endpoints
- `/api/identity/lists/:listId/bulk-verify` (line ~11668)
- `/api/identity/bulk-verify/:jobId/pause` (line ~11879)
- `/api/identity/bulk-verify/:jobId/resume` (line ~11940)

**Integration Points:**

```javascript
// At bulk verification start
await logBulkOperation({
  operationType: 'bulk_verification_start',
  totalRecords: entries.length,
  successCount: 0,
  failureCount: 0,
  userId: req.user.uid,
  userEmail: req.user.email,
  metadata: {
    listId,
    jobId,
    verificationType: 'NIN' // or 'CAC'
  }
});

// At bulk verification completion
await logBulkOperation({
  operationType: 'bulk_verification_complete',
  totalRecords: job.totalEntries,
  successCount: job.successCount,
  failureCount: job.failureCount,
  userId: job.userId,
  userEmail: job.userEmail,
  metadata: {
    listId: job.listId,
    jobId: job.id,
    duration: Date.now() - job.startTime,
    verificationType: job.verificationType
  }
});

// At bulk verification pause
await logBulkOperation({
  operationType: 'bulk_verification_pause',
  totalRecords: job.totalEntries,
  successCount: job.successCount,
  failureCount: job.failureCount,
  userId: req.user.uid,
  userEmail: req.user.email,
  metadata: {
    listId: job.listId,
    jobId,
    currentProgress: job.processedCount
  }
});

// At bulk verification resume
await logBulkOperation({
  operationType: 'bulk_verification_resume',
  totalRecords: job.totalEntries,
  successCount: job.successCount,
  failureCount: job.failureCount,
  userId: req.user.uid,
  userEmail: req.user.email,
  metadata: {
    listId: job.listId,
    jobId,
    resumeProgress: job.processedCount
  }
});
```


### 4. Security Event Logging Integration

**Location:** Replace local logging functions with audit logger functions

**Current Implementation (to be replaced):**

```javascript
// Line ~451 - CORS block logging
logCORSBlock(origin, null).catch(err => console.error('Failed to log CORS block:', err));

// Line ~754 - Authorization failure logging
logAuthorizationFailure(req, allowedRoles, userRole).catch(err => 
  console.error('Failed to log authorization failure:', err)
);

// Line ~864 - Validation failure logging
logValidationFailure(req, errors.array()).catch(err => 
  console.error('Failed to log validation failure:', err)
);
```

**New Implementation:**

```javascript
// CORS block logging (line ~451)
await logAuditSecurityEvent({
  eventType: 'cors_block',
  severity: 'medium',
  description: `CORS policy blocked request from origin: ${origin}`,
  userId: 'anonymous',
  ipAddress: req?.ip || 'unknown',
  metadata: {
    origin,
    path: req?.path,
    method: req?.method,
    userAgent: req?.headers['user-agent']
  }
});

// Authorization failure logging (line ~754)
await logAuditSecurityEvent({
  eventType: 'authorization_failure',
  severity: 'high',
  description: `User ${req.user.email} attempted to access resource requiring roles: ${allowedRoles.join(', ')}`,
  userId: req.user.uid,
  ipAddress: req.ip,
  metadata: {
    userRole,
    requiredRoles: allowedRoles,
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent']
  }
});

// Validation failure logging (line ~864)
await logAuditSecurityEvent({
  eventType: 'validation_failure',
  severity: 'low',
  description: `Validation failed for ${req.path}`,
  userId: req.user?.uid || 'anonymous',
  ipAddress: req.ip,
  metadata: {
    errors: errors.array(),
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent']
  }
});
```

**Remove Local Functions:**

The following local functions should be removed from server.js after migration:
- `logCORSBlock` (line ~1896)
- `logAuthorizationFailure` (line ~1791)
- `logValidationFailure` (line ~1827)


### 5. Graceful Shutdown Implementation

**Location:** End of server.js file (after server starts listening)

**Implementation:**

```javascript
// Graceful shutdown handler
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log(`⚠️  Already shutting down, ignoring ${signal}`);
    return;
  }
  
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  // Stop health monitor
  try {
    stopHealthMonitor();
    console.log('✅ Health monitor stopped');
  } catch (error) {
    console.error('❌ Error stopping health monitor:', error);
  }
  
  // Log shutdown event
  try {
    await logAuditSecurityEvent({
      eventType: 'server_shutdown',
      severity: 'medium',
      description: `Server shutting down due to ${signal}`,
      userId: 'system',
      ipAddress: 'localhost',
      metadata: {
        signal,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Shutdown event logged');
  } catch (error) {
    console.error('❌ Error logging shutdown:', error);
  }
  
  // Wait for in-flight requests (with timeout)
  setTimeout(() => {
    console.log('⏱️  Forcing shutdown after timeout');
    process.exit(0);
  }, 10000); // 10 second timeout
  
  // Exit cleanly
  console.log('✅ Graceful shutdown complete');
  process.exit(0);
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await logAuditSecurityEvent({
    eventType: 'uncaught_exception',
    severity: 'critical',
    description: `Uncaught exception: ${error.message}`,
    userId: 'system',
    ipAddress: 'localhost',
    metadata: {
      error: error.stack,
      timestamp: new Date().toISOString()
    }
  });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  await logAuditSecurityEvent({
    eventType: 'unhandled_rejection',
    severity: 'critical',
    description: `Unhandled promise rejection: ${reason}`,
    userId: 'system',
    ipAddress: 'localhost',
    metadata: {
      reason: String(reason),
      timestamp: new Date().toISOString()
    }
  });
});
```


### 6. Rate Limit Reset Endpoint

**Location:** New admin endpoint in server.js

**Implementation:**

```javascript
/**
 * Reset rate limiter for Datapro API
 * Allows super admins to manually clear rate limits
 * 
 * POST /api/admin/rate-limit/reset
 * 
 * Body:
 * {
 *   "service": "datapro" | "verifydata",
 *   "reason": "string"
 * }
 */
app.post('/api/admin/rate-limit/reset', 
  requireAuth, 
  requireSuperAdmin, 
  [
    body('service')
      .isIn(['datapro', 'verifydata'])
      .withMessage('Service must be either datapro or verifydata'),
    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Reason is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be 10-500 characters'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { service, reason } = req.body;
      
      // Reset the appropriate rate limiter
      if (service === 'datapro') {
        resetDataproRateLimit();
      } else {
        resetVerifydataRateLimit();
      }
      
      // Log the reset action
      await logAuditSecurityEvent({
        eventType: 'rate_limit_reset',
        severity: 'medium',
        description: `Rate limit reset for ${service} by ${req.user.email}`,
        userId: req.user.uid,
        ipAddress: req.ip,
        metadata: {
          service,
          reason,
          adminEmail: req.user.email,
          adminRole: req.user.role,
          timestamp: new Date().toISOString()
        }
      });
      
      console.log(`✅ Rate limit reset for ${service} by ${req.user.email}`);
      
      res.json({
        success: true,
        message: `Rate limit for ${service} has been reset`,
        service,
        resetBy: req.user.email,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error resetting rate limit:', error);
      res.status(500).json({
        error: 'Failed to reset rate limit',
        message: error.message
      });
    }
  }
);
```


### 7. QUEUE_CONFIG Usage Analysis

**Current State:**
- `QUEUE_CONFIG` is imported from `verificationQueue.cjs`
- The import is unused in server.js
- Need to determine if configuration is needed

**Analysis:**

Reviewing the verificationQueue.cjs module, QUEUE_CONFIG contains:
```javascript
const QUEUE_CONFIG = {
  MAX_QUEUE_SIZE: 1000,
  PROCESSING_BATCH_SIZE: 10,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
  TIMEOUT_MS: 30000
};
```

**Decision:**

The queue functions (`enqueue`, `getQueueStatus`, etc.) already use QUEUE_CONFIG internally. The server.js file does not need direct access to these configuration values. The import should be removed to reduce code clutter.

**Rationale:**
- Queue configuration is encapsulated within the queue module
- Server.js interacts with the queue through its public API
- No need to expose configuration constants to server.js
- Removing unused imports improves code maintainability

**Action:**
Remove the QUEUE_CONFIG import from server.js line ~115:
```javascript
// BEFORE
const {
  enqueue: enqueueVerification,
  getQueueStatus,
  getUserQueueItems,
  getQueueStats,
  QUEUE_CONFIG  // <-- Remove this
} = require('./server-utils/verificationQueue.cjs');

// AFTER
const {
  enqueue: enqueueVerification,
  getQueueStatus,
  getUserQueueItems,
  getQueueStats
} = require('./server-utils/verificationQueue.cjs');
```


## Data Models

### Audit Log Entry

All audit logs are stored in the `verification-audit-logs` Firestore collection with the following structure:

```typescript
interface AuditLogEntry {
  // Event identification
  eventType: 'verification_attempt' | 'api_call' | 'security_event' | 'bulk_operation' | 'encryption_operation';
  
  // Verification attempt fields (when eventType === 'verification_attempt')
  verificationType?: 'NIN' | 'CAC';
  identityNumberMasked?: string; // First 4 digits + asterisks
  result?: 'pending' | 'success' | 'failure' | 'error';
  errorCode?: string;
  errorMessage?: string;
  
  // API call fields (when eventType === 'api_call')
  apiName?: 'Datapro' | 'VerifyData';
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requestDataMasked?: object; // Sensitive fields masked
  statusCode?: number;
  responseDataMasked?: object; // Sensitive fields masked
  duration?: number; // milliseconds
  
  // Security event fields (when eventType === 'security_event')
  securityEventType?: 'cors_block' | 'authorization_failure' | 'validation_failure' | 'rate_limit_reset' | 'server_shutdown';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  
  // Bulk operation fields (when eventType === 'bulk_operation')
  operationType?: 'bulk_verification_start' | 'bulk_verification_complete' | 'bulk_verification_pause' | 'bulk_verification_resume';
  totalRecords?: number;
  successCount?: number;
  failureCount?: number;
  successRate?: number; // percentage
  
  // Common fields
  userId: string; // User ID or 'anonymous' or 'system'
  userEmail?: string;
  ipAddress: string;
  
  // Metadata
  metadata: {
    userAgent?: string;
    listId?: string;
    entryId?: string;
    jobId?: string;
    cost?: number;
    fieldsValidated?: string[];
    failedFields?: string[];
    [key: string]: any;
  };
  
  // Timestamp
  createdAt: Firestore.Timestamp;
}
```


### Rate Limit Reset Request

```typescript
interface RateLimitResetRequest {
  service: 'datapro' | 'verifydata';
  reason: string; // 10-500 characters
}

interface RateLimitResetResponse {
  success: boolean;
  message: string;
  service: string;
  resetBy: string; // Admin email
  timestamp: string; // ISO 8601
}
```

### Graceful Shutdown Event

```typescript
interface ShutdownEvent {
  eventType: 'server_shutdown';
  severity: 'medium';
  description: string; // e.g., "Server shutting down due to SIGTERM"
  userId: 'system';
  ipAddress: 'localhost';
  metadata: {
    signal: 'SIGTERM' | 'SIGINT' | 'UNCAUGHT_EXCEPTION';
    uptime: number; // seconds
    timestamp: string; // ISO 8601
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Verification Attempt Logging Completeness

*For any* verification request (NIN or CAC), the audit log SHALL contain an entry with the verification type, masked identity number, result status, and timestamp.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4**

**Rationale:** This property ensures that all verification attempts are logged regardless of success or failure. By testing across all verification types and outcomes, we verify comprehensive audit trail coverage.

### Property 2: Sensitive Data Masking

*For any* audit log entry containing identity numbers (NIN or CAC), the logged value SHALL show only the first 4 characters followed by asterisks.

**Validates: Requirements 1.5, 2.5**

**Rationale:** This property ensures sensitive data is never stored in plaintext in audit logs. The masking pattern (4 visible characters + asterisks) provides enough information for debugging while protecting privacy.

### Property 3: Bulk Operation Lifecycle Logging

*For any* bulk verification operation, the audit log SHALL contain entries for start, completion (or failure), and any pause/resume events with accurate record counts.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

**Rationale:** This property ensures bulk operations are fully auditable throughout their lifecycle. Testing across different operation states verifies complete tracking.

### Property 4: Security Event Logging with Audit Logger

*For any* security event (CORS block, authorization failure, validation failure), the audit log SHALL use logAuditSecurityEvent and include event type, severity, user ID, IP address, and timestamp.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

**Rationale:** This property ensures security events are logged consistently using the correct audit logger function. Testing across different security event types verifies proper integration.

### Property 5: API Call Logging Completeness

*For any* external API call (Datapro or VerifyData), the audit log SHALL contain an entry with API name, endpoint, masked request/response data, status code, and duration.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

**Rationale:** This property ensures all external API calls are logged for billing and monitoring. Testing across different APIs and outcomes verifies comprehensive tracking.


### Property 6: Graceful Shutdown Resource Cleanup

*For any* shutdown signal (SIGTERM or SIGINT), the server SHALL call stopHealthMonitor, stop accepting new connections, wait for in-flight requests, and log the shutdown event before exiting.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

**Rationale:** This property ensures the server shuts down cleanly without resource leaks or data loss. Testing with different signals verifies proper cleanup.

### Property 7: Rate Limit Reset Authorization

*For any* request to the rate limit reset endpoint, the server SHALL require super admin authentication and reject requests from non-super-admin users with 403 Forbidden.

**Validates: Requirements 7.2, 7.5**

**Rationale:** This property ensures only authorized administrators can reset rate limits. Testing with different user roles verifies proper access control.

### Property 8: Rate Limit Reset Audit Trail

*For any* successful rate limit reset, the audit log SHALL contain an entry with the service name, admin user ID, reason, and timestamp.

**Validates: Requirements 7.3, 7.4**

**Rationale:** This property ensures rate limit resets are auditable. Testing verifies that administrative actions are properly logged.

### Property 9: Audit Log Consistency

*For any* audit log entry, the entry SHALL include required metadata fields (timestamp, user ID, IP address, action type) and use consistent field names matching the auditLogger.cjs schema.

**Validates: Requirements 9.2, 9.3, 9.4, 9.5**

**Rationale:** This property ensures all audit logs follow a consistent format. Testing across different event types verifies schema compliance and backward compatibility.

### Property 10: Verification Attempt Ordering

*For any* verification request, the audit log SHALL contain an entry logged before the API call is made, ensuring attempt tracking even if the API call fails.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

**Rationale:** This property ensures verification attempts are logged before external API calls, providing a complete audit trail even when APIs fail. Testing verifies correct logging order.


## Error Handling

### Audit Logging Failures

**Strategy:** Audit logging failures should not break the application. All audit logging calls should be wrapped in try-catch blocks or use `.catch()` handlers.

```javascript
// Pattern for audit logging
try {
  await logVerificationAttempt(params);
} catch (error) {
  console.error('Failed to log verification attempt:', error);
  // Continue execution - don't throw
}

// Or with promises
logVerificationAttempt(params).catch(err => 
  console.error('Failed to log verification attempt:', err)
);
```

**Rationale:** Audit logging is important but should not prevent core functionality from working. If Firestore is temporarily unavailable, verification requests should still be processed.

### Graceful Shutdown Timeout

**Strategy:** Implement a timeout for graceful shutdown to prevent the server from hanging indefinitely.

```javascript
// Wait for in-flight requests (with timeout)
setTimeout(() => {
  console.log('⏱️  Forcing shutdown after timeout');
  process.exit(0);
}, 10000); // 10 second timeout
```

**Rationale:** In-flight requests should be allowed to complete, but the server should not wait forever. A 10-second timeout provides a reasonable balance.

### Rate Limit Reset Validation

**Strategy:** Validate rate limit reset requests to prevent abuse.

```javascript
// Validation rules
body('service').isIn(['datapro', 'verifydata']),
body('reason').trim().notEmpty().isLength({ min: 10, max: 500 })
```

**Rationale:** Requiring a reason for rate limit resets creates accountability and prevents accidental resets.

### API Call Logging Errors

**Strategy:** If API call logging fails, log the error but continue processing the verification result.

```javascript
try {
  await logAPICall(params);
} catch (error) {
  console.error('Failed to log API call:', error);
  // Don't throw - return verification result to user
}
```

**Rationale:** Users should receive their verification results even if audit logging fails.


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

**Unit Tests:**
- Test specific examples of audit logging (one NIN verification, one CAC verification)
- Test edge cases (empty fields, missing metadata)
- Test error conditions (Firestore unavailable, invalid data)
- Test graceful shutdown with SIGTERM and SIGINT signals
- Test rate limit reset endpoint with different user roles
- Test integration between server.js and audit logger modules

**Property-Based Tests:**
- Test verification logging across many random verification requests
- Test data masking across many random identity numbers
- Test bulk operation logging across many random bulk jobs
- Test security event logging across many random security events
- Test API call logging across many random API calls
- Test audit log consistency across many random event types

**Property-Based Testing Configuration:**

- Library: Use `fast-check` for JavaScript/Node.js property-based testing
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `// Feature: server-audit-logging-fixes, Property {number}: {property_text}`

**Example Property Test:**

```javascript
const fc = require('fast-check');

describe('Property 1: Verification Attempt Logging Completeness', () => {
  // Feature: server-audit-logging-fixes, Property 1: For any verification request (NIN or CAC), the audit log SHALL contain an entry with the verification type, masked identity number, result status, and timestamp
  
  it('should log all verification attempts with required fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          verificationType: fc.constantFrom('NIN', 'CAC'),
          identityNumber: fc.string({ minLength: 11, maxLength: 11 }),
          result: fc.constantFrom('success', 'failure', 'error'),
          userId: fc.uuid(),
          ipAddress: fc.ipV4()
        }),
        async (verificationData) => {
          // Make verification request
          const response = await makeVerificationRequest(verificationData);
          
          // Query audit log
          const auditLogs = await queryAuditLogs({
            eventType: 'verification_attempt',
            userId: verificationData.userId
          });
          
          // Verify log entry exists with required fields
          const logEntry = auditLogs.find(log => 
            log.verificationType === verificationData.verificationType
          );
          
          expect(logEntry).toBeDefined();
          expect(logEntry.identityNumberMasked).toMatch(/^\d{4}\*+$/);
          expect(logEntry.result).toBe(verificationData.result);
          expect(logEntry.createdAt).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```


### Test Coverage Requirements

**Unit Test Coverage:**
1. NIN verification logging (success and failure cases)
2. CAC verification logging (success and failure cases)
3. Customer verification logging with list/entry IDs
4. Bulk operation start/complete/pause/resume logging
5. CORS block logging with logAuditSecurityEvent
6. Authorization failure logging with logAuditSecurityEvent
7. Validation failure logging with logAuditSecurityEvent
8. Datapro API call logging
9. VerifyData API call logging
10. Graceful shutdown with SIGTERM
11. Graceful shutdown with SIGINT
12. Rate limit reset endpoint (authorized)
13. Rate limit reset endpoint (unauthorized - 403)
14. Rate limit reset audit logging
15. QUEUE_CONFIG import removal verification

**Property Test Coverage:**
1. Property 1: Verification attempt logging completeness (100+ runs)
2. Property 2: Sensitive data masking (100+ runs)
3. Property 3: Bulk operation lifecycle logging (100+ runs)
4. Property 4: Security event logging with audit logger (100+ runs)
5. Property 5: API call logging completeness (100+ runs)
6. Property 6: Graceful shutdown resource cleanup (100+ runs)
7. Property 7: Rate limit reset authorization (100+ runs)
8. Property 8: Rate limit reset audit trail (100+ runs)
9. Property 9: Audit log consistency (100+ runs)
10. Property 10: Verification attempt ordering (100+ runs)

**Integration Test Coverage:**
1. End-to-end NIN verification with audit logging
2. End-to-end CAC verification with audit logging
3. End-to-end bulk verification with audit logging
4. Server startup and shutdown cycle
5. Rate limit reset by super admin
6. Audit log query and retrieval

### Test Data Requirements

**For Property Tests:**
- Random NIN numbers (11 digits)
- Random CAC/RC numbers (various formats)
- Random user IDs (UUIDs)
- Random IP addresses (IPv4 and IPv6)
- Random verification results (success, failure, error)
- Random error codes and messages
- Random bulk operation sizes (1-1000 records)
- Random user roles (default, broker, claims, compliance, admin, super admin)

**For Unit Tests:**
- Valid NIN: "12345678901"
- Valid CAC: "RC123456"
- Invalid NIN: "invalid"
- Invalid CAC: "invalid"
- Test user IDs: "test-user-1", "test-admin-1", "test-super-admin-1"
- Test IP addresses: "127.0.0.1", "192.168.1.1"


## Implementation Notes

### Code Locations

**Files to Modify:**
- `server.js` - Main server file (primary changes)

**Specific Line Numbers:**
- Line ~115: Remove QUEUE_CONFIG from import
- Line ~451: Replace logCORSBlock with logAuditSecurityEvent
- Line ~754: Replace logAuthorizationFailure with logAuditSecurityEvent
- Line ~864: Replace logValidationFailure with logAuditSecurityEvent
- Line ~1791-1860: Remove local logAuthorizationFailure function
- Line ~1827-1860: Remove local logValidationFailure function
- Line ~1896-1920: Remove local logCORSBlock function
- Line ~4394: Add audit logging to /api/verify/nin endpoint
- Line ~4483: Add audit logging to /api/verify/cac endpoint
- Line ~9818: Add audit logging to /api/identity/verify/:token endpoint
- Line ~11668: Add bulk operation logging to /api/identity/lists/:listId/bulk-verify
- Line ~11879: Add bulk operation logging to /api/identity/bulk-verify/:jobId/pause
- Line ~11940: Add bulk operation logging to /api/identity/bulk-verify/:jobId/resume
- End of file (~12936): Add graceful shutdown handlers
- After admin endpoints: Add rate limit reset endpoint

### Dependencies

**No new dependencies required.** All required modules are already imported:
- `auditLogger.cjs` - Already imported
- `securityMiddleware.cjs` - Already imported
- `healthMonitor.cjs` - Already imported
- `rateLimiter.cjs` - Already imported

### Performance Considerations

**Audit Logging Performance:**
- Audit logging is asynchronous and non-blocking
- Failed audit logs don't block request processing
- Firestore writes are batched automatically
- Expected overhead: <50ms per request

**Graceful Shutdown Performance:**
- 10-second timeout for in-flight requests
- Health monitor stops immediately
- Minimal impact on shutdown time

**Rate Limit Reset Performance:**
- Instant reset (in-memory operation)
- Audit logging adds <50ms
- No impact on other requests

### Security Considerations

**Sensitive Data Protection:**
- All identity numbers are masked in audit logs (first 4 digits visible)
- API request/response data is masked before logging
- No plaintext sensitive data in logs

**Access Control:**
- Rate limit reset requires super admin role
- Audit logs are only accessible to admin/compliance roles
- Security events are logged for all authorization failures

**Audit Trail Integrity:**
- All audit logs include timestamp, user ID, IP address
- Logs are immutable (Firestore append-only)
- Failed audit logs are logged to console for investigation

