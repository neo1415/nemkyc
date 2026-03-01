/**
 * Diagnostic script to identify analytics aggregation issues
 * Run with: node scripts/diagnose-analytics-aggregation.cjs
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
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(config),
});

const db = admin.firestore();

async function diagnoseAnalytics() {
  console.log('🔍 Diagnosing Analytics Aggregation Issues...\n');
  
  // Date range from UI: Feb 1 - Mar 1, 2026
  const startDate = new Date('2026-02-01T00:00:00Z');
  const endDate = new Date('2026-03-01T23:59:59Z');
  
  console.log(`📅 Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);
  
  // 1. Check audit-logs collection
  console.log('1️⃣ Checking audit-logs collection...');
  const auditLogsSnapshot = await db.collection('audit-logs')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
    .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
    .get();
  
  console.log(`   Found ${auditLogsSnapshot.size} audit log entries`);
  
  const auditLogsByUser = {};
  const auditLogsByProvider = {};
  let totalAuditCost = 0;
  
  auditLogsSnapshot.forEach(doc => {
    const data = doc.data();
    const userId = data.userId || data.userEmail || 'unknown';
    const provider = data.apiProvider || data.provider || 'unknown';
    const cost = data.cost || 0;
    
    auditLogsByUser[userId] = (auditLogsByUser[userId] || 0) + 1;
    auditLogsByProvider[provider] = (auditLogsByProvider[provider] || 0) + 1;
    totalAuditCost += cost;
  });
  
  console.log('   By User:', auditLogsByUser);
  console.log('   By Provider:', auditLogsByProvider);
  console.log(`   Total Cost from audit-logs: ₦${totalAuditCost}\n`);
  
  // 2. Check api-usage collection
  console.log('2️⃣ Checking api-usage collection...');
  const apiUsageSnapshot = await db.collection('api-usage')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
    .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
    .get();
  
  console.log(`   Found ${apiUsageSnapshot.size} api-usage entries`);
  
  const apiUsageByUser = {};
  const apiUsageByProvider = {};
  let totalApiCost = 0;
  
  apiUsageSnapshot.forEach(doc => {
    const data = doc.data();
    const userId = data.userId || 'unknown';
    const provider = data.provider || 'unknown';
    const cost = data.cost || 0;
    
    apiUsageByUser[userId] = (apiUsageByUser[userId] || 0) + 1;
    apiUsageByProvider[provider] = (apiUsageByProvider[provider] || 0) + 1;
    totalApiCost += cost;
  });
  
  console.log('   By User:', apiUsageByUser);
  console.log('   By Provider:', apiUsageByProvider);
  console.log(`   Total Cost from api-usage: ₦${totalApiCost}\n`);
  
  // 3. Check for date/timezone issues
  console.log('3️⃣ Checking for date/timezone issues...');
  const sampleDocs = auditLogsSnapshot.docs.slice(0, 3);
  sampleDocs.forEach((doc, idx) => {
    const data = doc.data();
    const timestamp = data.timestamp?.toDate();
    console.log(`   Sample ${idx + 1}:`, {
      timestamp: timestamp?.toISOString(),
      provider: data.apiProvider || data.provider,
      userId: data.userId || data.userEmail,
      cost: data.cost
    });
  });
  
  console.log('\n✅ Diagnosis Complete!');
  console.log('\n📊 Summary:');
  console.log(`   - Audit Logs: ${auditLogsSnapshot.size} entries, ₦${totalAuditCost} total`);
  console.log(`   - API Usage: ${apiUsageSnapshot.size} entries, ₦${totalApiCost} total`);
  console.log(`   - Discrepancy: ${Math.abs(auditLogsSnapshot.size - apiUsageSnapshot.size)} entries difference`);
  
  process.exit(0);
}

diagnoseAnalytics().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
