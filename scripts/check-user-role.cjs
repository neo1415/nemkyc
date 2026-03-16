const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUserRole(email) {
  try {
    console.log(`\n🔍 Checking role for: ${email}\n`);
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found Firebase Auth user:`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   Email Verified: ${userRecord.emailVerified}`);
    
    // Check userroles collection
    const userRoleDoc = await db.collection('userroles').doc(userRecord.uid).get();
    
    if (userRoleDoc.exists) {
      const data = userRoleDoc.data();
      console.log(`\n✅ Found in userroles collection:`);
      console.log(`   Role: "${data.role}"`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Email: ${data.email}`);
    } else {
      console.log(`\n❌ NOT found in userroles collection`);
    }
    
    // Check users collection
    const usersDoc = await db.collection('users').doc(userRecord.uid).get();
    
    if (usersDoc.exists) {
      const data = usersDoc.data();
      console.log(`\n✅ Found in users collection:`);
      console.log(`   Role: "${data.role}"`);
      console.log(`   Name: ${data.name || data.displayName}`);
    } else {
      console.log(`\n⚠️  NOT found in users collection`);
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/check-user-role.cjs your@email.com');
  process.exit(1);
}

checkUserRole(email);
