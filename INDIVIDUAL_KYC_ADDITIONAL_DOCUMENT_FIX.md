# Individual KYC Additional Document Display Fix

## Problem
The additional document uploaded in the Individual KYC form was not showing up in:
1. The form summary dialog (showing "No document uploaded")
2. The form viewer (admin and user views)

## Root Cause Analysis

### Issue 1: Field Name Mismatch in Summary Dialog
- **Problem**: The summary dialog was checking for `data.additionalDocument` but the file was stored as `data.identification`
- **Location**: `src/pages/kyc/IndividualKYC.tsx` - summary rendering section
- **Fix**: Updated the summary to check for `data.identification` instead of `data.additionalDocument`

### Issue 2: Form Mapping Key Mismatch in Viewers
- **Problem**: The form viewers were using incorrect mapping keys for Individual KYC forms
- **Locations**: 
  - `src/pages/admin/FormViewer.tsx`
  - `src/pages/dashboard/UserFormViewer.tsx` 
  - `src/pages/admin/AdminUnifiedTable.tsx`
- **Issue**: These components were mapping `'Individual-kyc-form'` to incorrect keys like `'individual-kyc'` or `'individual-k-y-c'`
- **Correct Mapping**: The actual form mapping key in `src/config/formMappings.ts` is `'Individual-kyc-form'`
- **Fix**: Updated all components to use the correct mapping: `'Individual-kyc-form': 'Individual-kyc-form'`

## Files Modified

1. **src/pages/kyc/IndividualKYC.tsx**
   - Fixed summary dialog to check for `data.identification` instead of `data.additionalDocument`

2. **src/pages/admin/FormViewer.tsx**
   - Fixed form mapping key from `'individual-kyc'` to `'Individual-kyc-form'`

3. **src/pages/dashboard/UserFormViewer.tsx**
   - Fixed form mapping key from `'individual-kyc'` to `'Individual-kyc-form'`

4. **src/pages/admin/AdminUnifiedTable.tsx**
   - Fixed form mapping key from `'individual-k-y-c'` to `'Individual-kyc-form'`

## How the Fix Works

### Summary Dialog Fix
The summary dialog now correctly checks for the `identification` field (which is how the additional document is stored in the form data) and displays the appropriate status.

### Form Viewer Fix
The form viewers now use the correct mapping key `'Individual-kyc-form'` which corresponds to the actual form mapping definition in `src/config/formMappings.ts`. This mapping correctly defines the `identification` field as `type: 'file'`, which allows the form viewer to:

1. Recognize it as a file field
2. Display a download button when the document exists
3. Show "N/A" when no document is uploaded

## Expected Behavior After Fix

1. **Form Summary**: When an additional document is uploaded, the summary will show "Document uploaded successfully" instead of "No document uploaded"

2. **Admin Form Viewer**: The additional document will appear in the "Upload Documents" section with a download button

3. **User Form Viewer**: Users can see their uploaded additional document with a download link

4. **Admin Table**: The additional document field will be properly displayed in the admin unified table

## Testing

To test the fix:

1. **Upload Test**: Go to Individual KYC form, upload an additional document, and verify it shows in the summary
2. **Viewer Test**: Submit the form and check that the document appears in both admin and user form viewers
3. **Download Test**: Verify that the download button works for the additional document

## Technical Details

The form mapping system works as follows:
- Form collection name: `'Individual-kyc-form'`
- Form mapping key: `'Individual-kyc-form'` (defined in `src/config/formMappings.ts`)
- Field definition: `{ key: 'identification', label: 'Upload Means of Identification', type: 'file', editable: false }`

The `type: 'file'` designation is crucial for the form viewer to recognize and properly render file fields with download functionality.