# CAC Document Admin Visibility Investigation

## Issue Summary

**Problem**: Customer selects 3 CAC documents (UI shows green checkmarks), but admin UI shows "No CAC documents have been uploaded"

**Critical Question**: "Where is the share_allotment file itself if the admin is saying there are no files uploaded...if only one was uploaded, we should at least see it"

## Investigation Findings

### 1. Code Analysis

#### Server-Side Upload (server.js lines 11063-11251)

The server correctly:
- Validates document type and file
- Encrypts and stores file in Firebase Storage at path: `cac-documents/{entryId}/{documentType}/{documentId}_{filename}`
- Writes metadata to Firestore collection: `cac-document-metadata`
- Updates entry document with document reference in `cacDocuments.{documentType}` field

**Metadata fields written:**
```javascript
{
  id: documentId,
  identityRecordId: entryDoc.id,  // ✅ Correct field name
  listId: entry.listId,
  documentType: documentType,
  storagePath: storagePath,
  filename: file.originalname,
  mimeType: file.mimetype,
  fileSize: file.size,
  encryptionAlgorithm: 'aes-256-gcm',
  encryptionIV: iv,
  uploadedBy: 'customer',
  uploaderId: 'customer',
  uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
  status: 'uploaded',
  version: 1,
  isCurrent: true  // ✅ Required for admin query
}
```

#### Client-Side Query (cacMetadataService.ts)

The admin UI queries using:
```typescript
const q = query(
  collection(db, 'cac-document-metadata'),
  where('identityRecordId', '==', identityRecordId),  // ✅ Matches server field
  where('isCurrent', '==', true),                      // ✅ Matches server field
  orderBy('uploadedAt', 'desc')                        // ✅ Matches server field
);
```

#### Firestore Index

The required composite index EXISTS in `firestore.indexes.json`:
```json
{
  "collectionGroup": "cac-document-metadata",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "identityRecordId", "order": "ASCENDING" },
    { "fieldPath": "isCurrent", "order": "ASCENDING" },
    { "fieldPath": "uploadedAt", "order": "DESCENDING" }
  ]
}
```

### 2. Potential Root Causes

Based on the code analysis, the query logic is **CORRECT**. The issue must be one of the following:

#### A. Metadata Not Being Written
- Server upload succeeds but metadata write fails silently
- Firestore security rules block the write
- Network error during metadata write
- Transaction/batch write issue

#### B. Field Value Mismatch
- `isCurrent` is not set to `true` (typo, wrong value type)
- `uploadedAt` is not a valid Firestore Timestamp
- `identityRecordId` doesn't match the entry ID used in query

#### C. Index Not Deployed
- Index exists in config but not deployed to Firestore
- Index deployment failed or is pending
- Using wrong Firebase project

#### D. Timing Issue
- Query executes before metadata write completes
- `serverTimestamp()` not resolved yet
- Cache invalidation issue

### 3. Logging Added

To diagnose the issue, comprehensive logging has been added:

#### Server-Side (server.js)
```javascript
console.log('[CAC Upload] Writing metadata to Firestore:', {
  documentId,
  identityRecordId: entryDoc.id,
  documentType,
  collection: 'cac-document-metadata',
  isCurrent: true,
  timestamp: new Date().toISOString()
});

// ... write operation ...

console.log('[CAC Upload] Metadata written successfully:', {
  documentId,
  identityRecordId: entryDoc.id,
  documentType,
  timestamp: new Date().toISOString()
});
```

#### Client-Side Query (cacMetadataService.ts)
```typescript
console.log('[CAC Admin] Querying documents:', {
  identityRecordId,
  collection: COLLECTIONS.METADATA,
  timestamp: new Date().toISOString()
});

// ... query operation ...

console.log('[CAC Admin] Documents queried:', {
  identityRecordId,
  resultsCount: querySnap.docs.length,
  timestamp: new Date().toISOString()
});

// For each document found:
console.log('[CAC Admin] Document found:', {
  documentId: doc.id,
  documentType: data.documentType,
  uploadedAt: data.uploadedAt,
  isCurrent: data.isCurrent,
  identityRecordId: data.identityRecordId
});

// If no documents:
console.warn('[CAC Admin] No documents found for identity record:', identityRecordId);
```

