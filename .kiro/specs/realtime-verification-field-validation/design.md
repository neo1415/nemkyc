# Design Document: Real-Time Verification Field Validation

## Overview

This design document details the technical architecture for implementing real-time verification field validation across all KYC and NFIU forms. The system validates user-entered data against verification API responses in real-time, provides immediate visual feedback on mismatched fields at the field level (not at the identifier field level), and prevents form progression until all fields match verified data.

### Critical UX Requirements

This design addresses the following critical UX issues discovered during implementation:

1. **Separation of Verification and Matching**: Verification (API call to verify CAC/NIN exists) and matching (comparing form fields with verification data) are two separate operations that happen in sequence
2. **Field-Level Error Placement**: Error messages appear on the SPECIFIC fields that don't match (e.g., company name, date), NOT on the CAC/NIN field
3. **Per-Field Revalidation**: Each field can be independently revalidated on blur without re-running verification
4. **Cache + Matching Integration**: When verification returns from cache, matching runs once and updates field states without looping
5. **Clear Visual Distinction**: CAC/NIN field only shows format/verification errors; other fields show matching errors

### Goals

- Eliminate duplicate verification API calls through intelligent caching
- Provide immediate, field-level feedback on data mismatches (on the actual mismatched fields)
- Prevent form submission with mismatched data
- Maintain seamless integration with existing autofill functionality
- Support all four form types: Corporate KYC, Corporate NFIU, Individual KYC, Individual NFIU
- Ensure error messages appear on the correct fields (not on the identifier field)

### Non-Goals

- Modifying the verification API endpoints or response formats
- Changing the existing form field configurations
- Implementing new verification providers
- Modifying the submission-time verification flow (VerificationMismatchModal remains as fallback)

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Form Component Layer                     │
│  (CorporateKYC, CorporateNFIU, IndividualKYC, IndividualNFIU)│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          useRealtimeVerificationValidation Hook             │
│  - Field validation state management                         │
│  - Verification trigger coordination                         │
│  - Visual feedback state                                     │
│  - Navigation blocking logic                                 │
└────────┬───────────────────────────┬────────────────────────┘
         │                           │
         ▼                           ▼
┌──────────────────┐      ┌──────────────────────────┐
│  useAutoFill     │      │  verificationMatcher     │
│  (existing)      │      │  (existing)              │
│  - API calls     │      │  - matchCACData()        │
│  - Cache mgmt    │      │  - matchNINData()        │
└──────────────────┘      └──────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│              Verification Cache (Session Storage)            │
│  - Keyed by identifier (NIN/CAC number)                     │
│  - Stores API responses                                      │
│  - Invalidated on identifier change                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Initial Verification Flow (CAC/NIN Field Blur)

1. **Verification Trigger**: User completes entering CAC/NIN number and triggers blur event
2. **Cache Check**: System checks if verification data exists in cache for this identifier
3. **API Call** (if needed): If not cached, call verification API via useAutoFill
4. **Cache Storage**: Store verification response in cache keyed by identifier
5. **Field Matching**: Compare ALL form field values with verification data using verificationMatcher
6. **Field State Update**: Update each field's validation state individually:
   - Empty fields → autofill with verification data → mark as "matched"
   - Filled fields that match → mark as "matched" with green checkmark
   - Filled fields that DON'T match → mark as "mismatched" with red border + inline error on THAT field
7. **Visual Feedback**: Render borders, icons, and error messages on EACH FIELD based on its state
8. **Navigation Control**: Enable/disable step navigation based on whether ANY field is mismatched

#### Per-Field Revalidation Flow (Other Field Blur)

1. **Field Modification**: User modifies a field (e.g., company name) and triggers blur
2. **Cache Lookup**: Retrieve cached verification data (no API call)
3. **Single Field Match**: Compare ONLY this field's value with cached verification data
4. **Field State Update**: Update ONLY this field's state:
   - If now matches → remove red border, show green checkmark
   - If still doesn't match → keep/show red border and error message
5. **Navigation Update**: Re-evaluate navigation blocking based on all field states

#### Key Differences from Previous Design

- **Verification happens once** per identifier (cached)
- **Matching happens multiple times** (once on verification, then per-field on blur)
- **Errors appear on the mismatched fields**, not on the CAC/NIN field
- **No matching loop** - matching runs once per trigger, updates state, and stops

## Components and Interfaces

### 1. useRealtimeVerificationValidation Hook

The core hook that manages real-time validation state and coordinates with existing systems.

**Critical Design Decision**: This hook manages field-level validation state separately from verification state. Verification happens once and is cached; matching happens multiple times (once on verification, then per-field on blur).

```typescript
interface UseRealtimeVerificationValidationConfig {
  formType: 'Corporate KYC' | 'Corporate NFIU' | 'Individual KYC' | 'Individual NFIU';
  identifierFieldName: string; // 'cacNumber' | 'incorporationNumber' | 'NIN'
  identifierType: 'CAC' | 'NIN';
  fieldsToValidate: FieldValidationConfig[];
  formMethods: UseFormReturn; // react-hook-form methods
  isAuthenticated: boolean;
}

interface FieldValidationConfig {
  fieldName: string;
  fieldLabel: string;
  verificationKey: string; // Key in verification response
  normalizer?: (value: any) => any; // Optional normalization function
}

interface UseRealtimeVerificationValidationReturn {
  // State
  fieldValidationStates: Record<string, FieldValidationState>;
  isVerificationTriggered: boolean;
  isVerifying: boolean;
  canProceedToNextStep: boolean;
  verificationError: string | null; // Error from verification API (shown on CAC/NIN field)
  
  // Functions
  attachToIdentifierField: (inputElement: HTMLInputElement) => void;
  getFieldValidationProps: (fieldName: string) => FieldValidationProps;
  clearValidation: () => void;
  revalidateField: (fieldName: string) => void; // Revalidate single field using cached data
  
  // Data
  verificationData: any | null;
}

interface FieldValidationState {
  status: 'not_verified' | 'pending' | 'matched' | 'mismatched';
  errorMessage: string | null; // Shown on THIS field, not on CAC/NIN field
  showCheckmark: boolean;
  showError: boolean;
}

interface FieldValidationProps {
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
  className: string; // Includes border color classes
  onBlur: (e: React.FocusEvent) => void; // Triggers revalidation for this field
}
```

**Hook Behavior**:

1. **On Identifier Field Blur**:
   - Trigger verification (API or cache)
   - Wait for verification data
   - Run matching for ALL fields
   - Update ALL field states
   - Stop (no loop)

2. **On Other Field Blur**:
   - Get cached verification data
   - Run matching for ONLY this field
   - Update ONLY this field's state
   - Stop (no loop)

