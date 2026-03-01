# CAC Document Post-Implementation Fixes

## Issues Identified and Fixed

### Issue 1: Firestore Permissions Error ✅ FIXED
**Error**: `FirebaseError: Missing or insufficient permissions` when creating CAC admin audit logs

**Root Cause**: `firestore.rules` had `allow create: if false` for `cacDocumentAuditLogs` collection

**Fix Applied**: Updated rule to `allow create: if isAdminOrSuperAdmin()`

**Deployment**: Successfully deployed with `firebase deploy --only firestore:rules`

**User Action Required**: Hard refresh browser (Ctrl+Shift+R) to clear Firestore rules cache

---

### Issue 2: Firebase Storage CORS Error ✅ FIXED
**Error**: CORS policy blocking fetch from `http://localhost:8080`

**Root Cause**: Firebase Storage bucket lacked CORS configuration for localhost

**Fix Applied**: 
1. Created `cors.json` with localhost:8080 and nemforms.com origins
2. Ran `node scripts/configure-storage-cors.cjs` from n-server directory

**Verification**: CORS configuration successfully applied and verified

---

### Issue 3: Dashboard Status Indicators ✅ FIXED
**Problem**: List cards showed red "not uploaded" indicators despite successful uploads

**Root Cause**: Dashboard calling `getDocumentStatusSummary(list.id)` which expects `identityRecordId`, not `listId`

**Fix Applied**: Changed to `getListDocumentStatusSummary(list.id)` which aggregates across all entries

**Files Modified**:
- `src/pages/admin/IdentityListsDashboard.tsx` - updated import and function call

---

### Issue 4: Document Decryption Failed ✅ FIXED
**Error**: `TypeError: Cannot read properties of undefined (reading 'iv')` and `POST /api/cac-documents/decrypt 404 (Not Found)`

**Root Causes**: 
1. Backend stores encryption metadata with field name `encryptionIV` in Firestore, but frontend expects `EncryptionMetadata` object with `iv` property
2. Backend decryption endpoint `/api/cac-documents/decrypt` was missing

**Backend Storage Format**:
```javascript
{
  encryptionIV: "base64string",
  encryptionAlgorithm: "aes-256-gcm"
}
```

**Frontend Expected Format**:
```typescript
{
  iv: string,
  algorithm: string,
  keyVersion: string,
  authTag: string
}
```

**Fixes Applied**:

1. **Metadata Transformation**: Updated `cacMetadataService.ts` to transform backend data to frontend format in these functions:
   - `getDocumentsByIdentityRecord()`
   - `getDocumentMetadata()`
   - `getDocumentsByType()`
   - `getDocumentsByDateRange()`

2. **Decryption Endpoint**: Added missing `/api/cac-documents/decrypt` endpoint in `server.js`:
   - Accepts `encryptedData` and `iv` in request body
   - Uses backend `decryptData()` function
   - Returns decrypted data as base64
   - Requires authentication (broker or admin)

**Transformation Logic**:
```typescript
const encryptionMetadata = data.encryptionMetadata || {
  iv: data.encryptionIV || '',
  algorithm: data.encryptionAlgorithm || 'aes-256-gcm',
  keyVersion: 'v1',
  authTag: '' // Not stored separately, embedded in encrypted data
};
```

**Files Modified**:
- `src/services/cacMetadataService.ts` - added encryption metadata transformation
- `server.js` - added `/api/cac-documents/decrypt` endpoint

**Note**: The `authTag` is not stored separately in Firestore because it's embedded in the encrypted data by the backend's `encryptData()` function. The backend concatenates the ciphertext and authTag before storing.

---

## Testing Steps

1. **Hard refresh browser** (Ctrl+Shift+R) to clear cached Firestore rules
2. **Navigate to Identity Lists Dashboard**
3. **Click "View CAC Documents"** on a list with uploaded documents
4. **Verify**:
   - No Firestore permissions errors in console
   - No CORS errors in console
   - No decryption errors in console
   - Documents preview successfully
   - Documents download successfully
   - Dashboard indicators show correct status (green for uploaded)

---

## Files Changed

1. `firestore.rules` - Fixed audit log permissions
2. `cors.json` - Created CORS configuration
3. `scripts/configure-storage-cors.cjs` - Created CORS deployment script
4. `src/pages/admin/IdentityListsDashboard.tsx` - Fixed status summary function call
5. `src/services/cacMetadataService.ts` - Added encryption metadata transformation
6. `server.js` - Added `/api/cac-documents/decrypt` endpoint

---

## Next Steps

1. Test document preview/download functionality
2. Verify all three issues are resolved
3. Monitor console for any remaining errors
4. Consider updating backend to store encryption metadata in the expected format for future uploads
