# Design Document: Analytics Data Fixes

## Overview

This design addresses critical data integrity issues in the API Analytics Dashboard by fixing the data collection, storage, and aggregation layers. The fixes ensure accurate cost tracking, proper user attribution, elimination of duplicate entries, and functional filtering capabilities.

The system currently has three main data flows:
1. **API call logging** (apiUsageTracker.cjs) - Tracks API usage in api-usage and api-usage-logs collections
2. **Verification audit logging** (auditLogger.cjs) - Logs verification attempts in verification-audit-logs collection
3. **Analytics aggregation** (server.js endpoints) - Queries and aggregates data for dashboard display

The core issues stem from:
- Missing cost field in logged data
- Missing timestamp field in api-usage-logs
- Duplicate logging from both apiUsageTracker and auditLogger
- Missing user attribution (broker information)
- Incorrect aggregation queries in analytics endpoints
- Frontend not passing filter parameters to backend

## Architecture

### Data Flow

```
Verification Request
        ↓
    server.js (verification endpoint)
        ↓
    ├─→ dataproClient.cjs / verifydataClient.cjs (API call)
    │       ↓
    │   [CURRENT: Both functions called]
    │   ├─→ apiUsageTracker.trackDataproAPICall() → api-usage-logs (no cost, has timestamp issue)
    │   └─→ auditLogger.logVerificationAttempt() → verification-audit-logs (no cost)
    │
    └─→ [FIXED: Single consolidated logging]
        └─→ Enhanced logging function → Both collections with complete data
                ↓
        Analytics Endpoints (server.js)
                ↓
        Frontend Dashboard Display
```

### Collections Schema

**api-usage-logs** (individual call logs):
```javascript
{
  apiProvider: 'datapro' | 'verifydata',
  apiType: 'nin_verification' | 'cac_verification',
  success: boolean,
  cost: number,  // NEW: ₦50 for Datapro success, ₦100 for VerifyData success, ₦0 for failures
  timestamp: Timestamp,  // FIXED: Ensure proper storage
  userId: string,  // Broker who created the list
  userName: string,  // NEW: Broker's name
  userEmail: string,  // NEW: Broker's email
  listId: string,
  entryId: string,
  date: string,  // YYYY-MM-DD
  month: string,  // YYYY-MM
  ninMasked: string,  // For Datapro
  rcNumberMasked: string,  // For VerifyData
  errorCode: string | null
}
```

**verification-audit-logs** (audit trail):
```javascript
{
  eventType: 'verification_attempt',
  verificationType: 'NIN' | 'CAC',
  identityNumberMasked: string,
  userId: string,  // Broker who created the list
  userEmail: string,  // Broker's email
  userName: string,  // Broker's name
  userType: 'user' | 'customer' | 'system',
  ipAddress: string,
  result: 'success' | 'failure' | 'pending',
  cost: number,  // NEW: ₦50 for Datapro success, ₦100 for VerifyData success, ₦0 for failures
  apiProvider: string,  // NEW: 'datapro' | 'verifydata'
  errorCode: string | null,
  errorMessage: string | null,
  metadata: object,
  createdAt: Timestamp
}
```

## Components and Interfaces

### 1. Enhanced API Usage Tracker

**File**: `server-utils/apiUsageTracker.cjs`

**Changes**:

