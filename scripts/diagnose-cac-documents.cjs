/**
 * CAC Document Visibility Diagnostic Script
 * 
 * This script helps diagnose why CAC documents uploaded by customers
 * are not visible in the admin UI.
 * 
 * It checks:
 * 1. Documents in Firebase Storage
 * 2. Metadata in Firestore cac-document-metadata collection
 * 3. Entry records in identity-entries collection
 * 4. Query results using the same query as the admin UI
 * 
 * Usage:
 *   node scripts/diagnose-cac-documents.cjs <entryId>
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    storageBucket: 'salvage-insurance.appspot.com'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function diagnoseEntry(entryId) {
  console.log('\n=== CAC Document Visibility Diagnostic ===\n');
  console.log(`Entry ID: ${entryId}\n`);
  
  try {
    // 1. Check identity entry
    console.log('1. Checking identity entry...');
    const entryDoc = await db.collection('identity-entries').doc(entryId).get();
    
    if (!entryDoc.exists) {
      console.error('❌ Entry not found in identity-entries collection');
      return;
    }
    
    const entry = entryDoc.data();
    console.log('✅ Entry found:');
    console.log(`   - Email: ${entry.email}`);
    console.log(`   - Status: ${entry.status}`);
    console.log(`   - Verification Type: ${entry.verificationType}`);
    console.log(`   - List ID: ${entry.listId}`);
    
    if (entry.cacDocuments) {
      console.log('   - CAC Documents in entry:');
      Object.keys(entry.cacDocuments).forEach(docType => {
        const doc = entry.cacDocuments[docType];
        console.log(`     * ${docType}:`);
        console.log(`       - Document ID: ${doc.documentId}`);
        console.log(`       - Status: ${doc.status}`);
        console.log(`       - Filename: ${doc.filename}`);
        console.log(`       - Uploaded At: ${doc.uploadedAt?.toDate?.() || doc.uploadedAt}`);
      });
    } else {
      console.log('   - No cacDocuments field in entry');
    }
    
    // 2. Check metadata collection
    console.log('\n2. Checking cac-document-metadata collection...');
    const metadataSnapshot = await db.collection('cac-document-metadata')
      .where('identityRecordId', '==', entryId)
      .get();
    
    if (metadataSnapshot.empty) {
      console.error('❌ No metadata documents found in cac-document-metadata collection');
      console.log('   This is the problem! Documents were uploaded but metadata was not written.');
    } else {
      console.log(`✅ Found ${metadataSnapshot.size} metadata document(s):`);
      metadataSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - Document ID: ${doc.id}`);
        console.log(`     * Document Type: ${data.documentType}`);
        console.log(`     * Identity Record ID: ${data.identityRecordId}`);
        console.log(`     * Is Current: ${data.isCurrent}`);
        console.log(`     * Status: ${data.status}`);
        console.log(`     * Uploaded At: ${data.uploadedAt?.toDate?.() || data.uploadedAt}`);
        console.log(`     * Storage Path: ${data.storagePath}`);
        console.log(`     * Filename: ${data.filename}`);
      });
    }
    
    // 3. Check with admin UI query (same as getDocumentsByIdentityRecord)
    console.log('\n3. Testing admin UI query (identityRecordId + isCurrent + orderBy)...');
    const adminQuerySnapshot = await db.collection('cac-document-metadata')
      .where('identityRecordId', '==', entryId)
      .where('isCurrent', '==', true)
      .orderBy('uploadedAt', 'desc')
      .get();
    
    if (adminQuerySnapshot.empty) {
      console.error('❌ Admin UI query returned no results');
      console.log('   Possible causes:');
      console.log('   - isCurrent field is missing or false');
      console.log('   - uploadedAt field is missing');
      console.log('   - Firestore index is missing or not deployed');
      console.log('   - identityRecordId does not match');
    } else {
      console.log(`✅ Admin UI query returned ${adminQuerySnapshot.size} document(s)`);
      adminQuerySnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.documentType}: ${data.filename}`);
      });
    }
    
    // 4. Check Firebase Storage
    console.log('\n4. Checking Firebase Storage...');
    const storagePrefix = `cac-documents/${entryId}/`;
    const [files] = await bucket.getFiles({ prefix: storagePrefix });
    
    if (files.length === 0) {
      console.error('❌ No files found in Firebase Storage');
    } else {
      console.log(`✅ Found ${files.length} file(s) in storage:`);
      files.forEach(file => {
        console.log(`   - ${file.name}`);
        console.log(`     * Size: ${file.metadata.size} bytes`);
        console.log(`     * Content Type: ${file.metadata.contentType}`);
        console.log(`     * Created: ${file.metadata.timeCreated}`);
      });
    }
    
    // 5. Summary and recommendations
    console.log('\n=== Summary ===\n');
    
    const hasEntry = entryDoc.exists;
    const hasMetadata = !metadataSnapshot.empty;
    const hasAdminQueryResults = !adminQuerySnapshot.empty;
    const hasStorageFiles = files.length > 0;
    
    if (hasEntry && hasMetadata && hasAdminQueryResults && hasStorageFiles) {
      console.log('✅ All checks passed! Documents should be visible in admin UI.');
    } else {
      console.log('❌ Issues detected:');
      if (!hasEntry) console.log('   - Entry not found');
      if (!hasMetadata) console.log('   - Metadata not written to Firestore');
      if (!hasAdminQueryResults) console.log('   - Admin query returns no results (check isCurrent and uploadedAt fields)');
      if (!hasStorageFiles) console.log('   - Files not found in Storage');
      
      console.log('\nRecommended actions:');
      if (!hasMetadata) {
        console.log('   1. Check server logs for metadata write errors');
        console.log('   2. Verify server.js writes to cac-document-metadata collection');
        console.log('   3. Check Firestore security rules allow writes');
      }
      if (hasMetadata && !hasAdminQueryResults) {
        console.log('   1. Verify isCurrent field is set to true');
        console.log('   2. Verify uploadedAt field exists and is a Timestamp');
        console.log('   3. Check Firestore indexes are deployed');
        console.log('   4. Run: firebase deploy --only firestore:indexes');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error);
    console.error(error.stack);
  }
}

// Get entry ID from command line
const entryId = process.argv[2];

if (!entryId) {
  console.error('Usage: node scripts/diagnose-cac-documents.cjs <entryId>');
  process.exit(1);
}

diagnoseEntry(entryId)
  .then(() => {
    console.log('\nDiagnosis complete.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
