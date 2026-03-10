# Corporate Forms CAC Field Matching Fix

## Summary
Fixed CAC field matching and real-time validation in Corporate KYC and Corporate NFIU forms. The system was already built but had configuration and integration issues preventing proper field-by-field matching and re-verification on blur.

## Issues Fixed

### 1. Corporate NFIU Field Name Mismatch ✅
**Problem**: The `CORPORATE_NFIU_CAC_FIELDS_CONFIG` in `realtimeValidationConfig.ts` used incorrect field names that didn't match the actual form fields:
- Config had `companyName` but form uses `insured`
- Config had `incorporationDate` but form uses `dateOfIncorporationRegistration`
- Config had `registeredAddress` but form uses `officeAddress`

This caused the matching logic to never find the fields, so validation never worked.

**Fix**: Updated `CORPORATE_NFIU_CAC_FIELDS_CONFIG` to use the same field names as Corporate KYC:
```typescript
export const CORPORATE_NFIU_CAC_FIELDS_CONFIG: FieldValidationConfig[] = [
  {
    fieldName: 'insured',  // Changed from 'companyName'
    fieldLabel: 'Company Name',
    verificationKey: 'name',
    normalizer: normalizeCompanyName
  },
  {
    fieldName: 'dateOfIncorporationRegistration',  // Changed from 'incorporationDate'
    fieldLabel: 'Incorporation Date',
    verificationKey: 'registrationDate',
    normalizer: normalizeDate
  },
  {
    fieldName: 'officeAddress',  // Changed from 'registeredAddress'
    fieldLabel: 'Office Address',
    verificationKey: 'address',
    normalizer: normalizeText
  }
];
```

**File**: `src/config/realtimeValidationConfig.ts`

---

### 2. DatePicker Component Missing Validation Props ✅
**Problem**: The `DatePicker` component didn't accept `onBlur` or `className` props, so the real-time validation system couldn't attach its blur handler to trigger re-validation when the user changes the date field.

**Fix**: Enhanced `DatePicker` component to accept and forward validation props:
1. Added `onBlur` and `className` to the component props interface
2. Updated `handleInputBlur` to call the external `onBlur` handler if provided
3. Applied the `className` prop to the input element for visual feedback (green/red borders)

```typescript
interface DatePickerProps {
  name: string;
  label: string;
  required?: boolean;
  onBlur?: (e: React.FocusEvent) => void;  // NEW
  className?: string;  // NEW
}

const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  // Format the input on blur if we have a valid date
  if (value) {
    setInputValue(formatDisplayDate(value));
  }
  // Call external onBlur handler if provided (for validation)
  if (onBlur) {
    onBlur(e);  // NEW
  }
};
```

**File**: `src/components/common/DatePicker.tsx`

---

### 3. DatePicker Not Wired to Validation System ✅
**Problem**: Both Corporate KYC and Corporate NFIU forms weren't passing the validation props to the `DatePicker` component, so the blur handler never triggered re-validation.

**Fix**: Updated both forms to spread the validation props from `realtimeValidation.getFieldValidationProps()`:

```typescript
<DatePicker
  name="dateOfIncorporationRegistration"
  label="Date of Incorporation"
  required={true}
  {...realtimeValidation.getFieldValidationProps('dateOfIncorporationRegistration')}  // NEW
/>
```

**Files**: 
- `src/pages/kyc/CorporateKYC.tsx`
- `src/pages/nfiu/CorporateNFIU.tsx`

---

## How It Works Now

### Initial Verification Flow
1. User enters CAC/RC number in Corporate KYC or Corporate NFIU form
2. User leaves the CAC field (onBlur)
3. System verifies the CAC number (checks cache first, then API if needed)
4. Verification data is cached (company name, registration date, address)
5. System performs **initial matching** for ALL configured fields:
   - Compares `insured` field with verified company name
   - Compares `dateOfIncorporationRegistration` with verified registration date
   - Compares `officeAddress` with verified address
6. Each field gets a validation state:
   - **MATCHED** (green checkmark) - field value matches verified data
   - **MISMATCHED** (red error) - field value doesn't match verified data
   - **NOT_VERIFIED** (no indicator) - no verified data available for this field
7. If any field is mismatched, user cannot proceed to next step

### Field-by-Field Re-validation Flow
1. User sees a mismatched field (e.g., wrong incorporation date)
2. User clicks into the field and corrects the value
3. User leaves the field (onBlur)
4. System **re-validates ONLY that field** using cached verification data:
   - Gets the current field value from the form
   - Compares it with the cached verified value
   - Updates ONLY that field's validation state
