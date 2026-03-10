# CAC Blur Event Fix - Verification Not Triggering

## Problem

When authenticated users entered a CAC number in Corporate KYC or Corporate NFIU forms and left the field (blur event), the verification was not starting. The console only showed:
```
[CorporateKYC] CAC field blur event fired
```

But no verification was triggered, and the real-time validation system wasn't working.

## Root Cause

The issue was caused by a conflict between React's synthetic event system and native DOM event listeners:

1. **React Hook Form's `register()`** uses React's synthetic events for `onChange` and `onBlur`
2. **InputTriggerHandler** attaches a native DOM event listener using `addEventListener('blur', ...)`
3. **Manual event dispatch** in `handleCACBlur` was attempting to bridge the gap by dispatching a native `FocusEvent`, but this wasn't working correctly

The problem: React's synthetic blur event from `register()` doesn't automatically trigger native DOM event listeners. The manual dispatch was also not working as expected because:
- The timing was off (dispatched after React's synthetic event)
- Event bubbling wasn't propagating correctly
- The `InputTriggerHandler`'s listener wasn't receiving the event

## Solution

**Remove the manual blur handler entirely** and let the native DOM blur event trigger naturally. The key insight is that:

1. The `cacRefCallback` attaches the `InputTriggerHandler` to the input element
2. `InputTriggerHandler.attachToField()` adds a native blur listener using `addEventListener`
3. Native blur events fire automatically when the user leaves the field
4. We don't need React Hook Form to handle the blur event for verification purposes

### Changes Made

#### 1. Corporate KYC (`src/pages/kyc/CorporateKYC.tsx`)

**Removed:**
```typescript
// CAC blur handler - ensures blur event propagates to InputTriggerHandler
const handleCACBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  console.log('[CorporateKYC] CAC field blur event fired');
  // Manually dispatch a native blur event to trigger InputTriggerHandler's listener
  // React's synthetic events don't automatically trigger DOM event listeners
  const nativeEvent = new FocusEvent('blur', { bubbles: true });
  e.target.dispatchEvent(nativeEvent);
};
```

**Updated input registration:**
```typescript
// Before:
{...formMethods.register('cacNumber', {
  onChange: handleCACChange,
  onBlur: handleCACBlur  // ❌ Removed
})}

// After:
{...formMethods.register('cacNumber', {
  onChange: handleCACChange
  // No onBlur handler needed - native blur event works automatically
})}
```

#### 2. Corporate NFIU (`src/pages/nfiu/CorporateNFIU.tsx`)

**Removed:**
```typescript
// Incorporation number blur handler - ensures blur event propagates to InputTriggerHandler
const handleIncorporationNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  console.log('[CorporateNFIU] Incorporation number field blur event fired');
  // Manually dispatch a native blur event to trigger InputTriggerHandler's listener
  // React's synthetic events don't automatically trigger DOM event listeners
  const nativeEvent = new FocusEvent('blur', { bubbles: true });
  e.target.dispatchEvent(nativeEvent);
};
```

**Updated input registration:**
```typescript
// Before:
{...formMethods.register('incorporationNumber', {
  onChange: () => { ... },
  onBlur: handleIncorporationNumberBlur  // ❌ Removed
})}

// After:
{...formMethods.register('incorporationNumber', {
  onChange: () => { ... }
  // No onBlur handler needed - native blur event works automatically
})}
```

## How It Works Now

1. **User enters CAC number** → `onChange` handler validates format
2. **User leaves the field (blur)** → Native blur event fires automatically
3. **InputTriggerHandler receives blur event** → Validates identifier format
4. **If valid** → Triggers verification API call
5. **Verification completes** → Auto-fill populates fields
6. **Real-time validation** → Matches user-entered data against verification data
7. **Visual feedback** → Highlights mismatched fields with red borders
8. **User corrects field** → Field revalidates on blur
9. **All fields match** → User can proceed to next step

## Expected Behavior

### When Authenticated:
1. Enter CAC number (e.g., RC6971)
2. Press Tab or click outside the field
3. Console logs:
   ```
   [InputTriggerHandler] ===== BLUR EVENT FIRED =====
   [InputTriggerHandler] Input value: RC6971
   [InputTriggerHandler] Validating identifier format...
   [InputTriggerHandler] Validation passed, triggering verification...
   [InputTriggerHandler] Triggering CAC verification
   ```
4. Loading spinner appears in CAC field
5. Verification completes (from cache or API)
6. Fields auto-populate with verified data
7. Real-time validation highlights any mismatches

### When Not Authenticated:
- Auto-fill and real-time validation are disabled
- CAC is verified during form submission
- No blur event verification occurs

## Testing

To verify the fix works:

1. **Sign in** to the application
2. **Navigate** to Corporate KYC form
3. **Enter CAC number**: RC6971
4. **Press Tab** or click outside the field
5. **Verify** console shows full verification flow logs
6. **Check** that fields auto-populate
7. **Verify** real-time validation highlights mismatches (if any)
8. **Correct** a mismatched field and blur
9. **Verify** field revalidates and border turns green

## Related Files

- `src/pages/kyc/CorporateKYC.tsx` - Corporate KYC form
- `src/pages/nfiu/CorporateNFIU.tsx` - Corporate NFIU form
- `src/services/autoFill/InputTriggerHandler.ts` - Blur event handler
- `src/hooks/useAutoFill.ts` - Auto-fill hook
- `src/hooks/useRealtimeVerificationValidation.ts` - Real-time validation hook

## Key Takeaway

**Don't mix React synthetic events with native DOM event listeners.** When using `addEventListener` for native events, let those events fire naturally instead of trying to manually dispatch them from React event handlers. The browser's native event system works perfectly on its own.
