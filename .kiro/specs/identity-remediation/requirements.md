# Requirements Document

## Introduction

The Identity Collection System enables NEM Insurance to collect missing National Identification Numbers (NIN) and Corporate Affairs Commission (CAC) registration numbers from legacy insurance customers. Administrators upload customer data files (CSV/Excel) which are dynamically converted into viewable tables. The system auto-detects email addresses, allows selective verification requests, and appends collected identity data directly back to the original data structure.

## Glossary

- **Upload**: A file (CSV/Excel) uploaded by an admin containing customer data with any structure
- **Customer_List**: The table created from an uploaded file, preserving all original columns plus verification status columns
- **Entry**: A single row/customer in a Customer_List
- **Verification_Link**: A secure one-time URL sent to customers to collect their NIN or CAC
- **Admin_Portal**: The administrative interface where staff manage uploads, view lists, and track progress
- **Customer_Page**: The public-facing page where customers submit their NIN or CAC via their unique link

## Requirements

### Requirement 1: File Upload and Dynamic Table Creation

**User Story:** As an administrator, I want to upload any CSV or Excel file and have it automatically converted into a viewable table, so that I can work with customer data regardless of its original format.

#### Acceptance Criteria

1. WHEN an administrator uploads a valid Excel (.xlsx) or CSV file, THE Admin_Portal SHALL parse the file and display all columns and rows as a table
2. THE System SHALL preserve all original column names and data exactly as they appear in the uploaded file
3. WHEN the file is parsed, THE System SHALL automatically detect the first column containing "email" (case-insensitive) reading left to right
4. IF no email column is found, THEN THE Admin_Portal SHALL prompt the administrator to select which column contains email addresses
5. WHEN a Customer_List is created, THE System SHALL add tracking columns: "Verification Status", "NIN", "CAC", "Verified At", "Link Sent At"
6. THE System SHALL save the Customer_List to Firestore with a unique ID and admin-provided name
7. WHEN an administrator uploads a file, THE Admin_Portal SHALL show a preview before confirming the upload

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
2. THE Customer_Page SHALL show any identifying information from the entry (name, policy number if available) for confirmation
3. WHEN the verification type is NIN, THE Customer_Page SHALL display an input field for 11-digit NIN with validation
4. WHEN the verification type is CAC, THE Customer_Page SHALL display input fields for CAC/RC number and registered company name
5. WHEN the customer submits valid information, THE System SHALL call the Paystack verification API
6. IF verification succeeds, THEN THE System SHALL update the entry with the verified NIN or CAC and set status to "Verified"
7. IF verification fails, THEN THE Customer_Page SHALL display a friendly error and allow retry (maximum 3 attempts)
8. WHEN maximum attempts are exceeded, THE System SHALL mark the entry as "Verification Failed"

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

