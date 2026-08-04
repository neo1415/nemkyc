# NDPR-Compliant Data Encryption Implementation

## Overview

This document describes the implementation of AES-256-GCM encryption for sensitive identity data (NIN, BVN, CAC) to comply with Nigeria Data Protection Regulation (NDPR) requirements.

## Implementation Summary

### 1. Encryption Utilities Created

#### Frontend (`src/utils/encryption.ts`)
- Placeholder functions that throw errors (encryption must happen on backend)
- Type definitions for encrypted data structure
- `isEncrypted()` helper function for validation
- Ensures frontend never has access to encryption keys

#### Backend (`server-utils/encryption.js`)
- **Algorithm:** AES-256-GCM (Galois/Counter Mode)
- **Key Length:** 32 bytes (256 bits)
- **IV Length:** 16 bytes (unique per encryption)
- **Authentication:** GCM provides built-in authentication tag

**Key Functions:**
- `encryptData(plaintext)` - Encrypts a string and returns `{ encrypted, iv }`
- `decryptData(encrypted, iv)` - Decrypts and verifies authenticity
- `encryptIdentityFields(data, fields)` - Encrypts specific fields in an object
- `decryptIdentityFields(data, fields)` - Decrypts specific fields in an object
- `isEncrypted(value)` - Checks if a value is already encrypted
- `clearSensitiveData(data)` - Clears sensitive data from memory
- `generateEncryptionKey()` - Generates a new 32-byte encryption key

### 2. Backend Integration

#### Data Upload (`POST /api/identity/lists`)
- Automatically detects NIN, BVN, CAC fields in uploaded data
- Encrypts values before storing in Firestore
- Handles various column name formats (case-insensitive)
- Logs encryption operations for audit trail

#### Customer Verification (`POST /api/identity/verify/:token`)
- Encrypts NIN/CAC after successful verification
- Stores encrypted data with IV in Firestore
- Clears plaintext from memory after encryption
- Never logs plaintext identity numbers

#### Bulk Verification (`POST /api/identity/lists/:listId/bulk-verify`)
- Decrypts pre-filled identity numbers before API calls
- Performs verification in memory only
- Re-encrypts verified data before storage
- Clears decrypted values from memory after use

#### Data Export (`GET /api/identity/lists/:listId/export`)
- Decrypts identity numbers for authorized users only
- Exports plaintext for legitimate business use
- Clears decrypted values from memory after export
- Shows `[ENCRYPTED]` if decryption fails

### 3. Encrypted Data Structure

Encrypted values are stored as objects:

```javascript
{
  encrypted: "base64_encoded_encrypted_data_with_auth_tag",
  iv: "base64_encoded_initialization_vector"
}
```

**Example in Firestore:**
```javascript
{
  id: "entry123",
  email: "customer@example.com",
  nin: {
    encrypted: "xK8j2mP9...",  // Base64 encrypted data + auth tag
    iv: "aB3dE5fG..."           // Base64 IV
  },
  status: "verified"
}
```

### 4. Migration Script

**Location:** `scripts/encrypt-existing-identity-data.js`

**Features:**
- Dry-run mode for testing
- Batch processing (configurable size)
- Idempotent (safely skips already-encrypted data)
- Progress tracking and detailed summary
- Error handling and logging

**Usage:**
```bash
# Preview changes
node scripts/encrypt-existing-identity-data.js --dry-run

# Run migration
node scripts/encrypt-existing-identity-data.js

# Custom batch size
node scripts/encrypt-existing-identity-data.js --batch-size=25
```

### 5. Firestore Security Rules

Updated `firestore.rules` to:
- Prevent client-side modification of encrypted fields (nin, bvn, cac)
- Allow backend service account to write encrypted data
- Maintain role-based access control
- Add security comments for clarity

**Key Rule:**
```javascript
allow update: if (isAdminOrSuperAdmin() || isBroker()) &&
  // Prevent client-side modification of encrypted identity fields
  (!request.resource.data.keys().hasAny(['nin', 'bvn', 'cac']) ||
   (request.resource.data.get('nin', null) == resource.data.get('nin', null) &&
    request.resource.data.get('bvn', null) == resource.data.get('bvn', null) &&
    request.resource.data.get('cac', null) == resource.data.get('cac', null)));
```

### 6. Environment Configuration

Added to `.env.example`:

```bash
# Data Encryption (REQUIRED for NDPR compliance)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_character_hex_key_here
```

## Security Features

