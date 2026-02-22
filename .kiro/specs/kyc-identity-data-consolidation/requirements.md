# Requirements Document

## Introduction

This document specifies requirements for consolidating NIN/CAC identity data from the identity-collection database into existing KYC/CDD/Claims form records. The system addresses a data fragmentation issue where identity verification data exists separately from form submissions, requiring a secure merge operation that preserves encryption and maintains audit trails.

## Glossary

- **Identity_Entry**: A record in the `identity-entries` Firestore collection containing encrypted NIN/CAC/BVN data collected through email verification links
- **Form_Record**: A document in any KYC/CDD/Claims Firestore collection (e.g., `individual-kyc`, `corporate-kyc`, `motor-claims`) representing a user's form submission
- **Consolidation_Service**: The backend service responsible for matching and merging identity data into form records
- **Matching_Engine**: The component that identifies corresponding Identity_Entries and Form_Records based on email, name, or policy number
- **Encryption_Utility**: The existing AES-256-GCM encryption module located at `server-utils/encryption.cjs`
- **Audit_Trail**: A comprehensive log of all consolidation operations including matches, updates, and errors
- **Dry_Run**: A preview mode that simulates consolidation without persisting changes to the database
- **Admin_Interface**: The web interface that allows administrators to trigger consolidation and review results
- **Consolidation_Report**: A summary document showing matched records, updated records, unmatched records, and errors

## Requirements

### Requirement 1: User Matching Across Data Sources

**User Story:** As a data administrator, I want to match users between identity-entries and form collections, so that I can identify which form records need NIN/CAC data appended.

#### Acceptance Criteria

1. WHEN matching by email, THE Matching_Engine SHALL compare the `submittedBy` field in Form_Records with the `email` field in Identity_Entries
2. WHEN email matching fails, THE Matching_Engine SHALL attempt to match using `displayName` and `dateOfBirth` fields if both are available
3. WHEN name and date matching fails, THE Matching_Engine SHALL attempt to match using `policyNumber` if available
4. WHEN multiple Identity_Entries match a single Form_Record, THE Matching_Engine SHALL select the most recent entry based on timestamp
5. WHEN a single Identity_Entry matches multiple Form_Records, THE Matching_Engine SHALL return all matching Form_Records for update
6. THE Matching_Engine SHALL normalize email addresses to lowercase before comparison
7. THE Matching_Engine SHALL trim whitespace from all matching fields before comparison

### Requirement 2: Encrypted Data Transfer

**User Story:** As a security officer, I want NIN/CAC data to remain encrypted during consolidation, so that sensitive identity information is never exposed in plaintext.

#### Acceptance Criteria

1. WHEN copying NIN data, THE Consolidation_Service SHALL transfer the encrypted object structure `{encrypted: string, iv: string}` without decryption
2. WHEN copying CAC data, THE Consolidation_Service SHALL transfer the encrypted object structure `{encrypted: string, iv: string}` without decryption
3. WHEN copying BVN data, THE Consolidation_Service SHALL transfer the encrypted object structure `{encrypted: string, iv: string}` without decryption
4. THE Consolidation_Service SHALL use the Encryption_Utility module for any encryption operations
5. THE Consolidation_Service SHALL validate that encrypted data contains both `encrypted` and `iv` fields before transfer
6. WHEN encrypted data is invalid or missing, THE Consolidation_Service SHALL log an error and skip that record

### Requirement 3: Multi-Collection Support

**User Story:** As a data administrator, I want to consolidate identity data across all KYC/CDD/Claims collections, so that all form types receive the missing NIN/CAC information.

#### Acceptance Criteria

1. THE Consolidation_Service SHALL process records from the `individual-kyc` collection
2. THE Consolidation_Service SHALL process records from the `corporate-kyc` collection
3. THE Consolidation_Service SHALL process records from the `Individual-kyc-form` collection
4. THE Consolidation_Service SHALL process records from the `corporate-kyc-form` collection
5. THE Consolidation_Service SHALL process records from the `brokers-kyc` collection
6. THE Consolidation_Service SHALL process records from the `agentsCDD` collection
7. THE Consolidation_Service SHALL process records from the `partnersCDD` collection
8. THE Consolidation_Service SHALL process records from the `motor-claims` collection
9. WHEN processing a collection, THE Consolidation_Service SHALL handle collection-specific field names and structures
10. THE Consolidation_Service SHALL allow administrators to select which collections to process

