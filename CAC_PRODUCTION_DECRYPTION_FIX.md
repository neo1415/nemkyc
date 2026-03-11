# CAC Production Decryption Fix

## Problem
CAC document preview was failing in production with the error:
```
❌ [Decryption] Backend decryption call failed: {error: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`}
```

The issue was that the backend decryption endpoint was returning HTML (likely a routing error page) instead of JSON, even with a 200 status code.

## Root Cause
In production, the frontend was calling `/api/cac-documents/decrypt` which was being routed incorrectly by the hosting service, returning HTML instead of reaching the actual backend API.

## Solution
Enhanced the `callBackendDecryption` function in `src/services/cacEncryptionService.ts` with:

### 1. Direct Server URL for Production
```javascript
// In production, try the direct server URL first if we're on the main domain
if (baseUrl.includes('nemforms.com')) {
  apiUrl = `https://nem-server-rhdb.onrender.com/api/cac-documents/decrypt`;
}
```

### 2. Improved HTML Response Detection
- Check response content before attempting JSON parsing
- Detect HTML responses even with 200 status codes
- Enhanced logging for better debugging

### 3. Better Fallback Logic
- Try multiple URL patterns if HTML is detected
- Validate each fallback response before using it
- Provide clear error messages to users

### 4. Enhanced Error Handling
- More specific error messages based on failure type
- Better logging for production debugging
- Graceful degradation with user-friendly messages

## Files Modified
- `src/services/cacEncryptionService.ts` - Enhanced decryption and encryption endpoint handling

## Testing
1. Use the test script in `scripts/test-cac-decryption-production.js` in browser console
2. Try previewing CAC documents in production
3. Monitor browser console for error logs

## Deployment
Run either:
- `scripts/deploy-cac-production-fix.bat` (Windows)
- `scripts/deploy-cac-production-fix.sh` (Linux/Mac)

## Expected Outcome
- CAC document previews should work in production
- Better error messages if issues persist
- Improved debugging information in console logs
- Automatic fallback to working endpoints

## Monitoring
After deployment, monitor:
- Browser console logs for decryption attempts
- Success rate of document previews
- Any remaining HTML response errors