/**
 * Script to find and delete verified NIN/CAC test records
 * 
 * This script helps you:
 * 1. Find all verified identity entries
 * 2. Display them so you can identify your test records
 * 3. Delete specific records by ID
 * 
 * Usage:
 * 1. Run: node scripts/delete-verified-test-records.js list
 * 2. Find your test record IDs
 * 3. Run: node scripts/delete-verified-test-records.js delete <entryId>
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
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

/**
 * List all verified identity entries
 */
async function listVerifiedEntries() {
  console.log('🔍 Searching for verified identity entries...\n');
  
  try {
    const snapshot = await db.collection('identity-entries')
      .where('status', '==', 'verified')
      .orderBy('verifiedAt', 'desc')
      .get();
    
    if (snapshot.empty) {
      console.log('No verified entries found.');
      return;
    }
    
    console.log(`Found ${snapshot.size} verified entries:\n`);
    
    snapshot.forEach((doc, index) => {
      const data = doc.data();
      const verifiedAt = data.verifiedAt?.toDate ? data.verifiedAt.toDate().toISOString() : 'Unknown';
      
      console.log(`${index + 1}. Entry ID: ${doc.id}`);
      console.log(`   Type: ${data.verificationType || 'Unknown'}`);
      console.log(`   Email: ${data.email || 'Unknown'}`);
      console.log(`   List ID: ${data.listId || 'Unknown'}`);
      console.log(`   Verified At: ${verifiedAt}`);
      
      // Show masked identity numbers
      if (data.nin) {
        if (data.nin.encrypted) {
          console.log(`   NIN: [ENCRYPTED]`);
        } else {
          console.log(`   NIN: ${data.nin.substring(0, 4)}*******`);
        }
      }
      if (data.cac) {
        if (data.cac.encrypted) {
          console.log(`   CAC: [ENCRYPTED]`);
        } else {
          console.log(`   CAC: ${data.cac.substring(0, 4)}*******`);
        }
      }
      if (data.cacCompanyName) {
        console.log(`   Company: ${data.cacCompanyName}`);
      }
      
      // Show user data if available
      if (data.data) {
        const firstName = data.data.firstName || data.data.first_name || '';
        const lastName = data.data.lastName || data.data.last_name || '';
        if (firstName || lastName) {
          console.log(`   Name: ${firstName} ${lastName}`.trim());
        }
      }
      
      console.log('');
    });
    
    console.log('\nTo delete an entry, run:');
    console.log('node scripts/delete-verified-test-records.js delete <entryId>');
    
  } catch (error) {
    console.error('❌ Error listing entries:', error);
  }
}

/**
 * Delete a specific entry by ID
 */
async function deleteEntry(entryId) {
  console.log(`🗑️  Deleting entry: ${entryId}...\n`);
  
  try {
    // Get the entry first to show what we're deleting
    const entryDoc = await db.collection('identity-entries').doc(entryId).get();
    
    if (!entryDoc.exists) {
      console.log('❌ Entry not found.');
      return;
    }
    
    const data = entryDoc.data();
    console.log('Entry details:');
    console.log(`  Type: ${data.verificationType || 'Unknown'}`);
    console.log(`  Email: ${data.email || 'Unknown'}`);
    console.log(`  Status: ${data.status || 'Unknown'}`);
    console.log('');
    
    // Confirm deletion
    console.log('⚠️  This will permanently delete the entry from the database.');
    console.log('⚠️  The identity number will be available for re-verification.');
    console.log('');
    
    // Delete the entry
    await db.collection('identity-entries').doc(entryId).delete();
    
    console.log('✅ Entry deleted successfully!');
    console.log('');
    console.log('Note: You may also want to update the list statistics:');
    console.log(`  List ID: ${data.listId}`);
    
    // Update list statistics
    if (data.listId) {
      const listRef = db.collection('identity-lists').doc(data.listId);
      await listRef.update({
        verifiedCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ List statistics updated (verifiedCount decremented)');
    }
    
  } catch (error) {
    console.error('❌ Error deleting entry:', error);
  }
}

/**
 * Delete all verified entries (use with caution!)
 */
async function deleteAllVerified() {
  console.log('⚠️  WARNING: This will delete ALL verified entries!');
  console.log('⚠️  This action cannot be undone!');
  console.log('');
  console.log('To proceed, run:');
  console.log('node scripts/delete-verified-test-records.js delete-all-confirmed');
}

/**
 * Actually delete all verified entries (requires confirmation)
 */
async function deleteAllVerifiedConfirmed() {
  console.log('🗑️  Deleting all verified entries...\n');
  
  try {
    const snapshot = await db.collection('identity-entries')
      .where('status', '==', 'verified')
      .get();
    
    if (snapshot.empty) {
      console.log('No verified entries found.');
      return;
    }
    
    console.log(`Found ${snapshot.size} verified entries to delete.\n`);
    
    const batch = db.batch();
    const listUpdates = new Map();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      batch.delete(doc.ref);
      
      // Track list updates
      if (data.listId) {
        listUpdates.set(data.listId, (listUpdates.get(data.listId) || 0) + 1);
      }
    });
    
    // Commit batch delete
    await batch.commit();
    console.log(`✅ Deleted ${snapshot.size} entries`);
    
    // Update list statistics
    for (const [listId, count] of listUpdates.entries()) {
      await db.collection('identity-lists').doc(listId).update({
        verifiedCount: admin.firestore.FieldValue.increment(-count),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log(`✅ Updated ${listUpdates.size} lists`);
    
  } catch (error) {
    console.error('❌ Error deleting entries:', error);
  }
}

// Main execution
const command = process.argv[2];
const arg = process.argv[3];

(async () => {
  try {
    switch (command) {
      case 'list':
        await listVerifiedEntries();
        break;
      case 'delete':
        if (!arg) {
          console.log('❌ Please provide an entry ID to delete.');
          console.log('Usage: node scripts/delete-verified-test-records.js delete <entryId>');
        } else {
          await deleteEntry(arg);
        }
        break;
      case 'delete-all':
        await deleteAllVerified();
        break;
      case 'delete-all-confirmed':
        await deleteAllVerifiedConfirmed();
        break;
      default:
        console.log('Usage:');
        console.log('  node scripts/delete-verified-test-records.js list');
        console.log('  node scripts/delete-verified-test-records.js delete <entryId>');
        console.log('  node scripts/delete-verified-test-records.js delete-all');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
