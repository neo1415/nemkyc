# Requirements Document

## Introduction

The bulk verification system currently wastes API credits by verifying the same identities multiple times, polls continuously after completion, and lacks user confirmation before starting expensive operations. This feature adds duplicate prevention, pre-verification confirmation, and proper polling lifecycle management to reduce costs and improve user experience.

## Glossary

- **Identity**: A NIN (11 digits), BVN (11 digits), or CAC (variable format) number that can be verified
- **Bulk_Verification_System**: The system that processes multiple identity verifications in batch
- **Verification_Entry**: A single identity record to be verified within a bulk operation
- **API_Provider**: External service (Datapro for NIN/BVN, Verifydata for CAC) that performs verification
- **Identity_List**: A collection of verification entries managed by a broker
- **Verification_Status**: The state of a verification entry (unverified, verified, failed, skipped)
- **Duplicate_Check**: Process of searching the database to determine if an identity has been previously verified
- **Polling**: Frontend process of repeatedly requesting job status updates from the backend
- **Confirmation_Modal**: UI dialog that displays verification details and requires user approval before proceeding
- **API_Credit**: Billable unit consumed when calling an API provider for verification

## Requirements

### Requirement 1: Cross-List Duplicate Detection

**User Story:** As a system administrator, I want the system to check for duplicate identities across all lists before verification, so that we don't waste API credits on already-verified identities.

#### Acceptance Criteria

1. WHEN a verification entry is processed, THE Bulk_Verification_System SHALL search all Identity_Lists in the database for matching identities before calling the API_Provider
2. WHEN searching for duplicates, THE Bulk_Verification_System SHALL match based on the identity value (NIN, BVN, or CAC number) regardless of which Identity_List contains it
3. WHEN a duplicate is found, THE Bulk_Verification_System SHALL skip the verification and mark the entry with status "already_verified"
4. WHEN a duplicate is found, THE Bulk_Verification_System SHALL record metadata including the original verification timestamp and the Identity_List name where it was first verified
5. WHEN a duplicate is skipped, THE Bulk_Verification_System SHALL log the skip reason with details for audit purposes
6. THE Bulk_Verification_System SHALL perform duplicate checks before making any API_Provider calls

### Requirement 2: Duplicate Prevention for Link Sending

**User Story:** As a broker, I want the system to check for duplicates before sending verification links, so that customers don't receive unnecessary verification requests.

#### Acceptance Criteria

1. WHEN a verification link is about to be sent, THE Bulk_Verification_System SHALL perform a Duplicate_Check across all Identity_Lists
2. WHEN a duplicate is found during link sending, THE Bulk_Verification_System SHALL skip sending the link and mark the entry as "already_verified"
3. WHEN a duplicate is found during link sending, THE Bulk_Verification_System SHALL record the same metadata as bulk verification (original timestamp and Identity_List)
4. THE Bulk_Verification_System SHALL perform duplicate checks before generating or sending any verification links

### Requirement 3: Pre-Verification Confirmation Modal

**User Story:** As a broker, I want to see a confirmation modal with verification details before starting bulk verification, so that I can review the scope and cost before proceeding.

#### Acceptance Criteria

1. WHEN a user clicks the "Verify Unverified" button, THE Bulk_Verification_System SHALL display a Confirmation_Modal before starting any verification
2. WHEN displaying the Confirmation_Modal, THE Bulk_Verification_System SHALL show the total number of entries to be processed
3. WHEN displaying the Confirmation_Modal, THE Bulk_Verification_System SHALL show how many entries will be verified (excluding duplicates and invalid entries)
4. WHEN displaying the Confirmation_Modal, THE Bulk_Verification_System SHALL show how many entries will be skipped with breakdown by reason (already_verified, invalid_format, etc.)
5. WHEN displaying the Confirmation_Modal, THE Bulk_Verification_System SHALL calculate and display the estimated API_Credit cost based on entries to be verified
6. WHEN a user confirms in the Confirmation_Modal, THE Bulk_Verification_System SHALL proceed with bulk verification
7. WHEN a user cancels in the Confirmation_Modal, THE Bulk_Verification_System SHALL abort the operation without processing any entries

### Requirement 4: Polling Lifecycle Management

**User Story:** As a broker, I want the UI to stop polling after bulk verification completes, so that the system doesn't waste resources with unnecessary requests.

#### Acceptance Criteria

