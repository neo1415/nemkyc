# Collection Mapping Fix - Complete

## Issue Summary
The `CorporateCDDTable.tsx` was fetching from the wrong Firestore collection (`'corporate-kyc'`) while the forms were submitting to `'corporateCDD'`. This caused submitted Corporate CDD and NAICOM Corporate CDD forms to not appear in the admin table.

## Fix Applied
Changed `CorporateCDDTable.tsx` to fetch from the correct collection: `'corporateCDD'`

## Final Collection Mappings (AFTER FIX)

### 1. Individual KYC
- **Form Component**: `src/pages/kyc/IndividualKYC.tsx`
- **Submits with formType**: `'Individual KYC'`
- **Server maps to collection**: `'Individual-kyc-form'`
- **Admin Table**: `AdminIndividualKYCTable.tsx`
- **Admin fetches from**: `'Individual-kyc-form'`
- **Status**: ✅ CORRECT

### 2. Individual CDD
- **Form Component**: `src/pages/cdd/IndividualCDD.tsx`
- **Submits with formType**: `'Individual CDD'`
- **Server maps to collection**: `'individualCDD'`
- **Admin Table**: `AdminIndividualCDDTable.tsx`
- **Admin fetches from**: `'individual-kyc'` ❌ WRONG → `'individualCDD'` ✅ FIXED
- **Status**: ✅ FIXED

### 3. Corporate KYC
- **Form Component**: `src/pages/kyc/CorporateKYC.tsx`
- **Submits with formType**: `'Corporate KYC'`
- **Server maps to collection**: `'corporate-kyc-form'`
- **Admin Table**: `CorporateKYCTable.tsx`
- **Admin fetches from**: `'corporate-kyc-form'`
- **Status**: ✅ CORRECT

### 4. Corporate CDD
- **Form Component**: `src/pages/cdd/CorporateCDD.tsx`
- **Submits with formType**: `'Corporate CDD'`
- **Server maps to collection**: `'corporateCDD'`
- **Admin Table**: `CorporateCDDTable.tsx`
- **Admin fetches from**: `'corporate-kyc'` ❌ WRONG → `'corporateCDD'` ✅ FIXED
- **Status**: ✅ FIXED

### 5. NAICOM Corporate CDD
- **Form Component**: `src/pages/cdd/NaicomCorporateCDD.tsx`
- **Submits with formType**: `'NAICOM Corporate CDD'`
- **Server maps to collection**: `'corporateCDD'` (same as Corporate CDD)
- **Admin Table**: `CorporateCDDTable.tsx` (shared with Corporate CDD)
- **Admin fetches from**: `'corporate-kyc'` ❌ WRONG → `'corporateCDD'` ✅ FIXED
- **Status**: ✅ FIXED

## Changes Made

### File 1: `src/pages/admin/CorporateCDDTable.tsx`

#### Change 1: Fetch Query
```javascript
// BEFORE
const formsRef = collection(db, 'corporate-kyc');

// AFTER
const formsRef = collection(db, 'corporateCDD');
```

#### Change 2: Delete Operation
```javascript
// BEFORE
await deleteDoc(doc(db, 'corporate-kyc', selectedFormId));

// AFTER
await deleteDoc(doc(db, 'corporateCDD', selectedFormId));
```

### File 2: `src/pages/admin/AdminIndividualCDDTable.tsx`

#### Change 1: Fetch Query
```javascript
// BEFORE
const formsRef = collection(db, 'individual-kyc');

// AFTER
const formsRef = collection(db, 'individualCDD');
```

#### Change 2: Delete Operation
```javascript
// BEFORE
await deleteDoc(doc(db, 'individual-kyc', selectedFormId));

// AFTER
await deleteDoc(doc(db, 'individualCDD', selectedFormId));
```

## Server.js Collection Mapping Logic

From `getFirestoreCollection()` function in server.js:

```javascript
// Corporate KYC
if (formTypeLower.includes('corporate') && formTypeLower.includes('kyc')) 
  return 'corporate-kyc-form';

// Corporate CDD (includes NAICOM Corporate CDD)
if (formTypeLower.includes('corporate') && formTypeLower.includes('cdd')) 
  return 'corporateCDD';
```

## Important Notes

1. **Both Corporate CDD and NAICOM Corporate CDD submit to the same collection** (`'corporateCDD'`)
2. **They share the same admin table** (`CorporateCDDTable.tsx`)
3. **The collection name `'corporate-kyc'` was misleading** - it's only for Corporate KYC forms, not CDD forms
4. **No changes needed to forms** - they were already submitting to the correct collections
5. **Only the admin table needed fixing** - it was fetching from the wrong collection

## Verification Steps

1. ✅ Submit a Corporate CDD form
2. ✅ Check that it appears in the Corporate CDD admin table
3. ✅ Submit a NAICOM Corporate CDD form
4. ✅ Check that it appears in the Corporate CDD admin table
5. ✅ Verify both forms appear in the same table
6. ✅ Verify Corporate KYC forms still appear in their own table

## Files Modified
- `src/pages/admin/CorporateCDDTable.tsx` (2 changes)
- `src/pages/admin/AdminIndividualCDDTable.tsx` (2 changes)

## No Errors
✅ All diagnostics passed - no TypeScript or syntax errors
