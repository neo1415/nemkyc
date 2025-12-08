# Correct Collection Mapping - As Specified by User

## Final Correct Mappings

| Form | formType | Collection (Submit & Fetch) | Admin Table File |
|------|----------|----------------------------|------------------|
| **Individual KYC** | `'Individual KYC'` | `'Individual-kyc-form'` | `AdminIndividualKYCTable.tsx` |
| **Individual CDD** | `'Individual CDD'` | `'individual-kyc'` | `AdminIndividualCDDTable.tsx` |
| **Corporate KYC** | `'Corporate KYC'` | `'corporate-kyc-form'` | `CorporateKYCTable.tsx` |
| **Corporate CDD** | `'Corporate CDD'` | `'corporate-kyc'` | `CorporateCDDTable.tsx` |
| **NAICOM Corporate CDD** | `'NAICOM Corporate CDD'` | `'corporate-kyc'` | `CorporateCDDTable.tsx` |

## Changes Made

### File 1: `server.js`
Updated `getFirestoreCollection()` function:

```javascript
// CDD forms - CORRECTED
if (formTypeLower.includes('individual') && formTypeLower.includes('cdd')) return 'individual-kyc';
if (formTypeLower.includes('corporate') && formTypeLower.includes('cdd')) return 'corporate-kyc';
```

**Before**: Was returning `'individualCDD'` and `'corporateCDD'`
**After**: Now returns `'individual-kyc'` and `'corporate-kyc'`

### File 2: `src/pages/admin/CorporateCDDTable.tsx`
Already fetching from `'corporate-kyc'` ✅ (reverted back to correct value)

### File 3: `src/pages/admin/AdminIndividualCDDTable.tsx`
Already fetching from `'individual-kyc'` ✅ (reverted back to correct value)

## Important Notes

1. **Naming Convention**: The collection names don't follow a strict pattern - this is intentional per user specification
2. **Corporate CDD & NAICOM Corporate CDD**: Both submit to and fetch from `'corporate-kyc'` (NOT `'corporateCDD'`)
3. **Individual CDD**: Submits to and fetches from `'individual-kyc'` (NOT `'individualCDD'`)
4. **Server.js is the source of truth**: The `getFirestoreCollection()` function determines where forms are saved

## Files Modified
1. `server.js` - Updated getFirestoreCollection() function
2. `src/pages/admin/CorporateCDDTable.tsx` - Reverted to correct collection
3. `src/pages/admin/AdminIndividualCDDTable.tsx` - Reverted to correct collection

## Verification
✅ All diagnostics passed - no errors
✅ Admin tables now fetch from correct collections
✅ Forms submit to correct collections via server.js
