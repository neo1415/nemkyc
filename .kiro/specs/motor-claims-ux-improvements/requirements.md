# Requirements Document

## Introduction

This document outlines the requirements for improving the Motor Claims form user experience, user dashboard functionality, ticket ID system, and admin table data display. The improvements span across form fields, email notifications, user dashboard submissions tracking, and data consistency in admin tables.

## Glossary

- **Motor_Claims_Form**: The form used by customers to submit motor insurance claims
- **User_Dashboard**: The dashboard page at /dashboard for users with 'user' or 'default' roles
- **Admin_Table**: The data grid displaying form submissions for administrators
- **Form_Viewer**: The detailed view component for viewing submitted form data
- **Ticket_ID**: A unique 8-digit identifier with form type prefix (e.g., MOT-12345678) for tracking submissions
- **Third_Party_Driver**: The driver of another vehicle involved in an incident
- **Submission_Card**: A UI card component displaying a user's form submission summary
- **Status**: The current state of a claim (processing, approved, rejected)

## Requirements

### Requirement 1: Third Party Driver Phone Number

**User Story:** As a claims officer, I want to collect the phone number of the third party driver involved in an incident, so that I can contact them for claim verification.

#### Acceptance Criteria

1. WHEN a user indicates another vehicle was involved in the Motor Claims form, THE Motor_Claims_Form SHALL display a phone number input field for the third party driver
2. WHEN the third party driver phone field is displayed, THE Motor_Claims_Form SHALL validate the phone number format
3. WHEN the form is submitted with third party information, THE System SHALL store the third party driver phone number in the database
4. WHEN viewing a motor claim in the Admin_Table or Form_Viewer, THE System SHALL display the third party driver phone number

### Requirement 2: Police Report Upload Clarification

**User Story:** As a user submitting a motor claim, I want clear guidance on when a police report is required, so that I understand the documentation requirements.

#### Acceptance Criteria

1. WHEN the police report upload field is displayed, THE Motor_Claims_Form SHALL show a message stating "Please note that police report is required for accidents involving bodily injury or death"
2. THE Motor_Claims_Form SHALL keep the police report upload field as optional
3. WHEN displaying the police report field, THE System SHALL show the requirement message in a visible bracket or note below the upload field

### Requirement 3: Ticket ID Generation

**User Story:** As a user, I want a unique ticket ID for my submission, so that I can reference it in future correspondence with the company.

#### Acceptance Criteria

1. WHEN a form is submitted, THE System SHALL generate a unique Ticket_ID consisting of a 3-letter form type prefix followed by a hyphen and 8 digits (e.g., MOT-12345678)
2. THE System SHALL use the following prefixes: MOT for Motor Claims, FIR for Fire Claims, BUR for Burglary Claims, ALL for All Risk Claims, GIT for Goods in Transit, MON for Money Insurance, PUB for Public Liability, EMP for Employers Liability, GPA for Group Personal Accident, FID for Fidelity Guarantee, REN for Rent Assurance, CPM for Contractors Plant Machinery, COM for Combined GPA/Employers Liability, PRO for Professional Indemnity
3. THE System SHALL ensure Ticket_ID uniqueness across all submissions
4. WHEN a form is submitted, THE System SHALL store the Ticket_ID with the form data

### Requirement 4: Email Confirmation with Ticket ID

**User Story:** As a user, I want to receive an email confirmation with my ticket ID, so that I can track my submission.

#### Acceptance Criteria

1. WHEN a form is successfully submitted, THE System SHALL send a confirmation email to the user's email address
2. THE confirmation email SHALL include the system-generated Ticket_ID prominently displayed
3. THE confirmation email SHALL state that the Ticket_ID should be referenced in future correspondence with the company
4. THE confirmation email SHALL include a "View or Track Submission" button/link
5. WHEN a user clicks the "View or Track Submission" link, THE System SHALL redirect to the sign-in page if not authenticated
6. WHEN a user with 'user' or 'default' role signs in via the email link, THE System SHALL redirect them to /dashboard

### Requirement 5: User Dashboard Submissions View

**User Story:** As a user, I want to see all forms I have submitted on my dashboard, so that I can track their status.

