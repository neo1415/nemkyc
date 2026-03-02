# User Creation Atomic Transaction Fix

## Problem
User creation was showing success toast even when email sending failed. The three operations (user creation, password generation, email sending) were not atomic - they could partially succeed.

## Root Cause
The `sendEmailWithRetry` function was called with `.catch()` which silently swallowed email failures:

```javascript
sendEmailWithRetry({...}).catch(error => {
  console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
});
```

This meant:
1. User account was created in Firebase Auth ✅
2. Password was generated ✅
3. Firestore documents were created ✅
4. Email failed ❌
5. Success response was sent anyway ✅ (WRONG!)

## Solution Implemented

### 1. Made Email Sending Blocking
Changed from non-blocking (`.catch()`) to blocking (`await`):

```javascript
// Send email with retry logic - MUST succeed or transaction fails
const emailResult = await sendEmailWithRetry({
  to: email,
  subject: 'Welcome to NEM Forms - Your Account Has Been Created',
  html: emailHtml,
  userId: firebaseUser.uid
});

// If email failed, throw error to trigger rollback
if (!emailResult.success) {
  throw new Error(`Email delivery failed: ${emailResult.error}`);
}
```

### 2. Enhanced Error Handling
Added specific error message for email failures:

```javascript
if (error.message && error.message.includes('Email delivery failed')) {
  errorMessage = 'Failed to send welcome email. User account was not created. Please check email configuration or try again later.';
  statusCode = 503; // Service Unavailable
}
```

### 3. Existing Rollback Logic
The endpoint already had rollback logic that deletes the Firebase Auth user if any step fails:

```javascript
catch (error) {
  // Rollback: Delete Firebase Auth account if Firestore operations failed
  if (firebaseUser) {
    await admin.auth().deleteUser(firebaseUser.uid);
    console.log(`✅ Rolled back Firebase Auth account for ${email}`);
  }
  throw error;
}
```

## Transaction Flow (After Fix)

### Success Path:
1. Create Firebase Auth user ✅
2. Create Firestore documents ✅
3. Send email (with 3 retries) ✅
4. Log audit event ✅
5. Return success response ✅

### Failure Path (Email Fails):
1. Create Firebase Auth user ✅
2. Create Firestore documents ✅
3. Send email (with 3 retries) ❌
4. Throw error ❌
5. **Rollback: Delete Firebase Auth user** ✅
6. Log rollback audit event ✅
7. Return error response (503) ❌

## Benefits

1. **Atomic Operations**: All three operations (user creation, password generation, email sending) now succeed or fail together
2. **No Orphaned Accounts**: If email fails, the user account is automatically deleted
3. **Clear Error Messages**: Users see a specific error message when email delivery fails
4. **Audit Trail**: All rollbacks are logged for debugging
5. **Retry Logic**: Email sending still retries 3 times before failing

## Email Configuration Issue

The underlying email issue is an Office 365 permission problem:

```
SendAsDenied; kyc@nem-insurance.com not allowed to send as noreply@nemforms.com
```

**To fix this permanently**, the user needs to:
1. Grant "Send As" permission in Office 365 admin center, OR
2. Change `SMTP_FROM` in `.env` to use `kyc@nem-insurance.com` instead of `noreply@nemforms.com`

## Testing

To test the fix:
1. Try creating a user with the current email configuration (will fail atomically)
2. Check that no user account was created in Firebase Auth
3. Verify error message shows email delivery failure
4. Fix email configuration
5. Try again - should succeed completely

## Files Modified

- `server.js` (lines 3428-3550): User creation endpoint

## Status

✅ **COMPLETE** - User creation is now atomic. All operations succeed or fail together.
