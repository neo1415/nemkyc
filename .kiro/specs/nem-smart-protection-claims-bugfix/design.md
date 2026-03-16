# NEM Smart Protection Claims Bugfix Design

## Overview

The NEM Smart Protection Claims implementation has critical defects that prevent proper functionality. The system is missing navigation links for 6 Smart Protection forms, has incomplete field structures that don't match the provided JSON schemas, and lacks proper conditional logic and array field implementations. This design addresses these issues systematically using the bug condition methodology to ensure complete functionality while preserving existing claim form behavior.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when users attempt to access or use Smart Protection claim forms but encounter missing navigation links, incomplete forms, or missing critical fields
- **Property (P)**: The desired behavior when Smart Protection forms are accessed - complete forms with all required fields matching JSON schemas, proper navigation links, and full functionality
- **Preservation**: Existing claim form functionality (Motor, Professional Indemnity, etc.) that must remain unchanged by the fix
- **Smart Protection Forms**: The 6 new claim forms: Smart Motorist Protection (SMP), Smart Students Protection (SSP), Smart Traveller Protection (STP), Smart Artisan Protection (SAP), Smart Generation Z Protection (SGP), and NEM Home Protection Policy (HOPP)
- **JSON Schema Compliance**: Forms must match the exact field structure and validation rules provided in the detailed JSON schemas
- **Conditional Logic**: Dynamic field visibility based on user selections (e.g., show additional fields when "Other" is selected)
- **Array Fields**: Dynamic lists that users can add/remove items from (witnesses, property items)

## Bug Details

### Fault Condition

The bug manifests when users attempt to access or use Smart Protection claim forms. The system fails to provide complete functionality due to missing navigation links, incomplete field structures, and missing critical fields that don't match the provided JSON schemas.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserInteraction
  OUTPUT: boolean
  
  RETURN (input.action == "access_claims_dropdown" AND smartProtectionLinksNotVisible())
         OR (input.action == "fill_smart_protection_form" AND formFieldsIncomplete(input.formType))
         OR (input.action == "use_other_insurer_details" AND singleFieldInsteadOfThree())
         OR (input.action == "submit_smart_protection_form" AND dataStructureMismatch(input.formType))
         OR (input.action == "use_conditional_fields" AND conditionalLogicMissing())
         OR (input.action == "manage_array_fields" AND arrayImplementationMissing())
END FUNCTION
```

### Examples

- **Navigation Issue**: User clicks Claims dropdown → Smart Protection forms (SMP, SSP, STP, SAP, SGP, HOPP) are not visible in the menu
- **Incomplete Forms**: User accesses SMP form → Missing fields like policyNumber, coverFrom, coverTo, insuredName, address, phone, email, alertPreference, accidentDate, accidentTime, accidentAmPm, etc.
- **Other Insurer Details**: User selects "Yes" for other insurance → System shows single field instead of 3 separate fields (name, address, policy number)
- **Missing HOPP Fields**: User accesses HOPP form → Missing critical fields like title, surname, firstName, otherName, dateOfBirth, gender, companyName, lossAddress, perilType, dateOfLoss, timeOfLoss, timeAmPm, etc.
- **Conditional Logic**: User selects "Other" for property interest → System doesn't show propertyInterestOther field
- **Array Fields**: User tries to add multiple witnesses → System lacks proper add/remove functionality for witnesses array

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All existing claim forms (Motor, Professional Indemnity, Public Liability, etc.) must continue to work exactly as before
- Existing navigation structure and routing for current claim forms must remain unchanged
- Current form submission processing and data structures for existing forms must be preserved
- Admin interface display of existing claim types must continue working with proper formatting
- Ticket ID generation for existing claim types must continue using the same prefixes and format
- Form mappings for existing claim types must return the same configuration objects
- Email service processing for existing claim types must continue using the same templates and logic

**Scope:**
All interactions that do NOT involve the 6 Smart Protection forms should be completely unaffected by this fix. This includes:
- Existing claim form functionality and user interactions
- Current navigation behavior for non-Smart Protection forms
- Existing form submission workflows and data processing
- Current admin interface operations for existing claim types

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Missing Navigation Links**: The Navbar component's claimsForms array doesn't include the 6 Smart Protection forms
   - Forms exist as components but are not linked in the navigation dropdown
   - Routes are defined in App.tsx but not accessible through UI

2. **Incomplete Field Structures**: The form components have basic fields but are missing many required fields from JSON schemas
   - Personal Accident forms missing critical fields like policyNumber, coverFrom, coverTo, insuredName, address, phone, email, alertPreference
   - HOPP form missing fields like title, surname, firstName, otherName, dateOfBirth, gender, companyName, lossAddress, perilType

3. **Single Field Instead of Three**: Other insurer details implemented as single field instead of separate fields
   - Should be otherInsurerName, otherInsurerAddress, otherInsurerPolicyNumber
   - Current implementation uses single otherInsurerDetails field

4. **Missing Conditional Logic**: Forms lack proper conditional field visibility
   - isUsualDoctor should show when doctorNameAddress is not empty
   - propertyInterestOther should show when propertyInterest equals "Other"
   - otherOwnerDetails should show when isSoleOwner equals "No"
   - otherInsurerDetails should show when hasOtherInsurance equals "Yes"

5. **Incomplete Array Implementations**: Array fields lack proper add/remove functionality
   - witnesses array needs proper implementation with name and address fields
   - destroyedPropertyItems array needs description, cost, purchaseDate, valueAtLoss fields

## Correctness Properties

Property 1: Fault Condition - Smart Protection Forms Complete Functionality

_For any_ user interaction where Smart Protection forms are accessed or used (isBugCondition returns true), the fixed system SHALL provide complete navigation links in the Claims dropdown, complete forms with all required fields matching JSON schemas, proper conditional logic, and full array field functionality.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8**

Property 2: Preservation - Existing Claim Forms Behavior

_For any_ user interaction that does NOT involve Smart Protection forms (isBugCondition returns false), the fixed system SHALL produce exactly the same behavior as the original system, preserving all existing claim form functionality, navigation, submission processing, admin interface operations, and email service behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/components/layout/Navbar.tsx`

