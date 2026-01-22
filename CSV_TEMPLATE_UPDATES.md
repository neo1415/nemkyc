# CSV Template Updates ✅

## Changes Made

### 1. Policy Number Moved to First Column
**Both Individual and Corporate templates now start with Policy Number**

This makes it easier for brokers to identify entries and aligns with IES integration requirements.

### 2. Individual Template - Removed CAC
**Before:**
- Had CAC as optional field (not needed for individuals)

**After:**
- CAC removed from Individual template
- Only NIN remains as optional identity field

**Columns (in order):**
1. Policy Number ⭐ (required)
2. Title (required)
3. First Name (required)
4. Last Name (required)
5. Phone Number (required)
6. Email (required)
7. Address (required)
8. Gender (required)
9. Date of Birth (optional)
10. Occupation (optional)
11. Nationality (optional)
12. BVN (required)
13. NIN (optional)

### 3. Corporate Template - Removed NIN
**Before:**
- Had NIN field (not applicable for corporate entities)

**After:**
- NIN removed from Corporate template
- Only CAC remains as optional identity field

**Columns (in order):**
1. Policy Number ⭐ (required)
2. Company Name (required)
3. Company Address (required)
4. Email Address (required)
5. Company Type (required)
6. Phone Number (required)
7. Registration Number (required)
8. Registration Date (required)
9. Business Address (required)
10. CAC (optional)

## Files Modified

1. ✅ `src/utils/templateGenerator.ts`
   - Updated `INDIVIDUAL_TEMPLATE_HEADERS` array
   - Updated `CORPORATE_TEMPLATE_HEADERS` array
   - Policy Number moved to first position in both
   - Removed CAC from Individual
   - Removed NIN from Corporate

2. ✅ `src/utils/fileParser.ts`
   - Updated `INDIVIDUAL_TEMPLATE` schema
   - Updated `CORPORATE_TEMPLATE` schema
   - Validation logic will now check for correct fields

## Testing

### Download New Templates
1. Log in as a broker
2. Go to Identity Collection page
3. Click "Upload New List"
4. Click "Download Template" dropdown
5. Download both Individual and Corporate templates
6. Verify:
   - ✅ Policy Number is first column
   - ✅ Individual template has no CAC column
   - ✅ Corporate template has no NIN column

### Upload Validation
The system will now:
- ✅ Expect Policy Number in first column
- ✅ Reject Individual templates with CAC column (if marked as required)
- ✅ Reject Corporate templates with NIN column (if marked as required)
- ✅ Accept templates with correct structure

## Benefits

1. **Clearer Structure**: Policy Number first makes it easy to identify entries
2. **Less Confusion**: Removed irrelevant fields (CAC for individuals, NIN for corporate)
3. **Better Validation**: System validates against correct template structure
4. **Easier Data Entry**: Brokers don't see unnecessary fields

## Backward Compatibility

**Old templates uploaded before this change:**
- ✅ Will still work (flexible mode)
- ✅ System auto-detects columns regardless of order
- ✅ Extra columns (like old CAC/NIN) are ignored

**New templates downloaded after this change:**
- ✅ Have correct structure
- ✅ Policy Number first
- ✅ Only relevant fields included

## Summary

- ✅ Policy Number is now the first column in both templates
- ✅ Individual template no longer has CAC field
- ✅ Corporate template no longer has NIN field
- ✅ All changes validated with no errors
- ✅ Backward compatible with old uploads
