# Deploy Rate Limiter Fix to Production

## Issue
CAC verification is failing in production with error:
```
TypeError: applyVerifydataRateLimit is not a function
```

## Fix Applied
Updated `server.js` line 57-62 to properly import the rate limiter functions:
```javascript
const {
  applyDataproRateLimit,
  applyVerifydataRateLimit,
  getDataproRateLimitStatus,
  resetDataproRateLimit
} = require('./server-utils/rateLimiter.cjs');
```

## Deployment Steps

### 1. Commit the Changes
```bash
git add server.js
git commit -m "fix: Add missing applyVerifydataRateLimit import for CAC verification"
```

### 2. Push to Repository
```bash
git push origin main
```
(Replace `main` with your branch name if different)

### 3. Deploy to Render.com

**Option A: Automatic Deployment (if enabled)**
- Render will automatically detect the push and redeploy
- Wait 2-3 minutes for deployment to complete
- Check the Render dashboard for deployment status

**Option B: Manual Deployment**
1. Go to https://dashboard.render.com
2. Find your service (nem-server-rhdb)
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for deployment to complete

### 4. Verify the Fix
After deployment, test CAC verification:
1. Go to your identity list
2. Send a CAC verification link
3. Complete the verification
4. Check the logs - should see successful verification without the error

## Expected Log Output (After Fix)
```
🔍 Calling VerifyData CAC verification for: RC69*** with field validation
📝 [AUDIT] Verification attempt logged: CAC - pending
[VerifydataClient] Verifying RC number: RC69***
[VerifydataClient] Attempt 1/3 for RC: RC69***
[VerifydataClient] Response status: 200 for RC: RC69***
✅ VerifyData verification completed: MATCHED
```

## Files Changed
- `server.js` - Fixed import statement (line 57-62)
- `CAC_VERIFICATION_DATA_FIELDS.md` - Added documentation for CAC data fields

## Related Issues Fixed
- ✅ Admin table now shows verification details (verificationDetails field added to API response)
- ✅ Empty response handling for non-existent RC numbers
- ✅ String "null" value handling
- ✅ DD-MM-YYYY date format support
- ✅ Case-insensitive company name matching
