# CAC Blur Event Dependency Fix

## Issue Summary

User reported two issues with the Corporate KYC form:

1. **Blur event not firing**: When entering a CAC number and leaving the field, no verification was triggered - no console logs appeared at all
2. **Duplicate error messages**: When clearing the CAC field, two error messages appeared:
   - "CAC/RC number is required"
   - "CAC/Incorporation number is required"

## Root Cause Analysis

### Issue 1: Blur Event Not Firing

The `cacRefCallback` had incorrect dependencies in its `useCallback`:

```typescript
// BEFORE (incorrect)
const cacRefCallback = useCallback((element: HTMLInputElement | null) => {
  // ... attachment logic
}, [isAuthenticated, autoFillState, realtimeValidation]);
```

**Problem**: Passing entire objects (`autoFillState`, `realtimeValidation`) as dependencies causes the callback to be recreated on every render because these objects have new references each time. This prevents the ref callback from executing properly.

**Why it failed**:
- React ref callbacks are only called when the ref changes
- If the callback function reference changes on every render, React doesn't know when to call it
- The blur event listener was never actually attached to the DOM element

### Issue 2: Duplicate Error Messages

The field had inconsistent naming:
- **Label**: "CAC/Incorporation Number"
- **Validation error**: "CAC/Incorporation number is required"
- **User expectation**: "CAC/RC number" (RC is the standard abbreviation)

This created confusion and made it appear as if there were two separate fields with validation errors.

## Solution Implemented

### Fix 1: Correct useCallback Dependencies

Changed the dependencies to only include the specific functions needed:

```typescript
// AFTER (correct)
const cacRefCallback = useCallback((element: HTMLInputElement | null) => {
  console.log('[CorporateKYC] ===== CAC REF CALLBACK FIRED =====');
  console.log('[CorporateKYC] CAC input element:', element);
  console.log('[CorporateKYC] CAC input ID:', element?.id);
  console.log('[CorporateKYC] Is authenticated:', isAuthenticated);
  
  if (element && isAuthenticated) {
    cacInputRef.current = element;
    
    console.log('[CorporateKYC] Attaching handlers...');
    
    // Attach handlers - these add native DOM event listeners
    autoFillState.attachToField(element);
    realtimeValidation.attachToIdentifierField(element);
    
    console.log('[CorporateKYC] ✅ Handlers attached successfully');
  } else if (!element) {
    console.log('[CorporateKYC] CAC ref callback: element unmounted');
  } else {
    console.log('[CorporateKYC] ⚠️ Cannot attach handlers: not authenticated');
  }
}, [isAuthenticated, autoFillState.attachToField, realtimeValidation.attachToIdentifierField]);
```

**Key changes**:
- Only depend on `isAuthenticated` (primitive boolean)
- Only depend on `autoFillState.attachToField` (stable function reference)
- Only depend on `realtimeValidation.attachToIdentifierField` (stable function reference)
- Moved console logs to execute regardless of conditions for better debugging

### Fix 2: Standardize Field Naming

Updated all references to use consistent "CAC/RC Number" terminology:

**Label**:
```typescript
<Label htmlFor="cacNumber">
  CAC/RC Number
  <span className="required-asterisk">*</span>
</Label>
```

**Validation schema**:
```typescript
cacNumber: yup.string()
  .required("CAC/RC number is required")
  .matches(/^[A-Za-z0-9]+$/, "CAC/RC number must contain only letters and numbers"),
```

## Expected Behavior After Fix

1. **Blur event triggers properly**:
   - Console logs appear when the ref callback executes
   - Blur event listener is attached to the CAC input field
   - When user enters CAC number and tabs/clicks away, verification starts
   - Loading spinner appears during verification
   - Success checkmark or error icon appears after verification

2. **Single, clear error message**:
   - Only one error message appears: "CAC/RC number is required"
   - Consistent terminology throughout the form

## Testing Instructions

1. **Test blur event**:
   - Open Corporate KYC form while authenticated
   - Check browser console for: `[CorporateKYC] ===== CAC REF CALLBACK FIRED =====`
   - Enter a CAC number (e.g., RC6971)
   - Tab away or click another field
   - Verify console shows: `[InputTriggerHandler] ===== BLUR EVENT FIRED =====`
   - Verify verification starts (loading spinner appears)

2. **Test error message**:
   - Enter a CAC number
   - Clear the field completely
   - Verify only ONE error message appears: "CAC/RC number is required"

## Files Modified

- `src/pages/kyc/CorporateKYC.tsx`:
  - Fixed `cacRefCallback` dependencies
  - Updated field label from "CAC/Incorporation Number" to "CAC/RC Number"
  - Updated validation error messages to match

## Technical Notes

### Why useCallback Dependencies Matter

React's `useCallback` hook memoizes a function based on its dependencies:
- If dependencies don't change, the same function reference is returned
- If dependencies change, a new function reference is created

For ref callbacks:
- React only calls the ref callback when the callback function reference changes
- If the callback changes on every render, React can't determine when to actually call it
- This is why we must only depend on stable references or primitives

### Stable Function References

Both `useAutoFill` and `useRealtimeVerificationValidation` hooks use `useCallback` internally to ensure their `attachToField` functions have stable references:

```typescript
// In useAutoFill.ts
const attachToField = useCallback((inputElement: HTMLInputElement) => {
  // ... attachment logic
}, [identifierType, userId, formId, requireAuth, isAuthenticated]);

// In useRealtimeVerificationValidation.ts
const attachToIdentifierField = useCallback((inputElement: HTMLInputElement) => {
  // ... attachment logic
}, [isAuthenticated, identifierValue, cache, fieldsToValidate, autoFill]);
```

These functions only change when their specific dependencies change, making them safe to use as dependencies in other `useCallback` hooks.

## Related Issues

This fix resolves the issues introduced in the previous attempt where:
- The `useCallback` import was added but dependencies were incorrect
- The ref callback wasn't executing because of unstable dependencies
- The blur event listener was never attached to the DOM

## Prevention

To prevent similar issues in the future:

1. **Always use specific function references as dependencies**, not entire objects
2. **Test ref callbacks** by checking console logs to ensure they execute
3. **Verify event listeners are attached** by checking the DOM in browser DevTools
4. **Keep field labels and validation messages consistent** to avoid user confusion
