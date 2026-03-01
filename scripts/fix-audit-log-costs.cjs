/**
 * Fix Audit Log Costs Script
 * 
 * This script fixes incorrect cost values in the verification-audit-logs collection.
 * It recalculates the cost based on the success field and updates the documents.
 * 
 * Correct pricing:
 * - Successful NIN/CAC verification: ₦100
 * - Failed verification: ₦0
 * 
 * Usage:
 *   node scripts/fix-audit-log-costs.cjs
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
 * Calculate correct cost based on provider and success
 */
function calculateCorrectCost(provider, success, result) {
  // Determine success from result field if success field is missing
  const isSuccess = success !== undefined ? success : (result === 'success');
  
  // Only charge for successful verifications
  if (!isSuccess) {
    return 0;
  }
  
  // Both Datapro and VerifyData cost ₦100 per successful verification
  if (provider === 'datapro' || provider === 'verifydata') {
    return 100;
  }
  
  return 0;
}

/**
 * Fix costs in verification-audit-logs collection
 */
async function fixVerificationAuditLogs() {
  console.log('🔧 Fixing verification-audit-logs collection...');
  
  try {
    const snapshot = await db.collection('verification-audit-logs')
      .where('eventType', '==', 'verification_attempt')
      .get();
    
    console.log(`📊 Found ${snapshot.size} verification audit logs`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Determine provider from apiProvider field or infer from verificationType
      let provider = data.apiProvider || 'unknown';
      if (provider === 'unknown' && data.verificationType) {
        if (data.verificationType.toLowerCase() === 'nin') {
          provider = 'datapro';
        } else if (data.verificationType.toLowerCase() === 'cac') {
          provider = 'verifydata';
        }
      }
      
      // Calculate correct cost
      const correctCost = calculateCorrectCost(provider, data.success, data.result);
      
      // Check if cost needs to be fixed
      const currentCost = data.cost || 0;
      if (currentCost !== correctCost) {
        batch.update(doc.ref, { cost: correctCost });
        batchCount++;
        fixedCount++;
        
        console.log(`  ✅ Fixed ${doc.id}: ${currentCost} → ${correctCost} (${data.result}, ${provider})`);
        
        // Commit batch if it reaches the limit
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`  💾 Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      } else {
        skippedCount++;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  💾 Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`\n✅ Verification audit logs fixed:`);
    console.log(`   - Fixed: ${fixedCount}`);
    console.log(`   - Skipped (already correct): ${skippedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing verification audit logs:', error);
    throw error;
  }
}

/**
 * Fix costs in api-usage-logs collection
 */
async function fixAPIUsageLogs() {
  console.log('\n🔧 Fixing api-usage-logs collection...');
  
  try {
    const snapshot = await db.collection('api-usage-logs').get();
    
    console.log(`📊 Found ${snapshot.size} API usage logs`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Calculate correct cost
      const correctCost = calculateCorrectCost(data.apiProvider, data.success, null);
      
      // Check if cost needs to be fixed
      const currentCost = data.cost || 0;
      if (currentCost !== correctCost) {
        batch.update(doc.ref, { cost: correctCost });
        batchCount++;
        fixedCount++;
        
        console.log(`  ✅ Fixed ${doc.id}: ${currentCost} → ${correctCost} (${data.success ? 'success' : 'failure'}, ${data.apiProvider})`);
        
        // Commit batch if it reaches the limit
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`  💾 Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      } else {
        skippedCount++;
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  💾 Committed final batch of ${batchCount} updates`);
    }
    
    console.log(`\n✅ API usage logs fixed:`);
    console.log(`   - Fixed: ${fixedCount}`);
    console.log(`   - Skipped (already correct): ${skippedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing API usage logs:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting audit log cost fix...\n');
  
  try {
    // Fix both collections
    await fixVerificationAuditLogs();
    await fixAPIUsageLogs();
    
    console.log('\n✅ All audit log costs have been fixed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your server to load the updated code');
    console.log('   2. Refresh the analytics dashboard');
    console.log('   3. Verify that costs are now correct (₦100 for success, ₦0 for failure)');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
