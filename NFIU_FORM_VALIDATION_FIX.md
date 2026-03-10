# NFIU Form Validation Fix

## Issue
The NFIU Corporate and Individual forms had a critical bug where clicking the "Next" button did nothing:
- No validation errors were displayed
- No toast notifications appeared
- The form wouldn't progress to the next step even when all fields were filled

## Root Cause
The `MultiStepForm` component requires a `stepFieldMappings` prop to know which fields to validate for each step. Without this prop, the component falls back to validating ALL fields (including fields from future steps that haven't been filled yet), causing validation to silently fail.

## Solution
Added `stepFieldMappings` configuration to both NFIU forms:

### CorporateNFIU.tsx
```typescript
const stepFieldMappings = {
  0: [ // Company Information
    'insured', 'officeAddress', 'ownershipOfCompany', 'website', 'incorporationNumber',
    'incorporationState', 'dateOfIncorporationRegistration', 'contactPersonNo',
    'businessTypeOccupation', 'taxIDNo', 'emailAddress', 'premiumPaymentSource',
    'premiumPaymentSourceOther'
  ],
  1: ['directors'], // Directors array validation
  2: [ // Account Details
    'localBankName', 'localAccountNumber', 'localBankBranch', 'localAccountOpeningDate',
    'foreignBankName', 'foreignAccountNumber', 'foreignBankBranch', 'foreignAccountOpeningDate'
  ],
  3: ['verificationDocUrl'] // Documents
};
```

### IndividualNFIU.tsx
```typescript
const stepFieldMappings = {
  0: [ // Personal Information
    'firstName', 'middleName', 'lastName', 'dateOfBirth', 'placeOfBirth', 'nationality',
    'occupation', 'NIN', 'BVN', 'taxIDNo', 'identificationType', 'idNumber', 'issuingBody',
    'issuedDate', 'expiryDate', 'emailAddress', 'GSMno', 'sourceOfIncome', 'sourceOfIncomeOther'
  ],
  1: ['identification'] // Documents
};
```

### Additional Fix
Added toast to window object so MultiStepForm can display validation error notifications:
```typescript
useEffect(() => {
  (window as any).toast = toast;
  return () => {
    delete (window as any).toast;
  };
}, [toast]);
```

## Expected Behavior After Fix
1. When clicking "Next" with missing required fields:
   - Fields with errors are highlighted in red
   - Error messages appear below each invalid field
   - A toast notification appears at the bottom right: "Validation Error - Please fill all required fields before proceeding"

2. When clicking "Next" with all required fields filled:
   - Form progresses to the next step
   - Progress bar updates
   - Step title changes

3. When clicking "Submit" on the final step:
   - Form validates all fields
   - Shows summary dialog if validation passes
   - Shows error toast if validation fails

## Testing
To verify the fix:
1. Navigate to NFIU Corporate or Individual form
2. Click "Next" without filling any fields → Should show validation errors and toast
3. Fill only some required fields and click "Next" → Should show errors for missing fields
4. Fill all required fields on step 1 and click "Next" → Should progress to step 2
5. Complete all steps and submit → Should show summary dialog

## Files Modified
- `src/pages/nfiu/CorporateNFIU.tsx`
- `src/pages/nfiu/IndividualNFIU.tsx`

## Reference
This fix follows the same pattern used in:
- `src/pages/kyc/CorporateKYC.tsx`
- `src/pages/kyc/IndividualKYC.tsx`
- `src/pages/cdd/BrokersCDD.tsx`
- All claim forms (MotorClaim, PublicLiabilityClaim, etc.)
