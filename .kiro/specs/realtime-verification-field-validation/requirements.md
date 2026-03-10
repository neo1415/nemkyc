# Requirements Document

## Introduction

This feature implements real-time verification field validation with visual highlighting for Corporate KYC/NFIU forms (CAC numbers) and Individual KYC/NFIU forms (NIN). The system validates user-entered data against verification API responses in real-time, provides immediate visual feedback on mismatched fields, and prevents form progression until all fields match verified data. This eliminates duplicate verification runs, provides immediate feedback, and improves fraud prevention.

## Glossary

- **Verification_System**: The real-time field validation system that compares user-entered data with verification API responses
- **CAC_Field**: Corporate Affairs Commission registration number input field
- **NIN_Field**: National Identification Number input field
- **Verification_Trigger**: The blur event on CAC_Field or NIN_Field that initiates verification
- **Matched_Field**: A form field whose value matches the corresponding verification API response data
- **Mismatched_Field**: A form field whose value does not match the corresponding verification API response data
- **Verification_Cache**: In-memory storage of verification API responses to prevent duplicate API calls
- **Step_Navigation**: The action of moving from one form step to another using "Next" or "Submit" buttons
- **Authenticated_User**: A user who has successfully logged in to the system
- **Verification_State**: The current status of field validation (pending, matched, mismatched, or not_verified)
- **Auto_Revalidation**: Automatic re-checking of field values on blur after user modification
- **Visual_Indicator**: UI elements (borders, icons, messages) that show field validation status
- **Autofill_Behavior**: The existing functionality that populates empty fields with verification data
- **Corporate_Form**: CorporateKYC or CorporateNFIU form that uses CAC_Field
- **Individual_Form**: IndividualKYC or IndividualNFIU form that uses NIN_Field

## Requirements

### Requirement 1: Real-Time Verification Trigger

**User Story:** As an authenticated user, I want verification to run automatically when I complete entering a CAC or NIN number, so that I receive immediate feedback on data accuracy.

#### Acceptance Criteria

1. WHEN an Authenticated_User triggers a blur event on CAC_Field, THE Verification_System SHALL initiate CAC verification within 300ms
2. WHEN an Authenticated_User triggers a blur event on NIN_Field, THE Verification_System SHALL initiate NIN verification within 300ms
3. WHEN Verification_Trigger occurs and Verification_Cache contains valid data for the identifier, THE Verification_System SHALL use cached data without making an API call
4. WHEN Verification_Trigger occurs and the identifier format is invalid, THE Verification_System SHALL display a format error message without making an API call
5. WHEN Verification_Trigger occurs for a non-authenticated user, THE Verification_System SHALL not initiate verification

### Requirement 2: Field-Level Data Matching

**User Story:** As a user, I want the system to compare my entered data with verified records field-by-field, so that I know exactly which information is incorrect.

#### Acceptance Criteria

1. WHEN verification API returns data, THE Verification_System SHALL compare each form field value with the corresponding verification response field
2. WHEN a form field is empty and verification data exists for that field, THE Verification_System SHALL execute Autofill_Behavior for that field
3. WHEN a form field contains data that matches verification data, THE Verification_System SHALL mark the field as Matched_Field
4. WHEN a form field contains data that does not match verification data, THE Verification_System SHALL mark the field as Mismatched_Field
5. WHEN verification data does not include a value for a form field, THE Verification_System SHALL not validate that field

### Requirement 3: Visual Mismatch Highlighting

**User Story:** As a user, I want to see clear visual indicators on fields that don't match verified data, so that I can quickly identify and correct errors.

#### Acceptance Criteria

1. WHEN a field is marked as Mismatched_Field, THE Verification_System SHALL display a red border around the field
2. WHEN a field is marked as Mismatched_Field, THE Verification_System SHALL display an inline error message below the field stating "This [field name] doesn't match verification records"
3. WHEN a field is marked as Matched_Field, THE Verification_System SHALL display a green checkmark icon next to the field
4. WHEN a field transitions from Mismatched_Field to Matched_Field, THE Verification_System SHALL remove the red border and error message within 200ms
5. WHEN all validated fields are Matched_Field, THE Verification_System SHALL remove all Visual_Indicator elements for errors