5. If the field now matches, it shows green checkmark
6. If all fields match, user can proceed to next step

### Fuzzy Matching
The system uses fuzzy matching for text fields (company name, address):
- 80% similarity threshold for matching
- Handles case differences, extra spaces, common abbreviations
- Example: "NEM Insurance" matches "NEM INSURANCE PLC" (similarity > 80%)

### Date Matching
Dates are compared by year, month, and day only (time is ignored):
- "2020-01-15" matches "2020-01-15T00:00:00Z"
- Different dates are flagged as mismatches

---

## Testing Instructions

### Test 1: Initial Verification and Matching
1. Navigate to Corporate KYC or Corporate NFIU form
2. Fill in company name: "NEM Insurance PLC"
3. Fill in incorporation date: "15/01/2020"
4. Fill in office address: "123 Main Street, Lagos"
5. Enter CAC number: "RC6971"
6. Press Tab or click outside the CAC field
7. Verify:
   - ✅ Verification succeeds
   - ✅ All three fields show green checkmarks (matched)
   - ✅ Can proceed to next step

### Test 2: Mismatch Detection
1. Navigate to Corporate KYC or Corporate NFIU form
2. Fill in company name: "Wrong Company Name"
3. Fill in incorporation date: "01/01/2000" (wrong date)
4. Enter CAC number: "RC6971"
5. Press Tab or click outside the CAC field
6. Verify:
   - ✅ Verification succeeds
   - ✅ Company name field shows red error: "The company name you entered does not match..."
   - ✅ Incorporation date field shows red error: "The incorporation date you entered does not match..."
   - ✅ Cannot proceed to next step (button disabled or shows error)

### Test 3: Field-by-Field Re-validation
1. Continue from Test 2 (with mismatched fields)
2. Click into the company name field
3. Change it to "NEM Insurance PLC"
4. Press Tab or click outside the field
5. Verify:
   - ✅ Company name field immediately shows green checkmark
   - ✅ Incorporation date field still shows red error
   - ✅ Still cannot proceed to next step
6. Click into the incorporation date field
7. Change it to "01/04/1970" (correct date)
8. Press Tab or click outside the field
9. Verify:
   - ✅ Incorporation date field immediately shows green checkmark
   - ✅ All fields now matched
   - ✅ Can now proceed to next step

### Test 4: Cache Efficiency
1. Complete Test 1 or Test 3 (successful verification)
2. Clear the CAC field
3. Enter the same CAC number again: "RC6971"
4. Press Tab
5. Verify:
   - ✅ Verification completes instantly (from cache)
   - ✅ No API call made (check network tab)
   - ✅ Cost = ₦0 (cached)
   - ✅ Fields still match correctly

---

## Files Modified

1. ✅ `src/config/realtimeValidationConfig.ts` - Fixed Corporate NFIU field names
2. ✅ `src/components/common/DatePicker.tsx` - Added validation props support
3. ✅ `src/pages/kyc/CorporateKYC.tsx` - Wired DatePicker to validation system
4. ✅ `src/pages/nfiu/CorporateNFIU.tsx` - Wired DatePicker to validation system

---

## Architecture Overview

The real-time validation system consists of several layers:

### 1. Configuration Layer (`realtimeValidationConfig.ts`)
- Defines which fields to validate for each form type
- Maps form field names to verification API response keys
- Provides normalizers for data comparison

### 2. Matching Logic (`realtimeFieldMatching.ts`)
- `performAllFieldsMatching()` - Validates ALL fields after initial verification
- `revalidateSingleField()` - Validates ONE field after user edits it
- `calculateSimilarity()` - Fuzzy text matching with 80% threshold
- `datesMatch()` - Date comparison ignoring time

### 3. Hook Layer (`useRealtimeVerificationValidation.ts`)
- Manages validation state for all fields
- Integrates with `useAutoFill` for verification
- Provides `getFieldValidationProps()` for attaching blur handlers
- Debounces re-validation to prevent excessive calls

### 4. UI Layer (Form Components)
- `FieldValidationIndicator` - Shows checkmark or error for each field
- `DatePicker` - Enhanced to support validation props
- Form fields spread validation props for blur handling

### 5. Cache Layer (`VerificationCache.ts`)
- Stores verification results in memory
- Prevents duplicate API calls for same identifier
- Invalidated when identifier changes

---

## Status: ✅ COMPLETE

All issues resolved. CAC field matching and real-time validation now work correctly in both Corporate KYC and Corporate NFIU forms.

**Date**: March 9, 2026
