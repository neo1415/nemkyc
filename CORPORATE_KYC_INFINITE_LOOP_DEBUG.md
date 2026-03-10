# Corporate KYC Infinite Loop Debug

## Issue Summary
User experiencing an issue where CAC verification succeeds (from cache) but then the data matching fails with "company name does not match CAC records", causing the submission to fail.

## Root Cause Analysis

The issue is in the `useEnhancedFormSubmit` hook's pending submission processing logic (lines 170-280). After successful CAC verification, the hook calls `matchCACData()` to compare user-entered data with verification results. This matching is failing even though verification succeeded.

## Changes Made

Added detailed console logging to both matching locations:
1. In the `useEffect` for pending submissions (line ~238)
2. In the `confirmSubmit` function (line ~450)

The logs will now show:
- User entered data (insured, dateOfIncorporationRegistration, officeAddress)
- Verification data returned from API
- Match result (matches, mismatches, warnings)

## Next Steps for User

1. Clear browser cache and reload the page
2. Fill out the Corporate KYC form with CAC number RC6971
3. Submit the form
4. Check the browser console for the new detailed logs
5. Share the console output showing:
   - "🔍 Matching CAC data:" section
   - The user entered data
   - The verification data
   - The match result

## Possible Issues to Investigate

Based on the logs, we'll be able to identify:

1. **Empty insured field**: If `savedFormData.insured` is undefined/empty
2. **Wrong verification data structure**: If `verificationResult.data.name` doesn't exist
3. **Similarity threshold too strict**: If the company names are similar but below 0.5 threshold
4. **Data type mismatch**: If dates or addresses are in wrong format

## Temporary Workaround

If the issue persists, we can:
1. Lower the similarity threshold from 0.5 to 0.3 in `verificationMatcher.ts`
2. Skip matching for cached results (not recommended for security)
3. Add better normalization for company names

## Files Modified

- `src/hooks/useEnhancedFormSubmit.ts` - Added detailed console logging for debugging
