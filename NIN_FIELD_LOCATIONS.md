# NIN Field Implementation Locations

This document provides exact locations where NIN fields were added in each file for easy verification and reference.

## 1. Individual KYC (`src/pages/kyc/IndividualKYC.tsx`)

### Validation Schema (Line ~60)
```typescript
BVN: yup.string()
  .required("BVN is required")
  .matches(/^[0-9]+$/, "BVN can only contain numbers")
  .length(11, "BVN must be exactly 11 digits"),
NIN: yup.string()
  .required("NIN is required")
  .matches(/^[0-9]+$/, "NIN can only contain numbers")
  .length(11, "NIN must be exactly 11 digits"),
identificationType: yup.string().required("ID type is required"),
```

### Default Values (Line ~120)
```typescript
emailAddress: '',
taxIDNo: '',
BVN: '',
NIN: '',
identificationType: '',
```

### Form UI (Line ~450)
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField name="taxIDNo" label="Tax Identification Number" />
  <FormField name="BVN" label="BVN" required maxLength={11} />
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField name="NIN" label="NIN (National Identification Number)" required maxLength={11} />
</div>
```

### Step Field Mappings (Line ~700)
```typescript
0: ['officeLocation', 'title', 'firstName', ..., 'BVN', 'NIN', 'identificationType', ...],
```

---

## 2. Corporate KYC (`src/pages/kyc/CorporateKYC.tsx`)

### Company Validation Schema (Line ~50)
```typescript
BVNNumber: yup.string()
  .required("BVN is required")
  .matches(/^\d+$/, "BVN must contain only numbers")
  .length(11, "BVN must be exactly 11 digits"),
NINNumber: yup.string()
  .required("NIN is required")
  .matches(/^\d+$/, "NIN must contain only numbers")
  .length(11, "NIN must be exactly 11 digits"),
contactPersonNo: yup.string()
  .required("Contact person mobile is required")
```

### Director Validation Schema (Line ~100)
```typescript
BVNNumber: yup.string()
  .required("BVN is required")
  .matches(/^\d+$/, "BVN must contain only numbers")
  .length(11, "BVN must be exactly 11 digits"),
NINNumber: yup.string()
  .required("NIN is required")
  .matches(/^\d+$/, "NIN must contain only numbers")
  .length(11, "NIN must be exactly 11 digits"),
employersName: yup.string(),
```

### Company Default Values (Line ~210)
```typescript
dateOfIncorporationRegistration: undefined,
BVNNumber: '',
NINNumber: '',
contactPersonNo: '',
```

### Director Default Values (Line ~230)
```typescript
phoneNumber: '',
BVNNumber: '',
NINNumber: '',
employersName: '',
```

### Company Form UI (Line ~550)
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name="BVNNumber"
    label="BVN"
    required={true}
    maxLength={11}
  />
  <FormField
    name="NINNumber"
    label="NIN (National Identification Number)"
    required={true}
    maxLength={11}
  />
</div>
```

### Director Form UI (Line ~730)
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name={`directors.${index}.phoneNumber`}
    label="Phone Number"
    required={true}
    maxLength={15}
  />
  <FormField
    name={`directors.${index}.BVNNumber`}
    label="BVN"
    required={true}
    maxLength={11}
  />
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name={`directors.${index}.NINNumber`}
    label="NIN (National Identification Number)"
    required={true}
    maxLength={11}
  />
  <FormField
    name={`directors.${index}.employersName`}
    label="Employers Name"
    required={false}
  />
</div>
```

### Append Function (Line ~860)
```typescript
onClick={() => append({
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  placeOfBirth: '',
  nationality: '',
  country: '',
  occupation: '',
  email: '',
  phoneNumber: '',
  BVNNumber: '',
  NINNumber: '',
  employersName: '',
  ...
})}
```

### Step Field Mappings (Line ~500)
```typescript
0: [
  'branchOffice', 'insured', 'officeAddress', 'ownershipOfCompany', 'contactPerson', 
  'website', 'incorporationNumber', 'incorporationState', 'dateOfIncorporationRegistration',
  'BVNNumber', 'NINNumber', 'contactPersonNo', 'taxIDNo', 'emailAddress', 'natureOfBusiness', 
  'estimatedTurnover', 'premiumPaymentSource', 'premiumPaymentSourceOther'
],
```

---

## 3. Individual CDD (`src/pages/cdd/IndividualCDD.tsx`)

### Validation Schema (Line ~180)
```typescript
taxidentificationNumber: yup.string(),
BVNNumber: yup.string()
  .required("BVN is required")
  .matches(/^\d+$/, "BVN must contain only numbers")
  .length(11, "BVN must be exactly 11 digits"),