### Requirement 4: Field-Level Error Messages

**User Story:** As a user, I want specific error messages for each mismatched field, so that I understand what needs to be corrected without revealing sensitive verified data.

#### Acceptance Criteria

1. WHEN displaying an error for Mismatched_Field, THE Verification_System SHALL include the field label in the error message
2. WHEN displaying an error for Mismatched_Field, THE Verification_System SHALL not reveal the actual verified data value in the error message
3. WHEN a company name field is Mismatched_Field, THE Verification_System SHALL display "This company name doesn't match CAC records"
4. WHEN a personal name field is Mismatched_Field, THE Verification_System SHALL display "This name doesn't match NIN records"
5. WHEN a date field is Mismatched_Field, THE Verification_System SHALL display "This date doesn't match verification records"

### Requirement 5: Auto-Revalidation on Field Modification

**User Story:** As a user, I want fields to automatically revalidate when I fix them, so that I receive immediate confirmation that my corrections are correct.

#### Acceptance Criteria

1. WHEN an Authenticated_User modifies a Mismatched_Field and triggers a blur event, THE Verification_System SHALL revalidate that field within 200ms
2. WHEN Auto_Revalidation determines the field now matches, THE Verification_System SHALL update the field to Matched_Field status
3. WHEN Auto_Revalidation determines the field still does not match, THE Verification_System SHALL maintain Mismatched_Field status
4. WHEN Auto_Revalidation occurs, THE Verification_System SHALL use Verification_Cache data without making a new API call
5. WHEN an Authenticated_User modifies a Matched_Field, THE Verification_System SHALL revalidate that field on blur

### Requirement 6: Step Navigation Blocking

**User Story:** As a system administrator, I want to prevent users from proceeding to the next step when fields are mismatched, so that we maintain data integrity and prevent fraud.

#### Acceptance Criteria

1. WHEN one or more fields are marked as Mismatched_Field, THE Verification_System SHALL disable Step_Navigation buttons
2. WHEN all validated fields are marked as Matched_Field, THE Verification_System SHALL enable Step_Navigation buttons
3. WHEN Step_Navigation buttons are disabled due to mismatched fields, THE Verification_System SHALL display a tooltip message "Please correct highlighted fields before proceeding"
4. WHEN verification has not been triggered, THE Verification_System SHALL allow Step_Navigation
5. WHEN verification API returns an error, THE Verification_System SHALL allow Step_Navigation and log the error

### Requirement 7: Duplicate Verification Prevention

**User Story:** As a system administrator, I want to prevent duplicate verification API calls for the same identifier, so that we reduce costs and improve performance.

#### Acceptance Criteria

1. WHEN verification API returns data for an identifier, THE Verification_System SHALL store the response in Verification_Cache with the identifier as the key
2. WHEN a subsequent verification request occurs for a cached identifier, THE Verification_System SHALL retrieve data from Verification_Cache
3. WHEN an Authenticated_User changes the CAC_Field or NIN_Field value, THE Verification_System SHALL invalidate the previous Verification_Cache entry
4. WHEN Verification_Cache contains data for an identifier, THE Verification_System SHALL not make a duplicate API call for that identifier during the same session
5. THE Verification_System SHALL maintain Verification_Cache for the duration of the user session

### Requirement 8: Integration with Existing Autofill

**User Story:** As a user, I want empty fields to be automatically filled with verified data, so that I don't have to manually enter information that's already verified.

#### Acceptance Criteria

1. WHEN verification API returns data and a form field is empty, THE Verification_System SHALL populate the field using Autofill_Behavior
2. WHEN Autofill_Behavior populates a field, THE Verification_System SHALL mark that field as Matched_Field
3. WHEN Autofill_Behavior populates a field, THE Verification_System SHALL not display error Visual_Indicator for that field
4. WHEN a user manually clears an autofilled field, THE Verification_System SHALL mark that field as Mismatched_Field on blur
5. THE Verification_System SHALL maintain all existing Autofill_Behavior functionality for authenticated users

