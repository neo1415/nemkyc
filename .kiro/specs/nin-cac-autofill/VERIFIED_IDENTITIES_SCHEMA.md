# Verified Identities Collection Schema

## Overview

The `verified-identities` collection stores cached verification results from the NIN/CAC auto-fill feature. This database-backed cache prevents duplicate API calls and saves money by reusing previously verified identity data.

## Collection Name

`verified-identities`

## Document Structure

```typescript
interface VerifiedIdentity {
  // Identity Information (encrypted)
  identityType: 'NIN' | 'CAC';
  encryptedIdentityNumber: string; // Encrypted using encryptData()
  
  // Verification Data (from API response)
  verificationData: {
    // For NIN (Datapro response)
    firstname?: string;
    surname?: string;
    middlename?: string;
    birthdate?: string;
    gender?: string;
    phone?: string;
    email?: string;
    // ... other NIN fields
    
    // For CAC (VerifyData response)
    company_name?: string;
    rc_number?: string;
    company_type?: string;
    date_of_registration?: string;
    address?: string;
    status?: string;
    email?: string;
    // ... other CAC fields
  };
  
  // Metadata
  source: 'auto-fill'; // Always 'auto-fill' for this feature
  provider: 'datapro' | 'verifydata'; // API provider used
  userId: string; // User who triggered the verification
  formId: string | null; // Optional form identifier
  cost: number; // Cost in Naira (₦50 for NIN, ₦100 for CAC)
  createdAt: Timestamp; // Server timestamp
}
```

## Indexes

The following composite indexes are defined in `firestore.indexes.json`:

### 1. Cache Lookup Index (Primary)
```json
{
  "collectionGroup": "verified-identities",
  "fields": [
    { "fieldPath": "identityType", "order": "ASCENDING" },
    { "fieldPath": "encryptedIdentityNumber", "order": "ASCENDING" },
    { "fieldPath": "source", "order": "ASCENDING" }
  ]
}
```
**Purpose**: Efficient cache lookup when checking if an identity has been verified before.

**Query Example**:
```javascript
db.collection('verified-identities')
  .where('identityType', '==', 'NIN')
  .where('encryptedIdentityNumber', '==', encryptedNIN)
  .where('source', '==', 'auto-fill')
  .limit(1)
  .get()
```

### 2. User History Index
```json
{
  "collectionGroup": "verified-identities",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Purpose**: Query verification history for a specific user.

### 3. Source Analytics Index
```json
{
  "collectionGroup": "verified-identities",
  "fields": [
    { "fieldPath": "source", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Purpose**: Analytics on auto-fill usage over time.

### 4. Provider Analytics Index
```json
{
  "collectionGroup": "verified-identities",
  "fields": [
    { "fieldPath": "provider", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```
**Purpose**: Analytics on API provider usage and costs.

## Security Rules

Add the following rules to `firestore.rules`:

```javascript
// Verified identities collection (auto-fill cache)
match /verified-identities/{docId} {
  // Only authenticated users can read their own cached verifications
  allow read: if request.auth != null && 
                 resource.data.userId == request.auth.uid;
  
  // Only server can write (via Admin SDK)
  allow write: if false;
}
```

## Usage Example

### Backend (server.js)

```javascript
// Check cache before API call
const encryptedNIN = encryptData(nin);
const cacheQuery = await db.collection('verified-identities')
  .where('identityType', '==', 'NIN')
  .where('encryptedIdentityNumber', '==', encryptedNIN)
  .where('source', '==', 'auto-fill')
  .limit(1)
  .get();

if (!cacheQuery.empty) {
  // Cache HIT - return cached data
  const cachedData = cacheQuery.docs[0].data();
  return res.json({
    status: true,
    message: 'NIN verified successfully (cached)',
    data: cachedData.verificationData,
    cached: true
  });
}

// Cache MISS - call API and store result
const dataproResult = await dataproVerifyNIN(nin);
if (dataproResult.success) {
  await db.collection('verified-identities').add({
    identityType: 'NIN',
    encryptedIdentityNumber: encryptedNIN,
    verificationData: dataproResult.data,
    source: 'auto-fill',
    provider: 'datapro',
    userId: userId || 'anonymous',
    formId: formId || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    cost: 50
  });
}
```

## Cost Savings

### Without Caching
- User enters NIN → API call (₦50)
- User submits form → API call (₦50)
- User comes back later → API call (₦50)
- **Total: ₦150**

### With Database Caching
- User enters NIN → API call (₦50) → cached in database
- User submits form → cache hit (₦0)
- User comes back later → cache hit (₦0)
- **Total: ₦50 (67% savings)**

## Data Retention

- Cached data is stored permanently (no expiration)
- This is intentional to maximize cost savings
- Identity numbers are encrypted for security
- Consider implementing a cleanup policy if storage becomes an issue (e.g., delete entries older than 1 year)

## Privacy & Security

1. **Encryption**: Identity numbers are encrypted using the existing `encryptData()` function before storage
2. **Access Control**: Only the user who triggered the verification can read their cached data (via Firestore rules)
3. **Server-Only Writes**: Only the backend (Admin SDK) can write to this collection
4. **Audit Trail**: All cache hits/misses are logged in `verification-audit-logs` with `metadata.source = 'auto-fill'`

## Monitoring Queries

### Total cached verifications
```javascript
db.collection('verified-identities')
  .where('source', '==', 'auto-fill')
  .count()
  .get()
```

### Cost savings calculation
```javascript
const cachedDocs = await db.collection('verified-identities')
  .where('source', '==', 'auto-fill')
  .get();

const totalSavings = cachedDocs.docs.reduce((sum, doc) => {
  return sum + doc.data().cost; // Each cached entry saved one API call
}, 0);

console.log(`Total cost savings: ₦${totalSavings}`);
```

### Cache hit rate (from audit logs)
```javascript
const allAutoFillLogs = await db.collection('verification-audit-logs')
  .where('metadata.source', '==', 'auto-fill')
  .get();

const cacheHits = allAutoFillLogs.docs.filter(doc => 
  doc.data().metadata?.cacheHit === true
).length;

const hitRate = (cacheHits / allAutoFillLogs.size) * 100;
console.log(`Cache hit rate: ${hitRate.toFixed(2)}%`);
```

## Deployment Steps

1. **Update Firestore Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **Update Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Backend Code**:
   ```bash
   firebase deploy --only functions
   ```

4. **Monitor Initial Usage**:
   - Check Firestore console for new documents in `verified-identities`
   - Check `verification-audit-logs` for entries with `metadata.source = 'auto-fill'`
   - Verify cache hits are working (cost = 0 in logs)

## Troubleshooting

### Cache not working (always calling API)
- Check if `encryptData()` is producing consistent results for the same input
- Verify the query is using the correct field names
- Check Firestore indexes are deployed

### Permission denied errors
- Verify Firestore rules are deployed
- Check that `userId` in cached document matches `request.auth.uid`

### Slow queries
- Verify composite indexes are created in Firestore console
- Check index build status (may take a few minutes after deployment)
