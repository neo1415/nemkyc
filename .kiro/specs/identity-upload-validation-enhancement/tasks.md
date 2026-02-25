# Implementation Plan: Identity Upload Validation Enhancement

## Overview

This implementation plan adds comprehensive validation to the identity collection Excel/CSV upload system. The validation will run client-side for immediate feedback and server-side for security, validating Date of Birth (DOB), National Identification Number (NIN), and Bank Verification Number (BVN) fields. Users will receive clear error messages with row numbers and can download error reports for offline correction.

The implementation integrates with existing components (`UploadDialog.tsx`, `fileParser.ts`) and follows the established patterns in the codebase.

## Tasks

- [-] 1. Create core validation engine
  - [x] 1.1 Create validation types and interfaces
    - Create `src/utils/validation/identityValidation.ts`
    - Define `ValidationError`, `ValidationResult`, `ValidationOptions` interfaces
    - Define error type constants
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 1.2 Write property test for year extraction consistency
    - **Property 1: Year extraction consistency**
    - **Validates: Requirements 1.1, 1.6**
  
  - [x] 1.3 Implement year extraction logic
    - Write `extractYear()` function to handle multiple date formats
    - Support DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, Excel serial numbers, Date objects
    - Return 4-digit year or null if invalid
    - _Requirements: 1.1, 1.6_
  
  - [ ] 1.4 Write property test for invalid year rejection
    - **Property 2: Invalid year rejection**
    - **Validates: Requirements 1.2, 1.3**
  
  - [x] 1.5 Implement DOB validation function
    - Write `validateDOB()` function
    - Extract year using `extractYear()`
    - Validate year is 4 digits and in range [1900, current_year]
    - Calculate age and validate >= 18
    - Return `ValidationError` or null
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ] 1.6 Write property test for age calculation correctness
    - **Property 3: Age calculation correctness**
    - **Validates: Requirements 1.4**
  
  - [ ] 1.7 Write property test for minimum age enforcement
    - **Property 4: Minimum age enforcement**
    - **Validates: Requirements 1.5**
  
  - [ ] 1.8 Write property test for 11-digit identifier validation
    - **Property 5: 11-digit identifier validation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4**
  
  - [x] 1.9 Implement NIN and BVN validation functions
    - Write `validate11DigitIdentifier()` helper function
    - Write `validateNIN()` function using helper
    - Write `validateBVN()` function using helper
    - Trim whitespace, validate /^\d{11}$/ pattern
    - Return `ValidationError` or null
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 1.10 Write unit tests for DOB validation edge cases
    - Test specific date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
    - Test Excel serial numbers
    - Test boundary years (1900, current year)
    - Test typo "21998" rejection
    - Test age under 18 rejection
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  
  - [ ] 1.11 Write unit tests for NIN/BVN validation edge cases
    - Test valid 11-digit identifiers
    - Test whitespace trimming
    - Test length validation (too short, too long)
    - Test non-digit character rejection
    - Test empty/null values (should pass as optional)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [-] 2. Implement column detection and main validation function
  - [x] 2.1 Implement column detection functions
    - Write `findDOBColumn()` to detect DOB column from column names
    - Write `findNINColumn()` to detect NIN column
    - Write `findBVNColumn()` to detect BVN column
    - Use fuzzy matching similar to existing `fileParser.ts` patterns
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ] 2.2 Write property test for error summary accuracy
    - **Property 6: Error summary accuracy**
    - **Validates: Requirements 4.1**
  
  - [ ] 2.3 Write property test for error detail completeness
    - **Property 7: Error detail completeness**
    - **Validates: Requirements 4.2**
  
  - [x] 2.4 Implement main validation function
    - Write `validateIdentityData()` function
    - Detect relevant columns (DOB, NIN, BVN)
    - Loop through all rows and validate each field
    - Apply template-specific rules (Individual validates NIN, Corporate skips NIN)
    - Collect all errors
    - Calculate error summary (total errors, affected rows)
    - Return `ValidationResult`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 6.3, 8.1, 8.2, 8.3_
  
  - [ ] 2.5 Write property test for comprehensive row validation
    - **Property 10: Comprehensive row validation**
    - **Validates: Requirements 6.3**
  
  - [ ] 2.6 Write unit tests for main validation function
    - Test Individual template validation (DOB, NIN, BVN)
    - Test Corporate template validation (DOB, BVN, skip NIN)
    - Test multiple errors in single row
    - Test errors across multiple rows
    - Test error summary calculation
    - Test all rows validated (not just preview)
    - _Requirements: 4.1, 4.2, 6.3, 8.1, 8.2, 8.3_

- [-] 3. Create error report generator
  - [ ] 3.1 Write property test for error report completeness
    - **Property 8: Error report completeness**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**
  
  - [ ] 3.2 Write property test for error report filename generation
    - **Property 9: Error report filename generation**
    - **Validates: Requirements 5.6**
  
  - [x] 3.3 Implement error report generator
    - Create `src/utils/validation/errorReportGenerator.ts`
    - Write `generateErrorReport()` function
    - Create error map from validation errors
    - Filter rows with errors
    - Add "Validation Errors" column with concatenated error messages
    - Generate Excel file using XLSX library
    - Generate filename with "_errors" suffix
    - Trigger download
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ] 3.4 Write unit tests for error report generator
    - Test error report contains all original columns
    - Test error report contains "Validation Errors" column
    - Test only rows with errors are included
    - Test multiple errors per row are concatenated
    - Test filename generation with various extensions (.csv, .xlsx, .xls)
    - Test error handling for generation failures
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

