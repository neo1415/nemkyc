const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration from .env.local
const firebaseConfig = {
  apiKey: "AIzaSyDTyrzbQ4xYV0IAvngwgCUBf6EPnflacSw",
  authDomain: "nem-customer-feedback-8d3fb.firebaseapp.com",
  projectId: "nem-customer-feedback-8d3fb",
  storageBucket: "nem-customer-feedback-8d3fb.appspot.com",
  messagingSenderId: "524975485983",
  appId: "1:524975485983:web:3a859424a3314d53ab112a",
  measurementId: "G-8BH08J5X7G"
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
