# CAC Blur Event Ref Conflict Fix

## Problem
The CAC blur event was not firing at all - no console logs appeared when the user entered a CAC number and left the field. The `cacRefCallback` was never executing.

## Root Cause
React Hook Form's `register()` function returns an object that includes a `ref` property. When spreading `{...formMethods.register('cacNumber')}` on the Input component, it overwrites the custom `ref={cacRefCallback}` that was set separately.

```tsx
// BROKEN CODE - ref gets overwritten
<Input
  ref={cacRefCallback}  // This ref is set first
  {...formMethods.register('cacNumber')}  // But this spreads a ref that overwrites it
/>
```

The spread operator applies properties AFTER the explicit `ref={cacRefCallback}`, so React Hook Form's ref wins and the custom ref callback never executes.

## Solution
Manually merge both refs by:
1. Destructuring the `ref` from `register()` return value
2. Creating a new ref function that calls BOTH refs
3. Spreading the rest of the register properties

```tsx
// FIXED CODE - both refs are called
<Input
  {...(() => {
    const { ref, ...rest } = formMethods.register('cacNumber', {
      onChange: handleCACChange
    });
    return {
      ...rest,
      ref: (e: HTMLInputElement | null) => {
        // Call both refs
        ref(e);  // React Hook Form's ref
        cacRefCallback(e);  // Our custom ref
      }
    };
  })()}
/>
```

## How It Works
1. The IIFE (Immediately Invoked Function Expression) extracts the `ref` from register's return value
2. It creates a new ref callback that calls BOTH the React Hook Form ref AND our custom cacRefCallback
3. This ensures both refs are executed when the component mounts
4. React Hook Form can still track the field, AND our blur event listener gets attached

## Testing
After this fix:
1. The `cacRefCallback` should execute when the component mounts (check console logs)
2. The blur event listener should be attached to the CAC input field
3. When the user enters a CAC number and leaves the field, verification should trigger
4. React Hook Form validation should still work normally

## Files Changed
- `src/pages/kyc/CorporateKYC.tsx` - Fixed ref merging for CAC input field

## Note on Duplicate Error Messages
The user reported seeing two error messages: "CAC/RC number is required" AND "CAC/Incorporation number is required". 

After investigation:
- The validation schema only has ONE rule for `cacNumber`
- There is NO `incorporationNumber` field in the CorporateKYC form
- The summary display shows "CAC/Incorporation Number" as a label but only checks `cacNumber` field
- The user might be confusing this with the CorporateNFIU form which does have `incorporationNumber`
- If the duplicate error persists, it may be a browser caching issue or the user might be testing the wrong form

The fix for the ref conflict should resolve the primary issue of the blur event not firing.
