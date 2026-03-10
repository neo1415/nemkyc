# Keyboard Navigation Guide

## Real-Time Verification Field Validation - Keyboard Accessibility

This document describes the keyboard navigation support for the real-time verification field validation feature.

## Overview

All validation-related UI elements are fully keyboard accessible, following WCAG 2.1 AA guidelines. Users can navigate through forms, receive validation feedback, and understand navigation blocking using only the keyboard.

## Keyboard Navigation Flow

### 1. Form Field Navigation

**Tab Order:**
1. Identifier field (CAC/NIN)
2. Other form fields (company name, date, etc.)
3. Navigation buttons (Next/Submit)

**Keyboard Actions:**
- `Tab`: Move to next field
- `Shift + Tab`: Move to previous field
- `Enter`: Submit form (when on submit button)
- `Space`: Activate button (when on button)

### 2. Identifier Field (CAC/NIN)

**Behavior:**
- User tabs to identifier field
- User types identifier value
- User tabs out (blur event) → triggers verification
- Screen reader announces: "Verifying..." (via aria-live)

**Keyboard Actions:**
- Type to enter identifier
- `Tab` to move to next field (triggers verification)

### 3. Validated Fields

**Matched Field:**
- User tabs to field
- Field has green border (visual indicator)
- Screen reader announces: "[Field name] is now verified and matches records" (via aria-live)
- Field has `aria-invalid="false"`

**Mismatched Field:**
- User tabs to field
- Field has red border (visual indicator)
- Screen reader announces: "[Field name] does not match verification records. Please correct this field" (via aria-live)
- Field has `aria-invalid="true"`
- Field has `aria-describedby` linking to error message
- Error message is read by screen reader when field receives focus

**Keyboard Actions:**
- Type to modify field value
- `Tab` to move to next field (triggers revalidation)

### 4. Navigation Buttons

**Enabled State:**
- User tabs to button
- Button is focusable and clickable
- Screen reader announces: "Next" or "Submit"
- `Enter` or `Space` activates button

**Disabled State (Validation Blocking):**
- User tabs to button
- Button is focusable but not clickable
- Button has `aria-disabled="true"`
- Button has `aria-describedby` linking to tooltip
- Screen reader announces: "Next, disabled. Please correct the following fields: [list of fields]"
- Tooltip is visible when button has focus
- `Enter` or `Space` does nothing (button is disabled)

**Keyboard Actions:**
- `Tab` to focus button
- `Enter` or `Space` to activate (if enabled)
- Tooltip is automatically announced via `aria-describedby`

## Screen Reader Announcements

### Verification Trigger
```
"Verifying CAC number..."
```

### Verification Success
```
"Verification complete. Company name is now verified and matches records."
```

### Field Mismatch
```
"Company name does not match CAC records. Please correct this field."
```

### All Fields Validated
```
"All fields have been verified successfully. You may proceed to the next step."
```

### Navigation Blocked
```
"Next, disabled. Please correct the following fields: Company Name, Incorporation Date."
```

### Field Corrected
```
"Company name is now verified and matches records. 1 field needs correction before you can proceed."
```

### All Fields Corrected
```
"All fields have been verified successfully. You may proceed to the next step."
```

## Focus Management

### Focus Indicators

All interactive elements have clear focus indicators:
- **Fields**: Blue outline (browser default or custom)
- **Buttons**: Blue outline with increased contrast
- **Tooltips**: Automatically associated via `aria-describedby`

### Focus Order

The focus order follows the logical reading order:
1. Identifier field
2. Form fields (top to bottom)
3. Navigation buttons (left to right)

### Focus Trapping

No focus trapping is implemented. Users can freely navigate through the form using Tab/Shift+Tab.

## ARIA Attributes

### Field-Level ARIA

**Matched Field:**
```html
<input
  id="companyName"
  aria-invalid="false"
  class="border-green-500"
/>
<div role="status" aria-live="polite">
  <span>Verified</span>
</div>
```

**Mismatched Field:**
```html
<input
  id="companyName"
  aria-invalid="true"
  aria-describedby="companyName-validation-error"
  class="border-red-500"
/>
<div
  id="companyName-validation-error"
  role="alert"
  aria-live="assertive"
>
  This company name doesn't match CAC records
</div>
```

### Button-Level ARIA

**Enabled Button:**
```html
<button type="button">
  Next
</button>
```

**Disabled Button with Tooltip:**
```html
<button
  type="button"
  disabled
  aria-disabled="true"
  aria-describedby="navigation-validation-tooltip"
>
  Next
</button>
<div id="navigation-validation-tooltip" role="tooltip" aria-live="polite">
  Please correct the following fields:
  <ul>
    <li>Company Name</li>
    <li>Incorporation Date</li>
  </ul>
</div>
```

### Announcer ARIA

**Validation Announcer:**
```html
<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
  Company name is now verified and matches records.
  All fields have been verified successfully. You may proceed to the next step.
</div>
```

## Testing Keyboard Navigation

### Manual Testing Checklist

- [ ] Can tab through all form fields in logical order
- [ ] Can tab to identifier field and trigger verification by tabbing out
- [ ] Can tab to validated fields and see visual indicators
- [ ] Can tab to navigation buttons
- [ ] Disabled buttons are focusable but not clickable
- [ ] Tooltip is announced when disabled button receives focus
- [ ] Can use Enter/Space to activate enabled buttons
- [ ] Enter/Space does nothing on disabled buttons
- [ ] Focus indicators are visible on all elements
- [ ] No keyboard traps exist

### Screen Reader Testing

Test with:
- **NVDA** (Windows)
- **JAWS** (Windows)
- **VoiceOver** (macOS)

Verify:
- [ ] Field validation states are announced
- [ ] Error messages are read when field receives focus
- [ ] Success messages are announced
- [ ] Navigation blocking is explained
- [ ] Tooltip content is read when button receives focus
- [ ] All announcements are clear and helpful

### Automated Testing

Run axe-core accessibility tests:
```bash
npm run test:a11y
```

Verify:
- [ ] No keyboard navigation violations
- [ ] All interactive elements are keyboard accessible
- [ ] Focus order is logical
- [ ] ARIA attributes are correct

## Common Issues and Solutions

### Issue: Tooltip not announced on button focus

**Solution:** Ensure button has `aria-describedby` pointing to tooltip ID.

### Issue: Error message not read when field receives focus

**Solution:** Ensure field has `aria-describedby` pointing to error message ID.

### Issue: Validation state changes not announced

**Solution:** Ensure ValidationAnnouncer component is rendered and has `aria-live="polite"`.

### Issue: Button is not focusable when disabled

**Solution:** This is correct behavior. Disabled buttons should be focusable but not clickable. Use `aria-disabled="true"` instead of `disabled` if you need the button to be focusable.

## Best Practices

1. **Always provide focus indicators**: Ensure all interactive elements have visible focus indicators.

2. **Use semantic HTML**: Use `<button>` for buttons, `<input>` for fields, etc.

3. **Provide clear labels**: All fields should have associated `<label>` elements.

4. **Use ARIA appropriately**: Only use ARIA when semantic HTML is insufficient.

5. **Test with real users**: Test with actual keyboard users and screen reader users.

6. **Maintain logical tab order**: Ensure tab order follows visual layout.

7. **Avoid keyboard traps**: Users should always be able to navigate away from any element.

8. **Provide skip links**: Consider adding skip links for long forms.

## Resources

- [WCAG 2.1 Keyboard Accessible Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/keyboard-accessible)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
