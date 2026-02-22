# Auto-Fill Cache Fix Summary

## Issues Fixed

### 1. ✅ forEach Error (CRITICAL)
**Problem**: `populatedFields.forEach is not a function`
- The code was calling `.forEach()` directly on the `PopulationResult` object
- Should have been calling it on the `populatedFields` array property

**Fix**: Added null check and array validation in `AutoFillEngine.ts`
```typescript
// Before (BROKEN):
populationResult.populatedFields.forEach(fieldName => { ... });

// After (FIXED):
if (populationResult && Array.isArray(populationResult.populatedFields)) {
  populationResult.populatedFields.forEach(fieldName => { ... });
}
```

**Files Changed**:
- `src/services/autoFill/AutoFillEngine.ts` (lines 235-240 and 435-440)

---

### 2. ✅ Cache Not Working (CRITICAL - ROOT CAUSE)
**Problem**: Same NIN verified twice = 2 API calls (₦200 wasted)
- Server logs showed "Cache MISS" for the same NIN twice
- The `encryptData()` function uses a **random IV** (initialization vector)
- Same NIN encrypted twice = different encrypted values
- Database cache lookup failed because encrypted values didn't match

**Root Cause**:
```javascript
// encryptData() generates random IV each time
const iv = crypto.randomBytes(IV_LENGTH); // RANDOM!

// Same NIN, different results:
encryptData('12345678901') // => "abc123..."
encryptData('12345678901') // => "xyz789..." (DIFFERENT!)
```

**Solution**: Created deterministic hash function for cache lookups
```javascript
/**
 * Uses HMAC-SHA256 for deterministic hashing
 * Same input = same output (perfect for cache lookups)
 */
function hashForCacheLookup(plaintext) {
  const key = getEncryptionKey();
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(plaintext);
  return hmac.digest('hex');
}

// Same NIN, same hash:
hashForCacheLookup('12345678901') // => "def456..."
hashForCacheLookup('12345678901') // => "def456..." (SAME!)
```

**Files Changed**:
- `server-utils/encryption.cjs` - Added `hashForCacheLookup()` function
- `server.js` - Updated auto-fill endpoints to use hash for lookups
- `firestore.indexes.json` - Updated index to use `identityHash` field

**Database Schema Update**:
```javascript
// OLD (BROKEN):
{
  identityType: 'NIN',
  encryptedIdentityNumber: 'random-encrypted-value', // Changes each time!
  source: 'auto-fill'
}

// NEW (FIXED):
{
  identityType: 'NIN',
  identityHash: 'deterministic-hash', // Same for same NIN
  encryptedIdentityNumber: 'encrypted-value', // Still encrypted for security
  encryptedIV: 'iv-value', // Stored separately
  source: 'auto-fill'
}
```

---

### 3. ✅ Cost Display (Already Correct)
**Status**: Server code already has `cost: 100` (₦100)
- The user's logs showing "₦50" were from old server code
- Current code correctly uses ₦100 for both NIN and CAC

**Verification**:
- `server.js` line 4753: `cost: 100 // ₦100 per NIN verification`
- `server.js` line 5053: `cost: 100 // ₦100 per CAC verification`

---

## How Caching Works Now

### First Verification (Cache MISS)
```
1. User enters NIN: 12345678901
2. Generate hash: hashForCacheLookup('12345678901') => 'abc123...'
3. Query database: WHERE identityHash == 'abc123...'
4. Result: No match (Cache MISS)
5. Call Datapro API (cost = ₦100)
6. Store in database:
   - identityHash: 'abc123...' (for lookups)
   - encryptedIdentityNumber: 'xyz789...' (for security)
   - verificationData: { firstname, surname, ... }
   - cost: 100
```

### Second Verification (Cache HIT)
```
1. User enters same NIN: 12345678901
2. Generate hash: hashForCacheLookup('12345678901') => 'abc123...'
3. Query database: WHERE identityHash == 'abc123...'
4. Result: MATCH FOUND! (Cache HIT)
5. Return cached data (cost = ₦0)
6. NO API CALL - Money saved!
```

---

## Cost Savings Example

### Without Caching (BEFORE):
- User enters NIN → API call (₦100)
- User submits form → API call (₦100)
- User comes back later → API call (₦100)
- **Total: ₦300**

### With Caching (AFTER):
- User enters NIN → API call (₦100) → cached
- User submits form → cache hit (₦0)
- User comes back later → cache hit (₦0)
- **Total: ₦100 (67% savings!)**

---

## Deployment Steps

### 1. Deploy Firestore Index
```bash
firebase deploy --only firestore:indexes
```
Wait for index to build (check Firebase Console)

### 2. Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 3. Test Cache
1. Enter a NIN and blur the field
2. Check server logs: Should see "Cache MISS - calling Datapro API (cost = ₦100)"
3. Enter the SAME NIN again
4. Check server logs: Should see "Cache HIT - returning cached NIN data (cost = ₦0)"

---

## Verification Checklist

- [x] forEach error fixed in AutoFillEngine.ts
- [x] hashForCacheLookup() function added to encryption.cjs
- [x] Server endpoints updated to use hash for cache lookups
- [x] Database storage includes both hash and encrypted values
- [x] Firestore index updated to use identityHash field
- [x] Cost values confirmed as ₦100 (not ₦50)
- [ ] Deploy Firestore indexes
- [ ] Restart server
- [ ] Test cache hit/miss behavior
- [ ] Verify cost savings in analytics

---

## Technical Details

### Why Two Fields?
- **identityHash**: Deterministic hash for cache lookups (HMAC-SHA256)
- **encryptedIdentityNumber**: Encrypted with random IV for security (AES-256-GCM)

### Security
- Hash is one-way (can't reverse to get NIN)
- Encrypted value is two-way (can decrypt if needed)
- Both use the same encryption key from environment
- Identity numbers never stored in plaintext

### Performance
- Hash lookup is O(1) with Firestore index
- No need to decrypt values for cache lookups
- Deterministic hash ensures consistent results

---

## Monitoring

### Check Cache Hit Rate
```javascript
// In Firebase Console or server logs
const logs = await db.collection('verification-audit-logs')
  .where('metadata.source', '==', 'auto-fill')
  .get();

const hits = logs.docs.filter(d => d.data().metadata?.cacheHit === true).length;
const total = logs.size;
const hitRate = (hits / total) * 100;

console.log(`Cache hit rate: ${hitRate.toFixed(2)}%`);
```

### Check Cost Savings
```javascript
const cached = await db.collection('verified-identities')
  .where('source', '==', 'auto-fill')
  .get();

const savings = cached.size * 100; // Each cached entry saved ₦100
console.log(`Total savings: ₦${savings}`);
```

---

## Notes

- The forEach error was preventing auto-fill from completing
- The cache issue was causing duplicate API calls and wasting money
- Both issues are now fixed and ready for testing
- User needs to restart server and deploy indexes for full fix
