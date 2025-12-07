# How to Remove MFA from Firebase User Account

## Problem
Your user account (neowalker502@gmail.com) has MFA enrolled in Firebase. Even though we disabled MFA in the code, Firebase itself is enforcing MFA verification because the user has it enrolled.

## Solution Options

### Option 1: Remove MFA via Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Users**
4. Find the user: `neowalker502@gmail.com`
5. Click on the user
6. Look for **Multi-factor authentication** section
7. Click the **trash/delete icon** next to the enrolled phone number
8. Confirm deletion
9. Try logging in again

### Option 2: Remove MFA via Admin SDK Script

Create a script to remove MFA programmatically:

**File: `scripts/remove-mfa.js`**

```javascript
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const config = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(config),
});

async function removeMFA(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log('Found user:', user.uid, user.email);
    
    // Check if user has MFA enrolled
    const enrolledFactors = user.multiFactor?.enrolledFactors || [];
    console.log('Enrolled MFA factors:', enrolledFactors.length);
    
    if (enrolledFactors.length === 0) {
      console.log('✅ User has no MFA enrolled');
      return;
    }
    
    // Remove each MFA factor
    for (const factor of enrolledFactors) {
      console.log('Removing MFA factor:', factor.uid, factor.phoneNumber);
      await admin.auth().updateUser(user.uid, {
        multiFactor: {
          enrolledFactors: null
        }
      });
      console.log('✅ MFA factor removed');
    }
    
    console.log('✅ All MFA factors removed from user:', email);
    
  } catch (error) {
    console.error('Error removing MFA:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
const email = process.argv[2] || 'neowalker502@gmail.com';
console.log('Removing MFA from user:', email);
removeMFA(email);
```

**Run the script:**
```bash
node scripts/remove-mfa.js neowalker502@gmail.com
```

### Option 3: Remove MFA via Server Endpoint (Quick)

Add this temporary endpoint to your `server.js`:

```javascript
// TEMPORARY: Remove MFA from user account
app.post('/api/admin/remove-mfa', async (req, res) => {
  try {
    const { email, adminSecret } = req.body;
    
    // Security check - require admin secret
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log('Found user:', user.uid, user.email);
    
    // Check if user has MFA enrolled
    const enrolledFactors = user.multiFactor?.enrolledFactors || [];
    console.log('Enrolled MFA factors:', enrolledFactors.length);
    
    if (enrolledFactors.length === 0) {
      return res.json({ success: true, message: 'User has no MFA enrolled' });
    }
    
    // Remove all MFA factors
    await admin.auth().updateUser(user.uid, {
      multiFactor: {
        enrolledFactors: null
      }
    });
    
    console.log('✅ All MFA factors removed from user:', email);
    
    res.json({ 
      success: true, 
      message: 'MFA removed successfully',
      removedFactors: enrolledFactors.length
    });
    
  } catch (error) {
    console.error('Error removing MFA:', error);
    res.status(500).json({ error: 'Failed to remove MFA', details: error.message });
  }
});
```

**Call the endpoint:**
```bash
curl -X POST http://localhost:3001/api/admin/remove-mfa \
  -H "Content-Type: application/json" \
  -d '{"email":"neowalker502@gmail.com","adminSecret":"YOUR_SECRET_HERE"}'
```

## Recommended Approach

**Use Option 1** (Firebase Console) - it's the quickest and safest:

1. Open Firebase Console
2. Go to Authentication → Users
3. Click on neowalker502@gmail.com
4. Delete the MFA enrollment
5. Try logging in again

## After Removing MFA

Once MFA is removed from the Firebase user account:
- ✅ Login will work normally
- ✅ No MFA prompts will appear
- ✅ User can log in with just email/password

## Important Notes

- **This only affects Firebase's MFA enforcement**
- Your code changes already disabled the app's MFA logic
- You need to remove MFA from Firebase itself for users who already enrolled
- New users won't be able to enroll in MFA (since we disabled that code)

## For All Users with MFA

If you have multiple users with MFA enrolled, you'll need to remove it for each one. You can modify the script to loop through all users:

```javascript
async function removeAllMFA() {
  const listUsersResult = await admin.auth().listUsers();
  
  for (const user of listUsersResult.users) {
    const enrolledFactors = user.multiFactor?.enrolledFactors || [];
    if (enrolledFactors.length > 0) {
      console.log('Removing MFA from:', user.email);
      await admin.auth().updateUser(user.uid, {
        multiFactor: { enrolledFactors: null }
      });
      console.log('✅ Removed');
    }
  }
}
```
