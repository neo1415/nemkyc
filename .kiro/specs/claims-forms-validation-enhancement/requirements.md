# Requirements Document

## Introduction

This feature enhances the claims forms system by adding missing fields to the Fire & Special Perils form and creating centralized validation utilities for all 26 claim forms. The validation utilities will ensure consistent data quality across email, phone, date of birth, and date range inputs.

## Glossary

- **Fire_Form**: The Fire & Special Perils claim form component
- **Validation_Utility**: Centralized validation functions for common field types
- **Claim_Form**: Any of the 26 claim form components in the system
- **Schema**: Yup validation schema used by react-hook-form
- **Admin_Table**: Backend admin interface displaying claim submissions
- **Form_Viewer**: Component that displays submitted claim data
- **PDF_Generator**: Service that generates PDF documents from claim data

## Requirements

### Requirement 1: Add DOB and Gender Fields to Fire Form

**User Story:** As a claims processor, I want DOB and gender fields on the Fire & Special Perils form, so that I have complete insured information for processing claims.

#### Acceptance Criteria

1. THE Fire_Form interface SHALL include dateOfBirth as a string field
2. THE Fire_Form interface SHALL include gender as a string field
3. THE Fire_Form Schema SHALL validate dateOfBirth as required
4. THE Fire_Form Schema SHALL validate gender as required
5. THE Fire_Form UI SHALL render a date input for dateOfBirth in the Policy & Insured Details step
6. THE Fire_Form UI SHALL render a select input for gender with options: Male, Female
7. THE Admin_Table SHALL display dateOfBirth and gender columns for Fire & Special Perils claims
8. THE Form_Viewer SHALL display dateOfBirth and gender fields when viewing Fire & Special Perils claims
9. THE PDF_Generator SHALL include dateOfBirth and gender in generated Fire & Special Perils claim PDFs

### Requirement 2: Create Centralized Email Validation

**User Story:** As a developer, I want centralized email validation, so that all forms validate emails consistently using international-friendly patterns.

#### Acceptance Criteria

1. THE Validation_Utility SHALL export a validateEmail function
2. THE validateEmail function SHALL accept email strings with international domains
3. THE validateEmail function SHALL accept email strings with subdomains
4. THE validateEmail function SHALL reject email strings without @ symbol
5. THE validateEmail function SHALL reject email strings without domain extension
6. THE validateEmail function SHALL return a validation result with isValid boolean and error message
7. FOR ALL valid email strings, THE validateEmail function SHALL return isValid as true

### Requirement 3: Create Centralized Phone Validation

**User Story:** As a developer, I want centralized phone validation, so that all forms accept both international and local Nigerian phone formats.

#### Acceptance Criteria

1. THE Validation_Utility SHALL export a validatePhone function
2. THE validatePhone function SHALL accept phone strings starting with +234 country code
3. THE validatePhone function SHALL accept phone strings starting with 0 for local format
4. THE validatePhone function SHALL accept phone strings with spaces, hyphens, and parentheses
5. THE validatePhone function SHALL require minimum 10 digits
6. THE validatePhone function SHALL return a validation result with isValid boolean and error message
7. FOR ALL valid phone strings with country code, removing the country code and validating as local format SHALL also return isValid as true

### Requirement 4: Create Centralized DOB Validation

**User Story:** As a claims processor, I want DOB validation that enforces 18+ age requirement, so that only adults can submit claims.

#### Acceptance Criteria

1. THE Validation_Utility SHALL export a validateDOB function
2. WHEN a dateOfBirth is less than 18 years from current date, THE validateDOB function SHALL return isValid as false
3. WHEN a dateOfBirth is 18 years or more from current date, THE validateDOB function SHALL return isValid as true
4. WHEN a dateOfBirth is in the future, THE validateDOB function SHALL return isValid as false
5. THE validateDOB function SHALL return a validation result with isValid boolean and error message
6. THE validateDOB function SHALL calculate age using year, month, and day precision

### Requirement 5: Create Centralized Date Range Validation

**User Story:** As a developer, I want date range validation utilities, so that forms prevent illogical date entries.

#### Acceptance Criteria

1. THE Validation_Utility SHALL export a validateFromDate function
2. WHEN a fromDate is in the future, THE validateFromDate function SHALL return isValid as false
3. WHEN a fromDate is today or in the past, THE validateFromDate function SHALL return isValid as true
4. THE Validation_Utility SHALL export a validateToDate function
5. WHEN a toDate is in the past, THE validateToDate function SHALL return isValid as false
6. WHEN a toDate is today or in the future, THE validateToDate function SHALL return isValid as true
7. THE Validation_Utility SHALL export a validateDateRange function
8. WHEN fromDate is after toDate, THE validateDateRange function SHALL return isValid as false
9. FOR ALL date validation functions, THE function SHALL return a validation result with isValid boolean and error message

### Requirement 6: Apply Validation to All Claim Forms

**User Story:** As a developer, I want all 26 claim forms to use centralized validation, so that data quality is consistent across the system.

#### Acceptance Criteria

1. THE Validation_Utility SHALL be imported by all 26 Claim_Form components
2. WHEN a Claim_Form has an email field, THE Schema SHALL use validateEmail for validation
3. WHEN a Claim_Form has a phone field, THE Schema SHALL use validatePhone for validation
4. WHEN a Claim_Form has a dateOfBirth field, THE Schema SHALL use validateDOB for validation
5. WHEN a Claim_Form has date range fields, THE Schema SHALL use validateFromDate and validateToDate for validation
6. THE implementation SHALL process forms in batches of 4 to manage scope
7. WHEN validation is applied to a Claim_Form, THE code SHALL pass diagnostics with no errors

### Requirement 7: Maintain Backward Compatibility

**User Story:** As a system administrator, I want existing claim data to remain valid, so that previously submitted claims are not affected by validation changes.

#### Acceptance Criteria

1. THE Validation_Utility SHALL only validate new form submissions
2. THE Admin_Table SHALL display existing claims without validation errors
3. THE Form_Viewer SHALL display existing claims without validation errors
4. WHEN viewing historical claims with missing DOB or gender, THE Form_Viewer SHALL display empty or default values without errors
