/**
 * Clear All Identity Lists and Entries
 * 
 * This script deletes all identity lists and their associated entries from Firestore.
 * 
 * Collections cleared:
 * - identity-lists (the list metadata)
 * - identity-entries (all entries in all lists)
 * 
 * Usage: node scripts/clear-identity-lists.js
 */

const admin = require('../server-utils/firebaseAdminCompat.cjs');
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

        // Delete documents in a batch
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += snapshot.size;
        console.log(`   Deleted ${snapshot.size} documents (total: ${deletedCount})`);

        // Recurse on the next process tick to avoid blocking
        process.nextTick(() => {
          deleteQueryBatch(query, resolve, reject);
        });
      } catch (error) {
        reject(error);
      }
    }
  } catch (error) {
    console.error(`❌ Error clearing ${collectionName}:`, error.message);
    throw error;
  }
}

/**
 * Get collection count
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
 * Main cleanup function
 */
async function clearIdentityLists() {
  console.log('🧹 Starting identity lists cleanup...\n');
  
  try {
    // Get counts first
    const listsCount = await getCollectionCount('identity-lists');
    const entriesCount = await getCollectionCount('identity-entries');
    
    console.log('📊 Current data:');
    console.log(`   identity-lists: ${listsCount} lists`);
    console.log(`   identity-entries: ${entriesCount} entries`);
    
    console.log('\n⚠️  WARNING: This will permanently delete ALL identity lists and entries!');
    console.log('⚠️  Press Ctrl+C within 5 seconds to cancel...\n');

    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));

    let totalDeleted = 0;

    // Delete entries first (child records)
    console.log('\n📝 Step 1: Deleting all identity entries...');
    const entriesDeleted = await deleteCollection('identity-entries');
    totalDeleted += entriesDeleted;

    // Then delete lists (parent records)
    console.log('\n📝 Step 2: Deleting all identity lists...');
    const listsDeleted = await deleteCollection('identity-lists');
    totalDeleted += listsDeleted;

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Cleanup complete! Total documents deleted: ${totalDeleted}`);
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - ${listsDeleted} identity lists deleted`);
    console.log(`   - ${entriesDeleted} identity entries deleted`);
    console.log('\n💡 All identity collection data has been cleared.\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the cleanup
clearIdentityLists();
