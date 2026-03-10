# Design Document: KYC Auto-Fill Security

## Architecture Overview

This design secures the KYC auto-fill system by adding authentication enforcement, format validation, and rate limiting while preserving the existing auto-fill workflow for authenticated users. The approach shifts from "verify on input" to "verify on submission" for anonymous users, while maintaining instant auto-fill for authenticated users.

## System Components

### 1. Client-Side Components

#### 1.1 Format Validator (`src/utils/identityFormatValidator.ts`)
- **Purpose**: Validate identity number formats without API calls
- **Functions**:
  - `validateNINFormat(nin: string): FormatValidationResult`
    - Validates exactly 11 digits, no other characters
    - Returns `{ valid: boolean, error?: string, fieldName: string }`
  - `validateCACFormat(cac: string): FormatValidationResult`
    - Validates starts with "RC" followed by digits
    - Returns `{ valid: boolean, error?: string, fieldName: string }`

#### 1.2 useAutoFill Hook (`src/hooks/useAutoFill.ts`)
- **Purpose**: Manage auto-fill state and authentication checks
- **New Configuration**:
  ```typescript
  interface UseAutoFillConfig {
    requireAuth?: boolean; // Default: true
    // ... existing config
  }
  ```
- **Authentication Logic**:
  ```typescript
  const { user } = useAuth();
  const isAuthenticated = user !== null && user !== undefined;
  
  // Skip auto-fill attachment for anonymous users
  if (requireAuth && !isAuthenticated) {
    return; // Don't attach trigger handler
  }
  ```

#### 1.3 KYC Form Components
- **IndividualKYC.tsx**: Display authentication-based messaging
- **CorporateKYC.tsx**: Display authentication-based messaging
- **Messaging Logic**:
  ```typescript
  const { user } = useAuth();
  const message = user 
    ? "Enter your NIN and press Tab to auto-fill"
    : "Your NIN will be verified when you submit";
  ```

### 2. Server-Side Components

#### 2.1 Authentication Middleware (`server.js`)
- **Existing Middleware**: `requireAuth`
- **Applied To**:
  - `/api/autofill/verify-nin`
  - `/api/autofill/verify-cac`
- **Middleware Chain**:
  ```javascript
  app.post('/api/autofill/verify-nin', 
    requireAuth,           // NEW: Authentication check
    ipBasedRateLimit,      // NEW: IP-based rate limiting
    verificationRateLimiter, // Existing: Per-user rate limiting
    async (req, res) => { ... }
  );
  ```

#### 2.2 IP-Based Rate Limiter (`server.js`)
- **Configuration**:
  - 100 requests per minute per IP
  - Max queue size: 50
- **Implementation**:
  ```javascript
  const ipRateLimiter = new RateLimiter({
    maxRequests: 100,
    timeWindowMs: 60000,
    maxQueueSize: 50
  });
  
  const ipBasedRateLimit = async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    try {
      await ipRateLimiter.acquire(ip);
      next();
    } catch (error) {
      logSecurityEvent({
        eventType: 'rate_limit_exceeded',
        severity: 'high',
        metadata: { ip, endpoint: req.path }
      });
      res.status(429).json({ error: 'Too many requests' });
    }
  };
  ```

#### 2.3 Security Event Logging
- **Uses Existing**: `server-utils/auditLogger.cjs`
- **Events Logged**:
  1. **Unauthenticated Attempts**:
     ```javascript
     logSecurityEvent({
       eventType: 'unauthenticated_verification_attempt',
       severity: 'medium',
       metadata: { ip, endpoint, userAgent }
     });
     ```
  2. **Rate Limit Violations**:
     ```javascript
     logSecurityEvent({
       eventType: 'rate_limit_exceeded',
       severity: 'high',
       metadata: { ip, endpoint, attempts }
     });
     ```

## Data Flow

### Authenticated User Flow

```
1. User enters NIN/CAC
2. Format validation (client-side)
   ├─ Invalid → Show error, prevent auto-fill
   └─ Valid → Continue
3. User presses Tab
4. useAutoFill checks authentication
   ├─ Not authenticated → Skip auto-fill
   └─ Authenticated → Continue
5. Call /api/autofill/verify-nin
6. Server: requireAuth middleware
   ├─ No token → 401 Unauthorized
   └─ Valid token → Continue
7. Server: ipBasedRateLimit middleware
   ├─ Limit exceeded → 429 Too Many Requests
   └─ Within limit → Continue
8. Server: Check cache (verified-identities)
   ├─ Cache HIT → Return cached data (cost = ₦0)
   └─ Cache MISS → Call Datapro API (cost = ₦100)
9. Server: Log verification attempt
10. Client: Populate form fields
11. Client: Show success feedback
```

### Anonymous User Flow

```
1. User enters NIN/CAC
2. Format validation (client-side)
   ├─ Invalid → Show error
   └─ Valid → Show checkmark
3. User presses Tab
4. useAutoFill checks authentication
   └─ Not authenticated → Skip auto-fill (no API call)
5. User sees message: "Your NIN will be verified when you submit"
6. User fills form manually
7. User clicks Submit
8. System redirects to sign-in (if not authenticated)
9. After sign-in, verification happens on submission
```

## Security Controls

