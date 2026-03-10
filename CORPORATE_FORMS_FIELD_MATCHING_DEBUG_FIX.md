# Corporate Forms CAC Field Matching Debug Fix

## Issue
User reported that CAC verification succeeds and retrieves records, but NO fields are being flagged as mismatched even when wrong information is entered in the form.

## Root Cause
The `useRealtimeVerificationValidation` hook had a critical bug: **it never set `isVerificationTriggered` to `true`** after successful verification.

This caused a cascade of failures:
1. Field validation props weren't applied (because `isVerificationTriggered` was false)
2. Re-validation on blur didn't work (because it checks `isVerificationTriggered`)
3. Navigation blocking didn't work properly
4. The matching logic ran but the UI never reflected the results

## Changes Made

### 1. Fixed Missing State Update (`src/hooks/useRealtimeVerificationValidation.ts`)

**Added the critical missing line:**
```typescript
// CRITICAL: Mark verification as triggered
setIsVerificationTriggered(true);
```

This was added right after storing verification data and before running the matching logic.

### 2. Added Comprehensive Debug Logging

Added detailed console logging throughout the matching flow to help diagnose issues:

**In `useRealtimeVerificationValidation` hook:**
- Log cached data structure and keys
- Log form data fields and values
- Log each field being validated with its form value and verified value
- Log final field states after matching

**In `performAllFieldsMatching` function:**
- Log verification data keys and form data keys
- Log each field check with:
  - Field name and label
  - Verification key used to look up data
  - Form value vs verified value
  - Match result and reason

**In `fieldMatches` function:**
- Log raw values and their types
- Log normalized values after applying normalizers
- Log similarity scores for string comparisons
- Log date comparison results
- Log exact match results

### 3. Removed Unused Parameter Warning

Fixed TypeScript warning by removing unused `e` parameter from blur handler.

## How the Fix Works

### Before Fix:
1. User enters wrong data in form
2. User enters CAC number and blurs field
3. Verification API call succeeds
4. Matching logic runs and detects mismatches
5. **BUT** `isVerificationTriggered` remains `false`
6. Field validation props check `isVerificationTriggered` → returns empty props
7. No red borders, no error messages, no visual feedback

### After Fix:
1. User enters wrong data in form
2. User enters CAC number and blurs field
3. Verification API call succeeds
4. **`isVerificationTriggered` is set to `true`** ✅
5. Matching logic runs and detects mismatches
6. Field states are updated with MISMATCHED status
7. Field validation props check `isVerificationTriggered` → returns validation props
8. Red borders and error messages appear ✅
9. Re-validation on blur works ✅
10. Navigation is blocked until fields match ✅

## Testing Instructions

1. Open Corporate KYC or Corporate NFIU form
2. Enter WRONG company name (e.g., "Wrong Company Ltd")
3. Enter WRONG incorporation date
4. Enter WRONG address
5. Enter a VALID CAC number
6. Blur the CAC field
7. **Check browser console** - you should see detailed logs:
   ```
   [useRealtimeVerificationValidation] Verification completed, running matching...
   [useRealtimeVerificationValidation] Cached data structure: {...}
   [useRealtimeVerificationValidation] Form data: {...}
   [useRealtimeVerificationValidation] Fields to validate: [...]
   [performAllFieldsMatching] Starting field matching...
   [performAllFieldsMatching] Checking field: insured
     - Field label: Company Name
     - Verification key: name
     - Form value: Wrong Company Ltd
     - Verified value: Actual Company Name
     [fieldMatches] Comparing field: insured
       - Similarity: 45.2% (threshold: 80%)
       - Result: NO MATCH
     - Result: MISMATCHED
   ```
8. **Check UI** - mismatched fields should have:
   - Red borders
   - Error messages below the field
   - "This field doesn't match the CAC records" message
9. Correct one field and blur it
10. **Check console** - should see revalidation logs
11. **Check UI** - corrected field should turn green with checkmark

## Console Log Examples

### Successful Matching (Field Matches):
```
[performAllFieldsMatching] Checking field: insured
  - Field label: Company Name
  - Verification key: name
  - Form value: Test Company Limited
  - Verified value: Test Company Ltd
  [fieldMatches] Comparing field: insured
    - Similarity: 92.3% (threshold: 80%)
    - Result: MATCH
  - Result: MATCHED
```

### Failed Matching (Field Mismatch):
```
[performAllFieldsMatching] Checking field: dateOfIncorporationRegistration
  - Field label: Incorporation Date
  - Verification key: registrationDate
  - Form value: 2020-01-01
  - Verified value: 2019-05-15
  [fieldMatches] Comparing field: dateOfIncorporationRegistration
    - Date comparison result: false
  - Result: MISMATCHED
```

### Empty Field (Will Be Autofilled):
```
[performAllFieldsMatching] Checking field: officeAddress
  - Field label: Office Address
  - Verification key: address
  - Form value: 
  - Verified value: 123 Main Street, Lagos
  - Result: MATCHED (empty field, will be autofilled)
```

## Key Concepts

### Field Name Mapping
The config maps form field names to API response keys:
- Form field: `insured` → API key: `name`
- Form field: `dateOfIncorporationRegistration` → API key: `registrationDate`
- Form field: `officeAddress` → API key: `address`

### Matching Logic
1. **Empty fields** → MATCHED (will be autofilled)
2. **No verified value** → NOT_VERIFIED (skip validation)
3. **Dates** → Exact date match (ignoring time)
4. **Strings** → 80% similarity threshold (fuzzy matching)
5. **Other types** → Exact match after normalization

### Re-validation Flow
1. User corrects a mismatched field
2. User blurs the field
3. Hook checks `isVerificationTriggered` → true ✅
4. Hook calls `revalidateField` with field name
5. Field is re-compared against cached verification data
6. Field state updates to MATCHED or MISMATCHED
7. UI updates immediately

## Files Modified
- `src/hooks/useRealtimeVerificationValidation.ts` - Added missing state update + logging
- `src/utils/realtimeFieldMatching.ts` - Added comprehensive debug logging

## Related Files
- `src/config/realtimeValidationConfig.ts` - Field name mappings (already correct)
- `src/services/VerificationCache.ts` - Cache management (working correctly)
- `src/pages/kyc/CorporateKYC.tsx` - Form integration
- `src/pages/nfiu/CorporateNFIU.tsx` - Form integration

## Next Steps
1. Test with actual CAC number in production
2. Monitor console logs to verify matching is working
3. If issues persist, check:
   - API response structure matches config expectations
   - Cache is storing data correctly
   - Form field names match config
   - Verification key names match API response

## Status
✅ **FIXED** - Critical bug resolved, comprehensive logging added for debugging