#### Admin UI (IdentityListDetail.tsx)
```typescript
console.log('[CAC Admin UI] Fetching documents for entry:', entryId);

// ... fetch operation ...

console.log('[CAC Admin UI] Documents fetched:', {
  entryId,
  documentCount: documents.length,
  documentTypes: documents.map(d => d.documentType)
});

if (documents.length === 0) {
  console.warn('[CAC Admin UI] No documents found for entry:', entryId);
  setError(`No CAC documents found for this entry. Entry ID: ${entryId}`);
}
```

### 4. Diagnostic Script

Created `scripts/diagnose-cac-documents.cjs` to investigate specific entries:

**Usage:**
```bash
node scripts/diagnose-cac-documents.cjs <entryId>
```

**What it checks:**
1. Entry exists in `identity-entries` collection
2. Metadata exists in `cac-document-metadata` collection
3. Admin UI query returns results (with same filters)
4. Files exist in Firebase Storage
5. Field values are correct (isCurrent, uploadedAt, identityRecordId)

**Output:**
- Detailed information about each check
- Summary of issues found
- Recommended actions to fix

### 5. Next Steps

To resolve the issue, follow these steps:

#### Step 1: Reproduce the Bug
1. Have a customer upload 3 CAC documents
2. Note the entry ID from the verification link
3. Check browser console for upload logs
4. Check server logs for metadata write logs

#### Step 2: Run Diagnostic Script
```bash
node scripts/diagnose-cac-documents.cjs <entryId>
```

This will reveal which component is failing:
- If metadata is missing → Server write issue
- If metadata exists but query fails → Index or field issue
- If storage files are missing → Upload issue

#### Step 3: Check Firestore Console
1. Go to Firebase Console → Firestore Database
2. Navigate to `cac-document-metadata` collection
3. Search for documents with `identityRecordId == <entryId>`
4. Verify fields:
   - `isCurrent` is boolean `true`
   - `uploadedAt` is a Timestamp
   - `identityRecordId` matches entry ID

#### Step 4: Verify Index Deployment
```bash
firebase deploy --only firestore:indexes
```

Check Firebase Console → Firestore Database → Indexes to confirm the index is active.

#### Step 5: Check Security Rules
Verify `firestore.rules` allows:
- Server to write to `cac-document-metadata`
- Admin users to read from `cac-document-metadata`

#### Step 6: Test with Logging
1. Upload documents with logging enabled
2. Check browser console for query logs
3. Check server logs for write logs
4. Compare `identityRecordId` values

### 6. Expected Log Output

#### Successful Upload and Query:
```
[CAC Upload] Writing metadata to Firestore: { documentId: "...", identityRecordId: "abc123", ... }
[CAC Upload] Metadata written successfully: { documentId: "...", identityRecordId: "abc123", ... }
[CAC Admin] Querying documents: { identityRecordId: "abc123", ... }
[CAC Admin] Documents queried: { identityRecordId: "abc123", resultsCount: 3, ... }
[CAC Admin] Document found: { documentId: "...", documentType: "certificate_of_incorporation", ... }
[CAC Admin] Document found: { documentId: "...", documentType: "particulars_of_directors", ... }
[CAC Admin] Document found: { documentId: "...", documentType: "share_allotment", ... }
```

#### Failed Query (No Documents):
```
[CAC Upload] Writing metadata to Firestore: { documentId: "...", identityRecordId: "abc123", ... }
[CAC Upload] Metadata written successfully: { documentId: "...", identityRecordId: "abc123", ... }
[CAC Admin] Querying documents: { identityRecordId: "abc123", ... }
[CAC Admin] Documents queried: { identityRecordId: "abc123", resultsCount: 0, ... }
[CAC Admin] No documents found for identity record: abc123
```

This indicates metadata was written but query failed to find it.

### 7. Possible Fixes

Based on diagnostic results:

#### If metadata is missing:
- Add error handling to metadata write
- Use Firestore batch writes for atomicity
- Add retry logic for failed writes

#### If query fails with existing metadata:
- Verify index is deployed and active
- Check field types match (boolean vs string)
- Ensure `serverTimestamp()` is resolved before query

#### If identityRecordId mismatch:
- Log both write and query IDs
- Verify entry ID is passed correctly
- Check for ID transformation/encoding issues

## Conclusion

The code logic is correct - server writes to the right collection with the right fields, and the client queries with matching filters. The issue is likely:

1. **Metadata write failure** - Most likely cause given "no documents" message
2. **Index not deployed** - Would cause query to fail
3. **Field value mismatch** - Wrong type or value for isCurrent/uploadedAt

The added logging and diagnostic script will reveal the exact cause when tested with a real upload scenario.
