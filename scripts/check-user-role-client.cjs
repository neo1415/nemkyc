const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config();

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUserRole(email) {
  try {
    console.log(`\n🔍 Checking role for: ${email}\n`);
    
    // Query userroles collection by email
    const userRolesRef = collection(db, 'userroles');
    const q = query(userRolesRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`✅ Found in userroles collection:`);
        console.log(`   UID: ${doc.id}`);
        console.log(`   Role: "${data.role}"`);
        console.log(`   Role Type: ${typeof data.role}`);
        console.log(`   Role Length: ${data.role?.length || 0} characters`);
        console.log(`   Name: ${data.name}`);
        console.log(`   Email: ${data.email}`);
        
        // Check for hidden characters
        if (data.role) {
          const roleBytes = [];
          for (let i = 0; i < data.role.length; i++) {
            roleBytes.push(data.role.charCodeAt(i));
          }
          console.log(`   Role Bytes: [${roleBytes.join(', ')}]`);
        }
      });
    } else {
      console.log(`\n❌ NOT found in userroles collection`);
    }
    
    // Also check users collection
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('email', '==', email));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (!usersSnapshot.empty) {
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`\n✅ Found in users collection:`);
        console.log(`   UID: ${doc.id}`);
        console.log(`   Role: "${data.role}"`);
        console.log(`   Name: ${data.name || data.displayName}`);
      });
    } else {
      console.log(`\n⚠️  NOT found in users collection`);
    }
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node scripts/check-user-role-client.cjs your@email.com');
  process.exit(1);
}

checkUserRole(email);