**Function**: `claimsForms` array

**Specific Changes**:
1. **Add Smart Protection Navigation Links**: Add all 6 Smart Protection forms to the claimsForms array
   - Smart Motorist Protection (SMP) with path '/claims/smart-motorist-protection'
   - Smart Students Protection (SSP) with path '/claims/smart-students-protection'
   - Smart Traveller Protection (STP) with path '/claims/smart-traveller-protection'
   - Smart Artisan Protection (SAP) with path '/claims/smart-artisan-protection'
   - Smart Generation Z Protection (SGP) with path '/claims/smart-generation-z-protection'
   - NEM Home Protection Policy (HOPP) with path '/claims/nem-home-protection'

**File**: `src/pages/claims/SmartMotoristProtectionClaim.tsx`

**Function**: Form schema and interface

**Specific Changes**:
2. **Complete SMP Form Fields**: Add all missing fields to match JSON schema
   - Add coverFrom, coverTo fields to Policy Information section
   - Add insuredName, address, phone, email, alertPreference to Insured Details
   - Add accidentAmPm field to Details of Loss
   - Split otherInsurerDetails into otherInsurerName, otherInsurerAddress, otherInsurerPolicyNumber
   - Add totalIncapacityFrom, totalIncapacityTo, partialIncapacityFrom, partialIncapacityTo fields
   - Add declarationConfirmed, signatureDate fields

**File**: `src/pages/claims/SmartStudentsProtectionClaim.tsx`

**Function**: Form schema and interface

**Specific Changes**:
3. **Complete SSP Form Fields**: Add all missing fields to match JSON schema
   - Add coverFrom, coverTo fields to Policy Information section
   - Add studentPupilName, address, phone, email, alertPreference to Insured Details
   - Add accidentAmPm field to Details of Loss
   - Split otherInsurerDetails into separate fields
   - Add incapacity period fields and declaration fields

**File**: `src/pages/claims/SmartTravellerProtectionClaim.tsx`

**Function**: Form schema and interface

**Specific Changes**:
4. **Complete STP Form Fields**: Add all missing fields to match JSON schema
   - Add coverFrom, coverTo fields to Policy Information section
   - Add insuredName, address, phone, email, alertPreference to Insured Details
   - Add accidentAmPm field to Details of Loss
   - Split otherInsurerDetails into separate fields
   - Add incapacity period fields and declaration fields

**File**: `src/pages/claims/SmartArtisanProtectionClaim.tsx`

**Function**: Form schema and interface

**Specific Changes**:
5. **Complete SAP Form Fields**: Add all missing fields to match JSON schema
   - Add coverFrom, coverTo fields to Policy Information section
   - Add companyName, address, phone, email, alertPreference to Insured Details
   - Add accidentAmPm field to Details of Loss
   - Split otherInsurerDetails into separate fields
   - Add incapacity period fields and declaration fields

