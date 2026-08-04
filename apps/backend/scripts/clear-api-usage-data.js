/**
 * Clear API Usage and Logging Data
 * 
 * This script clears all API usage tracking and audit log data from Firestore.
 * Use this to start fresh with clean data.
 * 
 * Collections cleared:
 * - api-usage (daily/monthly usage summaries)
 * - api-usage-logs (individual API call logs)
 * - audit-logs (verification attempts, security events, etc.)
 * - health-monitor (health check history)
 * 
 * Usage: node scripts/clear-api-usage-data.js
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
 * Main cleanup function
 */
async function clearAllData() {
  console.log('🧹 Starting data cleanup...\n');
  console.log('⚠️  WARNING: This will permanently delete all API usage and audit log data!');
  console.log('⚠️  Press Ctrl+C within 5 seconds to cancel...\n');

  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    // Collections to clear
    const collections = [
      'api-usage',           // Daily/monthly API usage summaries
      'api-usage-logs',      // Individual API call logs
      'verification-audit-logs', // Verification attempts, security events (CORRECT NAME)
      'audit-logs',          // Old audit logs (if any)
      'health-monitor',      // Health check history
      'identity-activity-logs' // Identity verification activity logs (optional)
    ];

    let totalDeleted = 0;

    for (const collection of collections) {
      try {
        const count = await deleteCollection(collection);
        totalDeleted += count;
      } catch (error) {
        console.error(`❌ Failed to clear ${collection}:`, error.message);
        // Continue with other collections
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Cleanup complete! Total documents deleted: ${totalDeleted}`);
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('   - API usage tracking data cleared');
    console.log('   - Audit logs cleared');
    console.log('   - Health monitor history cleared');
    console.log('   - Identity activity logs cleared');
    console.log('\n💡 Note: User accounts and identity lists were NOT affected.');
    console.log('   You can delete identity lists from the dashboard if needed.\n');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the cleanup
clearAllData();
