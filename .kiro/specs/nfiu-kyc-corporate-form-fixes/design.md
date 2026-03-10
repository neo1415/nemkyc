# NFIU-KYC Corporate Form Fixes Design

## Overview

This design addresses multiple configuration and validation bugs in the NFIU and KYC corporate forms that cause incorrect field requirements, missing validations, and inconsistent data display across the admin dashboard. The fix involves updating form configurations, validation logic, and admin dashboard components to correctly handle field differences between NFIU and KYC forms.

The approach is surgical and targeted: modify only the specific fields that differ between NFIU and KYC forms while preserving all existing functionality for other fields and forms. The fix follows a three-layer strategy:
1. Form configuration layer (formConfigs.ts)
2. Validation layer (formValidation.ts)
3. Admin dashboard display layer (FormViewer, AdminUnifiedTable, CSV/PDF generators)

## Glossary

- **Bug_Condition (C)**: The condition that triggers incorrect behavior - when NFIU Corporate form fields are configured or validated incorrectly, or when admin dashboard components fail to properly display/export the modified field structure
- **Property (P)**: The desired behavior - NFIU Corporate form fields should match requirements specification, validation should execute correctly, and admin dashboard should display/export data accurately
- **Preservation**: All other forms (KYC Corporate, Individual forms) and unmodified NFIU Corporate fields must continue to work exactly as before
- **formConfigs.ts**: The configuration file in `src/config/formConfigs.ts` that defines form structure, field types, and requirements
- **formValidation.ts**: The validation utility in `src/utils/formValidation.ts` that generates Yup schemas from form configurations
- **Field Mapping**: The process of translating database field names to display labels in admin dashboard components
- **NFIU Corporate Form**: The form type 'nfiu-corporate' used for regulatory reporting to the Nigerian Financial Intelligence Unit
- **KYC Corporate Form**: The form type 'kyc-corporate' used for customer onboarding and verification

## Bug Details

### Fault Condition

The bugs manifest when the NFIU Corporate form is rendered, submitted, or displayed in the admin dashboard. The form configuration in `formConfigs.ts` has incorrect field types and requirements, validation logic in `formValidation.ts` doesn't properly handle modified fields, and admin dashboard components don't account for renamed/combined fields.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { formType: string, operation: string, fieldName: string }
  OUTPUT: boolean
  
  RETURN (input.formType === 'nfiu-corporate') AND
         (
           // Form configuration bugs
           (input.operation === 'render' AND input.fieldName === 'website' AND fieldIsMarkedRequired()) OR
           (input.operation === 'render' AND input.fieldName === 'ownershipOfCompany' AND fieldType !== 'select') OR
           (input.operation === 'render' AND (input.fieldName === 'natureOfBusiness' OR input.fieldName === 'businessOccupation') AND fieldsAreSeparate()) OR
           
           // Validation bugs
           (input.operation === 'submit' AND input.fieldName === 'ownershipOfCompany' AND NOT hasSelectValidation()) OR
           (input.operation === 'submit' AND input.fieldName === 'businessTypeOccupation' AND NOT hasValidation()) OR
           
           // Admin dashboard bugs
           (input.operation === 'display' AND input.fieldName IN ['ownershipOfCompany', 'businessTypeOccupation'] AND NOT hasFieldMapping()) OR
           (input.operation === 'export' AND input.fieldName === 'businessTypeOccupation' AND NOT properlyHandledInExport())
         )