```javascript
// Add cost calculation helper
function calculateCost(provider, success) {
  if (!success) return 0;
  return provider === 'datapro' ? 50 : 100;
}

// Add user lookup helper
async function lookupBrokerInfo(db, listId) {
  if (!listId) return { userId: null, userName: 'unknown', userEmail: 'unknown' };
  
  try {
    const listDoc = await db.collection('identity-lists').doc(listId).get();
    if (!listDoc.exists) return { userId: null, userName: 'unknown', userEmail: 'unknown' };
    
    const listData = listDoc.data();
    const createdBy = listData.createdBy;
    
    if (!createdBy) return { userId: null, userName: 'unknown', userEmail: 'unknown' };
    
    const userDoc = await db.collection('users').doc(createdBy).get();
    if (!userDoc.exists) return { userId: createdBy, userName: 'unknown', userEmail: 'unknown' };
    
    const userData = userDoc.data();
    return {
      userId: createdBy,
      userName: userData.name || userData.displayName || 'unknown',
      userEmail: userData.email || 'unknown'
    };
  } catch (error) {
    console.error('[APIUsageTracker] Error looking up broker info:', error);
    return { userId: null, userName: 'unknown', userEmail: 'unknown' };
  }
}

// Modified trackDataproAPICall
async function trackDataproAPICall(db, callData) {
  const now = new Date();
  const cost = calculateCost('datapro', callData.success);
  const brokerInfo = await lookupBrokerInfo(db, callData.listId);
  
  // Store individual call log with complete data
  await db.collection('api-usage-logs').add({
    apiProvider: 'datapro',
    apiType: 'nin_verification',
    ninMasked: callData.nin,
    success: callData.success,
    cost: cost,  // NEW
    errorCode: callData.errorCode || null,
    userId: brokerInfo.userId,
    userName: brokerInfo.userName,  // NEW
    userEmail: brokerInfo.userEmail,  // NEW
    listId: callData.listId || null,
    entryId: callData.entryId || null,
    timestamp: now,  // FIXED: Ensure Firestore Timestamp
    date: now.toISOString().split('T')[0],
    month: now.toISOString().substring(0, 7)
  });
  
  // ... rest of aggregation logic
}

// Similar changes for trackVerifydataAPICall
```

### 2. Enhanced Audit Logger

**File**: `server-utils/auditLogger.cjs`

**Changes**:

```javascript
// Modified logVerificationAttempt to include cost and provider
async function logVerificationAttempt(params) {
  const {
    verificationType,
    identityNumber,
    userId,
    userEmail,
    userName,
    userType,
    ipAddress,
    result,
    errorCode,
    errorMessage,
    apiProvider,  // NEW: 'datapro' | 'verifydata'
    cost,  // NEW: calculated cost
    metadata = {}
  } = params;

  const db = getDb();
  const logEntry = {
    eventType: 'verification_attempt',
    verificationType: verificationType || 'unknown',
    identityNumberMasked: maskSensitiveData(identityNumber),
    userId: userId || 'anonymous',
    userEmail: userEmail || 'anonymous',
    userName: userName || 'Anonymous',
    userType: userType || 'customer',
    ipAddress: ipAddress || 'unknown',
    result: result,
    cost: cost || 0,  // NEW
    apiProvider: apiProvider || 'unknown',  // NEW
    errorCode: errorCode || null,
    errorMessage: errorMessage || null,
    metadata: {
      ...metadata,
      userAgent: metadata.userAgent || 'unknown',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('verification-audit-logs').add(logEntry);
  console.log(`📝 [AUDIT] Verification attempt logged: ${verificationType} - ${result} - ₦${cost}`);
}
```

### 3. Consolidated Logging in Verification Flow

**File**: `server.js` (verification endpoints)

**Current Problem**: Both `trackDataproAPICall()` and `logVerificationAttempt()` are called, creating duplicates.

**Solution**: Create a single consolidated logging function that writes to both collections with complete data.

```javascript
// New helper function in server.js
async function logVerificationComplete(params) {
  const {
    provider,  // 'datapro' | 'verifydata'
    verificationType,  // 'NIN' | 'CAC'
    identityNumber,
    success,
    errorCode,
    listId,
    entryId,
    brokerUserId,
    brokerUserName,
    brokerUserEmail,
    customerIpAddress,
    userAgent
  } = params;
  
  const cost = success ? (provider === 'datapro' ? 50 : 100) : 0;
  
  // Log to api-usage-logs via apiUsageTracker
  await apiUsageTracker.trackDataproAPICall(db, {
    nin: identityNumber,  // Will be masked inside
    success,
    errorCode,
    listId,
    entryId,
    // Broker info will be looked up inside trackDataproAPICall
  });
  
  // Log to verification-audit-logs via auditLogger
  await auditLogger.logVerificationAttempt({
    verificationType,
    identityNumber,  // Will be masked inside
    userId: brokerUserId,
    userEmail: brokerUserEmail,
    userName: brokerUserName,
    userType: 'user',  // Broker is a user
    ipAddress: customerIpAddress,
    result: success ? 'success' : 'failure',
    errorCode,
    apiProvider: provider,
    cost,
    metadata: { userAgent }
  });
}

// Usage in verification endpoint:
// BEFORE: Two separate calls creating duplicates
// await apiUsageTracker.trackDataproAPICall(...);
// await auditLogger.logVerificationAttempt(...);

// AFTER: Single consolidated call
await logVerificationComplete({
  provider: 'datapro',
  verificationType: 'NIN',
  identityNumber: nin,
  success: verificationResult.success,
  errorCode: verificationResult.errorCode,
  listId: entry.listId,
  entryId: entryId,
  brokerUserId: listData.createdBy,
  brokerUserName: brokerData.name,
  brokerUserEmail: brokerData.email,
  customerIpAddress: req.ip,
  userAgent: req.headers['user-agent']
});
```