3. **Error Message Placement**:
   - CAC/NIN field: Only shows verification API errors (format, network, auth)
   - Other fields: Show matching errors (e.g., "This company name doesn't match CAC records")

4. **Navigation Blocking**:
   - Disabled if ANY field has status "mismatched"
   - Enabled if all fields are "matched" or "not_verified"

### 2. VerificationCache Service

Manages in-memory caching of verification responses.

```typescript
class VerificationCache {
  private cache: Map<string, CachedVerification>;
  
  set(identifier: string, data: any, identifierType: 'CAC' | 'NIN'): void;
  get(identifier: string): CachedVerification | null;
  has(identifier: string): boolean;
  invalidate(identifier: string): void;
  clear(): void;
}

interface CachedVerification {
  data: any;
  identifierType: 'CAC' | 'NIN';
  timestamp: number;
  identifier: string;
}
```

### 3. Visual Feedback Components

#### FieldValidationIndicator Component

```typescript
interface FieldValidationIndicatorProps {
  status: FieldValidationState['status'];
  errorMessage: string | null;
  fieldId: string;
  fieldLabel: string; // Used in error message
}

// Renders:
// - Green checkmark icon for matched fields
// - Red error message BELOW THE FIELD for mismatched fields
// - Nothing for not_verified or pending
// 
// CRITICAL: This component is attached to EACH FIELD, not to the CAC/NIN field
```

#### IdentifierFieldError Component

```typescript
interface IdentifierFieldErrorProps {
  verificationError: string | null; // Only verification API errors
  isVerifying: boolean;
}

// Renders:
// - Error messages for verification API failures (network, format, auth)
// - Loading indicator during verification
// - Nothing when verification succeeds
//
// CRITICAL: This component is attached ONLY to the CAC/NIN field
// It does NOT show matching errors (those appear on the individual fields)
```

#### ValidationTooltip Component

```typescript
interface ValidationTooltipProps {
  show: boolean;
  message: string;
  mismatchedFields: string[]; // List of field labels that are mismatched
}

// Renders tooltip on disabled navigation buttons
// Shows which specific fields need to be corrected
```

### 4. Integration Points

#### With useAutoFill Hook

The new hook will leverage the existing `useAutoFill` hook for:
- Verification API calls
- Cache management (via AutoFillEngine's internal cache)
- Authentication checks

**Critical Integration Point**: The hook listens to autoFill state changes to trigger matching, but matching is separate from verification.

```typescript
// Inside useRealtimeVerificationValidation
const autoFill = useAutoFill({
  formElement,
  identifierType,
  userId: user?.uid,
  formId: formType,
  userName: user?.displayName,
  userEmail: user?.email,
  reactHookFormSetValue: formMethods.setValue,
  requireAuth: true
});

// Listen to autoFill state changes
useEffect(() => {
  if (autoFill.state.status === 'success' && autoFill.state.cached !== undefined) {
    // Verification data is now available (from API or cache)
    // Run matching ONCE for all fields
    performAllFieldsMatching();
    // Do NOT run matching again - this prevents the loop
  }
}, [autoFill.state.status, autoFill.state.cached]);

// Separate function for per-field revalidation
const revalidateField = (fieldName: string) => {
  // Get cached verification data (no API call)
  const cachedData = getCachedVerificationData();
  if (!cachedData) return;
  
  // Match ONLY this field
  const fieldValue = formMethods.getValues(fieldName);
  const matchResult = matchSingleField(fieldName, fieldValue, cachedData);
  
  // Update ONLY this field's state
  setFieldValidationStates(prev => ({
    ...prev,
    [fieldName]: matchResult
  }));
};
```

#### With verificationMatcher Utility

**Critical Design Decision**: The verificationMatcher utility returns aggregate match results. We need to convert these to field-level states.

```typescript
// Use existing matching functions
import { matchCACData, matchNINData } from '@/utils/verificationMatcher';

/**
 * Perform matching for ALL fields after verification
 * This runs ONCE per verification (not in a loop)
 */
const performAllFieldsMatching = (formData: any, verificationData: any) => {
  const newFieldStates: Record<string, FieldValidationState> = {};
  
  if (identifierType === 'CAC') {
    // Get aggregate match result
    const result = matchCACData(
      {
        insured: formData.insured,
        dateOfIncorporationRegistration: formData.dateOfIncorporationRegistration,
        officeAddress: formData.officeAddress
      },
      verificationData
    );
    
    // Convert to field-level states
    // Check each field individually
    fieldsToValidate.forEach(fieldConfig => {
      const fieldValue = formData[fieldConfig.fieldName];
      const verifiedValue = verificationData[fieldConfig.verificationKey];
      
      if (!fieldValue) {
        // Empty field - will be autofilled
        newFieldStates[fieldConfig.fieldName] = {
          status: 'matched',
          errorMessage: null,
          showCheckmark: true,
          showError: false
        };
      } else if (fieldMatches(fieldValue, verifiedValue, fieldConfig)) {
        // Field matches
        newFieldStates[fieldConfig.fieldName] = {
          status: 'matched',
          errorMessage: null,
          showCheckmark: true,
          showError: false
        };
      } else {
        // Field doesn't match
        newFieldStates[fieldConfig.fieldName] = {
          status: 'mismatched',
          errorMessage: `This ${fieldConfig.fieldLabel.toLowerCase()} doesn't match CAC records`,
          showCheckmark: false,
          showError: true
        };
      }
    });
  } else {
    // Similar logic for NIN
    const result = matchNINData(
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender
      },
      verificationData
    );
    
    // Convert to field-level states
    fieldsToValidate.forEach(fieldConfig => {
      const fieldValue = formData[fieldConfig.fieldName];
      const verifiedValue = verificationData[fieldConfig.verificationKey];
      
      if (!fieldValue) {
        newFieldStates[fieldConfig.fieldName] = {
          status: 'matched',
          errorMessage: null,
          showCheckmark: true,
          showError: false
        };
      } else if (fieldMatches(fieldValue, verifiedValue, fieldConfig)) {
        newFieldStates[fieldConfig.fieldName] = {
          status: 'matched',
          errorMessage: null,
          showCheckmark: true,
          showError: false
        };
      } else {
        newFieldStates[fieldConfig.fieldName] = {
          status: 'mismatched',
          errorMessage: `This ${fieldConfig.fieldLabel.toLowerCase()} doesn't match NIN records`,
          showCheckmark: false,
          showError: true
        };
      }
    });
  }
  
  // Update all field states at once (no loop)
  setFieldValidationStates(newFieldStates);
};

/**
 * Revalidate a SINGLE field using cached data
 * This runs on blur of individual fields
 */