END FUNCTION
```

### Examples

**Form Configuration Issues:**
- When rendering NFIU Corporate form, the Website field displays with `required: true` and shows a red asterisk, but requirements specify it should be optional
- When rendering NFIU Corporate form, the Ownership field displays as `type: 'text'` (text input), but requirements specify it should be `type: 'select'` with options ["Nigerian", "Foreign", "Both"]
- When rendering NFIU Corporate form, Business Type and Occupation display as two separate fields (`natureOfBusiness` and `businessOccupation`), but requirements specify they should be combined into a single field labeled "Business Type/Occupation"

**Validation Issues:**
- When submitting NFIU Corporate form with ownership value "Invalid", no validation error occurs because the field is configured as text type instead of select type with enum validation
- When submitting NFIU Corporate form with the combined business type/occupation field, validation may fail because the validation schema still references the old separate field names

**Admin Dashboard Issues:**
- When FormViewer displays NFIU Corporate form data, the combined business type/occupation field may not display correctly because field mappings reference the old separate field names
- When CSVGenerator exports NFIU Corporate form data, the ownership select field value may not be properly formatted, and the combined business type/occupation field may be missing from the export
- When AdminUnifiedTable attempts to sort by the ownership field, it may fail because the field type changed from text to select

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- KYC Corporate form must continue to display all fields correctly with existing configuration (Website required, Ownership as text, separate Business Type and Occupation fields, Contact Person Name mandatory, Contact Person Email, Estimated Turnover mandatory, no Premium Payment Source, Tax ID optional)
- All NFIU Corporate fields other than Website, Ownership, and Business Type/Occupation must continue to display and validate with their current configuration
- Individual forms (NFIU and KYC) must continue to work exactly as before
- Admin dashboard components must continue to display non-NFIU Corporate forms correctly with existing field mappings
- Date handling must remain consistent across all forms

**Scope:**
All form types other than 'nfiu-corporate' should be completely unaffected by this fix. This includes:
- kyc-corporate form configuration and validation
- nfiu-individual and kyc-individual forms
- All claims forms (motor, fire, professional indemnity, etc.)
- All CDD forms (individual, brokers, agents, partners, corporate, NAICOM variants)

All NFIU Corporate fields other than the three modified fields (Website, Ownership, Business Type/Occupation) should continue to work exactly as before.

## Hypothesized Root Cause

Based on the bug description and requirements analysis, the root causes are:

1. **Incorrect Form Configuration**: The `nfiuCorporateConfig` in `formConfigs.ts` was not updated to match the requirements specification
   - Website field has `required: true` instead of `required: false`
   - Ownership field has `type: 'text'` instead of `type: 'select'` with options
   - Business Type and Occupation are two separate fields instead of one combined field

2. **Automatic Validation Generation**: The `formValidation.ts` utility automatically generates validation schemas from form configurations, so incorrect configurations lead to incorrect validation
   - The validation logic itself is correct, but it generates schemas based on the buggy configuration
   - Once configuration is fixed, validation will automatically be correct

3. **Missing Field Mappings**: Admin dashboard components may not have field mappings for the modified field structure
   - FormViewer, AdminUnifiedTable, CSVGenerator, and PDFGenerator may reference old field names
   - Select field values may not be properly formatted for display

4. **Unused Imports**: The `formConfigs.ts` file imports `yup` and defines `genderOptions` but never uses them, indicating incomplete cleanup from previous refactoring

## Correctness Properties

Property 1: Fault Condition - NFIU Corporate Form Configuration and Validation

_For any_ form rendering, submission, or display operation where the form type is 'nfiu-corporate' and the operation involves Website, Ownership, or Business Type/Occupation fields, the fixed configuration SHALL correctly specify field types, requirements, and validation rules according to the requirements specification, and admin dashboard components SHALL correctly display and export the data.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14**

Property 2: Preservation - Non-NFIU Corporate Forms and Fields

_For any_ form rendering, submission, or display operation where the form type is NOT 'nfiu-corporate' OR the operation involves fields other than Website, Ownership, and Business Type/Occupation, the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality for KYC forms, Individual forms, Claims forms, CDD forms, and unmodified NFIU Corporate fields.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/config/formConfigs.ts`

**Function**: `nfiuCorporateConfig` (exported constant)

**Specific Changes**:

1. **Remove Unused Imports**: Remove the unused `yup` import and `genderOptions` constant
   - Delete line: `import * as yup from 'yup';`
   - Delete lines defining `genderOptions` array

2. **Fix Website Field**: Change the Website field from required to optional
   - Locate the field with `name: 'website'` in the company section
   - Change `required: true` to `required: false`

3. **Fix Ownership Field**: Change the Ownership field from text input to select dropdown
   - Locate the field with `name: 'ownershipOfCompany'` in the company section
   - Change `type: 'text'` to `type: 'select'`
   - Add `options: nationalityOptions` (reuse existing options array)
   - Change `required: true` to `required: false`

