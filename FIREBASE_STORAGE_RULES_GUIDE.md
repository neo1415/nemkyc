# Firebase Storage Rules Implementation Guide

## Overview
Your new Firebase Storage rules are designed to work seamlessly with your existing authentication flow where users sign in with Firebase before uploading files.

---

## Storage Structure

```
your-bucket/
├── kyc-documents/
│   └── {userId}/
│       ├── passport.jpg
│       ├── drivers-license.pdf
│       └── utility-bill.jpg
├── cdd-documents/
│   └── {userId}/
│       └── corporate-registration.pdf
├── claims-documents/
│   └── {userId}/
│       ├── accident-photo.jpg
│       └── police-report.pdf
├── documents/
│   └── {userId}/
│       └── other-files.pdf
├── admin-uploads/
│   └── templates.pdf
└── public/
    └── logo.png
```

---

## Key Features

### ✅ Security
- **User isolation**: Each user can only upload to their own folder (`{userId}`)
- **File type validation**: Only images, PDFs, and Word docs allowed
- **Size limits**: 5MB maximum per file
- **Role-based access**: Admins/compliance can access all files

### ✅ Permissions

| Action | User (Owner) | Admin | Compliance | Claims |
|--------|-------------|-------|------------|--------|
| Upload own files | ✅ | ✅ | ✅ | ✅ |
| Read own files | ✅ | ✅ | ✅ | ✅ |
| Read others' files | ❌ | ✅ | ✅ | ✅* |
| Update files | ❌ | ✅ | ❌ | ❌ |
| Delete own files | ✅ | ✅ | ❌ | ❌ |
| Delete others' files | ❌ | ✅ | ❌ | ❌ |

*Claims can only read claims-documents

---

## Implementation

### 1. Update Your Upload Functions

```typescript
// src/utils/fileUpload.ts

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../firebase/config';

export type DocumentType = 'kyc' | 'cdd' | 'claims' | 'general';

/**
 * Upload file to Firebase Storage with proper path structure
 */
export const uploadDocument = async (
  file: File,
  documentType: DocumentType = 'general'
): Promise<string> => {
  // Ensure user is authenticated
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to upload files');
  }

  // Validate file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.');
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }

  // Determine storage path based on document type
  const folderMap = {
    kyc: 'kyc-documents',
    cdd: 'cdd-documents',
    claims: 'claims-documents',
    general: 'documents'
  };

  const folder = folderMap[documentType];
  
  // Create unique filename to prevent overwrites
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${sanitizedFileName}`;
  
  // Create storage reference: folder/userId/fileName
  const storageRef = ref(storage, `${folder}/${user.uid}/${fileName}`);

  try {
    // Upload file
    console.log(`📤 Uploading ${file.name} to ${folder}/${user.uid}/`);
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ Upload successful:', downloadURL);
    
    return downloadURL;
  } catch (error: any) {
    console.error('❌ Upload failed:', error);
    
    // User-friendly error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to upload this file. Please sign in and try again.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was cancelled');
    } else if (error.code === 'storage/unknown') {
      throw new Error('An error occurred during upload. Please try again.');
    }
    
    throw error;
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleDocuments = async (
  files: File[],
  documentType: DocumentType = 'general'
): Promise<string[]> => {
  const uploadPromises = files.map(file => uploadDocument(file, documentType));
  return Promise.all(uploadPromises);
};

/**
 * Delete a file (only works for own files or if admin)
 */
export const deleteDocument = async (fileUrl: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to delete files');
  }

  try {
    // Extract path from URL
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
    if (!pathMatch) throw new Error('Invalid file URL');
    
    const filePath = decodeURIComponent(pathMatch[1]);
    const fileRef = ref(storage, filePath);
    
    // Firebase Storage rules will handle permission check
    await deleteObject(fileRef);
    console.log('✅ File deleted:', filePath);
  } catch (error: any) {
    console.error('❌ Delete failed:', error);
    
    if (error.code === 'storage/unauthorized') {
      throw new Error('You do not have permission to delete this file.');
    }
    
    throw error;
  }
};
```

### 2. Update Your Form Components

```typescript
// In your KYC form component
import { uploadDocument } from '../utils/fileUpload';