### 4. Fixed Analytics Endpoints

**File**: `server.js`

#### 4.1 Overview Endpoint Fix

**Current Problem**: Provider breakdown shows 0 calls.

**Root Cause**: Query not properly aggregating from api-usage collection.

**Fix**:
```javascript
app.get('/api/analytics/overview', requireAuth, requireSuperAdmin, async (req, res) => {
  // ... existing code ...
  
  // FIXED: Query api-usage-logs for provider breakdown
  const usageLogsSnapshot = await db.collection('api-usage-logs')
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .get();
  
  const providerBreakdown = {
    datapro: 0,
    verifydata: 0
  };
  
  usageLogsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.apiProvider === 'datapro') {
      providerBreakdown.datapro++;
    } else if (data.apiProvider === 'verifydata') {
      providerBreakdown.verifydata++;
    }
  });
  
  // ... rest of response
});
```

#### 4.2 User Attribution Endpoint Fix

**Current Problem**: Shows "unknown" for userName and userEmail, "Date unavailable" for lastActivity.

**Root Cause**: api-usage-logs doesn't have userName/userEmail, timestamp field not properly stored.

**Fix**: Already addressed by changes to apiUsageTracker.cjs. Endpoint query remains the same but will now receive complete data.

#### 4.3 Chart Data Endpoint Fix

**Current Problem**: Charts show "No chart data available".

**Root Cause**: Backend not returning proper time-series data format.

**Fix**:
```javascript
// Ensure daily data is returned in correct format
const dailyData = [];
const currentDate = new Date(startDate);
const endDateObj = new Date(endDate);

while (currentDate <= endDateObj) {
  const dateKey = currentDate.toISOString().split('T')[0];
  
  // Query api-usage-logs for this date
  const daySnapshot = await db.collection('api-usage-logs')
    .where('date', '==', dateKey)
    .get();
  
  let totalCalls = 0;
  let successfulCalls = 0;
  let failedCalls = 0;
  
  daySnapshot.forEach(doc => {
    const data = doc.data();
    totalCalls++;
    if (data.success) successfulCalls++;
    else failedCalls++;
  });
  
  dailyData.push({
    date: dateKey,
    totalCalls,
    successfulCalls,
    failedCalls
  });
  
  currentDate.setDate(currentDate.setDate() + 1);
}

res.json({ dailyData });  // Return array, not null
```

#### 4.4 Audit Logs Endpoint Fix

**Current Problem**: Filters don't work, shows "anonymous" and "Unknown User".

**Root Cause**: Frontend not passing filters, backend not applying them, missing broker attribution.

**Fix**:
```javascript
app.get('/api/analytics/audit-logs', requireAuth, requireSuperAdmin, async (req, res) => {
  const { startDate, endDate, provider, status, user, limit = 100 } = req.query;
  
  let query = db.collection('verification-audit-logs')
    .where('eventType', '==', 'verification_attempt');
  
  // Apply filters
  if (startDate && endDate) {
    const start = admin.firestore.Timestamp.fromDate(new Date(startDate));
    const end = admin.firestore.Timestamp.fromDate(new Date(endDate));
    query = query.where('createdAt', '>=', start).where('createdAt', '<=', end);
  }
  
  if (provider && provider !== 'all') {
    query = query.where('apiProvider', '==', provider);
  }
  
  if (status && status !== 'all') {
    query = query.where('result', '==', status);
  }
  
  if (user && user !== 'all') {
    query = query.where('userId', '==', user);
  }
  
  query = query.orderBy('createdAt', 'desc').limit(parseInt(limit));
  
  const snapshot = await query.get();
  const logs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().createdAt?.toDate()
  }));
  
  res.json({ logs, total: logs.length });
});
```

### 5. Frontend Filter Integration

**File**: `src/pages/admin/AdminAnalyticsDashboard.tsx` or similar

**Current Problem**: Filter state not passed to API calls.