### Requirement 9: CAC Verification for Corporate Forms

**User Story:** As a user filling out a Corporate KYC or NFIU form, I want real-time validation of CAC-related fields, so that I can ensure my company information is accurate.

#### Acceptance Criteria

1. WHEN an Authenticated_User completes CAC_Field entry on Corporate_Form, THE Verification_System SHALL validate company name, registration date, and RC number fields
2. WHEN CAC verification returns data, THE Verification_System SHALL compare company name using case-insensitive matching
3. WHEN CAC verification returns data, THE Verification_System SHALL compare RC number after normalizing format differences
4. WHEN CAC verification returns data, THE Verification_System SHALL compare registration date using date normalization
5. THE Verification_System SHALL apply real-time validation to both CorporateKYC and CorporateNFIU forms

### Requirement 10: NIN Verification for Individual Forms

**User Story:** As a user filling out an Individual KYC or NFIU form, I want real-time validation of NIN-related fields, so that I can ensure my personal information is accurate.

#### Acceptance Criteria

1. WHEN an Authenticated_User completes NIN_Field entry on Individual_Form, THE Verification_System SHALL validate first name, last name, date of birth, and gender fields
2. WHEN NIN verification returns data, THE Verification_System SHALL compare names using case-insensitive matching
3. WHEN NIN verification returns data, THE Verification_System SHALL compare date of birth using date normalization
4. WHEN NIN verification returns data, THE Verification_System SHALL compare gender using normalized values (M/Male, F/Female)
5. THE Verification_System SHALL apply real-time validation to both IndividualKYC and IndividualNFIU forms

### Requirement 11: Error State Persistence Management

**User Story:** As a user, I want error messages to clear automatically when I fix the issues, so that I'm not confused by stale error indicators.

#### Acceptance Criteria

1. WHEN all Mismatched_Field instances are corrected to Matched_Field, THE Verification_System SHALL clear all error Visual_Indicator elements within 200ms
2. WHEN a user corrects a Mismatched_Field, THE Verification_System SHALL remove the error message for that specific field immediately upon successful revalidation
3. WHEN verification completes successfully with all matches, THE Verification_System SHALL not display any error messages under CAC_Field or NIN_Field
4. WHEN a new verification is triggered with a different identifier, THE Verification_System SHALL clear all previous Verification_State data
5. WHEN a user navigates away from the form and returns, THE Verification_System SHALL not display stale error messages

### Requirement 12: Verification Hook Implementation

**User Story:** As a developer, I want a reusable hook for real-time verification validation, so that I can easily integrate this functionality across multiple forms.

#### Acceptance Criteria

1. THE Verification_System SHALL provide a useRealtimeVerificationValidation hook that accepts form type and field configuration
2. WHEN useRealtimeVerificationValidation hook is invoked, THE hook SHALL return field validation state, error messages, and validation functions
3. WHEN useRealtimeVerificationValidation hook detects a verification trigger, THE hook SHALL coordinate with existing useAutoFill hook
4. WHEN useRealtimeVerificationValidation hook receives verification data, THE hook SHALL execute field matching logic using verificationMatcher utility
5. THE useRealtimeVerificationValidation hook SHALL manage Verification_State for all validated fields

### Requirement 13: MultiStepForm Integration

**User Story:** As a developer, I want the validation system to integrate with MultiStepForm step validation, so that navigation blocking works seamlessly with existing form logic.

#### Acceptance Criteria

1. WHEN Verification_System detects Mismatched_Field instances, THE Verification_System SHALL set MultiStepForm step validation to invalid
2. WHEN all fields are Matched_Field or not validated, THE Verification_System SHALL set MultiStepForm step validation to valid
3. WHEN MultiStepForm attempts Step_Navigation with invalid validation, THE MultiStepForm SHALL prevent navigation and display validation errors
4. THE Verification_System SHALL integrate with existing MultiStepForm validation without breaking current validation logic
5. WHEN verification is not applicable (unauthenticated users), THE Verification_System SHALL not affect MultiStepForm validation

