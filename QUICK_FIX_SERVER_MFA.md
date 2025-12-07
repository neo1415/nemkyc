# Quick Fix: Disable MFA in server.js

## Problem
The MFA code in server.js (lines ~2210-2350) is still active and needs to be disabled.

## Solution
Open `server.js` and find the section starting around line 2210. Replace the entire MFA section with this simple code:

### Find This Section (around line 2210):
```javascript
    let lastLoginAt = new Date();
    let mfaEnrollmentCompleted = false;
    
    if (loginMetaDoc.exists) {
      const metaData = loginMetaDoc.data();
      loginCount = (metaData.loginCount || 0) + 1;
      lastLoginAt = metaData.lastLoginAt?.toDate() || new Date();
      mfaEnrollmentCompleted = metaData.mfaEnrollmentCompleted || false;
    }
    
    // Update login count
    await loginMetaRef.set({
      loginCount: loginCount,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      email: email,
      role: userData.role,
      mfaEnrollmentCompleted: mfaEnrollmentCompleted
    }, { merge: true });
    
    // Check user's current MFA enrollment status in Firebase Auth
    let mfaEnrolled = false;
    let enrolledFactors = [];
    try {
      const userRecord = await admin.auth().getUser(uid);
      enrolledFactors = userRecord.multiFactor?.enrolledFactors || [];
      mfaEnrolled = enrolledFactors.length > 0;
    } catch (error) {
      console.warn('⚠️ Error checking MFA enrollment:', error);
    }
    
    // MFA Debug Logging
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 MFA CHECK - Login #' + loginCount);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 User:', email);
    console.log('👔 Role:', userData.role);
    console.log('🎯 Is Privileged Role:', isPrivilegedRole);
    console.log('📊 Login Count:', loginCount);
    console.log('🔐 MFA Enrolled:', mfaEnrolled);
    console.log('📱 Enrolled Factors:', enrolledFactors.length);
    console.log('✅ MFA Enrollment Completed:', mfaEnrollmentCompleted);
    console.log('🔢 Should Require MFA (every 3rd):', loginCount % 3 === 0);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // ============================================================================
    // STEP 1: Force MFA enrollment for privileged roles (if not already enrolled)
    // ============================================================================
    if (isPrivilegedRole && !mfaEnrolled) {
      console.log('🚨 MANDATORY MFA ENROLLMENT REQUIRED for privileged role:', userData.role);
      console.log('👤 User:', email);
      console.log('📝 User must enroll in MFA before accessing the application');
      
      await logAction({
        action: 'mfa-enrollment-required',
        actorUid: uid,
        actorDisplayName: userData.name,
        actorEmail: email,
        actorRole: userData.role,
        targetType: 'user',
        targetId: uid,
        details: { 
          loginCount: loginCount,
          reason: 'mandatory-for-privileged-role',
          privilegedRole: userData.role,
          mfaEnrolled: false
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location: await getLocationFromIP(req.ipData?.raw || '0.0.0.0'),
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: { loginTimestamp: new Date().toISOString() }
      });
      
      return res.json({
        success: false,
        requireMFAEnrollment: true,
        message: 'Multi-factor authentication is mandatory for your role. Please enroll to continue.',
        role: userData.role,
        loginCount: loginCount,
        mandatory: true
      });
    }
    
    // ============================================================================
    // STEP 2: Require MFA verification every 3rd login (for enrolled privileged users)
    // ============================================================================
    const shouldRequireMFAVerification = false; // Disabled
    
    if (shouldRequireMFAVerification) {
      console.log('🔐 MFA VERIFICATION REQUIRED (3rd login check)');
      console.log('👤 User:', email);
      console.log('📊 Login count:', loginCount);
      console.log('🔢 Every 3rd login requires MFA verification');
      
      await logAction({
        action: 'mfa-required',
        actorUid: uid,
        actorDisplayName: userData.name,
        actorEmail: email,
        actorRole: userData.role,
        targetType: 'user',
        targetId: uid,
        details: { 
          loginCount: loginCount,
          reason: 'sensitive-role-login-threshold',
          mfaEnrolled: true
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location: await getLocationFromIP(req.ipData?.raw || '0.0.0.0'),
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: { loginTimestamp: new Date().toISOString() }
      });
      
      return res.json({
        success: false,
        requireMFA: true,
        message: 'Multi-factor authentication required',
        role: userData.role,
        loginCount: loginCount
      });
    }
    
    // ============================================================================
    // STEP 3: Mark MFA enrollment as complete (if privileged user has MFA enrolled)
    // ============================================================================
    if (isPrivilegedRole && mfaEnrolled && !mfaEnrollmentCompleted) {
      console.log('✅ Marking MFA enrollment as complete for:', email);
      await loginMetaRef.set({
        mfaEnrollmentCompleted: true
      }, { merge: true });
    }
```

### Replace With This Simple Code:
```javascript
    // MFA DISABLED - Simple login tracking only
    if (loginMetaDoc.exists) {
      const metaData = loginMetaDoc.data();
      loginCount = (metaData.loginCount || 0) + 1;
    }
    
    // Update login count only (no MFA fields)
    await loginMetaRef.set({
      loginCount: loginCount,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      email: email,
      role: userData.role
    }, { merge: true });
    
    console.log('✅ Login #' + loginCount + ' for user:', email, '(MFA disabled)');
```

## That's It!

After making this change:
1. Save the file
2. Commit: `git add server.js && git commit -m "Disable MFA functionality"`
3. Push and deploy
4. Test login - should work without any MFA prompts

## Verification

After deploying, check the server logs. You should see:
```
✅ Login #X for user: your@email.com (MFA disabled)
```

Instead of the long MFA debug output.
