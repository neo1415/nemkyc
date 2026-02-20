# Requirements Document: Bulk Verification Field Detection Fix

## Introduction

The bulk verification feature was experiencing issues where entries were being skipped instead of verified. Investigation revealed two root causes:

1. **Type Mismatch**: Identity numbers stored as JavaScript `number` type instead of `string` type caused `.substring()` errors
2. **Data Quality**: Identity numbers with incorrect digit counts (e.g., 10 digits instead of required 11 digits for NIN) were correctly being skipped but with insufficient diagnostic information

This feature will add robust type handling to convert numbers to strings, enhance diagnostic logging to clearly show data type and validation issues, and improve skip reason clarity to help admins identify data quality problems in their CSV uploads.

## Glossary

- **Bulk_Verification_System**: The server-side system that processes multiple identity verification entries in batches
- **Identity_Entry**: A Firestore document containing customer identity data (NIN, BVN, or CAC) to be verified
- **Datapro_API**: External API service used to verify NIN and BVN identity numbers
- **Verifydata_API**: External API service used to verify CAC (Corporate Affairs Commission) numbers
- **Field_Name_Variation**: Different naming conventions for the same data field (e.g., 'nin', 'NIN', 'nin_number', 'NIN Number')
- **Skip_Reason**: A descriptive explanation of why an entry was not verified
- **Diagnostic_Logging**: Detailed console output that helps developers troubleshoot field detection issues

## Requirements

### Requirement 1: Robust Type Handling for Identity Numbers

**User Story:** As a developer, when identity numbers are stored as numbers in Firestore, I want them to be automatically converted to strings, so that bulk verification doesn't crash with type errors.

#### Acceptance Criteria

1. WHEN an Identity_Entry contains a NIN stored as a JavaScript number, THE Bulk_Verification_System SHALL convert it to a string before processing
2. WHEN an Identity_Entry contains a BVN stored as a JavaScript number, THE Bulk_Verification_System SHALL convert it to a string before processing
3. WHEN an Identity_Entry contains a CAC stored as a JavaScript number, THE Bulk_Verification_System SHALL convert it to a string before processing
4. WHEN an Identity_Entry has identity data as an object with a `value` property, THE Bulk_Verification_System SHALL extract the value and convert to string
5. WHEN type conversion fails, THE Bulk_Verification_System SHALL log the error and skip the entry with reason 'type_conversion_failed'

### Requirement 2: Enhanced Diagnostic Logging

**User Story:** As a developer troubleshooting bulk verification issues, I want detailed logging showing data types, values, and validation results, so that I can quickly identify data quality issues.

#### Acceptance Criteria

1. WHEN the Bulk_Verification_System begins processing an Identity_Entry, THE Bulk_Verification_System SHALL log the entry ID, email address, status, and all available field names
2. WHEN the Bulk_Verification_System finds an identity field, THE Bulk_Verification_System SHALL log the raw data type (number, string, object, etc.) and the raw value
3. WHEN the Bulk_Verification_System converts a data type, THE Bulk_Verification_System SHALL log the conversion process and result
4. WHEN the Bulk_Verification_System validates an identity number format, THE Bulk_Verification_System SHALL log the validation result with expected vs actual format
5. WHEN the Bulk_Verification_System skips an Identity_Entry, THE Bulk_Verification_System SHALL log the specific reason with diagnostic details

### Requirement 3: Clear Skip Reasons with Data Quality Feedback

**User Story:** As a super admin reviewing bulk verification results, I want specific skip reasons that explain data quality issues, so that I can correct the CSV data and re-upload.

#### Acceptance Criteria

1. WHEN an Identity_Entry is skipped due to invalid NIN format, THE Bulk_Verification_System SHALL return a skip reason specifying 'invalid_nin_format' with the actual value and expected format (11 digits)
2. WHEN an Identity_Entry is skipped due to invalid BVN format, THE Bulk_Verification_System SHALL return a skip reason specifying 'invalid_bvn_format' with the actual value and expected format (11 digits)
3. WHEN an Identity_Entry is skipped due to missing identity data, THE Bulk_Verification_System SHALL return a skip reason specifying 'no_identity_data' with the fields that were checked
4. WHEN an Identity_Entry is skipped due to type conversion failure, THE Bulk_Verification_System SHALL return a skip reason specifying 'type_conversion_failed' with the problematic field
5. THE Bulk_Verification_System SHALL store detailed skip reasons in the job results for admin review in the UI

### Requirement 4: Verification API Integration

**User Story:** As a super admin, when entries have valid identity numbers, I want them to be verified through the appropriate API, so that verification results are accurate and complete.

#### Acceptance Criteria

1. WHEN an Identity_Entry has a valid NIN (11 digits), THE Bulk_Verification_System SHALL call the Datapro_API to verify the NIN
2. WHEN an Identity_Entry has a valid BVN (11 digits), THE Bulk_Verification_System SHALL call the Datapro_API to verify the BVN
3. WHEN an Identity_Entry has a valid CAC number, THE Bulk_Verification_System SHALL call the Verifydata_API to verify the CAC
4. WHEN the Datapro_API call fails, THE Bulk_Verification_System SHALL log the specific error message and mark the entry as 'failed'
5. WHEN the Datapro_API call succeeds, THE Bulk_Verification_System SHALL update the entry status to 'verified' and store the verification data

### Requirement 5: Field Format Validation

**User Story:** As a developer, I want identity numbers to be validated for correct format before API calls, so that invalid entries are skipped early without wasting API credits.

#### Acceptance Criteria

1. WHEN validating a NIN, THE Bulk_Verification_System SHALL verify it contains exactly 11 digits
2. WHEN validating a BVN, THE Bulk_Verification_System SHALL verify it contains exactly 11 digits
3. WHEN validating a CAC number, THE Bulk_Verification_System SHALL verify it matches the expected CAC format pattern
4. WHEN an identity number fails format validation, THE Bulk_Verification_System SHALL skip the entry with a specific format error reason
5. WHEN an identity number passes format validation, THE Bulk_Verification_System SHALL proceed to API verification

### Requirement 6: Testing and Validation

**User Story:** As a QA engineer, I want comprehensive tests for field detection logic, so that I can verify the fix works across all field name variations.

#### Acceptance Criteria

1. THE Bulk_Verification_System SHALL be tested with Identity_Entry objects containing identity data in different field name formats
2. THE Bulk_Verification_System SHALL be tested with encrypted identity data to verify decryption and field detection work together
3. THE Bulk_Verification_System SHALL be tested with entries missing identity data to verify skip reasons are clear and accurate
4. THE Bulk_Verification_System SHALL be tested with invalid format identity numbers to verify they are skipped with appropriate reasons
5. THE Bulk_Verification_System SHALL be tested to verify that Datapro_API is called for valid entries and not called for invalid entries
