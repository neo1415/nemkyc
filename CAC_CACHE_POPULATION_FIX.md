# CAC Verification Cache Population Fix

## Problem Analysis

The real-time verification field matching was not working because of a **cache synchronization issue** between two separate systems:

### The Two Cache Systems

1. **Backend Database Cache** (Firestore `verified-identities` collection)
   - Used by VerificationAPIClient
   - Stores verification data in database
   - Prevents duplicate API calls to Datapro/VerifyData
   - Logs show "CACHE HIT (cost = ₦0)"

2. **Frontend Memory Cache** (`VerificationCache` singleton)
   - Used by `useRealtimeVerificationValidation` hook
   - In-memory Map for session-duration caching
   - Used for field matching logic
   - Was NEVER being populated!

### The Bug

**Flow that was happening:**
1. User enters CAC number "RC6971" and blurs
2. `InputTriggerHandler` calls `VerificationAPIClient.verifyCAC("RC6971")`
3. Backend checks database cache, finds data, returns it
4. `InputTriggerHandler` receives verification data
5. AutoFill populates form fields
6. **BUT** verification data is NOT stored in frontend `VerificationCache`
7. User blurs from CAC field again
8. `useRealtimeVerificationValidation` checks frontend `VerificationCache` for "RC6971"
9. **Cache miss!** No data found
10. Field matching never happens

### Root Cause

The `InputTriggerHandler` was receiving verification data from the API but never storing it in the frontend `VerificationCache` singleton that the realtime validation hook depends on.

## Solution

Added cache population in `InputTriggerHandler` after successful verification:

```typescript
// Handle response
if (response.success && response.data) {
  console.log('[InputTriggerHandler] Verification successful');
  
  // Store in frontend cache for realtime validation
  const cache = getVerificationCache();
  cache.set(value, response.data, this.config.identifierType);
  console.log('[InputTriggerHandler] Stored verification data in frontend cache for:', value);
  
  // Update last verified value
  this.lastVerifiedValue = value;

  // Call onVerificationComplete callback
  if (this.config.onVerificationComplete) {
    this.config.onVerificationComplete(true, response.data);
  }
}
```

## How It Works Now

**Correct flow:**
1. User enters CAC number "RC6971" and blurs
2. `InputTriggerHandler` calls `VerificationAPIClient.verifyCAC("RC6971")`
3. Backend checks database cache, finds data, returns it
4. `InputTriggerHandler` receives verification data
5. **NEW:** Stores data in frontend `VerificationCache` with key "RC6971"
6. AutoFill populates form fields
7. User blurs from CAC field again (or modifies a field)
8. `useRealtimeVerificationValidation` checks frontend `VerificationCache` for "RC6971"
9. **Cache hit!** Data found
10. Hook retrieves form values using `formMethods.getValues()`
11. Hook calls `performAllFieldsMatching()` to compare form vs verified data
12. Mismatched fields get red borders, matched fields get green borders

## Files Modified

- `src/services/autoFill/InputTriggerHandler.ts`
  - Added import for `getVerificationCache`
  - Added cache population after successful verification

## Testing

To verify the fix works:

1. Open Corporate KYC form
2. Enter wrong company name (e.g., "city covenant")
3. Enter valid CAC number (e.g., "RC6971")
4. Blur from CAC field
5. Check console logs - should see:
   ```
   [InputTriggerHandler] Verification successful
   [InputTriggerHandler] Stored verification data in frontend cache for: RC6971
   [useRealtimeVerificationValidation] Checking for verification data: RC6971
   [VerificationCache] Cache hit for identifier: RC6971
   [useRealtimeVerificationValidation] ===== FORM DATA RETRIEVED =====
   [useRealtimeVerificationValidation] Form data: {...}
   [useRealtimeVerificationValidation] Field states after matching: {...}
   ```
6. Verify mismatched fields show red borders
7. Correct the company name to "NEM Insurance PLC"
8. Blur from the field
9. Verify field now shows green border

## Why This Was Hard to Debug

1. **Two separate cache systems** with similar names but different purposes
2. **"CACHE HIT" logs** were misleading - they referred to backend database cache, not frontend cache
3. **No error messages** - the system silently failed when cache was empty
4. **Complex flow** across multiple files and systems
5. **Logs didn't show** what was missing - just "No cached data found"

The fix was simple once the root cause was identified: just populate the frontend cache after verification succeeds.
