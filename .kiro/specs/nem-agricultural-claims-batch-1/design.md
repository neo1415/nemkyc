# Design Document

## Overview

This document provides the technical design for implementing two NEM Insurance agricultural claim forms: Farm Property and Produce Insurance Claim Form (FPP) and Livestock Insurance Claim Form (LIV). The implementation follows the established Smart Protection claim form patterns.

## Architecture

### Component Structure

```
src/pages/claims/
├── FarmPropertyProduceClaim.tsx          # FPP form component
└── LivestockClaim.tsx                    # LIV form component

src/pages/admin/
├── AdminFarmPropertyProduceClaimsTable.tsx
└── AdminLivestockClaimsTable.tsx

src/components/claims/
├── FarmPropertyProduceFormViewer.tsx
├── LivestockFormViewer.tsx
├── FarmPropertyProducePDFGenerator.tsx
└── LivestockPDFGenerator.tsx

src/config/
└── formMappings.ts                       # Updated with new mappings
```

### Data Flow

1. User fills form → Draft auto-saved to localStorage
2. User completes form → Validation runs
3. User clicks submit → Summary dialog displays
4. User confirms → useAuthRequiredSubmit hook handles submission
5. Backend processes → Firestore stores data
6. Admin views → Table fetches and displays submissions
7. Admin clicks row → Form viewer displays details
8. Admin generates PDF → PDF generator creates document

## Component Designs

### 1. FarmPropertyProduceClaim Component

**Purpose:** Render the Farm Property and Produce insurance claim form

**Key Features:**
- Multi-step form with 4 sections
- Conditional field for pest/disease specification
- Array field for damaged items
- File uploads for signature and receipts
- Form validation with yup schema
- Auto-save draft functionality
- Summary dialog before submission

**Schema Definition:**

```typescript
const farmPropertyProduceSchema = yup.object().shape({
  // Section 1: Policy & Insured Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),
  insuredName: yup.string().required("Insured name is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required"),
  
  // Section 2: Cause of Loss
  dateOfLoss: yup.date().required("Date of loss is required"),
  timeOfLoss: yup.string().required("Time of loss is required"),
  causeOfLoss: yup.string().required("Cause of loss is required"),
  pestDiseaseSpecification: yup.string().when('causeOfLoss', {
    is: 'outbreak-pest-disease',
    then: (schema) => schema.required("Please specify the pest or disease"),
    otherwise: (schema) => schema
  }),
  lossDescription: yup.string().required("Loss description is required"),
  
  // Section 3: Property Lost or Damaged
  damagedItems: yup.array().of(
    yup.object().shape({
      itemDescription: yup.string().required("Item description is required"),
      numberOrQuantity: yup.string().required("Number or quantity is required"),
      valueBeforeLoss: yup.string().required("Value before loss is required"),
      salvageValue: yup.string().required("Salvage value is required")
    })
  ).min(1, "At least one damaged item is required"),
  
  // Section 4: Declaration & Signature
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy policy"),
  declarationTrue: yup.boolean().oneOf([true], "You must agree to the declaration"),
  signature: yup.string().required("Signature is required"),
  signatureUpload: yup.mixed().required("Signature upload is required"),
  receiptsAndInvoices: yup.mixed()
});
```

**Sections:**

1. **Policy & Insured Details**
   - Policy number, cover period dates
   - Insured name, address, phone, email

2. **Cause of Loss**
   - Date and time of loss
   - Cause of loss (dropdown)
   - Conditional: Pest/disease specification
   - Loss description (textarea)

3. **Property Lost or Damaged**
   - Array of damaged items with:
     - Item description
     - Number or quantity
     - Value before loss
     - Salvage value
   - Add/remove item buttons

4. **Declaration & Signature**
   - Data privacy checkbox
   - Declaration checkbox
   - Signature text field
   - Signature upload (required)
   - Receipts and invoices upload (optional, multiple)

### 2. LivestockClaim Component

**Purpose:** Render the Livestock insurance claim form

**Key Features:**
- Multi-step form with 4 sections
- Conditional fields for disease specification and other cause
- Multiple file upload fields
- Form validation with yup schema
- Auto-save draft functionality
- Summary dialog before submission

