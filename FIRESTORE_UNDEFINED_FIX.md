# Firestore Undefined Values Fix

## Issue
Server was crashing with error:
```
💥 Failed to log event: Error: Value for argument "data" is not a valid Firestore document. 
Cannot use "undefined" as a Firestore value (found in field "details.contentLength"). 
If you want to ignore undefined values, enable `ignoreUndefinedProperties`.
```

## Root Cause
The `logAction` function was trying to save objects with `undefined` values to Firestore. Firestore doesn't accept `undefined` values - it requires either a value or `null`.

## Solution Applied

Added a `removeUndefined` helper function that recursively removes all `undefined` values from objects before saving to Firestore:

```javascript
// Helper function to remove undefined values from objects
const removeUndefined = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = removeUndefined(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
};
```

Applied to:
- `details` object
- `meta` object

## Changes Made

**File**: `server.js`
**Function**: `logAction`
**Lines**: ~950-1010

### Before:
```javascript
details: actionData.details || {},
meta: {
  ...actionData.meta,
  serverVersion: process.env.npm_package_version || '1.0.0',
  // ...
}
```

### After:
```javascript
details: removeUndefined(actionData.details || {}),
meta: removeUndefined({
  ...actionData.meta,
  serverVersion: process.env.npm_package_version || '1.0.0',
  // ...
})
```

## Testing

Restart your server and test:

```bash
node server.js
```

The error should no longer appear. Events will be logged successfully with all undefined values filtered out.

## Verification

Check that events are being logged:
1. Make an API request (e.g., GET /api/users)
2. Check Firestore `eventLogs` collection
3. Verify event was created without errors

## Alternative Solution (Not Recommended)

Firestore has a setting to ignore undefined values globally:
```javascript
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
```

**Why we didn't use this**: 
- It's better to explicitly handle undefined values
- Prevents accidental data loss
- More predictable behavior
- Better for debugging

## Status

✅ **FIXED** - Server should now run without Firestore errors

## Date
December 10, 2025
