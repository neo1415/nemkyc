# Implementation Plan: Identity Collection System

## Overview

This plan implements a flexible identity collection system that accepts any CSV/Excel structure, creates dynamic tables, and appends verified NIN/CAC data back to entries. The implementation builds on existing patterns while introducing dynamic schema handling.

## Tasks

- [x] 1. Update type definitions for new flexible schema
  - [x] 1.1 Update `src/types/remediation.ts` with new interfaces
    - Rename to identity-focused naming (IdentityList, IdentityEntry, ActivityLog)
    - Add dynamic `data: Record<string, any>` field for preserving original columns
    - Add `columns: string[]` for schema tracking
    - Add `emailColumn: string` for email source tracking
    - _Requirements: 1.2, 1.5_

  - [x] 1.2 Update Firestore security rules
    - Rename collections: identity-lists, identity-entries, identity-logs
    - _Requirements: All_

- [x] 2. Implement flexible file parser
  - [x] 2.1 Create/update `src/utils/fileParser.ts`
    - Parse CSV using papaparse (preserve all columns)
    - Parse Excel using xlsx (preserve all columns)
    - Auto-detect email column (first column containing "email" case-insensitive)
    - Return { columns: string[], rows: object[], detectedEmailColumn: string | null }
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 2.2 Write property tests for file parsing

    - **Property 1: Column Preservation**
    - **Property 2: Email Auto-Detection**
    - **Validates: Requirements 1.2, 1.3**

- [x] 3. Update backend API for flexible lists
  - [x] 3.1 Update list creation endpoint
    - `POST /api/identity/lists` - accept dynamic columns and entries
    - Store columns array and emailColumn in list document
    - Store each entry with `data` object containing all original values
    - Extract email from specified column
    - _Requirements: 1.6, 1.7_

  - [x] 3.2 Update list retrieval endpoints
    - `GET /api/identity/lists` - return all lists with stats
    - `GET /api/identity/lists/:listId` - return list with entries, support filtering/search
    - `DELETE /api/identity/lists/:listId` - delete list and all entries
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [-] 3.3 Write property test for data integrity

    - **Property 5: Data Append Integrity**
    - **Validates: Requirements 7.1, 7.2**

- [x] 4. Update verification link generation
  - [x] 4.1 Update token generation for new schema
    - Generate tokens when admin selects entries and verification type
    - Store verificationType (NIN or CAC) with entry
    - Update entry status to "link_sent" after email sent
    - _Requirements: 3.5, 3.6, 4.1, 4.2, 4.3_

  - [ ]* 4.2 Write property tests for tokens
    - **Property 3: Token Uniqueness and Security**
    - **Property 7: Token Expiration Handling**
    - **Property 8: Token Invalidation on Resend**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 8.2**

- [x] 5. Update email sending flow
  - [x] 5.1 Update send endpoint for selective sending
    - `POST /api/identity/lists/:listId/send` - accept entryIds and verificationType
    - Generate tokens only for selected entries
    - Send emails with verification links
    - Update entry status and linkSentAt
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.2 Write property test for rate limiting
    - **Property 9: Rate Limiting Enforcement**
    - **Validates: Requirements 5.5**

- [x] 6. Checkpoint - Backend API complete
  - Ensure all backend tests pass, ask user if questions arise.

- [x] 7. Update Admin UI - Lists Dashboard
  - [x] 7.1 Create/update `src/pages/admin/IdentityListsDashboard.tsx`
    - Display all lists as cards or table
    - Show: name, upload date, total entries, verified count, progress %
    - Upload button opens dialog
    - Click list navigates to detail page
    - Delete button with confirmation
    - _Requirements: 2.1, 2.5, 2.6, 10.1, 10.2_

  - [x] 7.2 Create/update `src/components/identity/UploadDialog.tsx`
    - Drag & drop file upload
    - Preview first 10 rows as table
    - Highlight auto-detected email column
    - Allow manual email column selection if not detected
    - Name input field
    - Confirm creates list
    - _Requirements: 1.1, 1.3, 1.4, 1.7_

