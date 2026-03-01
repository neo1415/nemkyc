/**
 * Fix Duplicate API Usage Logs Script
 * 
 * This script removes duplicate entries from the api-usage-logs collection
 * that are causing the Cost Tracker to show incorrect totals.
 * 
 * Usage:
 *   node scripts/fix-duplicate-api-logs.cjs
 */

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
  universe_domain: process.env.UNIVERSE_DOMAIN
};

admin.initializeApp({
  credential: admin.credential.cert(config)
});

const db = admin.firestore();

/**
 * Remove duplicate API usage logs
 */
async function removeDuplicateLogs() {
  console.log('🔍 Finding and removing duplicate API usage logs...\n');
  
  try {
    // Get current month's logs
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const snapshot = await db.collection('api-usage-logs')
      .where('timestamp', '>=', startOfMonth)
      .where('timestamp', '<=', endOfMonth)
      .orderBy('timestamp', 'desc')
      .get();
    
    console.log(`📊 Found ${snapshot.size} API usage logs for current month\n`);
    
    // Group logs by timestamp + provider + success to find duplicates
    const logsByKey = new Map();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
      const timestampStr = timestamp.toISOString();
      
      // Create a unique key for each verification
      // Same timestamp (within 1 second), provider, and success status = likely duplicate
      const timestampKey = Math.floor(timestamp.getTime() / 1000); // Round to nearest second
      const key = `${timestampKey}-${data.apiProvider}-${data.success}-${data.listId || 'none'}-${data.entryId || 'none'}`;
      
      if (!logsByKey.has(key)) {
        logsByKey.set(key, []);
      }
      
      logsByKey.get(key).push({
        id: doc.id,
        timestamp: timestampStr,
        provider: data.apiProvider,
        success: data.success,
        cost: data.cost || 0,
        userName: data.userName,
        listId: data.listId,
        entryId: data.entryId
      });
    });
    
    // Find and remove duplicates
    let duplicateCount = 0;
    let removedCount = 0;
    const batch = db.batch();
    let batchCount = 0;
    
    console.log('🔍 Analyzing for duplicates...\n');
    
    for (const [key, logs] of logsByKey.entries()) {
      if (logs.length > 1) {
        duplicateCount++;
        
        console.log(`⚠️  DUPLICATE FOUND: ${logs.length} entries`);
        console.log(`   Timestamp: ${logs[0].timestamp}`);
        console.log(`   Provider: ${logs[0].provider}`);
        console.log(`   Success: ${logs[0].success}`);
        console.log(`   Cost: ₦${logs[0].cost} each`);
        console.log(`   User: ${logs[0].userName}`);
        
        // Keep the first log, remove the rest
        const [keep, ...remove] = logs;
        console.log(`   ✅ Keeping: ${keep.id}`);
        
        for (const log of remove) {
          console.log(`   ❌ Removing: ${log.id}`);
          batch.delete(db.collection('api-usage-logs').doc(log.id));
          batchCount++;
          removedCount++;
          
          // Firestore batch limit is 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`   💾 Committed batch of ${batchCount} deletions`);
            batchCount = 0;
          }
        }
        
        console.log('');
      }
    }
    
    // Commit any remaining deletions
    if (batchCount > 0) {
      await batch.commit();
      console.log(`💾 Committed final batch of ${batchCount} deletions\n`);
    }
    
    console.log('📊 Summary:');
    console.log(`   - Total entries analyzed: ${snapshot.size}`);
    console.log(`   - Duplicate sets found: ${duplicateCount}`);
    console.log(`   - Duplicate entries removed: ${removedCount}`);
    console.log(`   - Entries remaining: ${snapshot.size - removedCount}`);
    
    if (removedCount > 0) {
      console.log('\n✅ Duplicates removed successfully!');
      console.log('💡 The Cost Tracker should now show the correct total.');
      console.log('🔄 Refresh your analytics dashboard to see the updated cost.');
    } else {
      console.log('\n✅ No duplicates found - database is clean!');
      console.log('💡 If Cost Tracker still shows wrong amount, the issue may be elsewhere.');
    }
    
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting duplicate removal...\n');
  
  try {
    await removeDuplicateLogs();
    
    console.log('\n✅ Script complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
