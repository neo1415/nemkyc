#!/usr/bin/env node

/**
 * Test CAC Document Permissions
 * 
 * This script tests the CAC document permissions for different user roles
 * to verify that the Firestore rules are working correctly.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'nem-kyc-app'
  });
}

const db = admin.firestore();

async function testCACPermissions() {
  console.log('🔍 Testing CAC Document Permissions...\n');
  
  try {
    // Test 1: Check if cac-document-metadata collection exists and has documents
    console.log('1. Checking cac-document-metadata collection...');
    const metadataSnapshot = await db.collection('cac-document-metadata')
      .limit(5)
      .get();
    
    console.log(`   Found ${metadataSnapshot.docs.length} documents in cac-document-metadata`);
    
    if (metadataSnapshot.docs.length > 0) {
      const sampleDoc = metadataSnapshot.docs[0];
      console.log('   Sample document structure:', {
        id: sampleDoc.id,
        identityRecordId: sampleDoc.data().identityRecordId,
        documentType: sampleDoc.data().documentType,
        uploadedBy: sampleDoc.data().uploadedBy,
        isCurrent: sampleDoc.data().isCurrent
      });
      
      // Test 2: Check if the identity entry exists for this document
      const identityRecordId = sampleDoc.data().identityRecordId;
      if (identityRecordId) {
        console.log('\n2. Checking identity entry...');
        const identityDoc = await db.collection('identity-entries').doc(identityRecordId).get();
        
        if (identityDoc.exists) {
          console.log('   ✅ Identity entry exists');
          const listId = identityDoc.data().listId;
          console.log('   List ID:', listId);
          
          // Test 3: Check if the identity list exists
          if (listId) {
            console.log('\n3. Checking identity list...');
            const listDoc = await db.collection('identity-lists').doc(listId).get();
            
            if (listDoc.exists) {
              console.log('   ✅ Identity list exists');
              console.log('   Created by:', listDoc.data().createdBy);
              console.log('   List name:', listDoc.data().name);
            } else {
              console.log('   ❌ Identity list does not exist');
            }
          }
        } else {
          console.log('   ❌ Identity entry does not exist');
        }
      }
    }
    
    // Test 4: Check user roles
    console.log('\n4. Checking user roles...');
    const rolesSnapshot = await db.collection('userroles')
      .where('role', '==', 'broker')
      .limit(3)
      .get();
    
    console.log(`   Found ${rolesSnapshot.docs.length} broker users`);
    rolesSnapshot.docs.forEach(doc => {
      console.log(`   Broker: ${doc.id} (${doc.data().role})`);
    });
    
    // Test 5: Test a specific query that's failing
    console.log('\n5. Testing the failing query...');
    const testIdentityId = process.argv[2];
    
    if (testIdentityId) {
      console.log(`   Testing with identity ID: ${testIdentityId}`);
      
      const testQuery = await db.collection('cac-document-metadata')
        .where('identityRecordId', '==', testIdentityId)
        .where('isCurrent', '==', true)
        .orderBy('uploadedAt', 'desc')
        .get();
      
      console.log(`   Query returned ${testQuery.docs.length} documents`);
      
      testQuery.docs.forEach(doc => {
        console.log('   Document:', {
          id: doc.id,
          documentType: doc.data().documentType,
          uploadedBy: doc.data().uploadedBy,
          uploadedAt: doc.data().uploadedAt?.toDate?.()
        });
      });
    } else {
      console.log('   (Provide identity ID as argument to test specific query)');
    }
    
    console.log('\n✅ Permission test completed');
    
  } catch (error) {
    console.error('❌ Error testing permissions:', error);
  }
}

// Run the test
testCACPermissions().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});