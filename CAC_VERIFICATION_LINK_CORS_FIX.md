# CAC Verification Link CORS Fix

## Issue Summary

Users were receiving an "Invalid Link" error when clicking CAC verification links sent to customers. The error was caused by a CORS (Cross-Origin Resource Sharing) policy blocking requests from `https://nemforms.com` to the backend server at `https://nem-server-rhdb.onrender.com`.

### Error Message
```
Access to fetch at 'https://nem-server-rhdb.onrender.com/api/identity/verify/__HSrU4s3Bl_aHtj9fAE4zs-hO1_bRr3tXMhOp6RNbE' 
from origin 'https://nemforms.com' has been blocked by CORS policy
```

## Root Cause

While `https://nemforms.com` was already in the `allowedOrigins` list in the CORS configuration, the CORS middleware was not properly handling:

1. **Missing standard headers**: The `Accept` and `Origin` headers were not in the `allowedHeaders` list
2. **Preflight requests**: No explicit OPTIONS handler for the verification endpoint
3. **CORS header visibility**: No logging to debug CORS issues in production

## Changes Made

### 1. Updated CORS Configuration (server.js, lines 698-715)

Added missing standard headers to the `allowedHeaders` array:

```javascript
allowedHeaders: [
  'Content-Type',
  'CSRF-Token',
  'X-Requested-With',
  'Authorization',
  'Accept',        // ✅ ADDED
  'Origin',        // ✅ ADDED
  'x-timestamp',
  'x-nonce',
  'x-request-id',
  'x-idempotency-key',
  'Idempotency-Key'
],
```

### 2. Added Explicit OPTIONS Handler (server.js, before line 10767)

Added a dedicated handler for CORS preflight requests:

```javascript
/**
 * OPTIONS /api/identity/verify/:token
 * Handle preflight requests for CORS
 */
app.options('/api/identity/verify/:token', (req, res) => {
  console.log('✅ CORS Preflight: /api/identity/verify/:token from origin:', req.headers.origin);
  res.status(204).send();
});
```

### 3. Added CORS Debug Logging (server.js, line 10769-10775)

Added logging to help diagnose CORS issues in production:

```javascript
// Log CORS headers for debugging
console.log('🔍 CORS Debug - Request Origin:', req.headers.origin);
console.log('🔍 CORS Debug - Response Headers:', {
  'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
  'Access-Control-Allow-Credentials': res.getHeader('Access-Control-Allow-Credentials')
});
```

## Verification Steps

After deploying these changes to Render:

1. **Test the verification link**: Click on a CAC verification link sent to a customer
2. **Check browser console**: Verify no CORS errors appear
3. **Check server logs**: Look for the CORS debug logs showing:
   - `✅ CORS Preflight: /api/identity/verify/:token from origin: https://nemforms.com`
   - `✅ CORS: Allowing whitelisted origin: https://nemforms.com`
   - `🔍 CORS Debug - Request Origin: https://nemforms.com`
4. **Verify functionality**: Ensure the verification page loads correctly and displays customer information

## Deployment Instructions

1. **Commit the changes**:
   ```bash
   git add server.js
   git commit -m "Fix CORS issue for CAC verification links"
   git push origin main
   ```

2. **Render will auto-deploy** the changes (if auto-deploy is enabled)

3. **Monitor the deployment**:
   - Go to Render dashboard
   - Check the deployment logs for any errors
   - Wait for the deployment to complete

4. **Test immediately** after deployment:
   - Request a new CAC verification link from the admin dashboard
   - Click the link and verify it works without CORS errors

## Related Files

- `server.js` - CORS configuration and verification endpoint
- `src/pages/public/CustomerVerificationPage.tsx` - Frontend verification page
- `.env.production` - Production environment variables (VITE_API_BASE_URL)

## Additional Notes

- The CORS configuration already had `https://nemforms.com` in the allowed origins list
- The issue was specifically with missing standard headers and lack of explicit preflight handling
- The debug logging will help diagnose any future CORS issues quickly

## Rollback Plan

If this fix causes any issues:

1. Revert the commit:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. The previous CORS configuration will be restored

## Success Criteria

✅ Customers can click verification links without CORS errors
✅ The verification page loads and displays customer information
✅ Customers can submit their NIN/CAC for verification
✅ No CORS-related errors in browser console or server logs