const revalidateSingleField = (fieldName: string, fieldValue: any, verificationData: any) => {
  const fieldConfig = fieldsToValidate.find(f => f.fieldName === fieldName);
  if (!fieldConfig) return;
  
  const verifiedValue = verificationData[fieldConfig.verificationKey];
  
  let newState: FieldValidationState;
  
  if (!fieldValue) {
    // Field was cleared - this is a mismatch
    newState = {
      status: 'mismatched',
      errorMessage: `This ${fieldConfig.fieldLabel.toLowerCase()} is required and must match verification records`,
      showCheckmark: false,
      showError: true
    };
  } else if (fieldMatches(fieldValue, verifiedValue, fieldConfig)) {
    // Field matches
    newState = {
      status: 'matched',
      errorMessage: null,
      showCheckmark: true,
      showError: false
    };
  } else {
    // Field doesn't match
    newState = {
      status: 'mismatched',
      errorMessage: `This ${fieldConfig.fieldLabel.toLowerCase()} doesn't match verification records`,
      showCheckmark: false,
      showError: true
    };
  }
  
  // Update ONLY this field's state
  setFieldValidationStates(prev => ({
    ...prev,
    [fieldName]: newState
  }));
};

/**
 * Helper function to check if a single field matches
 * Uses the same normalization logic as verificationMatcher
 */
const fieldMatches = (fieldValue: any, verifiedValue: any, fieldConfig: FieldValidationConfig): boolean => {
  if (!verifiedValue) return true; // No verified data to compare
  
  // Apply normalizer if provided
  const normalizedFieldValue = fieldConfig.normalizer 
    ? fieldConfig.normalizer(fieldValue)
    : fieldValue;
  const normalizedVerifiedValue = fieldConfig.normalizer
    ? fieldConfig.normalizer(verifiedValue)
    : verifiedValue;
  
  // For dates, use date comparison
  if (fieldValue instanceof Date || verifiedValue instanceof Date) {
    return datesMatch(normalizedFieldValue, normalizedVerifiedValue);
  }
  
  // For strings, use case-insensitive comparison with similarity threshold
  if (typeof fieldValue === 'string' && typeof verifiedValue === 'string') {
    const similarity = calculateSimilarity(normalizedFieldValue, normalizedVerifiedValue);
    return similarity >= 0.8; // 80% similarity threshold
  }
  
  // Default: exact match
  return normalizedFieldValue === normalizedVerifiedValue;
};
```

#### With MultiStepForm Component

```typescript
// In form component
const validation = useRealtimeVerificationValidation({
  formType: 'Corporate KYC',
  identifierFieldName: 'cacNumber',
  identifierType: 'CAC',
  fieldsToValidate: CAC_FIELDS_CONFIG,
  formMethods,
  isAuthenticated: !!user
});

// Attach to identifier field
useEffect(() => {
  const cacInput = document.getElementById('cacNumber') as HTMLInputElement;
  if (cacInput) {
    validation.attachToIdentifierField(cacInput);
  }
}, [validation]);

// Attach to other fields for revalidation
const companyNameProps = validation.getFieldValidationProps('insured');
const dateProps = validation.getFieldValidationProps('dateOfIncorporationRegistration');
const addressProps = validation.getFieldValidationProps('officeAddress');

// In JSX
<div>
  <label htmlFor="insured">Company Name</label>
  <input
    id="insured"
    {...register('insured')}
    {...companyNameProps} // Includes onBlur for revalidation, className for border, aria attributes
  />
  <FieldValidationIndicator
    status={validation.fieldValidationStates['insured']?.status || 'not_verified'}
    errorMessage={validation.fieldValidationStates['insured']?.errorMessage || null}
    fieldId="insured"
    fieldLabel="Company Name"
  />
</div>

// Pass to MultiStepForm
<MultiStepForm
  steps={[
    {
      id: 'company-info',
      title: 'Company Information',
      component: <CompanyInfoStep />,
      isValid: validation.canProceedToNextStep // Blocks navigation if ANY field is mismatched
    },
    // ... other steps
  ]}
  validateStep={async (stepId) => {
    if (stepId === 'company-info') {
      return validation.canProceedToNextStep;
    }
    return true;
  }}
/>

// Navigation button with tooltip
<button
  disabled={!validation.canProceedToNextStep}
  title={!validation.canProceedToNextStep ? 'Please correct highlighted fields before proceeding' : ''}
>
  Next
  {!validation.canProceedToNextStep && (
    <ValidationTooltip
      show={true}
      message="Please correct the following fields:"
      mismatchedFields={Object.entries(validation.fieldValidationStates)
        .filter(([_, state]) => state.status === 'mismatched')
        .map(([fieldName, _]) => {
          const config = CAC_FIELDS_CONFIG.find(f => f.fieldName === fieldName);
          return config?.fieldLabel || fieldName;
        })}
    />
  )}
</button>
```

## Data Models

### Critical Fix: Cache + Matching Loop Prevention

**Problem**: When verification is cached and returns success, the matching logic runs and fails, then runs again repeatedly showing the same error.

**Root Cause**: The previous design didn't separate verification state changes from matching triggers, causing matching to run multiple times.

**Solution**: 
1. Verification state changes trigger matching ONCE
2. Matching updates field states
3. Field state changes do NOT trigger matching again
4. Per-field revalidation is triggered explicitly by field blur events

```typescript
// WRONG: This causes a loop
useEffect(() => {
  if (verificationData) {
    performMatching(); // This updates field states
  }
}, [verificationData, fieldValidationStates]); // fieldValidationStates causes re-trigger

// CORRECT: Matching runs once per verification
useEffect(() => {
  if (autoFill.state.status === 'success' && autoFill.state.cached !== undefined) {
    // Verification just completed (from API or cache)
    performAllFieldsMatching(); // Runs once, updates all field states
  }
}, [autoFill.state.status, autoFill.state.cached]); // Only depends on verification state

// Per-field revalidation is separate
const handleFieldBlur = (fieldName: string) => {
  const cachedData = getCachedVerificationData();
  if (cachedData) {
    revalidateSingleField(fieldName, formMethods.getValues(fieldName), cachedData);
  }
};
```

### Field Validation Configuration

```typescript
// Corporate KYC/NFIU CAC Fields
const CAC_FIELDS_CONFIG: FieldValidationConfig[] = [
  {
    fieldName: 'insured',
    fieldLabel: 'Company Name',
    verificationKey: 'name',
    normalizer: normalizeText
  },
  {
    fieldName: 'dateOfIncorporationRegistration',
    fieldLabel: 'Incorporation Date',
    verificationKey: 'registrationDate',
    normalizer: normalizeDate
  },
  {
    fieldName: 'officeAddress',
    fieldLabel: 'Office Address',
    verificationKey: 'address',
    normalizer: normalizeText
  }
];