### 1. Encryption at Rest
- All NIN, BVN, CAC values encrypted before storage
- AES-256-GCM provides confidentiality and authenticity
- Unique IV for each encryption prevents pattern analysis

### 2. Encryption in Transit
- HTTPS ensures encrypted transmission
- Backend-only encryption prevents key exposure
- No plaintext identity numbers in client code

### 3. Access Control
- Only backend service account can write encrypted data
- Firestore rules prevent client tampering
- Role-based access for reading encrypted data
- Decryption only for authorized operations

### 4. Audit Trail
- All encryption operations logged
- Decryption operations logged
- Failed decryption attempts logged
- Activity logs track data access

### 5. Memory Safety
- Plaintext cleared from memory after use
- Decryption only in memory, never persisted
- No plaintext in logs or error messages

## NDPR Compliance

This implementation addresses NDPR requirements:

### Article 2.3 - Data Security
✅ **Implemented:** AES-256-GCM encryption at rest
✅ **Implemented:** Secure key management via environment variables
✅ **Implemented:** Access controls via Firestore rules

### Article 2.4 - Data Minimization
✅ **Implemented:** Only necessary identity fields stored
✅ **Implemented:** Encrypted storage reduces exposure risk
✅ **Implemented:** Decryption only when needed

### Article 2.5 - Accountability
✅ **Implemented:** Comprehensive audit logging
✅ **Implemented:** Activity tracking for all operations
✅ **Implemented:** Clear data ownership (createdBy field)

### Article 2.6 - Data Subject Rights
✅ **Implemented:** Export functionality for data portability
✅ **Implemented:** Delete functionality for right to erasure
✅ **Implemented:** Access controls for right to access

## Deployment Checklist

Before deploying to production:

1. ✅ Generate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. ✅ Add `ENCRYPTION_KEY` to production environment variables
3. ✅ Backup Firestore database
4. ✅ Test encryption/decryption in staging environment
5. ✅ Run migration script in dry-run mode
6. ✅ Run migration script to encrypt existing data
7. ✅ Deploy updated Firestore security rules
8. ✅ Test verification flow with encrypted data
9. ✅ Test export functionality
10. ✅ Monitor logs for decryption errors

## Key Management

### Current Implementation
- Encryption key stored in environment variable
- Single key for all data (symmetric encryption)
- Key must be backed up securely

### Best Practices
1. **Backup:** Store encryption key in secure password manager
2. **Access:** Limit access to encryption key to authorized personnel only
3. **Rotation:** Plan for periodic key rotation (requires re-encryption)
4. **Monitoring:** Monitor for unauthorized access attempts
5. **Disaster Recovery:** Document key recovery procedures

### Future Enhancements
- Key rotation mechanism
- Multiple keys for different data types
- Hardware Security Module (HSM) integration
- Key derivation for per-entry encryption

## Testing

### Unit Tests
Test encryption utilities:
```bash
# Test encryption/decryption round-trip
# Test IV uniqueness
# Test key validation
# Test error handling
```

### Integration Tests
Test full workflow:
```bash
# Upload file with identity data → verify encryption
# Customer verification → verify encrypted storage
# Bulk verification → verify decryption/re-encryption
# Export → verify decryption for authorized users
```

### Security Tests
- Attempt to modify encrypted fields from client → should fail
- Attempt to read encrypted data without authorization → should fail
- Verify plaintext never appears in logs
- Verify decryption only happens in authorized operations

## Monitoring

Monitor these metrics:
- Encryption success/failure rate
- Decryption success/failure rate
- Failed decryption attempts (potential tampering)
- Export operations (data access)
- Migration progress (if running)

## Troubleshooting

### Error: "ENCRYPTION_KEY not set"
**Solution:** Add `ENCRYPTION_KEY` to your `.env` file

### Error: "Failed to decrypt data"
**Possible causes:**
- Encryption key changed (data encrypted with different key)
- Data corrupted in database
- IV missing or corrupted

**Solution:** Check encryption key, verify data integrity, restore from backup if needed

### Error: "Failed to encrypt data"
**Possible causes:**
- Invalid encryption key format
- Insufficient memory
- Invalid input data

**Solution:** Verify encryption key is 64 hex characters, check system resources

## Support

For issues or questions:
1. Check logs for specific error messages
2. Verify encryption key is set correctly
3. Test encryption/decryption with sample data
4. Contact development team for assistance

## References

- [NDPR Guidelines](https://ndpr.nitda.gov.ng/)
- [AES-GCM Specification](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
