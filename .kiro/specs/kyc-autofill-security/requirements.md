# Requirements Document: KYC Auto-Fill Security

## Introduction

The KYC auto-fill system currently allows anonymous users to trigger expensive verification API calls (₦100 per NIN, ₦100 per CAC) simply by entering an identity number and pressing Tab. This creates a security vulnerability where malicious actors could drain API credits without authentication. This feature secures the auto-fill endpoints by requiring authentication and implementing proper access controls.

The system already has complete auto-fill infrastructure (AutoFillEngine, VerificationAPIClient, field mapping, caching) and authentication infrastructure (Firebase Auth, session management). This feature adds security controls to prevent abuse while maintaining the user experience for authenticated users.

## Glossary

- **Auto-Fill**: The system that automatically populates form fields from NIN/CAC verification APIs
- **Verification API**: Backend endpoints that call Datapro (NIN) or VerifyData (CAC) services
- **Anonymous User**: A user who has not signed in (no Firebase authentication token)
- **Authenticated User**: A user who has signed in with valid Firebase credentials
- **Format Validation**: Client-side validation that checks identity number format without API calls
- **Rate Limiting**: Server-side throttling to prevent API abuse
- **Audit Logging**: Recording of all verification attempts with user context
- **Cache**: Database storage of verified identities to prevent duplicate API calls

## Requirements

### Requirement 1: Authentication Enforcement for Auto-Fill

**User Story:** As a system administrator, I want auto-fill to require authentication, so that anonymous users cannot trigger expensive API calls.

#### Acceptance Criteria

1. WHEN an anonymous user enters a NIN/CAC and presses Tab, THE System SHALL NOT call verification APIs
2. WHEN an authenticated user enters a NIN/CAC and presses Tab, THE System SHALL call verification APIs
3. THE System SHALL check authentication status in useAutoFill hook before attaching trigger handlers
4. THE System SHALL skip auto-fill attachment for anonymous users when requireAuth=true
5. THE System SHALL require authentication for form submission with verification

### Requirement 2: Client-Side Format Validation

**User Story:** As a user, I want instant feedback on identity number format, so that I know if my input is valid before submitting.

#### Acceptance Criteria

1. THE System SHALL validate NIN format: exactly 11 digits, no other characters
2. THE System SHALL show format validation errors immediately without API calls
3. THE System SHALL validate CAC format: starts with "RC" followed by digits
4. THE System SHALL show format validation success indicators (checkmark) for valid formats
5. THE System SHALL prevent auto-fill trigger if format validation fails

### Requirement 3: Server-Side Authentication Middleware

**User Story:** As a security engineer, I want verification endpoints protected by authentication middleware, so that unauthenticated requests are rejected.

#### Acceptance Criteria

1. THE System SHALL require authentication for /api/autofill/verify-nin endpoint
2. THE System SHALL require authentication for /api/autofill/verify-cac endpoint
3. THE System SHALL return 401 Unauthorized for requests without valid Firebase tokens
4. THE System SHALL log all verification attempts with user information (userId, email, name)
5. THE System SHALL leverage existing verified-identities cache to prevent duplicate API calls

### Requirement 4: IP-Based Rate Limiting

**User Story:** As a system administrator, I want rate limiting on verification endpoints, so that even authenticated users cannot abuse the system.

#### Acceptance Criteria

1. THE System SHALL enforce 100 requests per minute per IP address
2. THE System SHALL return 429 Too Many Requests when limit exceeded
3. THE System SHALL log rate limit violations with IP address and endpoint
4. THE System SHALL use existing RateLimiter class infrastructure

### Requirement 5: User Interface Messaging

**User Story:** As a user, I want clear messaging about when verification will occur, so that I understand the system behavior.

#### Acceptance Criteria

1. WHEN an anonymous user views KYC forms, THE System SHALL display "Your NIN/CAC will be verified when you submit"
2. WHEN an authenticated user views KYC forms, THE System SHALL display "Enter your NIN/CAC and press Tab to auto-fill"
3. THE System SHALL show format validation feedback for all users (authenticated and anonymous)
4. THE System SHALL show loading indicators during verification for authenticated users

### Requirement 6: Form Submission Verification

**User Story:** As a user, I want my identity verified on form submission, so that I can complete the form even if I didn't use auto-fill.

#### Acceptance Criteria

1. WHEN a user submits a form with unverified NIN/CAC, THE System SHALL call verification API
2. THE System SHALL require authentication before verification on submission
3. THE System SHALL allow submission if verification succeeds
4. THE System SHALL block submission if verification fails

### Requirement 7: Security Event Logging

**User Story:** As a security auditor, I want all security events logged, so that I can detect and investigate abuse attempts.

#### Acceptance Criteria

1. THE System SHALL log unauthenticated verification attempts with severity='medium'
2. THE System SHALL log rate limit violations with severity='high'
3. THE System SHALL log all verification attempts (success and failure) with user context
4. THE System SHALL use existing auditLogger infrastructure

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want existing auto-fill functionality preserved, so that authenticated users have the same experience.

#### Acceptance Criteria

1. THE System SHALL maintain existing auto-fill workflow for authenticated users
2. THE System SHALL maintain existing cache behavior (verified-identities collection)
3. THE System SHALL maintain existing audit logging with metadata.source = 'auto-fill'
4. THE System SHALL maintain existing cost tracking and savings calculations

## Non-Functional Requirements

### Performance
- Format validation SHALL complete in <50ms
- Authentication checks SHALL not add >100ms latency to auto-fill
- Rate limiting SHALL not impact legitimate user requests

### Security
- All verification endpoints SHALL require valid Firebase authentication tokens
- All security events SHALL be logged with complete context
- Rate limiting SHALL prevent brute force attacks

### Usability
- Error messages SHALL be clear and actionable
- Format validation feedback SHALL be instant
- Loading indicators SHALL show verification progress

## Dependencies

- Existing authentication infrastructure (Firebase Auth, session management)
- Existing auto-fill infrastructure (AutoFillEngine, VerificationAPIClient)
- Existing audit logging infrastructure (server-utils/auditLogger.cjs)
- Existing rate limiting infrastructure (server-utils/rateLimiter.cjs)
- Existing cache infrastructure (verified-identities Firestore collection)

## Success Metrics

- Zero unauthenticated verification API calls
- <1% false positive rate on format validation
- 100% of verification attempts logged with user context
- No increase in legitimate user friction (measured by form completion rate)
