# Date Display and Analytics API Fixes

## Issues Fixed

### 1. "Date unavailable" in Identity Verification UI
**File**: `src/pages/admin/AdminUnifiedTable.tsx`

**Problem**: The `formatDate()` function was returning empty strings (`''`) for invalid or missing dates, which caused the UI to display "Date unavailable" or blank cells.

**Root Cause**: 
- Firestore was returning empty objects (`{}`) for null/undefined date fields
- The function didn't handle Firestore Timestamp objects with `.seconds` property
- Empty strings were being returned instead of a proper fallback like 'N/A'

**Fix**: Updated the `formatDate()` function to:
- Handle empty objects from Firestore and return 'N/A'
- Handle Firestore Timestamp objects with `.seconds` property
- Return 'N/A' instead of empty strings for all invalid cases
- Properly handle all date formats (Date objects, strings, numbers, Firestore Timestamps)

### 2. Analytics API 500 Errors
**File**: `server.js`

**Problem**: Multiple analytics endpoints were throwing 500 errors when querying the `api-usage-logs` collection.

**Root Cause**:
- Queries were using `timestamp` field with range queries, but Firestore composite indexes may not exist
- No fallback mechanism when queries failed
- The `api-usage-logs` collection has both `timestamp` and `date` fields, but queries only tried one

**Affected Endpoints**:
- `/api/analytics/overview` - Line 13109
- `/api/analytics/user-attribution` - Line 13480
- `/api/analytics/cost-tracking` - Line 13782
- `/api/analytics/broker-usage` - Line 13367
- `/api/analytics/export` - Lines 14067, 14095, 14137

**Fix**: Added try-catch blocks with fallback queries:
1. First try: Query by `timestamp` field (preferred for accuracy)
2. If that fails: Fallback to query by `date` field (YYYY-MM-DD string)
3. If both fail: Return proper error message to client
4. For overview endpoint: Added in-memory filtering when using fallback query

## Testing

To verify the fixes:

1. **Date Display**: Check the identity verification tables in admin dashboard - dates should now show as "N/A" instead of blank or "Date unavailable"

2. **Analytics API**: 
   - Navigate to Analytics Dashboard
   - Check that overview, cost tracking, and user attribution load without errors
   - Check browser console - should see no 500 errors

## Files Modified

1. `src/pages/admin/AdminUnifiedTable.tsx` - Fixed date formatting
2. `server.js` - Added fallback queries for 5 analytics endpoints
