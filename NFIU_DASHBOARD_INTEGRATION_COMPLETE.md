# NFIU Dashboard Integration - Complete Implementation

## Summary
Fixed NFIU dashboard table visibility by implementing dual-collection querying to show both old (formSubmissions) and new (individual-nfiu-form, corporate-nfiu-form) NFIU submissions.

## Problem
- Old NFIU submissions were stored in `formSubmissions` collection before server routing was fixed
- New NFIU submissions go to dedicated collections (`individual-nfiu-form`, `corporate-nfiu-form`)
- NFIU tables only queried their specific collections, missing old data
- FormViewer couldn't properly display old NFIU forms from formSubmissions

## Solution Implemented

### 1. AdminIndividualNFIUTable.tsx
**Changes:**
- Updated `fetchNFIUForms()` to query BOTH `individual-nfiu-form` AND `formSubmissions` collections
- Added filtering logic to identify Individual NFIU forms in formSubmissions based on:
  - formType/formVariant fields
  - Presence of individual-specific fields (firstName, lastName, NIN)
- Added `_sourceCollection` tracking to route to correct collection
- Updated view action to use `_sourceCollection` for proper routing
- Updated delete handler to try both collections

**Key Features:**
- Combines data from both collections and sorts by submittedAt
- Filters formSubmissions to only show Individual NFIU forms
- Maintains backward compatibility with old data structure

### 2. AdminCorporateNFIUTable.tsx
**Changes:**
- Updated `fetchNFIUForms()` to query BOTH `corporate-nfiu-form` AND `formSubmissions` collections
- Added filtering logic to identify Corporate NFIU forms in formSubmissions based on:
  - formType/formVariant fields
  - Presence of corporate-specific fields (incorporationNumber, insured)
- Added `_sourceCollection` tracking to route to correct collection
- Updated view action to use `_sourceCollection` for proper routing
- Updated delete handler to try both collections

**Key Features:**
- Combines data from both collections and sorts by submittedAt
- Filters formSubmissions to only show Corporate NFIU forms
- Handles directors array properly (both flat and array formats)

### 3. FormViewer.tsx
**Changes:**
- Updated `getFormMappingKey()` to handle `formSubmissions` collection
- Added detection logic to identify NFIU forms from formSubmissions:
  - Checks formType and formVariant fields
  - Falls back to field-based detection (incorporationNumber vs firstName)
  - Maps to correct form mapping (corporate-nfiu-form or individual-nfiu-form)

**Key Features:**
- Automatically detects form type from legacy formSubmissions
- Uses existing NFIU form mappings for proper field display
- Maintains consistency with dedicated collection viewing

### 4. formMappings.ts
**Changes:**
- Added 'time' to FormField type definition for completeness

## Data Flow

### Viewing NFIU Forms
1. User navigates to Individual/Corporate NFIU table
2. Table queries both dedicated collection AND formSubmissions
3. Filters formSubmissions to only include relevant NFIU forms
4. Combines and sorts all forms by submittedAt
5. Tracks source collection for each form

### Clicking View
1. User clicks view on a form
2. Table uses `_sourceCollection` to route to correct collection
3. FormViewer receives collection parameter (e.g., "formSubmissions")
4. FormViewer detects form type and maps to correct form mapping
5. Displays form using NFIU form field configuration

### Deleting Forms
1. User clicks delete on a form
2. Handler tries to delete from dedicated collection first
3. If not found (404), tries formSubmissions collection
4. Removes from UI state on success

## CSV Export
- CSV export already includes all fields from both collections
- No changes needed - works with combined data

## PDF Generation
- PDF generation uses form mappings
- Works automatically with formSubmissions detection

## Directors Array Handling
- FormViewer already handles both flat and array director formats
- Backward compatibility maintained for old submissions
- New submissions use directors array format

## Testing Checklist
- [x] Individual NFIU table shows old formSubmissions data
- [x] Corporate NFIU table shows old formSubmissions data
- [x] View action routes to correct collection
- [x] FormViewer displays old NFIU forms correctly
- [x] Delete works for both collections
- [x] CSV export includes all data
- [x] Directors array displays properly
- [x] No TypeScript errors

## Files Modified
1. `src/pages/admin/AdminIndividualNFIUTable.tsx` - Dual collection querying
2. `src/pages/admin/AdminCorporateNFIUTable.tsx` - Dual collection querying
3. `src/pages/admin/FormViewer.tsx` - formSubmissions detection
4. `src/config/formMappings.ts` - Added 'time' type

## Migration Notes
- No data migration needed
- Old data remains in formSubmissions
- New data goes to dedicated collections
- Both are visible in tables seamlessly

## Future Considerations
- Optional: Migrate old formSubmissions to dedicated collections
- Optional: Add collection indicator in table UI
- Current solution is production-ready without migration
