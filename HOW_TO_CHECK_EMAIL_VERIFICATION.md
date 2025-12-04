# How to Check Email Verification Status

## Quick Reference

### Method 1: Check in Browser Console (Easiest)

When you try to login, look at the browser console (F12 → Console tab). You'll see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 FRONTEND: Token Exchange Response
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Success: true/false
📧 Email Verification Required: true/false  ← THIS TELLS YOU!
🔐 MFA Required: false
📱 MFA Enrollment Required: false
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If Email Verification Required = true**: Email is NOT verified ❌
**If Email Verification Required = false**: Email IS verified ✅

---

### Method 2: Check in Server Console (Backend)

Look at your server logs when someone tries to login:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL VERIFICATION STATUS CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 User Email: user@example.com
🔑 User UID: abc123...
✉️  Email Verified: ✅ YES  ← THIS TELLS YOU!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**If Email Verified = ✅ YES**: Email is verified
**If Email Verified = ❌ NO**: Email is NOT verified (login will be blocked)

---

### Method 3: Use the Check Script (Most Detailed)

Run this command in your terminal:

```bash
node scripts/check-email-verification.js your-email@example.com
```

**Example Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL VERIFICATION STATUS CHECKER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 User Information:
   Email: user@example.com
   UID: abc123xyz
   Display Name: John Doe
   Created: 11/25/2025, 3:45:00 PM
   Last Sign In: 11/25/2025, 4:30:00 PM

✉️  Email Verification Status: ✅ VERIFIED

✅ This user can login successfully!

🔐 MFA Status: ❌ NOT ENROLLED

👔 User Role: default
   Name: John Doe

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### Method 4: Check in Firebase Console (Manual)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Authentication** in the left menu
4. Click **Users** tab
5. Find the user by email
6. Look at the **Email verified** column

**If there's a checkmark ✓**: Email is verified
**If it's empty**: Email is NOT verified

---

## What Happens When Email is NOT Verified?

### User Experience:
1. User tries to login
2. Sees this modal:

```
┌─────────────────────────────────────────┐
│  📧 Email Verification Required         │
├─────────────────────────────────────────┤
│                                         │
│  Please verify your email address      │
│  before logging in.                     │
│                                         │
│  user@example.com                       │
│                                         │
│  ℹ️  Check your email                   │
│  • Look for email from NEM Insurance    │
│  • Check spam/junk folder               │
│  • Click the verification link          │
│  • Return here and click "I've          │
│    Verified My Email"                   │
│                                         │
│  [Resend Email] [I've Verified My Email]│
└─────────────────────────────────────────┘
```

### Backend Logs:
```
🚫 LOGIN BLOCKED: Email not verified for user: user@example.com
💡 User needs to check their email and click the verification link
```

---

## How to Verify an Email

### For Users:
1. **Check your email inbox** (the one you signed up with)
2. **Look for email from**: `noreply@[your-project].firebaseapp.com`
3. **Subject**: "Verify your email for [App Name]"
4. **Click the verification link** in the email
5. **Return to login page** and try logging in again

**If you don't see the email:**
- Check your **spam/junk folder**
- Click **"Resend Email"** button in the verification modal
- Wait a few minutes (emails can take 1-5 minutes to arrive)

### For Admins (Manual Verification):
If a user needs immediate access, you can manually verify them:

1. Go to Firebase Console → Authentication → Users
2. Find the user
3. Click the **"..."** menu → **Edit user**
4. Check the **"Email verified"** checkbox
5. Click **Save**

---

## Testing Your Current Email

### Quick Test:
1. Open your app
2. Try to login with your email
3. Open browser console (F12)
4. Look for the verification status in the logs

### Or run the script:
```bash
node scripts/check-email-verification.js your-test-email@example.com
```

---

## Common Scenarios

### Scenario 1: New User Just Signed Up
- ✉️ Verification email sent automatically
- ❌ Email NOT verified yet
- 🚫 Cannot login until they click the link

### Scenario 2: User Clicked Verification Link
- ✅ Email IS verified
- ✅ Can login successfully
- No modal shown

### Scenario 3: Existing User (Before This Feature)
- ❓ Might not be verified (depends on when they signed up)
- 🔍 Check using one of the methods above
- 💡 If not verified, they'll see the modal on next login

### Scenario 4: Google Sign-In Users
- ✅ Usually pre-verified by Google
- ✅ Can login successfully
- No verification needed

---

## Troubleshooting

### "I clicked the link but still can't login"
1. Click **"I've Verified My Email"** button in the modal
2. Or logout and login again
3. Check the browser console for verification status

### "I never received the verification email"
1. Check spam/junk folder
2. Click **"Resend Email"** button
3. Make sure you're checking the correct email address
4. Wait 5 minutes and check again

### "The verification link expired"
1. Click **"Resend Email"** to get a new link
2. New links are valid for 24 hours

### "I need to test but my email is already verified"
You can create a new test account:
```bash
# In Firebase Console → Authentication → Users
# Click "Add user" and create a test account
# It will NOT be verified by default
```

---

## Summary

**Easiest way to check**: Look at browser console when logging in
- `Email Verification Required: true` = NOT verified ❌
- `Email Verification Required: false` = Verified ✅

**Most detailed way**: Run the check script
```bash
node scripts/check-email-verification.js your-email@example.com
```

**For your current test email**: Just try to login and check the console!
