# NEM Smart Protection Claims Bugfix Implementation Plan

## Overview
This implementation plan follows the exploratory bugfix workflow to fix critical defects in the NEM Smart Protection Claims system. The system is missing navigation links for 6 Smart Protection forms, has incomplete field structures that don't match JSON schemas, and lacks proper conditional logic and array field implementations.

## Task List

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Smart Protection Forms Complete Functionality
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that Smart Protection forms are accessible through navigation dropdown
  - Test that all required fields from JSON schemas are present in each form
  - Test that other insurer details are split into 3 separate fields (name, address, policy number)
  - Test that conditional logic shows/hides fields based on user selections
  - Test that array fields (witnesses, property items) have proper add/remove functionality
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Claim Forms Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for existing claim forms (Motor, Professional Indemnity, etc.)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Test that existing claim forms continue to appear in navigation dropdown
  - Test that existing form field structures remain unchanged
  - Test that existing form submission processing works correctly
  - Test that admin interface displays existing claim types properly
  - Test that ticket ID generation for existing claims uses same prefixes
  - Test that email service processing for existing claims uses same templates
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Fix Smart Protection Claims Navigation and Form Implementation

  - [x] 3.1 Add Smart Protection forms to navigation dropdown
    - Update `src/components/layout/Navbar.tsx` claimsForms array
    - Add Smart Motorist Protection (SMP) with path '/claims/smart-motorist-protection'
    - Add Smart Students Protection (SSP) with path '/claims/smart-students-protection'
    - Add Smart Traveller Protection (STP) with path '/claims/smart-traveller-protection'
    - Add Smart Artisan Protection (SAP) with path '/claims/smart-artisan-protection'
    - Add Smart Generation Z Protection (SGP) with path '/claims/smart-generation-z-protection'
    - Add NEM Home Protection Policy (HOPP) with path '/claims/nem-home-protection'
    - _Bug_Condition: isBugCondition(input) where input.action == "access_claims_dropdown" AND smartProtectionLinksNotVisible()_
    - _Expected_Behavior: All 6 Smart Protection forms visible in Claims dropdown navigation_
    - _Preservation: Existing claim forms continue to appear in dropdown unchanged_
    - _Requirements: 2.1_

  - [x] 3.2 Complete Smart Motorist Protection form fields
    - Update `src/pages/claims/SmartMotoristProtectionClaim.tsx`
    - Add coverFrom, coverTo fields to Policy Information section
    - Add insuredName, address, phone, email, alertPreference to Insured Details
    - Add accidentAmPm field to Details of Loss
    - Split otherInsurerDetails into otherInsurerName, otherInsurerAddress, otherInsurerPolicyNumber
    - Add totalIncapacityFrom, totalIncapacityTo, partialIncapacityFrom, partialIncapacityTo fields
    - Add declarationConfirmed, signatureDate fields
    - _Bug_Condition: isBugCondition(input) where input.action == "fill_smart_protection_form" AND input.formType == "SMP"_
    - _Expected_Behavior: Complete form with all fields matching JSON schema_
    - _Preservation: Existing claim forms field structures unchanged_
    - _Requirements: 2.2_

  - [x] 3.3 Complete Smart Students Protection form fields
    - Update `src/pages/claims/SmartStudentsProtectionClaim.tsx`
    - Add coverFrom, coverTo fields to Policy Information section
    - Add studentPupilName, address, phone, email, alertPreference to Insured Details
    - Add accidentAmPm field to Details of Loss
    - Split otherInsurerDetails into separate fields
    - Add incapacity period fields and declaration fields
    - _Bug_Condition: isBugCondition(input) where input.action == "fill_smart_protection_form" AND input.formType == "SSP"_
    - _Expected_Behavior: Complete form with all fields matching JSON schema_
    - _Preservation: Existing claim forms field structures unchanged_
    - _Requirements: 2.3_

  - [x] 3.4 Complete Smart Traveller Protection form fields
    - Update `src/pages/claims/SmartTravellerProtectionClaim.tsx`
    - Add coverFrom, coverTo fields to Policy Information section
    - Add insuredName, address, phone, email, alertPreference to Insured Details
    - Add accidentAmPm field to Details of Loss
    - Split otherInsurerDetails into separate fields
    - Add incapacity period fields and declaration fields
    - _Bug_Condition: isBugCondition(input) where input.action == "fill_smart_protection_form" AND input.formType == "STP"_
    - _Expected_Behavior: Complete form with all fields matching JSON schema_
    - _Preservation: Existing claim forms field structures unchanged_
    - _Requirements: 2.4_

  - [x] 3.5 Complete Smart Artisan Protection form fields
    - Update `src/pages/claims/SmartArtisanProtectionClaim.tsx`
    - Add coverFrom, coverTo fields to Policy Information section
    - Add companyName, address, phone, email, alertPreference to Insured Details
    - Add accidentAmPm field to Details of Loss
    - Split otherInsurerDetails into separate fields
    - Add incapacity period fields and declaration fields
    - _Bug_Condition: isBugCondition(input) where input.action == "fill_smart_protection_form" AND input.formType == "SAP"_
    - _Expected_Behavior: Complete form with all fields matching JSON schema_
    - _Preservation: Existing claim forms field structures unchanged_
    - _Requirements: 2.5_

  - [x] 3.6 Complete Smart Generation Z Protection form fields
    - Update `src/pages/claims/SmartGenerationZProtectionClaim.tsx`
    - Add coverFrom, coverTo fields to Policy Information section
    - Add insuredName, address, phone, email, alertPreference to Insured Details
    - Add accidentAmPm field to Details of Loss
    - Split otherInsurerDetails into separate fields
    - Add incapacity period fields and declaration fields
    - _Bug_Condition: isBugCondition(input) where input.action == "fill_smart_protection_form" AND input.formType == "SGP"_
    - _Expected_Behavior: Complete form with all fields matching JSON schema_
    - _Preservation: Existing claim forms field structures unchanged_
    - _Requirements: 2.6_

  - [x] 3.7 Complete NEM Home Protection Policy form fields
    - Update `src/pages/claims/NEMHomeProtectionClaim.tsx`
    - Add title, surname, firstName, otherName, dateOfBirth, gender, companyName to Insured Details
    - Add lossAddress, perilType, dateOfLoss, timeOfLoss, timeAmPm to Details of Loss
    - Add medicalCertificateRequired conditional field
    - Split otherInsurerDetails into separate fields
    - Implement destroyedPropertyItems array with proper add/remove functionality
    - _Bug_Condition: isBugCondition(input) where input.action == "fill_smart_protection_form" AND input.formType == "HOPP"_
    - _Expected_Behavior: Complete form with all fields matching JSON schema_
    - _Preservation: Existing claim forms field structures unchanged_
    - _Requirements: 2.7_

  - [x] 3.8 Implement conditional logic for all Smart Protection forms
    - Show isUsualDoctor when doctorNameAddress is not empty
    - Show propertyInterestOther when propertyInterest equals "Other"
    - Show otherOwnerDetails when isSoleOwner equals "No"
    - Show otherInsurerDetails when hasOtherInsurance equals "Yes"
    - Show medicalCertificateRequired when perilType equals "Flood/Water/Storm/Lightning/Explosion/Accident"
    - _Bug_Condition: isBugCondition(input) where input.action == "use_conditional_fields"_
    - _Expected_Behavior: Conditional fields show/hide based on user selections_
    - _Preservation: Existing claim forms conditional logic unchanged_
    - _Requirements: 2.8_

  - [x] 3.9 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Smart Protection Forms Complete Functionality
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 3.10 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Claim Forms Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Requirements Traceability

### Bug Fix Requirements
- **2.1**: Navigation dropdown includes all 6 Smart Protection forms → Task 3.1
- **2.2**: Smart Motorist Protection form complete with all JSON schema fields → Task 3.2
- **2.3**: Smart Students Protection form complete with all JSON schema fields → Task 3.3
- **2.4**: Smart Traveller Protection form complete with all JSON schema fields → Task 3.4
- **2.5**: Smart Artisan Protection form complete with all JSON schema fields → Task 3.5
- **2.6**: Smart Generation Z Protection form complete with all JSON schema fields → Task 3.6
- **2.7**: NEM Home Protection Policy form complete with all JSON schema fields → Task 3.7
- **2.8**: Conditional logic and array fields implemented properly → Task 3.8

### Preservation Requirements
- **3.1**: Existing claim forms navigation preserved → Task 2, 3.10
- **3.2**: Existing form functionality preserved → Task 2, 3.10
- **3.3**: Existing submission processing preserved → Task 2, 3.10
- **3.4**: Admin interface operations preserved → Task 2, 3.10
- **3.5**: Ticket ID generation preserved → Task 2, 3.10
- **3.6**: Form mappings preserved → Task 2, 3.10
- **3.7**: Email service processing preserved → Task 2, 3.10