#### Acceptance Criteria

1. WHEN a user with 'user' or 'default' role visits /dashboard, THE User_Dashboard SHALL display a grid of Submission_Cards for forms they have submitted
2. THE Submission_Cards SHALL be the first/primary content the user sees on the dashboard
3. EACH Submission_Card SHALL display: form type, Ticket_ID, submission date, and current status
4. FOR claim forms, THE Submission_Card SHALL display the status (processing, approved, rejected) with appropriate visual indicators
5. WHEN a user clicks on a Submission_Card, THE System SHALL open the Form_Viewer showing only the user's submitted data
6. THE Form_Viewer for users SHALL NOT display administrative fields like form ID or internal identifiers
7. THE User_Dashboard SHALL maintain the burgundy, gold, and white color theme

### Requirement 6: User Dashboard Layout Reorganization

**User Story:** As a user, I want my profile information and password change in a separate section, so that the dashboard focuses on my submissions.

#### Acceptance Criteria

1. THE User_Dashboard main view SHALL prioritize displaying the user's submissions
2. THE User_Dashboard SHALL display a welcome message with the user's name at the top
3. THE User_Dashboard SHALL provide a sidebar or separate page for user profile information and password change functionality
4. THE profile section SHALL include: user details (name, email, phone, member since) and password change form

### Requirement 11: User Dashboard Analytics

**User Story:** As a user, I want to see analytics about my submissions, so that I can quickly understand the status of all my forms at a glance.

#### Acceptance Criteria

1. THE User_Dashboard SHALL display an analytics section above the submissions grid
2. THE analytics section SHALL show the total number of forms submitted by the user
3. THE analytics section SHALL display a breakdown by form category (KYC forms vs Claims forms)
4. THE analytics section SHALL show counts by status: pending/processing, approved, and rejected
5. THE analytics section SHALL display visual indicators (cards or charts) for each metric
6. THE analytics section SHALL use the burgundy, gold, and white color theme
7. WHEN the user has no submissions, THE analytics section SHALL display zeros with appropriate messaging

### Requirement 7: Ticket ID Display in Form Viewer

**User Story:** As a user or admin, I want to see the ticket ID when viewing a submission, so that I can reference it easily.

#### Acceptance Criteria

1. WHEN viewing any form submission in the Form_Viewer, THE System SHALL display the Ticket_ID prominently
2. THE Ticket_ID SHALL be visible to both users and administrators
3. THE Ticket_ID SHALL appear in a consistent location across all form types

### Requirement 8: Admin Table Data Consistency

**User Story:** As an admin, I want the motor claims table to display data correctly, so that I can review submissions accurately.

#### Acceptance Criteria

1. WHEN displaying witnesses in the Admin_Table, THE System SHALL format each witness as separate readable entries (not JSON format)
2. IF there are no witnesses, THE Admin_Table SHALL not display witness columns
3. THE Admin_Table SHALL only display columns for fields that exist in the current form schema
4. THE Admin_Table SHALL NOT display N/A for fields that have valid data
5. WHEN displaying incident time, THE Admin_Table SHALL format it correctly (not as NaN)
6. THE Admin_Table SHALL map form field names to their corresponding database field names correctly

### Requirement 9: Form Viewer Data Consistency

**User Story:** As an admin or user, I want the form viewer to display all submitted data correctly, so that I can review the complete submission.

#### Acceptance Criteria

1. THE Form_Viewer SHALL display all fields that were submitted with the form
2. THE Form_Viewer SHALL correctly format date and time fields
3. THE Form_Viewer SHALL display witnesses as individual entries with name, address, and phone
4. THE Form_Viewer SHALL NOT display deprecated or non-existent fields

### Requirement 10: Real-time Status Updates for Users

**User Story:** As a user, I want to see when my claim status changes, so that I know the progress of my submission.

#### Acceptance Criteria

1. WHEN an admin or claims officer approves or rejects a claim, THE System SHALL update the status in the database
2. WHEN a user views their dashboard, THE Submission_Card SHALL reflect the current status from the database
3. THE status display SHALL use visual indicators: processing (yellow/warning), approved (green/success), rejected (red/error)
