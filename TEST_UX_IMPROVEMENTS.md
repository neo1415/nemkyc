# Test UX Improvements - Quick Guide

## Reset & Start
```javascript
window.resetBrokerTour()
```
Refresh page (F5)

## What to Check

### 1. Overlay is Light (Not Dark)
- ✅ Should see content clearly
- ✅ Overlay should be barely visible
- ❌ Should NOT be dark/hard to see

### 2. Separate "Create List" Step
**Step 1:** Download template → advances
**Step 2:** Upload file → advances to step 3
**Step 3:** "Create List" button highlighted → click it → advances
**Step 4:** Select entries page

### 3. Popover Position on List Page
- ✅ Popover should be on LEFT side of checkboxes
- ✅ Should NOT be in middle of screen
- ✅ Should be near the checkbox column

### 4. Can Scroll on List Page
- ✅ Can scroll the table
- ✅ Can see all content
- ✅ No blocking

## Expected Flow

```
Step 0: Download Template
  ↓ (auto-advance)
Step 1: Upload File
  ↓ (auto-advance after upload)
Step 2: Create List ← NEW STEP!
  ↓ (auto-advance after click)
Step 3: Select Entries ← Popover on LEFT
  ↓ (auto-advance after selection)
Step 4: Send Requests
  ↓ (auto-advance after send)
Step 5: Done!
```

## Key Improvements

1. **Light overlay** - Can see everything
2. **Separate steps** - Upload ≠ Create List
3. **Better positioning** - Popover by checkboxes
4. **Full scrolling** - Works everywhere

## If Issues

### Overlay still dark?
- Hard refresh: Ctrl+Shift+R
- Check CSS loaded

### Popover in middle?
- Check tour step config
- Should be `side: 'left', align: 'start'`

### Can't scroll?
- Check console for errors
- Verify CSS applied

## Success Criteria

✅ Overlay is light (barely visible)
✅ "Create List" is separate step
✅ Popover positioned by checkboxes
✅ Can scroll everywhere
✅ All interactions work

If all pass → DONE! 🎉