**Schema Definition:**

```typescript
const livestockSchema = yup.object().shape({
  // Section 1: Policy & Insured Details
  policyNumber: yup.string().required("Policy number is required"),
  periodOfCoverFrom: yup.date().required("Period of cover from is required"),
  periodOfCoverTo: yup.date().required("Period of cover to is required"),
  insuredName: yup.string().required("Insured name is required"),
  address: yup.string().required("Address is required"),
  phone: yup.string().required("Phone number is required"),
  email: yup.string().email("Valid email is required"),
  
  // Section 2: Cause of Loss
  dateOfLoss: yup.date().required("Date of loss is required"),
  timeOfLoss: yup.string().required("Time of loss is required"),
  causeOfDeath: yup.string().required("Cause of death is required"),
  diseaseSpecification: yup.string().when('causeOfDeath', {
    is: 'outbreak-pest-disease',
    then: (schema) => schema.required("Please specify the disease"),
    otherwise: (schema) => schema
  }),
  otherCauseExplanation: yup.string().when('causeOfDeath', {
    is: 'other-cause',
    then: (schema) => schema.required("Please explain the cause"),
    otherwise: (schema) => schema
  }),
  
  // Section 3: Claim Details
  livestockType: yup.string().required("Livestock type is required"),
  numberOfAnimals: yup.number().required("Number of animals is required").positive(),
  ageOfAnimals: yup.string().required("Age of animals is required"),
  valuePerAnimal: yup.string().required("Value per animal is required"),
  totalClaimValue: yup.string().required("Total claim value is required"),
  circumstancesOfLoss: yup.string().required("Circumstances of loss is required"),
  
  // Section 4: Declaration & Signature
  agreeToDataPrivacy: yup.boolean().oneOf([true], "You must agree to data privacy policy"),
  declarationTrue: yup.boolean().oneOf([true], "You must agree to the declaration"),
  signature: yup.string().required("Signature is required"),
  signatureUpload: yup.mixed().required("Signature upload is required"),
  medicalPostMortemReports: yup.mixed(),
  receiptsInvoicesMortalityRecords: yup.mixed()
});
```

**Sections:**

1. **Policy & Insured Details**
   - Policy number, cover period dates
   - Insured name, address, phone, email

2. **Cause of Loss**
   - Date and time of loss
   - Cause of death (dropdown)
   - Conditional: Disease specification
   - Conditional: Other cause explanation

3. **Claim Details**
   - Livestock type
   - Number of animals
   - Age of animals
   - Value per animal
   - Total claim value
   - Circumstances of loss (textarea)

4. **Declaration & Signature**
   - Data privacy checkbox
   - Declaration checkbox
   - Signature text field
   - Signature upload (required)
   - Medical/post-mortem reports (optional, multiple)
   - Receipts/invoices/mortality records (optional, multiple)

### 3. Admin Tables

**AdminFarmPropertyProduceClaimsTable:**

```typescript
interface FPPClaimRow {
  id: string;
  ticketId: string;
  policyNumber: string;
  insuredName: string;
  dateOfLoss: Date;
  status: string;
  submittedAt: Date;
}

// Columns: Ticket ID, Policy Number, Insured Name, Date of Loss, Status, Submitted At
// Features: Filter by status, search, row click opens viewer, status update
```

**AdminLivestockClaimsTable:**

```typescript
interface LIVClaimRow {
  id: string;
  ticketId: string;
  policyNumber: string;
  insuredName: string;
  dateOfLoss: Date;
  status: string;
  submittedAt: Date;
}

// Columns: Ticket ID, Policy Number, Insured Name, Date of Loss, Status, Submitted At
// Features: Filter by status, search, row click opens viewer, status update
```

### 4. Form Viewers

**FarmPropertyProduceFormViewer:**

Displays FPP form data in sections:
- Policy & Insured Details
- Cause of Loss (with conditional fields)
- Property Lost or Damaged (array display)
- Declaration & Signature
- File Downloads

**LivestockFormViewer:**

Displays LIV form data in sections:
- Policy & Insured Details
- Cause of Loss (with conditional fields)
- Claim Details
- Declaration & Signature
- File Downloads

