# Requirements Document: Form Submission UX Consistency

## Introduction

This specification addresses the inconsistent user experience across different form types in the NEM Insurance Forms application. Currently, the Motor Claims form provides an excellent submission experience with immediate loading feedback and comprehensive summaries, while other forms (KYC, CDD, other claims) lack this polish, leading to user confusion and perceived unresponsiveness.

## Glossary

- **Form Submission Flow**: The complete process from clicking submit to seeing success confirmation
- **Loading Modal**: A visual indicator showing the user that their submission is being processed
- **Summary Dialog**: A pre-submission review screen showing all form data before final submission
- **Validation Feedback**: Visual indication that form validation is occurring
- **Motor Claims Form**: The reference implementation with the desired UX behavior
- **KYC Forms**: Know Your Customer forms (Individual and Corporate)
- **CDD Forms**: Customer Due Diligence forms (Individual, Corporate, Agents, Brokers, Partners)
- **Claims Forms**: All insurance claim forms (Motor, Fire, Burglary, All Risk, etc.)

## Requirements

### Requirement 1: Immediate Loading Feedback

**User Story:** As a user submitting any form, I want to see immediate visual feedback when I click submit, so that I know the system is processing my request and I don't think the button is broken.

#### Acceptance Criteria

1. WHEN a user clicks the final submit button on any form THEN the system SHALL display a loading modal immediately
2. WHEN validation is occurring THEN the loading modal SHALL show "Validating your submission..." message
3. WHEN validation completes successfully THEN the loading modal SHALL transition to "Submitting your form..." message
4. WHEN validation fails THEN the loading modal SHALL close and error messages SHALL be displayed
5. WHEN the user is redirected to sign in/up THEN the loading modal SHALL persist until redirect completes

### Requirement 2: Comprehensive Summary Dialog

**User Story:** As a user, I want to review all my form data in a well-organized summary before final submission, so that I can catch any errors and feel confident about what I'm submitting.

#### Acceptance Criteria

1. WHEN a user completes all form steps and clicks submit THEN the system SHALL display a summary dialog with all form data
2. WHEN displaying the summary THEN the system SHALL organize data into logical sections matching the form structure
3. WHEN displaying the summary THEN the system SHALL show field labels and values in a readable format
4. WHEN displaying dates THEN the system SHALL format them as DD/MM/YYYY
5. WHEN displaying file uploads THEN the system SHALL show the file names
6. WHEN displaying conditional fields THEN the system SHALL only show fields that are relevant based on user selections
7. WHEN the user reviews the summary THEN the system SHALL provide "Edit Form" and "Submit" buttons
8. WHEN the user clicks "Edit Form" THEN the system SHALL close the summary and return to the form

### Requirement 3: Post-Authentication Submission Continuity

**User Story:** As an unauthenticated user who fills out a form, I want the submission to complete automatically after I sign in, so that I don't have to re-enter my data or click submit again.

#### Acceptance Criteria

1. WHEN an unauthenticated user clicks submit THEN the system SHALL store the form data and redirect to sign in
2. WHEN the user completes sign in THEN the system SHALL automatically show the loading modal
3. WHEN the user returns to the form page after authentication THEN the system SHALL automatically process the pending submission
4. WHEN processing a pending submission THEN the loading modal SHALL show "Processing your submission..." message
5. WHEN the pending submission completes THEN the system SHALL show the success modal

### Requirement 4: Consistent Loading States

**User Story:** As a user, I want consistent loading indicators across all forms, so that I have a predictable experience regardless of which form I'm using.

#### Acceptance Criteria

1. WHEN any form is submitting THEN the loading modal SHALL use the same design and animations
2. WHEN validation is occurring THEN the loading modal SHALL show a spinner animation
3. WHEN submission is in progress THEN the loading modal SHALL show a spinner animation
4. WHEN the loading modal is displayed THEN the user SHALL NOT be able to interact with the form behind it
5. WHEN the loading modal is displayed THEN the modal SHALL be centered on the screen with a semi-transparent backdrop

### Requirement 5: Error Handling Consistency

**User Story:** As a user, I want clear error messages when something goes wrong, so that I know what to fix and can successfully submit my form.

#### Acceptance Criteria

1. WHEN validation fails THEN the system SHALL close the loading modal and display field-specific error messages
2. WHEN a network error occurs THEN the system SHALL show a user-friendly error message with retry option
3. WHEN the server returns an error THEN the system SHALL display the error message from the server
4. WHEN an error occurs THEN the system SHALL log the error details for debugging
5. WHEN the user fixes validation errors THEN the error messages SHALL clear automatically

### Requirement 6: Success Confirmation Consistency

**User Story:** As a user who successfully submits a form, I want a clear confirmation message, so that I know my submission was received and what happens next.

#### Acceptance Criteria

1. WHEN a form submission succeeds THEN the system SHALL display a success modal
2. WHEN displaying the success modal THEN the system SHALL show the form type in the title
3. WHEN displaying the success modal THEN the system SHALL include next steps information
4. WHEN displaying the success modal THEN the system SHALL provide a "Close" or "Done" button
5. WHEN the user closes the success modal THEN the system SHALL clear the form draft from storage

### Requirement 7: Centralized Component Architecture

**User Story:** As a developer, I want a reusable form submission component, so that all forms have consistent behavior without code duplication.

#### Acceptance Criteria

1. WHEN implementing form submission THEN the system SHALL use a centralized submission hook
2. WHEN implementing summary dialogs THEN the system SHALL use a reusable summary component
3. WHEN implementing loading states THEN the system SHALL use a shared loading modal component
4. WHEN a form needs custom summary layout THEN the component SHALL accept custom render functions
5. WHEN a form needs custom validation THEN the component SHALL accept custom validation functions

### Requirement 8: Performance and Responsiveness

**User Story:** As a user on a slow connection, I want the form to remain responsive during submission, so that I don't experience freezing or unresponsiveness.

#### Acceptance Criteria

1. WHEN validation is occurring THEN the UI SHALL remain responsive
2. WHEN submission is in progress THEN the loading modal SHALL prevent duplicate submissions
3. WHEN file uploads are included THEN the system SHALL show upload progress
4. WHEN the submission takes longer than 30 seconds THEN the system SHALL show a "This is taking longer than usual" message
5. WHEN the user navigates away during submission THEN the system SHALL warn about losing progress

