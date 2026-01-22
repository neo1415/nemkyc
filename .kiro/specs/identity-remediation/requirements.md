# Requirements Document

## Introduction

The Identity Collection System enables NEM Insurance to collect missing National Identification Numbers (NIN) and Corporate Affairs Commission (CAC) registration numbers from legacy insurance customers. Administrators upload customer data files (CSV/Excel) which are dynamically converted into viewable tables. The system auto-detects email addresses, allows selective verification requests, and appends collected identity data directly back to the original data structure.

## Glossary

- **Upload**: A file (CSV/Excel) uploaded by an admin or broker containing customer data with any structure
- **Customer_List**: The table created from an uploaded file, preserving all original columns plus verification status columns
- **Entry**: A single row/customer in a Customer_List
- **Verification_Link**: A secure one-time URL sent to customers to collect their NIN or CAC
- **Admin_Portal**: The administrative interface where staff manage uploads, view lists, and track progress
- **Broker_Portal**: The broker interface where brokers manage their own uploads and view only their lists
- **Customer_Page**: The public-facing page where customers submit their NIN or CAC via their unique link
- **Broker**: A user with the "broker" role who can upload lists and send verification requests, but can only see their own data
- **User_Role**: The role assigned to a user (default, broker, compliance, claims, admin, super_admin)

## Requirements

### Requirement 1: File Upload and Dynamic Table Creation

**User Story:** As an administrator, I want to upload any CSV or Excel file and have it automatically converted into a viewable table, so that I can work with customer data regardless of its original format.

#### Acceptance Criteria

1. WHEN an administrator uploads a valid Excel (.xlsx) or CSV file, THE Admin_Portal SHALL parse the file and display all columns and rows as a table
2. THE System SHALL preserve all original column names and data exactly as they appear in the uploaded file
3. WHEN the file is parsed, THE System SHALL automatically detect the first column containing "email" (case-insensitive) reading left to right
4. IF no email column is found, THEN THE Admin_Portal SHALL prompt the administrator to select which column contains email addresses
5. WHEN the file is parsed, THE System SHALL automatically detect name columns by searching left to right for columns containing: "first" AND "name", "last" AND "name", "middle" AND "name", "insured", "full" AND "name", or just "name" (case-insensitive)
6. THE System SHALL combine detected name parts (firstName, middleName, lastName) into a single displayName field, or use the first matching name column value
7. WHEN a Customer_List is created, THE System SHALL add tracking columns: "Status", "NIN", "CAC", "Verified At", "Link Sent At"
8. THE System SHALL NOT add duplicate tracking columns if they already exist in the original file
9. THE System SHALL save the Customer_List to Firestore with a unique ID and admin-provided name
10. WHEN an administrator uploads a file, THE Admin_Portal SHALL show a preview before confirming the upload

### Requirement 2: Customer List Management

**User Story:** As an administrator, I want to view all my uploaded customer lists separately, so that I can manage different data sets independently.

#### Acceptance Criteria

1. THE Admin_Portal SHALL display a dashboard showing all Customer_Lists with name, upload date, total entries, and completion percentage
2. WHEN an administrator selects a Customer_List, THE Admin_Portal SHALL display the full table with all original columns plus verification columns
3. THE Admin_Portal SHALL support sorting and searching across all columns in a Customer_List
4. THE Admin_Portal SHALL support filtering entries by verification status (Pending, Link Sent, Verified, Failed)
5. WHEN an administrator requests deletion, THE System SHALL allow deleting a Customer_List and all its entries
6. THE System SHALL require confirmation before deleting a Customer_List

### Requirement 3: Entry Selection and Verification Type

**User Story:** As an administrator, I want to select specific entries and choose whether to request NIN or CAC verification, so that I can send appropriate verification requests to different customer types.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide checkboxes to select individual entries or select all entries
2. WHEN entries are selected, THE Admin_Portal SHALL display action buttons for "Request NIN" and "Request CAC"
3. WHEN an administrator clicks "Request NIN" or "Request CAC", THE Admin_Portal SHALL display a confirmation dialog showing the selected entries and their extracted email addresses
4. THE confirmation dialog SHALL display emails in a clean, formatted list for review before sending
5. WHEN confirmed, THE System SHALL generate unique verification links for each selected entry
6. THE System SHALL store the verification type (NIN or CAC) with each entry