// Individual KYC/NFIU NIN Fields
const NIN_FIELDS_CONFIG: FieldValidationConfig[] = [
  {
    fieldName: 'firstName',
    fieldLabel: 'First Name',
    verificationKey: 'firstname',
    normalizer: normalizeText
  },
  {
    fieldName: 'lastName',
    fieldLabel: 'Last Name',
    verificationKey: 'surname',
    normalizer: normalizeText
  },
  {
    fieldName: 'dateOfBirth',
    fieldLabel: 'Date of Birth',
    verificationKey: 'birthdate',
    normalizer: normalizeDate
  },
  {
    fieldName: 'gender',
    fieldLabel: 'Gender',
    verificationKey: 'gender',
    normalizer: normalizeGender
  }
];
```

### Validation State Schema

```typescript
interface ValidationStateStore {
  // Per-field validation states (keyed by field name)
  // These are SEPARATE from verification state
  fields: Record<string, FieldValidationState>;
  
  // Verification state (for the identifier field)
  isVerificationTriggered: boolean;
  isVerifying: boolean;
  verificationData: any | null;
  verificationError: string | null; // Only API errors, shown on CAC/NIN field
  identifierValue: string | null;
  
  // Computed properties
  hasAnyMismatches: boolean; // True if ANY field is mismatched
  allFieldsValidated: boolean; // True if all fields have been checked
  mismatchedFieldLabels: string[]; // List of field labels that are mismatched
}

// Example state after verification with one mismatch:
{
  fields: {
    'insured': {
      status: 'mismatched',
      errorMessage: 'This company name doesn\'t match CAC records',
      showCheckmark: false,
      showError: true
    },
    'dateOfIncorporationRegistration': {
      status: 'matched',
      errorMessage: null,
      showCheckmark: true,
      showError: false
    },
    'officeAddress': {
      status: 'matched',
      errorMessage: null,
      showCheckmark: true,
      showError: false
    }
  },
  isVerificationTriggered: true,
  isVerifying: false,
  verificationData: { /* CAC API response */ },
  verificationError: null, // No verification error (verification succeeded)
  identifierValue: 'RC123456',
  hasAnyMismatches: true, // Because 'insured' is mismatched
  allFieldsValidated: true,
  mismatchedFieldLabels: ['Company Name']
}

