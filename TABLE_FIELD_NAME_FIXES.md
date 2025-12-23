# Table Field Name Fixes - Matching Viewers

## Issue
Admin tables were showing "N/A" for fields that actually have data in the database. This was because the table column definitions used different field names than what's actually stored in Firestore.

## Root Cause
Each form type stores data with specific field names, but the tables were using generic/assumed field names that didn't match the actual database schema.

## Solution
Updated CSV export functions to use the EXACT field names from each form's viewer component, which correctly reads from the database.

## Field Name Mappings by Form Type

### Brokers CDD Form (`brokers-kyc` collection)
**Correct Field Names (from BrokersCDDViewer.tsx):**
- `address` (NOT `residentialAddress`)
- `issuedBy` (NOT `issuingBody`)
- `residenceCountry` (NOT `country`)
- `intPassNo` (International Passport Number)
- `passIssuedCountry` (Passport Issued Country)
- `title` and `gender` (additional fields)
- `employersName` (NOT `employersPhoneNumber` - this field doesn't exist in Brokers)

### Corporate KYC Form (`corporate-kyc-form` collection)
**Correct Field Names (from CorporateKYCViewer.tsx):**
- `residentialAddress` ✓
- `issuingBody` ✓
- `employersPhoneNumber` ✓
- `employersName` ✓

### Corporate CDD Form (`corporate-kyc` collection)
**Correct Field Names (from CorporateCDDViewer.tsx):**
- `residentialAddress` ✓
- `issuingBody` ✓
- `employersPhoneNumber` ✓
- `employersName` ✓

### Individual KYC Form (`Individual-kyc-form` collection)
**Correct Field Names (from IndividualKYCViewer.tsx):**
- `residentialAddress` ✓
- `employersName` ✓
- `employersTelephoneNumber` ✓
- `employersAddress` ✓

## Files Fixed

### ✅ Brokers CDD Table
**File:** `src/pages/admin/BrokersCDDTable.tsx`
**Changes:**
- Updated CSV export to use correct field names
- Added `title` and `gender` fields for directors
- Changed `residentialAddress` → `address`
- Changed `issuingBody` → `issuedBy`
- Changed `country` → `residenceCountry`
- Added `intPassNo` and `passIssuedCountry` fields
- Removed `employersPhoneNumber` (doesn't exist in Brokers form)

### ✅ Corporate KYC Table
**File:** `src/pages/admin/CorporateKYCTable.tsx`
**Status:** Already correct - uses proper field names

### ✅ Corporate CDD Table
**File:** `src/pages/admin/CorporateCDDTable.tsx`
**Status:** Already correct - uses proper field names

### ✅ Individual KYC Table
**File:** `src/pages/admin/AdminIndividualKYCTable.tsx`
**Status:** Already correct - uses proper field names

## Testing Verification

To verify the fix:
1. Go to any admin table (e.g., Brokers CDD)
2. Click on a row to view the form details
3. Note the field values shown in the viewer
4. Export the table to CSV
5. Open the CSV and verify the same values appear
6. Check that no fields show "N/A" when they have data in the viewer

## Key Learnings

1. **Always check the viewer component** to find the correct field names
2. **Database field names vary by form type** - don't assume consistency
3. **Test with actual data** - "N/A" values indicate field name mismatches
4. **Viewers are the source of truth** - they're tested and working with real data
