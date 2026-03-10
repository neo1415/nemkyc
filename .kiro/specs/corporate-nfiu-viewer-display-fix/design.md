# Corporate NFIU Viewer Display Fix - Bugfix Design

## Overview

The Corporate NFIU form viewer currently uses the generic FormViewer component which results in inconsistent field ordering, technical metadata leaking into the display, and poor PDF quality. This fix creates a dedicated CorporateNFIUViewer component following the exact structure of CorporateKYCViewer to ensure consistent field ordering, professional PDF generation with NEM branding, and clean 2-column grid layout. The fix involves creating the new viewer component and routing to it from FormViewer when the collection is 'corporate-nfiu-form'.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when Corporate NFIU forms are viewed using the generic FormViewer instead of a dedicated viewer component
- **Property (P)**: The desired behavior when Corporate NFIU forms are viewed - consistent field ordering, clean display without metadata, professional PDF generation with NEM branding
- **Preservation**: Existing viewer routing for other form types (CorporateKYCViewer, IndividualKYCViewer, etc.) and all FormViewer functionality for non-NFIU forms must remain unchanged
- **FormViewer**: The generic form viewer component in `src/pages/admin/FormViewer.tsx` that routes to specialized viewers
- **CorporateKYCViewer**: The specialized viewer component in `src/pages/admin/CorporateKYCViewer.tsx` that serves as the template for the new CorporateNFIUViewer
- **html2canvas + jsPDF**: The PDF generation approach used by CorporateKYCViewer that captures the visual layout as an image and embeds it in a PDF with NEM branding
- **Directors Array**: The data structure containing director information, which can be either an array of director objects or flat fields (firstName, firstName2, etc.)
- **Technical Metadata**: Fields like "_rowHeight", numeric values like "32", and other internal fields that should not be displayed to users

## Bug Details

### Fault Condition

The bug manifests when a Corporate NFIU form is viewed in the admin interface. The FormViewer component uses a generic array rendering approach with Object.entries() which doesn't guarantee field order, displays technical metadata fields, lacks proper director card formatting, and generates poor-quality PDFs without NEM branding.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { collection: string, formData: any }
  OUTPUT: boolean
  
  RETURN input.collection === 'corporate-nfiu-form'
         AND currentViewer === 'FormViewer'
         AND NOT usingDedicatedCorporateNFIUViewer
