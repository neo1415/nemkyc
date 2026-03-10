# Design Document Update Summary

## Date
2024-01-XX

## Reason for Update
Critical UX issues discovered during implementation that required design changes to fix:

1. **Cache + Matching Loop Issue**: Verification succeeded (cached) but matching ran repeatedly showing the same error
2. **Error Message Location Problem**: Errors appeared on CAC/NIN field instead of the actual mismatched fields
3. **Lack of Field-Level Highlighting**: No per-field error indicators
4. **No Per-Field Revalidation**: Couldn't revalidate individual fields after fixing them

## Key Design Changes

### 1. Separation of Verification and Matching

**Before**: Verification and matching were treated as a single operation
**After**: Clear separation between:
- **Verification**: API call to verify CAC/NIN exists (happens once, cached)
- **Matching**: Comparing form fields with verification data (happens multiple times: once on verification, then per-field on blur)

### 2. Field-Level Error Placement

**Before**: Errors appeared on the CAC/NIN field
**After**: Errors appear on the SPECIFIC field that doesn't match
- CAC/NIN field: Only shows verification API errors (format, network, auth)
- Other fields: Show matching errors (e.g., "This company name doesn't match CAC records")

### 3. Per-Field State Management

**Before**: Global validation state
**After**: Each field has its own independent validation state:
- `not_verified`: Field hasn't been checked yet
- `pending`: Validation in progress
- `matched`: Field value matches verification data (green checkmark)
- `mismatched`: Field value doesn't match (red border + inline error)

### 4. Cache + Matching Integration Fix

**Before**: Matching triggered on field state changes, causing loops
**After**: Matching triggers only on:
- Verification completion (runs once for all fields)
- Individual field blur (runs once for that field only)

**Implementation**:
```typescript
// WRONG: This causes a loop
useEffect(() => {
  if (verificationData) {
    performMatching(); // Updates field states
  }
}, [verificationData, fieldValidationStates]); // fieldValidationStates causes re-trigger

// CORRECT: Matching runs once per verification
useEffect(() => {
  if (autoFill.state.status === 'success' && autoFill.state.cached !== undefined) {
    performAllFieldsMatching(); // Runs once, updates all field states
  }
}, [autoFill.state.status, autoFill.state.cached]); // Only depends on verification state
```

### 5. Per-Field Revalidation

**New Feature**: Each field can be independently revalidated on blur
- Retrieves cached verification data (no API call)
- Compares only that field's value
- Updates only that field's state
- Allows users to fix fields one at a time and see immediate feedback

## Updated Components

### useRealtimeVerificationValidation Hook

**New Properties**:
- `verificationError`: Separate from field errors, shown only on CAC/NIN field
- `revalidateField(fieldName)`: Revalidate a single field using cached data
- `getFieldValidationProps(fieldName)`: Returns props including onBlur handler for revalidation

**New Behavior**:
- Manages field states independently
- Separates verification errors from matching errors
- Provides per-field revalidation

### FieldValidationIndicator Component

**Updated**:
- Now receives `fieldLabel` prop for error messages
- Renders error message BELOW the field it's attached to
- Not attached to CAC/NIN field

### New: IdentifierFieldError Component

**Purpose**: Show verification API errors on CAC/NIN field only
- Network errors
- Format errors
- Authentication errors
- Rate limit errors

**Does NOT show**: Matching errors (those appear on individual fields)

### ValidationTooltip Component

**Updated**:
- Now shows list of mismatched field labels
- Helps users understand which specific fields need fixing

## Updated Data Flow

### Initial Verification Flow
1. User blurs CAC/NIN field
2. System verifies (API or cache)
3. System runs matching ONCE for all fields
4. System updates all field states
5. System stops (no loop)

### Per-Field Revalidation Flow
1. User modifies a field (e.g., company name)
2. User blurs that field
3. System retrieves cached verification data
4. System matches ONLY that field
5. System updates ONLY that field's state
6. System stops (no loop)

## Updated Correctness Properties

### New Property 20: No Matching Loop on Cached Verification
*For any* cached verification data, when the verification completes (from cache), the system should run matching exactly once for all fields, update all field states, and stop without re-triggering matching.

### Updated Properties
- Property 2: Clarified that matching runs once using cached data
- Property 3: Clarified error appears on identifier field
- Property 7: Added that error appears on specific field, not identifier field
- Property 9: Added that identifier field only shows verification errors
- Property 11: Added that error appears below specific field
- Property 12: Clarified revalidation is per-field without re-running verification
- Property 28: Added that errors appear on specific fields
- Property 29: Added that field states are cleared
- Property 30: Added that field validation states are cleared
- Property 34: Added "independently"
- Property 43: Added "on that specific field"
- Property 45: Added "and which fields need correction"

## Complete UX Flow Documentation

Added comprehensive UX flow scenarios:
1. Happy path (empty fields, autofill)
2. Mismatch scenario (pre-filled wrong data)
3. Fix mismatch scenario (user corrects field)
4. Cached verification (no loop)
5. Verification API error

## Key UX Principles

1. **Error Location**: Errors appear where the problem exists
2. **No Loops**: Matching runs once per trigger, updates state, stops
3. **Clear Feedback**: Users always know what's wrong and where
4. **Navigation Blocking**: Disabled only for actual mismatches, not verification errors

## Implementation Impact

### Breaking Changes
None - this is a design update before implementation

### New Requirements
- Field-level error message components
- Per-field blur handlers for revalidation
- Separate error state for identifier field vs other fields
- Loop prevention logic in useEffect dependencies

### Testing Updates
- Property tests need to verify no loops occur
- Property tests need to verify errors appear on correct fields
- Property tests need to verify per-field revalidation works
- Integration tests need to verify complete UX flows

## Next Steps

1. Implement useRealtimeVerificationValidation hook with updated design
2. Create FieldValidationIndicator and IdentifierFieldError components
3. Add per-field revalidation logic
4. Implement loop prevention
5. Write property tests for new Property 20
6. Update existing property tests with clarifications
7. Test complete UX flows

## References

- Original Design: `.kiro/specs/realtime-verification-field-validation/design.md`
- Requirements: `.kiro/specs/realtime-verification-field-validation/requirements.md`
- Related: `src/utils/verificationMatcher.ts`, `src/hooks/useAutoFill.ts`
