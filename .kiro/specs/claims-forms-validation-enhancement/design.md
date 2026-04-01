# Design Document: Claims Forms Validation Enhancement

## Overview

This feature enhances the claims forms system by adding missing fields to the Fire & Special Perils form and creating centralized validation utilities for all 26 claim forms. The design focuses on creating reusable validation functions that ensure consistent data quality across email, phone, date of birth, and date range inputs while maintaining backward compatibility with existing claim data.

The implementation follows a phased approach: first adding the missing DOB and gender fields to the Fire form, then creating centralized validation utilities, and finally applying these utilities across all claim forms in batches of 4 to manage scope and ensure quality.

## Architecture

### Component Structure

```
src/
├── utils/
│   └── validation.ts (enhanced with new validation functions)
├── pages/
│   └── claims/
│       ├── FireSpecialPerilsClaim.tsx (updated with DOB/gender)
│       ├── BurglaryClaimForm.tsx (apply validation)
│       ├── MotorClaim.tsx (apply validation)
│       └── [22 other claim forms] (apply validation in batches)
└── components/
    └── admin/
        └── ClaimsTable.tsx (display new fields)
```

### Validation Architecture

The validation architecture follows a functional approach with pure validation functions that return consistent result objects:

```typescript
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

type ValidatorFunction = (value: string) => ValidationResult;
```

All validation functions are stateless and can be composed with Yup schemas using `.test()` method for integration with react-hook-form.

### Data Flow

1. **Form Input** → User enters data in claim form
2. **Client Validation** → Yup schema with centralized validators checks input
3. **Error Display** → Validation errors shown inline in form
4. **Submission** → Only valid data proceeds to backend
5. **Storage** → Data stored in Firestore with validated format
6. **Display** → Admin tables and viewers show validated data

## Components and Interfaces

### Validation Utility Functions

```typescript
// src/utils/validation.ts

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates email addresses with international domain support
 * Accepts: user@domain.com, user@subdomain.domain.co.uk
 * Rejects: missing @, missing domain extension
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || !emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates phone numbers for Nigerian and international formats
 * Accepts: +234XXXXXXXXXX, 0XXXXXXXXXX, formats with spaces/hyphens
 * Requires: minimum 10 digits
 */
export function validatePhone(phone: string): ValidationResult {
  // Remove spaces, hyphens, parentheses for digit counting
  const digitsOnly = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check for minimum 10 digits
  const digitCount = digitsOnly.replace(/\D/g, '').length;
  if (digitCount < 10) {
    return {
      isValid: false,
      error: 'Phone number must contain at least 10 digits'
    };
  }
  
  // Accept +234 country code or 0 local format
  const phoneRegex = /^(\+234|0)[\d\s\-\(\)]{9,}$/;
  if (!phoneRegex.test(phone)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number (e.g., +234XXXXXXXXXX or 0XXXXXXXXXX)'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates date of birth with 18+ age requirement
 * Rejects: future dates, ages under 18 years
 * Uses: year, month, and day precision for age calculation
 */
export function validateDOB(dateOfBirth: string): ValidationResult {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  
  // Check if date is in the future
  if (dob > today) {
    return {
      isValid: false,
      error: 'Date of birth cannot be in the future'
    };
  }
  
  // Calculate age with precision
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  
  if (age < 18) {
    return {
      isValid: false,
      error: 'You must be at least 18 years old to submit a claim'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates "from" date in date ranges
 * Rejects: future dates
 * Accepts: today or past dates
 */
export function validateFromDate(fromDate: string): ValidationResult {
  const date = new Date(fromDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for date-only comparison
  
  if (date > today) {
    return {
      isValid: false,
      error: 'Start date cannot be in the future'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates "to" date in date ranges
 * Rejects: past dates
 * Accepts: today or future dates
 */
export function validateToDate(toDate: string): ValidationResult {
  const date = new Date(toDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for date-only comparison
  
  if (date < today) {
    return {
      isValid: false,
      error: 'End date cannot be in the past'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates date range consistency
 * Rejects: fromDate after toDate
 * Accepts: fromDate before or equal to toDate
 */
export function validateDateRange(fromDate: string, toDate: string): ValidationResult {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  if (from > to) {
    return {
      isValid: false,
      error: 'Start date must be before or equal to end date'
    };
  }
  
  return { isValid: true };
}

// Yup integration helpers
export const createEmailValidation = () => 
  Yup.string()
    .required('Email is required')
    .test('email-format', 'Invalid email address', (value) => {
      if (!value) return false;
      return validateEmail(value).isValid;
    });

export const createPhoneValidation = () => 
  Yup.string()
    .required('Phone number is required')
    .test('phone-format', 'Invalid phone number', (value) => {
      if (!value) return false;
      return validatePhone(value).isValid;
    });

export const createDOBValidation = () => 
  Yup.string()
    .required('Date of birth is required')
    .test('dob-valid', 'Invalid date of birth', (value) => {
      if (!value) return false;
      const result = validateDOB(value);
      return result.isValid;
    });

export const createFromDateValidation = () => 
  Yup.string()
    .required('Start date is required')
    .test('from-date-valid', 'Invalid start date', (value) => {
      if (!value) return false;
      return validateFromDate(value).isValid;
    });

export const createToDateValidation = () => 
  Yup.string()
    .required('End date is required')
    .test('to-date-valid', 'Invalid end date', (value) => {
      if (!value) return false;
      return validateToDate(value).isValid;
    });
```

