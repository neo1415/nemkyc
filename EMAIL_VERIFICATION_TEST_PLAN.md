# Email Verification Testing Plan

## Current Status

✅ **Backend Implementation Complete**
- Email verification check in `/api/exchange-token` endpoint (server.js line ~1940)
- Returns `requireEmailVerification: true` when email not verified
- Blocks login with 403 status
- Logs blocked attempts for security audit

✅ **Frontend Implementation Complete**
- EmailVerificationModal component created
- AuthContext updated with email verification state
- SignIn page integrated with modal
- Resend and check verification functionality

## What We Need to Test

### Test 1: Create Unverified Test User ✅

**Command:**
```bash
node scripts/create-test-unverified-user.js
```

**Expected Output:**
- Creates user with `emailVerified: false`
- Provides test credentials
- Shows instructions for testing

**Status:** Script exists and ready to use

---

### Test 2: Login with Unverified Email 🧪

**Steps:**
1. Use credentials from Test 1
2. Go to login page
3. Enter email and password
4. Click "Sign In"

**Expected Behavior:**
- ✅ Firebase authentication succeeds
- ✅ Token exchange returns `requireEmailVerification: true`
- ✅ EmailVerificationModal appears
- ✅ User cannot access application
- ✅ Browser console shows verification status
- ✅ Server logs show blocked login attempt

**What to Check:**
- [ ] Modal displays with correct email
- [ ] "Resend Email" button visible
- [ ] "I've Verified My Email" button visible
- [ ] Instructions are clear
- [ ] Cannot close modal by clicking outside

---

### Test 3: Resend Verification Email 📧

**Steps:**
1. In EmailVerificationModal, click "Resend Email"
2. Check email inbox (and spam folder)

**Expected Behavior:**
- ✅ Button shows loading state
- ✅ Success toast appears
- ✅ Email received within 1-5 minutes
- ✅ Email contains verification link
- ✅ Green success message appears in modal

**What to Check:**
- [ ] Email arrives in inbox or spam
- [ ] Email is from Firebase (noreply@...)
- [ ] Link is clickable
- [ ] Success feedback shown

---

### Test 4: Verify Email via Link 🔗

**Steps:**
1. Open verification email
2. Click verification link
3. Should see Firebase confirmation page

**Expected Behavior:**
- ✅ Link opens in browser
- ✅ Firebase shows "Email verified" message
- ✅ Email status updated in Firebase Auth

**What to Check:**
- [ ] Link works (not expired)
- [ ] Confirmation page appears
- [ ] No errors shown

---

### Test 5: Check Verification Status ✔️

**Steps:**
1. After clicking email link, return to app
2. Click "I've Verified My Email" button

**Expected Behavior:**
- ✅ Button shows loading state
- ✅ Checks Firebase for verification status
- ✅ Success toast appears
- ✅ Modal closes automatically
- ✅ User can now access application

**What to Check:**
- [ ] Modal closes after verification
- [ ] Can access dashboard/forms
- [ ] No more verification prompts

---

### Test 6: Login After Verification ✅

**Steps:**
1. Logout
2. Login again with same credentials

**Expected Behavior:**
- ✅ Login succeeds immediately
- ✅ No EmailVerificationModal shown
- ✅ Direct access to application
- ✅ Server logs show successful login

**What to Check:**
- [ ] No verification modal
- [ ] Normal login flow
- [ ] Access granted immediately

---

### Test 7: Existing Verified User 👤

**Steps:**
1. Login with your existing account
2. Check browser console

**Expected Behavior:**
- ✅ Login succeeds
- ✅ Console shows `Email Verification Required: false`
- ✅ No modal shown
- ✅ Normal access

**What to Check:**
- [ ] Existing users not affected
- [ ] No disruption to verified accounts

---

## Browser Console Checks

### During Login (Unverified)
Look for:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 FRONTEND: Token Exchange Response
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Success: false
📧 Email Verification Required: true  ← Should be TRUE
🔐 MFA Required: false
📱 MFA Enrollment Required: false
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### During Login (Verified)
Look for:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 FRONTEND: Token Exchange Response
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Success: true
📧 Email Verification Required: false  ← Should be FALSE
🔐 MFA Required: false
📱 MFA Enrollment Required: false
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Server Console Checks

### When Unverified User Tries to Login
Look for:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL VERIFICATION STATUS CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 User Email: test@example.com
🔑 User UID: abc123...
✉️  Email Verified: ❌ NO  ← Should be NO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 LOGIN BLOCKED: Email not verified for user: test@example.com
💡 User needs to check their email and click the verification link
```

### When Verified User Logs In
Look for:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL VERIFICATION STATUS CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 User Email: user@example.com
🔑 User UID: xyz789...
✉️  Email Verified: ✅ YES  ← Should be YES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Quick Verification Script

To check any user's verification status:
```bash
node scripts/check-email-verification.js your-email@example.com
```

---

## Testing Checklist

### Setup
- [ ] Server is running (`npm run server` or `node server.js`)
- [ ] Frontend is running (`npm run dev`)
- [ ] Firebase credentials configured
- [ ] Can access login page

### Test Execution
- [ ] Test 1: Create unverified user ✅
- [ ] Test 2: Login blocked for unverified user 🧪
- [ ] Test 3: Resend email works 📧
- [ ] Test 4: Email link verifies account 🔗
- [ ] Test 5: Check verification button works ✔️
- [ ] Test 6: Login succeeds after verification ✅
- [ ] Test 7: Existing users unaffected 👤

### Verification
- [ ] Browser console shows correct status
- [ ] Server console shows correct logs
- [ ] Modal UI looks good
- [ ] All buttons work
- [ ] Toast notifications appear
- [ ] No errors in console

---

## Common Issues & Solutions

### Issue: "I don't see the modal"
**Check:**
- Browser console for `emailVerificationRequired` status
- Server console for email verification check
- Make sure user is actually unverified

### Issue: "Email not received"
**Solutions:**
- Check spam/junk folder
- Wait 5 minutes
- Click "Resend Email"
- Check Firebase Console → Authentication → Users

### Issue: "Link expired"
**Solution:**
- Click "Resend Email" to get new link
- Links expire after 24 hours

### Issue: "Still showing modal after verification"
**Solution:**
- Click "I've Verified My Email" button
- Or logout and login again
- Check Firebase Console to confirm verification

---

## Success Criteria

✅ **All tests pass when:**
1. Unverified users cannot login
2. Modal appears with clear instructions
3. Resend email works
4. Email verification link works
5. Check verification button works
6. Verified users can login normally
7. Existing users unaffected
8. No console errors
9. All UI elements work correctly
10. Server logs show correct status

---

## Next Steps After Testing

1. **If all tests pass:**
   - ✅ Feature is production ready
   - Document any edge cases found
   - Update user documentation
   - Monitor logs after deployment

2. **If tests fail:**
   - Document the failure
   - Check browser/server console for errors
   - Review implementation
   - Fix issues and retest

---

**Test Date:** _____________
**Tester:** _____________
**Environment:** [ ] Development [ ] Staging [ ] Production
**Overall Result:** [ ] PASS [ ] FAIL

**Notes:**
_________________________________
_________________________________
_________________________________
