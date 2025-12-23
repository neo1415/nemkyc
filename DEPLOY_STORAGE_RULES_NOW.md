# URGENT: Deploy Storage Rules

## The Issue
The storage rules file has been updated to allow unauthenticated uploads for Individual KYC, but **Firebase is still using the old rules**.

## Solution
Deploy the storage rules immediately:

```bash
firebase deploy --only storage
```

## What Changed

### Individual KYC (NEW - Allows Unauthenticated Uploads)
```javascript
match /individual-kyc/{folder}/{fileName} {
  allow create: if isValidFileType() && isValidFileSize();  // ✅ No auth required
  allow read: if request.auth != null || isAdminOrCompliance();
  allow update: if false;
  allow delete: if isAdminOrSuperAdmin();
}
```

### All Other Forms (Still Require Authentication)
```javascript
match /corporate-kyc/{folder}/{fileName} {
  allow create: if request.auth != null && isValidFileType() && isValidFileSize();  // 🔒 Auth required
  // ...
}
```

## After Deployment

1. Test Individual KYC form submission
2. Files should upload successfully (no 403 error)
3. File URLs should be saved to Firestore
4. Unauthenticated users should NOT be able to download files

## If Corporate KYC is Also Failing

If Corporate KYC uploads are also failing with 403 errors, you'll need to update those rules too:

```javascript
match /corporate-kyc/{folder}/{fileName} {
  allow create: if isValidFileType() && isValidFileSize();  // Remove auth requirement
  allow read: if request.auth != null || isAdminOrCompliance();
  allow update: if false;
  allow delete: if isAdminOrSuperAdmin();
}
```

## Deploy Command

```bash
# From your project root
firebase deploy --only storage

# Or deploy everything
firebase deploy
```

## Verify Deployment

After deploying, check the Firebase Console:
1. Go to Firebase Console → Storage → Rules
2. Verify the rules show the updated version
3. Test the Individual KYC form again
