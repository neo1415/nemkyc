# NFIU Corporate Table Field Verification & Fix

## Problem Summary

The Corporate NFIU table was updated by copying columns from Corporate KYC table WITHOUT verifying against the actual Corporate NFIU form. This resulted in:

1. **Wrong column order** - Account details before directors (should be directors before account details)
2. **Non-existent fields** - Table references fields that don't exist in the form
3. **Wrong formMappings.ts section order** - Doesn't match form structure

## Actual Corporate NFIU Form Structure

Based on `src/pages/nfiu/CorporateNFIU.tsx`, the form has these sections IN THIS ORDER:

### Step 1: Company Information
- `insured` (Company Name)
- `officeAddress`
- `ownershipOfCompany`
- `website`
- `incorporationNumber` (CAC/Incorporation Number)
- `incorporationState`
- `dateOfIncorporationRegistration`
- `contactPersonNo` (Company Contact Number)
- `businessTypeOccupation`
- `taxIDNo`
- `emailAddress`
- `premiumPaymentSource`
- `premiumPaymentSourceOther` (conditional)

**NOTE**: NO company-level `cacNumber`, `BVNNumber`, or `NINNumber` fields exist

### Step 2: Directors Information (BEFORE Account Details)
Array of directors with these fields:
- `firstName`, `middleName`, `lastName`
- `dob` (Date of Birth)
- `placeOfBirth`
- `nationality`
- `country`
- `occupation`
- `email`
- `phoneNumber`
- `BVNNumber` (director's BVN)
- `NINNumber` (director's NIN)
- `residentialAddress`
- `taxIDNumber`
- `idType`, `idNumber`, `issuingBody`
- `issuedDate`, `expiryDate`
- `sourceOfIncome`, `sourceOfIncomeOther` (conditional)

**NOTE**: NO `employersName` or `employersPhoneNumber` fields exist for directors

### Step 3: Account Details (AFTER Directors)
**Local/Naira Account (Required):**
- `localBankName`
- `localAccountNumber`
- `localBankBranch`
- `localAccountOpeningDate`

**Foreign/Domiciliary Account (Optional):**
- `foreignBankName`
- `foreignAccountNumber`
- `foreignBankBranch`
- `foreignAccountOpeningDate`

### Step 4: Document Upload
- `verificationDocUrl` (CAC Verification Document)

### Step 5: Declaration
- `agreeToDataPrivacy`
- `signature`

## Fields That DON'T EXIST in Corporate NFIU Form

These fields are in the table but NOT in the form (copied from Corporate KYC):
1. `cacNumber` (company-level) - form only has `incorporationNumber`
2. `BVNNumber` (company-level) - only exists in directors array
3. `NINNumber` (company-level) - only exists in directors array
4. `employersName` (director field) - does NOT exist
5. `employersPhoneNumber` (director field) - does NOT exist

## Required Fixes

### Fix 1: AdminCorporateNFIUTable.tsx Column Order

**Current order (WRONG):**
1. Actions
2. Created At
3. Company Info fields
4. Account Details (local + foreign)
5. Directors

**Correct order (matches form):**
1. Actions
2. Created At
3. Company Info fields (remove non-existent cacNumber, BVNNumber, NINNumber)
4. Directors (remove employersName, employersPhoneNumber)
5. Account Details (local + foreign)
6. Verification Document
7. Signature

### Fix 2: Remove Non-Existent Fields from Table

Remove these columns:
- `cacNumber` (company-level)
- `BVNNumber` (company-level)
- `NINNumber` (company-level)
- `director1EmployersName`
- `director1EmployersPhone`
- `director2EmployersName`
- `director2EmployersPhone`

### Fix 3: Fix formMappings.ts Section Order

**Current order in formMappings.ts (WRONG):**
1. Company Information
2. Account Details
3. Director Information
4. Document Upload
5. Data Privacy & Declaration
6. System Information

**Correct order (matches form):**
1. Company Information
2. Director Information
3. Account Details
4. Document Upload
5. Data Privacy & Declaration
6. System Information

### Fix 4: Update CSV Export

The CSV export function must also:
1. Reorder columns to match corrected table
2. Remove non-existent fields
3. Ensure field names match form exactly

## Individual NFIU Verification

✅ **Individual NFIU table is CORRECT** - all columns match the actual form fields in `IndividualNFIU.tsx`

## Implementation Priority

1. **HIGH**: Fix AdminCorporateNFIUTable.tsx column order (directors before account details)
2. **HIGH**: Remove non-existent fields from table columns
3. **MEDIUM**: Fix formMappings.ts section order
4. **MEDIUM**: Update CSV export to match corrected structure
5. **LOW**: Verify FormViewer displays sections in correct order (should follow formMappings.ts)

## Testing Checklist

After fixes:
- [ ] Table displays columns in correct order: Company → Directors → Account Details → Uploads → Declaration
- [ ] No "N/A" values for fields that should have data
- [ ] CSV export matches table structure
- [ ] FormViewer shows sections in correct order
- [ ] PDF generation (if applicable) matches form structure
- [ ] Old submissions from formSubmissions collection display correctly
- [ ] New submissions from corporate-nfiu-form collection display correctly
