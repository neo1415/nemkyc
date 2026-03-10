# KYC/NFIU Verification Fix

## Problem
NIN/CAC verification was not being triggered during KYC/NFIU form submission. The console showed no verification API calls to `/api/autofill/verify-nin` or `/api/autofill/verify-cac`.

## Root Cause
The `verificationData` object passed to `useEnhancedFormSubmit` hook was capturing the identity number (NIN/CAC) at hook initialization time using `formMethods.watch('NIN')` or `formMethods.watch('cacNumber')`. This meant:

1. When the hook was initialized, the form fields were empty
2. `verificationData.identityNumber` was set to `undefined` or empty string
3. When the user later filled in the NIN/CAC and submitted, the hook still had the old empty value
4. The verification check `verificationData?.identityNumber` evaluated to falsy, so verification was skipped

## Solution
Modified `useEnhancedFormSubmit.ts` to read the identity number directly from `formData` (which contains the current form values at submission time) instead of relying on the stale `verificationData.identityNumber`.

### Changes Made

#### 1. Updated `confirmSubmit` function (line ~335)
```typescript
// OLD CODE (BROKEN):
const needsVerification = 
  (formType === 'Individual KYC' || formType === 'Corporate KYC') &&
  verificationData?.identityNumber &&  // ❌ This is stale!
  !verificationData?.isVerified;

// NEW CODE (FIXED):
// Get the CURRENT identity number from formData
let currentIdentityNumber: string | undefined;
let currentIdentityType: 'NIN' | 'CAC' | undefined;
let currentIsVerified = verificationData?.isVerified || false;

if (formType === 'Individual KYC' || formType === 'Individual NFIU') {
  currentIdentityNumber = formData.NIN;  // ✅ Read from current formData
  currentIdentityType = 'NIN';
} else if (formType === 'Corporate KYC' || formType === 'Corporate NFIU') {
  currentIdentityNumber = formData.cacNumber;  // ✅ Read from current formData
  currentIdentityType = 'CAC';
}

const needsVerification = 
  currentIdentityNumber &&
  currentIdentityType &&
  !currentIsVerified;
```

#### 2. Updated pending submission processing (line ~165)
Applied the same fix to the pending submission processing logic to ensure verification works after authentication redirect.

#### 3. Added debug logging
Added console.log statements to help track verification flow:
- `🔍 Verifying ${currentIdentityType}: ${currentIdentityNumber}` - When verification starts
- `✅ Verification successful:` - When verification succeeds
- `❌ Verification or submission error:` - When verification fails

## Affected Forms
This fix applies to all 4 forms that require identity verification:
1. ✅ Individual KYC (`src/pages/kyc/IndividualKYC.tsx`)
2. ✅ Corporate KYC (`src/pages/kyc/CorporateKYC.tsx`)
3. ✅ Individual NFIU (`src/pages/nfiu/IndividualNFIU.tsx`)
4. ✅ Corporate NFIU (`src/pages/nfiu/CorporateNFIU.tsx`)

## Testing
To verify the fix works:

1. Open browser console (F12)
2. Fill out a KYC or NFIU form with a valid NIN/CAC
3. Submit the form
4. You should now see:
   - `🔍 Verifying NIN: [your-nin]` or `🔍 Verifying CAC: [your-cac]`
   - Network request to `/api/autofill/verify-nin` or `/api/autofill/verify-cac`
   - `✅ Verification successful:` with verification data
   - Form submission proceeding with enriched data

## Files Modified
- `src/hooks/useEnhancedFormSubmit.ts` - Fixed verification logic to read from current formData

## Files NOT Modified
The form components themselves did not need changes because they were already passing `verificationData` correctly. The issue was entirely in how the hook was using that data.