NINNumber: yup.string()
  .required("NIN is required")
  .matches(/^\d+$/, "NIN must contain only numbers")
  .length(11, "NIN must be exactly 11 digits"),
identificationType: yup.string().required("ID type is required"),
```

### Default Values (Line ~250)
```typescript
employersAddress: '',
taxidentificationNumber: '',
BVNNumber: '',
NINNumber: '',
identificationType: '',
```

### Form UI (Line ~450)
```typescript
<FormTextarea name="employersAddress" label="Employer's Address" />

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField name="BVNNumber" label="BVN" required={true} maxLength={11} />
  <FormField name="NINNumber" label="NIN (National Identification Number)" required={true} maxLength={11} />
</div>

<FormSelect
```

### Step Field Mappings (Line ~400)
```typescript
1: ['businessType', 'businessTypeOther', 'employersEmail', 'employersName', 'employersTelephoneNumber', 'employersAddress', 'taxidentificationNumber', 'BVNNumber', 'NINNumber', 'identificationType', 'identificationNumber', 'issuingCountry', 'issuedDate', 'expiryDate'],
```

---

## 4. Corporate CDD (`src/pages/cdd/CorporateCDD.tsx`)

### Director Validation Schema (Line ~280)
```typescript
BVNNumber: yup.string()
  .required("BVN is required")
  .matches(/^\d+$/, "BVN must contain only numbers")
  .length(11, "BVN must be exactly 11 digits"),
NINNumber: yup.string()
  .required("NIN is required")
  .matches(/^\d+$/, "NIN must contain only numbers")
  .length(11, "NIN must be exactly 11 digits"),
employersName: yup.string()
  .max(100, "Employer name cannot exceed 100 characters"),
```

### Director Default Values (Line ~380)
```typescript
phoneNumber: '',
BVNNumber: '',
NINNumber: '',
employersName: '',
```

### Director Form UI (Line ~780)
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name={`directors.${index}.phoneNumber`}
    label="Phone Number"
    required={true}
    maxLength={15}
  />
  <FormField
    name={`directors.${index}.BVNNumber`}
    label="BVN"
    required={true}
    maxLength={11}
  />
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name={`directors.${index}.NINNumber`}
    label="NIN (National Identification Number)"
    required={true}
    maxLength={11}
  />
  <FormField
    name={`directors.${index}.employersName`}
    label="Employers Name"
    maxLength={100}
  />
</div>
```

---

## 5. Agents CDD (`src/pages/cdd/AgentsCDD.tsx`)

### Validation Schema (Line ~70)
```typescript
BVNNumber: yup.string()
  .required("BVN is required")
  .matches(/^\d+$/, "BVN must contain only numbers")
  .length(11, "BVN must be exactly 11 digits"),
NINNumber: yup.string()
  .required("NIN is required")
  .matches(/^\d+$/, "NIN must contain only numbers")
  .length(11, "NIN must be exactly 11 digits"),
taxIDNumber: yup.string(),
```

### Default Values (Line ~180)
```typescript
GSMno: '',
BVNNumber: '',
NINNumber: '',
taxIDNumber: '',
```

### Form UI (Line ~600)
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name="BVNNumber"
    label="BVN"
    required={true}
    maxLength={11}
  />
  <FormField
    name="NINNumber"
    label="NIN (National Identification Number)"
    required={true}
    maxLength={11}
  />
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name="taxIDNumber"
    label="Tax ID Number"
  />
  <FormField
    name="occupation"
    label="Occupation"
    required={true}
  />
</div>
```

### Step Field Mappings (Line ~420)
```typescript
0: ['firstName', 'lastName', 'residentialAddress', 'gender', 'position', 'dateOfBirth', 'placeOfBirth', 'sourceOfIncome', 'nationality', 'GSMno', 'BVNNumber', 'NINNumber', 'occupation', 'emailAddress', 'idType', 'idNumber', 'issuedDate', 'issuingBody'],
```

---

## 6. Brokers CDD (`src/pages/cdd/BrokersCDD.tsx`)

### Director Validation Schema (Line ~100)
```typescript
BVNNumber: yup.string()
  .required("BVN is required")
  .matches(/^\d+$/, "BVN must contain only numbers")
  .length(11, "BVN must be exactly 11 digits"),
NINNumber: yup.string()
  .required("NIN is required")
  .matches(/^\d+$/, "NIN must contain only numbers")
  .length(11, "NIN must be exactly 11 digits"),