### Fire & Special Perils Form Updates

```typescript
// src/pages/claims/FireSpecialPerilsClaim.tsx

interface FireSpecialPerilsClaimData {
  // ... existing fields ...
  
  // NEW FIELDS
  dateOfBirth: string;
  gender: string;
  
  // ... rest of fields ...
}

// Updated schema with new fields
const schema = yup.object().shape({
  // ... existing validations ...
  
  // NEW VALIDATIONS
  dateOfBirth: createDOBValidation(),
  gender: yup.string().required('Gender is required'),
  
  // ... rest of validations ...
});
```

### Form Component Pattern

All claim forms follow this pattern for applying validation:

```typescript
import { createEmailValidation, createPhoneValidation, createDOBValidation } from '@/utils/validation';

const schema = yup.object().shape({
  email: createEmailValidation(),
  phone: createPhoneValidation(),
  dateOfBirth: createDOBValidation(), // if applicable
  // ... other fields
});
```

## Data Models

### Fire & Special Perils Claim Data Model

```typescript
interface FireSpecialPerilsClaimData {
  // Policy Details
  policyNumber: string;
  periodOfCoverFrom: string;
  periodOfCoverTo: string;
  
  // Insured Details
  name: string;
  companyName?: string;
  title: string;
  dateOfBirth: string;        // NEW FIELD
  gender: string;             // NEW FIELD - "Male" | "Female"
  address: string;
  phone: string;
  email: string;
  
  // Loss Details
  premisesAddress: string;
  premisesPhone: string;
  dateOfOccurrence: string;
  timeOfOccurrence: string;
  incidentDescription: string;
  causeOfFire: string;
  
  // ... rest of existing fields ...
}
```

### Validation Result Model

```typescript
interface ValidationResult {
  isValid: boolean;
  error?: string;
}
```

### Admin Display Model

The admin table will display Fire & Special Perils claims with these additional columns:

```typescript
interface FireClaimTableRow {
  id: string;
  policyNumber: string;
  name: string;
  dateOfBirth: string;      // NEW COLUMN
  gender: string;           // NEW COLUMN
  dateOfOccurrence: string;
  status: string;
  submittedAt: string;
}
```

## Error Handling

### Validation Error Handling

1. **Client-Side Validation Errors**
   - Display inline error messages below form fields
   - Prevent form submission until all errors resolved
   - Clear errors on field change
   - Show field-specific error messages from ValidationResult

2. **Date Validation Errors**
   - DOB under 18: "You must be at least 18 years old to submit a claim"
   - Future DOB: "Date of birth cannot be in the future"
   - Future from date: "Start date cannot be in the future"
   - Past to date: "End date cannot be in the past"
   - Invalid range: "Start date must be before or equal to end date"

3. **Email Validation Errors**
   - Missing @: "Please enter a valid email address"
   - Missing domain: "Please enter a valid email address"
   - Invalid format: "Please enter a valid email address"

4. **Phone Validation Errors**
   - Too few digits: "Phone number must contain at least 10 digits"
   - Invalid format: "Please enter a valid phone number (e.g., +234XXXXXXXXXX or 0XXXXXXXXXX)"

### Backward Compatibility

1. **Existing Claims Without New Fields**
   - Display empty or "N/A" for missing DOB/gender fields
   - No validation errors on historical data
   - Form viewer handles missing fields gracefully

2. **Migration Strategy**
   - New fields only required for new submissions
   - Existing claims remain valid without new fields
   - Admin filters handle both old and new data formats

### Error Recovery

1. **Form Draft Recovery**
   - Auto-save form data to localStorage
   - Restore draft on page reload
   - Clear draft after successful submission

2. **Validation Failure Recovery**
   - Highlight all invalid fields
   - Scroll to first error
   - Provide clear correction instructions

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of valid/invalid inputs
- Edge cases (empty strings, boundary values)
- Integration between validation functions and Yup schemas
- UI component rendering with validation errors
- Backward compatibility with existing data

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Validation consistency across different input formats

### Property-Based Testing Configuration

- **Library**: fast-check (for TypeScript/JavaScript)
- **Iterations**: Minimum 100 runs per property test
- **Tagging**: Each property test references its design document property
- **Format**: `// Feature: claims-forms-validation-enhancement, Property {number}: {property_text}`

### Test Organization

