# CAC Number Implementation - Verification Checklist

## Quick Verification Steps

### 1. Form Testing (Corporate KYC)
- [ ] Navigate to Corporate KYC form
- [ ] Verify CAC Number field appears after "Date of Incorporation/Registration"
- [ ] Try submitting without CAC Number (should show validation error)
- [ ] Try entering special characters in CAC Number (should show "must contain only letters and numbers" error)
- [ ] Enter a valid alphanumeric CAC Number (e.g., "RC123456" or "123456789")
- [ ] Complete and submit the form
- [ ] Check form summary dialog shows CAC Number

### 2. Form Testing (Corporate CDD)
- [ ] Navigate to Corporate CDD form
- [ ] Verify CAC Number field appears after "Date of Incorporation/Registration"
- [ ] Try submitting without CAC Number (should show validation error)
- [ ] Try entering special characters in CAC Number (should show "must contain only letters and numbers" error)
- [ ] Enter a valid alphanumeric CAC Number (e.g., "RC987654" or "987654321")
- [ ] Complete and submit the form
- [ ] Check form summary dialog shows CAC Number

### 3. Form Testing (NAICOM Corporate CDD)
- [ ] Navigate to NAICOM Corporate CDD form
- [ ] Verify CAC Number field appears after "Date of Incorporation/Registration"
- [ ] Try submitting without CAC Number (should show validation error)
- [ ] Try entering special characters in CAC Number (should show "must contain only letters and numbers" error)
- [ ] Enter a valid alphanumeric CAC Number (e.g., "RC555666" or "555666777")
- [ ] Complete and submit the form
- [ ] Check form summary dialog shows CAC Number

### 4. Admin Table Testing (Corporate KYC)
- [ ] Navigate to Admin Corporate KYC Table
- [ ] Verify "CAC Number" column appears in the table
- [ ] Verify submitted forms show their CAC numbers
- [ ] Test search functionality with CAC number
- [ ] Verify search placeholder mentions "CAC number"

### 5. Admin Table Testing (Corporate CDD)
- [ ] Navigate to Admin Corporate CDD Table (CorporateCDDTable)
- [ ] Verify "CAC Number" column appears in the table
- [ ] Verify submitted forms show their CAC numbers
- [ ] Test search functionality with CAC number
- [ ] Verify search placeholder mentions "CAC number"

### 6. Form Viewer Testing (Corporate KYC)
- [ ] Open a submitted Corporate KYC form from admin table
- [ ] Verify "CAC Number" field displays in the viewer
- [ ] Verify the CAC number value is correct

### 7. Form Viewer Testing (Corporate CDD)
- [ ] Open a submitted Corporate CDD form from admin table
- [ ] Verify "CAC Number" field displays in the viewer
- [ ] Verify the CAC number value is correct

### 8. PDF Generation Testing
- [ ] Open a submitted Corporate KYC form
- [ ] Generate/download PDF
- [ ] Verify CAC Number appears in the PDF

- [ ] Open a submitted Corporate CDD form
- [ ] Generate/download PDF
- [ ] Verify CAC Number appears in the PDF

### 9. Edge Cases Testing
- [ ] Test with very long CAC numbers (e.g., 20+ digits)
- [ ] Test with single digit CAC number
- [ ] Verify old forms without CAC number show "N/A" or "Not provided"
- [ ] Test sorting by CAC Number column in admin tables
- [ ] Test filtering by CAC Number in admin tables

## Expected Behavior

### Validation
- ✅ CAC Number is required
- ✅ Only alphanumeric characters (A-Z, a-z, 0-9) are allowed
- ✅ No length restrictions
- ✅ Clear error messages for invalid input

### Display
- ✅ Field appears after "Date of Incorporation/Registration"
- ✅ Label is "CAC Number"
- ✅ Shows in forms, admin tables, viewers, summaries, and PDFs
- ✅ Old forms without CAC show "N/A" or "Not provided"

### Search
- ✅ CAC Number is searchable in admin tables
- ✅ Search is case-insensitive
- ✅ Partial matches work

## Troubleshooting

### If CAC Number field doesn't appear:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for errors

### If validation doesn't work:
1. Check browser console for errors
2. Verify form is using latest code
3. Try in incognito/private mode

### If search doesn't work:
1. Verify you're searching in the correct table
2. Check that the form has a CAC number saved
3. Try exact match first, then partial match

## Success Criteria
All checkboxes above should be checked ✅ for complete verification.

## Notes
- CAC Number field is required for all new submissions
- Existing forms without CAC number will continue to work
- No backend changes were needed
- All changes are backward compatible
