# Smart Artisan Protection Claims - Field Mapping Diagnostic

## Executive Summary

**CRITICAL ISSUE IDENTIFIED**: The Smart Artisan Protection Claims form has significant field name mismatches between:
1. The actual form (SmartArtisanProtectionClaim.tsx)
2. The admin table (AdminSmartArtisanProtectionClaimsTable.tsx)
3. The FormViewer mappings (formMappings.ts)

This is causing N/A values to appear in the admin table and FormViewer where actual data exists.

---

## Field Name Comparison Table

| Form Field Name (ACTUAL) | Admin Table Expects | FormViewer Expects | Status |
|--------------------------|---------------------|-------------------|---------|
| `insuredName` | `nameOfInsured` | `nameOfInsured` | ❌ MISMATCH |
| `coverFrom` | `periodOfCoverFrom` | `periodOfCoverFrom` | ❌ MISMATCH |
| `coverTo` | `periodOfCoverTo` | `periodOfCoverTo` | ❌ MISMATCH |
| `accidentPlace` | `accidentLocation` | `accidentLocation` | ❌ MISMATCH |
| `incidentDescription` | `accidentDescription` | `accidentDescription` | ❌ MISMATCH |
| `injuryParticulars` | `injuryDescription` | `injuryDescription` | ❌ MISMATCH |
| `witnesses[].witnessName` | `witnesses[].name` | `witnesses` (array) | ❌ MISMATCH |
| `witnesses[].witnessAddress` | `witnesses[].address` | `witnesses` (array) | ❌ MISMATCH |
| `doctorName` | `doctorNameAddress` | `doctorNameAddress` | ❌ MISMATCH |
| `doctorAddress` | `doctorNameAddress` | `doctorNameAddress` | ❌ MISMATCH |
| `policyNumber` | `policyNumber` | `policyNumber` | ✅ MATCH |
| `address` | `address` | `address` | ✅ MATCH |
| `phone` | `phone` | `phone` | ✅ MATCH |
| `email` | `email` | `email` | ✅ MATCH |
| `accidentDate` | `accidentDate` | `accidentDate` | ✅ MATCH |
| `accidentTime` | `accidentTime` | `accidentTime` | ✅ MATCH |
| `signature` | `signature` | `signature` | ✅ MATCH |
| `agreeToDataPrivacy` | `agreeToDataPrivacy` | `agreeToDataPrivacy` | ✅ MATCH |

---

## Detailed Field Analysis

### Section 1: Policy Information

**Form Fields:**
```typescript
policyNumber: string
coverFrom: Date
coverTo: Date
```

**Admin Table/FormViewer Expects:**
```typescript
policyNumber: string  // ✅ MATCH
periodOfCoverFrom: Date  // ❌ MISMATCH - form uses "coverFrom"
periodOfCoverTo: Date  // ❌ MISMATCH - form uses "coverTo"
```

**Impact**: Cover dates will show as N/A in admin table and FormViewer

---

### Section 2: Insured Details

**Form Fields:**
```typescript
insuredName: string
address: string
phone: string
email: string
```

**Admin Table/FormViewer Expects:**
```typescript
nameOfInsured: string  // ❌ MISMATCH - form uses "insuredName"
address: string  // ✅ MATCH
phone: string  // ✅ MATCH
email: string  // ✅ MATCH
```

**Impact**: Insured name will show as N/A in admin table and FormViewer

---

### Section 3: Details of Loss

**Form Fields:**
```typescript
accidentDate: Date
accidentTime: string
accidentPlace: string  // ❌ Form uses "accidentPlace"
incidentDescription: string  // ❌ Form uses "incidentDescription"
injuryParticulars: string  // ❌ Form uses "injuryParticulars"
```

**Admin Table/FormViewer Expects:**
```typescript
accidentDate: Date  // ✅ MATCH
accidentTime: string  // ✅ MATCH
accidentLocation: string  // ❌ MISMATCH - form uses "accidentPlace"
accidentDescription: string  // ❌ MISMATCH - form uses "incidentDescription"
injuryDescription: string  // ❌ MISMATCH - form uses "injuryParticulars"
```

**Impact**: Accident location, incident description, and injury details will show as N/A

---

