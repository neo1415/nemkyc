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
    console.log('🔍 Looking up user:', email);
    
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log('✅ Found user:', user.uid, user.email);
    
    // Check if user has MFA enrolled
    const enrolledFactors = user.multiFactor?.enrolledFactors || [];
    console.log('📱 Enrolled MFA factors:', enrolledFactors.length);
    
    if (enrolledFactors.length === 0) {
      console.log('✅ User has no MFA enrolled - nothing to remove');
      return;
    }
    
    // Display enrolled factors
    enrolledFactors.forEach((factor, index) => {
      console.log(`  Factor ${index + 1}:`, {
        uid: factor.uid,
        phoneNumber: factor.phoneNumber,
        displayName: factor.displayName,
        enrollmentTime: factor.enrollmentTime
      });
    });
    
    console.log('\n🗑️  Removing all MFA factors...');
    
    // Remove all MFA factors by updating user with null
    await admin.auth().updateUser(user.uid, {
      multiFactor: {
        enrolledFactors: null
      }
    });
    
    console.log('✅ All MFA factors removed successfully!');
    console.log('✅ User can now log in without MFA');
    
    // Verify removal
    const updatedUser = await admin.auth().getUser(user.uid);
    const remainingFactors = updatedUser.multiFactor?.enrolledFactors || [];
    console.log('✅ Verification: Remaining MFA factors:', remainingFactors.length);
    
  } catch (error) {
    console.error('❌ Error removing MFA:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'neowalker502@gmail.com';

console.log('═══════════════════════════════════════════════════════');
console.log('  Firebase MFA Removal Script');
console.log('═══════════════════════════════════════════════════════');
console.log('Target user:', email);
console.log('═══════════════════════════════════════════════════════\n');

removeMFA(email);