### Requirement 4: Secure Link Generation

**User Story:** As an administrator, I want verification links to be secure and time-limited, so that customer data is protected.

#### Acceptance Criteria

1. WHEN a verification link is generated, THE System SHALL create a cryptographically secure token (minimum 32 bytes, URL-safe)
2. THE verification link SHALL follow the format: `{base_url}/verify/{token}`
3. WHEN a token is generated, THE System SHALL set an expiration (configurable, default 7 days)
4. WHEN a token expires, THE Customer_Page SHALL display "This link has expired. Please contact your insurance provider for a new link."
5. IF a token has already been used, THEN THE Customer_Page SHALL display "Your information has already been submitted. Thank you."

### Requirement 5: Email Sending

**User Story:** As an administrator, I want to send verification emails to selected customers, so that they receive their unique links with clear instructions.

#### Acceptance Criteria

1. WHEN verification is confirmed, THE System SHALL send personalized emails to each selected entry's email address
2. THE email SHALL include: a greeting with any available name from the entry, the verification link, expiration date, and NEM Insurance branding
3. WHEN an email is sent successfully, THE System SHALL update the entry's "Link Sent At" timestamp and status to "Link Sent"
4. IF email sending fails, THEN THE System SHALL mark the entry status as "Email Failed" and log the error
5. THE System SHALL enforce rate limiting (maximum 50 emails per minute) to avoid spam filters
6. THE Admin_Portal SHALL show real-time progress when sending emails to multiple entries

### Requirement 6: Customer Verification Page

**User Story:** As a customer, I want to access a simple verification page via my unique link, so that I can submit my NIN or CAC easily.

#### Acceptance Criteria

1. WHEN a customer accesses a valid link, THE Customer_Page SHALL display a branded page with NEM Insurance logo
2. THE Customer_Page SHALL prominently display the customer's name (from auto-detected name columns) for identity confirmation
3. THE Customer_Page SHALL display the policy number if available in the entry data
4. THE Customer_Page SHALL inform the customer that the NIN/CAC will be validated against the displayed name
5. WHEN the verification type is NIN, THE Customer_Page SHALL display an input field for 11-digit NIN with validation
6. WHEN the verification type is CAC, THE Customer_Page SHALL display input fields for CAC/RC number and registered company name
7. WHEN the customer submits valid information, THE System SHALL call the Paystack verification API
8. IF verification succeeds, THEN THE System SHALL update the entry with the verified NIN or CAC and set status to "Verified"
9. IF verification fails, THEN THE Customer_Page SHALL display a friendly error and allow retry (maximum 3 attempts)
10. WHEN maximum attempts are exceeded, THE System SHALL mark the entry as "Verification Failed"

### Requirement 7: Data Appending and Export

**User Story:** As an administrator, I want verified identity data to be added directly to my customer list, so that I can export complete data with all original columns plus the collected information.

#### Acceptance Criteria

1. WHEN a customer successfully verifies, THE System SHALL append the NIN or CAC value to the corresponding entry in the Customer_List
2. THE System SHALL preserve all original columns when appending verification data
3. THE Admin_Portal SHALL allow exporting a Customer_List to CSV or Excel with all columns (original + verification)
4. THE export SHALL include all entries regardless of verification status
5. THE export SHALL clearly indicate which entries are verified and which are pending

### Requirement 8: Link Management

**User Story:** As an administrator, I want to resend verification links to customers who haven't responded or whose links expired, so that they have another opportunity to verify.

#### Acceptance Criteria

1. THE Admin_Portal SHALL allow resending links for individual entries or bulk selection
2. WHEN a link is resent, THE System SHALL generate a new token and invalidate the old one
3. THE System SHALL track how many times a link has been resent for each entry
4. IF a link has been resent more than 3 times, THEN THE Admin_Portal SHALL show a warning before allowing another resend
5. THE Admin_Portal SHALL display the resend count for each entry

### Requirement 9: Activity Tracking

**User Story:** As an administrator, I want to see a history of all actions taken on customer lists, so that I can track progress and troubleshoot issues.

#### Acceptance Criteria

1. THE System SHALL log all significant actions: uploads, email sends, verifications, resends, deletions
2. THE Admin_Portal SHALL display an activity log for each Customer_List showing recent actions
3. THE activity log SHALL include timestamp, action type, and relevant details (entry affected, result)
4. THE Admin_Portal SHALL allow filtering the activity log by action type and date range