// Example state with verification error:
{
  fields: {}, // No field validation because verification failed
  isVerificationTriggered: true,
  isVerifying: false,
  verificationData: null,
  verificationError: 'Network error. Please check your connection.', // Shown on CAC field
  identifierValue: 'RC123456',
  hasAnyMismatches: false,
  allFieldsValidated: false,
  mismatchedFieldLabels: []
}
```

### Cache Storage Schema

```typescript
// Stored in sessionStorage
interface SessionStorageCache {
  verificationCache: {
    [identifier: string]: {
      data: any;
      identifierType: 'CAC' | 'NIN';
      timestamp: number;
    }
  };
}
```

## Complete UX Flow

This section documents the complete user experience flow to ensure the implementation matches the requirements.

### Scenario 1: User Enters CAC Number (Happy Path)

1. User types "RC6971" in CAC field
2. User tabs out (blur event)
3. System verifies CAC via API (or retrieves from cache)
4. Verification succeeds with data: `{ name: "ABC Company Ltd", registrationDate: "2020-01-15", address: "123 Main St" }`
5. System compares ALL form fields:
   - `insured` field is empty → autofill with "ABC Company Ltd" → mark as "matched" with green checkmark
   - `dateOfIncorporationRegistration` field is empty → autofill with "2020-01-15" → mark as "matched" with green checkmark
   - `officeAddress` field is empty → autofill with "123 Main St" → mark as "matched" with green checkmark
6. All fields are matched → "Next" button is enabled
7. User clicks "Next" → proceeds to next step

### Scenario 2: User Enters CAC Number with Pre-filled Data (Mismatch)

1. User has already filled in company name as "XYZ Corp" (wrong name)
2. User types "RC6971" in CAC field
3. User tabs out (blur event)
4. System verifies CAC via API
5. Verification succeeds with data: `{ name: "ABC Company Ltd", registrationDate: "2020-01-15", address: "123 Main St" }`
6. System compares ALL form fields:
   - `insured` field = "XYZ Corp" vs verified "ABC Company Ltd" → MISMATCH
     - Show red border on company name field
     - Show error message BELOW company name field: "This company name doesn't match CAC records"
     - NO error on CAC field (verification succeeded)
   - `dateOfIncorporationRegistration` field is empty → autofill with "2020-01-15" → mark as "matched"
   - `officeAddress` field is empty → autofill with "123 Main St" → mark as "matched"
7. One field is mismatched → "Next" button is DISABLED
8. Tooltip on "Next" button shows: "Please correct the following fields: Company Name"

### Scenario 3: User Fixes Mismatched Field

1. (Continuing from Scenario 2)
2. User sees red border on company name field
3. User clicks into company name field
4. User changes "XYZ Corp" to "ABC Company Ltd"
5. User tabs out (blur event on company name field)
6. System retrieves cached verification data (no API call)
7. System compares ONLY company name field:
   - "ABC Company Ltd" vs verified "ABC Company Ltd" → MATCH
8. System updates ONLY company name field state:
   - Remove red border
   - Remove error message
   - Show green checkmark
9. All fields are now matched → "Next" button is ENABLED
10. User clicks "Next" → proceeds to next step

### Scenario 4: Cached Verification (No Loop)

1. User types "RC6971" in CAC field
2. User tabs out (blur event)
3. System checks cache → finds cached data for "RC6971"
4. System retrieves cached data (no API call)
5. System runs matching ONCE for all fields
6. System updates all field states
7. System STOPS (no loop, no repeated matching)
8. Visual feedback appears on fields
9. Navigation state updates

### Scenario 5: Verification API Error

1. User types "RC6971" in CAC field
2. User tabs out (blur event)
3. System attempts verification via API
4. API returns network error
5. System shows error message on CAC field: "Network error. Please check your connection and try again."
6. System does NOT show errors on other fields (verification didn't succeed)
7. "Next" button remains ENABLED (allow user to proceed despite verification failure)
8. User can retry by modifying CAC field and blurring again

### Key UX Principles

1. **Error Location**: Errors appear on the field that has the problem
   - CAC/NIN field: Only verification API errors
   - Other fields: Only matching errors

2. **No Loops**: Matching runs once per trigger, updates state, and stops
   - Verification blur → match all fields once
   - Field blur → match that field once

3. **Clear Feedback**: Users always know what's wrong and where
   - Red border + inline error = this field doesn't match
   - Green checkmark = this field matches
   - No indicator = not yet verified

4. **Navigation Blocking**: Disabled only when there are actual mismatches
   - Verification errors → allow navigation
   - Field mismatches → block navigation
   - Tooltip shows which fields need fixing

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all 90 acceptance criteria, I've identified the following redundancies and consolidation opportunities:

**Redundancy Group 1: Verification Triggering**
- Properties 1.1 and 1.2 (CAC/NIN blur triggers) can be combined into one property about verification triggering on blur for any identifier type
- The 300ms timing is a performance concern, not a correctness property

**Redundancy Group 2: Cache Behavior**
- Properties 1.3, 7.2, 7.4, and 5.4 all test that cached data is used without API calls
- These can be consolidated into one comprehensive caching property

**Redundancy Group 3: Field State Management**
- Properties 2.3 and 2.4 (matched/mismatched marking) are complementary but can be combined
- Properties 5.2 and 5.3 (revalidation state updates) are similar to 2.3/2.4

**Redundancy Group 4: Visual Feedback**
- Properties 3.1, 3.2, and 3.3 (visual indicators) can be combined into one property about visual feedback consistency
- Property 3.4 is subsumed by the general state transition property
- Property 3.5 is a special case of the general visual feedback property

**Redundancy Group 5: Error Messages**
- Properties 4.1 and 4.2 (error message format) can be combined
- Properties 4.3, 4.4, and 4.5 are examples, not separate properties

**Redundancy Group 6: Navigation Blocking**
- Properties 6.1 and 6.2 are complementary (disable/enable) and can be combined
- Property 6.3 is a detail of 6.1

**Redundancy Group 7: Autofill Integration**
- Properties 8.1, 8.2, and 8.3 all describe autofill behavior and can be combined
- Property 8.5 is about backward compatibility, which is covered by integration testing

**Redundancy Group 8: Field Validation Coverage**
- Properties 9.1 and 10.1 (which fields to validate) can be combined into one property about field coverage
- Properties 9.5 and 10.5 (form type coverage) can be combined

**Redundancy Group 9: Matching Algorithms**
- Properties 9.2, 9.3, 9.4, 10.2, 10.3, and 10.4 all describe normalization and can be combined into properties about using the verificationMatcher utility correctly

**Redundancy Group 10: Error State Cleanup**
- Properties 11.1, 11.2, and 11.3 all describe error cleanup and can be combined

**Redundancy Group 11: MultiStepForm Integration**
- Properties 13.1 and 13.2 are complementary and can be combined
- Property 13.4 is about backward compatibility

**Redundancy Group 12: Accessibility**
- Properties 17.1 and 17.2 (aria attributes) can be combined
- Property 17.3 is a separate concern (announcements)

After reflection, I've reduced 90 acceptance criteria to approximately 35 unique correctness properties.

### Property 1: Verification Trigger on Blur

*For any* authenticated user and any identifier field (CAC or NIN), when the user triggers a blur event on the identifier field with a valid format, the system should initiate verification.

**Validates: Requirements 1.1, 1.2**

### Property 2: Cache Hit Prevents API Calls

*For any* identifier that exists in the verification cache, any verification request for that identifier should retrieve data from cache without making a new API call, and matching should run once using the cached data.

**Validates: Requirements 1.3, 7.2, 7.4, 5.4**

### Property 3: Invalid Format Prevents API Calls

*For any* identifier with an invalid format, the system should display a format error message on the identifier field without making an API call.

**Validates: Requirements 1.4**

### Property 4: Authentication Required for Verification

*For any* non-authenticated user, verification should not be initiated regardless of identifier field interactions.

**Validates: Requirements 1.5**

### Property 5: Field-by-Field Comparison

*For any* verification API response, the system should compare each configured form field value with its corresponding verification response field.

**Validates: Requirements 2.1**

### Property 6: Empty Fields Trigger Autofill

*For any* form field that is empty when verification data exists for that field, the system should execute autofill behavior to populate the field.

**Validates: Requirements 2.2, 8.1**

### Property 7: Field State Reflects Match Status

*For any* form field with verification data, the field state should be "matched" if values match and "mismatched" if values don't match, and the error message should appear on that specific field, not on the identifier field.

**Validates: Requirements 2.3, 2.4**

### Property 8: Missing Verification Data Skips Validation

*For any* form field without corresponding verification data, the system should not perform validation on that field.

**Validates: Requirements 2.5**

### Property 9: Visual Feedback Consistency

*For any* field validation state, the system should display consistent visual indicators on the specific field: red border and error message below the field for mismatched fields, green checkmark for matched fields, and no error indicators for matched or not-verified fields. The identifier field should only show verification API errors, not matching errors.

**Validates: Requirements 3.1, 3.2, 3.3, 3.5, 8.3**

### Property 10: State Transition Updates Visual Feedback

*For any* field that transitions from mismatched to matched state, the system should remove error visual indicators and add success indicators.

**Validates: Requirements 3.4**

### Property 11: Error Messages Include Field Labels

*For any* mismatched field, the error message should include the field label, should appear below that specific field (not on the identifier field), and should not reveal the actual verified data value.

**Validates: Requirements 4.1, 4.2**

### Property 12: Revalidation on Field Modification

*For any* field (matched or mismatched) that is modified by an authenticated user, the system should revalidate only that specific field on blur using cached verification data without re-running verification or matching other fields.

**Validates: Requirements 5.1, 5.5**

### Property 13: Revalidation Updates Field State

*For any* field revalidation, the system should update the field state to matched if the new value matches verification data, or maintain/set mismatched status if it doesn't match.

**Validates: Requirements 5.2, 5.3**

### Property 14: Navigation Blocked by Mismatches

*For any* form state where one or more fields are mismatched, step navigation buttons should be disabled with an explanatory tooltip.

**Validates: Requirements 6.1, 6.3**

### Property 15: Navigation Enabled When Valid

*For any* form state where all validated fields are matched or verification has not been triggered, step navigation buttons should be enabled.

**Validates: Requirements 6.2, 6.4**

### Property 16: API Errors Allow Navigation

*For any* verification API error (timeout, malformed data, network error, rate limit), the system should display an appropriate error message and allow step navigation to proceed.

**Validates: Requirements 6.5, 18.1, 18.2, 18.3, 18.4, 18.5**

### Property 17: Verification Data Cached on Success

*For any* successful verification API response, the system should store the response in the verification cache with the identifier as the key.

**Validates: Requirements 7.1**

### Property 18: Cache Invalidation on Identifier Change

*For any* change to the identifier field value (CAC or NIN), the system should invalidate the previous cache entry for the old identifier and clear all field validation states.

**Validates: Requirements 7.3**

### Property 19: Cache Persists During Session

*For any* verification cache entry, the entry should persist for the duration of the user session.

**Validates: Requirements 7.5**

### Property 20: No Matching Loop on Cached Verification

*For any* cached verification data, when the verification completes (from cache), the system should run matching exactly once for all fields, update all field states, and stop without re-triggering matching.

**Validates: Requirements 1.3, 7.2 (implicit - prevents the cache + matching loop bug)**

### Property 21: Autofilled Fields Marked as Matched

*For any* field populated by autofill behavior, the system should mark that field as matched.

**Validates: Requirements 8.2**

### Property 22: Cleared Autofilled Fields Become Mismatched

*For any* autofilled field that is manually cleared by the user, the system should mark that field as mismatched on blur.

**Validates: Requirements 8.4**

### Property 23: CAC Field Validation Coverage

*For any* CAC verification on corporate forms (KYC or NFIU), the system should validate company name, registration date, and office address fields.

**Validates: Requirements 9.1**

### Property 24: NIN Field Validation Coverage

*For any* NIN verification on individual forms (KYC or NFIU), the system should validate first name, last name, date of birth, and gender fields.

**Validates: Requirements 10.1**

### Property 25: Form Type Coverage

*For any* form type (Corporate KYC, Corporate NFIU, Individual KYC, Individual NFIU), the real-time validation system should function correctly.

**Validates: Requirements 9.5, 10.5**

### Property 26: Verification Matcher Utility Usage

*For any* field comparison, the system should use the matchCACData function for CAC data and matchNINData function for NIN data from the verificationMatcher utility.

**Validates: Requirements 15.1, 15.2**

### Property 27: Normalization Applied to Comparisons

*For any* field comparison, the system should apply appropriate normalization: case-insensitive for names, date normalization for dates, format normalization for RC numbers, and value normalization for gender.

**Validates: Requirements 9.2, 9.3, 9.4, 10.2, 10.3, 10.4**

### Property 28: Match Results Processed to Field States

*For any* match result from verificationMatcher, the system should convert the result into field-level validation states, identifying specific mismatched fields and marking matched fields, with errors appearing on the specific fields.

**Validates: Requirements 15.3, 15.4, 15.5**

### Property 29: Error Cleanup on Resolution

*For any* state transition where all mismatched fields become matched, the system should clear all error visual indicators from those fields.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 30: State Reset on New Verification

*For any* new verification triggered with a different identifier, the system should clear all previous verification state data and field validation states.

**Validates: Requirements 11.4**

### Property 31: No Stale Errors on Form Re-entry

*For any* form re-entry after navigation away, the system should not display stale error messages from previous sessions.

**Validates: Requirements 11.5**

### Property 32: Hook Integration with useAutoFill

*For any* verification trigger detected by the useRealtimeVerificationValidation hook, the hook should coordinate with the useAutoFill hook for API calls and cache management.

**Validates: Requirements 12.3**

### Property 33: Hook Uses Verification Matcher

*For any* verification data received by the useRealtimeVerificationValidation hook, the hook should execute field matching logic using the verificationMatcher utility.

**Validates: Requirements 12.4**

### Property 34: Hook Manages All Field States

*For any* validated field, the useRealtimeVerificationValidation hook should manage the validation state for that field independently.

**Validates: Requirements 12.5**

### Property 34: MultiStepForm Step Validation Integration

*For any* form state with mismatched fields, the system should set the MultiStepForm step validation to invalid; for any state with all matched fields or no validation, the step validation should be valid.

**Validates: Requirements 13.1, 13.2**

### Property 35: MultiStepForm Backward Compatibility

*For any* existing MultiStepForm validation logic, the verification system should integrate without breaking current validation behavior.

**Validates: Requirements 13.4**

### Property 36: Unauthenticated Users Bypass Validation

*For any* unauthenticated user, the verification system should not affect MultiStepForm validation or navigation.

**Validates: Requirements 13.5**

### Property 37: Debouncing Applied to Revalidation

### Property 35: MultiStepForm Step Validation Integration

*For any* form state with mismatched fields, the system should set the MultiStepForm step validation to invalid; for any state with all matched fields or no validation, the step validation should be valid.

**Validates: Requirements 13.1, 13.2**

### Property 36: MultiStepForm Backward Compatibility

*For any* existing MultiStepForm validation logic, the verification system should integrate without breaking current validation behavior.

**Validates: Requirements 13.4**

### Property 37: Unauthenticated Users Bypass Validation

*For any* unauthenticated user, the verification system should not affect MultiStepForm validation or navigation.

**Validates: Requirements 13.5**

### Property 38: Debouncing Applied to Revalidation

*For any* rapid sequence of field modifications, the system should debounce revalidation with a delay, resetting the timer on each new modification, and executing revalidation exactly once after the delay completes.

**Validates: Requirements 14.1, 14.2, 14.3**

### Property 39: Initial Verification Not Debounced

*For any* initial verification trigger (first blur on identifier field), the system should not apply debouncing.

**Validates: Requirements 14.4**

### Property 40: Final Validation at Submission

*For any* form submission, the system should perform a final validation check and display the VerificationMismatchModal if mismatches are detected that weren't caught by real-time validation.

**Validates: Requirements 16.1, 16.2, 16.3**

### Property 41: Modal Acknowledgment Allows Submission

*For any* VerificationMismatchModal acknowledgment, the system should allow form submission to proceed.

**Validates: Requirements 16.4**

### Property 42: Submission Failures Logged

*For any* submission-time validation failure, the system should create an audit log entry.

**Validates: Requirements 16.5**

### Property 43: Accessibility Attributes on Mismatched Fields

*For any* mismatched field, the system should set aria-invalid="true" and associate the error message using aria-describedby on that specific field.

**Validates: Requirements 17.1, 17.2**

### Property 44: Validation State Changes Announced

*For any* validation state change, the system should announce the change to screen readers using aria-live regions.

**Validates: Requirements 17.3**

### Property 45: Accessible Navigation Blocking

*For any* blocked step navigation, the system should provide accessible tooltip text explaining why navigation is disabled and which fields need correction.

**Validates: Requirements 17.4**

### Property 46: Keyboard Navigation Maintained

*For any* validation-related UI element, the system should maintain keyboard navigation functionality.

**Validates: Requirements 17.5**

## Error Handling

### Error Categories and Placement

**Critical Design Decision**: Errors are shown on the field where the problem exists, not on the CAC/NIN field.

1. **Verification API Errors** (shown on CAC/NIN field)
   - Network failures: Display connectivity error, allow retry
   - Timeouts (>10s): Display timeout message, allow navigation
   - Rate limiting: Display rate limit message, allow proceeding after 60s
   - Malformed responses: Log error, allow navigation
   - Authentication errors: Redirect to sign-in
   - Invalid format: Display format error, prevent API call

2. **Field Matching Errors** (shown on the specific mismatched field)
   - Company name mismatch: "This company name doesn't match CAC records" (on company name field)
   - Date mismatch: "This incorporation date doesn't match CAC records" (on date field)
   - Name mismatch: "This name doesn't match NIN records" (on name field)
   - DOB mismatch: "This date of birth doesn't match NIN records" (on DOB field)

3. **Integration Errors**
   - useAutoFill initialization failure: Gracefully degrade, allow manual entry
   - Cache corruption: Clear cache, retry verification
   - React Hook Form errors: Log error, maintain form functionality

### Error Message Examples

```typescript
// CAC/NIN Field Errors (verification errors only)
const identifierFieldErrors = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  TIMEOUT: 'Verification timed out. You may proceed, but data accuracy cannot be guaranteed.',
  RATE_LIMIT: 'Rate limit exceeded. Please wait 60 seconds before trying again.',
  INVALID_FORMAT: 'Invalid CAC number format. Please enter a valid RC number.',
  AUTH_REQUIRED: 'Please sign in to use verification.'
};

