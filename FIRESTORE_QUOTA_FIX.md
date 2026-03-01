# Firestore Quota Exhaustion Fix

## Problem
Firebase Firestore free tier quota was being exhausted due to excessive reads/writes in the authentication middleware.

### Root Cause
The `requireAuth` middleware in `server.js` was performing:
1. **1 Firestore READ** on every API request to fetch user session data (line 866)
2. **1 Firestore WRITE** on every API request to update `lastActivity` timestamp (line 920)

This resulted in **2 Firestore operations per API call**, which quickly exhausted the free tier quota of 50,000 reads/day and 20,000 writes/day.

### Error Message
```
Error: 8 RESOURCE_EXHAUSTED: Quota exceeded.
at requireAuth (server.js:866:72)
```

## Solution Implemented

### 1. Session Caching
Added an in-memory cache for user sessions with a 5-minute TTL:

```javascript
const sessionCache = new Map();
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedSession(sessionToken, db) {
  const cached = sessionCache.get(sessionToken);
  
  // Return cached data if still valid
  if (cached && (Date.now() - cached.timestamp) < SESSION_CACHE_TTL) {
    return cached.data;
  }
  
  // Fetch from Firestore only if cache miss
  const userDoc = await db.collection('userroles').doc(sessionToken).get();
  // ... cache the result
}
```

### 2. Reduced lastActivity Updates
Changed from updating `lastActivity` on every request to only updating every 5 minutes:

```javascript
const ACTIVITY_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Only update if it's been more than 5 minutes since last update
if (timeSinceLastActivity > ACTIVITY_UPDATE_INTERVAL) {
  db.collection('userroles').doc(sessionToken).update({
    lastActivity: Date.now()
  }).then(() => {
    invalidateSessionCache(sessionToken);
  });
}
```

### 3. Cache Invalidation
Added cache invalidation in key scenarios:
- When session expires due to inactivity
- After updating `lastActivity` in Firestore
- Automatic cleanup of expired cache entries every 10 minutes

## Impact

### Before Fix
- **Firestore Reads**: 1 per API request
- **Firestore Writes**: 1 per API request
- **Total**: 2 operations per request
- **Example**: 1000 API requests = 2000 Firestore operations

### After Fix
- **Firestore Reads**: 1 per 5 minutes per user (cached)
- **Firestore Writes**: 1 per 5 minutes per user
- **Total**: ~2 operations per 5 minutes per user
- **Example**: 1000 API requests from same user in 5 minutes = 2 Firestore operations

### Quota Savings
- **Reduction**: ~99% reduction in Firestore operations
- **Free Tier**: Should now easily stay within limits for typical usage

## Testing

### To Verify the Fix
1. Restart the server: `node server.js`
2. Sign in to the application
3. Perform multiple API requests (create CAC verification list, etc.)
4. Check server logs - you should see:
   - First request: Firestore read (cache miss)
   - Subsequent requests within 5 minutes: No Firestore reads (cache hit)
   - After 5 minutes: Firestore write to update lastActivity

### Monitor Firestore Usage
1. Go to Firebase Console → Firestore → Usage tab
2. Monitor read/write operations
3. Should see dramatic reduction in operations

## Additional Recommendations

### Short Term (if still hitting limits)
1. **Increase cache TTL**: Change `SESSION_CACHE_TTL` from 5 minutes to 10-15 minutes
2. **Increase activity update interval**: Change `ACTIVITY_UPDATE_INTERVAL` from 5 minutes to 10-15 minutes

### Long Term
1. **Upgrade to Blaze Plan**: Pay-as-you-go pricing ($0.06 per 100K reads, $0.18 per 100K writes)
2. **Use Firebase Authentication**: Replace custom session management with Firebase Auth tokens
3. **Implement Redis**: Use Redis for session storage instead of Firestore

## Files Modified
- `server.js`: Added session caching and reduced Firestore operations

## Notes
- Session cache is in-memory, so it will be cleared on server restart (this is fine)
- Cache TTL of 5 minutes balances between quota savings and data freshness
- Session timeout (2 hours) is still enforced correctly
- No changes needed to frontend code