### Requirement 10: Progress Dashboard

**User Story:** As an administrator, I want to see overall progress across all customer lists, so that I can report on verification completion rates.

#### Acceptance Criteria

1. THE Admin_Portal dashboard SHALL display total entries across all lists, total verified, total pending
2. THE dashboard SHALL show a progress chart or percentage for overall completion
3. WHEN viewing a Customer_List, THE Admin_Portal SHALL show that list's specific progress (verified/total)
4. THE System SHALL calculate and display average time from link sent to verification

### Requirement 11: Broker Role and Access Control

**User Story:** As a broker, I want to register, upload customer lists, and send verification requests, but only see my own data, so that I can manage my clients independently while maintaining data privacy.

#### Acceptance Criteria

1. THE System SHALL support a new user role called "broker"
2. WHEN a user has the "broker" role, THEN they SHALL have access to the Identity Collection page
3. WHEN a broker views the Identity Lists Dashboard, THEN they SHALL only see lists they uploaded themselves
4. WHEN a broker views a Customer_List, THEN they SHALL only see entries from lists they created
5. WHEN a user has the "admin", "super_admin", or "compliance" role, THEN they SHALL see ALL lists and entries from all users
6. THE System SHALL store the creator's UID (createdBy) with each Customer_List
7. THE System SHALL filter lists and entries based on user role and createdBy field
8. WHEN a broker sends verification requests, THE System SHALL only allow sending to entries in their own lists
9. THE System SHALL prevent brokers from viewing, editing, or deleting lists created by other users

### Requirement 12: Broker Registration and Role Assignment

**User Story:** As a new user, I want to optionally register as a broker during sign-up, so that my account is automatically configured with the correct permissions.

#### Acceptance Criteria

1. THE registration page SHALL include a field to select user type: "Regular User" or "Broker"
2. WHEN a user selects "Broker" during registration, THEN their user role SHALL be set to "broker" after successful registration
3. WHEN a user selects "Regular User" or does not make a selection, THEN their user role SHALL be set to "default"
4. THE user type selection field SHALL be commented out in the UI but the logic SHALL remain functional
5. THE user type selection field SHALL NOT be required
6. THE System SHALL store the user role in the user's Firestore document
7. THE registration logic SHALL handle role assignment before completing the registration process

### Requirement 13: Admin User Role Management

**User Story:** As an administrator, I want to change user roles including assigning the broker role, so that I can manage user permissions as needed.

#### Acceptance Criteria

1. THE Admin User Management page SHALL display a role dropdown for each user
2. THE role dropdown SHALL include options: "default", "broker", "compliance", "claims", "admin", "super_admin"
3. WHEN an admin changes a user's role, THE System SHALL update the user's role in Firestore
4. WHEN an admin changes a user's role to "broker", THEN that user SHALL only see their own identity lists on next login
5. WHEN an admin changes a user's role from "broker" to another role, THEN that user SHALL see all lists (if admin/compliance) or no identity access (if default/claims)
6. THE System SHALL require admin or super_admin role to change user roles

### Requirement 14: Dynamic Email Template

**User Story:** As a customer, I want to receive a personalized email that mentions the correct identity document type (NIN or CAC) based on my client type, so that the instructions are clear and relevant.

#### Acceptance Criteria

1. WHEN the verification type is "NIN", THE email SHALL mention "National Identification Number (NIN)" and "Individual Clients"
2. WHEN the verification type is "CAC", THE email SHALL mention "Corporate Affairs Commission (CAC) Registration Number" and "Corporate Clients"
3. THE email SHALL use "Dear Client" as the greeting
4. THE email SHALL include the full regulatory text about NAICOM directives and KYC requirements
5. THE email SHALL include the secured verification link
6. THE email SHALL include contact information: nemsupport@nem-insurance.com and 0201-4489570-2
7. THE email template SHALL dynamically adjust content based on verificationType parameter

### Requirement 15: Structured Upload Templates

**User Story:** As a broker or administrator, I want to follow a specific template format when uploading customer data, so that the system can automatically detect whether the data is for individual or corporate clients.

#### Acceptance Criteria