END FUNCTION
```

### Examples

- **Example 1**: Admin views a Corporate NFIU form → Directors section displays fields in random order (firstName, BVNNumber, email, lastName instead of firstName, middleName, lastName, dob...)
- **Example 2**: Admin views a Corporate NFIU form → Technical metadata fields like "_rowHeight" and "32" appear in the display
- **Example 3**: Admin generates PDF for Corporate NFIU form → PDF has messy table layout without NEM Insurance header and burgundy branding
- **Example 4**: Admin views a Corporate NFIU form with flat director structure (firstName, firstName2) → Directors are not displayed in separate cards with "Director 1", "Director 2" headers

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Non-Corporate-NFIU forms must continue to use their appropriate viewer components (CorporateKYCViewer for corporate-kyc-form, IndividualKYCViewer for Individual-kyc-form, etc.)
- FormViewer routing logic for all other form types must remain unchanged
- Corporate NFIU forms with flat director structure must continue to synthesize directors array correctly
- Corporate NFIU forms with array director structure must continue to display directors correctly
- All form viewers must continue to pass formData and navigation handlers correctly
- PDF generation for all forms must continue to handle multi-page content correctly
- All form viewers must continue to display file upload fields with download buttons
- All form viewers must continue to format dates, times, and currency values correctly
- All form viewers must continue to display ticket ID prominently if present

**Scope:**
All inputs that do NOT involve viewing Corporate NFIU forms (collection !== 'corporate-nfiu-form') should be completely unaffected by this fix. This includes:
- Viewing corporate-kyc-form, Individual-kyc-form, individual-nfiu-form, and all claims forms
- Viewing forms in user dashboards (non-admin views)
- Editing form data in FormViewer
- Updating form status in FormViewer

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Missing Dedicated Viewer Component**: FormViewer uses a generic rendering approach with Object.entries() which doesn't guarantee field order, unlike CorporateKYCViewer which explicitly defines field order.

2. **No Routing Logic for Corporate NFIU**: FormViewer has conditional routing for 'corporate-kyc-form' and 'Individual-kyc-form' but not for 'corporate-nfiu-form', causing it to fall through to the generic rendering path.

3. **Generic PDF Generation**: FormViewer uses a different PDF generation approach (downloadDynamicPDF service) instead of the html2canvas + jsPDF approach used by CorporateKYCViewer with NEM branding.

4. **No Metadata Filtering**: The generic FormViewer rendering doesn't filter out technical metadata fields like "_rowHeight" and numeric values.

5. **No Director Card Formatting**: The generic FormViewer doesn't have special handling for directors arrays to display them in separate cards with clear headers.

## Correctness Properties

Property 1: Fault Condition - Corporate NFIU Forms Use Dedicated Viewer

_For any_ form view request where the collection is 'corporate-nfiu-form', the system SHALL route to the dedicated CorporateNFIUViewer component which displays fields in consistent order, filters out technical metadata, formats directors in separate cards, and generates professional PDFs with NEM branding.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

Property 2: Preservation - Non-Corporate-NFIU Form Routing

_For any_ form view request where the collection is NOT 'corporate-nfiu-form', the system SHALL produce exactly the same routing behavior as the original code, preserving all existing viewer component selection logic for corporate-kyc-form, Individual-kyc-form, individual-nfiu-form, and all other form types.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `src/pages/admin/CorporateNFIUViewer.tsx` (NEW FILE)

**Purpose**: Create dedicated viewer component for Corporate NFIU forms

**Specific Changes**:
1. **Copy CorporateKYCViewer Structure**: Use CorporateKYCViewer.tsx as the template, maintaining the same component structure, imports, and helper functions
   - Import React, UI components (Card, Button, Separator, Badge), icons (Download, FileText, Building2, Users, CreditCard, FileCheck)
   - Import jsPDF and html2canvas for PDF generation
   - Define CorporateNFIUViewerProps interface with data and onClose props

2. **Implement Helper Functions**: Copy formatValue, formatDate, and extractDirectorsData functions from CorporateKYCViewer
   - formatValue: Handles empty values and file upload fields
   - formatDate: Handles Firebase Timestamps, Date objects, and DD/MM/YYYY strings
   - extractDirectorsData: Handles both array format (data.directors) and flat format (firstName, firstName2, etc.)

3. **Define Corporate NFIU Field Ordering**: Explicitly order fields in Company Information section
   - insured (Company Name)
   - officeAddress (Office Address)
   - ownershipOfCompany (Ownership of Company)
   - website (Website)
   - incorporationNumber (Incorporation Number)
   - incorporationState (State of Incorporation)
   - dateOfIncorporationRegistration (Date of Incorporation)
   - contactPersonNo (Company Contact Number)
   - businessTypeOccupation (Business Type/Occupation)
   - taxIDNo (Tax Identification Number)
   - emailAddress (Email Address of the Company)
   - premiumPaymentSource (Premium Payment Source)
   - premiumPaymentSourceOther (Other Payment Source - conditional)

4. **Define Director Field Ordering**: Explicitly order fields for each director in Directors Information section
   - firstName, middleName, lastName
   - dateOfBirth, placeOfBirth, nationality
   - occupation, email, phoneNumber
   - BVNNumber, NINNumber, taxIDNumber
   - residentialAddress, employersName, employersPhoneNumber
   - idType, idNumber, issuingBody, issuedDate, expiryDate
   - sourceOfIncome, sourceOfIncomeOther (conditional)

5. **Implement PDF Generation with NEM Branding**: Copy downloadPDF function from CorporateKYCViewer
   - Use html2canvas to capture #corporate-nfiu-pdf-content element
   - Create jsPDF with A4 portrait orientation
   - Add NEM Insurance header with burgundy color (#800020)
   - Add corporate office addresses
   - Add burgundy separator line
   - Add "Corporate NFIU Form" title
   - Handle multi-page content by splitting canvas
   - Save as `Corporate_NFIU_${data.insured || 'form'}.pdf`

6. **Implement 2-Column Grid Layout**: Use the same Card-based layout as CorporateKYCViewer
   - Company Information Card with grid-cols-1 md:grid-cols-2
   - Directors Information Card with separate sections for each director
   - Account Details Card with Local and Foreign account sections
   - Verification Documents Card
   - System Information Card

7. **Filter Technical Metadata**: Only display explicitly defined fields, automatically excluding technical metadata like "_rowHeight", numeric keys, and internal fields

**File 2**: `src/pages/admin/FormViewer.tsx`

**Purpose**: Add routing logic for Corporate NFIU forms

**Specific Changes**:
1. **Add Import Statement**: Add `import CorporateNFIUViewer from './CorporateNFIUViewer';` at the top with other viewer imports

2. **Add Routing Condition**: Add conditional rendering block after the existing viewer conditions (around line 870-920)
   ```typescript
   if (collection === 'corporate-nfiu-form') {
     return (
       <ThemeProvider theme={theme}>
         <Box sx={{ 
           p: { xs: 2, sm: 3 }, 
           maxWidth: '1200px', 
           mx: 'auto',
           width: '100%',
           minHeight: '100vh'
         }}>
           <Button
             startIcon={<ArrowLeft />}
             onClick={() => navigate(-1)}
             sx={{ mb: 3 }}
           >
             Back
           </Button>
           <CorporateNFIUViewer 
             data={formData} 
             onClose={() => navigate(-1)} 
           />
         </Box>
       </ThemeProvider>
     );
   }
   ```

3. **Position in Routing Logic**: Place this condition BEFORE the generic FormViewer rendering logic, alongside the existing corporate-kyc-form and Individual-kyc-form conditions

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that load Corporate NFIU forms in FormViewer and assert that fields are displayed in consistent order, technical metadata is filtered out, directors are in separate cards, and PDF generation uses html2canvas + jsPDF with NEM branding. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Field Ordering Test**: Load a Corporate NFIU form multiple times and verify field order is inconsistent (will fail on unfixed code - order changes on each load)
2. **Metadata Leakage Test**: Load a Corporate NFIU form and verify technical metadata fields like "_rowHeight" appear in the display (will fail on unfixed code - metadata is visible)
3. **Director Card Formatting Test**: Load a Corporate NFIU form with directors and verify they are not in separate cards with "Director 1", "Director 2" headers (will fail on unfixed code - no card formatting)
4. **PDF Generation Test**: Generate PDF for Corporate NFIU form and verify it lacks NEM branding and uses table layout instead of html2canvas (will fail on unfixed code - poor PDF quality)

**Expected Counterexamples**:
- Field order is random due to Object.entries() iteration order
- Technical metadata fields appear because there's no filtering logic
- Directors are displayed as flat list without card formatting
- PDF uses downloadDynamicPDF service instead of html2canvas + jsPDF with NEM branding
- Possible causes: missing dedicated viewer component, no routing logic for corporate-nfiu-form, generic rendering approach

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := viewForm_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Expected Behavior:**
- Fields are displayed in consistent order on every page load
- Technical metadata fields are not visible
- Directors are displayed in separate cards with clear headers
- PDF includes NEM Insurance header with burgundy branding
- PDF uses html2canvas to capture visual layout

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT viewForm_original(input) = viewForm_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-Corporate-NFIU forms

**Test Plan**: Observe behavior on UNFIXED code first for other form types (corporate-kyc-form, Individual-kyc-form, individual-nfiu-form, claims forms), then write property-based tests capturing that behavior.

**Test Cases**:
1. **Corporate KYC Routing Preservation**: Verify corporate-kyc-form continues to route to CorporateKYCViewer
2. **Individual KYC Routing Preservation**: Verify Individual-kyc-form continues to route to IndividualKYCViewer
3. **Individual NFIU Routing Preservation**: Verify individual-nfiu-form continues to use its appropriate viewer
4. **Claims Forms Routing Preservation**: Verify all claims forms continue to use generic FormViewer rendering
5. **FormData Passing Preservation**: Verify formData and navigation handlers are passed correctly to all viewers
6. **PDF Multi-Page Preservation**: Verify multi-page PDF generation continues to work for all form types
7. **File Upload Display Preservation**: Verify file upload fields with download buttons continue to work
8. **Date Formatting Preservation**: Verify date, time, and currency formatting continues to work
9. **Ticket ID Display Preservation**: Verify ticket ID display continues to work for all forms

### Unit Tests

- Test CorporateNFIUViewer renders all Company Information fields in correct order
- Test CorporateNFIUViewer renders directors in separate cards with headers
- Test CorporateNFIUViewer filters out technical metadata fields
- Test CorporateNFIUViewer handles both flat and array director data structures
- Test CorporateNFIUViewer formatDate function handles various date formats
- Test CorporateNFIUViewer formatValue function handles empty values and file fields
- Test FormViewer routes to CorporateNFIUViewer when collection is 'corporate-nfiu-form'
- Test FormViewer continues to route to other viewers for other collections

### Property-Based Tests

- Generate random Corporate NFIU form data and verify field order is always consistent
- Generate random Corporate NFIU form data with various metadata fields and verify metadata is always filtered out
- Generate random director data (both flat and array formats) and verify correct card formatting
- Generate random form collections (excluding corporate-nfiu-form) and verify routing behavior is unchanged
- Generate random date values and verify formatting is consistent across all viewers

### Integration Tests

- Test full flow: navigate to Corporate NFIU form → verify CorporateNFIUViewer is rendered → verify field order → verify no metadata
- Test full flow: navigate to Corporate NFIU form → click Download PDF → verify PDF has NEM branding and professional formatting
- Test full flow: navigate to Corporate NFIU form with flat directors → verify directors are synthesized into array → verify card display
- Test full flow: navigate to Corporate NFIU form with array directors → verify card display
- Test full flow: navigate to corporate-kyc-form → verify CorporateKYCViewer is rendered (preservation)
- Test full flow: navigate to Individual-kyc-form → verify IndividualKYCViewer is rendered (preservation)
