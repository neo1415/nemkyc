# CAC Admin Document Viewing - Implementation Complete

## Summary
Successfully implemented CAC document viewing functionality for admins in the Identity List Detail page. Admins can now view all CAC documents uploaded by customers during verification.

## Changes Made

### 1. Firestore Index Added
**File**: `firestore.indexes.json`

Added composite index for the `cac-document-metadata` collection:
```json
{
  "collectionGroup": "cac-document-metadata",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "identityRecordId", "order": "ASCENDING" },
    { "fieldPath": "isCurrent", "order": "ASCENDING" },
    { "fieldPath": "uploadedAt", "order": "DESCENDING" }
  ]
}
```

**Status**: ✅ Deployed successfully using `firebase deploy --only firestore:indexes`

**Note**: The index may take a few minutes to build. Once built, the query will work without errors.

### 2. Admin UI Implementation
**File**: `src/pages/admin/IdentityListDetail.tsx`

#### Added Imports
- `CACDocumentPreview` component
- `useDocumentPreview` hook
- `getDocumentsByIdentityRecord` service function
- `FileText` icon from lucide-react
- `CloseIcon` from Material-UI

#### Added State Management
```typescript
const { previewDocument, previewOpen, previewOwnerId, openPreview, closePreview } = useDocumentPreview();
const [cacDocumentsDialogOpen, setCacDocumentsDialogOpen] = useState(false);
const [selectedEntryDocuments, setSelectedEntryDocuments] = useState<CACDocumentMetadata[]>([]);
const [selectedEntryId, setSelectedEntryId] = useState<string>('');
const [loadingDocuments, setLoadingDocuments] = useState(false);
```

#### Added "CAC Documents" Column
New column in the DataGrid showing:
- "View Docs" button for verified/failed CAC entries
- "N/A" for non-CAC verification types
- "Not uploaded" for pending entries

#### Added Document Viewing Handler
```typescript
const handleViewCACDocuments = async (entryId: string) => {
  // Fetches documents from Firestore
  // Opens dialog with document list
  // Handles loading and error states
}
```

#### Added CAC Documents Dialog
Features:
- Lists all 3 uploaded documents (Certificate of Incorporation, Particulars of Directors, Share Allotment)
- Shows document metadata (filename, size, upload timestamp)
- Preview button for each document
- Loading state while fetching documents
- Empty state when no documents exist

#### Integrated CACDocumentPreview Component
Reused existing component for viewing PDFs and images with:
- Full-screen preview
- Download functionality
- Zoom controls
- Navigation between documents

## Testing

### Before Testing
Wait 2-5 minutes after deployment for the Firestore index to build.

### Test Steps
1. Navigate to Admin → Identity Lists
2. Select a list with CAC verification entries
3. Find an entry with status "verified" or "verification_failed" and verificationType "CAC"
4. Click the "View Docs" button in the "CAC Documents" column
5. Verify the dialog opens showing all uploaded documents
6. Click "Preview" on any document to view it
7. Verify the preview opens correctly with download option

### Expected Results
- ✅ "View Docs" button appears for CAC entries that have been verified/failed
- ✅ Dialog opens showing list of uploaded documents
- ✅ Document metadata displays correctly (name, size, timestamp)
- ✅ Preview button opens document in full-screen viewer
- ✅ Download button works in preview
- ✅ No Firestore index errors in console

## Files Modified
1. `firestore.indexes.json` - Added composite index
2. `src/pages/admin/IdentityListDetail.tsx` - Added document viewing UI

## Files Referenced (No Changes)
1. `src/components/identity/CACDocumentPreview.tsx` - Existing preview component
2. `src/services/cacMetadataService.ts` - Existing service with `getDocumentsByIdentityRecord()`

## Deployment Status
- ✅ Firestore index deployed
- ✅ Code changes complete
- ⏳ Index building (may take 2-5 minutes)

## Next Steps
1. Wait for Firestore index to finish building
2. Test the "View Docs" functionality
3. Verify no console errors
4. Confirm documents display correctly

## Issue Resolution
**Original Issue**: Documents were being uploaded successfully by customers, but admins had no way to view them in the UI.

**Root Cause**: 
1. Missing Firestore composite index for the query
2. No UI component to display uploaded documents

**Solution**: 
1. Added required Firestore index
2. Implemented "CAC Documents" column with "View Docs" button
3. Created dialog to list and preview documents
4. Reused existing CACDocumentPreview component

**Status**: ✅ COMPLETE - Ready for testing once index builds
