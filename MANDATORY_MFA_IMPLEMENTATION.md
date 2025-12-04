# Mandatory MFA for Privileged Roles - Implementation Guide

## Overview

This document describes the mandatory Multi-Factor Authentication (MFA) system for privileged user roles in the NEM Insurance Forms application.

## Privileged Roles

The following roles **MUST** have MFA enabled:
1. **Admin**
2. **Super Admin**
3. **Compliance**
4. **Claims**

Regular users (`user` and `default` roles) are **NOT** required to use MFA.

---

## How It Works

### Step 1: MFA Enrollment (Mandatory on First Login)

When a user with a privileged role logs in for the first time (or if they don't have MFA enrolled):

1. **Backend Check**: Server checks if user has MFA enrolled in Firebase Auth
2. **Enrollment Required**: If not enrolled, returns `requireMFAEnrollment: true`
3. **Frontend Modal**: User sees MFA enrollment modal
4. **User Choice**: User can choose between:
   - **SMS MFA** (Phone number verification)
   - **Email MFA** (Email OTP - if implemented)
5. **Verification**: User enters the OTP code sent to their phone/email
6. **Completion**: MFA enrollment is marked as complete in `loginMetadata`

**User cannot access the application until MFA is enrolled.**

---

### Step 2: MFA Verification (Every 3rd Login)

After MFA is enrolled, the system requires verification every 3rd login:

- **Login 1**: ✅ No MFA required (just enrolled)
- **Login 2**: ✅ No MFA required
- **Login 3**: 🔐 MFA verification required
- **Login 4**: ✅ No MFA required
- **Login 5**: ✅ No MFA required
- **Login 6**: 🔐 MFA verification required
- And so on...

**Formula**: `loginCount % 3 === 0` triggers MFA verification

---

## Backend Implementation

### Location: `server.js` - `/api/exchange-token` endpoint

### Key Changes:

#### 1. Privileged Role Detection
```javascript
const privilegedRoles = ['admin', 'super-admin', 'compliance', 'claims'];
const isPrivilegedRole = privilegedRoles.includes(userData.role);
```

#### 2. Login Metadata Tracking
```javascript
await loginMetaRef.set({
  loginCount: loginCount,
  lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
  email: email,
  role: userData.role,
  mfaEnrollmentCompleted: mfaEnrollmentCompleted  // NEW FIELD
}, { merge: true });
```

#### 3. MFA Enrollment Check
```javascript
// Check if user has MFA enrolled in Firebase Auth
let mfaEnrolled = false;
let enrolledFactors = [];
try {
  const userRecord = await admin.auth().getUser(uid);
  enrolledFactors = userRecord.multiFactor?.enrolledFactors || [];
  mfaEnrolled = enrolledFactors.length > 0;
} catch (error) {
  console.warn('⚠️ Error checking MFA enrollment:', error);
}
```

#### 4. Force Enrollment (If Not Enrolled)
```javascript
if (isPrivilegedRole && !mfaEnrolled) {
  return res.json({
    success: false,
    requireMFAEnrollment: true,
    message: 'Multi-factor authentication is mandatory for your role. Please enroll to continue.',
    role: userData.role,
    loginCount: loginCount,
    mandatory: true
  });
}
```

#### 5. Require Verification (Every 3rd Login)
```javascript
const shouldRequireMFAVerification = isPrivilegedRole && mfaEnrolled && (loginCount % 3 === 0);

if (shouldRequireMFAVerification) {
  return res.json({
    success: false,
    requireMFA: true,
    message: 'Multi-factor authentication required',
    role: userData.role,
    loginCount: loginCount
  });
}
```

#### 6. Mark Enrollment Complete
```javascript
if (isPrivilegedRole && mfaEnrolled && !mfaEnrollmentCompleted) {
  await loginMetaRef.set({
    mfaEnrollmentCompleted: true
  }, { merge: true });
}
```

---

## Frontend Implementation

### AuthContext Updates

The frontend already has MFA enrollment and verification logic in `src/contexts/AuthContext.tsx`:

#### MFA Enrollment Flow:
1. `enrollMFA(phoneNumber)` - Sends OTP to phone
2. `verifyMFAEnrollment(code)` - Verifies OTP and completes enrollment
3. Automatically re-attempts login after enrollment

#### MFA Verification Flow:
1. `initiateMFAVerification()` - Sends OTP
2. `verifyMFA(code)` - Verifies OTP
3. Completes login on success

### MFA Modal Component

Location: `src/components/auth/MFAModal.tsx`

**Features:**
- Shows enrollment UI when `mfaEnrollmentRequired` is true
- Shows verification UI when `mfaRequired` is true
- Supports phone number input and OTP verification
- Resend code functionality
- Clear error messages

---

## Database Schema

### Collection: `loginMetadata`

Each document (keyed by user UID) contains:

```javascript
{
  loginCount: 5,                      // Increments on each login
  lastLoginAt: Timestamp,             // Last login timestamp
  email: "user@example.com",          // User email
  role: "admin",                      // User role
  mfaEnrollmentCompleted: true        // NEW: Tracks if MFA enrollment is done
}
```

### Firebase Auth

MFA enrollment is stored in Firebase Authentication:

```javascript
userRecord.multiFactor.enrolledFactors = [
  {
    uid: "factor-uid",
    displayName: "Phone Number",
    factorId: "phone",
    enrollmentTime: "2024-01-15T10:30:00Z"
  }
]
```

---

## User Experience

### For New Privileged Users:

1. **Sign Up** → Account created
2. **First Login Attempt** → MFA enrollment modal appears
3. **Choose MFA Method** → SMS or Email (if available)
4. **Enter Phone Number** → Receives OTP
5. **Enter OTP** → MFA enrolled successfully
6. **Access Granted** → Can now use the application

### For Existing Privileged Users (Without MFA):

1. **Login Attempt** → MFA enrollment modal appears
2. **Must Enroll** → Cannot skip or close modal
3. **Complete Enrollment** → Follow same steps as new users
4. **Access Granted** → Can now use the application

### For Privileged Users (With MFA):

- **Login 1-2**: Normal login, no MFA required
- **Login 3**: MFA verification modal appears
  - Enter OTP sent to phone
  - Verify and continue
- **Login 4-5**: Normal login, no MFA required
- **Login 6**: MFA verification required again
- And so on...

---

## Security Benefits

### 1. **Prevents Unauthorized Access**
- Even if password is compromised, attacker needs phone/email access
- Protects sensitive admin functions

### 2. **Compliance**
- Meets security requirements for privileged accounts
- Provides audit trail of MFA usage

### 3. **Balanced Security**
- Not too intrusive (only every 3rd login)
- Not too lax (mandatory for privileged roles)

### 4. **Audit Trail**
All MFA events are logged:
- `mfa-enrollment-required` - When enrollment is needed
- `mfa-verification-required` - When verification is needed
- `login-success` - Includes MFA status

---

## Testing

### Test Scenario 1: New Admin User

```bash
# 1. Create admin user in Firebase Console
# 2. Try to login
# Expected: MFA enrollment modal appears
# 3. Enroll in MFA
# Expected: Access granted
# 4. Logout and login again (2 times)
# Expected: No MFA required
# 5. Logout and login 3rd time
# Expected: MFA verification required
```

### Test Scenario 2: Existing Admin Without MFA

```bash
# 1. Login with existing admin account (no MFA)
# Expected: MFA enrollment modal appears
# 2. Must enroll to continue
# Expected: Cannot skip enrollment
# 3. Complete enrollment
# Expected: Access granted
```

### Test Scenario 3: Regular User

```bash
# 1. Login with regular user account
# Expected: No MFA required at all
# 2. Login multiple times
# Expected: Never asked for MFA
```

### Test Scenario 4: Login Count Tracking

```bash
# Check server logs for login count:
# Login 1: loginCount: 1, MFA not required
# Login 2: loginCount: 2, MFA not required
# Login 3: loginCount: 3, MFA required (3 % 3 === 0)
# Login 4: loginCount: 4, MFA not required
# Login 5: loginCount: 5, MFA not required
# Login 6: loginCount: 6, MFA required (6 % 3 === 0)
```

---

## Server Console Output

### When Privileged User Without MFA Logs In:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Login metadata: { loginCount: 1, isPrivilegedRole: true, mfaEnrollmentCompleted: false }
🔐 MFA Status: { isPrivilegedRole: true, mfaEnrolled: false, enrolledFactorsCount: 0 }
🚨 MANDATORY MFA ENROLLMENT REQUIRED for privileged role: admin
👤 User: admin@example.com
📝 User must enroll in MFA before accessing the application
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### When Privileged User With MFA Logs In (3rd time):

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Login metadata: { loginCount: 3, isPrivilegedRole: true, mfaEnrollmentCompleted: true }
🔐 MFA Status: { isPrivilegedRole: true, mfaEnrolled: true, enrolledFactorsCount: 1 }
🔐 MFA VERIFICATION REQUIRED (3rd login check)
👤 User: admin@example.com
📊 Login count: 3
🔢 Every 3rd login requires MFA verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### When Regular User Logs In:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Login metadata: { loginCount: 5, isPrivilegedRole: false, mfaEnrollmentCompleted: false }
🔐 MFA Status: { isPrivilegedRole: false, mfaEnrolled: false, enrolledFactorsCount: 0 }
✅ Regular user - no MFA required
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Configuration

### Changing MFA Frequency

To change how often MFA is required, modify this line in `server.js`:

```javascript
// Current: Every 3rd login
const shouldRequireMFAVerification = isPrivilegedRole && mfaEnrolled && (loginCount % 3 === 0);

// Every 5th login:
const shouldRequireMFAVerification = isPrivilegedRole && mfaEnrolled && (loginCount % 5 === 0);

// Every login:
const shouldRequireMFAVerification = isPrivilegedRole && mfaEnrolled;

// Every 2nd login:
const shouldRequireMFAVerification = isPrivilegedRole && mfaEnrolled && (loginCount % 2 === 0);
```

### Adding/Removing Privileged Roles

Modify the `privilegedRoles` array in `server.js`:

```javascript
// Current roles:
const privilegedRoles = ['admin', 'super-admin', 'compliance', 'claims'];

// Add more roles:
const privilegedRoles = ['admin', 'super-admin', 'compliance', 'claims', 'auditor', 'manager'];

// Remove roles:
const privilegedRoles = ['admin', 'super-admin']; // Only admins need MFA
```

---

## Troubleshooting

### Issue: User stuck in enrollment loop

**Symptoms**: User enrolls in MFA but still sees enrollment modal

**Solution**:
1. Check Firebase Console → Authentication → Users
2. Verify user has enrolled factors
3. Check `loginMetadata` collection for `mfaEnrollmentCompleted` field
4. Manually set `mfaEnrollmentCompleted: true` if needed

### Issue: MFA required on every login

**Symptoms**: User asked for MFA on every single login

**Check**:
1. Server logs for `loginCount` value
2. Verify `loginCount % 3 === 0` logic
3. Check if `loginMetadata` is being updated correctly

### Issue: Regular users seeing MFA modal

**Symptoms**: Users with `user` or `default` role see MFA enrollment

**Check**:
1. Verify user role in `userroles` collection
2. Check `isPrivilegedRole` logic in server
3. Ensure role normalization is working

---

## Future Enhancements

### 1. Email MFA Option
- Add email OTP as alternative to SMS
- Let users choose their preferred method
- Store preference in user profile

### 2. Backup Codes
- Generate backup codes during enrollment
- Allow users to use backup codes if phone unavailable
- Store encrypted backup codes in Firestore

### 3. Remember Device
- Option to "trust this device for 30 days"
- Skip MFA on trusted devices
- Track trusted devices in database

### 4. Admin Override
- Allow super admins to reset MFA for users
- Temporary MFA bypass for emergencies
- Audit log of all overrides

### 5. MFA Dashboard
- Show users their MFA status
- Display enrolled factors
- Allow users to manage MFA settings
- Show login history with MFA events

---

## Summary

✅ **Implemented:**
- Mandatory MFA enrollment for privileged roles
- MFA verification every 3rd login
- Login count tracking
- MFA enrollment completion tracking
- Comprehensive logging
- User-friendly modals

✅ **Security:**
- Prevents unauthorized access to admin functions
- Provides audit trail
- Balanced security (not too intrusive)
- Compliant with security best practices

✅ **User Experience:**
- Clear instructions
- Choice of MFA method (SMS/Email)
- Not required on every login
- Smooth enrollment flow

---

**Implementation Date:** 2024-01-XX
**Status:** ✅ Complete and Ready for Testing
**Next Steps:** Test with admin accounts and verify MFA flow