- [x] 8. Update Admin UI - List Detail Page
  - [x] 8.1 Create/update `src/pages/admin/IdentityListDetail.tsx`
    - Dynamic DataGrid showing ALL original columns + verification columns
    - Checkbox selection for entries
    - "Request NIN" and "Request CAC" buttons (enabled when selected)
    - Search across all columns
    - Filter by status dropdown
    - Export button
    - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2, 7.3_

  - [x] 8.2 Create `src/components/identity/SendConfirmDialog.tsx`
    - Show selected entry count
    - Display extracted emails in formatted list
    - Show verification type
    - Confirm/Cancel buttons
    - _Requirements: 3.3, 3.4_

  - [x] 8.3 Add activity log panel
    - Show recent activity for the list
    - Filter by action type
    - _Requirements: 9.2, 9.3, 9.4_

- [x] 9. Update Customer Verification Page
  - [x] 9.1 Update `src/pages/public/CustomerVerificationPage.tsx`
    - Fetch entry info using token
    - Display any available name/policy from entry data
    - Show NIN input (11 digits) if verificationType is NIN
    - Show CAC inputs (number + company name) if verificationType is CAC
    - Handle success/error/expired states
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ]* 9.2 Write property test for input validation
    - **Property 10: Identity Input Validation**
    - **Validates: Requirements 6.3, 6.4**

- [x] 10. Update verification submission endpoint
  - [x] 10.1 Update `POST /api/identity/verify/:token`
    - Validate input based on verificationType
    - Call Paystack API
    - On success: append NIN/CAC to entry, set status "verified"
    - On failure: increment attempts, allow retry up to 3
    - On max attempts: set status "failed"
    - _Requirements: 6.5, 6.6, 6.7, 6.8_

  - [ ]* 10.2 Write property test for status transitions
    - **Property 4: Status Consistency**
    - **Validates: Requirements 5.3, 5.4, 6.6, 6.8**

- [x] 11. Implement export functionality
  - [x] 11.1 Update export endpoint
    - `GET /api/identity/lists/:listId/export`
    - Generate CSV with all original columns + verification columns
    - Include all entries regardless of status
    - _Requirements: 7.3, 7.4, 7.5_

  - [ ]* 11.2 Write property test for export
    - **Property 6: Export Completeness**
    - **Validates: Requirements 7.3, 7.4, 7.5**

- [x] 12. Implement resend functionality
  - [x] 12.1 Update resend endpoint
    - `POST /api/identity/entries/:entryId/resend`
    - Generate new token, invalidate old
    - Increment resendCount
    - Show warning if resendCount > 3
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 12.2 Write property test for resend
    - **Property 11: Resend Count Tracking**
    - **Validates: Requirements 8.3, 8.5**

- [x] 13. Update activity logging
  - [x] 13.1 Ensure all actions create logs
    - Log: list_created, list_deleted, links_sent, link_resent, verification_success, verification_failed, export_generated
    - Include timestamp, actor, details
    - _Requirements: 9.1, 9.3_

  - [ ]* 13.2 Write property test for logging
    - **Property 12: Activity Log Completeness**
    - **Validates: Requirements 9.1, 9.3**

- [x] 14. Update routes and navigation
  - [x] 14.1 Update App.tsx routes
    - `/admin/identity` - Lists dashboard
    - `/admin/identity/:listId` - List detail
    - `/verify/:token` - Customer page (public)
    - _Requirements: All UI requirements_

  - [x] 14.2 Update admin sidebar navigation
    - Add "Identity Collection" link
    - _Requirements: 2.1_

- [ ] 15. Final integration testing
  - [ ] 15.1 Test complete workflow
    - Upload file → preview → create list
    - Select entries → choose NIN/CAC → confirm emails → send
    - Customer receives email → clicks link → submits NIN/CAC
    - Admin sees verified data appended to entry
    - Export includes all data
    - _Requirements: All_

- [ ] 16. Final checkpoint
  - Ensure all tests pass, ask user if questions arise.