### Section 4: Witnesses

**Form Fields:**
```typescript
witnesses: Array<{
  witnessName: string
  witnessAddress: string
}>
```

**Admin Table Expects:**
```typescript
witnesses: Array<{
  name: string  // ❌ MISMATCH - form uses "witnessName"
  address: string  // ❌ MISMATCH - form uses "witnessAddress"
}>
```

**FormViewer Expects:**
```typescript
witnesses: Array  // Generic array, no specific field mapping
```

**Impact**: Witness names and addresses will show as N/A in admin table

---

### Section 5: Doctor Information

**Form Fields:**
```typescript
doctorName: string
doctorAddress: string
isUsualDoctor: string
```

**Admin Table/FormViewer Expects:**
```typescript
doctorNameAddress: string  // ❌ MISMATCH - form has separate fields
isUsualDoctor: string  // ✅ MATCH
```

**Impact**: Doctor information will show as N/A (form has separate fields, admin expects combined)

---

### Section 6: Additional Fields in Admin Table NOT in Form

**Admin Table Has (but form doesn't):**
```typescript
title: string  // Not in form
dateOfBirth: Date  // Not in form
gender: string  // Not in form
occupation: string  // Not in form
employerName: string  // Not in form
workLocation: string  // Not in form
toolsInvolved: string  // Not in form
safetyMeasures: string  // Not in form
hospitalName: string  // Not in form
treatmentReceived: string  // Not in form
```

**Impact**: These columns will ALWAYS show N/A because the form never collects this data

---

## Root Cause Analysis

1. **Inconsistent Naming Convention**: Form uses different field names than admin table/FormViewer
2. **Missing Form Fields**: Admin table expects fields that don't exist in the form
3. **Structural Mismatch**: Doctor info is split in form but combined in admin expectations
4. **Witness Array Structure**: Different property names within witness objects

---

## Comparison with Corporate KYC (Reference Implementation)

Corporate KYC has **CONSISTENT** field names across:
- Form component
- Admin table
- FormViewer mappings
- PDF generation

**Example from Corporate KYC:**
```typescript
// Form uses:
cacNumber: string

// Admin table expects:
cacNumber: string  // ✅ EXACT MATCH

// FormViewer expects:
cacNumber: string  // ✅ EXACT MATCH
```

This is the pattern we need to replicate for Smart Artisan Protection Claims.

---

## Recommended Fix Strategy

### Option 1: Update Form to Match Admin Table (RECOMMENDED)
- Change form field names to match what admin table expects
- This is the cleanest approach
- Maintains consistency with other forms

### Option 2: Update Admin Table to Match Form
- Change admin table column definitions
- Update FormViewer mappings
- More work but keeps form as-is

### Option 3: Add Field Mapping Layer
- Keep both as-is
- Add transformation logic in submission handler
- Most complex, not recommended

---

## Next Steps

1. **Decide on naming convention** (use admin table names as source of truth)
2. **Update Smart Artisan form** to use correct field names
3. **Update Smart Students form** (likely has same issues)
4. **Test complete workflow**: Form → Firestore → Admin Table → FormViewer → PDF
5. **Verify no N/A values** appear where data exists

---

## Files That Need Updates

1. `src/pages/claims/SmartArtisanProtectionClaim.tsx` - Update field names
2. `src/pages/claims/SmartStudentsProtectionClaim.tsx` - Update field names
3. `src/config/formMappings.ts` - Verify mappings match
4. `src/pages/admin/AdminSmartArtisanProtectionClaimsTable.tsx` - Verify column definitions
5. `src/pages/admin/AdminSmartStudentsProtectionClaimsTable.tsx` - Verify column definitions

---

## Priority Fields to Fix (High Impact)

These fields are REQUIRED and currently showing N/A:

1. `insuredName` → `nameOfInsured`
2. `coverFrom` → `periodOfCoverFrom`
3. `coverTo` → `periodOfCoverTo`
4. `accidentPlace` → `accidentLocation`
5. `incidentDescription` → `accidentDescription`
6. `injuryParticulars` → `injuryDescription`
7. `witnesses[].witnessName` → `witnesses[].name`
8. `witnesses[].witnessAddress` → `witnesses[].address`