### 5. PDF Generators

**FarmPropertyProducePDFGenerator:**

Generates PDF with:
- NEM Insurance header/branding
- All form sections
- Damaged items table
- Signature and date
- Footer with submission details

**LivestockPDFGenerator:**

Generates PDF with:
- NEM Insurance header/branding
- All form sections
- Claim details table
- Signature and date
- Footer with submission details

## Form Mappings Configuration

### Farm Property and Produce Mapping

```typescript
'farm-property-produce-claims': {
  title: 'Farm Property and Produce Claim',
  sections: [
    {
      title: 'Policy & Insured Details',
      fields: [
        { key: 'policyNumber', label: 'Policy Number', type: 'text', editable: true },
        { key: 'periodOfCoverFrom', label: 'Period of Cover From', type: 'date', editable: true },
        { key: 'periodOfCoverTo', label: 'Period of Cover To', type: 'date', editable: true },
        { key: 'insuredName', label: 'Insured Name', type: 'text', editable: true },
        { key: 'address', label: 'Address', type: 'textarea', editable: true },
        { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
        { key: 'email', label: 'Email', type: 'email', editable: true }
      ]
    },
    {
      title: 'Cause of Loss',
      fields: [
        { key: 'dateOfLoss', label: 'Date of Loss', type: 'date', editable: true },
        { key: 'timeOfLoss', label: 'Time of Loss', type: 'time', editable: true },
        { key: 'causeOfLoss', label: 'Cause of Loss', type: 'select', editable: true },
        { 
          key: 'pestDiseaseSpecification', 
          label: 'Pest/Disease Specification', 
          type: 'text', 
          editable: true,
          conditional: { dependsOn: 'causeOfLoss', value: 'outbreak-pest-disease' }
        },
        { key: 'lossDescription', label: 'Loss Description', type: 'textarea', editable: true }
      ]
    },
    {
      title: 'Property Lost or Damaged',
      fields: [
        { key: 'damagedItems', label: 'Damaged Items', type: 'array', editable: true }
      ]
    },
    {
      title: 'Declaration & Signature',
      fields: [
        { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
        { key: 'declarationTrue', label: 'Declaration Acceptance', type: 'boolean', editable: false },
        { key: 'signature', label: 'Digital Signature', type: 'text', editable: true },
        { key: 'signatureUpload', label: 'Signature Upload', type: 'file', editable: false },
        { key: 'receiptsAndInvoices', label: 'Receipts and Invoices', type: 'file', editable: false }
      ]
    },
    {
      title: 'System Information',
      fields: [
        { key: 'ticketId', label: 'Ticket ID', type: 'text', editable: false },
        { key: 'status', label: 'Status', type: 'text', editable: true },
        { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
        { key: 'formType', label: 'Form Type', type: 'text', editable: false }
      ]
    }
  ]
}
```

### Livestock Mapping