1. WHILE a bulk verification job is in progress, THE Bulk_Verification_System SHALL respond to polling requests with current job status
2. WHEN a bulk verification job completes (success or failure), THE Bulk_Verification_System SHALL include a completion indicator in the status response
3. WHEN the frontend receives a completion indicator, THE Bulk_Verification_System SHALL stop sending polling requests
4. WHEN a bulk verification job is not in progress, THE Bulk_Verification_System SHALL not initiate polling
5. THE Bulk_Verification_System SHALL use exponential backoff for polling intervals to reduce server load

### Requirement 5: Duplicate Check Performance

**User Story:** As a system administrator, I want duplicate checks to be fast and efficient, so that bulk verification doesn't slow down significantly.

#### Acceptance Criteria

1. WHEN performing a Duplicate_Check, THE Bulk_Verification_System SHALL use indexed database queries for identity lookups
2. WHEN processing bulk verification, THE Bulk_Verification_System SHALL batch duplicate checks where possible to minimize database queries
3. WHEN a Duplicate_Check takes longer than 5 seconds, THE Bulk_Verification_System SHALL log a performance warning
4. THE Bulk_Verification_System SHALL complete duplicate checks for a single entry within 2 seconds under normal load

### Requirement 6: Audit Trail for Cost Savings

**User Story:** As a system administrator, I want detailed logs of duplicate prevention, so that I can track cost savings and verify the feature is working correctly.

#### Acceptance Criteria

1. WHEN a duplicate is detected and skipped, THE Bulk_Verification_System SHALL log an audit entry with the identity value, skip reason, and original verification details
2. WHEN bulk verification completes, THE Bulk_Verification_System SHALL log a summary including total entries processed, duplicates skipped, and estimated API_Credits saved
3. WHEN viewing audit logs, THE Bulk_Verification_System SHALL display duplicate prevention statistics aggregated by time period
4. THE Bulk_Verification_System SHALL include duplicate skip counts in existing verification audit logs

### Requirement 7: Error Handling for Duplicate Checks

**User Story:** As a system administrator, I want the system to handle duplicate check failures gracefully, so that verification can proceed even if duplicate detection encounters errors.

#### Acceptance Criteria

1. IF a Duplicate_Check fails due to database error, THEN THE Bulk_Verification_System SHALL log the error and proceed with verification to avoid blocking legitimate requests
2. IF a Duplicate_Check times out, THEN THE Bulk_Verification_System SHALL log a timeout warning and proceed with verification
3. WHEN a Duplicate_Check error occurs, THE Bulk_Verification_System SHALL include error details in the audit log
4. THE Bulk_Verification_System SHALL track duplicate check failure rates and alert administrators if failures exceed 5% of attempts

### Requirement 8: Identity Format Validation

**User Story:** As a broker, I want the system to validate identity formats before verification, so that invalid entries are caught early and included in the confirmation modal counts.

#### Acceptance Criteria

1. WHEN validating a NIN, THE Bulk_Verification_System SHALL verify it contains exactly 11 digits
2. WHEN validating a BVN, THE Bulk_Verification_System SHALL verify it contains exactly 11 digits
3. WHEN validating a CAC, THE Bulk_Verification_System SHALL verify it matches the expected variable format pattern
4. WHEN an identity fails format validation, THE Bulk_Verification_System SHALL mark it as "invalid_format" and skip verification
5. THE Bulk_Verification_System SHALL perform format validation before duplicate checks to optimize performance

### Requirement 9: Confirmation Modal Cost Calculation

**User Story:** As a broker, I want accurate cost estimates in the confirmation modal, so that I can make informed decisions about proceeding with bulk verification.

#### Acceptance Criteria

1. WHEN calculating estimated cost, THE Bulk_Verification_System SHALL use current API_Provider pricing for each identity type (NIN, BVN, CAC)
2. WHEN displaying estimated cost, THE Bulk_Verification_System SHALL show the breakdown by identity type
3. WHEN API_Provider pricing changes, THE Bulk_Verification_System SHALL update cost calculations to reflect new rates
4. THE Bulk_Verification_System SHALL display cost estimates in the configured currency with appropriate formatting

### Requirement 10: Duplicate Metadata Storage

**User Story:** As a system administrator, I want detailed metadata stored for duplicate detections, so that I can audit and troubleshoot duplicate prevention behavior.

#### Acceptance Criteria

1. WHEN a duplicate is detected, THE Bulk_Verification_System SHALL store the original verification timestamp
2. WHEN a duplicate is detected, THE Bulk_Verification_System SHALL store the Identity_List name where the identity was first verified
3. WHEN a duplicate is detected, THE Bulk_Verification_System SHALL store the broker who performed the original verification
4. WHEN a duplicate is detected, THE Bulk_Verification_System SHALL store the verification result from the original verification
5. THE Bulk_Verification_System SHALL make duplicate metadata accessible through the UI for review