### Requirement 4: Idempotent Operations

**User Story:** As a data administrator, I want to run consolidation multiple times safely, so that I can retry failed operations without duplicating data or causing corruption.

#### Acceptance Criteria

1. WHEN a Form_Record already contains encrypted NIN data, THE Consolidation_Service SHALL skip updating that field
2. WHEN a Form_Record already contains encrypted CAC data, THE Consolidation_Service SHALL skip updating that field
3. WHEN a Form_Record already contains encrypted BVN data, THE Consolidation_Service SHALL skip updating that field
4. THE Consolidation_Service SHALL record in the Audit_Trail when records are skipped due to existing data
5. WHEN re-running consolidation, THE Consolidation_Service SHALL produce identical results for unchanged data
6. THE Consolidation_Service SHALL use Firestore transactions to ensure atomic updates

### Requirement 5: Comprehensive Audit Trail

**User Story:** As a compliance officer, I want detailed logs of all consolidation operations, so that I can verify data integrity and track changes for regulatory purposes.

#### Acceptance Criteria

1. WHEN a match is found, THE Consolidation_Service SHALL log the matching criteria used (email, name+DOB, or policy number)
2. WHEN a Form_Record is updated, THE Consolidation_Service SHALL log the document ID, collection name, fields updated, and timestamp
3. WHEN a match fails, THE Consolidation_Service SHALL log the Identity_Entry email and reason for failure
4. WHEN an error occurs, THE Consolidation_Service SHALL log the error message, stack trace, and affected record identifiers
5. THE Consolidation_Service SHALL record the administrator who initiated the consolidation operation
6. THE Consolidation_Service SHALL log the start time, end time, and total duration of each consolidation run
7. THE Audit_Trail SHALL be stored in a dedicated Firestore collection with appropriate security rules
8. WHEN consolidation completes, THE Consolidation_Service SHALL generate a summary count of matched, updated, skipped, and failed records

### Requirement 6: Dry Run Preview Mode

**User Story:** As a data administrator, I want to preview consolidation results before applying changes, so that I can verify the operation will work correctly without risking data corruption.

#### Acceptance Criteria

1. WHEN dry run mode is enabled, THE Consolidation_Service SHALL perform all matching operations without writing to Form_Records
2. WHEN dry run mode is enabled, THE Consolidation_Service SHALL generate a complete Consolidation_Report showing what would be changed
3. WHEN dry run mode is enabled, THE Consolidation_Service SHALL still write to the Audit_Trail with a "dry_run" flag
4. THE Consolidation_Report SHALL include sample records showing before and after states
5. THE Consolidation_Report SHALL highlight potential issues such as multiple matches or missing fields
6. WHEN dry run completes, THE Admin_Interface SHALL display the report for administrator review

### Requirement 7: Batch Processing and Performance

**User Story:** As a system administrator, I want consolidation to process large datasets efficiently, so that the operation completes in a reasonable timeframe without overwhelming Firestore.

#### Acceptance Criteria

1. THE Consolidation_Service SHALL process Form_Records in batches of no more than 500 documents per batch
2. THE Consolidation_Service SHALL use Firestore batch writes to update multiple documents atomically
3. WHEN a batch fails, THE Consolidation_Service SHALL retry that batch up to 3 times with exponential backoff
4. THE Consolidation_Service SHALL implement rate limiting to avoid exceeding Firestore quotas
5. WHEN processing large collections, THE Consolidation_Service SHALL provide progress updates every 100 records
6. THE Consolidation_Service SHALL allow administrators to pause and resume long-running operations

### Requirement 8: Admin Interface for Consolidation Control

**User Story:** As a data administrator, I want a web interface to trigger and monitor consolidation, so that I can control the process without requiring command-line access.

#### Acceptance Criteria

