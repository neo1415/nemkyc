# Autofill Authentication Fix - COMPLETE

## Problem
When logged-in users entered a NIN or CAC number in KYC/NFIU forms, the autofill verification was failing with a 401 Unauthorized error:

```
POST http://localhost:3001/api/autofill/verify-nin 401 (Unauthorized)
[InputTriggerHandler] Verification failed: {code: 'API_ERROR', message: 'Your session has expired. Please sign in again.'}
```

The console logs showed:
- Input validation passed ✅
- Verification was triggered ✅
- But the API call returned 401 Unauthorized ❌

## Root Cause
The issue was a mismatch between client and server authentication mechanisms:

**Client Side**: The `VerificationAPIClient` was sending Firebase ID tokens via the Authorization header

**Server Side**: The `requireAuth` middleware was only looking for session tokens (stored in the `userroles` collection), not Firebase ID tokens

The problem occurred because:
1. Frontend runs on `localhost:5173` (Vite dev server)
2. Backend runs on `localhost:3001` (Express server)
3. This is a cross-origin request, so cookies don't work reliably
4. The server's session system expects a session token in cookies
5. The client was sending Firebase ID tokens, which the server didn't recognize

## Solution - Two-Part Fix

### Part 1: Client-Side (Already Implemented)
Modified `src/services/autoFill/VerificationAPIClient.ts` to send Firebase ID tokens:

```typescript
// Get Firebase ID token for authentication
const user = auth.currentUser;
if (!user) {
  throw new Error('User not authenticated');
}

// Force token refresh to ensure it's valid
const idToken = await user.getIdToken(true);

return fetch(`${API_BASE_URL}/api/autofill/verify-nin`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`  // Send Firebase ID token
  },
  body: JSON.stringify({ nin, userId, formId, userName, userEmail }),
  signal: this.abortController.signal
});
```

### Part 2: Server-Side (NEW FIX)
Modified the `requireAuth` middleware in `server.js` to accept BOTH session tokens AND Firebase ID tokens:

```javascript
const requireAuth = async (req, res, next) => {
  try {
    let sessionToken = req.cookies.__session;
    let isFirebaseIdToken = false;
    
    // Check Authorization header
    if (!sessionToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);
        
        // Try to verify as Firebase ID token first
        try {
          const decodedToken = await admin.auth().verifyIdToken(sessionToken);
          console.log('✅ Valid Firebase ID token for user:', decodedToken.uid);
          
          // Fetch user data from userroles collection using UID
          const userDoc = await db.collection('userroles').doc(decodedToken.uid).get();
          
          if (!userDoc.exists) {
            return res.status(401).json({ 
              error: 'User not found',
              message: 'Your account is not properly configured. Please contact support.'
            });
          }
          
          const userData = userDoc.data();
          
          // Attach user data to request
          req.user = {
            uid: decodedToken.uid,
            email: userData.email,
            role: userData.role,
            name: userData.name,
            ...userData
          };
          
          isFirebaseIdToken = true;
          return next();
        } catch (firebaseError) {
          console.log('⚠️ Not a valid Firebase ID token, trying as session token');
          // Continue to try as session token below
        }
      }
    }
    
    // If not a Firebase ID token, validate as session token
    if (!isFirebaseIdToken) {
      // ... existing session token validation logic
    }
  } catch (error) {
    // ... error handling
  }
};
```

**Key Changes:**
1. When a Bearer token is in the Authorization header, try to verify it as a Firebase ID token first
2. If valid, fetch user data from `userroles` collection using the decoded UID
3. Attach user data to `req.user` and proceed
4. If not a valid Firebase ID token, fall back to session token validation
5. Skip session timeout checks for Firebase ID tokens (they have their own expiration)

## Why This Fix Works

**Before:**
- Client sends Firebase ID token → Server looks for it in `userroles` collection → Not found → 401 error

**After:**
- Client sends Firebase ID token → Server verifies it with Firebase Admin SDK → Valid → Fetches user from `userroles` by UID → Success ✅

## Testing
To verify the fix works:

1. **Login**: Sign in to the application
2. **Navigate to KYC Form**: Go to Individual KYC or Corporate KYC form
3. **Enter NIN/CAC**: Type a valid NIN (11 digits) or CAC number
4. **Blur the field**: Click outside the input field to trigger verification
5. **Check Console**: Should see successful verification logs

Expected console logs:
```
🔑 Using token from Authorization header (localhost fallback)
✅ Valid Firebase ID token for user: [uid]
[VerificationAPIClient] NIN verification - CACHE HIT (cost = ₦0)
```

6. **Check Network Tab**: The POST request to `/api/autofill/verify-nin` should return 200 OK

## Expected Behavior

- ✅ Logged-in users can trigger autofill verification
- ✅ Firebase ID tokens are accepted and validated
- ✅ User data is properly attached to requests
- ✅ Verification API calls succeed with 200 OK
- ✅ Form fields are auto-populated with verified data
- ✅ Cache system works (subsequent verifications return cached data)
- ✅ Session tokens still work (backward compatibility)

## Files Modified

1. `src/services/autoFill/VerificationAPIClient.ts` - Added Firebase authentication (Part 1)
2. `server.js` - Updated `requireAuth` middleware to accept Firebase ID tokens (Part 2)
3. `AUTOFILL_AUTHENTICATION_FIX.md` - This documentation file

## Related Issues

- Task 1: NIN/CAC verification not being triggered during form submission ✅ FIXED
- Task 2: Autofill authentication 401 error ✅ FIXED

## Technical Notes

**Why not just use session tokens?**
- Cross-origin requests between localhost:5173 and localhost:3001 don't reliably send cookies
- Firebase ID tokens work better for API calls from the frontend
- This approach is more flexible and works in both development and production

**Security Considerations:**
- Firebase ID tokens are validated using Firebase Admin SDK
- Tokens are verified for authenticity and expiration
- User data is still fetched from the `userroles` collection for authorization
- Session timeout checks are skipped for Firebase ID tokens (they have their own expiration)

**Backward Compatibility:**
- Session token authentication still works
- Existing endpoints using session cookies are unaffected
- The middleware tries Firebase ID token first, then falls back to session token
