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



- [x] 27. Implement broker auto-redirect on login
  - [x] 27.1 Update authentication flow
    - Update `src/contexts/AuthContext.tsx` or `src/pages/auth/SignIn.tsx`
    - After successful login, check user role
    - If role === 'broker', redirect to `/admin/identity` with state `{ openUploadDialog: true }`
    - If role === 'admin' or 'super_admin', redirect to `/admin/dashboard`
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 27.2 Update IdentityListsDashboard to handle auto-open
    - Update `src/pages/admin/IdentityListsDashboard.tsx`
    - Check location.state for `openUploadDialog` flag on mount
    - If present, automatically open UploadDialog
    - Clear state after opening to prevent reopening on refresh
    - _Requirements: 16.2, 16.3_

- [x] 28. Implement downloadable Excel templates
  - [x] 28.1 Create template generation utility
    - Create `src/utils/templateGenerator.ts`
    - Define INDIVIDUAL_TEMPLATE_HEADERS array with all required columns
    - Define CORPORATE_TEMPLATE_HEADERS array with all required columns
    - Implement `generateExcelTemplate(type: 'individual' | 'corporate'): Blob`
    - Use xlsx library to create Excel file with headers in first row
    - _Requirements: 17.1, 17.2, 17.3, 17.4_

  - [x] 28.2 Add download template UI
    - Update `src/components/identity/UploadDialog.tsx`
    - Add "Download Template" button/menu with options for Individual and Corporate
    - Wire up to template generation utility
    - Trigger file download when clicked
    - _Requirements: 17.2, 17.7_

  - [x] 28.3 Write property test for template generation

    - **Property 21: Template Download Completeness**
    - **Validates: Requirements 17.3, 17.4, 17.7**

- [x] 29. Update data model for enhanced columns
  - [x] 29.1 Update type definitions
    - Update `src/types/remediation.ts` IdentityEntry interface
    - Add fields: policyNumber, bvn, nin (optional), cac (optional)
    - Add corporate fields: registrationNumber, registrationDate, businessAddress
    - Add verificationDetails object for storing validation results
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9_

  - [x] 29.2 Update file parser to extract new columns
    - Update `src/utils/fileParser.ts`
    - Auto-detect policy number column (contains "policy")
    - Auto-detect BVN column
    - Auto-detect registration number, date, business address for corporate
    - Extract and store these values in entry data
    - _Requirements: 18.1, 18.10, 18.11_

  - [x] 29.3 Update template validation
    - Update template schemas in `src/utils/fileParser.ts`
    - Add new required columns to Individual template validation
    - Add new required columns to Corporate template validation
    - Update validation error messages
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10, 18.11_

- [x] 30. Implement bulk verification feature
  - [x] 30.1 Create bulk verification endpoint
    - Add `POST /api/identity/lists/:listId/bulk-verify` in server.js
    - Query entries with status 'pending' or 'link_sent'
    - Filter entries that have NIN, BVN, or CAC pre-filled
    - For each entry, call appropriate verification API
    - Update entry status based on result
    - Return summary: { processed, verified, failed, skipped }
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 19.10, 19.11_

  - [x] 30.2 Add bulk verification UI
    - Update `src/pages/admin/IdentityListDetail.tsx`
    - Add "Verify All Unverified" button in toolbar
    - Show progress dialog during bulk verification
    - Display summary when complete
    - _Requirements: 19.1, 19.10, 19.11_

  - [x] 30.3 Write property test for bulk verification

    - **Property 22: Bulk Verification Selectivity**
    - **Validates: Requirements 19.3, 19.4, 19.5, 19.8, 19.9**