```typescript
'livestock-claims': {
  title: 'Livestock Insurance Claim',
  sections: [
    {
      title: 'Policy & Insured Details',
      fields: [
        { key: 'policyNumber', label: 'Policy Number', type: 'text', editable: true },
        { key: 'periodOfCoverFrom', label: 'Period of Cover From', type: 'date', editable: true },
        { key: 'periodOfCoverTo', label: 'Period of Cover To', type: 'date', editable: true },
        { key: 'insuredName', label: 'Insured Name', type: 'text', editable: true },
        { key: 'address', label: 'Address', type: 'textarea', editable: true },
        { key: 'phone', label: 'Phone Number', type: 'text', editable: true },
        { key: 'email', label: 'Email', type: 'email', editable: true }
      ]
    },
    {
      title: 'Cause of Loss',
      fields: [
        { key: 'dateOfLoss', label: 'Date of Loss', type: 'date', editable: true },
        { key: 'timeOfLoss', label: 'Time of Loss', type: 'time', editable: true },
        { key: 'causeOfDeath', label: 'Cause of Death', type: 'select', editable: true },
        { 
          key: 'diseaseSpecification', 
          label: 'Disease Specification', 
          type: 'text', 
          editable: true,
          conditional: { dependsOn: 'causeOfDeath', value: 'outbreak-pest-disease' }
        },
        { 
          key: 'otherCauseExplanation', 
          label: 'Other Cause Explanation', 
          type: 'textarea', 
          editable: true,
          conditional: { dependsOn: 'causeOfDeath', value: 'other-cause' }
        }
      ]
    },
    {
      title: 'Claim Details',
      fields: [
        { key: 'livestockType', label: 'Livestock Type', type: 'text', editable: true },
        { key: 'numberOfAnimals', label: 'Number of Animals', type: 'number', editable: true },
        { key: 'ageOfAnimals', label: 'Age of Animals', type: 'text', editable: true },
        { key: 'valuePerAnimal', label: 'Value per Animal', type: 'currency', editable: true },
        { key: 'totalClaimValue', label: 'Total Claim Value', type: 'currency', editable: true },
        { key: 'circumstancesOfLoss', label: 'Circumstances of Loss', type: 'textarea', editable: true }
      ]
    },
    {
      title: 'Declaration & Signature',
      fields: [
        { key: 'agreeToDataPrivacy', label: 'Agree to Data Privacy', type: 'boolean', editable: false },
        { key: 'declarationTrue', label: 'Declaration Acceptance', type: 'boolean', editable: false },
        { key: 'signature', label: 'Digital Signature', type: 'text', editable: true },
        { key: 'signatureUpload', label: 'Signature Upload', type: 'file', editable: false },
        { key: 'medicalPostMortemReports', label: 'Medical/Post-Mortem Reports', type: 'file', editable: false },
        { key: 'receiptsInvoicesMortalityRecords', label: 'Receipts/Invoices/Mortality Records', type: 'file', editable: false }
      ]
    },
    {
      title: 'System Information',
      fields: [
        { key: 'ticketId', label: 'Ticket ID', type: 'text', editable: false },
        { key: 'status', label: 'Status', type: 'text', editable: true },
        { key: 'submittedAt', label: 'Submitted At', type: 'date', editable: false },
        { key: 'formType', label: 'Form Type', type: 'text', editable: false }
      ]
    }
  ]
}
```

## Integration Points

### 1. App.tsx Routes

```typescript
<Route path="/claims/farm-property-produce" element={<FarmPropertyProduceClaim />} />
<Route path="/claims/livestock" element={<LivestockClaim />} />
```

### 2. Navbar.tsx Navigation Items

```typescript
{
  label: 'Farm Property & Produce Claim',
  path: '/claims/farm-property-produce',
  icon: <Wheat className="h-4 w-4" />
},
{
  label: 'Livestock Claim',
  path: '/claims/livestock',
  icon: <Cow className="h-4 w-4" />
}
```

### 3. AdminDashboard.tsx Sidebar Items

```typescript
{
  label: 'Farm Property & Produce Claims',
  path: '/admin/farm-property-produce-claims',
  icon: <Wheat className="h-4 w-4" />
},
{
  label: 'Livestock Claims',
  path: '/admin/livestock-claims',
  icon: <Cow className="h-4 w-4" />
}
```

### 4. useAuthRequiredSubmit Hook Updates

Add form page URL mappings:

```typescript
if (formTypeLower.includes('farm property') && formTypeLower.includes('produce')) {
  return '/claims/farm-property-produce';
}
if (formTypeLower.includes('livestock')) {
  return '/claims/livestock';
}
```

## File Upload Handling

### Upload Strategy

1. Use existing `uploadFile` service from `src/services/fileService.ts`
2. Store files in Firebase Storage under path: `claims/{formType}/{ticketId}/{fieldName}/`
3. Store file metadata in Firestore with submission
4. Support multiple files for optional upload fields

### File Validation

- Allowed types: PDF, JPG, JPEG, PNG
- Max file size: 5MB per file
- Max total size: 20MB per submission

## Ticket ID Generation

Use existing `generateTicketId` utility:

```typescript
import { generateTicketId } from '@/utils/ticketIdGenerator';

// For FPP form
const ticketId = generateTicketId('FPP');

// For LIV form
const ticketId = generateTicketId('LIV');
```