employersName: yup.string().required("Employer's name is required"),
```

### Director Default Values (Line ~210)
```typescript
phoneNumber: '',
BVNNumber: '',
NINNumber: '',
employersName: '',
```

### Director Form UI (Line ~820)
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name={`directors.${index}.phoneNumber`}
    label="Phone Number"
    maxLength={15}
    required={true}
  />
  <FormField
    name={`directors.${index}.BVNNumber`}
    label="BVN"
    maxLength={11}
    required={true}
  />
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name={`directors.${index}.NINNumber`}
    label="NIN (National Identification Number)"
    maxLength={11}
    required={true}
  />
  <FormField
    name={`directors.${index}.employersName`}
    label="Employer's Name"
    required={true}
  />
</div>
```

### Step Field Mappings (Line ~465)
```typescript
`directors.${index}.email`,
`directors.${index}.phoneNumber`,
`directors.${index}.BVNNumber`,
`directors.${index}.NINNumber`,
`directors.${index}.employersName`,
```

---

## 7. Partners CDD (`src/pages/cdd/PartnersCDD.tsx`)

### Company Validation Schema (Line ~200)
```typescript
bvn: yup.string()
  .required("BVN is required")
  .matches(/^\d+$/, "BVN must contain only numbers")
  .length(11, "BVN must be exactly 11 digits"),
nin: yup.string()
  .required("NIN is required")
  .matches(/^\d+$/, "NIN must contain only numbers")
  .length(11, "NIN must be exactly 11 digits"),

// Directors
directors: yup.array().of(yup.object().shape({
```

### Partner Validation Schema (Line ~270)
```typescript
bvn: yup.string()
  .required("BVN is required")
  .matches(/^\d+$/, "BVN must contain only numbers")
  .length(11, "BVN must be exactly 11 digits"),
nin: yup.string()
  .required("NIN is required")
  .matches(/^\d+$/, "NIN must contain only numbers")
  .length(11, "NIN must be exactly 11 digits"),
employerName: yup.string(),
```

### Company Default Values (Line ~350)
```typescript
incorporationState: '',
businessNature: '',
bvn: '',
nin: '',
directors: [{
```

### Partner Default Values (Line ~370)
```typescript
phoneNumber: '',
bvn: '',
nin: '',
employerName: '',
```

### Company Form UI (Line ~600)
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name="bvn"
    label="BVN"
    required={true}
    maxLength={11}
  />
  <FormField
    name="nin"
    label="NIN (National Identification Number)"
    required={true}
    maxLength={11}
  />
</div>
```

### Partner Form UI (Line ~750)
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name={`directors.${index}.phoneNumber`}
    label="Phone Number"
    required={true}
    maxLength={15}
  />
  <FormField
    name={`directors.${index}.bvn`}
    label="BVN"
    required={true}
    maxLength={11}
  />
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <FormField
    name={`directors.${index}.nin`}
    label="NIN (National Identification Number)"
    required={true}
    maxLength={11}
  />
  <FormField
    name={`directors.${index}.employerName`}
    label="Employer's Name"
  />
</div>
```

### Append Function (Line ~630)
```typescript
onClick={() => append({
  title: '',
  gender: '',
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: undefined,
  placeOfBirth: '',
  nationality: '',
  country: '',
  occupation: '',
  email: '',
  phoneNumber: '',
  bvn: '',
  nin: '',
  employerName: '',
  ...
})}
```

---

## 8. Server.js Security Update

### Sanitization Function (Line ~127)
```javascript
const sanitized = { ...data };
const sensitiveFields = ['password', 'token', 'idToken', 'customToken', 'authorization', 'rawIP', 'bvn', 'nin', 'NIN', 'NINNumber', 'identificationNumber', 'accountNumber'];
```

---

## Summary

**Total NIN Fields Added**: 13
- Individual KYC: 1 field
- Corporate KYC: 2 fields (company + directors)
- Individual CDD: 1 field
- Corporate CDD: 1 field (directors)
- Agents CDD: 1 field
- Brokers CDD: 1 field (directors)
- Partners CDD: 2 fields (company + partners)

**Naming Conventions**:
- Individual forms: `NIN` or `NINNumber`
- Corporate forms (company): `NINNumber`
- Corporate forms (directors): `NINNumber`
- Partners CDD: `nin` (lowercase to match existing `bvn` pattern)

**Validation Pattern** (consistent across all forms):
```typescript
.required("NIN is required")
.matches(/^\d+$/, "NIN must contain only numbers")
.length(11, "NIN must be exactly 11 digits")
```

**UI Pattern** (consistent across all forms):
- Placed next to or after BVN field
- 2-column grid layout
- maxLength={11}
- Required field with asterisk
- Label: "NIN (National Identification Number)"
