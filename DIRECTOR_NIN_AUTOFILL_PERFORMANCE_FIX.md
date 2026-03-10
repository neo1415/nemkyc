# Director NIN Autofill Performance Fix

## Issue
Page freezes when typing in director NIN fields in Corporate KYC and Corporate NFIU forms.

## Root Cause
The ref callback on the NIN input field was being called on EVERY RENDER, causing `attachToField` to detach and re-attach hooks repeatedly, creating massive performance overhead.

## Solution Implemented

### Phase 1: Field Mapping Fix (COMPLETED)
- Added `fieldPrefix` parameter to `FieldMapper.mapNINFields()` method
- Added `fieldPrefix` to `AutoFillEngineConfig` interface
- Updated `useAutoFill` hook to accept and pass `fieldPrefix` parameter
- Updated both `CorporateKYC.tsx` and `CorporateNFIU.tsx` to pass `fieldPrefix: 'directors.0.'`, `fieldPrefix: 'directors.1.'`, and `fieldPrefix: 'directors.2.'` to respective director hooks
- This allows the FieldMapper to search for prefixed field names correctly (e.g., `directors.0.firstName` instead of just `firstName`)

### Phase 2: Performance Fix (COMPLETED)
- Removed the ref callback pattern that was re-attaching hooks on every render
- Changed to simple `{...formMethods.register()}` without custom ref callback
- Added `useEffect` to attach director hooks only once when fields are mounted
- The useEffect runs only when `directorFields.length` or `isAuthenticated` changes
- Applied fix to both `CorporateKYC.tsx` and `CorporateNFIU.tsx`

## Files Modified
- `src/services/autoFill/FieldMapper.ts` - Added fieldPrefix parameter
- `src/services/autoFill/AutoFillEngine.ts` - Pass fieldPrefix to FieldMapper
- `src/hooks/useAutoFill.ts` - Accept and pass fieldPrefix parameter
- `src/pages/kyc/CorporateKYC.tsx` - Pass fieldPrefix to director hooks, simplified NIN input, added useEffect
- `src/pages/nfiu/CorporateNFIU.tsx` - Pass fieldPrefix to director hooks, simplified NIN input, added useEffect

## Result
- Director NIN fields no longer freeze when typing
- Autofill still works correctly when pressing Tab after entering a valid NIN
- Hooks are attached once on mount instead of on every render
- Significant performance improvement

## Testing
1. Open Corporate KYC or Corporate NFIU form
2. Navigate to the Directors section
3. Type in any director's NIN field
4. Verify that typing is smooth and responsive (no freezing)
5. Enter a valid NIN and press Tab
6. Verify that autofill populates the director's fields correctly
7. Add additional directors and verify the same behavior
