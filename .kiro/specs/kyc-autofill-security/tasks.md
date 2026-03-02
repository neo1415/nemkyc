# Implementation Plan: KYC Auto-Fill Security

## Overview

This implementation secures KYC auto-fill verification endpoints by removing anonymous access to expensive verification APIs. The approach shifts from "verify on input" to "verify on submission" for anonymous users, while maintaining auto-fill for authenticated users. All changes leverage existing infrastructure (rate limiting, audit logging, caching, authentication).

## Tasks

- [x] 1. Create client-side format validation utility
  - Create `src/utils/identityFormatValidator.ts` with validation functions
  - Implement `validateNINFormat(nin: string): FormatValidationResult`
  - Implement `validateCACFormat(cac: string): FormatValidationResult`
  - NIN validation: exactly 11 digits, no other characters
  - CAC validation: starts with "RC" followed by digits
  - _Requirements: 2.1, 2.3_

- [x] 1.1 Write property test for format validation
  - **Property 3: Format validation correctness**
  - **Validates: Requirements 2.1, 2.3**

- [x] 1.2 Write unit tests for format validation edge cases
  - Test empty strings, null values, special characters
  - Test boundary cases (10 digits, 12 digits for NIN)
  - Test CAC with/without RC prefix
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. Add authentication check to useAutoFill hook
  - Modify `src/hooks/useAutoFill.ts` to check authentication status
  - Import and use `useAuth()` hook to get current user
  - Skip API calls if user is null/undefined (anonymous)
  - Proceed with API calls if user exists (authenticated)
  - Add `requireAuth` config option to AutoFillConfig interface
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2.1 Write property test for anonymous user API call prevention
  - **Property 1: Anonymous users never trigger verification API calls**
  - **Validates: Requirements 1.1, 1.2**

- [x] 2.2 Write property test for authenticated user API call triggering
  - **Property 2: Authenticated users trigger verification for valid formats**
  - **Validates: Requirements 1.3, 1.4**

- [x] 3. Add authentication middleware to verification endpoints
  - Modify `server.js` to add `requireAuth` middleware to `/api/autofill/verify-nin`
  - Modify `server.js` to add `requireAuth` middleware to `/api/autofill/verify-cac`
  - Place `requireAuth` before `verificationRateLimiter` in middleware chain
  - Ensure existing `requireAuth` middleware extracts user from Firebase token
  - Return 401 Unauthorized for requests without valid authentication
  - _Requirements: 3.1, 3.2_

- [x] 3.1 Write property test for authentication enforcement
  - **Property 5: Authentication required for verification endpoints**
  - **Validates: Requirements 3.1, 3.2**

- [x] 3.2 Write unit tests for authentication middleware
  - Test with valid Firebase token
  - Test with invalid token
  - Test with missing token
  - Test with expired token
  - _Requirements: 3.1, 3.2_

- [x] 4. Implement IP-based rate limiting
  - Create IP-based rate limiter instance in `server.js` using existing `RateLimiter` class
  - Configure: 100 requests per minute, max queue size 50
  - Create `ipBasedRateLimit` middleware function
  - Extract IP from `req.ip` or `req.connection.remoteAddress`
  - Call `ipRateLimiter.acquire()` and handle errors
  - Return 429 Too Many Requests when limit exceeded
  - _Requirements: 4.1, 4.2_

- [x] 4.1 Write property test for rate limiting enforcement
  - **Property 9: Rate limiting enforced per IP**
  - **Validates: Requirements 4.1, 4.2**

- [x] 4.2 Write unit tests for rate limiting edge cases
  - Test at threshold (99, 100, 101 requests)
  - Test queue behavior when limit exceeded
  - Test rate limiter reset after time window
  - _Requirements: 4.1, 4.2_

- [x] 5. Add security event logging for authentication failures
  - In `requireAuth` middleware, log unauthenticated access attempts
  - Use existing `logSecurityEvent` function from `server-utils/auditLogger.cjs`
  - Set eventType: 'unauthenticated_verification_attempt'
  - Set severity: 'medium'
  - Include IP address, endpoint, userAgent in metadata
  - _Requirements: 8.1, 8.4_

- [x] 6. Add security event logging for rate limit violations
  - In `ipBasedRateLimit` middleware, log rate limit violations
  - Use existing `logSecurityEvent` function
  - Set eventType: 'rate_limit_exceeded'
  - Set severity: 'high'
  - Include IP address, endpoint, attempts in metadata
  - _Requirements: 4.3, 8.2, 8.4_

- [x] 6.1 Write property test for security event logging
  - **Property 15: Security event severity mapping**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 6.2 Write property test for rate limit violation logging
  - **Property 10: Rate limit violations are logged**
  - **Validates: Requirements 4.3, 8.2**

