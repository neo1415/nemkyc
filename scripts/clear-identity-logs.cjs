/**
 * Clear Analytics and Logging Data
 * 
 * This script clears API usage tracking, audit logs, and activity logs.
 * Use this to start fresh with clean analytics data.
 * 
 * Usage:
 *   node scripts/clear-identity-logs.cjs [options]
 * 
 * Options:
 *   --analytics     Clear API usage tracking and audit logs (RECOMMENDED)
 *   --activity      Clear identity collection activity logs only
 *   --all           Clear everything (analytics + activity logs)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

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

const db = admin.firestore();

// Parse command line arguments
const args = process.argv.slice(2);
const analyticsOnly = args.includes('--analytics');
const activityOnly = args.includes('--activity');
const clearAll = args.includes('--all');

/**
 * Delete documents in batches
 */
async function batchDelete(collectionName, query = null) {
  const batchSize = 500;
  let deletedCount = 0;
  
  const collectionRef = db.collection(collectionName);
  const queryRef = query || collectionRef;
  
  let snapshot = await queryRef.limit(batchSize).get();
  
  while (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    deletedCount += snapshot.docs.length;
    console.log(`  Deleted ${deletedCount} documents from ${collectionName}...`);
    
    // Get next batch
    snapshot = await queryRef.limit(batchSize).get();
  }
  
  return deletedCount;
}

/**
 * Clear API usage tracking data
 */
async function clearAPIUsage() {
  console.log('\n💰 Clearing API usage tracking data...');
  const count = await batchDelete('api-usage');
  console.log(`✅ Deleted ${count} API usage records`);
  return count;
}

/**
 * Clear audit logs
 */
async function clearAuditLogs() {
  console.log('\n📋 Clearing audit logs...');
  const count = await batchDelete('audit-logs');
  console.log(`✅ Deleted ${count} audit log entries`);
  return count;
}

/**
 * Clear activity logs
 */
async function clearActivityLogs() {
  console.log('\n📝 Clearing identity activity logs...');
  const count = await batchDelete('identity-activity-logs');
  console.log(`✅ Deleted ${count} activity log entries`);
  return count;
}

/**
 * Clear test entries (entries with test emails)
 */
async function clearTestEntries() {
  console.log('\n🧪 Clearing test entries...');
  
  // Get all entries
  const entriesSnapshot = await db.collection('identity-entries').get();
  const testEmails = ['test@', 'example@', 'demo@', '@test.', '@example.', '@demo.'];
  
  let deletedCount = 0;
  const batch = db.batch();
  let batchCount = 0;
  
  for (const doc of entriesSnapshot.docs) {
    const data = doc.data();
    const email = data.email || '';
    
    // Check if it's a test email
    const isTestEmail = testEmails.some(pattern => email.toLowerCase().includes(pattern));
    
    if (isTestEmail) {
      batch.delete(doc.ref);
      batchCount++;
      deletedCount++;
      
      // Commit batch every 500 operations
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  Deleted ${deletedCount} test entries...`);
        batchCount = 0;
      }
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`✅ Deleted ${deletedCount} test entries`);
  return deletedCount;
}

/**
 * Clear test lists (lists with test in name)
 */
async function clearTestLists() {
  console.log('\n📋 Clearing test lists...');
  
  const listsSnapshot = await db.collection('identity-lists').get();
  
  let deletedCount = 0;
  const batch = db.batch();
  let batchCount = 0;
  
  for (const doc of listsSnapshot.docs) {
    const data = doc.data();
    const name = (data.name || '').toLowerCase();
    
    // Check if it's a test list
    if (name.includes('test') || name.includes('demo') || name.includes('example')) {
      batch.delete(doc.ref);
      batchCount++;
      deletedCount++;
      
      // Commit batch every 500 operations
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  Deleted ${deletedCount} test lists...`);
        batchCount = 0;
      }
    }
  }
  
  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }
  
  console.log(`✅ Deleted ${deletedCount} test lists`);
  return deletedCount;
}

/**
 * Clear all lists
 */
async function clearAllLists() {
  console.log('\n📋 Clearing all identity lists...');
  const count = await batchDelete('identity-lists');
  console.log(`✅ Deleted ${count} lists`);
  return count;
}

/**
 * Clear all entries
 */
async function clearAllEntries() {
  console.log('\n📄 Clearing all identity entries...');
  const count = await batchDelete('identity-entries');
  console.log(`✅ Deleted ${count} entries`);
  return count;
}

/**
 * Main execution
 */
async function main() {
  console.log('🧹 Analytics and Logging Data Cleanup Script');
  console.log('==========================================\n');
  
  if (!analyticsOnly && !activityOnly && !clearAll) {
    console.log('❌ Error: Please specify an option:');
    console.log('  --analytics   Clear API usage tracking and audit logs (RECOMMENDED)');
    console.log('  --activity    Clear identity collection activity logs only');
    console.log('  --all         Clear everything (analytics + activity logs)');
    console.log('\nExample: node scripts/clear-identity-logs.js --analytics');
    process.exit(1);
  }
  
  try {
    let totalDeleted = 0;
    
    if (analyticsOnly) {
      console.log('Mode: Clear analytics data (API usage + audit logs)\n');
      totalDeleted += await clearAPIUsage();
      totalDeleted += await clearAuditLogs();
    } else if (activityOnly) {
      console.log('Mode: Clear identity activity logs only\n');
      totalDeleted += await clearActivityLogs();
    } else if (clearAll) {
      console.log('⚠️  WARNING: This will delete ALL analytics and activity logs!');
      console.log('Mode: Clear everything\n');
      
      // Wait 3 seconds to allow cancellation
      console.log('Starting in 3 seconds... (Press Ctrl+C to cancel)');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      totalDeleted += await clearAPIUsage();
      totalDeleted += await clearAuditLogs();
      totalDeleted += await clearActivityLogs();
    }
    
    console.log('\n==========================================');
    console.log(`✅ Cleanup complete! Deleted ${totalDeleted} total documents`);
    console.log('==========================================\n');
    
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    // Close Firebase connection
    await admin.app().delete();
  }
}

// Run the script
main();
