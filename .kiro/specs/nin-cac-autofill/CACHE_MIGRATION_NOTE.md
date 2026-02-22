# Cache Migration Note

## Existing Cached Data

If you have existing documents in the `verified-identities` collection that use the old `encryptedIdentityNumber` field, they will NOT be found by the new cache lookup (which uses `identityHash`).

## Options

### Option 1: Let Cache Rebuild Naturally (RECOMMENDED)
- Existing cached entries will remain in database but won't be used
- New verifications will create new cached entries with `identityHash`
- Over time, the cache will rebuild with the new format
- Old entries can be cleaned up later if needed

**Pros**: No migration script needed, zero downtime
**Cons**: Some duplicate API calls during transition period

### Option 2: Migration Script (If Needed)
If you have many cached entries and want to avoid duplicate API calls, you can run a migration script:

```javascript
// migration-script.js
const admin = require('firebase-admin');
const { hashForCacheLookup } = require('./server-utils/encryption.cjs');

admin.initializeApp();
const db = admin.firestore();

async function migrateCachedIdentities() {
  const snapshot = await db.collection('verified-identities')
    .where('source', '==', 'auto-fill')
    .get();
  
  console.log(`Found ${snapshot.size} cached identities to migrate`);
  
  let migrated = 0;
  let skipped = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already has identityHash
    if (data.identityHash) {
      skipped++;
      continue;
    }
    
    // Skip if we can't decrypt the identity number
    if (!data.encryptedIdentityNumber || !data.encryptedIV) {
      console.log(`Skipping doc ${doc.id} - missing encryption data`);
      skipped++;
      continue;
    }
    
    try {
      // Decrypt the identity number
      const { decryptData } = require('./server-utils/encryption.cjs');
      const identityNumber = decryptData(data.encryptedIdentityNumber, data.encryptedIV);
      
      // Generate hash
      const identityHash = hashForCacheLookup(identityNumber);
      
      // Update document
      await doc.ref.update({
        identityHash: identityHash,
        // Keep old fields for backward compatibility
        encryptedIdentityNumber: data.encryptedIdentityNumber,
        encryptedIV: data.encryptedIV
      });
      
      migrated++;
      console.log(`Migrated ${migrated}/${snapshot.size}`);
    } catch (error) {
      console.error(`Failed to migrate doc ${doc.id}:`, error.message);
      skipped++;
    }
  }
  
  console.log(`\nMigration complete:`);
  console.log(`- Migrated: ${migrated}`);
  console.log(`- Skipped: ${skipped}`);
  console.log(`- Total: ${snapshot.size}`);
}

migrateCachedIdentities()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
```

**To run**:
```bash
node migration-script.js
```

## Recommendation

**Use Option 1** (let cache rebuild naturally) unless you have:
- Hundreds of cached entries
- High verification volume
- Tight budget constraints

The cache will rebuild quickly with normal usage, and the cost of a few duplicate API calls is minimal compared to the complexity of running a migration script.

## Cleanup (Optional)

After a few weeks, you can clean up old cached entries that don't have `identityHash`:

```javascript
// cleanup-old-cache.js
const snapshot = await db.collection('verified-identities')
  .where('source', '==', 'auto-fill')
  .get();

let deleted = 0;
for (const doc of snapshot.docs) {
  const data = doc.data();
  
  // Delete if no identityHash (old format)
  if (!data.identityHash) {
    await doc.ref.delete();
    deleted++;
  }
}

console.log(`Deleted ${deleted} old cached entries`);
```
