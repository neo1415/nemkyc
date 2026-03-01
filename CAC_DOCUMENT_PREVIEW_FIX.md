# CAC Document Preview and Download Fix

## Issues Identified

### 1. Firestore Permission Errors
**Error**: `FirebaseError: Missing or insufficient permissions` when creating CAC audit logs

**Root Cause**: 
- Collection name mismatch: Code uses `cac-document-audit-logs` (hyphenated) but Firestore rules only had `cacDocumentAuditLogs` (camelCase)
- Firestore rules only allowed admins/super admins to create audit logs, but brokers also need to create them when viewing documents

### 2. Missing Encryption Endpoint
**Error**: `404 Not Found` when calling `/api/cac-documents/encrypt`

**Root Cause**: 
- The encrypt endpoint was never implemented on the server
- The client-side code was calling it during document upload

### 3. Insufficient Logging
**Issue**: Hard to debug issues without detailed logging throughout the encryption/decryption flow

## Fixes Applied

### 1. Fixed Firestore Rules (firestore.rules)
- Added support for both `cacDocumentAuditLogs` and `cac-document-audit-logs` collection names
- Changed audit log creation permission from `isAdminOrSuperAdmin()` to `isBrokerOrAdminOrCompliance()`
- This allows brokers to create audit logs when viewing/downloading CAC documents

### 2. Added Missing Encrypt Endpoint (server.js)
- Implemented `POST /api/cac-documents/encrypt` endpoint
- Mirrors the decrypt endpoint structure
- Includes authentication (`requireAuth`) and authorization (`requireBrokerOrAdmin`)
- Returns encrypted data with IV in the expected format

### 3. Enhanced Logging Throughout the Stack

#### Client-Side Encryption Service (src/services/cacEncryptionService.ts)
- Added detailed logging to `callBackendEncryption()`:
  - Request initiation with data length
  - Response status and headers
  - Success/failure with data lengths
  - Error details with stack traces

- Added detailed logging to `callBackendDecryption()`:
  - Request initiation with encrypted data and IV lengths
  - Response status and headers
  - Success/failure with decrypted data length
  - Error details with stack traces

- Added `credentials: 'include'` to both fetch calls for proper authentication

#### Client-Side Storage Service (src/services/cacStorageService.ts)
- Added detailed logging to `getDocumentForPreview()`:
  - Document fetch initiation with storage path and metadata
  - Firebase Storage download URL retrieval
  - Encrypted data fetch from storage
  - Decryption process
  - Success/failure with data sizes
  - Error details with stack traces

#### Client-Side Preview Component (src/components/identity/CACDocumentPreview.tsx)
- Added detailed logging to `loadDocument()`:
  - Document load initiation with full metadata
  - Cache hit/miss detection
  - Fetch and decrypt progress
  - Blob creation and object URL generation
  - Success/failure with document details
  - Error details with stack traces

#### Server-Side Endpoints (server.js)
- Enhanced `POST /api/cac-documents/encrypt`:
  - Request details (user, data length)
  - Validation errors
  - Encryption progress
  - Success with encrypted data and IV lengths
  - Duration tracking
  - Error details with stack traces

- Enhanced `POST /api/cac-documents/decrypt`:
  - Request details (user, encrypted data and IV lengths)
  - Validation errors
  - Decryption progress
  - Success with decrypted data length
  - Duration tracking
  - Error details with stack traces

## Testing Instructions

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Restart the Server
The server needs to be restarted to pick up the new encrypt endpoint.

### 3. Test Document Preview Flow
1. Navigate to Identity List Detail page
2. Click "View CAC Documents" for an entry with uploaded documents
3. Click on a document to preview it
4. Check browser console for detailed logging:
   - `[Preview]` logs from the preview component
   - `[Decryption]` logs from the encryption service
   - `[Server Decrypt]` logs from the server

### 4. Test Document Download Flow
1. Open a document preview
2. Click the "Download" button
3. Check browser console for the same logging flow

### 5. Monitor for Errors
Watch for these specific errors that should now be resolved:
- ❌ `Failed to create CAC audit log: FirebaseError: Missing or insufficient permissions` - FIXED
- ❌ `Failed to load resource: the server responded with a status of 404 (Not Found)` on `/api/cac-documents/decrypt` - FIXED
- ❌ `Backend decryption call failed: Error: Decryption service returned 404` - FIXED

## Expected Console Output

### Successful Preview Flow
```
📄 [Preview] Starting document load
📄 [Preview] Fetching and decrypting document
📄 [Preview] Starting document preview fetch
📄 [Preview] Getting download URL from Firebase Storage
📄 [Preview] Download URL obtained, fetching encrypted data
📄 [Preview] Encrypted data fetched, starting decryption
🔓 [Decryption] Starting backend decryption call
🔓 [Decryption] Backend response received
✅ [Decryption] Backend decryption successful
✅ [Preview] Document decrypted successfully
💾 [Preview] Caching decrypted document
🎨 [Preview] Creating blob and object URL
✅ [Preview] Document loaded successfully
```

### Server-Side Logs
```
🔓 [Server Decrypt] Document decryption request received
🔐 [Server Decrypt] Starting decryption
✅ [Server Decrypt] Document decrypted successfully
```

## Additional Notes

### Audit Logging
- Audit logs are now created successfully for both admins and brokers
- Logs track document views, downloads, and access attempts
- Collection supports both naming conventions for backward compatibility

### Security
- All endpoints require authentication (`requireAuth`)
- Encrypt/decrypt endpoints require broker or admin role (`requireBrokerOrAdmin`)
- Audit logs are append-only (no updates or deletes allowed)

### Performance
- Document caching is implemented to avoid re-decryption
- Decryption duration is tracked for monitoring
- Console logs include timestamps for debugging timing issues

## Files Modified

1. `firestore.rules` - Fixed audit log permissions and collection name support
2. `server.js` - Added encrypt endpoint and enhanced logging
3. `src/services/cacEncryptionService.ts` - Enhanced logging and added credentials
4. `src/services/cacStorageService.ts` - Enhanced logging
5. `src/components/identity/CACDocumentPreview.tsx` - Enhanced logging

## Rollback Instructions

If issues occur, you can rollback by:
1. Reverting Firestore rules: `git checkout HEAD~1 firestore.rules && firebase deploy --only firestore:rules`
2. Reverting server changes: `git checkout HEAD~1 server.js` and restart server
3. Reverting client changes: `git checkout HEAD~1 src/services/ src/components/identity/CACDocumentPreview.tsx`
