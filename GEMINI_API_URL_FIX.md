# Gemini Document Verification API URL Fix

## Problem Summary
**Critical Production Bug**: Gemini document verification was failing in production with the error:
```
Making Gemini API call to backend: undefined/api/gemini/generate
```

The backend URL was showing as `undefined`, causing API calls to fail with HTML responses instead of JSON.

## Root Cause
The issue was in `src/services/geminiOCREngine.ts` at line 273:

```typescript
// ❌ BEFORE (Broken in production)
const url = `${import.meta.env.VITE_API_URL}/api/gemini/generate`;
```

**Why this failed:**
1. The code only checked `VITE_API_URL` environment variable
2. In `.env.production`, the primary variable is `VITE_API_BASE_URL` (not `VITE_API_URL`)
3. While both variables exist in `.env.production`, Vite may not load both in all build scenarios
4. This caused `import.meta.env.VITE_API_URL` to be `undefined` in production
5. Result: URL became `undefined/api/gemini/generate`

## Solution
Updated the code to follow the standard pattern used throughout the codebase:

```typescript
// ✅ AFTER (Fixed)
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';
const url = `${apiBaseUrl}/api/gemini/generate`;
```

**Why this works:**
1. **Primary**: Checks `VITE_API_BASE_URL` first (the standard variable)
2. **Fallback**: Falls back to `VITE_API_URL` if primary is not set
3. **Development**: Uses `localhost:3001` if neither is set
4. **Consistency**: Matches the pattern used in all other services

## Files Changed

### Modified
1. **`src/services/geminiOCREngine.ts`** - Fixed API URL construction with proper fallback logic (PRIMARY FIX)
2. **`src/services/userManagementService.ts`** - Added VITE_API_BASE_URL fallback (PREVENTIVE FIX)
3. **`src/components/auth/MFAModal.tsx`** - Added VITE_API_BASE_URL fallback (PREVENTIVE FIX)

### Added
- `src/__tests__/gemini-document-verification/apiUrlConfiguration.test.ts` - Test suite to prevent regression
- `GEMINI_API_URL_FIX.md` - This documentation file

## Verification

### Test Results
All 6 tests pass:
- ✅ Uses VITE_API_BASE_URL when available (production scenario)
- ✅ Fallbacks to VITE_API_URL when VITE_API_BASE_URL is not set
- ✅ Uses localhost fallback when no environment variables are set
- ✅ Prefers VITE_API_BASE_URL over VITE_API_URL when both are set
- ✅ Never produces undefined in the URL
- ✅ Matches the pattern used by other services in the codebase

### Expected Behavior After Fix

#### Production
```
Making Gemini API call to backend: https://nem-server-rhdb.onrender.com/api/gemini/generate
```

#### Development
```
Making Gemini API call to backend: http://localhost:3001/api/gemini/generate
```

## Environment Variables

### .env.production
```bash
# Both variables are set for compatibility
VITE_API_BASE_URL=https://nem-server-rhdb.onrender.com
VITE_API_URL=https://nem-server-rhdb.onrender.com
```

The fix ensures that if either variable is available, the correct URL will be constructed.

## Related Services
The following services already use this pattern correctly:
- `src/services/autoFill/VerificationAPIClient.ts` ✅
- `src/services/emailService.ts` ✅
- `src/services/smsService.ts` ✅
- `src/hooks/useEnhancedFormSubmit.ts` ✅
- `src/hooks/useAuthRequiredSubmit.ts` ✅
- `src/config/constants.ts` (centralized constant) ✅

The following services were fixed in this update:
- `src/services/geminiOCREngine.ts` ✅ FIXED
- `src/services/userManagementService.ts` ✅ FIXED
- `src/components/auth/MFAModal.tsx` ✅ FIXED

## Deployment Notes

### No Additional Steps Required
- The fix is purely frontend code
- No backend changes needed
- No environment variable changes needed
- The existing `.env.production` file already has the correct values

### Testing in Production
After deployment, verify:
1. Check browser console for the log: `Making Gemini API call to backend: https://nem-server-rhdb.onrender.com/api/gemini/generate`
2. Ensure no `undefined` appears in the URL
3. Verify document verification completes successfully
4. Check that API responses are JSON (not HTML error pages)

## Prevention
The test suite (`apiUrlConfiguration.test.ts`) will catch this issue in the future if:
- Someone removes the fallback logic
- The environment variable pattern changes
- New services are added without proper URL configuration

## Impact
- **Severity**: Critical (P0) - Blocked all document verification in production
- **Scope**: Gemini document verification feature only
- **Users Affected**: All users attempting document verification
- **Downtime**: From deployment until fix is applied

## Related Issues
- Backend endpoint is working correctly (verified in previous fixes)
- This was purely a frontend configuration issue
- No changes needed to `.env.production` file
