# Data Model Documentation: Duplicate Tracking Fields

## Overview

This document describes the new fields added to the `identity-entries` collection to support duplicate detection and tracking in the bulk verification system.

## Collection: identity-entries

### New Fields for Duplicate Tracking

The following optional fields have been added to track duplicate identities and skip reasons:

#### isDuplicateOf
- **Type**: `string` (optional)
- **Description**: Entry ID of the original verification if this entry is a duplicate
- **Usage**: When a duplicate is detected, this field stores the document ID of the first verified entry with the same identity value
- **Example**: `"abc123xyz456"`
- **Requirements**: 1.3, 1.4

#### duplicateDetectedAt
- **Type**: `Date` (Firestore Timestamp, optional)
- **Description**: Timestamp when the duplicate was detected
- **Usage**: Records when the system identified this entry as a duplicate during bulk verification or link sending
- **Example**: `2024-02-20T10:30:00Z`
- **Requirements**: 1.3, 1.4

#### duplicateSkippedBy
- **Type**: `string` (optional)
- **Description**: User ID (UID) of the admin who triggered the operation that skipped this duplicate
- **Usage**: Tracks which admin initiated the bulk verification or link sending operation that resulted in skipping this entry
- **Example**: `"user_abc123"`
- **Requirements**: 1.3, 1.4

#### skipReason
- **Type**: `string` (optional)
- **Description**: Reason code for why this entry was skipped
- **Possible Values**:
  - `"already_verified"` - Identity was already verified in another list
  - `"invalid_format"` - Identity value failed format validation
  - `"no_identity_data"` - Missing required identity data
  - `"duplicate"` - Duplicate of another entry (legacy, use isDuplicateOf instead)
- **Example**: `"already_verified"`
- **Requirements**: 1.3, 1.4

#### skipDetails
- **Type**: `Object` (optional)
- **Description**: Additional context and metadata about why the entry was skipped
- **Structure**:
  ```typescript
  {
    originalListId?: string;           // List ID where original verification occurred
    originalListName?: string;         // Name of the list where original verification occurred
    originalVerificationDate?: Date;   // When the original verification happened
    originalBroker?: string;           // Broker who performed original verification
    originalResult?: any;              // Original verification result data
  }
  ```
- **Usage**: Provides detailed information for audit trails and debugging
- **Example**:
  ```json
  {
    "originalListId": "list_xyz789",
    "originalListName": "January 2024 Verifications",
    "originalVerificationDate": "2024-01-15T14:22:00Z",
    "originalBroker": "broker@example.com",
    "originalResult": {
      "status": "verified",
      "provider": "datapro",
      "matchScore": 100
    }
  }
  ```
- **Requirements**: 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 10.4

## Usage Examples

### Example 1: Duplicate Entry Detected During Bulk Verification

```javascript
{
  id: "entry_123",
  listId: "list_456",
  email: "customer@example.com",
  status: "already_verified",
  
  // Original identity data
  data: {
    "NIN": "12345678901",
    "Name": "John Doe",
    "Email": "customer@example.com"
  },
  
  // Duplicate tracking fields
  isDuplicateOf: "entry_789",
  duplicateDetectedAt: Timestamp(2024-02-20T10:30:00Z),
  duplicateSkippedBy: "admin_user_123",
  skipReason: "already_verified",
  skipDetails: {
    originalListId: "list_100",
    originalListName: "December 2023 Batch",
    originalVerificationDate: Timestamp(2023-12-15T09:15:00Z),
    originalBroker: "broker@nem-insurance.com",
    originalResult: {
      status: "verified",
      provider: "datapro",
      verifiedAt: "2023-12-15T09:15:00Z"
    }
  },
  
  createdAt: Timestamp(2024-02-20T08:00:00Z),
  updatedAt: Timestamp(2024-02-20T10:30:00Z)
}
```

### Example 2: Invalid Format Entry

```javascript
{
  id: "entry_456",
  listId: "list_789",
  email: "invalid@example.com",
  status: "invalid_format",
  
  // Original identity data with invalid NIN
  data: {
    "NIN": "123",  // Too short
    "Name": "Jane Smith",
    "Email": "invalid@example.com"
  },
  
  // Skip tracking (no duplicate fields since not a duplicate)
  skipReason: "invalid_format",
  skipDetails: {
    validationError: "NIN must be exactly 11 digits",
    providedValue: "123",
    expectedFormat: "11 digits"
  },
  
  createdAt: Timestamp(2024-02-20T08:00:00Z),
  updatedAt: Timestamp(2024-02-20T10:30:00Z)
}
```

## Database Indexes

### Existing Composite Index

The following composite index is required for efficient duplicate detection:

```json
{
  "collectionGroup": "identity-entries",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "identityType",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "identityValue",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "status",
      "order": "ASCENDING"
    }
  ]
}
```

This index enables fast queries like:
```javascript
db.collection('identity-entries')
  .where('identityType', '==', 'NIN')
  .where('identityValue', '==', encryptedValue)
  .where('status', '==', 'verified')
  .limit(1)
```

## Migration Notes

### Backward Compatibility

- All new fields are optional, so existing entries remain valid
- Existing entries without these fields will continue to work normally
- No data migration is required for existing entries
- New fields will only be populated for entries processed after this feature is deployed

### Future Considerations

- Consider adding an index on `isDuplicateOf` if querying by original entry becomes common
- Consider adding an index on `skipReason` for analytics and reporting
- Monitor field usage and storage costs as duplicate tracking data accumulates

## Related Documentation

- [Requirements Document](./requirements.md) - Full requirements for duplicate prevention
- [Design Document](./design.md) - Technical design and architecture
- [Tasks Document](./tasks.md) - Implementation tasks and progress
- [API Documentation](../../docs/API_DOCUMENTATION.md) - API endpoints and usage

## Changelog

### 2024-02-20
- Initial documentation created
- Added duplicate tracking fields to IdentityEntry interface
- Documented field structure and usage examples
