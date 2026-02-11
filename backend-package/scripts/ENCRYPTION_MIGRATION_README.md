# Identity Data Encryption Migration

This document explains how to migrate existing plaintext identity data (NIN, BVN, CAC) to encrypted format for NDPR compliance.

## Prerequisites

1. **Backup your database** before running the migration
2. Ensure `ENCRYPTION_KEY` is set in your `.env` file
3. Have Firebase Admin credentials configured
4. Schedule a maintenance window if possible (to avoid conflicts with live traffic)

## Generating an Encryption Key

If you haven't already generated an encryption key, run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the output to your `.env` file:

```
ENCRYPTION_KEY=your_64_character_hex_key_here
```

**IMPORTANT:** Keep this key secure and backed up. If you lose it, you won't be able to decrypt existing data!

## Running the Migration

### Step 1: Dry Run (Recommended)

First, run the migration in dry-run mode to preview what will be changed:

```bash
node scripts/encrypt-existing-identity-data.js --dry-run
```

This will:
- Show you how many entries will be affected
- Display which fields will be encrypted
- NOT make any changes to the database

### Step 2: Backup Database

Before proceeding, create a backup of your Firestore database:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click "Export data"
4. Save the backup location

### Step 3: Run Migration

Once you're satisfied with the dry-run results and have a backup, run the actual migration:

```bash
node scripts/encrypt-existing-identity-data.js
```

The script will:
- Wait 5 seconds before starting (giving you time to cancel with Ctrl+C)
- Process entries in batches of 50 (configurable)
- Encrypt all plaintext NIN, BVN, and CAC values
- Skip entries that are already encrypted
- Display progress and summary

### Step 4: Verify

After migration completes:

1. Check the summary output for any errors
2. Test the verification flow to ensure encrypted data works correctly
3. Export a list and verify that identity numbers are displayed correctly
4. Monitor application logs for any decryption errors

## Advanced Options

### Custom Batch Size

Process entries in smaller or larger batches:

```bash
node scripts/encrypt-existing-identity-data.js --batch-size=25
```

### Combining Options

```bash
node scripts/encrypt-existing-identity-data.js --dry-run --batch-size=100
```

## What Gets Encrypted

The migration script encrypts the following fields in the `identity-entries` collection:

- `nin` - National Identification Number
- `bvn` - Bank Verification Number  
- `cac` - Corporate Affairs Commission number

## Encryption Format

Encrypted values are stored as objects with two properties:

```javascript
{
  encrypted: "base64_encoded_encrypted_data_with_auth_tag",
  iv: "base64_encoded_initialization_vector"
}
```

## Troubleshooting

### Error: ENCRYPTION_KEY not set

Make sure your `.env` file contains the `ENCRYPTION_KEY` variable and that you've run `require('dotenv').config()`.

### Error: Failed to encrypt

Check that your encryption key is exactly 64 hexadecimal characters (32 bytes).

### Script hangs or times out

Try reducing the batch size:

```bash
node scripts/encrypt-existing-identity-data.js --batch-size=10
```

### Need to rollback

If something goes wrong, restore from your database backup:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click "Import data"
4. Select your backup

## Security Notes

1. **Never commit the encryption key to version control**
2. Store the encryption key securely (e.g., in a password manager or secrets management service)
3. Rotate the encryption key periodically (requires re-encrypting all data)
4. Limit access to the encryption key to authorized personnel only
5. Monitor access logs for any unauthorized decryption attempts

## NDPR Compliance

This encryption implementation helps meet NDPR (Nigeria Data Protection Regulation) requirements for:

- **Data Security:** Sensitive PII is encrypted at rest using AES-256-GCM
- **Data Minimization:** Only necessary identity fields are stored
- **Access Control:** Decryption only occurs when authorized users need the data
- **Audit Trail:** All encryption/decryption operations are logged

## Support

If you encounter issues during migration:

1. Check the script output for specific error messages
2. Verify your Firebase credentials and permissions
3. Ensure your encryption key is valid
4. Contact the development team for assistance

## Post-Migration

After successful migration:

1. The application will automatically handle encrypted data
2. New entries will be encrypted on creation
3. Exports will decrypt data for authorized users
4. Verification APIs will decrypt data in memory only
5. No code changes are needed in the application

## Maintenance

- Run this script again if you need to encrypt any entries that were missed
- The script is idempotent - it safely skips already-encrypted entries
- Monitor the `updatedAt` timestamp to track when entries were last modified
