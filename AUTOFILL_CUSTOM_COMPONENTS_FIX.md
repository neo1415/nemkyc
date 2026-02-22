# Auto-Fill Custom Components Fix

## Problem Summary

The NIN auto-fill feature was only filling 4 fields (firstName, middleName, lastName, dateOfBirth) instead of the expected 6 fields. The missing fields were:
- **gender** - Not being auto-filled
- **phoneNumber** (GSMno) - Not being auto-filled

## Root Cause Analysis

### 1. Gender Field Issue
The gender field uses a Shadcn UI `FormSelect` component, which renders as a `<button>` element (not a standard `<select>` element). The `findFormField()` function only searched for `input, select, textarea` elements, so it couldn't find the gender field.

### 2. Phone Number Field Issue
The phone number field name is `GSMno` in the form, but the field matching abbreviations didn't include this variation. This was already fixed by adding `GSMno`, `gsmno`, `GSM`, `gsm` to the abbreviations list, but required a browser refresh to take effect.

### 3. Gender Value Format Issue
The API returns gender as "m" or "f", which the normalizer converted to "male" or "female" (lowercase). However, the form expects "Male" or "Female" (capitalized) to match the SelectItem values.

## Solution Implemented

### 1. React Hook Form Integration
Enhanced the auto-fill system to support React Hook Form's `setValue()` function for custom components:

**Files Modified:**
- `src/services/autoFill/FormPopulator.ts`
  - Added `reactHookFormSetValue` property
  - Added `setReactHookFormSetValue()` method
  - Updated `populateFields()` to call `setValue()` for custom components

- `src/services/autoFill/AutoFillEngine.ts`
  - Added `reactHookFormSetValue` to `AutoFillEngineConfig` interface
  - Updated constructor to pass `setValue` to FormPopulator

- `src/hooks/useAutoFill.ts`
  - Added `reactHookFormSetValue` to `UseAutoFillConfig` interface
  - Updated hook to accept and pass `setValue` to AutoFillEngine

- `src/pages/kyc/IndividualKYC.tsx`
  - Updated `useAutoFill()` call to pass `formMethods.setValue`

- `src/pages/kyc/CorporateKYC.tsx`
  - Updated `useAutoFill()` call to pass `formMethods.setValue`

### 2. Virtual Input Fallback
Updated `findFormField()` to create a virtual input element when no DOM element is found. This allows the field mapping to proceed even for custom components, while React Hook Form's `setValue()` handles the actual value setting.

**File Modified:**
- `src/utils/autoFill/fieldMatching.ts`
  - Added step 6: Create virtual input for React Hook Form custom components
  - Virtual inputs are marked with `data-virtual="true"` attribute

### 3. Gender Value Normalization
Fixed the gender normalizer to return capitalized values that match the form's SelectItem values.

**File Modified:**
- `src/utils/autoFill/normalizers.ts`
  - Changed `normalizeGender()` to return "Male" or "Female" (capitalized) instead of "male" or "female" (lowercase)

## How It Works

1. **Standard Input Fields** (firstName, lastName, etc.)
   - `findFormField()` finds the actual input element
   - `FormPopulator` sets the value directly on the DOM element
   - Events are dispatched to trigger validation

2. **Custom Components** (gender Select, dateOfBirth DatePicker)
   - `findFormField()` creates a virtual input element (or finds the hidden input for DatePicker)
   - `FormPopulator` calls React Hook Form's `setValue(fieldName, value)`
   - React Hook Form updates the component state
   - The custom component re-renders with the new value

## Expected Results

After these changes, NIN auto-fill should populate **6 fields**:
1. ✅ firstName
2. ✅ middleName
3. ✅ lastName
4. ✅ gender (now working via React Hook Form setValue)
5. ✅ dateOfBirth (already working - DatePicker has hidden input)
6. ✅ phoneNumber/GSMno (now working - abbreviation added)

## Testing Instructions

1. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Navigate to Individual KYC form
3. Enter a valid 11-digit NIN
4. Wait for verification to complete
5. Verify that all 6 fields are auto-filled:
   - First Name
   - Middle Name
   - Last Name
   - Gender (should show "Male" or "Female" in the dropdown)
   - Date of Birth (should show formatted date)
   - Mobile Number (should show phone number)

## CAC Verification

The same fix applies to CAC verification in the Corporate KYC form. Custom components in that form will also benefit from the React Hook Form integration.

## Technical Notes

- The virtual input approach is a fallback mechanism that allows the field mapping logic to proceed even when no actual DOM element exists
- React Hook Form's `setValue()` is the primary mechanism for updating custom components
- The solution is backward compatible - standard input fields continue to work as before
- The fix handles both controlled and uncontrolled components gracefully

## Related Files

- `AUTOFILL_FIELD_MAPPING_FIX.md` - Previous diagnosis of the issue
- `AUTOFILL_CACHE_FIX_SUMMARY.md` - Cache implementation fix
- `AUTOFILL_FIXES_SUMMARY.md` - Earlier auto-fill fixes
