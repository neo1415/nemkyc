# Director NIN Autofill Fix Summary

## Issue
In both CorporateKYC and CorporateNFIU, when entering a director NIN and leaving the field (blur event), nothing happens - no autofill is triggered.

## Root Cause Analysis

**IndividualKYC (Working):**
- Uses `id="NIN"` for the NIN field
- Uses a `ninRefCallback` that directly attaches handlers via `autoFillState.attachToField(element)` and `realtimeValidation.attachToIdentifierField(element)`
- The ref callback is called immediately when the input is rendered

**CorporateKYC & CorporateNFIU (Not Working - Before Fix):**
- Uses `id="directors.${index}.NINNumber"` for director NIN fields (e.g., `directors.0.NINNumber`)
- Used a `useEffect` that tried to find elements by ID using `document.getElementById()` 
- The useEffect ran after render, but the handlers were not being properly attached

**InputTriggerHandler Logic:**
The InputTriggerHandler attaches a `blur` event listener to trigger autofill. The issue was that the useEffect approach was unreliable compared to the ref callback approach.

## The Fix Applied

Applied to both **CorporateKYC** and **CorporateNFIU**:

1. **Replaced useEffect with ref callback pattern**: Changed from using `useEffect` with `document.getElementById()` to using a ref callback that directly attaches handlers when the element is mounted.

2. **Updated director NIN field implementation**: Modified the director NIN input field to use the same pattern as IndividualKYC:
   ```tsx
   {...(() => {
     const { ref, ...rest } = formMethods.register(`directors.${index}.NINNumber`, {
       onChange: () => {
         const error = get(formMethods.formState.errors, `directors.${index}.NINNumber`);
         if (error) {
           formMethods.clearErrors(`directors.${index}.NINNumber`);
         }
       }
     });
     return {
       ...rest,
       ref: (e: HTMLInputElement | null) => {
         // Call both refs
         ref(e);
         // Create and call the ref callback for this director
         const directorNinRefCallback = (element: HTMLInputElement | null) => {
           if (element && isAuthenticated) {
             const hooks = getDirectorHooks(index);
             if (hooks) {
               hooks.autoFill.attachToField(element);
               hooks.validation.attachToIdentifierField(element);
             }
           }
         };
         directorNinRefCallback(e);
       }
     };
   })()}
   ```

3. **Removed the old useEffect**: Removed the useEffect that was trying to attach handlers via `document.getElementById()`.

## Expected Result

Now when a user:
1. Enters a valid 11-digit NIN in a director field (in either Corporate KYC or Corporate NFIU)
2. Presses Tab or clicks outside the field (blur event)
3. The InputTriggerHandler should trigger the autofill API call
4. If successful, the director's fields should be auto-populated with the verified data

## Testing Instructions

**For Corporate KYC:**
1. Navigate to Corporate KYC form
2. Go to the Directors section
3. Enter a valid 11-digit NIN (e.g., 12345678901)
4. Press Tab or click outside the NIN field
5. Verify that autofill is triggered and fields are populated

**For Corporate NFIU:**
1. Navigate to Corporate NFIU form
2. Go to the Directors section
3. Enter a valid 11-digit NIN (e.g., 12345678901)
4. Press Tab or click outside the NIN field
5. Verify that autofill is triggered and fields are populated

## Files Modified

- `src/pages/kyc/CorporateKYC.tsx`: Updated director NIN field implementation and removed old useEffect
- `src/pages/nfiu/CorporateNFIU.tsx`: Updated director NIN field implementation and removed old useEffect

The fix aligns both CorporateKYC and CorporateNFIU director NIN autofill behavior with the working IndividualKYC implementation.