// Field-Level Errors (matching errors)
const fieldMatchingErrors = {
  companyName: 'This company name doesn\'t match CAC records',
  incorporationDate: 'This incorporation date doesn\'t match CAC records',
  address: 'This office address doesn\'t match CAC records',
  firstName: 'This first name doesn\'t match NIN records',
  lastName: 'This last name doesn\'t match NIN records',
  dateOfBirth: 'This date of birth doesn\'t match NIN records',
  gender: 'This gender doesn\'t match NIN records'
};
```

### Error Recovery Strategies

```typescript
// Graceful degradation for API errors
const handleVerificationError = (error: VerificationError) => {
  // These errors are shown on the CAC/NIN field, NOT on other fields
  switch (error.code) {
    case 'NETWORK_ERROR':
      // Allow retry, don't block navigation
      setVerificationError('Network error. Please check your connection and try again.');
      setCanProceed(true);
      break;
      
    case 'TIMEOUT':
      // Allow navigation after timeout
      setVerificationError('Verification timed out. You may proceed, but data accuracy cannot be guaranteed.');
      setCanProceed(true);
      break;
      
    case 'RATE_LIMIT':
      // Temporary block with countdown
      setVerificationError('Rate limit exceeded. Please wait 60 seconds before trying again.');
      startCountdown(60, () => setCanProceed(true));
      break;
      
    case 'AUTH_REQUIRED':
      // Redirect to sign-in
      navigate('/auth/signin');
      break;
      
    default:
      // Generic error, allow navigation
      setVerificationError('Verification failed. You may proceed, but please verify your data manually.');
      setCanProceed(true);
      logError(error);
  }
};