1. THE Admin_Interface SHALL display a button to initiate consolidation operations
2. THE Admin_Interface SHALL provide checkboxes to select which collections to process
3. THE Admin_Interface SHALL provide a toggle to enable dry run mode
4. WHEN consolidation is running, THE Admin_Interface SHALL display real-time progress including records processed and estimated time remaining
5. THE Admin_Interface SHALL display the Consolidation_Report upon completion
6. THE Admin_Interface SHALL allow administrators to download the Consolidation_Report as CSV or JSON
7. THE Admin_Interface SHALL restrict access to users with super-admin or data-admin roles
8. WHEN consolidation fails, THE Admin_Interface SHALL display error messages with actionable guidance

### Requirement 9: Consolidation Report Generation

**User Story:** As a data administrator, I want detailed reports after consolidation, so that I can verify the operation's success and identify any issues requiring manual intervention.

#### Acceptance Criteria

1. THE Consolidation_Report SHALL include the total count of Identity_Entries processed
2. THE Consolidation_Report SHALL include the total count of Form_Records matched
3. THE Consolidation_Report SHALL include the total count of Form_Records updated
4. THE Consolidation_Report SHALL include the total count of Form_Records skipped (already had data)
5. THE Consolidation_Report SHALL include a list of unmatched Identity_Entries with their email addresses
6. THE Consolidation_Report SHALL include a list of errors with affected record identifiers
7. THE Consolidation_Report SHALL include statistics broken down by collection name
8. THE Consolidation_Report SHALL include the matching strategy used for each successful match (email, name+DOB, policy number)
9. WHEN multiple Identity_Entries match the same user, THE Consolidation_Report SHALL flag these as potential duplicates

### Requirement 10: Error Handling and Recovery

**User Story:** As a system administrator, I want robust error handling during consolidation, so that partial failures don't corrupt data or leave the system in an inconsistent state.

#### Acceptance Criteria

1. WHEN a Firestore write fails, THE Consolidation_Service SHALL roll back that transaction and log the error
2. WHEN an Identity_Entry has malformed encrypted data, THE Consolidation_Service SHALL skip that entry and continue processing
3. WHEN a Form_Record is missing required fields for matching, THE Consolidation_Service SHALL log a warning and skip that record
4. WHEN network errors occur, THE Consolidation_Service SHALL retry the operation with exponential backoff up to 3 attempts
5. WHEN critical errors occur, THE Consolidation_Service SHALL halt processing and notify administrators
6. THE Consolidation_Service SHALL maintain a list of failed records for manual review
7. WHEN consolidation is interrupted, THE Consolidation_Service SHALL allow resuming from the last successful batch

### Requirement 11: Data Validation and Integrity

**User Story:** As a data quality officer, I want validation checks during consolidation, so that only valid data is written to form records.

#### Acceptance Criteria

1. WHEN copying encrypted data, THE Consolidation_Service SHALL validate that the `encrypted` field is a non-empty base64 string
2. WHEN copying encrypted data, THE Consolidation_Service SHALL validate that the `iv` field is a non-empty base64 string
3. THE Consolidation_Service SHALL validate that Identity_Entry status is "verified" before using that data
4. THE Consolidation_Service SHALL validate that Form_Record document IDs are valid before attempting updates
5. WHEN validation fails, THE Consolidation_Service SHALL log the validation error and skip that record
6. THE Consolidation_Service SHALL verify that updated Form_Records can be read back successfully after writing

### Requirement 12: Security and Access Control

**User Story:** As a security officer, I want strict access controls on consolidation operations, so that only authorized personnel can modify sensitive identity data.

#### Acceptance Criteria

1. THE Consolidation_Service SHALL run with a backend service account that has write access to encrypted fields
2. THE Admin_Interface SHALL verify that the current user has "super-admin" or "data-admin" role before displaying consolidation controls
3. THE Consolidation_Service SHALL log the user ID and email of the administrator who initiated each operation
4. THE Consolidation_Service SHALL use Firestore security rules to prevent client-side writes to encrypted fields
5. WHEN unauthorized access is attempted, THE Consolidation_Service SHALL log the attempt and return an error
6. THE Consolidation_Service SHALL require re-authentication for sensitive operations if the session is older than 30 minutes