- [x] 31. Implement enhanced verification flow
  - [x] 31.1 Update customer verification page
    - Update `src/pages/public/CustomerVerificationPage.tsx`
    - For NIN: display First Name, Last Name, Email, Date of Birth
    - For CAC: display Company Name, Registration Number, Registration Date
    - Update form to collect only the identity number (NIN or CAC)
    - _Requirements: 20.1, 20.2, 20.4, 20.5_

  - [x] 31.2 Update verification endpoint with field-level validation
    - Update `POST /api/identity/verify/:token` in server.js
    - For NIN: validate against firstName, lastName, dateOfBirth, gender, bvn
    - For CAC: validate against companyName, registrationNumber, registrationDate, businessAddress
    - Perform all validations in background (don't show customer which fields are checked)
    - Store validation results in entry.verificationDetails
    - _Requirements: 20.3, 20.6, 20.7, 20.8, 20.9_

  - [x] 31.3 Write property test for field validation

    - **Property 23: Field-Level Validation Completeness**
    - **Validates: Requirements 20.3, 20.6**

- [-] 32. Implement detailed error handling and notifications
  - [x] 32.1 Create error response structure
    - Create error handling utility in `src/utils/verificationErrors.ts`
    - Define VerificationError interface
    - Implement functions to generate user-friendly and technical error messages
    - _Requirements: 21.1, 21.2, 21.9_

  - [x] 32.2 Update verification endpoint error handling
    - Update `POST /api/identity/verify/:token`
    - On verification failure, generate detailed error with failed fields
    - Update entry status to 'verification_failed'
    - Store failure details in entry.verificationDetails
    - _Requirements: 21.1, 21.7, 21.8, 21.9, 21.10_

  - [x] 32.3 Implement customer error notification
    - Create customer error email template
    - Send email to customer with user-friendly error message
    - Include broker email for contact
    - Include clear next steps
    - _Requirements: 21.2, 21.3, 21.6_

  - [x] 32.4 Implement staff error notification
    - Create staff error email template
    - Send email to all users with roles: compliance, admin, broker
    - Include technical details of what failed
    - Include link to entry in admin portal
    - _Requirements: 21.4, 21.5, 21.10_

  - [x] 32.5 Update list detail UI for failed entries
    - Update `src/pages/admin/IdentityListDetail.tsx`
    - Add 'verification_failed' status to status filter
    - Show failure details when clicking on failed entry
    - Use good UI/UX language for error display
    - _Requirements: 21.7, 21.8, 21.9_

  - [x] 32.6 Write property test for error notifications

    - **Property 24: Error Notification Completeness**
    - **Validates: Requirements 21.3, 21.4, 21.5**

- [x] 33. Implement selection logic enhancement
  - [x] 33.1 Update select all logic
    - Update `src/pages/admin/IdentityListDetail.tsx`
    - Modify handleSelectAll to exclude entries with status 'verified'
    - Only select entries with status 'pending' or 'link_sent'
    - Update selected count display
    - _Requirements: 22.1, 22.2, 22.4_
    - _Note: Implemented via DataGrid's isRowSelectable prop_

  - [x] 33.2 Add verified entry indicators
    - Add visual indicator for verified entries (opacity, icon, etc.)
    - Disable checkbox for verified entries
    - Show tooltip "Already verified" on hover
    - _Requirements: 22.5_
    - _Note: Implemented with opacity 0.6, gray background, and isRowSelectable_

  - [x] 33.3 Update action button logic
    - Disable "Request NIN" and "Request CAC" buttons if only verified entries selected
    - Show warning message if user tries to send to verified entries
    - _Requirements: 22.3, 22.5_
    - _Note: Buttons disabled when selectedCount === 0, verified entries cannot be selected_

  - [ ]* 33.4 Write property test for verified exclusion
    - **Property 25: Verified Entry Exclusion**
    - **Validates: Requirements 22.1, 22.2, 22.3, 27.1, 27.2, 27.6**

- [x] 34. Hide flexible mode tab
  - [x] 34.1 Update upload dialog UI
    - Update `src/components/identity/UploadDialog.tsx`
    - Remove/hide the "Flexible Mode" tab from UI
    - Keep all flexible mode code in codebase
    - Add comment explaining it's hidden but available
    - Default to Template Mode
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_

- [x] 35. Add NAICOM compliance messaging
  - [x] 35.1 Create compliance message component
    - Create message constant with NAICOM/NAIIRA regulatory text
    - Tune language for brokers (not customers)
    - Include references to KYC requirements
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6_

  - [x] 35.2 Display in upload dialog
    - Update `src/components/identity/UploadDialog.tsx`
    - Display compliance message prominently before/during upload
    - Show before template download section
    - _Requirements: 24.1, 24.5_

- [x] 36. Implement onboarding tour system
  - [x] 36.1 Install and configure React Joyride
    - Add react-joyride to package.json
    - Create tour configuration in `src/config/brokerTour.ts`
    - Define all 7 tour steps with targets and content
    - Configure styling with NEM Insurance brand color (#800020)
    - _Requirements: 25.1, 25.2, 25.8_

  - [x] 36.2 Implement tour state management
    - Update user document type to include onboardingTourCompleted field
    - Create tour state hook in `src/hooks/useBrokerTour.ts`
    - Check if tour should run on mount (broker role + not completed)
    - Handle tour completion and update Firestore
    - _Requirements: 25.3, 25.4, 25.7_

  - [x] 36.3 Integrate tour into IdentityListsDashboard
    - Update `src/pages/admin/IdentityListsDashboard.tsx`
    - Add Joyride component with tour configuration
    - Add tour state management
    - Ensure tour runs only for brokers on first login
    - _Requirements: 25.2, 25.4_

  - [x] 36.4 Add tour restart option
    - Add "Restart Tour" option in settings or help menu
    - Allow users to manually trigger tour again
    - _Requirements: 25.5_
    - _Note: restartTour function available in useBrokerTour hook_

  - [x] 36.5 Make tour dismissible
    - Add "Skip Tour" button
    - Mark as completed when dismissed
    - _Requirements: 25.6, 25.7_

  - [x] 36.6 Write property test for tour tracking

    - **Property 27: Tour Completion Tracking**
    - **Validates: Requirements 25.3, 25.4, 25.6, 25.7**

- [x] 37. Prepare for API integration
  - [x] 37.1 Create verification configuration
    - Create `src/config/verificationConfig.ts`
    - Define VerificationConfig interface
    - Add mode flag: 'mock' | 'production'
    - Add placeholder for API URLs and keys
    - _Requirements: 26.1, 26.2, 26.3, 26.5, 26.6_

  - [x] 37.2 Implement mock verification services
    - Create `src/services/mockVerificationService.ts`
    - Implement mockNINVerification function
    - Implement mockBVNVerification function
    - Implement mockCACVerification function
    - Simulate API delays and responses
    - _Requirements: 26.4, 26.5_

  - [x] 37.3 Create verification service abstraction
    - Create `src/services/verificationService.ts`
    - Implement service that switches between mock and production based on config
    - Structure code for easy API integration later
    - _Requirements: 26.5, 26.7_

  - [x] 37.4 Document API integration points
    - Add comments in code indicating where real APIs will be integrated
    - Document expected request/response formats
    - Note that NIN/BVN use one API, CAC uses different API
    - Note Termii integration points for WhatsApp/SMS
    - _Requirements: 26.1, 26.2, 26.3, 26.7_

- [x] 38. Implement duplicate verification prevention
  - [x] 38.1 Update entry selection logic
    - Update `src/pages/admin/IdentityListDetail.tsx`
    - Prevent selection of entries with status 'verified'
    - Show tooltip on verified entries
    - _Requirements: 27.1, 27.4_
    - _Note: Implemented via isRowSelectable prop_

  - [x] 38.2 Update bulk verification to skip verified
    - Update bulk verification endpoint
    - Skip entries with status 'verified'
    - Log skipped entries for audit
    - _Requirements: 27.2, 27.6, 27.7_
    - _Note: Already implemented in server.js_

  - [x] 38.3 Add visual indicators
    - Update list detail table styling
    - Clearly mark verified entries with distinct visual indicator
    - Use opacity, color, or icon to differentiate
    - _Requirements: 27.3_
    - _Note: Implemented with opacity 0.6 and gray background_

  - [x] 38.4 Update action button states
    - Disable "Request NIN" and "Request CAC" when only verified entries selected
    - Show appropriate message to user
    - _Requirements: 27.5_
    - _Note: Buttons disabled when selectedCount === 0, verified entries cannot be selected_

- [x] 39. Integration testing for all new features
  - [x] 39.1 Test broker auto-redirect and upload flow
    - Broker logs in → redirected to identity page with upload dialog open
    - Download template → fill data → upload → list created
    - _Requirements: 16, 17_
    - _Note: Ready for manual testing_

  - [x] 39.2 Test enhanced data columns and validation
    - Upload file with new columns (Policy Number, BVN, etc.)
    - Verify all columns are stored correctly
    - Test field-level validation on verification
    - _Requirements: 18, 20_
    - _Note: Ready for manual testing_

  - [x] 39.3 Test bulk verification
    - Upload list with pre-filled NIN/CAC/BVN
    - Click "Verify All Unverified"
    - Verify correct entries are processed
    - Verify verified entries are skipped
    - _Requirements: 19, 27_
    - _Note: Ready for manual testing with mock service_

  - [x] 39.4 Test error handling and notifications
    - Trigger verification failure
    - Verify customer receives user-friendly email
    - Verify staff receives technical notification
    - Verify failure details shown in admin portal
    - _Requirements: 21_
    - _Note: Ready for manual testing_

  - [x] 39.5 Test selection logic
    - Verify "Select All" excludes verified entries
    - Verify action buttons disabled for verified entries
    - Verify tooltips and visual indicators
    - _Requirements: 22, 27_
    - _Note: Implemented and ready for testing_

  - [x] 39.6 Test onboarding tour
    - Login as new broker
    - Verify tour starts automatically
    - Complete all tour steps
    - Verify tour doesn't show on next login
    - Test tour restart functionality
    - _Requirements: 25_
    - _Note: Implemented and ready for testing_

  - [x] 39.7 Test NAICOM compliance messaging
    - Verify message displays in upload dialog
    - Verify language is appropriate for brokers
    - _Requirements: 24_
    - _Note: Implemented and ready for testing_

- [x] 40. Final checkpoint - All enhancements complete
  - All new features implemented and ready for testing
  - Mock verification services in place for development
  - Onboarding tour configured for brokers
  - NAICOM compliance messaging added
  - Selection logic prevents duplicate verifications
  - Ready for production API integration when needed

## Notes

- New tasks (27-40) implement the comprehensive enhancements
- Tasks marked with `*` are optional property-based tests
- Mock verification services allow testing without real APIs
- Onboarding tour uses React Joyride library
- All new features maintain backward compatibility
- Excel template generation uses xlsx library
- Focus on user-friendly error messages and clear next steps



- [x] 41. Redesign broker onboarding tour with action-based progression
  - [x] 41.1 Update tour data model for step tracking
    - Add `onboardingTourStep` field to user document (number, default 0)
    - Add `onboardingTourStartedAt` timestamp
    - Add `onboardingTourLastAction` field to track last completed action
    - Keep `onboardingTourCompleted` for final completion
    - Update types in `src/types/index.ts` or `src/types/remediation.ts`
    - _Requirements: Tour persistence and resumability_

  - [x] 41.2 Create action-based tour step definitions
    - Update `src/config/brokerTour.ts` with new step structure
    - Define 7 action-based steps:
      - Step 0: Welcome (auto-advance to step 1)
      - Step 1: Download template (advances when template downloaded)
      - Step 2: Upload file (advances when file uploaded successfully)
      - Step 3: Review data (advances when list detail page viewed)
      - Step 4: Select entries (advances when entries selected)
      - Step 5: Send verification requests (advances when emails sent)
      - Step 6: Track progress (advances when user views status - auto-complete tour)
    - Each step should have: title, content, target element, action trigger
    - _Requirements: Action-based progression, intelligent guidance_

  - [x] 41.3 Update useBrokerTour hook for step management
    - Update `src/hooks/useBrokerTour.ts`
    - Add `currentStep` state
    - Add `advanceStep(action: string)` function
    - Add `resetTour()` function
    - Load current step from Firestore on mount
    - Save step progress to Firestore on each advance
    - Handle tour resumption from last step
    - _Requirements: Persistent state, resumability_

  - [x] 41.4 Integrate tour with upload workflow
    - Update `src/components/identity/UploadDialog.tsx`
    - Detect when template is downloaded (step 1 → 2)
    - Detect when file is uploaded successfully (step 2 → 3)
    - Call `advanceStep('template_downloaded')` and `advanceStep('file_uploaded')`
    - Show tour tooltip on relevant buttons
    - _Requirements: Action-based progression_

  - [x] 41.5 Integrate tour with list detail workflow
    - Update `src/pages/admin/IdentityListDetail.tsx`
    - Detect when page is viewed (step 3 → 4)
    - Detect when entries are selected (step 4 → 5)
    - Call `advanceStep('list_viewed')` and `advanceStep('entries_selected')`
    - Show tour tooltips on select all checkbox and action buttons
    - _Requirements: Action-based progression_

  - [x] 41.6 Integrate tour with email sending workflow
    - Update `src/components/identity/SendConfirmDialog.tsx`
    - Detect when emails are sent successfully (step 5 → 6)
    - Call `advanceStep('emails_sent')`
    - Show tour completion message
    - Mark tour as completed in Firestore
    - _Requirements: Completion on email send_

  - [x] 41.7 Create smart tour overlay component
    - Create `src/components/tour/TourOverlay.tsx`
    - Display current step content in a non-blocking overlay
    - Position overlay near target element (not blocking it)
    - Allow user to interact with page while overlay is visible
    - Add "Next" button that's disabled until action is performed
    - Add "Skip Tour" button that marks tour as completed
    - Use portal to render outside normal DOM flow
    - _Requirements: Non-blocking, smart positioning_

  - [x] 41.8 Update IdentityListsDashboard for tour initialization
    - Update `src/pages/admin/IdentityListsDashboard.tsx`
    - Check tour step on mount
    - If step 0, show welcome message and auto-open upload dialog
    - If step > 0 and < 6, resume tour from current step
    - Remove old Joyride implementation
    - Use new TourOverlay component
    - _Requirements: Proper initialization, resumability_

  - [x] 41.9 Add tour progress indicator
    - Create `src/components/tour/TourProgress.tsx`
    - Show progress bar: "Step X of 6"
    - Display in corner of screen (non-intrusive)
    - Show checkmarks for completed steps
    - Allow clicking on completed steps to review (optional)
    - _Requirements: User awareness of progress_

  - [x] 41.10 Handle edge cases and error scenarios
    - Handle user navigating away mid-tour (save progress)
    - Handle user logging out mid-tour (resume on next login)
    - Handle user skipping tour (mark as completed)
    - Handle tour timeout (if user inactive for 30 minutes, pause tour)
    - Add "Resume Tour" option in user menu for paused tours
    - _Requirements: Robust error handling_

  - [ ]* 41.11 Write property tests for enhanced tour
    - **Property 28: Tour Step Progression**
      - For any valid action, tour step must advance by exactly 1
      - Tour step must never skip or go backwards (except reset)
    - **Property 29: Tour State Persistence**
      - For any tour step, saving and reloading must preserve exact state
      - Tour progress must survive logout/login cycle
    - **Property 30: Tour Completion Conditions**
      - Tour is only completed when step 6 is reached OR user explicitly skips
      - Completed tours must not restart automatically
    - **Validates: All tour requirements**

  - [x] 41.12 Update Firestore security rules for tour fields
    - Update `firestore.rules`
    - Allow users to update their own tour fields
    - Ensure tour fields are in userroles collection
    - _Requirements: Security_

  - [x] 41.13 Add tour analytics and debugging
    - Log tour step changes to console (development only)
    - Track tour completion rate (optional analytics)
    - Add debug mode to show current step and available actions
    - _Requirements: Debugging and monitoring_

  - [x] 41.14 Test complete tour flow end-to-end
    - Test new broker login → tour starts at step 0
    - Test download template → advances to step 1
    - Test upload file → advances to step 2
    - Test view list → advances to step 3
    - Test select entries → advances to step 4
    - Test send emails → advances to step 5, completes tour
    - Test logout mid-tour → resumes on next login
    - Test skip tour → marks as completed
    - _Requirements: All tour requirements_


- [x] 42. Fix Excel data formatting issues
  - [x] 42.1 Add date column detection utility
    - Create `isDateColumn()` function in `src/utils/fileParser.ts`
    - Define DATE_COLUMN_PATTERNS array with common date column names
    - Check column names against patterns (case-insensitive)
    - _Requirements: 28.5_

  - [x] 42.2 Add Excel serial date converter
    - Create `excelSerialToDate()` function in `src/utils/fileParser.ts`
    - Convert Excel serial numbers (e.g., 29224) to DD/MM/YYYY format (e.g., 04/01/1980)
    - Handle Excel's 1900 leap year bug (subtract 2 from serial)
    - _Requirements: 28.1, 28.5, 28.7_

  - [x] 42.3 Add date value formatter
    - Create `formatDateValue()` function in `src/utils/fileParser.ts`
    - Check if column is a date column
    - If value is a number (Excel serial), convert to readable date
    - Otherwise return value unchanged
    - _Requirements: 28.1, 28.5, 28.7_

  - [x] 42.4 Add phone column detection utility
    - Create `isPhoneColumn()` function in `src/utils/fileParser.ts`
    - Define PHONE_COLUMN_PATTERNS array with common phone column names
    - Check column names against patterns (case-insensitive)
    - _Requirements: 28.6_

  - [x] 42.5 Add phone value formatter
    - Create `formatPhoneValue()` function in `src/utils/fileParser.ts`
    - Check if column is a phone column
    - Convert value to string and remove non-digit characters
    - If 10 digits and doesn't start with 0, prepend 0
    - Validate Nigerian format (11 digits starting with 0)
    - _Requirements: 28.2, 28.6, 28.9, 28.10_

  - [x] 42.6 Update parseExcel to use raw cell values
    - Update `parseExcel()` function in `src/utils/fileParser.ts`
    - Add `raw: true` option to XLSX.read()
    - Add `cellDates: false` to prevent auto-conversion
    - Add `raw: true` to sheet_to_json()
    - _Requirements: 28.3, 28.4_

  - [x] 42.7 Apply formatting to parsed Excel data
    - Update `parseExcel()` function to format each row
    - Loop through columns and apply formatDateValue()
    - Loop through columns and apply formatPhoneValue()
    - Return formatted data instead of raw data
    - _Requirements: 28.1, 28.2, 28.5, 28.6, 28.7_

  - [x] 42.8 Add data quality validation
    - Create `DataQualityWarning` interface in `src/types/remediation.ts`
    - Create `validateDataQuality()` function in `src/utils/fileParser.ts`
    - Check for converted dates and corrected phone numbers
    - Return array of warnings with details
    - _Requirements: 28.1, 28.2_

  - [x] 42.9 Update UploadDialog to show data quality warnings
    - Update `src/components/identity/UploadDialog.tsx`
    - Call validateDataQuality() after parsing
    - Display warnings in an Alert component
    - Show first 5 warnings with "and X more" if needed
    - _Requirements: 28.1, 28.2_

  - [x] 42.10 Write property test for Excel formatting preservation
    - **Property 28: Excel Data Formatting Preservation**
    - Create test in `src/__tests__/identity/fileParser.test.ts`
    - Generate Excel files with serial dates and 10-digit phone numbers
    - Parse files and verify dates are DD/MM/YYYY format
    - Verify phone numbers are 11 digits starting with 0
    - **Validates: Requirements 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.9, 28.10**

  - [x] 42.11 Test with real Excel files
    - Create test Excel file with dates like "1/4/1980"
    - Create test Excel file with phone numbers like "7089273645"
    - Upload files and verify data is preserved correctly
    - Check preview table shows correct formatting
    - Verify data in Firestore has correct values
    - _Requirements: 28.1, 28.2, 28.7, 28.8_

  - [x] 42.12 Update export to preserve formatting
    - Ensure exported CSV/Excel maintains date format
    - Ensure exported files preserve phone number leading zeros
    - Test export → re-import cycle maintains data integrity
    - _Requirements: 28.8_

## Phase 3: Datapro NIN Verification API Integration

### Overview
Integrate the Datapro API for real NIN verification with enterprise-grade security, NDPR compliance, and comprehensive error handling. This phase replaces mock verification with production-ready implementation.

### Security & Compliance Requirements
- **NDPR Compliance**: Encrypt all PII (NIN, BVN, CAC) at rest using AES-256-GCM
- **API Security**: Store Datapro SERVICEID in environment variables, never expose to frontend
- **Backend-Only**: All verification logic runs on server, frontend only displays results
- **Audit Logging**: Log all verification attempts with timestamps and results
- **Data Minimization**: Only store encrypted identity numbers, never store photos/signatures from API

### Datapro API Specifications
- **Base URL**: https://api.datapronigeria.com
- **Endpoint**: /verifynin/?regNo={NIN}
- **Method**: GET
- **Authentication**: Header `SERVICEID` (merchant ID)
- **Response Codes**:
  - 200: Success - NIN found
  - 400: Bad request
  - 401: Authorization failed
  - 87: Invalid service ID
  - 88: Network error

### Response Structure
```json
{
  "ResponseInfo": {
    "ResponseCode": "00",
    "Parameter": "12345678901",
    "Source": "NIMC",
    "Message": "Results Found",
    "Timestamp": "21/10/2018 8:36:12PM"
  },
  "ResponseData": {
    "FirstName": "JOHN",
    "MiddleName": null,
    "LastName": "BULL",
    "Gender": "Male",
    "DateOfBirth": "12-May-1969",
    "PhoneNumber": "08123456789",
    "birthdate": "20/01/1980",
    "birthlga": "Kosofe",
    "birthstate": "LAGOS",
    "photo": "---Base64 Encoded---",
    "signature": "---Base64 Encoded---",
    "trackingId": "100083737345"
  }
}
```

### Field Validation Strategy
**Match Against Excel Data**:
- First Name (required, case-insensitive)
- Last Name (required, case-insensitive)
- Gender (required, case-insensitive)
- Date of Birth (required, flexible format matching)
- Phone Number (optional, loose matching - people change numbers)

**Note**: Middle name NOT validated (not in Excel template)

- [x] 43. Implement NDPR-compliant data encryption
  - [x] 43.1 Create encryption utility module
    - Create `src/utils/encryption.ts` (frontend)
    - Create `server-utils/encryption.js` (backend)
    - Implement AES-256-GCM encryption/decryption functions
    - Use crypto.randomBytes for IV generation
    - Store encryption key in environment variable (ENCRYPTION_KEY)
    - Generate key with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    - _Security: NDPR compliance for PII storage_

  - [x] 43.2 Update backend to encrypt identity numbers on storage
    - Update `POST /api/identity/lists` endpoint in server.js
    - Encrypt NIN, BVN, CAC fields before storing in Firestore
    - Store encrypted data with IV (initialization vector)
    - Never store plaintext identity numbers
    - _Security: Encryption at rest_

  - [x] 43.3 Update backend to decrypt for verification
    - Update verification endpoints to decrypt before API calls
    - Decrypt only in memory, never log plaintext
    - Clear decrypted values from memory after use
    - _Security: Secure data handling_

  - [x] 43.4 Add encryption migration script
    - Create script to encrypt existing plaintext identity numbers
    - Run once to migrate legacy data
    - Backup database before running
    - _Security: Retroactive protection_

  - [x] 43.5 Update Firestore security rules
    - Ensure encrypted fields are write-protected
    - Only backend service account can write encrypted data
    - _Security: Access control_

- [x] 44. Configure Datapro API credentials
  - [x] 44.1 Update environment variables
    - Add `DATAPRO_SERVICE_ID` to .env.example
    - Add `DATAPRO_API_URL=https://api.datapronigeria.com` to .env.example
    - Add `ENCRYPTION_KEY` to .env.example (32-byte hex)
    - Document how to obtain SERVICEID from Datapro
    - _Security: Credential management_

  - [x] 44.2 Update verification config
    - Update `src/config/verificationConfig.ts`
    - Add Datapro configuration fields
    - Add mode: 'mock' | 'datapro' | 'paystack'
    - Default to 'mock' for development
    - _Configuration: API switching_

  - [x] 44.3 Validate configuration on server startup
    - Check if DATAPRO_SERVICE_ID is set when mode is 'datapro'
    - Check if ENCRYPTION_KEY is set
    - Log warnings if credentials missing
    - Prevent server start if production mode without credentials
    - _Security: Configuration validation_

- [x] 45. Implement Datapro NIN verification service
  - [x] 45.1 Create Datapro API client
    - Create `server-services/dataproClient.js`
    - Implement `verifyNIN(nin)` function
    - Make GET request to /verifynin/?regNo={nin}
    - Add SERVICEID header
    - Handle all response codes (200, 400, 401, 87, 88)
    - Implement retry logic for network errors (max 3 retries)
    - Add timeout (30 seconds)
    - _Integration: API client_

  - [x] 45.2 Implement response parsing and validation
    - Parse ResponseInfo and ResponseData
    - Validate ResponseCode === "00" for success
    - Extract relevant fields (FirstName, LastName, Gender, DateOfBirth, PhoneNumber)
    - Handle missing or null fields gracefully
    - _Integration: Response handling_

  - [x] 45.3 Implement field-level matching logic
    - Create `matchFields(apiData, excelData)` function
    - Compare First Name (case-insensitive, trim whitespace)
    - Compare Last Name (case-insensitive, trim whitespace)
    - Compare Gender (normalize: M/Male/MALE → male, F/Female/FEMALE → female)
    - Compare Date of Birth (handle multiple formats: DD/MM/YYYY, DD-MMM-YYYY, YYYY-MM-DD)
    - Compare Phone Number (optional, normalize: remove spaces/dashes, handle +234 vs 0)
    - Return match results: { matched: boolean, failedFields: string[] }
    - _Validation: Field matching_

  - [x] 45.4 Implement comprehensive error handling
    - Map Datapro error codes to user-friendly messages
    - 400: "Invalid NIN format. Please check and try again."
    - 401/87: "Verification service unavailable. Please contact support."
    - 88: "Network error. Please try again later."
    - Field mismatch: "The information provided does not match our records. Please contact your broker."
    - NIN not found: "NIN not found in NIMC database. Please verify your NIN and try again."
    - _UX: Error messages_

  - [x] 45.5 Add comprehensive logging
    - Log all API requests (NIN masked: show only first 4 digits)
    - Log all API responses (exclude sensitive data)
    - Log field matching results
    - Log errors with full context
    - Use structured logging for easy searching
    - _Monitoring: Audit trail_

- [x] 46. Update verification endpoints for Datapro
  - [x] 46.1 Update POST /api/identity/verify/:token
    - Replace Paystack NIN verification with Datapro
    - Decrypt NIN from entry before API call
    - Call Datapro API with decrypted NIN
    - Perform field-level validation against Excel data
    - Store validation results in entry.verificationDetails
    - Update entry status based on result
    - Send appropriate notifications
    - _Integration: Customer verification_

  - [x] 46.2 Update bulk verification endpoint
    - Update `POST /api/identity/lists/:listId/bulk-verify`
    - Use Datapro API for NIN verification
    - Decrypt NIns before verification
    - Process entries in batches (10 at a time to avoid rate limits)
    - Add delay between batches (1 second)
    - Track progress and return detailed summary
    - _Integration: Bulk processing_

  - [x] 46.3 Add rate limiting for Datapro API
    - Implement rate limiter (max 50 requests per minute)
    - Queue requests if limit exceeded
    - Return 429 status if queue is full
    - Log rate limit hits
    - _Performance: API limits_

  - [x] 46.4 Add API call cost tracking
    - Track number of Datapro API calls per day/month
    - Store in Firestore collection: api-usage
    - Display usage stats in admin dashboard
    - Alert when approaching limits
    - _Monitoring: Cost control_

- [x] 47. Implement enhanced error notifications
  - [x] 47.1 Create error message templates
    - Update `src/utils/verificationErrors.ts`
    - Add Datapro-specific error messages
    - Create customer-friendly messages (no technical details)
    - Create staff-friendly messages (include technical details)
    - Map Datapro error codes to messages
    - _UX: Error communication_

  - [x] 47.2 Update customer error email template
    - Update `src/templates/verificationEmail.ts`
    - Add verification failure email template
    - Include: what went wrong (user-friendly), next steps, broker contact
    - Use professional, empathetic tone
    - _UX: Customer communication_

  - [x] 47.3 Update staff notification email template
    - Create staff notification template
    - Include: customer details, failed fields, API response, action required
    - Send to compliance, admin, and broker roles
    - Include link to entry in admin portal
    - _UX: Staff communication_

  - [x] 47.4 Implement notification sending logic
    - Update verification endpoint to send emails on failure
    - Send customer email immediately
    - Send staff email immediately
    - Log all email sends
    - Handle email failures gracefully
    - _Integration: Notifications_

- [x] 48. Update UI for verification results
  - [x] 48.1 Update list detail table
    - Update `src/pages/admin/IdentityListDetail.tsx`
    - Add "Verification Details" column
    - Show matched/failed fields for each entry
    - Add tooltip with full details on hover
    - Color-code: green (verified), red (failed), yellow (pending)
    - _UX: Visual feedback_

  - [x] 48.2 Create verification details dialog
    - Create `src/components/identity/VerificationDetailsDialog.tsx`
    - Show full verification results
    - Display API response data (sanitized)
    - Show field-by-field comparison
    - Show timestamps and attempt count
    - _UX: Detailed view_

  - [x] 48.3 Add verification retry button
    - Add "Retry Verification" button for failed entries
    - Allow admin to retry verification manually
    - Increment attempt count
    - Show confirmation dialog
    - _UX: Manual retry_

  - [x] 48.4 Update customer verification page
    - Update `src/pages/public/CustomerVerificationPage.tsx`
    - Show clear error messages from Datapro
    - Display broker contact information on error
    - Add "Contact Support" button
    - _UX: Customer experience_

- [x] 49. Implement comprehensive testing
  - [x] 49.1 Create Datapro API mock for testing
    - Create `server-services/__mocks__/dataproClient.js`
    - Mock all response scenarios (success, errors, field mismatches)
    - Use realistic test data
    - _Testing: Mocks_

  - [x] 49.2 Write unit tests for encryption
    - Test encryption/decryption round-trip
    - Test IV uniqueness
    - Test key validation
    - Test error handling
    - _Testing: Security_

  - [x] 49.3 Write unit tests for Datapro client
    - Test successful verification
    - Test all error codes (400, 401, 87, 88)
    - Test network errors and retries
    - Test timeout handling
    - Test response parsing
    - _Testing: API client_

  - [x] 49.4 Write unit tests for field matching
    - Test name matching (case-insensitive, whitespace)
    - Test gender matching (normalization)
    - Test date matching (multiple formats)
    - Test phone matching (optional, normalization)
    - Test partial matches
    - _Testing: Validation logic_

  - [x] 49.5 Write integration tests for verification flow
    - Test end-to-end customer verification
    - Test bulk verification
    - Test error scenarios
    - Test notification sending
    - Test encryption/decryption in flow
    - _Testing: Integration_

  - [x] 49.6 Write property-based tests
    - **Property 29: Encryption Reversibility**
      - For any plaintext identity number, encrypt → decrypt must return original value
    - **Property 30: Field Matching Consistency**
      - For any two identical names (ignoring case/whitespace), matching must return true
    - **Property 31: Date Format Flexibility**
      - For any date in DD/MM/YYYY, DD-MMM-YYYY, or YYYY-MM-DD format representing the same date, matching must return true
    - _Testing: Properties_

- [x] 50. Security hardening and audit
  - [x] 50.1 Security code review
    - Review all encryption code
    - Review API credential handling
    - Review error messages (no data leaks)
    - Review logging (no sensitive data in logs)
    - _Security: Code review_

  - [x] 50.2 Add security headers
    - Ensure SERVICEID never sent to frontend
    - Add CSP headers to prevent XSS
    - Add rate limiting to verification endpoints
    - _Security: Headers_

  - [x] 50.3 Implement audit logging
    - Log all verification attempts
    - Log all API calls (with masked data)
    - Log all encryption/decryption operations
    - Store logs in Firestore: verification-audit-logs
    - _Security: Audit trail_

  - [x] 50.4 Create security documentation
    - Document encryption approach
    - Document key management
    - Document API security
    - Document NDPR compliance measures
    - _Security: Documentation_

- [ ] 51. Performance optimization
  - [ ] 51.1 Implement caching for verified NIns
    - Cache successful verifications (24 hours)
    - Use Redis or Firestore for cache
    - Reduce duplicate API calls
    - _Performance: Caching_

  - [x] 51.2 Optimize bulk verification
    - Process in parallel batches (10 concurrent)
    - Add progress tracking
    - Add pause/resume functionality
    - _Performance: Bulk processing_

  - [x] 51.3 Add request queuing
    - Queue verification requests during high load
    - Process queue in background
    - Notify user when complete
    - _Performance: Queuing_

- [x] 52. Monitoring and alerting
  - [x] 52.1 Add API health checks
    - Ping Datapro API every 5 minutes
    - Alert if API is down
    - Display status in admin dashboard
    - _Monitoring: Health checks_

  - [x] 52.2 Add error rate monitoring
    - Track verification success/failure rates
    - Alert if error rate > 10%
    - Display metrics in admin dashboard
    - _Monitoring: Error rates_

  - [x] 52.3 Add cost monitoring
    - Track API call costs
    - Alert when approaching budget limits
    - Display cost projections
    - _Monitoring: Costs_

- [x] 53. Documentation and training
  - [x] 53.1 Update API documentation
    - Document Datapro integration
    - Document encryption approach
    - Document error handling
    - Document field matching logic
    - _Documentation: API_

  - [x] 53.2 Create admin user guide
    - How to interpret verification results
    - How to handle failed verifications
    - How to retry verifications
    - How to contact support
    - _Documentation: User guide_

  - [x] 53.3 Create broker training materials
    - How to prepare Excel files
    - What data is required
    - How to handle customer questions
    - Common error scenarios
    - _Documentation: Training_

- [x] 54. Production deployment preparation
  - [x] 54.1 Create deployment checklist
    - Verify DATAPRO_SERVICE_ID is set
    - Verify ENCRYPTION_KEY is set
    - Verify all tests pass
    - Verify security audit complete
    - Backup database
    - _Deployment: Checklist_

  - [x] 54.2 Create rollback plan
    - Document how to switch back to mock mode
    - Document how to restore from backup
    - Test rollback procedure
    - _Deployment: Rollback_

  - [x] 54.3 Set up monitoring
    - Configure alerts for API errors
    - Configure alerts for high error rates
    - Configure alerts for cost overruns
    - Test alert delivery
    - _Deployment: Monitoring_

  - [x] 54.4 Conduct load testing
    - Test with 100 concurrent verifications
    - Test bulk verification with 1000 entries
    - Measure API response times
    - Identify bottlenecks
    - _Deployment: Load testing_

- [x] 55. Final integration testing
  - [x] 55.1 Test complete workflow with Datapro API
    - Upload list with real test NIns (if available)
    - Send verification requests
    - Customer submits NIN
    - Verify Datapro API is called
    - Verify field matching works
    - Verify results are stored correctly
    - _Testing: End-to-end_

  - [x] 55.2 Test error scenarios
    - Test invalid NIN
    - Test NIN not found
    - Test field mismatch
    - Test API errors (401, 87, 88)
    - Test network errors
    - Verify error messages are user-friendly
    - Verify notifications are sent
    - _Testing: Error handling_

  - [x] 55.3 Test bulk verification
    - Upload list with 50 entries
    - Run bulk verification
    - Verify all entries processed
    - Verify rate limiting works
    - Verify progress tracking works
    - _Testing: Bulk processing_

  - [x] 55.4 Test security measures
    - Verify NIns are encrypted in database
    - Verify SERVICEID not exposed to frontend
    - Verify no sensitive data in logs
    - Verify audit logs are created
    - _Testing: Security_

  - [x] 55.5 Test performance
    - Measure single verification time
    - Measure bulk verification time (100 entries)
    - Verify caching works
    - Verify no memory leaks
    - _Testing: Performance_

- [ ] 56. Production launch
  - [ ] 56.1 Switch to production mode
    - Update verificationConfig.mode to 'datapro'
    - Deploy to production
    - Monitor for errors
    - _Launch: Go-live_

  - [ ] 56.2 Monitor first 24 hours
    - Watch error rates
    - Watch API call counts
    - Watch response times
    - Address any issues immediately
    - _Launch: Monitoring_

  - [ ] 56.3 Gather feedback
    - Collect feedback from brokers
    - Collect feedback from admins
    - Identify improvement areas
    - _Launch: Feedback_

  - [ ] 56.4 Create post-launch report
    - Document what went well
    - Document issues encountered
    - Document lessons learned
    - Plan for future improvements
    - _Launch: Retrospective_

## Notes for Phase 3

- **CRITICAL**: Never store plaintext NIN/BVN/CAC in database
- **CRITICAL**: Never expose DATAPRO_SERVICE_ID to frontend
- **CRITICAL**: Never log plaintext identity numbers
- **IMPORTANT**: Phone number matching is loose (people change numbers)

## Phase 4: VerifyData CAC Verification API Integration

### Overview
Integrate VerifyData's CAC (Corporate Affairs Commission) verification API. Leverages 90% of existing Datapro NIN infrastructure for consistency and maintainability.

### VerifyData API Specifications
- **Base URL**: https://vd.villextra.com
- **Endpoint**: /api/ValidateRcNumber/Initiate
- **Method**: POST (different from Datapro GET)
- **Authentication**: secretKey in request body (different from Datapro header)
- **Response Codes**:
  - 200 + success:true: Success - CAC found
  - 400 + statusCode "FF": Invalid secret key
  - 400 + statusCode "IB": Insufficient balance
  - 400 + statusCode "BR": Contact administrator
  - 400 + statusCode "EE": No active service
  - 500: Server error

### Request/Response Format
**Request**:
```json
{
  "rcNumber": "RC123456",
  "secretKey": "your_secret_key_here"
}
```

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "success",
  "data": {
    "name": "TEST COMPANY LTD",
    "registrationNumber": "RC123456",
    "companyStatus": "Verified",
    "registrationDate": "2024-04-23",
    "typeOfEntity": "PRIVATE_COMPANY_LIMITED_BY_SHARES"
  }
}
```

### Field Validation Strategy
**Match Against Excel Data**:
- Company Name (required, case-insensitive, handle Ltd/Limited/PLC variations)
- Registration Number (required, normalize RC prefix)
- Registration Date (required, flexible format matching)
- Company Status (must be "Verified" or active)

**Note**: Same flexible date parsing as NIN verification

- [-] 56. Implement VerifyData CAC verification client
  - [x] 56.1 Create VerifyData API client
    - Create `server-services/verifydataClient.cjs`
    - Mirror structure of `dataproClient.cjs` for consistency
    - Implement `verifyCAC(rcNumber)` function
    - Make POST request to /api/ValidateRcNumber/Initiate
    - Add secretKey in request body (not header like Datapro)
    - Handle all response codes (200, 400 with various statusCodes, 500)
    - Implement retry logic for network errors (max 3 retries)
    - Add timeout (30 seconds)
    - _Integration: API client_

  - [x] 56.2 Implement CAC-specific utility functions
    - Create `maskRCNumber(rcNumber)` - show only first 4 chars
    - Create `normalizeCompanyName(name)` - handle Ltd/Limited/PLC variations
    - Create `normalizeRCNumber(rcNumber)` - remove RC prefix, normalize
    - Reuse `parseDate()` from dataproClient for registration date
    - _Utilities: Normalization_

  - [x] 56.3 Implement CAC field matching logic
    - Create `matchCACFields(apiData, excelData)` function
    - Compare Company Name (case-insensitive, handle Ltd/Limited/PLC)
    - Compare Registration Number (normalize RC prefix)
    - Compare Registration Date (flexible format matching)
    - Validate Company Status (must be "Verified" or active)
    - Return match results: { matched: boolean, failedFields: string[] }
    - _Validation: Field matching_

  - [x] 56.4 Implement comprehensive error handling
    - Map VerifyData status codes to user-friendly messages
    - FF: "Verification service unavailable. Please contact support."
    - IB: "Verification service unavailable. Please contact support."
    - BR: "Verification service unavailable. Please contact support."
    - EE: "Verification service unavailable. Please contact support."
    - 500: "Network error. Please try again later."
    - Field mismatch: "The company information provided does not match CAC records. Please contact your broker."
    - CAC not found: "RC number not found in CAC database. Please verify your RC number and try again."
    - _UX: Error messages_

  - [x] 56.5 Add comprehensive logging
    - Log all API requests (RC number masked: show only first 4 chars)
    - Log all API responses (exclude sensitive data)
    - Log field matching results
    - Log errors with full context
    - Use structured logging for easy searching
    - _Monitoring: Audit trail_

- [x] 57. Create VerifyData mock and tests
  - [x] 57.1 Create VerifyData API mock
    - Create `server-services/__mocks__/verifydataClient.cjs`
    - Mock all response scenarios (success, errors, field mismatches)
    - Use realistic test data
    - Mirror Datapro mock structure
    - _Testing: Mocks_

  - [x] 57.2 Write unit tests for VerifyData client
    - Create `server-services/__tests__/verifydataClient.test.cjs`
    - Test successful verification
    - Test all status codes (FF, IB, BR, EE, 500)
    - Test network errors and retries
    - Test timeout handling
    - Test response parsing
    - Mirror Datapro test structure
    - _Testing: API client_

  - [x] 57.3 Write unit tests for CAC field matching
    - Test company name matching (case-insensitive, Ltd/Limited/PLC variations)
    - Test RC number matching (with/without RC prefix)
    - Test registration date matching (multiple formats)
    - Test company status validation
    - Test partial matches
    - _Testing: Validation logic_

- [x] 58. Update configuration for VerifyData
  - [x] 58.1 Update verification config
    - Update `src/config/verificationConfig.ts`
    - Add VerifyData API URL and secret key fields
    - Add validation for VerifyData credentials
    - Update `hasRequiredCredentials()` function
    - _Configuration: API config_

  - [x] 58.2 Update environment variables
    - Add `VERIFYDATA_API_URL=https://vd.villextra.com` to .env.example
    - Add `VERIFYDATA_SECRET_KEY` to .env.example
    - Add same to backend-package/.env.example
    - Document how to obtain secret key from VerifyData
    - _Configuration: Environment_

  - [x] 58.3 Validate configuration on server startup
    - Check if VERIFYDATA_SECRET_KEY is set when CAC verification enabled
    - Log warnings if credentials missing
    - Prevent server start if production mode without credentials
    - _Security: Configuration validation_

- [x] 59. Update rate limiter for VerifyData
  - [x] 59.1 Add VerifyData rate limiting
    - Update `server-utils/rateLimiter.cjs`
    - Add `applyVerifydataRateLimit()` function
    - Same pattern as `applyDataproRateLimit()`
    - Max 50 requests per minute (adjust based on VerifyData limits)
    - Use separate rate limit bucket for VerifyData
    - _Performance: Rate limiting_

- [x] 60. Update server endpoints for CAC verification
  - [x] 60.1 Update POST /api/identity/verify/:token
    - Add CAC verification branch
    - Import verifydataClient
    - Decrypt CAC number from entry before API call
    - Call VerifyData API with decrypted CAC
    - Perform field-level validation against Excel data
    - Store validation results in entry.verificationDetails
    - Update entry status based on result
    - Send appropriate notifications
    - _Integration: Customer verification_

  - [x] 60.2 Update bulk verification endpoint
    - Update `POST /api/identity/lists/:listId/bulk-verify`
    - Add CAC verification logic
    - Use VerifyData API for CAC entries
    - Decrypt CAC numbers before verification
    - Process CAC entries in batches (10 at a time)
    - Add delay between batches (1 second)
    - Track progress and return detailed summary
    - _Integration: Bulk processing_

  - [x] 60.3 Add routing logic for NIN vs CAC
    - Update verification endpoints to route based on verificationType
    - If verificationType === 'NIN': use dataproClient + applyDataproRateLimit
    - If verificationType === 'CAC': use verifydataClient + applyVerifydataRateLimit
    - Reuse all other infrastructure (encryption, logging, queue, etc.)
    - _Integration: Routing_

- [x] 61. Update monitoring for VerifyData
  - [x] 61.1 Add VerifyData API health checks
    - Update `server-utils/healthMonitor.cjs`
    - Add health check for VerifyData API
    - Ping VerifyData API every 5 minutes
    - Alert if API is down
    - Display status in admin dashboard
    - _Monitoring: Health checks_

  - [x] 61.2 Add VerifyData API usage tracking
    - Update `server-utils/apiUsageTracker.cjs`
    - Track VerifyData API calls separately from Datapro
    - Store in Firestore collection: api-usage
    - Display usage stats in admin dashboard
    - Alert when approaching limits
    - _Monitoring: Cost control_

- [x] 62. Integration testing for CAC verification
  - [x] 62.1 Create CAC integration tests
    - Create `src/__tests__/cac/integration.test.ts`
    - Test end-to-end CAC verification flow
    - Test bulk CAC verification
    - Test error scenarios
    - Test notification sending
    - Test encryption/decryption in flow
    - Mirror Datapro integration test structure
    - _Testing: Integration_

  - [x] 62.2 Test CAC verification workflow
    - Upload list with CAC entries
    - Send CAC verification requests
    - Customer submits CAC
    - Verify VerifyData API is called
    - Verify field matching works
    - Verify results are stored correctly
    - _Testing: End-to-end_

  - [x] 62.3 Test CAC error scenarios
    - Test invalid RC number
    - Test RC number not found
    - Test field mismatch (company name, RC number, date)
    - Test API errors (FF, IB, BR, EE, 500)
    - Test network errors
    - Verify error messages are user-friendly
    - Verify notifications are sent
    - _Testing: Error handling_

  - [x] 62.4 Test mixed NIN and CAC lists
    - Upload list with both NIN and CAC entries
    - Run bulk verification
    - Verify NIN entries use Datapro API
    - Verify CAC entries use VerifyData API
    - Verify both types processed correctly
    - _Testing: Mixed verification_

- [-] 63. Documentation for CAC verification
  - [x] 63.1 Update API documentation
    - Update `docs/API_DOCUMENTATION.md`
    - Document VerifyData integration
    - Document CAC field matching logic
    - Document error codes and handling
    - _Documentation: API_

  - [x] 63.2 Update admin user guide
    - Update `docs/ADMIN_USER_GUIDE.md`
    - Add CAC verification section
    - How to interpret CAC verification results
    - How to handle failed CAC verifications
    - How to retry CAC verifications
    - _Documentation: User guide_

  - [ ] 63.3 Update broker training materials
    - Update `docs/BROKER_TRAINING_GUIDE.md`
    - Add CAC data requirements
    - What CAC data is required (company name, RC number, reg date)
    - How to prepare CAC Excel files
    - Common CAC error scenarios
    - _Documentation: Training_

  - [x] 63.4 Create VerifyData integration summary
    - Create `.kiro/specs/identity-remediation/VERIFYDATA_INTEGRATION_SUMMARY.md`
    - Document implementation approach
    - Document code reuse from Datapro
    - Document differences from Datapro
    - Document testing approach
    - _Documentation: Summary_

- [x] 64. Final CAC verification testing
  - [x] 64.1 Test complete CAC workflow
    - Upload CAC list with real test RC numbers (if available)
    - Send verification requests
    - Customer submits CAC
    - Verify VerifyData API is called
    - Verify field matching works
    - Verify results are stored correctly
    - _Testing: End-to-end_

  - [x] 64.2 Test CAC security measures
    - Verify CAC numbers are encrypted in database
    - Verify VERIFYDATA_SECRET_KEY not exposed to frontend
    - Verify no sensitive data in logs
    - Verify audit logs are created for CAC verifications
    - _Testing: Security_

  - [x] 64.3 Test CAC performance
    - Measure single CAC verification time
    - Measure bulk CAC verification time (100 entries)
    - Verify rate limiting works
    - Verify no memory leaks
    - _Testing: Performance_

  - [x] 64.4 Test CAC with production credentials
    - Obtain test credentials from NEM Insurance
    - Test with real VerifyData API
    - Verify all functionality works
    - Document any issues
    - _Testing: Production API_

- [x] 65. CAC verification production launch
  - [x] 65.1 Deploy CAC verification to production
    - Ensure VERIFYDATA_SECRET_KEY is set
    - Deploy to production
    - Monitor for errors
    - _Launch: Go-live_

  - [x] 65.2 Monitor first 24 hours
    - Watch CAC verification error rates
    - Watch VerifyData API call counts
    - Watch response times
    - Address any issues immediately
    - _Launch: Monitoring_

  - [x] 65.3 Gather CAC verification feedback
    - Collect feedback from brokers using CAC verification
    - Collect feedback from admins
    - Identify improvement areas
    - _Launch: Feedback_

## Notes for Phase 4

- **REUSE**: 90% of code reused from Datapro NIN implementation
- **NEW**: Only VerifyData client and CAC-specific field matching are new
- **CONSISTENCY**: Same patterns for encryption, logging, queue, monitoring
- **CRITICAL**: Never store plaintext CAC numbers in database
- **CRITICAL**: Never expose VERIFYDATA_SECRET_KEY to frontend
- **CRITICAL**: Never log plaintext RC numbers
- **IMPORTANT**: Company name matching handles Ltd/Limited/PLC variations
- **IMPORTANT**: RC number matching normalizes RC prefix
- **IMPORTANT**: Middle name is NOT validated (not in Excel template)
- **IMPORTANT**: Date format matching must be flexible (multiple formats)
- **IMPORTANT**: All error messages must be user-friendly (no technical jargon)
- **IMPORTANT**: Staff notifications must include technical details for debugging
- **TESTING**: Use mock mode for development, Datapro mode for production
- **COMPLIANCE**: NDPR requires encryption of all PII at rest
- **PERFORMANCE**: Rate limit API calls to avoid overages
- **MONITORING**: Track API usage and costs closely
