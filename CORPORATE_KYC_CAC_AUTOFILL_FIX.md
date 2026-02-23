# Corporate KYC - CAC Auto-Fill Fix & NIN Field Removal

## Issues Fixed

### 1. CAC Auto-Fill Not Triggering
**Problem**: When typing a CAC/RC number in the Corporate KYC form and leaving the field (onBlur), the auto-fill verification was not triggering.

**Root Cause**: The `InputTriggerHandler` explicitly skips CAC verification because CAC verification requires BOTH:
- RC number (from the CAC field)
- Company name (from a separate field)

The trigger handler only has access to the field it's attached to (CAC field), so it cannot get the company name automatically.

**Solution**: Implemented a manual "Verify CAC" button next to the CAC number field that:
1. Gets both the CAC number and company name (from "Insured" field)
2. Validates that both fields are filled
3. Calls `executeAutoFillCAC()` with both parameters
4. Shows loading state during verification
5. Displays success/error feedback

### 2. NIN Field in Corporate KYC
**Problem**: There was a NIN (National Identification Number) field in the company information section of the Corporate KYC form. This doesn't make sense because:
- NIN is for individuals, not companies
- Companies have CAC/RC numbers, not NINs
- Directors (individuals) should have NINs, which they already do in the directors section

**Solution**: Commented out the NIN field from:
1. Validation schema (`corporateKYCSchema`)
2. Default values
3. Step field mappings
4. Form UI (company information section)
5. Summary display

The NIN field remains in the directors section where it belongs (for individual directors).

## Changes Made

### File: `src/pages/kyc/CorporateKYC.tsx`

#### 1. Validation Schema
```typescript
// Commented out NIN validation for company
// NINNumber: yup.string()
//   .required("NIN is required")
//   .matches(/^\d+$/, "NIN must contain only numbers")
//   .length(11, "NIN must be exactly 11 digits"),
```

#### 2. Default Values
```typescript
// Commented out NIN default value
// NINNumber: '',
```

#### 3. Step Field Mappings
```typescript
// Removed 'NINNumber' from step 0 field mappings
0: [
  'branchOffice', 'insured', 'officeAddress', 'ownershipOfCompany', 'contactPerson', 
  'website', 'incorporationNumber', 'incorporationState', 'dateOfIncorporationRegistration',
  'cacNumber', 'BVNNumber', 'contactPersonNo', 'taxIDNo', 'emailAddress', 'natureOfBusiness', 
  'estimatedTurnover', 'premiumPaymentSource', 'premiumPaymentSourceOther'
],
```

#### 4. Form UI - CAC Field with Verify Button
```typescript
<div className="flex gap-2">
  <Input
    id="cacNumber"
    ref={cacFieldRef}
    {...formMethods.register('cacNumber')}
    placeholder="Enter CAC/RC number"
  />
  <Button
    type="button"
    variant="outline"
    onClick={async () => {
      const cacNumber = formMethods.getValues('cacNumber');
      const companyName = formMethods.getValues('insured');
      
      if (!cacNumber || !companyName) {
        toast({
          title: 'Missing Information',
          description: 'Please enter both CAC number and Company Name (Insured field) before verifying',
          variant: 'destructive'
        });
        return;
      }
      
      await executeAutoFillCAC(cacNumber, companyName);
    }}
    disabled={autoFillStatus === 'loading'}
  >
    {autoFillStatus === 'loading' ? 'Verifying...' : 'Verify CAC'}
  </Button>
</div>
```

#### 5. Form UI - Removed NIN Field
```typescript
// Commented out NIN field from company information section
{/* <FormField
  name="NINNumber"
  label="NIN (National Identification Number)"
  required={true}
  maxLength={11}
/> */}
```

#### 6. Summary Display
```typescript
// Commented out NIN display in summary
{/* <div>
  <span className="font-medium text-gray-600">NIN:</span>
  <p className="text-gray-900">{data.NINNumber || 'Not provided'}</p>
</div> */}
```

## How to Use CAC Auto-Fill

1. Fill in the "Insured" field (company name)
2. Fill in the "CAC Number" field (RC number)
3. Click the "Verify CAC" button next to the CAC field
4. Wait for verification (button shows "Verifying..." with spinner)
5. On success:
   - Fields are auto-filled with verified data
   - Green checkmark appears next to "CAC Number" label
   - Success toast shows number of fields populated
   - Auto-filled fields have green background
6. On error:
   - Error message appears below the CAC field
   - Error toast shows the issue

## Why Manual Button Instead of Auto-Trigger?

The `InputTriggerHandler` is designed for single-field identifiers (like NIN) where:
- User enters the identifier
- User leaves the field (onBlur)
- Verification triggers automatically

For CAC verification, we need TWO fields:
- RC number (from CAC field)
- Company name (from Insured field)

The trigger handler cannot access other form fields, so we use a manual button that:
- Has access to the entire form via `formMethods.getValues()`
- Can validate both fields are filled
- Provides explicit user control over when verification happens
- Shows clear feedback during the process

## Testing Instructions

1. Navigate to Corporate KYC form
2. Verify that:
   - NIN field is NOT present in company information section
   - NIN field IS present in directors section (for individual directors)
   - CAC field has a "Verify CAC" button next to it
3. Test CAC verification:
   - Try clicking "Verify CAC" without filling fields → Should show error toast
   - Fill only CAC number → Should show error toast
   - Fill only company name → Should show error toast
   - Fill both fields with valid data → Should verify and auto-fill
4. Verify form submission works without NIN field in company section

## Status
✅ Complete - NIN field removed from company section, CAC verification button implemented
