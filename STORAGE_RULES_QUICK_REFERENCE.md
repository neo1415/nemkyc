# Firebase Storage Rules - Quick Reference

## Current Setup

### Upload Flow
1. User selects files → stored in browser memory
2. User submits form → sees summary
3. User authenticates (if needed)
4. **Files upload NOW** (with auth token)
5. Form submits with file URLs

### Security Rules

**All uploads require authentication:**
```javascript
allow create: if request.auth != null && isValidFileType() && isValidFileSize();
```

**File validation:**
- Types: Images (PNG, JPG, JPEG, GIF), PDF, Word docs
- Size: 5MB maximum

**Read access:**
- KYC/CDD: Authenticated users + admins/compliance
- Claims: Authenticated users + claims/admins/compliance

**Update/Delete:**
- Only admins via backend (no client-side modifications)

## Folder Structure

```
/individual-kyc/{timestamp}/{filename}
/corporate-kyc/{timestamp}/{filename}
/motor-claims/{timestamp}/{filename}
/burglary-claims/{timestamp}/{filename}
... etc
```

## Common Issues

### 403 Forbidden Error
**Cause**: User not authenticated when uploading
**Solution**: Already fixed - files now upload AFTER authentication

### File Not Found
**Cause**: Trying to read file without authentication
**Solution**: Ensure user is signed in before accessing file URLs

### File Too Large
**Cause**: File exceeds 5MB limit
**Solution**: Compress file or split into multiple files

## Testing

```bash
# Test upload (should work after auth)
curl -X POST "https://firebasestorage.googleapis.com/v0/b/YOUR_BUCKET/o" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf"

# Test read (should work with auth)
curl "https://firebasestorage.googleapis.com/v0/b/YOUR_BUCKET/o/individual-kyc%2Ftest.pdf?alt=media" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment

```bash
# Deploy storage rules only
firebase deploy --only storage

# Deploy everything
firebase deploy
```

## Security Checklist

- [x] All uploads require authentication
- [x] File type validation enforced
- [x] File size limits enforced
- [x] Read access controlled by authentication
- [x] No client-side updates/deletes
- [x] Proper folder structure
- [x] Admin override capabilities
- [x] Role-based access control

## Need Help?

1. Check Firebase Console → Storage → Rules
2. Check browser console for detailed error messages
3. Verify user is authenticated before upload
4. Check file type and size meet requirements