- [x] 17. Bug fixes and enhancements
  - [x] 17.1 Add name auto-detection to file parser
    - Update `src/utils/fileParser.ts` to detect name columns
    - Search left to right for: firstName, lastName, middleName, insured, fullName, name
    - Return detected name columns in parse result
    - _Requirements: 1.5, 1.6_

  - [x] 17.2 Update list creation to store name columns
    - Update `POST /api/identity/lists` to accept and store nameColumns
    - Extract and store displayName for each entry
    - Auto-detect policy number column (contains "policy")
    - _Requirements: 1.5, 1.6_

  - [x] 17.3 Fix duplicate columns in list detail view
    - Remove duplicate Status/Verification Status columns (use only "status")
    - Remove duplicate NIN/CAC columns if they exist in original data
    - Ensure linkSentAt timestamp displays correctly
    - _Requirements: 1.7, 1.8_

  - [x] 17.4 Update customer verification page to display name and policy
    - Update `GET /api/identity/verify/:token` to return displayName and policyNumber
    - Update `CustomerVerificationPage.tsx` to prominently display customer name
    - Show policy number if available
    - Add message that NIN/CAC will be validated against displayed name
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 17.5 Update upload dialog to show detected name columns
    - Highlight auto-detected name columns in preview
    - Show which columns will be used for customer name
    - _Requirements: 1.5, 1.6_

- [ ] 18. Final verification checkpoint
  - Ensure all bug fixes work correctly, ask user if questions arise.

- [x] 19. Implement broker role and access control
  - [x] 19.1 Update user data model
    - Add `role` field to users collection in Firestore
    - Update `src/types/index.ts` with UserRole type
    - Valid roles: 'default', 'broker', 'compliance', 'claims', 'admin', 'super_admin'
    - _Requirements: 11.1, 12.6_

  - [x] 19.2 Update authentication context
    - Update `src/contexts/AuthContext.tsx` to include user role
    - Fetch and store role from Firestore on login
    - Provide role in context for components to use
    - _Requirements: 11.1_

  - [x] 19.3 Update Firestore security rules for role-based access
    - Update `firestore.rules` for identity-lists collection
    - Brokers can only read/write lists where `createdBy == request.auth.uid`
    - Admin/compliance/super_admin can read/write all lists
    - Update rules for identity-entries collection similarly
    - _Requirements: 11.3, 11.4, 11.5, 11.7, 11.9_

  - [x] 19.4 Update backend API with role filtering
    - Add role check middleware to identity endpoints
    - Filter lists by `createdBy` for broker role
    - Return 403 for unauthorized access attempts
    - Update `GET /api/identity/lists` to filter by role
    - Update `GET /api/identity/lists/:listId` to check ownership
    - Update `POST /api/identity/lists/:listId/send` to check ownership
    - Update `DELETE /api/identity/lists/:listId` to check ownership
    - _Requirements: 11.3, 11.4, 11.5, 11.7, 11.8, 11.9_

  - [x] 19.5 Write property tests for broker access isolation

    - **Property 13: Broker Access Isolation**
    - **Property 14: Admin Access Universality**
    - **Validates: Requirements 11.3, 11.4, 11.5, 11.7, 11.9**

- [x] 20. Implement broker registration
  - [x] 20.1 Update registration form
    - Add userType field to `src/pages/auth/SignUp.tsx`
    - Options: "Regular User" or "Broker"
    - Comment out the UI for this field (keep logic)
    - Make field not required
    - _Requirements: 12.1, 12.4, 12.5_

  - [x] 20.2 Update registration logic
    - Update `src/services/authService.ts` registration function
    - If userType is "broker", set role to "broker" in Firestore
    - If userType is "regular" or undefined, set role to "default"
    - Store role in users collection document
    - _Requirements: 12.2, 12.3, 12.6, 12.7_

  - [x] 20.3 Write property test for role assignment

    - **Property 15: Role Assignment on Registration**
    - **Validates: Requirements 12.2, 12.3, 12.6, 12.7**

- [x] 21. Implement admin user role management
  - [x] 21.1 Update admin users table
    - Update `src/pages/admin/AdminUsersTable.tsx`
    - Add role dropdown column
    - Include all roles: default, broker, compliance, claims, admin, super_admin
    - _Requirements: 13.1, 13.2_

  - [x] 21.2 Create role update endpoint
    - Add `PATCH /api/users/:userId/role` endpoint in server.js
    - Require admin or super_admin role to access
    - Update user's role in Firestore
    - Return 403 if non-admin attempts to change roles
    - _Requirements: 13.3, 13.4, 13.5, 13.6_

  - [x] 21.3 Update frontend to call role update endpoint
    - Add role change handler in AdminUsersTable
    - Show confirmation dialog before changing role
    - Display success/error messages
    - _Requirements: 13.3_