**Fix**:
```typescript
// Ensure filter state is passed to all API calls
const fetchAnalyticsData = async () => {
  const params = new URLSearchParams({
    startDate: filters.startDate,
    endDate: filters.endDate,
    provider: filters.provider || 'all',
    status: filters.status || 'all'
  });
  
  const response = await fetch(`/api/analytics/overview?${params}`);
  // ... handle response
};

// Call fetchAnalyticsData whenever filters change
useEffect(() => {
  fetchAnalyticsData();
}, [filters.startDate, filters.endDate, filters.provider, filters.status]);
```

## Data Models

### Cost Calculation Model

```javascript
/**
 * Calculate cost for an API call
 * @param {string} provider - 'datapro' | 'verifydata'
 * @param {boolean} success - Whether the call succeeded
 * @param {number} statusCode - HTTP status code
 * @returns {number} Cost in Naira
 */
function calculateVerificationCost(provider, success, statusCode) {
  // Only successful calls cost money
  if (!success || statusCode !== 200) {
    return 0;
  }
  
  // Provider-specific pricing
  switch (provider) {
    case 'datapro':
      return 50;  // ₦50 per successful NIN verification
    case 'verifydata':
      return 100;  // ₦100 per successful CAC verification
    default:
      return 0;
  }
}
```

### Broker Attribution Model

```javascript
/**
 * Get broker information from list
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} listId
 * @returns {Promise<BrokerInfo>}
 */
async function getBrokerFromList(db, listId) {
  if (!listId) {
    return {
      userId: null,
      userName: 'unknown',
      userEmail: 'unknown'
    };
  }
  
  const listDoc = await db.collection('identity-lists').doc(listId).get();
  if (!listDoc.exists) {
    return {
      userId: null,
      userName: 'unknown',
      userEmail: 'unknown'
    };
  }
  
  const createdBy = listDoc.data().createdBy;
  if (!createdBy) {
    return {
      userId: null,
      userName: 'unknown',
      userEmail: 'unknown'
    };
  }
  
  const userDoc = await db.collection('users').doc(createdBy).get();
  if (!userDoc.exists) {
    return {
      userId: createdBy,
      userName: 'unknown',
      userEmail: 'unknown'
    };
  }
  
  const userData = userDoc.data();
  return {
    userId: createdBy,
    userName: userData.name || userData.displayName || 'unknown',
    userEmail: userData.email || 'unknown'
  };
}
```

## Error Handling

### Logging Failures

All logging operations must be wrapped in try-catch blocks and should NOT throw errors that break the main verification flow:

```javascript
try {
  await logVerificationComplete(params);
} catch (error) {
  console.error('[LOGGING ERROR] Failed to log verification:', error);
  // Continue with verification flow - logging failures are non-fatal
}
```

### Missing Data Handling

When broker information cannot be found:
- Set userId to null
- Set userName to 'unknown'
- Set userEmail to 'unknown'
- Log warning but continue processing

### Cost Calculation Edge Cases

- If provider is unknown: cost = 0
- If success is undefined: cost = 0
- If statusCode is not 200: cost = 0
- Never throw errors from cost calculation

## Testing Strategy

### Unit Tests

1. **Cost Calculation Tests**
   - Test Datapro successful call returns ₦50
   - Test VerifyData successful call returns ₦100
   - Test failed calls return ₦0
   - Test unknown provider returns ₦0

2. **Broker Lookup Tests**
   - Test valid listId returns correct broker info
   - Test invalid listId returns 'unknown' values
   - Test missing createdBy returns 'unknown' values
   - Test missing user document returns 'unknown' values

3. **Timestamp Storage Tests**
   - Test timestamp is stored as Firestore Timestamp
   - Test timestamp can be queried and sorted
   - Test timestamp displays correctly in frontend

4. **Filter Application Tests**
   - Test date range filter works
   - Test provider filter works
   - Test status filter works
   - Test combined filters work

### Integration Tests

1. **End-to-End Verification Flow**
   - Perform verification
   - Check api-usage-logs has correct cost
   - Check verification-audit-logs has correct cost
   - Check no duplicate entries exist
   - Check broker attribution is correct

2. **Analytics Dashboard Tests**
   - Test overview shows correct provider breakdown
   - Test user attribution shows correct broker names
   - Test charts display data
   - Test filters update displayed data
   - Test cost totals are accurate

### Property-Based Tests

Will be defined after prework analysis in the Correctness Properties section below.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

