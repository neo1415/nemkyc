# CAC Blur Event useCallback Import Fix

## Problem
User reported two issues:
1. **Nothing happens on blur** - When entering CAC number and leaving the field, no verification starts
2. **TypeScript error** - `Cannot find name 'useCallback'.ts(2304)` in CorporateKYC.tsx

## Root Cause
The `useCallback` hook was being used in both CorporateKYC.tsx and CorporateNFIU.tsx but was not imported from React. This caused:
- TypeScript compilation errors
- The `cacRefCallback` function to fail
- Blur event handlers not being attached to the CAC input field
- No verification triggering when user leaves the CAC field

## Solution
Added `useCallback` to the React imports in both files:

### CorporateKYC.tsx
```typescript
// Before:
import React, { useState, useEffect } from 'react';

// After:
import React, { useState, useEffect, useCallback } from 'react';
```

### CorporateNFIU.tsx
```typescript
// Before:
import React, { useState, useEffect, useRef } from 'react';

// After:
import React, { useState, useEffect, useRef, useCallback } from 'react';
```

## How It Works
The `cacRefCallback` uses `useCallback` to create a stable reference to the callback function that:
1. Receives the CAC input element when it mounts
2. Checks if user is authenticated
3. Attaches `InputTriggerHandler` (for autofill verification)
4. Attaches real-time validation handler
5. Both handlers add native DOM blur event listeners

When the blur event fires:
- `InputTriggerHandler` validates the CAC format
- If valid, triggers verification API call
- On success, executes autofill and real-time field matching
- Updates UI with verification status and field validation states

## Testing
To verify the fix works:
1. Open Corporate KYC form while authenticated
2. Enter a valid CAC number (e.g., RC6971)
3. Press Tab or click outside the field (blur event)
4. Console should show:
   ```
   [CorporateKYC] ===== CAC REF CALLBACK FIRED =====
   [InputTriggerHandler] ===== BLUR EVENT FIRED =====
   [InputTriggerHandler] Triggering CAC verification
   ```
5. Verification should start automatically
6. Fields should be auto-filled if verification succeeds
7. Real-time validation should highlight any mismatched fields

## Files Modified
- `src/pages/kyc/CorporateKYC.tsx` - Added `useCallback` import
- `src/pages/nfiu/CorporateNFIU.tsx` - Added `useCallback` import

## Related Issues
- Previous attempt removed manual blur handlers thinking native events would work
- The issue was actually the missing import preventing the ref callback from working
- With the import fixed, the native blur event listeners attached by the handlers will fire correctly