### 1. Authentication Enforcement
- **Client-Side**: useAutoFill hook checks authentication before attaching triggers
- **Server-Side**: requireAuth middleware validates Firebase tokens
- **Result**: Zero unauthenticated API calls

### 2. Format Validation
- **Purpose**: Prevent invalid formats from triggering API calls
- **Implementation**: Client-side validation before auto-fill trigger
- **Result**: Reduced API calls for typos and invalid inputs

### 3. Rate Limiting
- **IP-Based**: 100 requests/minute per IP (prevents distributed attacks)
- **User-Based**: Existing per-user rate limiting (prevents single user abuse)
- **Result**: Protection against brute force and abuse

### 4. Audit Logging
- **All Attempts**: Success, failure, cache hits, cache misses
- **Security Events**: Unauthenticated attempts, rate limit violations
- **Context**: User ID, email, name, IP, timestamp, cost
- **Result**: Complete audit trail for investigation

## Backward Compatibility

### Preserved Functionality
1. **Auto-Fill Workflow**: Identical for authenticated users
2. **Cache Behavior**: Same verified-identities collection and logic
3. **Audit Logging**: Same structure with metadata.source = 'auto-fill'
4. **Cost Tracking**: Same cost calculations and savings reporting

### Breaking Changes
- **None**: Anonymous users never had working auto-fill (they couldn't submit without auth anyway)

## Error Handling

### Client-Side Errors
1. **Invalid Format**: Show specific error message, prevent auto-fill
2. **Network Error**: Show "Network error. Please check your connection."
3. **Timeout**: Show "Verification is taking longer than expected. You can continue manually."
4. **Auth Required**: Show "Please sign in to use auto-fill"

### Server-Side Errors
1. **401 Unauthorized**: Log security event, return error
2. **429 Too Many Requests**: Log security event, return error
3. **Verification Failed**: Log attempt, return error with details
4. **Cache Error**: Fall back to API call, log warning

## Testing Strategy

### Property-Based Tests
1. **Property 1**: Anonymous users never trigger verification API calls
2. **Property 2**: Authenticated users trigger verification for valid formats
3. **Property 3**: Format validation correctness (NIN: 11 digits, CAC: RC + digits)
4. **Property 4**: Invalid formats produce error messages without API calls
5. **Property 5**: Authentication required for verification endpoints
6. **Property 6**: Form submission requires authentication
7. **Property 7**: Verification attempts are audited
8. **Property 8**: Successful verifications are cached
9. **Property 9**: Rate limiting enforced per IP
10. **Property 10**: Rate limit violations are logged

### Unit Tests
- Format validation edge cases (empty, null, special characters)
- Authentication middleware (valid/invalid/missing/expired tokens)
- Rate limiting edge cases (threshold, queue, reset)
- UI messaging (anonymous vs authenticated)
- Error handling (network, timeout, auth, validation)

### Integration Tests
- End-to-end anonymous user flow
- End-to-end authenticated user flow
- Rate limiting across concurrent requests
- Audit logging completeness
- Cache hit/miss scenarios

### Security Tests
- Authentication bypass attempts
- Rate limit bypass attempts
- Sensitive data logging verification
- Token validation on every request

## Performance Considerations

### Client-Side
- Format validation: <50ms (synchronous, no I/O)
- Authentication check: <10ms (read from context)
- Total overhead: <100ms (acceptable for UX)

### Server-Side
- Authentication middleware: ~50ms (Firebase token validation)
- Rate limiting: ~10ms (in-memory check)
- Cache lookup: ~100ms (Firestore query)
- Total overhead: ~160ms (acceptable for auto-fill)

## Deployment Strategy

### Phase 1: Backend Security (Tasks 1-6)
1. Add authentication middleware to endpoints
2. Implement IP-based rate limiting
3. Add security event logging
4. Deploy and monitor

### Phase 2: Client-Side Validation (Tasks 7-11)
1. Create format validator utility
2. Update useAutoFill hook with auth checks
3. Update KYC forms with messaging
4. Deploy and monitor

### Phase 3: Form Submission (Tasks 12-14)
1. Implement verification on submission
2. Add error handling
3. Deploy and monitor

### Phase 4: Testing & Validation (Tasks 15-18)
1. Run all property-based tests
2. Run integration tests
3. Run security tests
4. Final validation

## Monitoring & Alerts

### Metrics to Track
1. **Unauthenticated Attempts**: Should be 0 after deployment
2. **Rate Limit Violations**: Monitor for abuse patterns
3. **Format Validation Errors**: Track common mistakes
4. **Cache Hit Rate**: Should remain >80%
5. **API Cost Savings**: Track cost reduction from auth enforcement

### Alerts
1. **High Unauthenticated Attempts**: >10/hour → Investigate
2. **High Rate Limit Violations**: >50/hour → Investigate
3. **Low Cache Hit Rate**: <70% → Investigate cache issues
4. **High API Costs**: >₦10,000/day → Investigate abuse

## Success Criteria

1. ✅ Zero unauthenticated verification API calls
2. ✅ <1% false positive rate on format validation
3. ✅ 100% of verification attempts logged with user context
4. ✅ No increase in legitimate user friction
5. ✅ All tests passing (property-based, unit, integration, security)