4. **Combine Business Type and Occupation Fields**: Merge two separate fields into one
   - Remove the field with `name: 'businessOccupation'`
   - Modify the field with `name: 'natureOfBusiness'`:
     - Change `name` to `'businessTypeOccupation'`
     - Change `label` to `'Business Type/Occupation'`
     - Keep `type: 'text'`
     - Keep `required: true`

**File**: `src/utils/formValidation.ts`

**Function**: No changes required

**Rationale**: The validation utility automatically generates schemas from form configurations. Once the configuration is fixed, validation will automatically be correct. The existing `createFieldValidation` function already handles select fields with enum validation (line 48-53) and required/optional fields (line 68-75).

**File**: `src/pages/admin/FormViewer.tsx`

**Function**: Field mapping and display logic

**Specific Changes**:

1. **Update Field Mapping**: Ensure the form mapping configuration handles the renamed field
   - The component uses `FORM_MAPPINGS` from `src/config/formMappings.ts`
   - Need to verify that `businessTypeOccupation` is properly mapped
   - Need to verify that `ownershipOfCompany` select values are properly formatted

2. **Format Select Field Values**: Ensure select field values display correctly
   - The ownership field value should display as-is (Nigerian/Foreign/Both)
   - No special formatting needed since values are already human-readable

**File**: `src/pages/admin/AdminUnifiedTable.tsx`

**Function**: Table column definitions and data display

**Specific Changes**:

1. **Update Column Definitions**: Ensure table columns reference the correct field names
   - Update any column definitions that reference `natureOfBusiness` or `businessOccupation` to use `businessTypeOccupation`
   - Ensure `ownershipOfCompany` column handles select field values correctly

2. **Update Sort/Filter Logic**: Ensure sorting and filtering work with updated field names
   - Verify that sort functions reference `businessTypeOccupation` instead of old field names
   - Verify that filter functions handle select field values correctly

**File**: `src/services/analytics/CSVGenerator.ts`

**Function**: CSV export generation

**Specific Changes**:

1. **Update Field Labels**: Ensure CSV headers use correct field names
   - This file generates analytics reports, not form data exports
   - No changes needed unless it exports form submission data
   - Need to verify if this file is used for form data exports

**File**: `src/services/analytics/PDFGenerator.ts`

**Function**: PDF report generation

**Specific Changes**:

1. **Format Select Fields**: Ensure select field values are properly formatted in PDF
   - Ownership field should display as "Nigerian", "Foreign", or "Both"
   - No special formatting needed since values are already human-readable

2. **Update Field Labels**: Ensure PDF displays correct field labels
   - Business Type/Occupation should display as single field with combined label
   - Need to verify field mapping in PDF generation logic

### Data Migration Strategy

**Assessment**: No data migration required

**Rationale**:
- The Website field change (required → optional) is backward compatible - existing data remains valid
- The Ownership field change (text → select) is backward compatible - existing text values should already be "Nigerian", "Foreign", or "Both" based on form usage patterns
- The Business Type/Occupation field change (two fields → one field) requires careful handling:
  - Old submissions have `natureOfBusiness` and `businessOccupation` as separate fields
  - New submissions will have `businessTypeOccupation` as a single field
  - Admin dashboard components must handle both old and new data structures

**Backward Compatibility Strategy**:
1. Admin dashboard components should check for both old and new field names
2. When displaying old data, concatenate `natureOfBusiness` and `businessOccupation` if `businessTypeOccupation` is not present
3. When displaying new data, use `businessTypeOccupation` directly
4. This ensures seamless display of both old and new submissions without requiring data migration

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that render the NFIU Corporate form, submit it with various field values, and display it in admin dashboard components. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Website Field Required Test**: Render NFIU Corporate form and verify Website field shows red asterisk (will fail on unfixed code - should be optional)
2. **Ownership Field Type Test**: Render NFIU Corporate form and verify Ownership field is a text input (will fail on unfixed code - should be select)
3. **Business Fields Separation Test**: Render NFIU Corporate form and verify Business Type and Occupation are two separate fields (will fail on unfixed code - should be combined)
4. **Ownership Validation Test**: Submit NFIU Corporate form with ownership value "Invalid" and verify validation error (will fail on unfixed code - no validation for text field)
5. **Admin Dashboard Display Test**: Display NFIU Corporate form in FormViewer and verify combined business field displays correctly (will fail on unfixed code - field mapping missing)
6. **CSV Export Test**: Export NFIU Corporate form data to CSV and verify combined business field is included (will fail on unfixed code - field not handled)

