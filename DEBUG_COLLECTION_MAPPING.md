# Debug Collection Mapping

## Changes Made

Added debug logging to `getFirestoreCollection()` function in server.js to help identify the issue.

## What to Do Next

1. **Restart your server** (you mentioned you already did this)
2. **Submit a test form** (try Corporate CDD or Individual CDD)
3. **Check your server console logs** - you should see:
   ```
   🔍 getFirestoreCollection called with formType: Corporate CDD
   🔍 formTypeLower: corporate cdd
   ✅ Matched: Corporate CDD (or NAICOM Corporate CDD) -> corporate-kyc
   📂 Using collection: corporate-kyc
   ```

## Expected Collection Mappings

| Form Type | Should Submit To | Should Fetch From |
|-----------|-----------------|-------------------|
| Individual KYC | `Individual-kyc-form` | `Individual-kyc-form` |
| Individual CDD | `individual-kyc` | `individual-kyc` |
| Corporate KYC | `corporate-kyc-form` | `corporate-kyc-form` |
| Corporate CDD | `corporate-kyc` | `corporate-kyc` |
| NAICOM Corporate CDD | `corporate-kyc` | `corporate-kyc` |

## Troubleshooting

### If forms are still going to wrong collections:

1. **Check server logs** - Look for the debug messages above
2. **Verify server restart** - Make sure you're running the updated server.js
3. **Check which form you tested** - Tell me:
   - Which form did you submit?
   - What collection did it go to?
   - What collection should it have gone to?
4. **Check browser console** - Look for any errors
5. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)

### Possible Issues:

1. **Server not restarted properly** - Kill the process and restart
2. **Multiple server instances running** - Check if old server is still running
3. **Cached build** - If using a build process, rebuild the server
4. **Wrong server file** - Make sure you're editing the correct server.js (not src/server.js)

## What I Changed

### server.js - getFirestoreCollection() function:
- Added console.log statements to track what's happening
- Confirmed mappings:
  - Individual CDD → `'individual-kyc'`
  - Corporate CDD → `'corporate-kyc'`
  - NAICOM Corporate CDD → `'corporate-kyc'` (same as Corporate CDD)

### Admin Tables (already correct):
- `CorporateCDDTable.tsx` fetches from `'corporate-kyc'` ✅
- `AdminIndividualCDDTable.tsx` fetches from `'individual-kyc'` ✅

## Next Steps

Please:
1. Restart server
2. Submit a test form
3. Share the server console output with me
4. Tell me which collection the form actually went to (check Firestore)
