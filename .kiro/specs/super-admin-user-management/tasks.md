# Implementation Tasks: Super Admin User Management

## Overview

This document outlines the implementation tasks for the Super Admin User Management feature. Tasks are organized by component and include backend API endpoints, frontend components, utility services, testing, and infrastructure updates.

## Task Breakdown

### Phase 1: Backend Infrastructure

#### Task 1: Password Generation Utility

**Description**: Create a secure password generator utility that produces cryptographically secure passwords meeting complexity requirements.

**Files to Create**:
- `server-utils/passwordGenerator.cjs`

**Implementation Details**:
- Use `crypto.randomInt()` for cryptographically secure random generation
- Generate passwords with minimum 12 characters
- Ensure at least 1 uppercase, 1 lowercase, 1 number, 1 special character
- Shuffle password to avoid predictable patterns
- Export `generateSecurePassword(length = 12)` function

**Acceptance Criteria**:
- Generated passwords always meet complexity requirements
- Passwords are cryptographically random
- Function is exported and can be imported by other modules

**Property Tests Required**: Property 4

#### Task 2: Email Template Service

**Description**: Create email template generator for welcome and password reset emails.

**Files to Create**:
- `server-utils/emailTemplates.cjs`

**Implementation Details**:
- Create `generateWelcomeEmail(userData)` function
- Create `generatePasswordResetEmail(userData)` function
- Use HTML templates with inline CSS for email compatibility
- Include user name, email, temporary password, login link, security notices
- Match NEM Forms branding (burgundy #800020 and gold #DAA520)

**Acceptance Criteria**:
- Welcome email contains all required fields (name, email, password, link, notices)
- Password reset email contains all required fields
- HTML renders correctly in major email clients
- Templates use proper escaping to prevent XSS

**Property Tests Required**: Properties 11, 40


#### Task 3: User Creation Rate Limiter

**Description**: Implement rate limiting middleware to restrict user creation to 10 per hour per super admin.

**Files to Modify**:
- `server-utils/rateLimiter.cjs` (add new rate limit configuration)

**Implementation Details**:
- Add `userCreationRateLimit` middleware function
- Use token bucket algorithm with 10 tokens per hour window
- Store rate limit state in Firestore `/rateLimits/{superAdminId}` collection
- Return 429 status with retry-after header when limit exceeded
- Auto-cleanup expired rate limit documents

**Acceptance Criteria**:
- Super admin can create 10 users within an hour
- 11th attempt within the hour returns 429 error
- Rate limit resets after 60 minutes from first creation
- Rate limit violations are logged to audit log

**Property Tests Required**: Properties 35, 36

#### Task 4: User Creation API Endpoint

**Description**: Create backend API endpoint for user account creation with Firebase Admin SDK integration.

**Files to Modify**:
- `server.js` (add POST /api/users/create endpoint)

**Implementation Details**:
- Add middleware: `requireAuth`, `requireSuperAdmin`, `userCreationRateLimit`
- Validate request body (fullName, email, role)
- Generate secure temporary password
- Create Firebase Authentication account using Admin SDK
- Create Firestore documents atomically (/users and /userroles)
- Send welcome email with retry logic (3 attempts, exponential backoff)
- Log audit events (USER_CREATED or USER_CREATION_FAILED)
- Implement rollback on partial failure (delete Firebase Auth if Firestore fails)
- Return user-friendly error messages

**Acceptance Criteria**:
- Only super admins can access endpoint
- Valid user data creates Firebase Auth account and Firestore documents
- Duplicate email returns 409 error
- Welcome email is sent with credentials
- All operations are logged to audit log
- Partial failures trigger rollback

**Property Tests Required**: Properties 5, 6, 7, 8, 9, 10, 37, 38, 39

#### Task 5: List Users API Endpoint

**Description**: Create backend API endpoint to retrieve paginated user list with filtering.

**Files to Modify**:
- `server.js` (add GET /api/users/list endpoint)

**Implementation Details**:
- Add middleware: `requireAuth`, `requireSuperAdmin`
- Accept query parameters: role, search, page, pageSize
- Query Firestore /users and /userroles collections
- Filter by role if specified
- Filter by name/email search text (case-insensitive)
- Implement pagination (50 users per page default)
- Resolve creator names from createdBy UIDs
- Return user data with pagination metadata

**Acceptance Criteria**:
- Only super admins can access endpoint
- Returns paginated user list (50 per page)
- Role filter works correctly
- Search filter works for name and email
- Pagination metadata is accurate
- Creator names are resolved correctly

**Property Tests Required**: Properties 23, 24, 25, 26, 27, 28


#### Task 6: Update User Role API Endpoint

**Description**: Create backend API endpoint to modify user roles.

**Files to Modify**:
- `server.js` (add PUT /api/users/:userId/role endpoint)

**Implementation Details**:
- Add middleware: `requireAuth`, `requireSuperAdmin`
- Validate userId parameter and newRole in request body
- Update /userroles/{userId} document with new role
- Log audit event (ROLE_CHANGED) with old and new role
- Return success response

**Acceptance Criteria**:
- Only super admins can access endpoint
- Role document is updated in Firestore
- Audit log entry is created with old and new role
- Invalid role values return 400 error
- Non-existent user returns 404 error

**Property Tests Required**: Properties 29, 30

#### Task 7: Toggle User Status API Endpoint

**Description**: Create backend API endpoint to enable/disable user accounts.

**Files to Modify**:
- `server.js` (add PUT /api/users/:userId/status endpoint)

**Implementation Details**:
- Add middleware: `requireAuth`, `requireSuperAdmin`
- Validate userId parameter and disabled boolean in request body
- Update Firebase Authentication account disabled status using Admin SDK
- Log audit event (ACCOUNT_STATUS_CHANGED)
- Return success response

**Acceptance Criteria**:
- Only super admins can access endpoint
- Firebase Auth account status is updated
- Disabled users cannot login
- Audit log entry is created
- Non-existent user returns 404 error

**Property Tests Required**: Properties 31, 32

#### Task 8: Reset User Password API Endpoint

**Description**: Create backend API endpoint for super admins to reset user passwords.

**Files to Modify**:
- `server.js` (add POST /api/users/:userId/reset-password endpoint)

**Implementation Details**:
- Add middleware: `requireAuth`, `requireSuperAdmin`
- Validate userId parameter
- Generate new secure temporary password
- Update Firebase Authentication password using Admin SDK
- Set mustChangePassword: true in /users/{userId} document
- Send password reset email with new temporary password
- Log audit event (PASSWORD_RESET_BY_ADMIN)
- Return success response

**Acceptance Criteria**:
- Only super admins can access endpoint
- New temporary password is generated and set
- mustChangePassword flag is set to true
- Password reset email is sent
- Audit log entry includes both super admin and user IDs
- Non-existent user returns 404 error

**Property Tests Required**: Properties 33, 34

#### Task 9: Change Password API Endpoint

**Description**: Create backend API endpoint for users to change their passwords.

**Files to Modify**:
- `server.js` (add POST /api/users/change-password endpoint)

**Implementation Details**:
- Add middleware: `requireAuth`
- Validate currentPassword and newPassword in request body
- Verify currentPassword is correct
- Validate newPassword meets complexity requirements
- Update Firebase Authentication password
- Set mustChangePassword: false and passwordChangedAt in /users/{userId}
- Log audit event (PASSWORD_CHANGED or PASSWORD_CHANGE_FAILED)
- Return success response with role-based redirect URL

**Acceptance Criteria**:
- Authenticated users can access endpoint
- Current password is verified before change
- New password meets complexity requirements
- Password is updated in Firebase Auth
- mustChangePassword flag is set to false
- Audit log entry is created
- Redirect URL is based on user role

**Property Tests Required**: Properties 20, 21, 22


### Phase 2: Frontend Services

#### Task 10: User Management Service

**Description**: Create frontend service for user management API calls.

**Files to Create**:
- `src/services/userManagementService.ts`

**Implementation Details**:
- Create `createUser(data: CreateUserRequest)` function
- Create `listUsers(filters: ListUsersQuery)` function
- Create `updateUserRole(userId: string, newRole: UserRole)` function
- Create `toggleUserStatus(userId: string, disabled: boolean)` function
- Create `resetUserPassword(userId: string)` function
- Create `changePassword(data: ChangePasswordRequest)` function
- Use axios or fetch for HTTP requests
- Include authentication token in headers
- Handle errors and return typed responses

**Acceptance Criteria**:
- All API functions are implemented and typed
- Authentication tokens are included in requests
- Errors are properly caught and returned
- Functions return typed responses matching API contracts

**Property Tests Required**: None (integration tested via API endpoints)

#### Task 11: Password Validation Utility

**Description**: Create frontend utility for password strength validation.

**Files to Create**:
- `src/utils/passwordValidation.ts`

**Implementation Details**:
- Create `validatePasswordStrength(password: string)` function
- Check minimum 8 characters
- Check at least 1 uppercase letter
- Check at least 1 lowercase letter
- Check at least 1 number
- Check at least 1 special character
- Return object with boolean flags for each requirement and overall score
- Create `getPasswordStrengthScore(password: string)` function returning 'weak' | 'medium' | 'strong'

**Acceptance Criteria**:
- All password requirements are validated correctly
- Strength score accurately reflects requirements met
- Functions are pure (no side effects)
- Functions are exported and can be imported

**Property Tests Required**: Properties 15, 16, 17

### Phase 3: Frontend Components

#### Task 12: Password Strength Indicator Component

**Description**: Create reusable component to display password strength with visual feedback.

**Files to Create**:
- `src/components/auth/PasswordStrengthIndicator.tsx`

**Implementation Details**:
- Accept password and requirements as props
- Display visual progress bar (red → yellow → green)
- Display checklist of requirements with checkmarks
- Display overall strength label ('Weak', 'Medium', 'Strong')
- Update in real-time as password changes
- Use Material-UI or existing component library

**Acceptance Criteria**:
- Visual indicator updates in real-time
- All requirements are displayed with checkmarks
- Color changes based on strength (red/yellow/green)
- Strength label is accurate
- Component is reusable and well-typed

**Property Tests Required**: Property 16


#### Task 13: Create User Modal Component

**Description**: Create modal dialog for super admins to create new user accounts.

**Files to Create**:
- `src/components/admin/CreateUserModal.tsx`

**Implementation Details**:
- Accept open, onClose, onSuccess props
- Display form with fields: Full Name, Email, Role (dropdown)
- Implement real-time validation for all fields
- Display error messages below each field
- Disable submit button until all validations pass
- Show loading state during submission
- Call userManagementService.createUser() on submit
- Display success message and auto-close after 2 seconds
- Handle and display API errors
- Clear form on close

**Acceptance Criteria**:
- Modal opens and closes correctly
- All form fields are validated in real-time
- Submit button is disabled until form is valid
- Loading state is shown during submission
- Success message is displayed on successful creation
- Modal auto-closes after 2 seconds on success
- API errors are displayed to user
- Form is cleared on close

**Property Tests Required**: Properties 1, 2, 3, 5

#### Task 14: User Management Dashboard Component

**Description**: Create comprehensive dashboard for viewing and managing users.

**Files to Create**:
- `src/pages/admin/UserManagementDashboard.tsx`

**Implementation Details**:
- Display "Create User" button that opens CreateUserModal
- Display user table with columns: Name, Email, Role, Status, Created Date, Created By
- Implement role filter dropdown (All, default, broker, admin, compliance, claims, super admin)
- Implement search input for name/email filtering
- Implement pagination controls (50 users per page)
- Display action buttons for each user: Edit Role, Reset Password, Disable/Enable Account
- Highlight newly created users for 5 seconds
- Refresh user list after any action completes
- Handle loading and error states
- Use Material-UI Table or existing table component

**Acceptance Criteria**:
- Create User button opens modal correctly
- User table displays all required columns
- Role filter works correctly
- Search filter works for name and email
- Pagination displays correct page and total pages
- Action buttons trigger appropriate dialogs/actions
- Newly created users are highlighted
- User list refreshes after actions
- Loading and error states are handled

**Property Tests Required**: Properties 23, 24, 25, 26, 27, 28

#### Task 15: Edit Role Dialog Component

**Description**: Create dialog for changing user roles.

**Files to Create**:
- `src/components/admin/EditRoleDialog.tsx`

**Implementation Details**:
- Accept open, onClose, user, onSuccess props
- Display current role
- Display role dropdown with all available roles
- Call userManagementService.updateUserRole() on submit
- Show loading state during submission
- Display success message
- Handle and display API errors
- Close dialog on success

**Acceptance Criteria**:
- Dialog opens and closes correctly
- Current role is displayed
- Role dropdown contains all roles
- Role update is submitted correctly
- Loading state is shown during submission
- Success message is displayed
- API errors are displayed to user
- Dialog closes on success

**Property Tests Required**: Properties 29, 30


#### Task 16: Password Reset Page Component

**Description**: Create forced password reset page for users with temporary passwords.

**Files to Create**:
- `src/pages/auth/PasswordResetPage.tsx`

**Implementation Details**:
- Display message "You must change your password before continuing"
- Display form with fields: Current Password, New Password, Confirm New Password
- Include PasswordStrengthIndicator component for New Password field
- Display password requirements checklist
- Implement real-time validation for all fields
- Validate new password meets all requirements
- Validate new password matches confirmation
- Validate new password is different from current password
- Disable submit button until all validations pass
- Call userManagementService.changePassword() on submit
- Show loading state during submission
- Display success message
- Redirect to role-based dashboard after 2 seconds
- Prevent navigation away from page until password changed
- Handle and display API errors

**Acceptance Criteria**:
- Page displays forced password change message
- All form fields are present and validated
- Password strength indicator updates in real-time
- Submit button is disabled until form is valid
- Password change is submitted correctly
- Loading state is shown during submission
- Success message is displayed
- User is redirected to correct dashboard based on role
- Navigation is blocked until password changed
- API errors are displayed to user

**Property Tests Required**: Properties 13, 14, 15, 16, 17, 18, 19, 20, 21, 22

#### Task 17: Authentication Flow Integration

**Description**: Integrate password reset check into authentication flow.

**Files to Modify**:
- `src/contexts/AuthContext.tsx` (or equivalent auth context)
- `src/App.tsx` (or routing configuration)

**Implementation Details**:
- After successful login, retrieve user document from /users/{uid}
- Check mustChangePassword field
- If true, redirect to PasswordResetPage before any other navigation
- Store redirect intent for after password change
- Implement route guard to prevent bypassing password reset
- Add PasswordResetPage route to router

**Acceptance Criteria**:
- User document is retrieved after login
- mustChangePassword flag is checked
- Users with mustChangePassword: true are redirected to reset page
- Users cannot bypass password reset page
- After password change, users are redirected to appropriate dashboard
- Route guard prevents unauthorized access

**Property Tests Required**: Properties 13, 14

### Phase 4: Infrastructure Updates

#### Task 18: Firestore Security Rules Update

**Description**: Update Firestore security rules to support user management operations.

**Files to Modify**:
- `firestore.rules`

**Implementation Details**:
- Add helper function `isSuperAdmin()` to check super admin role
- Allow super admins to read/write /users collection
- Allow super admins to read/write /userroles collection
- Allow users to read their own /users document
- Allow users to update password-related fields in their own /users document
- Allow users to read their own /userroles document
- Allow super admins to read /auditLogs collection
- Prevent direct writes to /auditLogs (backend only)
- Prevent direct access to /rateLimits (backend only)

**Acceptance Criteria**:
- Super admins can create and modify user documents
- Super admins can create and modify role documents
- Users can read their own documents
- Users can only update password-related fields
- Audit logs are read-only for super admins
- Rate limits are inaccessible from client
- Security rules are tested and validated

**Property Tests Required**: None (security rules tested separately)


#### Task 19: Firestore Indexes Creation

**Description**: Create required Firestore composite indexes for efficient queries.

**Files to Modify**:
- `firestore.indexes.json`

**Implementation Details**:
- Add index for /users collection: createdAt (descending)
- Add index for /userroles collection: role (ascending) + dateCreated (descending)
- Add index for /auditLogs collection: eventType (ascending) + timestamp (descending)
- Add index for /auditLogs collection: userId (ascending) + timestamp (descending)
- Add index for /auditLogs collection: performedBy (ascending) + timestamp (descending)
- Deploy indexes using Firebase CLI

**Acceptance Criteria**:
- All required indexes are defined in firestore.indexes.json
- Indexes are deployed to Firebase project
- Queries execute efficiently without warnings
- Index creation is documented

**Property Tests Required**: None (infrastructure configuration)

#### Task 20: Admin Dashboard Navigation Update

**Description**: Add User Management link to admin dashboard navigation.

**Files to Modify**:
- `src/pages/admin/AdminDashboard.tsx` (or navigation component)

**Implementation Details**:
- Add "User Management" navigation item
- Link to /admin/user-management route
- Show only for super admin role
- Add appropriate icon (e.g., People, Users)

**Acceptance Criteria**:
- User Management link appears in admin navigation
- Link is only visible to super admins
- Link navigates to User Management Dashboard
- Icon is appropriate and consistent with design

**Property Tests Required**: None (UI navigation)

### Phase 5: Testing

#### Task 21: Backend Unit Tests

**Description**: Write unit tests for backend utilities and middleware.

**Files to Create**:
- `server-utils/__tests__/passwordGenerator.test.cjs`
- `server-utils/__tests__/emailTemplates.test.cjs`
- `server-utils/__tests__/rateLimiter.userCreation.test.cjs`

**Implementation Details**:
- Test password generation meets complexity requirements
- Test password generation randomness
- Test email template data interpolation
- Test email template HTML structure
- Test rate limiter token bucket algorithm
- Test rate limiter cleanup of expired documents
- Use Vitest or Jest as test framework
- Achieve 95% code coverage for utilities

**Acceptance Criteria**:
- All utility functions have unit tests
- Tests cover happy path and edge cases
- Code coverage is at least 95%
- Tests pass consistently

**Property Tests Required**: None (unit tests complement property tests)

#### Task 22: Backend Integration Tests

**Description**: Write integration tests for API endpoints using Firebase Emulator.

**Files to Create**:
- `src/__tests__/user-management/userCreation.integration.test.ts`
- `src/__tests__/user-management/userManagement.integration.test.ts`
- `src/__tests__/user-management/passwordChange.integration.test.ts`

**Implementation Details**:
- Set up Firebase Emulator Suite for testing
- Test complete user creation flow (API → Firebase → Firestore → Email)
- Test user list retrieval with filtering and pagination
- Test role change, account disable/enable, password reset
- Test first login and password change flow
- Test rate limiting enforcement
- Test concurrent user creation handling
- Test error recovery and rollback scenarios
- Mock email service for testing
- Use Vitest or Jest as test framework

**Acceptance Criteria**:
- All API endpoints have integration tests
- Tests use Firebase Emulator Suite
- Tests cover success and failure scenarios
- Tests verify Firestore documents and audit logs
- Tests pass consistently
- Code coverage is at least 90% for API endpoints

**Property Tests Required**: None (integration tests complement property tests)


#### Task 23: Frontend Component Unit Tests

**Description**: Write unit tests for frontend components.

**Files to Create**:
- `src/__tests__/user-management/CreateUserModal.test.tsx`
- `src/__tests__/user-management/UserManagementDashboard.test.tsx`
- `src/__tests__/user-management/EditRoleDialog.test.tsx`
- `src/__tests__/user-management/PasswordResetPage.test.tsx`
- `src/__tests__/user-management/PasswordStrengthIndicator.test.tsx`

**Implementation Details**:
- Test CreateUserModal form validation and submission
- Test UserManagementDashboard filtering, search, pagination
- Test EditRoleDialog role selection and submission
- Test PasswordResetPage password validation and submission
- Test PasswordStrengthIndicator visual feedback
- Mock API calls using vi.mock or MSW
- Use React Testing Library for component testing
- Use Vitest as test framework
- Achieve 80% code coverage for components

**Acceptance Criteria**:
- All components have unit tests
- Tests cover user interactions and state changes
- API calls are properly mocked
- Tests verify correct rendering and behavior
- Code coverage is at least 80%
- Tests pass consistently

**Property Tests Required**: None (unit tests complement property tests)

#### Task 24: Property-Based Tests - Password Generation

**Description**: Write property-based tests for password generation.

**Files to Create**:
- `src/__tests__/user-management/passwordGeneration.property.test.ts`

**Implementation Details**:
- Use fast-check library for property-based testing
- Test Property 4: Generated passwords always meet complexity requirements
- Run 100 iterations per property test
- Tag test with feature name and property number

**Acceptance Criteria**:
- Property test verifies password complexity for 100 random generations
- Test is tagged correctly
- Test passes consistently

**Property Tests Required**: Property 4

#### Task 25: Property-Based Tests - Form Validation

**Description**: Write property-based tests for form validation logic.

**Files to Create**:
- `src/__tests__/user-management/formValidation.property.test.ts`

**Implementation Details**:
- Use fast-check library for property-based testing
- Test Property 1: Empty field validation rejection
- Test Property 2: Email format validation
- Test Property 3: Valid form enables submission
- Run 100 iterations per property test
- Tag tests with feature name and property numbers

**Acceptance Criteria**:
- Property tests verify validation logic for various inputs
- Tests run 100 iterations each
- Tests are tagged correctly
- Tests pass consistently

**Property Tests Required**: Properties 1, 2, 3

#### Task 26: Property-Based Tests - Password Validation

**Description**: Write property-based tests for password strength validation.

**Files to Create**:
- `src/__tests__/user-management/passwordValidation.property.test.ts`

**Implementation Details**:
- Use fast-check library for property-based testing
- Test Property 15: Password strength validation
- Test Property 16: Strength indicator accuracy
- Test Property 17: Invalid password rejection
- Test Property 18: Password mismatch detection
- Run 100 iterations per property test
- Tag tests with feature name and property numbers

**Acceptance Criteria**:
- Property tests verify password validation for various inputs
- Tests run 100 iterations each
- Tests are tagged correctly
- Tests pass consistently

**Property Tests Required**: Properties 15, 16, 17, 18


#### Task 27: Property-Based Tests - User Creation Flow

**Description**: Write property-based tests for user creation operations.

**Files to Create**:
- `src/__tests__/user-management/userCreation.property.test.ts`

**Implementation Details**:
- Use fast-check library for property-based testing
- Test Property 5: Firebase account creation for valid data
- Test Property 6: Temporary password authentication round trip
- Test Property 7: User document creation with required fields
- Test Property 8: Role document creation consistency
- Test Property 9: Duplicate email audit logging
- Test Property 10: Welcome email delivery
- Test Property 11: Welcome email content completeness
- Run 100 iterations per property test
- Tag tests with feature name and property numbers
- Use Firebase Emulator for testing

**Acceptance Criteria**:
- Property tests verify user creation for various valid inputs
- Tests run 100 iterations each
- Tests use Firebase Emulator
- Tests are tagged correctly
- Tests pass consistently

**Property Tests Required**: Properties 5, 6, 7, 8, 9, 10, 11

#### Task 28: Property-Based Tests - Authentication and Password Change

**Description**: Write property-based tests for authentication and password change flow.

**Files to Create**:
- `src/__tests__/user-management/authPasswordChange.property.test.ts`

**Implementation Details**:
- Use fast-check library for property-based testing
- Test Property 13: Authentication triggers document retrieval
- Test Property 14: Forced password reset redirection
- Test Property 19: Valid password change enables submission
- Test Property 20: Password change updates Firebase and Firestore
- Test Property 21: Password change audit logging
- Test Property 22: Role-based dashboard redirection
- Run 100 iterations per property test
- Tag tests with feature name and property numbers
- Use Firebase Emulator for testing

**Acceptance Criteria**:
- Property tests verify auth and password change for various scenarios
- Tests run 100 iterations each
- Tests use Firebase Emulator
- Tests are tagged correctly
- Tests pass consistently

**Property Tests Required**: Properties 13, 14, 19, 20, 21, 22

#### Task 29: Property-Based Tests - User Management Operations

**Description**: Write property-based tests for user management dashboard operations.

**Files to Create**:
- `src/__tests__/user-management/userManagementOps.property.test.ts`

**Implementation Details**:
- Use fast-check library for property-based testing
- Test Property 23: User table data display accuracy
- Test Property 24: Role filter correctness
- Test Property 25: Search filter correctness
- Test Property 26: Pagination page size consistency
- Test Property 27: Pagination controls accuracy
- Test Property 28: Filter persistence across pagination
- Test Property 29: Role change updates Firestore
- Test Property 30: Role change audit logging
- Test Property 31: Account status toggle updates Firebase
- Test Property 32: Account status change audit logging
- Test Property 33: Password reset generates new temporary password
- Test Property 34: Password reset audit logging
- Run 100 iterations per property test
- Tag tests with feature name and property numbers
- Use Firebase Emulator for testing

**Acceptance Criteria**:
- Property tests verify user management operations for various inputs
- Tests run 100 iterations each
- Tests use Firebase Emulator
- Tests are tagged correctly
- Tests pass consistently

**Property Tests Required**: Properties 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34

#### Task 30: Property-Based Tests - Rate Limiting and Audit

**Description**: Write property-based tests for rate limiting and audit logging.

**Files to Create**:
- `src/__tests__/user-management/rateLimitAudit.property.test.ts`

**Implementation Details**:
- Use fast-check library for property-based testing
- Test Property 35: Rate limiting enforcement
- Test Property 36: Rate limit violation audit logging
- Test Property 37: User creation success audit logging
- Test Property 38: User creation failure audit logging
- Test Property 39: Firebase error message mapping
- Test Property 40: Email service data completeness
- Run 100 iterations per property test
- Tag tests with feature name and property numbers
- Use Firebase Emulator for testing

**Acceptance Criteria**:
- Property tests verify rate limiting and audit logging
- Tests run 100 iterations each
- Tests use Firebase Emulator
- Tests are tagged correctly
- Tests pass consistently

**Property Tests Required**: Properties 35, 36, 37, 38, 39, 40


### Phase 6: Documentation and Deployment

#### Task 31: API Documentation

**Description**: Document all new API endpoints with request/response examples.

**Files to Create**:
- `docs/USER_MANAGEMENT_API.md`

**Implementation Details**:
- Document POST /api/users/create endpoint
- Document GET /api/users/list endpoint
- Document PUT /api/users/:userId/role endpoint
- Document PUT /api/users/:userId/status endpoint
- Document POST /api/users/:userId/reset-password endpoint
- Document POST /api/users/change-password endpoint
- Include request/response examples for each endpoint
- Document error codes and messages
- Document authentication requirements
- Document rate limiting

**Acceptance Criteria**:
- All endpoints are documented
- Request/response examples are provided
- Error codes are documented
- Authentication requirements are clear
- Rate limiting is explained

**Property Tests Required**: None (documentation)

#### Task 32: User Guide for Super Admins

**Description**: Create user guide for super admins on how to use the user management system.

**Files to Create**:
- `docs/SUPER_ADMIN_USER_GUIDE.md`

**Implementation Details**:
- Document how to access User Management Dashboard
- Document how to create new users
- Document how to filter and search users
- Document how to change user roles
- Document how to disable/enable accounts
- Document how to reset user passwords
- Include screenshots or diagrams
- Document best practices and security considerations

**Acceptance Criteria**:
- Guide covers all user management features
- Instructions are clear and easy to follow
- Screenshots or diagrams are included
- Best practices are documented
- Security considerations are explained

**Property Tests Required**: None (documentation)

#### Task 33: Environment Variables Configuration

**Description**: Document required environment variables and update .env.example.

**Files to Modify**:
- `.env.example`
- `docs/DEPLOYMENT_GUIDE.md` (create if doesn't exist)

**Implementation Details**:
- Add Firebase Admin SDK configuration variables
- Add email service configuration variables
- Add rate limiting configuration variables
- Add application URL variables
- Document each variable's purpose
- Provide example values
- Document deployment steps

**Acceptance Criteria**:
- All required environment variables are documented
- .env.example is updated
- Deployment guide includes configuration steps
- Example values are provided

**Property Tests Required**: None (configuration)

#### Task 34: Deployment Checklist

**Description**: Create deployment checklist for production rollout.

**Files to Create**:
- `docs/USER_MANAGEMENT_DEPLOYMENT_CHECKLIST.md`

**Implementation Details**:
- List pre-deployment tasks (environment variables, Firebase setup)
- List deployment steps (backend, frontend, security rules, indexes)
- List post-deployment verification steps
- List rollback procedures
- Document monitoring and alerting setup
- Document testing in production

**Acceptance Criteria**:
- Checklist covers all deployment steps
- Pre-deployment tasks are listed
- Deployment steps are in correct order
- Post-deployment verification is included
- Rollback procedures are documented
- Monitoring setup is explained

**Property Tests Required**: None (documentation)


## Task Summary

### Total Tasks: 34

**Phase 1: Backend Infrastructure** (9 tasks)
- Task 1: Password Generation Utility
- Task 2: Email Template Service
- Task 3: User Creation Rate Limiter
- Task 4: User Creation API Endpoint
- Task 5: List Users API Endpoint
- Task 6: Update User Role API Endpoint
- Task 7: Toggle User Status API Endpoint
- Task 8: Reset User Password API Endpoint
- Task 9: Change Password API Endpoint

**Phase 2: Frontend Services** (2 tasks)
- Task 10: User Management Service
- Task 11: Password Validation Utility

**Phase 3: Frontend Components** (6 tasks)
- Task 12: Password Strength Indicator Component
- Task 13: Create User Modal Component
- Task 14: User Management Dashboard Component
- Task 15: Edit Role Dialog Component
- Task 16: Password Reset Page Component
- Task 17: Authentication Flow Integration

**Phase 4: Infrastructure Updates** (3 tasks)
- Task 18: Firestore Security Rules Update
- Task 19: Firestore Indexes Creation
- Task 20: Admin Dashboard Navigation Update

**Phase 5: Testing** (11 tasks)
- Task 21: Backend Unit Tests
- Task 22: Backend Integration Tests
- Task 23: Frontend Component Unit Tests
- Task 24: Property-Based Tests - Password Generation
- Task 25: Property-Based Tests - Form Validation
- Task 26: Property-Based Tests - Password Validation
- Task 27: Property-Based Tests - User Creation Flow
- Task 28: Property-Based Tests - Authentication and Password Change
- Task 29: Property-Based Tests - User Management Operations
- Task 30: Property-Based Tests - Rate Limiting and Audit

**Phase 6: Documentation and Deployment** (4 tasks)
- Task 31: API Documentation
- Task 32: User Guide for Super Admins
- Task 33: Environment Variables Configuration
- Task 34: Deployment Checklist

## Dependencies

### Critical Path
1. Task 1 (Password Generator) → Task 4 (User Creation API)
2. Task 2 (Email Templates) → Task 4 (User Creation API)
3. Task 3 (Rate Limiter) → Task 4 (User Creation API)
4. Task 4 (User Creation API) → Task 10 (User Management Service)
5. Task 10 (User Management Service) → Task 13 (Create User Modal)
6. Task 11 (Password Validation) → Task 12 (Password Strength Indicator)
7. Task 12 (Password Strength Indicator) → Task 16 (Password Reset Page)
8. Task 13 (Create User Modal) → Task 14 (User Management Dashboard)
9. Task 16 (Password Reset Page) → Task 17 (Auth Flow Integration)

### Parallel Work Opportunities
- Backend API endpoints (Tasks 4-9) can be developed in parallel after utilities are complete
- Frontend components (Tasks 12-16) can be developed in parallel after services are complete
- Testing tasks (Tasks 21-30) can be developed in parallel with implementation
- Documentation tasks (Tasks 31-34) can be developed in parallel with implementation

## Estimated Effort

**Backend Infrastructure**: 3-4 days
**Frontend Services**: 1 day
**Frontend Components**: 3-4 days
**Infrastructure Updates**: 1 day
**Testing**: 4-5 days
**Documentation**: 1-2 days

**Total Estimated Effort**: 13-17 days

## Success Criteria

The implementation is complete when:
1. All 34 tasks are completed
2. All 40 correctness properties have passing property-based tests
3. Code coverage meets minimum requirements (80% frontend, 90% backend, 95% utilities)
4. All integration tests pass
5. Firestore security rules are deployed and tested
6. Firestore indexes are deployed
7. Documentation is complete and reviewed
8. Feature is tested in staging environment
9. Deployment checklist is verified
10. Feature is deployed to production

## Notes

- Use existing infrastructure where possible (auditLogger, rateLimiter, emailService)
- Follow existing code patterns and conventions
- Ensure all sensitive operations are logged to audit log
- Test thoroughly with Firebase Emulator before production deployment
- Coordinate with team on deployment timing
- Monitor error rates and performance after deployment
