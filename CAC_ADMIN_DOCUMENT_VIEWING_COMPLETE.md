# CAC Admin Document Viewing - Implementation Complete

## Summary

Successfully implemented CAC document viewing functionality for admins in the Identity List Detail page. Admins can now view and preview the 3 CAC documents (Certificate of Incorporation, Particulars of Directors, Share Allotment) that customers upload during verification.

## Changes Made

### 1. Identity List Detail Page (`src/pages/admin/IdentityListDetail.tsx`)

#### Added Imports
- `FileText` icon from lucide-react
- `CACDocumentPreview` component and `useDocumentPreview` hook
- `getDocumentsByIdentityRecord` and `getDocumentStatusSummary` from cacMetadataService
- `CACDocumentMetadata` and `DocumentStatusSummary` types
- `Close` icon from Material-UI

#### Added State Management
```typescript
// CAC Document preview state
const { previewDocument, previewOpen, previewOwnerId, openPreview, closePreview } = useDocumentPreview();
const [cacDocumentsDialogOpen, setCacDocumentsDialogOpen] = useState(false);
const [selectedEntryDocuments, setSelectedEntryDocuments] = useState<CACDocumentMetadata[]>([]);
const [selectedEntryId, setSelectedEntryId] = useState<string>('');
const [loadingDocuments, setLoadingDocuments] = useState(false);
```

#### Added Handler Function
```typescript
const handleViewCACDocuments = async (entryId: string) => {
  // Fetches documents from Firestore for the selected entry
  // Opens the CAC Documents dialog
}
```

#### Added Data Grid Column
New "CAC Documents" column that:
- Shows "N/A" for NIN verification types
- Shows "View Docs" button for CAC entries that have been verified or failed verification
- Shows "Not uploaded" for entries where documents haven't been uploaded yet
- Clicking "View Docs" opens a dialog showing all 3 uploaded documents

#### Added Dialogs
1. **CAC Documents Dialog**: Lists all 3 uploaded documents with:
   - Document type (formatted name)
   - Filename and file size
   - Upload timestamp
   - Preview button for each document

2. **CAC Document Preview Component**: Integrated existing preview component that:
   - Shows PDF documents in an iframe
   - Shows images with zoom controls
   - Provides download functionality
   - Handles encrypted documents
   - Caches decrypted documents for session

## Features

### For Admins
1. **Document Status Visibility**: See at a glance which entries have uploaded CAC documents
2. **Document List View**: View all 3 required CAC documents in a single dialog
3. **Document Preview**: Click to preview any document (PDF or image)
4. **Document Download**: Download documents for offline review
5. **Metadata Display**: See filename, file size, and upload timestamp for each document

### Security
- Only authorized admins can view documents (enforced by `shouldShowDocumentActions`)
- Documents are decrypted on-the-fly using the encryption service
- Decrypted documents are cached in session for performance
- All document access is logged via the audit system

### Performance
- Lazy loading: Documents are only fetched when the "View Docs" button is clicked
- Session caching: Decrypted documents are cached to avoid re-decryption
- Optimized queries: Uses Firestore indexes for fast document retrieval

## User Flow

1. Admin navigates to Identity List Detail page
2. Admin sees "CAC Documents" column in the data grid
3. For CAC entries that have been verified/failed:
   - Admin clicks "View Docs" button
   - Dialog opens showing all 3 uploaded documents
4. Admin clicks "Preview" on any document:
   - Preview dialog opens
   - Document is decrypted and displayed
   - Admin can zoom (images) or download the document
5. Admin closes dialogs when done

## Technical Details

### Document Fetching
- Uses `getDocumentsByIdentityRecord(entryId)` from cacMetadataService
- Queries Firestore collection `cac-document-metadata`
- Filters for current versions only (`isCurrent: true`)
- Orders by upload date (most recent first)

### Document Types
The system expects 3 document types:
1. `certificate_of_incorporation` - Certificate of Incorporation
2. `particulars_of_directors` - Particulars of Directors
3. `share_allotment` - Share Allotment (Status Update)

### Integration Points
- **Storage**: Documents stored in Firebase Storage at `cac-documents/{entryId}/{documentType}_{timestamp}`
- **Metadata**: Document metadata stored in Firestore collection `cac-document-metadata`
- **Encryption**: Documents encrypted using AES-256-GCM before storage
- **Access Control**: Admin-only access enforced via `cacAccessControl` service

## Testing Recommendations

1. **Verify Document Display**:
   - Upload CAC documents via customer verification page
   - Check that "View Docs" button appears in admin list
   - Verify all 3 documents are listed in the dialog

2. **Test Preview Functionality**:
   - Preview PDF documents (should show in iframe)
   - Preview image documents (should show with zoom controls)
   - Test download functionality

3. **Test Edge Cases**:
   - Entry with no documents uploaded (should show "Not uploaded")
   - Entry with only some documents uploaded (should show available documents)
   - NIN verification entries (should show "N/A")

4. **Test Performance**:
   - Large documents (5-10MB) should load within 3 seconds
   - Subsequent previews of same document should be instant (cached)

## Next Steps

The implementation is complete and ready for testing. The admin can now:
1. ✅ See which entries have uploaded CAC documents
2. ✅ View the list of uploaded documents
3. ✅ Preview each document (PDF or image)
4. ✅ Download documents for offline review

## Related Files

- `src/pages/admin/IdentityListDetail.tsx` - Main implementation
- `src/components/identity/CACDocumentPreview.tsx` - Preview component
- `src/services/cacMetadataService.ts` - Document metadata queries
- `src/services/cacStorageService.ts` - Document storage/retrieval
- `src/services/cacEncryptionService.ts` - Document encryption/decryption
- `src/services/cacAccessControl.ts` - Access control checks