```
src/
├── utils/
│   └── __tests__/
│       ├── validation.unit.test.ts
│       └── validation.property.test.ts
└── pages/
    └── claims/
        └── __tests__/
            ├── FireSpecialPerilsClaim.unit.test.tsx
            └── FireSpecialPerilsClaim.property.test.tsx
```

### Unit Test Coverage

1. **Validation Functions**
   - Valid email formats (standard, subdomain, international)
   - Invalid email formats (no @, no domain, empty)
   - Valid phone formats (+234, 0, with spaces/hyphens)
   - Invalid phone formats (too short, invalid prefix)
   - Valid DOB (18+, past dates)
   - Invalid DOB (under 18, future dates)
   - Valid date ranges (from before to)
   - Invalid date ranges (from after to)

2. **Form Integration**
   - Fire form renders DOB and gender fields
   - Form validation prevents submission with invalid data
   - Form displays validation errors correctly
   - Form clears errors on field change

3. **Admin Display**
   - Admin table displays new columns
   - Form viewer shows new fields
   - PDF generator includes new fields
   - Backward compatibility with old data

### Property-Based Test Coverage

Property tests will be written after completing the prework analysis in the Correctness Properties section below.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

1. **Email validation properties (2.2, 2.3, 2.4, 2.5, 2.7)** can be consolidated:
   - Properties 2.2, 2.3 are subsumed by 2.7 (all valid emails return true)
   - Properties 2.4, 2.5 are specific rejection cases that can be combined into one property about invalid formats

2. **Phone validation properties (3.2, 3.3, 3.4, 3.5, 3.7)** can be consolidated:
   - Properties 3.2, 3.3, 3.4 are all about accepting valid formats, can be combined
   - Property 3.7 is a metamorphic property that provides unique value

3. **DOB validation properties (4.2, 4.3, 4.4)** are distinct and provide unique value:
   - Each tests a different boundary condition

4. **Date range properties (5.2, 5.3, 5.5, 5.6, 5.8)** can be consolidated:
   - Properties 5.2 and 5.3 are inverses, can be combined
   - Properties 5.5 and 5.6 are inverses, can be combined
   - Property 5.8 provides unique value

5. **Form validation properties (1.3, 1.4, 6.2, 6.3, 6.4, 6.5)** are distinct:
   - Each tests a different field type across forms

After reflection, the following properties provide unique validation value:

### Property 1: Email Format Validation

*For any* string, the validateEmail function should return isValid as true if and only if the string contains an @ symbol, has characters before and after the @, and has a domain extension after a dot.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.7**

### Property 2: Phone Format Validation

*For any* string with at least 10 digits and starting with +234 or 0, the validatePhone function should return isValid as true regardless of spaces, hyphens, or parentheses in the formatting.

**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 3: Phone Country Code Equivalence

*For any* valid phone number with +234 country code, removing the +234 and replacing with 0 should produce another valid phone number.

**Validates: Requirements 3.7**

### Property 4: DOB Age Requirement

*For any* date that is 18 years or more before the current date (accounting for month and day), the validateDOB function should return isValid as true.

**Validates: Requirements 4.2, 4.3**

### Property 5: DOB Future Date Rejection

*For any* date in the future, the validateDOB function should return isValid as false.

**Validates: Requirements 4.4**

### Property 6: From Date Validation

*For any* date, the validateFromDate function should return isValid as true if and only if the date is today or in the past.

**Validates: Requirements 5.2, 5.3**

### Property 7: To Date Validation

*For any* date, the validateToDate function should return isValid as true if and only if the date is today or in the future.

**Validates: Requirements 5.5, 5.6**

### Property 8: Date Range Consistency

*For any* two dates fromDate and toDate, the validateDateRange function should return isValid as false if and only if fromDate is after toDate.

**Validates: Requirements 5.8**

### Property 9: Fire Form Required Field Validation

*For any* Fire & Special Perils form submission, the schema should reject the submission if dateOfBirth or gender fields are missing or empty.

**Validates: Requirements 1.3, 1.4**

### Property 10: Email Validation Consistency Across Forms

*For any* claim form with an email field, submitting an invalid email (missing @, missing domain extension, or empty) should result in a validation error preventing submission.

**Validates: Requirements 6.2**

### Property 11: Phone Validation Consistency Across Forms

*For any* claim form with a phone field, submitting a phone number with fewer than 10 digits should result in a validation error preventing submission.

**Validates: Requirements 6.3**

### Property 12: DOB Validation Consistency Across Forms

*For any* claim form with a dateOfBirth field, submitting a date less than 18 years ago or in the future should result in a validation error preventing submission.

**Validates: Requirements 6.4**

### Property 13: Date Range Validation Consistency Across Forms

*For any* claim form with date range fields (periodOfCoverFrom, periodOfCoverTo), submitting a range where the from date is after the to date should result in a validation error preventing submission.

**Validates: Requirements 6.5**