- **2.3 is redundant with 2.1**: If exactly one entry is created, there cannot be duplicates
- **8.5 is redundant with 8.1**: If we only sum costs where cost > 0, we automatically exclude ₦0 costs
- **5.3 is redundant with 5.2**: Aggregating by provider and returning counts are the same property
- **8.3 can be combined with 8.4**: Both test that totals equal sums of components

The following properties provide unique validation value:

### Property 1: Timestamp Field Presence

*For any* API call logged to api-usage-logs, the stored document should contain a timestamp field with a valid Firestore Timestamp value.

**Validates: Requirements 1.1**

### Property 2: Timestamp ISO 8601 Format

*For any* API usage record retrieved from the database, the timestamp should be convertible to and match ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ).

**Validates: Requirements 1.2**

### Property 3: Single Audit Log Entry Per Verification

*For any* verification attempt, querying the verification-audit-logs collection should return exactly one entry for that verification (no duplicates).

**Validates: Requirements 2.1, 2.3**

### Property 4: Complete User Information in Audit Logs

*For any* audit log entry for a verification with a valid broker, the entry should contain non-empty userName, userEmail, and userId fields.

**Validates: Requirements 2.2**

### Property 5: Datapro Success Cost

*For any* successful Datapro verification (HTTP 200 with ResponseCode "00"), the stored cost in both api-usage-logs and verification-audit-logs should be ₦50.

**Validates: Requirements 3.1, 3.4**

### Property 6: VerifyData Success Cost

*For any* successful VerifyData verification (HTTP 200 with "success": true), the stored cost in both api-usage-logs and verification-audit-logs should be ₦100.

**Validates: Requirements 3.2, 3.4**

### Property 7: Failed Verification Cost

*For any* failed verification (HTTP 400, 401, 500, or error status codes), the stored cost in both collections should be ₦0.

**Validates: Requirements 3.3, 3.4**

### Property 8: Broker Attribution Data Presence

*For any* API call logged with a valid listId, the stored record in api-usage-logs should contain userName and userEmail fields that are not "unknown".

**Validates: Requirements 4.2, 4.3**

### Property 9: Provider Aggregation Accuracy

*For any* date range, the sum of calls returned by the overview endpoint for each provider should equal the count of records in api-usage-logs for that provider within the date range.

**Validates: Requirements 5.2, 5.3**

### Property 10: Non-Zero Provider Counts

*For any* provider that has at least one call in the database for the selected date range, the overview endpoint should return a count greater than zero for that provider.

**Validates: Requirements 5.4**

### Property 11: Daily Usage Data Completeness

*For any* date range query, the returned daily usage data should include entries for each day in the range, and each entry should contain date, totalCalls, successfulCalls, and failedCalls fields.

**Validates: Requirements 6.1, 6.2**

### Property 12: Chronological Sorting

*For any* daily usage data array returned by the analytics endpoint, each date should be less than or equal to the next date (chronologically sorted).

**Validates: Requirements 6.3**

### Property 13: Empty Array for No Data

*For any* date range with no API calls in the database, the analytics endpoint should return an empty array (not null or undefined).

**Validates: Requirements 6.5**

### Property 14: Broker Information in Customer Verifications

*For any* customer verification via link, the audit log entry should contain the broker's userName, userEmail, and userId (not "anonymous").

**Validates: Requirements 7.2, 7.4**

### Property 15: Cost Calculation Accuracy

*For any* user, the total cost calculated should equal the sum of all cost values from api-usage-logs where cost > 0 for that user.

**Validates: Requirements 8.1, 8.5**

### Property 16: Cost Aggregation Consistency

*For any* set of users, the grand total cost should equal the sum of individual user total costs, and each individual total should equal the sum of their individual call costs.

**Validates: Requirements 8.3, 8.4**

### Property 17: Filter Parameter Passing

*For any* filter applied in the Analytics Dashboard (date range, provider, or status), the API request should include the corresponding query parameters.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 18: Filter Application Correctness

*For any* set of filters applied, all returned records should match the filter criteria (date within range, provider matches, status matches).

**Validates: Requirements 9.4**

### Property 19: Success Rate Calculation

*For any* set of API calls, the success rate should equal (successfulCalls / totalCalls) * 100, rounded to two decimal places, or 0 if totalCalls is zero.

**Validates: Requirements 10.1, 10.2, 10.3**