1. THE System SHALL define a template for Individual clients with required columns: title, first name, last name, phone number, email, address, gender
2. THE System SHALL define a template for Individual clients with optional columns: date of birth, occupation, nationality
3. THE System SHALL define a template for Corporate clients with required columns: company name, company address, email address, company type, phone number
4. THE Upload Dialog SHALL display template information showing required columns for both Individual and Corporate formats
5. WHEN a file is uploaded, THE System SHALL analyze column names to determine if it matches Individual template (has first name, last name, email, phone number, address, gender)
6. WHEN a file is uploaded, THE System SHALL analyze column names to determine if it matches Corporate template (has company name, company address, email address, company type, phone number)
7. THE System SHALL auto-detect the list type (Individual or Corporate) based on which template the columns match
8. THE System SHALL validate that all required columns for the detected template are present
9. IF required columns are missing, THEN THE System SHALL display an error listing the missing columns
10. THE System SHALL maintain backward compatibility with the existing flexible format (no specific template required)
11. THE System SHALL allow administrators to toggle between "Template Mode" and "Flexible Mode" in settings or upload dialog

### Requirement 16: Broker Auto-Redirect on Login

**User Story:** As a broker, I want to be automatically redirected to the Identity Collection page with the upload dialog open when I log in, so that I can immediately start my workflow without navigation delays.

#### Acceptance Criteria

1. WHEN a user with "broker" role successfully logs in, THE System SHALL immediately redirect them to `/admin/identity`
2. WHEN the broker lands on `/admin/identity`, THE System SHALL automatically open the Upload Dialog modal
3. THE redirect and modal opening SHALL happen with no perceptible lag
4. THE auto-redirect SHALL only apply to users with "broker" role
5. WHEN a user with "admin", "compliance", or "super_admin" role logs in, THE System SHALL redirect them to the standard admin dashboard
6. WHEN a user with "default" or "claims" role logs in, THE System SHALL redirect them to their appropriate dashboard

### Requirement 17: Downloadable Excel Templates with Pre-filled Headers

**User Story:** As a broker, I want to download Excel templates with column headers already filled in, so that I can easily fill in customer data and upload it without formatting errors.

#### Acceptance Criteria

1. THE Identity Collection page SHALL display a "Download Template" button or menu
2. WHEN a broker clicks "Download Template", THE System SHALL show options for "Individual Template" and "Corporate Template"
3. WHEN "Individual Template" is selected, THE System SHALL generate an Excel file (.xlsx) with pre-filled headers: Title, First Name, Last Name, Phone Number, Email, Address, Gender, Date of Birth (optional), Occupation (optional), Nationality (optional), Policy Number (required), BVN (required), NIN (optional), CAC (optional)
4. WHEN "Corporate Template" is selected, THE System SHALL generate an Excel file (.xlsx) with pre-filled headers: Company Name, Company Address, Email Address, Company Type, Phone Number, Policy Number (required), Registration Number (required), Registration Date (required), Business Address (required), CAC (optional)
5. THE downloaded Excel file SHALL have the first row containing the column headers
6. THE downloaded Excel file SHALL be named descriptively (e.g., "NEM_Individual_Template.xlsx", "NEM_Corporate_Template.xlsx")
7. THE System SHALL allow brokers to fill in data under each column header and re-upload the file

### Requirement 18: Enhanced Data Columns

**User Story:** As a broker, I want to provide additional identity and policy information in my uploads, so that the system can perform comprehensive verification and integration with IES.

#### Acceptance Criteria

1. THE Individual template SHALL include a "Policy Number" column (required) for IES handshake/integration
2. THE Individual template SHALL include a "BVN" column (required) for validation with NIN
3. THE Individual template SHALL include a "NIN" column (optional) if broker already has it
4. THE Individual template SHALL include a "CAC" column (optional) if broker already has it
5. THE Corporate template SHALL include a "Policy Number" column (required) for IES handshake/integration
6. THE Corporate template SHALL include a "Registration Number" column (required) for corporate verification
7. THE Corporate template SHALL include a "Registration Date" column (required) for corporate verification
8. THE Corporate template SHALL include a "Business Address" column (required) for corporate verification
9. THE Corporate template SHALL include a "CAC" column (optional) if broker already has it
10. THE System SHALL store all these additional columns in the entry data
11. THE System SHALL validate that required columns contain non-empty values

### Requirement 19: Bulk Verification Button

