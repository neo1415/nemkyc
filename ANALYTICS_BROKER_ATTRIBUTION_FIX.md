# Analytics Broker Attribution Fix

## Problem Summary

The API Analytics Dashboard shows "No broker data available" and charts show "data unavailable" because:

1. **Broker Attribution Issue**: The `/api/analytics/broker-usage` endpoint queries `api-usage-logs` for `userId`, but customer verifications don't have a broker `userId` - they're initiated by customers clicking verification links sent by brokers.

2. **Missing Link**: The system needs to link API calls to brokers through the `listId` → `identity-lists.createdBy` relationship, not through direct `userId` in API logs.

3. **Data Structure Mismatch**:
   - `api-usage-logs` has: `userId` (often null or 'anonymous' for customer verifications)
   - `identity-entries` has: `listId` (links to the broker's list)
   - `identity-lists` has: `createdBy` (the broker's userId)

## Current Flow (Broken)

```
Customer clicks verification link
  ↓
API call made (userId = null or 'anonymous')
  ↓
api-usage-logs created with userId = null
  ↓
Broker attribution query finds no userId
  ↓
"No broker data available"
```

## Correct Flow (Needed)

```
Customer clicks verification link
  ↓
API call made with listId in metadata
  ↓
api-usage-logs created with listId
  ↓
Broker attribution query:
  1. Get api-usage-logs with listId
  2. Look up identity-lists.createdBy using listId
  3. Aggregate by createdBy (broker userId)
  ↓
Broker attribution data displayed
```

## Solution

### Option 1: Fix api-usage-logs to include listId (Recommended)

Update `trackDataproAPICall` and `trackVerifydataAPICall` in `server-utils/apiUsageTracker.cjs` to always include `listId` in the logs.

Then update the broker-usage endpoint to:
1. Query api-usage-logs
2. Group by listId
3. Look up createdBy for each listId
4. Aggregate by broker

### Option 2: Query verification-audit-logs instead

The `verification-audit-logs` collection already has `listId` in metadata. We could:
1. Query verification-audit-logs instead of api-usage-logs
2. Extract listId from metadata
3. Look up createdBy
4. Aggregate by broker

### Option 3: Create a broker-usage-summary collection

Create a background job that:
1. Processes verification-audit-logs daily
2. Aggregates by broker (using listId → createdBy)
3. Stores in broker-usage-summary collection
4. Dashboard queries this pre-aggregated data

## Recommended Fix (Option 1)

### Step 1: Update apiUsageTracker.cjs

Ensure `listId` is always included in api-usage-logs:

```javascript
await db.collection('api-usage-logs').add({
  apiProvider: 'datapro',
  apiType: 'nin_verification',
  ninMasked: callData.nin,
  success: callData.success,
  errorCode: callData.errorCode || null,
  userId: callData.userId || null,
  listId: callData.listId || null,  // ✅ Already included
  entryId: callData.entryId || null,
  timestamp: now,
  date: dateKey,
  month: monthKey
});
```

### Step 2: Update broker-usage endpoint

Replace the current logic with:

```javascript
// Query api-usage-logs for the date range
const logsSnapshot = await db.collection('api-usage-logs')
  .where('timestamp', '>=', new Date(startDate))
  .where('timestamp', '<=', new Date(endDate + 'T23:59:59'))
  .limit(10000)
  .get();

// Aggregate by listId first
const listMap = new Map();

logsSnapshot.forEach(doc => {
  const data = doc.data();
  const listId = data.listId || 'unknown';
  
  if (!listMap.has(listId)) {
    listMap.set(listId, {
      listId,
      brokerId: null, // Will be populated below
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      totalCost: 0,
      dataproCalls: 0,
      verifydataCalls: 0
    });
  }
  
  const list = listMap.get(listId);
  list.totalCalls++;
  
  if (data.success) {
    list.successfulCalls++;
  } else {
    list.failedCalls++;
  }
  
  // Track provider-specific calls
  if (data.apiProvider === 'datapro') {
    list.dataproCalls++;
    list.totalCost += 50;
  } else if (data.apiProvider === 'verifydata') {
    list.verifydataCalls++;
    list.totalCost += 100;
  }
});

// Look up broker for each list
const brokerMap = new Map();

for (const [listId, listData] of listMap.entries()) {
  if (listId === 'unknown') continue;
  
  try {
    const listDoc = await db.collection('identity-lists').doc(listId).get();
    if (listDoc.exists) {
      const brokerId = listDoc.data().createdBy;
      listData.brokerId = brokerId;
      
      // Aggregate by broker
      if (!brokerMap.has(brokerId)) {
        brokerMap.set(brokerId, {
          brokerId,
          brokerName: 'Loading...',
          brokerEmail: 'Loading...',
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          totalCost: 0,
          dataproCalls: 0,
          verifydataCalls: 0,
          lastActivity: null
        });
      }
      
      const broker = brokerMap.get(brokerId);
      broker.totalCalls += listData.totalCalls;
      broker.successfulCalls += listData.successfulCalls;
      broker.failedCalls += listData.failedCalls;
      broker.totalCost += listData.totalCost;
      broker.dataproCalls += listData.dataproCalls;
      broker.verifydataCalls += listData.verifydataCalls;
    }
  } catch (err) {
    console.error(`Error fetching list ${listId}:`, err);
  }
}

// Fetch broker details
const brokers = [];
for (const [brokerId, data] of brokerMap.entries()) {
  try {
    const userDoc = await db.collection('users').doc(brokerId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      data.brokerName = userData.displayName || userData.email || 'Unknown';
      data.brokerEmail = userData.email || 'unknown@example.com';
    }
  } catch (err) {
    console.error(`Error fetching user ${brokerId}:`, err);
  }
  
  data.successRate = data.totalCalls > 0 
    ? parseFloat(((data.successfulCalls / data.totalCalls) * 100).toFixed(2))
    : 0;
  
  // Get last activity from most recent log
  // (This would require additional query or tracking)
  data.lastActivity = new Date().toISOString();
  
  brokers.push(data);
}
```

## Testing

After implementing the fix:

1. **Verify Data Structure**:
   ```javascript
   // Check api-usage-logs have listId
   db.collection('api-usage-logs').limit(10).get()
   ```

2. **Test Broker Attribution**:
   - Create a test identity list as a broker
   - Send verification links
   - Have customers verify
   - Check analytics dashboard shows broker attribution

3. **Verify Charts**:
   - Check that usage charts display data
   - Verify cost tracking shows correct amounts
   - Confirm broker attribution table populates

## Related Files

- `server-utils/apiUsageTracker.cjs` - API usage tracking
- `server.js` (line ~13251) - `/api/analytics/broker-usage` endpoint
- `src/components/analytics/UserAttributionTable.tsx` - Frontend component
- `src/services/analytics/AnalyticsAPI.ts` - API client

## Status

- [ ] Update broker-usage endpoint logic
- [ ] Test with real data
- [ ] Verify charts display correctly
- [ ] Document for future reference