**File**: `src/pages/claims/SmartGenerationZProtectionClaim.tsx`

**Function**: Form schema and interface

**Specific Changes**:
6. **Complete SGP Form Fields**: Add all missing fields to match JSON schema
   - Add coverFrom, coverTo fields to Policy Information section
   - Add insuredName, address, phone, email, alertPreference to Insured Details
   - Add accidentAmPm field to Details of Loss
   - Split otherInsurerDetails into separate fields
   - Add incapacity period fields and declaration fields

**File**: `src/pages/claims/NEMHomeProtectionClaim.tsx`

**Function**: Form schema and interface

**Specific Changes**:
7. **Complete HOPP Form Fields**: Add all missing fields to match JSON schema
   - Add title, surname, firstName, otherName, dateOfBirth, gender, companyName to Insured Details
   - Add lossAddress, perilType, dateOfLoss, timeOfLoss, timeAmPm to Details of Loss
   - Add medicalCertificateRequired conditional field
   - Split otherInsurerDetails into separate fields
   - Implement destroyedPropertyItems array with proper add/remove functionality

**All Smart Protection Form Files**

**Function**: Conditional logic implementation

**Specific Changes**:
8. **Implement Conditional Logic**: Add proper conditional field visibility
   - Show isUsualDoctor when doctorNameAddress is not empty
   - Show propertyInterestOther when propertyInterest equals "Other"
   - Show otherOwnerDetails when isSoleOwner equals "No"
   - Show otherInsurerDetails when hasOtherInsurance equals "Yes"
   - Show medicalCertificateRequired when perilType equals "Flood/Water/Storm/Lightning/Explosion/Accident"

**All Smart Protection Form Files**

**Function**: Array field implementation

**Specific Changes**:
9. **Implement Array Fields**: Add proper array field functionality
   - Witnesses array with name and address fields, add/remove buttons
   - DestroyedPropertyItems array (HOPP only) with description, cost, purchaseDate, valueAtLoss fields, add/remove buttons

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that attempt to access Smart Protection forms through navigation, fill out forms with all required fields, and use conditional/array functionality. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Navigation Test**: Attempt to find Smart Protection forms in Claims dropdown (will fail on unfixed code)
2. **Form Completeness Test**: Attempt to access all required fields in each Smart Protection form (will fail on unfixed code)
3. **Other Insurer Details Test**: Attempt to access separate fields for other insurer details (will fail on unfixed code)
4. **Conditional Logic Test**: Attempt to trigger conditional field visibility (will fail on unfixed code)
5. **Array Fields Test**: Attempt to add/remove items from witnesses and property arrays (will fail on unfixed code)

**Expected Counterexamples**:
- Smart Protection forms not visible in Claims dropdown navigation
- Required fields missing from form schemas and interfaces
- Single field instead of three separate fields for other insurer details
- Conditional fields not showing/hiding based on user selections
- Array fields lacking proper add/remove functionality

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed system produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := smartProtectionSystem_fixed(input)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed system produces the same result as the original system.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT smartProtectionSystem_original(input) = smartProtectionSystem_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-Smart Protection interactions

**Test Plan**: Observe behavior on UNFIXED code first for existing claim forms and navigation, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Existing Claims Navigation Preservation**: Verify existing claim forms continue to appear in dropdown and work correctly
2. **Existing Form Functionality Preservation**: Verify existing claim forms continue to function with same field structures
3. **Existing Submission Processing Preservation**: Verify existing claim form submissions continue to work with same data structures
4. **Admin Interface Preservation**: Verify admin interface continues to display existing claim types correctly

### Unit Tests

- Test navigation dropdown includes all 6 Smart Protection forms with correct paths
- Test each Smart Protection form has all required fields matching JSON schemas
- Test other insurer details split into 3 separate fields
- Test conditional logic shows/hides fields based on user selections
- Test array fields allow adding/removing items with proper validation
- Test form submission creates data structures matching JSON schemas

### Property-Based Tests

- Generate random form interactions and verify Smart Protection forms work correctly
- Generate random navigation interactions and verify all forms are accessible
- Generate random field combinations and verify conditional logic works across all scenarios
- Test that all non-Smart Protection interactions continue to work across many scenarios

### Integration Tests

- Test full Smart Protection form workflows from navigation to submission
- Test switching between different Smart Protection forms
- Test that existing claim forms continue to work after Smart Protection forms are added
- Test admin interface displays both existing and new claim types correctly
- Test email notifications work for both existing and new claim types