**User Story:** As a broker or administrator, I want to verify all unverified entries in bulk, so that I can quickly process entries that already have identity numbers pre-filled.

#### Acceptance Criteria

1. THE list detail page SHALL display a "Verify All Unverified" button
2. WHEN the "Verify All Unverified" button is clicked, THE System SHALL read all entries in the list
3. FOR entries with status "pending" or "link_sent" that have NIN pre-filled, THE System SHALL automatically verify the NIN against the appropriate API
4. FOR entries with status "pending" or "link_sent" that have BVN pre-filled, THE System SHALL automatically verify the BVN against the appropriate API
5. FOR entries with status "pending" or "link_sent" that have CAC pre-filled, THE System SHALL automatically verify the CAC against the appropriate API
6. WHEN verification succeeds, THE System SHALL update the entry status to "verified"
7. WHEN verification fails, THE System SHALL update the entry status to "verification_failed" with detailed error message
8. THE System SHALL skip entries that are already verified (status = "verified")
9. THE System SHALL skip entries that do not have NIN, BVN, or CAC pre-filled
10. THE System SHALL display progress during bulk verification
11. WHEN bulk verification completes, THE System SHALL display a summary showing: total processed, successful verifications, failed verifications, skipped entries

### Requirement 20: Enhanced Verification Flow with Field-Level Validation

**User Story:** As a customer, I want to see relevant information on the verification page and have my identity validated against multiple fields, so that the verification is comprehensive and accurate.

#### Acceptance Criteria

1. WHEN verification type is NIN (Individual), THE Customer_Page SHALL display: First Name, Last Name, Email, Date of Birth
2. WHEN verification type is NIN (Individual), THE Customer_Page SHALL provide an input field for NIN
3. WHEN a customer submits NIN, THE System SHALL validate the NIN against: First Name, Last Name, Date of Birth, Gender, BVN (all in background)
4. WHEN verification type is CAC (Corporate), THE Customer_Page SHALL display: Company Name, Registration Number, Registration Date
5. WHEN verification type is CAC (Corporate), THE Customer_Page SHALL provide an input field for CAC
6. WHEN a customer submits CAC, THE System SHALL validate the CAC against: Company Name, Registration Number, Registration Date, Business Address (all in background)
7. THE System SHALL perform all field validations without displaying which specific fields are being checked to the customer
8. WHEN all validations pass, THE System SHALL mark the entry as "verified"
9. WHEN any validation fails, THE System SHALL mark the entry as "verification_failed" with detailed error information

### Requirement 21: Detailed Error Handling and Notifications

**User Story:** As a customer and as staff, I want to receive clear, actionable error messages when verification fails, so that I know what went wrong and what to do next.

#### Acceptance Criteria

