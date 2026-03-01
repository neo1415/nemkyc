/**
 * Diagnose Cost Issue Script
 * 
 * This script examines the api-usage-logs collection to understand
 * why the Cost Tracker is showing ₦600 instead of ₦300.
 * 
 * Usage:
 *   node scripts/diagnose-cost-issue.cjs
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
 * Diagnose api-usage-logs collection
 */
async function diagnoseAPIUsageLogs() {
  console.log('🔍 Diagnosing api-usage-logs collection...\n');
  
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
    
    let totalCost = 0;
    const logsByTimestamp = new Map();
    
    console.log('Recent logs:');
    console.log('─'.repeat(120));
    console.log('Timestamp                | Provider  | Success | Cost  | User');
    console.log('─'.repeat(120));
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
      const timestampStr = timestamp.toISOString();
      const cost = data.cost || 0;
      
      totalCost += cost;
      
      // Track logs by timestamp to detect duplicates
      const key = `${timestampStr}-${data.apiProvider}-${data.success}`;
      if (!logsByTimestamp.has(key)) {
        logsByTimestamp.set(key, []);
      }
      logsByTimestamp.get(key).push({ id: doc.id, cost, data });
      
      // Display recent logs
      console.log(
        `${timestamp.toLocaleString().padEnd(24)} | ` +
        `${(data.apiProvider || 'unknown').padEnd(9)} | ` +
        `${String(data.success).padEnd(7)} | ` +
        `₦${String(cost).padEnd(4)} | ` +
        `${data.userName || 'unknown'}`
      );
    });
    
    console.log('─'.repeat(120));
    console.log(`\n💰 Total Cost: ₦${totalCost}`);
    console.log(`📈 Expected Cost (3 successful × ₦100): ₦300`);
    console.log(`❌ Difference: ₦${totalCost - 300}\n`);
    
    // Check for duplicates
    console.log('🔍 Checking for duplicate entries...\n');
    let duplicateCount = 0;
    
    for (const [key, logs] of logsByTimestamp.entries()) {
      if (logs.length > 1) {
        duplicateCount++;
        console.log(`⚠️  DUPLICATE FOUND: ${key}`);
        console.log(`   ${logs.length} entries with same timestamp/provider/success:`);
        logs.forEach(log => {
          console.log(`   - ID: ${log.id}, Cost: ₦${log.cost}`);
        });
        console.log('');
      }
    }
    
    if (duplicateCount === 0) {
      console.log('✅ No duplicate entries found\n');
    } else {
      console.log(`❌ Found ${duplicateCount} sets of duplicate entries\n`);
    }
    
    // Analyze cost distribution
    console.log('📊 Cost Distribution:');
    const costCounts = {};
    snapshot.forEach(doc => {
      const cost = doc.data().cost || 0;
      costCounts[cost] = (costCounts[cost] || 0) + 1;
    });
    
    for (const [cost, count] of Object.entries(costCounts).sort((a, b) => Number(b[0]) - Number(a[0]))) {
      console.log(`   ₦${cost}: ${count} entries`);
    }
    
    console.log('\n📝 Summary:');
    console.log(`   - Total entries: ${snapshot.size}`);
    console.log(`   - Total cost: ₦${totalCost}`);
    console.log(`   - Expected cost: ₦300`);
    console.log(`   - Difference: ₦${totalCost - 300}`);
    console.log(`   - Duplicate sets: ${duplicateCount}`);
    
    if (totalCost > 300) {
      console.log('\n💡 Possible causes:');
      console.log('   1. Duplicate log entries (same verification logged twice)');
      console.log('   2. Incorrect cost values in database');
      console.log('   3. More than 3 successful verifications this month');
    }
    
  } catch (error) {
    console.error('❌ Error diagnosing API usage logs:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting cost issue diagnosis...\n');
  
  try {
    await diagnoseAPIUsageLogs();
    
    console.log('\n✅ Diagnosis complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
