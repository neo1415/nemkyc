# Quick Fixes Summary - February 17, 2026

## 1. Delete Verified Test Records

I've created a script to help you find and delete your verified NIN/CAC test records:

### Usage:

```bash
# List all verified entries
node scripts/delete-verified-test-records.js list

# Delete a specific entry (after finding its ID from the list)
node scripts/delete-verified-test-records.js delete <entryId>

# Delete all verified entries (use with caution!)
node scripts/delete-verified-test-records.js delete-all
node scripts/delete-verified-test-records.js delete-all-confirmed
```

The script will:
- Show you all verified entries with masked identity numbers
- Let you identify your test records
- Delete specific entries by ID
- Automatically update list statistics (decrement verifiedCount)

## 2. Broker Attribution Issue - "No broker data available"

### Problem:
The analytics dashboard shows "No broker data available" because the broker-usage endpoint is looking for `userId` in `api-usage-logs`, but customer verifications don't have a broker userId - they're initiated by customers clicking verification links.

### Root Cause:
- Customer verifications have `userId = null` or `'anonymous'`
- The system needs to link API calls to brokers through: `listId` → `identity-lists.createdBy`
- Current endpoint queries by `userId` directly (which doesn't exist for customer verifications)

### Solution:
The broker-usage endpoint needs to be updated to:
1. Query `api-usage-logs` and group by `listId`
2. Look up `identity-lists.createdBy` for each `listId`
3. Aggregate by broker (`createdBy`)

See `ANALYTICS_BROKER_ATTRIBUTION_FIX.md` for detailed implementation.

## 3. Charts Showing "Data Unavailable"

### Problem:
Charts show "data unavailable" because there's no broker data (same root cause as #2).

### Solution:
Once the broker attribution is fixed, the charts will automatically populate with data.

## Quick Test

To verify the issue, you can check:

```javascript
// In Firebase console or a script:
db.collection('api-usage-logs').limit(10).get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      console.log('userId:', doc.data().userId);
      console.log('listId:', doc.data().listId);
    });
  });
```

You'll likely see:
- `userId: null` or `userId: 'anonymous'`
- `listId: <some-list-id>`

This confirms that the broker attribution needs to use `listId` → `createdBy` mapping.

## Next Steps

1. **Delete test records**: Run the script to clean up your verified test data
2. **Fix broker attribution**: Update the `/api/analytics/broker-usage` endpoint as described in `ANALYTICS_BROKER_ATTRIBUTION_FIX.md`
3. **Test**: Verify that broker attribution and charts work correctly

## Files Created

- `scripts/delete-verified-test-records.js` - Script to manage verified records
- `ANALYTICS_BROKER_ATTRIBUTION_FIX.md` - Detailed fix for broker attribution
- `QUICK_FIXES_SUMMARY.md` - This file
