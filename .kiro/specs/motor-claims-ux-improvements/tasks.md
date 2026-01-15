# Implementation Plan: Motor Claims UX Improvements

## Overview

This implementation plan breaks down the Motor Claims UX improvements into discrete, incremental tasks. Each task builds on previous work and includes testing requirements. The implementation uses TypeScript/React for frontend and Node.js/Express for backend.

## Tasks

- [x] 1. Create Ticket ID Generation Utility
  - Create `src/utils/ticketIdGenerator.ts` with form type prefix mapping
  - Implement `generateTicketId(formType: string)` function
  - Add uniqueness check against Firestore
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 1.1 Write property tests for Ticket ID Generator
  - **Property 1: Ticket ID Format Validation**
  - **Property 2: Ticket ID Uniqueness**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 2. Update Motor Claims Form - Third Party Driver Phone
  - Add `otherDriverPhone` field to schema in `src/pages/claims/MotorClaim.tsx`
  - Add phone input field in the "Other Vehicle Details" section
  - Add validation for phone number format
  - _Requirements: 1.1, 1.2_

- [x] 2.1 Write property test for phone validation
  - **Property 16: Phone Number Validation**
  - **Validates: Requirements 1.2**

- [x] 3. Update Motor Claims Form - Police Report Message
  - Add informational message below police report upload field
  - Message: "Please note that police report is required for accidents involving bodily injury or death"
  - Style with amber/warning colors for visibility
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Update Form Mappings for Motor Claims
  - Add `otherDriverPhone` field to `src/config/formMappings.ts` motor-claims section
  - Ensure field mapping matches database field names
  - _Requirements: 1.4, 8.6_

- [x] 5. Checkpoint - Verify Motor Claims Form Updates
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate Ticket ID into Form Submission Backend
  - Update `server.js` form submission endpoint to generate ticket ID
  - Store ticket ID with form data in Firestore
  - Return ticket ID in submission response
  - _Requirements: 3.4_

- [x] 6.1 Write property test for Ticket ID Persistence
  - **Property 3: Ticket ID Persistence**
  - **Validates: Requirements 3.4**

- [x] 7. Update Email Confirmation Template
  - Update `src/services/emailService.ts` with new template
  - Include ticket ID prominently in email
  - Add "View or Track Submission" button with dashboard link
  - Add message about referencing ticket ID in correspondence
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7.1 Write property test for Email Contains Ticket ID
  - **Property 4: Email Contains Ticket ID**
  - **Validates: Requirements 4.2**

- [x] 8. Update Sign-In Redirect Logic
  - Modify `src/pages/auth/SignIn.tsx` to handle redirect parameter
  - Redirect users with 'user' or 'default' role to /dashboard after sign-in
  - _Requirements: 4.5, 4.6_

- [x] 9. Checkpoint - Verify Ticket ID and Email Flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Create User Submissions Service
  - Create `src/services/userSubmissionsService.ts`
  - Implement `getUserSubmissions(userEmail: string)` to query all form collections
  - Implement `getUserAnalytics(submissions: Submission[])` for analytics calculation
  - _Requirements: 5.1, 11.2, 11.3, 11.4_

- [x] 10.1 Write property test for Analytics Calculation
  - **Property 15: Analytics Calculation Correctness**
  - **Validates: Requirements 11.2, 11.3, 11.4**

- [x] 11. Create Submission Card Component
  - Create `src/components/dashboard/SubmissionCard.tsx`
  - Display form type, ticket ID, submission date, status
  - Add status color indicators (yellow/green/red)
  - Add click handler to navigate to form viewer
  - _Requirements: 5.3, 5.4, 10.3_

- [x] 11.1 Write property test for Submission Card Completeness
  - **Property 5: Submission Card Completeness**
  - **Validates: Requirements 5.3**

- [x] 12. Create Analytics Dashboard Component
  - Create `src/components/dashboard/AnalyticsDashboard.tsx`
  - Display total submissions, KYC vs Claims breakdown, status counts
  - Use burgundy, gold, white theme
  - Handle empty state with zeros and messaging
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.7_

- [x] 13. Refactor User Dashboard Layout
  - Update `src/pages/dashboard/UserDashboard.tsx`
  - Add welcome message with user name at top
  - Add analytics section above submissions grid
  - Move profile/password to sidebar or separate tab
  - Display submission cards grid as primary content
  - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 6.4_

- [x] 13.1 Write property test for Welcome Message
  - **Property 7: Welcome Message Contains User Name**
  - **Validates: Requirements 6.2**

- [x] 14. Checkpoint - Verify User Dashboard
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Create User Form Viewer Route
  - Add route for users to view their submissions
  - Filter out administrative fields (id, collection, formId, userUid)
  - Display ticket ID prominently
  - _Requirements: 5.5, 5.6, 7.1, 7.2, 7.3_

- [x] 15.1 Write property test for User Form Viewer Field Filtering
  - **Property 6: User Form Viewer Field Filtering**
  - **Validates: Requirements 5.6**

- [x] 15.2 Write property test for Form Viewer Ticket ID Display
  - **Property 8: Form Viewer Ticket ID Display**
  - **Validates: Requirements 7.1**

- [x] 16. Fix Admin Table Witness Formatting
  - Update `src/pages/admin/AdminUnifiedTable.tsx` witness array rendering
  - Format witnesses as readable entries, not JSON
  - Hide witness columns when array is empty
  - _Requirements: 8.1, 8.2_

- [x] 16.1 Write property test for Witness Array Formatting
  - **Property 9: Witness Array Formatting**
  - **Validates: Requirements 8.1**

- [x] 17. Fix Admin Table Data Display Issues
  - Fix N/A display for fields with valid data
  - Fix time formatting (NaN issue)
  - Ensure field mappings are correct
  - _Requirements: 8.3, 8.4, 8.5, 8.6_

- [x] 17.1 Write property test for Data Display Correctness
  - **Property 10: Data Display Correctness**
  - **Validates: Requirements 8.4, 8.5**

- [x] 17.2 Write property test for Field Mapping Correctness
  - **Property 11: Field Mapping Correctness**
  - **Validates: Requirements 8.6**

- [x] 18. Fix Form Viewer Data Consistency
  - Update `src/pages/admin/FormViewer.tsx`
  - Display all submitted fields
  - Format dates and times correctly
  - Format witnesses as individual entries
  - Remove deprecated fields
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 18.1 Write property test for Form Viewer Completeness
  - **Property 12: Form Viewer Completeness**
  - **Validates: Requirements 9.1, 9.3, 9.4**

- [x] 18.2 Write property test for Date and Time Formatting
  - **Property 13: Date and Time Formatting**
  - **Validates: Requirements 9.2**

- [x] 19. Implement Status Synchronization
  - Ensure status updates from admin are reflected in user dashboard
  - Add real-time listener or refresh mechanism
  - _Requirements: 10.1, 10.2_

- [x] 19.1 Write property test for Status Synchronization
  - **Property 14: Status Synchronization**
  - **Validates: Requirements 10.2**

- [x] 20. Add Ticket ID to Admin Form Viewer
  - Display ticket ID in admin Form Viewer
  - Ensure consistent placement across form types
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 21. Final Checkpoint - Full Integration Testing
  - Ensure all tests pass, ask the user if questions arise.
  - Test complete flow: form submission → email → dashboard → form viewer
  - Verify admin table displays correctly
  - Verify status updates propagate to user dashboard

## Notes

- All tasks including property-based tests are required for comprehensive validation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check (100+ iterations)
- Unit tests validate specific examples and edge cases
- The burgundy (#800020), gold (#DAA520), and white color theme must be maintained throughout
