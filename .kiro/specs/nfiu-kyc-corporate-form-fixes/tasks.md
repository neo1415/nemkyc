# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - NFIU Corporate Form Configuration and Validation Bugs
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist
  - **Scoped PBT Approach**: Test specific failing cases for each bug to ensure reproducibility
  - Test implementation details from Fault Condition in design:
    - Website field displays as required (should be optional)
    - Ownership field displays as text input (should be select dropdown)
    - Business Type and Occupation display as two separate fields (should be combined)
    - Ownership field accepts invalid values without validation error
    - Admin dashboard components fail to display/export combined business field
  - The test assertions should match the Expected Behavior Properties from design
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bugs exist)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failures are documented
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-NFIU Corporate Forms and Fields
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - KYC Corporate form field configurations (Website required, Ownership text, separate Business fields)
    - NFIU Corporate fields other than Website, Ownership, and Business Type/Occupation
    - Individual forms (NFIU and KYC)
    - Admin dashboard display for non-NFIU Corporate forms
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 3. Fix NFIU Corporate form configuration and admin dashboard

  - [x] 3.1 Update formConfigs.ts for NFIU Corporate form
    - Remove unused imports: Delete `import * as yup from 'yup';` line
    - Remove unused constant: Delete `genderOptions` array definition
    - Fix Website field: Change `required: true` to `required: false` in the website field
    - Fix Ownership field: Change `type: 'text'` to `type: 'select'`, add `options: nationalityOptions`, change `required: true` to `required: false`
    - Combine Business fields: Remove `businessOccupation` field, rename `natureOfBusiness` to `businessTypeOccupation`, change label to 'Business Type/Occupation', keep `type: 'text'` and `required: true`
    - _Bug_Condition: isBugCondition(input) where input.formType === 'nfiu-corporate' AND (input.fieldName IN ['website', 'ownershipOfCompany', 'natureOfBusiness', 'businessOccupation'])_
    - _Expected_Behavior: Website optional, Ownership select dropdown with options, Business fields combined into single required field_
    - _Preservation: KYC Corporate form and all other forms unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Verify formValidation.ts handles new field configurations
    - Review formValidation.ts to confirm it automatically generates correct validation for:
      - Optional fields (Website)
      - Select fields with enum validation (Ownership)
      - Required text fields (combined Business Type/Occupation)
    - No code changes should be needed - validation is auto-generated from config
    - Document that validation logic correctly handles the updated configuration
    - _Requirements: 2.5, 2.6_

  - [x] 3.3 Update FormViewer.tsx for field mappings
    - Add backward compatibility logic to handle both old and new data structures
    - When displaying old data: Check if `businessTypeOccupation` exists, if not concatenate `natureOfBusiness` and `businessOccupation`
    - When displaying new data: Use `businessTypeOccupation` directly
    - Ensure `ownershipOfCompany` select values display correctly (Nigerian/Foreign/Both)
    - Verify field labels match updated configuration
    - _Requirements: 2.7, 2.8_

  - [x] 3.4 Update AdminUnifiedTable.tsx for column definitions
    - Update column definitions to reference `businessTypeOccupation` instead of separate fields
    - Add backward compatibility for sorting/filtering to handle both old and new field names
    - Ensure `ownershipOfCompany` column handles select field values correctly
    - Verify table displays correctly for both old and new NFIU Corporate submissions
    - _Requirements: 2.9, 2.10_

  - [x] 3.5 Update CSV/PDF generators for field labels and formatting
    - Review CSVGenerator.ts to ensure it handles `businessTypeOccupation` field correctly
    - Review PDFGenerator.ts to ensure it formats select fields (Ownership) correctly
    - Add backward compatibility to handle both old and new data structures
    - Verify field labels match updated configuration in exports
    - _Requirements: 2.11, 2.12, 2.13, 2.14_

  - [x] 3.6 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - NFIU Corporate Form Configuration and Validation Fixed
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bugs are fixed)
    - Verify all assertions pass:
      - Website field is optional without red asterisk
      - Ownership field is select dropdown with correct options and optional
      - Business Type/Occupation is single combined required field
      - Ownership validation rejects invalid values
      - Admin dashboard displays/exports combined business field correctly
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14_

  - [x] 3.7 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-NFIU Corporate Forms and Fields Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix:
      - KYC Corporate form configuration unchanged
      - NFIU Corporate other fields unchanged
      - Individual forms unchanged
      - Admin dashboard display for non-NFIU Corporate forms unchanged
      - Date handling consistent across all forms
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [ ] 4. Integration testing and validation

  - [ ] 4.1 Test full NFIU Corporate form submission flow
    - Render NFIU Corporate form and verify all modified fields display correctly
    - Fill out form with valid data including optional Website and Ownership fields
    - Submit form and verify validation passes
    - Verify data is stored correctly in database
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

  - [ ] 4.2 Test admin dashboard display with both old and new data
    - Create test data with old structure (separate business fields)
    - Create test data with new structure (combined business field)
    - Display both in FormViewer and verify correct rendering
    - Display both in AdminUnifiedTable and verify correct column display
    - Export both to CSV and PDF and verify correct formatting
    - _Requirements: 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14_

  - [ ] 4.3 Test KYC Corporate form regression
    - Render KYC Corporate form and verify all fields display correctly
    - Verify Website is still required
    - Verify Ownership is still text input
    - Verify Business Type and Occupation are still separate fields
    - Submit form and verify validation works as before
    - Display in admin dashboard and verify correct rendering
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7, 3.8_

  - [ ] 4.4 Test Individual forms regression
    - Render NFIU Individual and KYC Individual forms
    - Verify all fields display correctly
    - Submit forms and verify validation works as before
    - Display in admin dashboard and verify correct rendering
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ] 4.5 Test select field validation edge cases
    - Submit NFIU Corporate form with empty Ownership field (should pass - field is optional)
    - Submit NFIU Corporate form with valid Ownership value "Nigerian" (should pass)
    - Submit NFIU Corporate form with valid Ownership value "Foreign" (should pass)
    - Submit NFIU Corporate form with valid Ownership value "Both" (should pass)
    - Verify validation correctly handles select field options
    - _Requirements: 2.2, 2.5_

  - [ ] 4.6 Test combined business field validation
    - Submit NFIU Corporate form with empty Business Type/Occupation field (should fail - field is required)
    - Submit NFIU Corporate form with valid Business Type/Occupation text (should pass)
    - Verify validation correctly handles combined field
    - _Requirements: 2.3, 2.6_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Run all unit tests for form configuration, validation, and admin dashboard components
  - Run all property-based tests for preservation checking
  - Run all integration tests for full workflow validation
  - Verify no regressions in KYC forms, Individual forms, or other form types
  - Verify admin dashboard correctly displays and exports both old and new NFIU Corporate data
  - Ask the user if questions arise or if any tests fail