- [x] 7. Update IndividualKYC form UI for anonymous users
  - Modify `src/pages/kyc/IndividualKYC.tsx`
  - Check authentication status using `useAuth()` hook
  - For anonymous users: display message "Your NIN will be verified when you submit"
  - For authenticated users: keep existing message "Enter your NIN and press Tab to auto-fill"
  - Show format validation feedback for all users (checkmark for valid, error for invalid)
  - Update error messages to be specific about format issues
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. Update CorporateKYC form UI for anonymous users
  - Modify `src/pages/kyc/CorporateKYC.tsx`
  - Check authentication status using `useAuth()` hook
  - For anonymous users: display message "Your CAC will be verified when you submit"
  - For authenticated users: keep existing message "Enter your CAC and press Tab to auto-fill"
  - Show format validation feedback for all users
  - Update error messages to be specific about format issues
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8.1 Write unit tests for UI messaging
  - Test message display for anonymous users
  - Test message display for authenticated users
  - Test format validation feedback display
  - Test error message display
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Add format validation to form fields
  - In `IndividualKYC.tsx`, call `validateNINFormat` on NIN field blur/change
  - In `CorporateKYC.tsx`, call `validateCACFormat` on CAC field blur/change
  - Display validation results immediately (success indicator or error message)
  - Prevent auto-fill trigger if format validation fails
  - Show loading indicators during verification for authenticated users
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.4_

- [x] 9.1 Write property test for invalid format error messages
  - **Property 4: Invalid formats produce error messages without API calls**
  - **Validates: Requirements 2.2, 2.4, 2.5**

- [x] 10. Implement verification on form submission
  - Modify form submission handlers in both KYC forms
  - Before processing submission, check if identity number is verified
  - If not verified, call verification API with authenticated user context
  - If verification succeeds, proceed with form submission
  - If verification fails, display error and prevent submission
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10.1 Write property test for form submission verification
  - **Property 12: Verification on form submission**
  - **Validates: Requirements 7.1, 7.2**

- [x] 10.2 Write property test for verification success path
  - **Property 13: Verification success allows submission**
  - **Validates: Requirements 7.3**

- [x] 10.3 Write property test for verification failure path
  - **Property 14: Verification failure blocks submission**
  - **Validates: Requirements 7.4**

- [x] 11. Ensure authentication required for form submission
  - Verify form submission endpoints require authentication
  - Add authentication check before verification in submission flow
  - Redirect to sign-in if user is not authenticated during submission
  - Preserve form data during authentication redirect
  - _Requirements: 1.5, 3.3_

- [x] 11.1 Write property test for form submission authentication
  - **Property 6: Form submission requires authentication**
  - **Validates: Requirements 1.5, 3.3**

- [x] 12. Verify audit logging for all verification attempts
  - Ensure existing `logVerificationAttempt` calls include user information
  - Verify logs include userId, userEmail, userName, IP address, timestamp
  - Test that both successful and failed verifications are logged
  - Verify cache hits are logged with cost = 0
  - Verify cache misses are logged with actual cost
  - _Requirements: 3.4, 8.4_

- [x] 12.1 Write property test for verification audit logging
  - **Property 7: Verification attempts are audited**
  - **Validates: Requirements 3.4, 8.4**

- [x] 13. Verify caching behavior for successful verifications
  - Ensure existing cache logic stores results in `verified-identities` collection
  - Verify cache uses `hashForCacheLookup` for deterministic keys
  - Test that cache prevents duplicate API calls for same identity number
  - Verify cache entries include all required fields (identityHash, verificationData, etc.)
  - _Requirements: 3.5, 7.5_

- [x] 13.1 Write property test for verification caching
  - **Property 8: Successful verifications are cached**
  - **Validates: Requirements 3.5, 7.5**

- [x] 14. Add error handling for all failure scenarios
  - Add client-side error handling for network failures
  - Add client-side error handling for authentication failures
  - Add server-side error handling for validation failures
  - Add server-side error handling for verification service failures
  - Ensure all errors are logged appropriately
  - Display user-friendly error messages for all error types
  - _Requirements: All error handling scenarios from design_

- [x] 14.1 Write unit tests for error handling
  - Test network timeout errors
  - Test authentication errors
  - Test rate limiting errors
  - Test validation errors
  - Test verification service errors
  - _Requirements: Error handling_

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Integration testing
  - Test end-to-end flow: Anonymous user → Format validation → Submit → Authenticate → Verify → Submit
  - Test end-to-end flow: Authenticated user → Format validation → Auto-fill → Verify → Populate → Submit
  - Test rate limiting across multiple concurrent requests
  - Test audit logging across entire verification flow
  - Test cache behavior across multiple verification attempts
  - _Requirements: All requirements_

- [x] 16.1 Write integration tests for complete flows
  - Test anonymous user flow
  - Test authenticated user flow
  - Test rate limiting behavior
  - Test audit logging completeness
  - Test cache hit/miss scenarios
  - _Requirements: All requirements_

- [ ] 17. Security testing
  - Verify unauthenticated requests are always rejected
  - Verify rate limiting cannot be bypassed
  - Verify security events are logged for all violations
  - Verify sensitive data (NIN, CAC) is never logged in plaintext
  - Verify authentication tokens are validated on every request
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 8.1, 8.2, 8.3_

- [~] 17.1 Write security tests
  - Test authentication bypass attempts
  - Test rate limit bypass attempts
  - Test sensitive data logging
  - Test token validation
  - _Requirements: Security requirements_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Security tests validate protection against attacks