// Handle field matching errors
const handleFieldMismatch = (fieldName: string, fieldLabel: string) => {
  // Error is shown on the FIELD, not on the CAC/NIN field
  setFieldValidationStates(prev => ({
    ...prev,
    [fieldName]: {
      status: 'mismatched',
      errorMessage: `This ${fieldLabel.toLowerCase()} doesn't match verification records`,
      showCheckmark: false,
      showError: true
    }
  }));
  
  // Block navigation until field is fixed
  setCanProceed(false);
};

// Clear field error when user fixes it
const handleFieldMatch = (fieldName: string) => {
  setFieldValidationStates(prev => ({
    ...prev,
    [fieldName]: {
      status: 'matched',
      errorMessage: null,
      showCheckmark: true,
      showError: false
    }
  }));
  
  // Re-evaluate navigation blocking
  const hasAnyMismatches = Object.values(fieldValidationStates).some(
    state => state.status === 'mismatched'
  );
  setCanProceed(!hasAnyMismatches);
};
```

### Fallback Mechanisms

1. **Submission-Time Validation**: If real-time validation fails or is bypassed, the existing VerificationMismatchModal provides a final check
2. **Manual Entry**: Users can always manually enter data if verification fails
3. **Cache Fallback**: If cache is corrupted, clear and retry verification
4. **Autofill Fallback**: If autofill fails, validation still works with manual entry

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of field validation (e.g., company name "ABC Ltd" matches "abc ltd")
- Edge cases (empty fields, special characters, boundary dates)
- Integration points (hook initialization, MultiStepForm integration)
- Error conditions (API failures, malformed data)
- Accessibility features (ARIA attributes, keyboard navigation)

**Property-Based Tests** focus on:
- Universal properties across all inputs (e.g., "for any cached identifier, no API call is made")
- Comprehensive input coverage through randomization
- State transition correctness
- Cache behavior consistency
- Field validation logic across different data types

### Property-Based Testing Configuration

- **Library**: fast-check (for TypeScript/React)
- **Iterations**: Minimum 100 runs per property test
- **Tagging**: Each property test must reference its design document property

Example tag format:
```typescript
/**
 * Property-Based Test
 * Feature: realtime-verification-field-validation
 * Property 2: Cache Hit Prevents API Calls
 * 
 * For any identifier that exists in the verification cache,
 * any verification request for that identifier should retrieve
 * data from cache without making a new API call.
 */
```

### Test Coverage Requirements

1. **Hook Tests**
   - useRealtimeVerificationValidation initialization
   - State management across all validation states
   - Integration with useAutoFill
   - Integration with verificationMatcher
   - Cache coordination

2. **Component Tests**
   - FieldValidationIndicator rendering
   - ValidationTooltip display
   - Visual feedback updates
   - Accessibility attributes

3. **Integration Tests**
   - Full form flow with verification
   - MultiStepForm navigation blocking
   - Cache persistence across re-renders
   - Error recovery flows

4. **Property Tests** (45 properties from correctness properties section)
   - Each property must have a corresponding property-based test
   - Tests must run with minimum 100 iterations
   - Tests must use appropriate generators for input data

### Test Data Generators

```typescript
// Generator for valid NIN numbers
const validNINGenerator = fc.string({ minLength: 11, maxLength: 11 })
  .filter(s => /^\d{11}$/.test(s));

// Generator for valid CAC numbers
const validCACGenerator = fc.string({ minLength: 6, maxLength: 10 })
  .filter(s => /^RC\d+$/.test(s));

