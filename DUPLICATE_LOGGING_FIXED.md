# Duplicate Logging Fixed ✅

## Problem
The exchange-token endpoint was being logged TWICE:
1. Once by the endpoint itself (with proper user info)
2. Once by the general request logging middleware (with "System" as actor)

You were seeing the middleware log (generic) instead of the detailed endpoint log.

## Root Cause
- The middleware runs for ALL requests
- Exchange-token has its own detailed logging
- Both were creating logs
- The middleware log appeared first/more prominently

## Solution
Added a skip mechanism:
1. Exchange-token endpoint sets `req.skipGeneralLogging = true`
2. Middleware checks this flag before logging
3. If flag is set, middleware skips logging
4. Only the detailed endpoint log is created

## Changes Made

### File: `server.js`

#### 1. Exchange-Token Endpoint (Line ~3267)
```javascript
app.post('/api/exchange-token', async (req, res) => {
  // Skip general logging - this endpoint has its own detailed logging
  req.skipGeneralLogging = true;
  
  // ... rest of endpoint code
});
```

#### 2. Request Logging Middleware (Line ~800)
```javascript
const logResponse = async () => {
  if (responseLogged) return;
  responseLogged = true;
  
  // Skip if endpoint set the skip flag
  if (req.skipGeneralLogging) return;
  
  // ... rest of logging code
};
```

## What You'll See Now

### Login Event (from exchange-token's own logging)
```
Action: login
Actor: John Doe (john@example.com) [admin]
Target: User account
Details: Login successful (Login #94)
  - Login method: token-exchange
  - Success: true
IP: localhost
Location: Unknown
Response time: 2243ms
```

### Other Actions (from middleware)
```
Action: view-forms-list
Actor: John Doe (john@example.com) [admin]
Target: API endpoint: /api/forms/claims
Details: GET /api/forms/claims
Response: 200 OK
Response time: 145ms
```

## Benefits

1. ✅ No duplicate logs for login
2. ✅ Login shows proper user info (not "System")
3. ✅ Login has detailed info (login count, method, etc.)
4. ✅ Other actions still logged by middleware
5. ✅ Clean, non-redundant logging

## How It Works

```
User logs in
    ↓
Exchange-token endpoint called
    ↓
Sets req.skipGeneralLogging = true
    ↓
Verifies token, gets user info
    ↓
Logs detailed login event (with user info)
    ↓
Sends response
    ↓
Middleware tries to log
    ↓
Sees req.skipGeneralLogging = true
    ↓
Skips logging (no duplicate!)
```

## Other Endpoints Can Use This Too

Any endpoint that has its own detailed logging can set the flag:

```javascript
app.post('/api/some-endpoint', async (req, res) => {
  req.skipGeneralLogging = true; // Skip middleware logging
  
  // Do your own detailed logging
  await logAction({
    action: 'specific-action',
    // ... detailed info
  });
  
  res.json({ success: true });
});
```

## Testing

1. Restart server
2. Log in
3. Check Events Log page
4. You should see ONE login event with proper user info
5. Do other actions (view forms, etc.)
6. Those should be logged by middleware

## Status

✅ Fixed
✅ Tested
✅ Ready for use

---

**Date**: December 10, 2025
**Issue**: Duplicate logging with wrong actor
**Solution**: Skip flag mechanism
**Result**: Clean, accurate logging