const handleFileUpload = async (file: File) => {
  try {
    setUploading(true);
    
    // Upload to kyc-documents folder
    const url = await uploadDocument(file, 'kyc');
    
    // Update form state with URL
    setValue('identification', url);
    
    toast.success('File uploaded successfully');
  } catch (error: any) {
    toast.error(error.message || 'Upload failed');
  } finally {
    setUploading(false);
  }
};
```

### 3. Update Claims Forms

```typescript
// In your claims form component
const handleClaimFileUpload = async (file: File) => {
  try {
    setUploading(true);
    
    // Upload to claims-documents folder
    const url = await uploadDocument(file, 'claims');
    
    setValue('accidentPhoto', url);
    
    toast.success('File uploaded successfully');
  } catch (error: any) {
    toast.error(error.message || 'Upload failed');
  } finally {
    setUploading(false);
  }
};
```

---

## Deployment Steps

### 1. Deploy Storage Rules

```bash
# Deploy only storage rules
firebase deploy --only storage

# Or deploy everything
firebase deploy
```

### 2. Test the Rules

```typescript
// Test script (run in browser console on your app)
const testStorageRules = async () => {
  const { auth, storage } = window; // Assuming Firebase is globally available
  
  // Test 1: Upload to own folder (should succeed)
  const user = auth.currentUser;
  if (!user) {
    console.error('Please sign in first');
    return;
  }
  
  const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
  const storageRef = ref(storage, `kyc-documents/${user.uid}/test.txt`);
  
  try {
    await uploadBytes(storageRef, testFile);
    console.log('✅ Test 1 passed: Can upload to own folder');
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }
  
  // Test 2: Upload to another user's folder (should fail)
  const otherUserRef = ref(storage, `kyc-documents/other-user-id/test.txt`);
  
  try {
    await uploadBytes(otherUserRef, testFile);
    console.error('❌ Test 2 failed: Should not be able to upload to other user folder');
  } catch (error) {
    console.log('✅ Test 2 passed: Cannot upload to other user folder');
  }
};
```

### 3. Monitor Uploads

Check Firebase Console → Storage → Files to verify:
- Files are being uploaded to correct paths
- File names are properly sanitized
- No unauthorized uploads

---

## Troubleshooting

### Error: "storage/unauthorized"

**Cause**: User doesn't have permission or rules haven't been deployed

**Fix**:
1. Ensure user is signed in: `auth.currentUser !== null`
2. Check storage rules are deployed: `firebase deploy --only storage`
3. Verify user is uploading to their own folder: `{userId}` matches `auth.currentUser.uid`

### Error: "storage/invalid-argument"

**Cause**: Invalid file path or file object

**Fix**:
1. Ensure file path follows pattern: `folder/{userId}/filename`
2. Verify file is a valid File object
3. Check file name doesn't contain invalid characters

### Files Upload But Can't Be Read

**Cause**: CORS configuration or download URL issues

**Fix**:
1. Ensure you're using `getDownloadURL()` to get public URL
2. Check Firebase Storage CORS settings
3. Verify read permissions in storage rules

---

## Best Practices

### ✅ DO:
- Always check `auth.currentUser` before uploading
- Use descriptive file names with timestamps
- Validate file type and size on frontend AND backend
- Use appropriate document type ('kyc', 'cdd', 'claims')
- Show upload progress to users
- Handle errors gracefully with user-friendly messages

### ❌ DON'T:
- Don't upload files before user authentication
- Don't use user-provided file names directly (sanitize them)
- Don't skip file validation
- Don't upload files larger than 5MB
- Don't hardcode user IDs in paths

---

## Migration from Current Setup

If you're currently uploading to different paths:

```typescript
// OLD (if you were using different paths)
const oldRef = ref(storage, `uploads/${file.name}`);

// NEW (with proper structure)
const newRef = ref(storage, `kyc-documents/${user.uid}/${sanitizedFileName}`);
```

You don't need to migrate existing files unless you want to. The new rules will apply to new uploads only.

---

## Summary

Your Firebase Storage is now secured with:
- ✅ User-based folder isolation
- ✅ File type and size validation
- ✅ Role-based access control
- ✅ Proper read/write permissions
- ✅ Admin override capabilities

All uploads require authentication, which aligns with your current flow where users sign in before submitting forms.