// Generator for form data with verification data
const formDataWithVerificationGenerator = fc.record({
  formData: fc.record({
    firstName: fc.string(),
    lastName: fc.string(),
    dateOfBirth: fc.date(),
    gender: fc.constantFrom('M', 'F', 'Male', 'Female')
  }),
  verificationData: fc.record({
    firstname: fc.string(),
    surname: fc.string(),
    birthdate: fc.date().map(d => d.toISOString()),
    gender: fc.constantFrom('M', 'F')
  })
});
```

## Implementation Phases

### Phase 1: Core Hook and Cache (Week 1)
- Implement VerificationCache service
- Implement useRealtimeVerificationValidation hook (basic structure)
- Integrate with useAutoFill for verification triggers
- Unit tests for cache and hook initialization

### Phase 2: Field Validation Logic (Week 1-2)
- Implement field-by-field comparison logic
- Integrate with verificationMatcher utility
- Implement field state management
- Implement auto-revalidation with debouncing
- Unit tests for validation logic

### Phase 3: Visual Feedback (Week 2)
- Implement FieldValidationIndicator component
- Implement ValidationTooltip component
- Add visual feedback to form fields
- Implement accessibility attributes
- Unit tests for visual components

### Phase 4: Navigation Integration (Week 2-3)
- Integrate with MultiStepForm validation
- Implement navigation blocking logic
- Add tooltip for blocked navigation
- Integration tests for navigation

### Phase 5: Form Integration (Week 3)
- Integrate with CorporateKYC form
- Integrate with CorporateNFIU form
- Integrate with IndividualKYC form
- Integrate with IndividualNFIU form
- Integration tests for each form

### Phase 6: Error Handling and Polish (Week 3-4)
- Implement comprehensive error handling
- Add error recovery mechanisms
- Implement audit logging for submission failures
- Polish UI/UX
- Accessibility testing

### Phase 7: Property-Based Testing (Week 4)
- Write property-based tests for all 45 properties
- Run tests with 100+ iterations
- Fix any issues discovered by property tests
- Document test results

### Phase 8: Documentation and Deployment (Week 4)
- Update user documentation
- Create developer documentation
- Perform final integration testing
- Deploy to staging
- User acceptance testing
- Deploy to production

## Performance Considerations

### Optimization Strategies

1. **Debouncing**: Revalidation is debounced with 300ms delay to prevent excessive validation calls
2. **Caching**: Verification responses are cached to eliminate duplicate API calls
3. **Lazy Validation**: Only validate fields that have corresponding verification data
4. **Memoization**: Use React.useMemo for expensive computations (field state derivation)
5. **Selective Re-renders**: Use React.useCallback to prevent unnecessary re-renders

### Performance Targets

- Initial verification trigger: <300ms from blur to API call
- Cache retrieval: <100ms from trigger to validation complete
- Revalidation: <200ms from blur to state update
- Visual feedback update: <200ms from state change to UI update
- Navigation state update: <100ms from validation complete to button state change

### Monitoring

```typescript
// Performance monitoring hooks
const usePerformanceMonitoring = () => {
  const logPerformance = (operation: string, duration: number) => {
    if (duration > PERFORMANCE_THRESHOLDS[operation]) {
      console.warn(`Performance warning: ${operation} took ${duration}ms`);
      // Log to analytics service
    }
  };
  
  return { logPerformance };
};
```

## Security Considerations

### Data Privacy

1. **No Verified Data in Error Messages**: Error messages never reveal the actual verified data values
2. **Cache Security**: Verification cache is session-scoped and cleared on logout
3. **Audit Logging**: All validation failures at submission time are logged for audit

### Authentication

1. **Verification Requires Auth**: Verification only triggers for authenticated users
2. **Session Validation**: Verify user session is valid before making API calls
3. **Token Management**: Use existing authentication tokens for API calls

### Input Validation

1. **Format Validation**: Validate identifier format before making API calls
2. **Sanitization**: Sanitize all user input before comparison
3. **XSS Prevention**: Escape all user-generated content in error messages

## Accessibility

### WCAG 2.1 AA Compliance

1. **Keyboard Navigation**: All interactive elements are keyboard accessible
2. **Screen Reader Support**: 
   - aria-invalid on mismatched fields
   - aria-describedby linking fields to error messages
   - aria-live announcements for state changes
3. **Visual Indicators**: 
   - Sufficient color contrast for borders and icons
   - Icons supplemented with text for color-blind users
4. **Focus Management**: Clear focus indicators on all interactive elements

### Accessibility Testing

- Manual testing with screen readers (NVDA, JAWS, VoiceOver)
- Automated testing with axe-core
- Keyboard navigation testing
- Color contrast verification

## Migration and Rollout

### Backward Compatibility

- Existing forms continue to work without real-time validation
- Submission-time validation (VerificationMismatchModal) remains as fallback
- No breaking changes to existing APIs or components

### Feature Flag

```typescript
const ENABLE_REALTIME_VALIDATION = import.meta.env.VITE_ENABLE_REALTIME_VALIDATION === 'true';

// In form components
const validation = ENABLE_REALTIME_VALIDATION 
  ? useRealtimeVerificationValidation(config)
  : null;
```

### Rollout Plan

1. **Week 1-4**: Development and testing
2. **Week 5**: Deploy to staging with feature flag disabled
3. **Week 6**: Enable feature flag for internal testing
4. **Week 7**: Enable for 10% of users (A/B test)
5. **Week 8**: Monitor metrics, fix issues
6. **Week 9**: Enable for 50% of users
7. **Week 10**: Enable for 100% of users
8. **Week 11**: Remove feature flag

### Success Metrics

- Reduction in duplicate verification API calls: Target 80%
- Reduction in submission-time validation failures: Target 70%
- User satisfaction: Target 4.5/5 stars
- Form completion rate: Target increase of 15%
- Average time to complete form: Target reduction of 20%

## Appendix

### Field Configuration Reference

```typescript
// Complete field configurations for all form types
export const FIELD_VALIDATION_CONFIGS = {
  'Corporate KYC': {
    identifierFieldName: 'cacNumber',
    identifierType: 'CAC' as const,
    fieldsToValidate: CAC_FIELDS_CONFIG
  },
  'Corporate NFIU': {
    identifierFieldName: 'incorporationNumber',
    identifierType: 'CAC' as const,
    fieldsToValidate: CAC_FIELDS_CONFIG
  },
  'Individual KYC': {
    identifierFieldName: 'NIN',
    identifierType: 'NIN' as const,
    fieldsToValidate: NIN_FIELDS_CONFIG
  },
  'Individual NFIU': {
    identifierFieldName: 'NIN',
    identifierType: 'NIN' as const,
    fieldsToValidate: NIN_FIELDS_CONFIG
  }
};
```

### API Response Formats

```typescript
// CAC Verification Response
interface CACVerificationResponse {
  status: boolean;
  message: string;
  data: {
    name: string;
    registrationDate: string;
    address: string;
    rcNumber: string;
    // ... other fields
  };
}

// NIN Verification Response
interface NINVerificationResponse {
  status: boolean;
  message: string;
  data: {
    firstname: string;
    surname: string;
    birthdate: string;
    gender: string;
    // ... other fields
  };
}
```

### Error Code Reference

```typescript
enum VerificationErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INVALID_FORMAT = 'INVALID_FORMAT',
  MALFORMED_RESPONSE = 'MALFORMED_RESPONSE',
  CACHE_ERROR = 'CACHE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
```