**Expected Counterexamples**:
- Website field displays as required when it should be optional
- Ownership field displays as text input when it should be select dropdown
- Business Type and Occupation display as two fields when they should be one
- Ownership field accepts invalid values without validation error
- Admin dashboard components fail to display or export combined business field correctly
- Possible causes: incorrect form configuration, missing field mappings, incorrect validation schema generation

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderOrSubmitOrDisplay_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

**Test Cases**:
1. **Website Field Optional**: Render NFIU Corporate form and verify Website field does NOT show red asterisk and can be left empty
2. **Ownership Field Select**: Render NFIU Corporate form and verify Ownership field is a select dropdown with options ["Nigerian", "Foreign", "Both"] and is optional
3. **Business Fields Combined**: Render NFIU Corporate form and verify Business Type/Occupation is a single field labeled "Business Type/Occupation" and is required
4. **Ownership Validation**: Submit NFIU Corporate form with ownership value "Invalid" and verify validation error occurs
5. **Ownership Optional Validation**: Submit NFIU Corporate form with ownership field empty and verify no validation error (field is optional)
6. **Business Combined Validation**: Submit NFIU Corporate form with business type/occupation field empty and verify validation error occurs (field is required)
7. **Admin Dashboard Display**: Display NFIU Corporate form in FormViewer and verify all modified fields display correctly with proper labels and values
8. **CSV Export**: Export NFIU Corporate form data to CSV and verify all modified fields are included with correct labels
9. **PDF Export**: Generate PDF for NFIU Corporate form and verify all modified fields are formatted correctly

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderOrSubmitOrDisplay_original(input) = renderOrSubmitOrDisplay_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for KYC forms and other NFIU fields, then write property-based tests capturing that behavior.

**Test Cases**:

1. **KYC Corporate Form Preservation**: Render, submit, and display KYC Corporate form and verify all fields work exactly as before
   - Website field should remain required
   - Ownership field should remain text input
   - Business Type and Occupation should remain separate fields
   - Contact Person Name should remain mandatory
   - Contact Person Email should be used instead of Company Email
   - Estimated Turnover should remain mandatory
   - Premium Payment Source should NOT be present
   - Tax ID should remain optional

2. **NFIU Corporate Other Fields Preservation**: Render, submit, and display NFIU Corporate form and verify all fields other than Website, Ownership, and Business Type/Occupation work exactly as before
   - Company Name, Office Address, Incorporation Number, etc. should remain unchanged
   - Account Details section should remain unchanged
   - Document Upload section should remain unchanged

3. **Individual Forms Preservation**: Render, submit, and display NFIU Individual and KYC Individual forms and verify all fields work exactly as before

4. **Claims Forms Preservation**: Display various claims forms in admin dashboard and verify all fields display correctly

5. **Date Handling Preservation**: Submit forms with date fields and verify date handling remains consistent

6. **Admin Dashboard Other Forms Preservation**: Display non-NFIU Corporate forms in FormViewer, AdminUnifiedTable, and export to CSV/PDF, and verify all fields display and export correctly

### Unit Tests

- Test form configuration changes in formConfigs.ts (Website optional, Ownership select, Business combined)
- Test validation schema generation for modified fields (ownership enum validation, business required validation)
- Test field mapping in FormViewer for old and new data structures
- Test column definitions in AdminUnifiedTable for modified fields
- Test CSV export for modified fields
- Test PDF generation for modified fields
- Test backward compatibility for old submissions with separate business fields

### Property-Based Tests

- Generate random NFIU Corporate form submissions and verify all modified fields validate correctly
- Generate random KYC Corporate form submissions and verify all fields continue to validate as before
- Generate random form data and verify admin dashboard components display correctly for both old and new data structures
- Test that all non-NFIU Corporate forms continue to work across many scenarios

### Integration Tests

- Test full NFIU Corporate form submission flow with modified fields
- Test admin dashboard display of NFIU Corporate forms with both old and new data structures
- Test CSV and PDF export of NFIU Corporate forms with modified fields
- Test that KYC Corporate form submission and display flow remains unchanged
- Test that switching between NFIU and KYC forms works correctly
