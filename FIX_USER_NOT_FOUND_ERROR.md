# Fix "User Not Found" Login Error

## Problem
User can authenticate with Firebase but gets "User not found" error because they don't exist in the `userroles` Firestore collection.

## Root Cause
The user exists in Firebase Authentication but is missing from the `userroles` collection in Firestore.

## Solution Options

### Option 1: Add User via Firebase Console (Quickest)

1. Go to Firebase Console → Firestore Database
2. Find the `userroles` collection
3. Click "Add Document"
4. Set Document ID to the user's UID (get from Firebase Auth)
5. Add fields:
   ```
   email: "user@example.com"
   role: "super admin"  // or "admin", "claims", "compliance", "default"
   dateCreated: (current timestamp)
   dateModified: (current timestamp)
   ```
6. Click Save

### Option 2: Fix in Backend Code

The backend should automatically create the userroles document when a user signs up. Check if this is working:

**In server.js, find the signup/register endpoint:**

```javascript
app.post('/api/register', async (req, res) => {
  // ... user creation code ...
  
  // This should exist:
  await db.collection('userroles').doc(userRecord.uid).set({
    email: email,
    role: 'default',
    dateCreated: admin.firestore.FieldValue.serverTimestamp(),
    dateModified: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

### Option 3: Automatic Fix Script

Create a script to sync Firebase Auth users to Firestore:

```javascript
// sync-users.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function syncUsers() {
  const listUsersResult = await admin.auth().listUsers();
  
  for (const user of listUsersResult.users) {
    const userDoc = await db.collection('userroles').doc(user.uid).get();
    
    if (!userDoc.exists) {
      console.log(`Creating userroles doc for: ${user.email}`);
      await db.collection('userroles').doc(user.uid).set({
        email: user.email,
        role: 'default',
        dateCreated: admin.firestore.FieldValue.serverTimestamp(),
        dateModified: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
  
  console.log('✅ Sync complete!');
}

syncUsers();
```

Run with: `node sync-users.js`

## Quick Test

After adding the user to `userroles`:

1. Clear browser cache/cookies
2. Try logging in again
3. Should work now

## Prevention

Make sure the signup endpoint always creates the userroles document:

```javascript
// In server.js - register endpoint
await db.collection('userroles').doc(userRecord.uid).set({
  email: email,
  role: 'default',
  dateCreated: admin.firestore.FieldValue.serverTimestamp(),
  dateModified: admin.firestore.FieldValue.serverTimestamp()
});
```

## Note

This error is **NOT related to the optimizations** we just did. It's a pre-existing data consistency issue between Firebase Auth and Firestore.
