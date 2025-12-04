/**
 * Create Test Unverified User
 * 
 * This script creates a test user account that is NOT email verified,
 * so you can test the email verification flow.
 * 
 * Usage:
 *   node scripts/create-test-unverified-user.js
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

async function createTestUser() {
  try {
    const testEmail = `test-unverified-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 CREATING TEST UNVERIFIED USER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Create user
    const userRecord = await admin.auth().createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Test Unverified User',
      emailVerified: false  // Explicitly set to false
    });
    
    console.log('✅ Test user created successfully!\n');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('👤 UID:', userRecord.uid);
    console.log('✉️  Email Verified:', userRecord.emailVerified ? '✅ YES' : '❌ NO');
    
    // Create user document in Firestore
    const db = admin.firestore();
    await db.collection('userroles').doc(userRecord.uid).set({
      name: 'Test Unverified User',
      email: testEmail,
      role: 'default',
      dateCreated: admin.firestore.FieldValue.serverTimestamp(),
      dateModified: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('\n💡 To test email verification:');
    console.log('   1. Try to login with these credentials');
    console.log('   2. You should see the Email Verification Modal');
    console.log('   3. Click "Resend Email" to get a verification link');
    console.log('   4. Check your email and click the link');
    console.log('   5. Try logging in again - should work!');
    
    console.log('\n🗑️  To delete this test user later:');
    console.log('   → Firebase Console → Authentication → Users');
    console.log('   → Find', testEmail);
    console.log('   → Click "..." → Delete user');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Error creating test user:', error.message);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

// Run the script
createTestUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
