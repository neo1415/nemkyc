/**
 * Interactive Data Cleanup Script
 * 
 * Allows you to selectively clear different types of data from Firestore.
 * 
 * Usage: node scripts/clear-data-interactive.js
 */

const admin = require('../server-utils/firebaseAdminCompat.cjs');
const readline = require('readline');
require('dotenv').config();

// Initialize Firebase Admin SDK
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
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask user a question
 */
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

/**
 * Delete all documents in a collection in batches
 */
async function deleteCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const batchSize = 500;
  let deletedCount = 0;

  console.log(`\n🗑️  Clearing collection: ${collectionName}`);

  try {
    let query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
      deleteQueryBatch(query, resolve, reject);
    });

    async function deleteQueryBatch(query, resolve, reject) {
      try {
        const snapshot = await query.get();

        if (snapshot.size === 0) {
          console.log(`✅ Deleted ${deletedCount} documents from ${collectionName}`);
          resolve(deletedCount);
          return;
        }

        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += snapshot.size;
        console.log(`   Deleted ${snapshot.size} documents (total: ${deletedCount})`);

        process.nextTick(() => {
          deleteQueryBatch(query, resolve, reject);
        });
      } catch (error) {
        reject(error);
      }
    }
  } catch (error) {
    console.error(`❌ Error clearing ${collectionName}:`, error.message);
    return 0;
  }
}

/**
 * Get document count for a collection
 */
async function getCollectionCount(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).count().get();
    return snapshot.data().count;
  } catch (error) {
    return 0;
  }
}

/**
 * Main interactive cleanup
 */
async function interactiveCleanup() {
  console.log('\n' + '='.repeat(60));
  console.log('🧹 INTERACTIVE DATA CLEANUP');
  console.log('='.repeat(60));

  // Define collections with descriptions
  const collections = [
    {
      name: 'api-usage',
      description: 'API usage summaries (daily/monthly)',
      recommended: true
    },
    {
      name: 'api-usage-logs',
      description: 'Individual API call logs',
      recommended: true
    },
    {
      name: 'audit-logs',
      description: 'Verification attempts and security events',
      recommended: true
    },
    {
      name: 'health-monitor',
      description: 'Health check history',
      recommended: true
    },
    {
      name: 'identity-activity-logs',
      description: 'Identity verification activity logs',
      recommended: false
    }
  ];

  console.log('\n📊 Current data:');
  for (const col of collections) {
    const count = await getCollectionCount(col.name);
    console.log(`   ${col.name}: ${count} documents`);
  }

  console.log('\n');
  const answer = await ask('Do you want to clear ALL recommended collections? (yes/no): ');

  if (answer === 'yes' || answer === 'y') {
    console.log('\n⚠️  This will delete data from:');
    collections.filter(c => c.recommended).forEach(c => {
      console.log(`   - ${c.name}: ${c.description}`);
    });
    
    const confirm = await ask('\nAre you sure? Type "DELETE" to confirm: ');
    
    if (confirm === 'delete') {
      let totalDeleted = 0;
      
      for (const col of collections.filter(c => c.recommended)) {
        const count = await deleteCollection(col.name);
        totalDeleted += count;
      }
      
      console.log('\n' + '='.repeat(60));
      console.log(`✅ Cleanup complete! Total documents deleted: ${totalDeleted}`);
      console.log('='.repeat(60));
    } else {
      console.log('\n❌ Cleanup cancelled.');
    }
  } else {
    console.log('\n📋 Select collections to clear:');
    const toDelete = [];
    
    for (const col of collections) {
      const count = await getCollectionCount(col.name);
      const answer = await ask(`   Clear ${col.name} (${count} docs)? (yes/no): `);
      if (answer === 'yes' || answer === 'y') {
        toDelete.push(col.name);
      }
    }
    
    if (toDelete.length > 0) {
      console.log('\n⚠️  Will delete data from:');
      toDelete.forEach(name => console.log(`   - ${name}`));
      
      const confirm = await ask('\nType "DELETE" to confirm: ');
      
      if (confirm === 'delete') {
        let totalDeleted = 0;
        
        for (const name of toDelete) {
          const count = await deleteCollection(name);
          totalDeleted += count;
        }
        
        console.log('\n' + '='.repeat(60));
        console.log(`✅ Cleanup complete! Total documents deleted: ${totalDeleted}`);
        console.log('='.repeat(60));
      } else {
        console.log('\n❌ Cleanup cancelled.');
      }
    } else {
      console.log('\n❌ No collections selected.');
    }
  }

  rl.close();
  process.exit(0);
}

// Run the interactive cleanup
interactiveCleanup().catch(error => {
  console.error('\n❌ Error:', error);
  rl.close();
  process.exit(1);
});