1. WHEN verification fails due to field mismatch, THE Customer_Page SHALL display a user-friendly error message explaining exactly what doesn't match
2. THE error message SHALL include clear next steps: "Please contact your broker at [broker_email]"
3. WHEN verification fails, THE System SHALL send an email to the customer with the error message and broker contact information
4. WHEN verification fails, THE System SHALL send an email notification to staff (Compliance, Admin, Brokers)
5. THE staff email SHALL include details of what failed (which fields didn't match)
6. THE staff email SHALL request verification that the data provided is correct
7. IN the list detail table, THE System SHALL display a new status: "verification_failed"
8. WHEN a user clicks on a failed entry, THE System SHALL show the detailed failure reason
9. THE failure reason SHALL use good UI/UX language that is clear and professional
10. THE System SHALL log all verification failures with detailed error information for audit purposes

### Requirement 22: Selection Logic Enhancement

**User Story:** As a broker or administrator, I want the "Select All" function to intelligently exclude already-verified entries, so that I don't waste resources sending duplicate verification requests.

#### Acceptance Criteria

1. WHEN "Select All" is clicked, THE System SHALL automatically exclude entries with status "verified"
2. WHEN "Select All" is clicked, THE System SHALL only select entries with status "pending" or "link_sent"
3. THE System SHALL NOT send verification requests to entries that are already verified
4. THE System SHALL display a count of selected entries excluding verified entries
5. WHEN a user manually selects a verified entry, THE System SHALL show a warning: "This entry is already verified"
6. THE "Request NIN" and "Request CAC" buttons SHALL be disabled if only verified entries are selected

### Requirement 23: Hide Flexible Mode Tab

**User Story:** As a product manager, I want to hide the Flexible Mode tab from the UI while keeping the code, so that we can simplify the interface while maintaining the option to re-enable it later.

#### Acceptance Criteria

1. THE Upload Dialog SHALL NOT display the "Flexible Mode" tab option
2. THE Upload Dialog SHALL only show "Template Mode" as the upload option
3. THE System SHALL keep all Flexible Mode code in the codebase without deletion
4. THE System SHALL add code comments indicating that Flexible Mode is hidden but available
5. THE System SHALL default to Template Mode for all uploads
6. THE System SHALL maintain backward compatibility with existing flexible-mode lists

### Requirement 24: NAICOM Compliance Messaging

**User Story:** As a broker, I want to understand the regulatory requirements for collecting customer identity information, so that I can communicate the importance to my clients.

#### Acceptance Criteria

1. THE Upload Dialog SHALL display a professional explanation about NAICOM/NAIIRA regulations
2. THE explanation SHALL inform brokers that they must provide all required details in accordance with NAICOM/NAIIRA law
3. THE explanation SHALL use the same regulatory language from the customer verification email
4. THE explanation SHALL be tuned for brokers (not customers)
5. THE explanation SHALL be displayed prominently before or during the upload process
6. THE explanation SHALL include references to KYC requirements and data integrity mandates

### Requirement 25: Onboarding Tour System

**User Story:** As a new broker, I want a guided tour of the Identity Collection system, so that I can quickly learn how to use all the features effectively.

#### Acceptance Criteria

1. THE System SHALL implement a guided onboarding tour using React Joyride library
2. THE tour SHALL include the following steps in order:
   - Step 1: Welcome message explaining the identity collection process
   - Step 2: Highlight "Upload New List" button and explain downloading templates
   - Step 3: After upload, highlight the list table and explain reviewing data
   - Step 4: Highlight "Select All" checkbox and explain selecting customers
   - Step 5: Highlight "Request NIN" / "Request CAC" buttons and explain sending verification requests
   - Step 6: Highlight status column and explain tracking progress
   - Step 7: Highlight "Verify All Unverified" button and explain bulk verification
3. THE System SHALL track tour completion in Firestore (user document field: `onboardingTourCompleted`)
4. THE tour SHALL only be shown on first login for brokers (when `onboardingTourCompleted` is false or undefined)
5. THE System SHALL provide a way for users to restart the tour from settings or help menu
6. THE tour SHALL be dismissible at any time
7. WHEN a user dismisses the tour, THE System SHALL mark it as completed
8. THE tour SHALL use NEM Insurance branding colors (#800020)
9. THE tour SHALL have clear "Next", "Back", and "Skip Tour" buttons

### Requirement 26: API Integration Preparation

**User Story:** As a developer, I want the system to be prepared for future API integrations, so that we can easily connect real verification services when they become available.

#### Acceptance Criteria

1. THE System SHALL document that NIN/BVN verification API will be integrated later
2. THE System SHALL document that CAC verification API (different from NIN/BVN) will be integrated later
3. THE System SHALL document that Termii APIs for WhatsApp and SMS notifications will be integrated later
4. THE System SHALL use mock/demo mode for testing verification flows
5. THE System SHALL structure verification code to easily swap mock implementations with real API calls
6. THE System SHALL include configuration flags to enable/disable demo mode
7. THE System SHALL log all verification attempts for future API integration testing

### Requirement 27: Prevent Duplicate Verifications

**User Story:** As an administrator, I want to prevent duplicate verification requests for already-verified entries, so that we don't waste money on unnecessary API calls.

#### Acceptance Criteria

1. WHEN an entry has status "verified", THE System SHALL NOT allow it to be selected for sending verification emails
2. WHEN an entry has status "verified", THE System SHALL NOT include it in bulk verification
3. THE list detail page SHALL clearly mark verified entries with a distinct visual indicator
4. WHEN a user attempts to select a verified entry, THE System SHALL show a tooltip: "Already verified"
5. THE "Request NIN" and "Request CAC" buttons SHALL be disabled when only verified entries are selected
6. THE "Verify All Unverified" button SHALL skip all entries with status "verified"
7. THE System SHALL log when duplicate verification attempts are prevented for audit purposes