- [-] 4. Create validation error display component
  - [x] 4.1 Create ValidationErrorDisplay component
    - Create `src/components/identity/ValidationErrorDisplay.tsx`
    - Accept `ValidationResult` and `onDownloadErrorReport` props
    - Display error summary (total errors, affected rows)
    - Display "Download Error Report" button
    - Display error details table (row number, column, error message, value)
    - Display instruction message to fix and re-upload
    - Use Material-UI components for consistent styling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1_
  
  - [ ] 4.2 Write unit tests for ValidationErrorDisplay component
    - Test error summary displays correct counts
    - Test "Download Error Report" button is shown
    - Test error details table renders all errors
    - Test instruction message is displayed
    - Test button click triggers download callback
    - _Requirements: 4.1, 4.2, 4.4, 5.1_

- [-] 5. Integrate validation into UploadDialog
  - [x] 5.1 Add validation state to UploadDialog
    - Import validation functions and types
    - Add `validationResult` state variable
    - Add `validating` loading state
    - _Requirements: 6.1, 6.4_
  
  - [x] 5.2 Trigger validation after file parsing
    - After successful file parse in `onDrop` callback
    - Call `validateIdentityData()` with parsed rows, columns, and template type
    - Set `validating` state to true during validation
    - Store validation result in state
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [x] 5.3 Display validation results in UI
    - Show loading indicator during validation with progress message
    - If validation fails, render `ValidationErrorDisplay` component
    - If validation passes, show success message (existing behavior)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.4_
  
  - [x] 5.4 Implement error report download handler
    - Write `handleDownloadErrorReport()` function
    - Call `generateErrorReport()` with original data, columns, errors, and filename
    - Pass handler to `ValidationErrorDisplay` component
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 5.5 Disable Create List button when validation fails
    - Update button `disabled` prop to include validation check
    - Disable if `validationResult` exists and `valid` is false
    - Keep existing disabled conditions (no file, no list name, no email column, template validation failed)
    - _Requirements: 4.3_
  
  - [ ] 5.6 Write integration tests for UploadDialog validation flow
    - Test file upload triggers validation
    - Test validation errors disable Create List button
    - Test validation errors display error component
    - Test validation success enables Create List button
    - Test error report download
    - Test re-upload after fixing errors
    - _Requirements: 4.3, 4.5, 6.1, 6.3, 6.4, 9.5_

- [x] 6. Checkpoint - Ensure client-side validation works
  - Ensure all tests pass, ask the user if questions arise.

- [-] 7. Implement server-side validation
  - [x] 7.1 Create server-side validation module
    - Create `server-utils/identityUploadValidator.cjs`
    - Port validation logic from client-side to CommonJS
    - Implement same validation functions (validateDOB, validateNIN, validateBVN, validateIdentityData)
    - Use existing `dateFormatter.cjs` for date handling
    - _Requirements: 7.1, 7.2_
  
  - [ ] 7.2 Write property test for client-server validation consistency
    - **Property 11: Client-server validation consistency**
    - **Validates: Requirements 7.2**
  
  - [ ] 7.3 Write unit tests for server-side validation
    - Test same validation rules as client-side
    - Test DOB validation
    - Test NIN validation
    - Test BVN validation
    - Test template-specific validation
    - _Requirements: 7.2_
  
  - [x] 7.4 Integrate validation into identity list creation endpoint
    - Update `/api/identity/lists` POST endpoint in `server.js`
    - Call `validateIdentityData()` before creating list
    - If validation fails, return 400 Bad Request with validation errors
    - If validation passes, proceed with list creation (existing logic)
    - Log validation failures for monitoring
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 7.5 Write integration tests for server-side validation endpoint
    - Test endpoint rejects invalid data with 400 status
    - Test endpoint returns validation errors in response
    - Test endpoint accepts valid data and creates list
    - Test server validation catches errors that bypass client
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [-] 8. Update UploadDialog to handle server validation errors
  - [x] 8.1 Handle server validation errors in submit handler
    - In `handleSubmit()` function, catch 400 errors from server
    - Parse validation errors from response
    - Display server validation errors using `ValidationErrorDisplay`
    - Show message that server detected additional errors
    - _Requirements: 7.3_
  
  - [ ] 8.2 Write unit tests for server error handling
    - Test server validation errors are displayed
    - Test user can download error report from server errors
    - Test user can fix and re-upload
    - _Requirements: 7.3_

- [x] 9. Ensure backward compatibility
  - [x] 9.1 Write backward compatibility tests
    - Test existing Excel parsing still works
    - Test existing CSV parsing still works
    - Test existing phone number formatting still works
    - Test existing date formatting from Excel serial still works
    - Test existing preview table shows first 10 rows
    - Test existing template validation still works
    - Test existing email column detection still works
    - Test existing name column detection still works
    - Test files without DOB/NIN/BVN still upload successfully
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Validation logic is implemented in both client-side (TypeScript) and server-side (CommonJS)
- Error report generation uses existing XLSX library
- Integration preserves all existing upload functionality
- Property tests use fast-check library with minimum 100 iterations
- Unit tests focus on specific examples, edge cases, and UI interactions