- [x] 22. Implement dynamic email template
  - [x] 22.1 Update email template
    - Update `src/templates/verificationEmail.ts`
    - Make template dynamic based on verificationType
    - Use "Dear Client" as greeting
    - Include conditional text for NIN vs CAC
    - Include full regulatory text from requirements
    - Include contact information
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [x] 22.2 Write property test for email template

    - **Property 19: Email Template Dynamic Content**
    - **Validates: Requirements 14.1, 14.2, 14.4, 14.7**

- [x] 23. Implement upload templates
  - [x] 23.1 Define template schemas
    - Create template definitions in `src/utils/fileParser.ts`
    - Individual template: title, first name, last name, phone number, email, address, gender (required) + optional fields
    - Corporate template: company name, company address, email address, company type, phone number (required)
    - _Requirements: 15.1, 15.2, 15.3_

  - [x] 23.2 Add template validation logic
    - Add function to detect if file matches Individual template
    - Add function to detect if file matches Corporate template
    - Add function to validate required columns are present
    - Return validation errors listing missing columns
    - _Requirements: 15.5, 15.6, 15.7, 15.8, 15.9_

  - [x] 23.3 Update upload dialog with template mode
    - Add mode selector: "Template Mode" / "Flexible Mode"
    - Display template requirements when in template mode
    - Show detected list type (Individual/Corporate)
    - Display validation errors if required columns missing
    - Maintain flexible mode for backward compatibility
    - _Requirements: 15.4, 15.10, 15.11_

  - [x] 23.4 Update list creation to store template info
    - Update `POST /api/identity/lists` to accept listType and uploadMode
    - Store listType ('individual', 'corporate', 'flexible') in list document
    - Store uploadMode ('template', 'flexible') in list document
    - _Requirements: 15.7_

  - [x] 23.5 Write property tests for template validation

    - **Property 16: Template Validation - Individual**
    - **Property 17: Template Validation - Corporate**
    - **Property 18: List Type Auto-Detection**
    - **Property 20: Backward Compatibility**
    - **Validates: Requirements 15.1, 15.3, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10**

- [x] 24. Update navigation and routing
  - [x] 24.1 Update route protection
    - Update `src/App.tsx` to check role for identity routes
    - Allow broker, admin, compliance, super_admin roles
    - Redirect others to unauthorized page
    - _Requirements: 11.2_

  - [x] 24.2 Update sidebar navigation
    - Show "Identity Collection" link for broker, admin, compliance, super_admin
    - Hide for default and claims roles
    - _Requirements: 11.2_

- [x] 25. Integration testing for new features
  - [x] 25.1 Test broker workflow
    - Broker registers → role set to broker
    - Broker uploads list → createdBy set correctly
    - Broker sees only own lists
    - Broker cannot access other users' lists
    - Admin can see all lists including broker lists
    - _Requirements: 11, 12_

  - [x] 25.2 Test template mode
    - Upload Individual template file → validates and creates list
    - Upload Corporate template file → validates and creates list
    - Upload file missing required columns → shows error
    - Upload in flexible mode → accepts any structure
    - _Requirements: 15_

  - [x] 25.3 Test dynamic email
    - Send NIN verification → email contains "Individual Clients" and "NIN"
    - Send CAC verification → email contains "Corporate Clients" and "CAC"
    - Email contains full regulatory text
    - _Requirements: 14_

  - [x] 25.4 Test role management
    - Admin changes user role to broker → user sees only own lists
    - Admin changes broker role to admin → user sees all lists
    - Non-admin cannot change roles
    - _Requirements: 13_

- [-] 26. Final checkpoint - All features complete
  - Ensure all new features work correctly, ask user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests
- The key change is dynamic schema support via `data: Record<string, any>`
- Original column order preserved in `columns: string[]`
- Email extracted from auto-detected or manually selected column
- Verification data (NIN/CAC) appended as dedicated fields, not mixed into `data`
- UI uses MUI DataGrid with dynamic columns based on list schema
- Existing token generation and email utilities can be reused with updates