### Requirement 14: Debouncing for Performance

**User Story:** As a system administrator, I want field revalidation to be debounced, so that we don't overwhelm the system with excessive validation checks.

#### Acceptance Criteria

1. WHEN a user rapidly modifies a Mismatched_Field, THE Verification_System SHALL debounce Auto_Revalidation with a 300ms delay
2. WHEN debounce timer is active and user triggers another blur event, THE Verification_System SHALL reset the debounce timer
3. WHEN debounce timer completes, THE Verification_System SHALL execute Auto_Revalidation once
4. THE Verification_System SHALL apply debouncing only to Auto_Revalidation, not to initial Verification_Trigger
5. WHEN verification data is retrieved from Verification_Cache, THE Verification_System SHALL complete validation within 100ms

### Requirement 15: Verification Data Matching Logic

**User Story:** As a developer, I want to leverage existing verification matching utilities, so that field comparison logic is consistent across the application.

#### Acceptance Criteria

1. WHEN comparing CAC data, THE Verification_System SHALL use the matchCACData function from verificationMatcher utility
2. WHEN comparing NIN data, THE Verification_System SHALL use the matchNINData function from verificationMatcher utility
3. WHEN matchCACData or matchNINData returns mismatch results, THE Verification_System SHALL identify specific Mismatched_Field instances
4. WHEN matchCACData or matchNINData returns match results, THE Verification_System SHALL mark all compared fields as Matched_Field
5. THE Verification_System SHALL handle partial matches where some fields match and others do not

### Requirement 16: Fallback to Submission-Time Validation

**User Story:** As a user, I want a final validation check at submission time, so that any edge cases not caught by real-time validation are still handled.

#### Acceptance Criteria

1. WHEN a user submits a form with Step_Navigation, THE Verification_System SHALL perform a final validation check
2. WHEN final validation detects mismatches not caught by real-time validation, THE Verification_System SHALL display VerificationMismatchModal
3. WHEN VerificationMismatchModal is displayed, THE Verification_System SHALL show all mismatched fields and their issues
4. WHEN a user acknowledges VerificationMismatchModal, THE Verification_System SHALL allow form submission to proceed
5. THE Verification_System SHALL log all submission-time validation failures for audit purposes

### Requirement 17: Accessibility and User Experience

**User Story:** As a user with accessibility needs, I want validation feedback to be accessible via screen readers, so that I can understand validation errors regardless of visual ability.

#### Acceptance Criteria

1. WHEN a field is marked as Mismatched_Field, THE Verification_System SHALL set aria-invalid attribute to true on the field
2. WHEN a field is marked as Mismatched_Field, THE Verification_System SHALL associate error message with field using aria-describedby
3. WHEN validation state changes, THE Verification_System SHALL announce the change to screen readers using aria-live regions
4. WHEN Step_Navigation is blocked, THE Verification_System SHALL provide accessible tooltip text explaining why navigation is disabled
5. THE Verification_System SHALL maintain keyboard navigation functionality for all validation-related UI elements

### Requirement 18: Error Recovery and Edge Cases

**User Story:** As a user, I want the system to handle verification errors gracefully, so that temporary API issues don't prevent me from completing my form.

#### Acceptance Criteria

1. WHEN verification API returns an error response, THE Verification_System SHALL display a generic error message without blocking Step_Navigation
2. WHEN verification API times out after 10 seconds, THE Verification_System SHALL allow the user to proceed with a warning message
3. WHEN verification API returns malformed data, THE Verification_System SHALL log the error and allow Step_Navigation
4. WHEN network connectivity is lost during verification, THE Verification_System SHALL display a connectivity error and allow retry
5. WHEN verification fails due to rate limiting, THE Verification_System SHALL display an appropriate message and allow the user to proceed after 60 seconds