## State Management

### Form State

- Use `react-hook-form` for form state management
- Use `useFormDraft` hook for auto-save functionality
- Use `useEnhancedFormSubmit` hook for submission handling

### Draft Storage

- Store drafts in localStorage with keys:
  - `farmPropertyProduceClaim`
  - `livestockClaim`
- Clear drafts on successful submission

## Error Handling

### Validation Errors

- Display inline errors below fields
- Prevent step navigation with errors
- Highlight error fields in red

### Submission Errors

- Display error toast notification
- Log errors to console
- Maintain form state for retry

### File Upload Errors

- Display error message below upload field
- Allow retry without losing other form data
- Validate before upload attempt

## Accessibility

- All form fields have proper labels
- Error messages are announced to screen readers
- Keyboard navigation supported
- Focus management in multi-step form
- ARIA attributes for dynamic content

## Performance Considerations

- Lazy load admin tables
- Paginate table results (50 per page)
- Debounce search inputs
- Optimize file uploads with progress indicators
- Cache form mappings

## Security

- Validate all inputs on client and server
- Sanitize file uploads
- Authenticate all API requests
- Authorize admin access to tables
- Encrypt sensitive data in transit

## Testing Strategy

### Unit Tests

- Form validation schemas
- Conditional field logic
- Array field operations
- File upload validation

### Integration Tests

- Form submission flow
- Admin table data fetching
- Form viewer display
- PDF generation

### E2E Tests

- Complete form submission
- Admin workflow
- File upload and download
- Error scenarios

## Correctness Properties

### Property 1: Form Data Round-Trip

**Type:** Round Trip Property

**Description:** Submitting form data and then retrieving it should produce equivalent data

**Test:**
```typescript
// For any valid form submission
const originalData = generateValidFPPData();
const submittedId = await submitForm(originalData);
const retrievedData = await fetchFormData(submittedId);
expect(normalizeFormData(retrievedData)).toEqual(normalizeFormData(originalData));
```

### Property 2: Conditional Field Visibility

**Type:** Invariant

**Description:** Conditional fields should only be visible when their dependency condition is met

**Test:**
```typescript
// For FPP form
if (formData.causeOfLoss !== 'outbreak-pest-disease') {
  expect(isFieldVisible('pestDiseaseSpecification')).toBe(false);
}

// For LIV form
if (formData.causeOfDeath !== 'outbreak-pest-disease') {
  expect(isFieldVisible('diseaseSpecification')).toBe(false);
}
if (formData.causeOfDeath !== 'other-cause') {
  expect(isFieldVisible('otherCauseExplanation')).toBe(false);
}
```

### Property 3: Array Field Operations

**Type:** Invariant

**Description:** Adding and removing items from array fields should maintain data integrity

**Test:**
```typescript
const initialCount = damagedItems.length;
addItem(newItem);
expect(damagedItems.length).toBe(initialCount + 1);
removeItem(0);
expect(damagedItems.length).toBe(initialCount);
```

### Property 4: Validation Consistency

**Type:** Metamorphic Property

**Description:** Validation should produce consistent results for the same input

**Test:**
```typescript
const formData = generateFormData();
const result1 = validateForm(formData);
const result2 = validateForm(formData);
expect(result1).toEqual(result2);
```

### Property 5: File Upload Idempotence

**Type:** Idempotence

**Description:** Uploading the same file multiple times should not create duplicates

**Test:**
```typescript
const file = generateTestFile();
const url1 = await uploadFile(file, 'signatureUpload');
const url2 = await uploadFile(file, 'signatureUpload');
// Should return same URL or replace previous upload
expect(url1).toBeDefined();
expect(url2).toBeDefined();
```

## Deployment Checklist

- [ ] All components implemented and tested
- [ ] Routes registered in App.tsx
- [ ] Navigation items added to Navbar
- [ ] Admin sidebar items added
- [ ] Form mappings configured
- [ ] File upload paths configured
- [ ] Firestore security rules updated
- [ ] Storage security rules updated
- [ ] Backend endpoints tested
- [ ] PDF generation tested
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met
- [ ] Documentation updated
