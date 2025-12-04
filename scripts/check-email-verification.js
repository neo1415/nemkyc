/**
 * Email Verification Status Checker
 * 
 * This script checks the email verification status of a user in Firebase.
 * 
 * Usage:
 *   node scripts/check-email-verification.js <email>
 * 
 * Example:
 *   node scripts/check-email-verification.js user@example.com
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

async function checkEmailVerification(email) {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 EMAIL VERIFICATION STATUS CHECKER');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    console.log('👤 User Information:');
    console.log('   Email:', userRecord.email);
    console.log('   UID:', userRecord.uid);
    console.log('   Display Name:', userRecord.displayName || 'Not set');
    console.log('   Created:', new Date(userRecord.metadata.creationTime).toLocaleString());
    console.log('   Last Sign In:', userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime).toLocaleString() : 'Never');
    console.log('\n✉️  Email Verification Status:', userRecord.emailVerified ? '✅ VERIFIED' : '❌ NOT VERIFIED');
    
    if (!userRecord.emailVerified) {
      console.log('\n💡 To verify this email:');
      console.log('   1. User should check their email inbox (and spam folder)');
      console.log('   2. Click the verification link in the email');
      console.log('   3. Or manually verify in Firebase Console:');
      console.log('      → Go to Firebase Console → Authentication → Users');
      console.log('      → Find user and click "..." → Edit user');
      console.log('      → Check "Email verified" checkbox');
    } else {
      console.log('\n✅ This user can login successfully!');
    }
    
    // Check if user has MFA enrolled
    if (userRecord.multiFactor && userRecord.multiFactor.enrolledFactors.length > 0) {
      console.log('\n🔐 MFA Status: ✅ ENROLLED');
      console.log('   Enrolled Factors:', userRecord.multiFactor.enrolledFactors.length);
    } else {
      console.log('\n🔐 MFA Status: ❌ NOT ENROLLED');
    }
    
    // Check user role from Firestore
    const db = admin.firestore();
    const userDoc = await db.collection('userroles').doc(userRecord.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('\n👔 User Role:', userData.role || 'Not set');
      console.log('   Name:', userData.name || 'Not set');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 No user found with email:', email);
      console.log('   Make sure the email is correct and the user has signed up.');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('\n❌ Error: Email address required');
  console.log('\nUsage:');
  console.log('  node scripts/check-email-verification.js <email>');
  console.log('\nExample:');
  console.log('  node scripts/check-email-verification.js user@example.com\n');
  process.exit(1);
}

// Run the check
checkEmailVerification(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
