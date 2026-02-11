/**
 * Migration Script: Encrypt Existing Identity Data
 * 
 * This script encrypts existing plaintext NIN, BVN, and CAC values in the database.
 * It should be run ONCE after deploying the encryption feature.
 * 
 * IMPORTANT:
 * 1. Backup your database before running this script
 * 2. Ensure ENCRYPTION_KEY is set in your environment
 * 3. Run in a maintenance window if possible
 * 4. Monitor the script output for any errors
 * 
 * Usage:
 *   node scripts/encrypt-existing-identity-data.js
 * 
 * Options:
 *   --dry-run    : Preview changes without modifying the database
 *   --batch-size : Number of entries to process at once (default: 50)
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { encryptData, isEncrypted } = require('../server-utils/encryption.cjs');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 50;

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = {
    type: process.env.TYPE,
    project_id: process.env.PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    universe_domain: process.env.UNIVERSE_DOMAIN
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();

/**
 * Main migration function
 */
async function migrateIdentityData() {
  console.log('🔐 Identity Data Encryption Migration');
  console.log('=====================================');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (database will be modified)'}`);
  console.log(`Batch size: ${batchSize}`);
  console.log('');
  
  // Check if encryption key is set
  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ERROR: ENCRYPTION_KEY environment variable is not set');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }
  
  console.log('✅ Encryption key found');
  console.log('');
  
  // Confirm before proceeding (unless dry run)
  if (!isDryRun) {
    console.log('⚠️  WARNING: This will modify your database!');
    console.log('⚠️  Make sure you have a backup before proceeding.');
    console.log('');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('');
  }
  
  const stats = {
    totalEntries: 0,
    entriesWithNIN: 0,
    entriesWithBVN: 0,
    entriesWithCAC: 0,
    alreadyEncryptedNIN: 0,
    alreadyEncryptedBVN: 0,
    alreadyEncryptedCAC: 0,
    encryptedNIN: 0,
    encryptedBVN: 0,
    encryptedCAC: 0,
    errors: 0
  };
  
  try {
    // Fetch all identity entries
    console.log('📋 Fetching identity entries...');
    const entriesSnapshot = await db.collection('identity-entries').get();
    stats.totalEntries = entriesSnapshot.size;
    console.log(`Found ${stats.totalEntries} entries`);
    console.log('');
    
    if (stats.totalEntries === 0) {
      console.log('ℹ️  No entries found. Nothing to migrate.');
      return;
    }
    
    // Process entries in batches
    const entries = entriesSnapshot.docs;
    let processedCount = 0;
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, Math.min(i + batchSize, entries.length));
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(entries.length / batchSize)} (${batch.length} entries)...`);
      
      // Process each entry in the batch
      const batchPromises = batch.map(async (entryDoc) => {
        const entryId = entryDoc.id;
        const entry = entryDoc.data();
        const updates = {};
        let hasUpdates = false;
        
        try {
          // Check and encrypt NIN
          if (entry.nin) {
            stats.entriesWithNIN++;
            
            if (isEncrypted(entry.nin)) {
              stats.alreadyEncryptedNIN++;
              console.log(`  ℹ️  Entry ${entryId}: NIN already encrypted`);
            } else if (typeof entry.nin === 'string' && entry.nin.trim()) {
              const encrypted = encryptData(entry.nin.trim());
              updates.nin = encrypted;
              hasUpdates = true;
              stats.encryptedNIN++;
              console.log(`  🔒 Entry ${entryId}: Encrypted NIN`);
            }
          }
          
          // Check and encrypt BVN
          if (entry.bvn) {
            stats.entriesWithBVN++;
            
            if (isEncrypted(entry.bvn)) {
              stats.alreadyEncryptedBVN++;
              console.log(`  ℹ️  Entry ${entryId}: BVN already encrypted`);
            } else if (typeof entry.bvn === 'string' && entry.bvn.trim()) {
              const encrypted = encryptData(entry.bvn.trim());
              updates.bvn = encrypted;
              hasUpdates = true;
              stats.encryptedBVN++;
              console.log(`  🔒 Entry ${entryId}: Encrypted BVN`);
            }
          }
          
          // Check and encrypt CAC
          if (entry.cac) {
            stats.entriesWithCAC++;
            
            if (isEncrypted(entry.cac)) {
              stats.alreadyEncryptedCAC++;
              console.log(`  ℹ️  Entry ${entryId}: CAC already encrypted`);
            } else if (typeof entry.cac === 'string' && entry.cac.trim()) {
              const encrypted = encryptData(entry.cac.trim());
              updates.cac = encrypted;
              hasUpdates = true;
              stats.encryptedCAC++;
              console.log(`  🔒 Entry ${entryId}: Encrypted CAC`);
            }
          }
          
          // Apply updates if not dry run
          if (hasUpdates && !isDryRun) {
            updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            await entryDoc.ref.update(updates);
          }
          
        } catch (error) {
          stats.errors++;
          console.error(`  ❌ Entry ${entryId}: Error - ${error.message}`);
        }
      });
      
      await Promise.all(batchPromises);
      processedCount += batch.length;
      
      console.log(`  Progress: ${processedCount}/${stats.totalEntries} entries processed`);
      console.log('');
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  // Print summary
  console.log('');
  console.log('=====================================');
  console.log('Migration Summary');
  console.log('=====================================');
  console.log(`Total entries processed: ${stats.totalEntries}`);
  console.log('');
  console.log('NIN:');
  console.log(`  - Entries with NIN: ${stats.entriesWithNIN}`);
  console.log(`  - Already encrypted: ${stats.alreadyEncryptedNIN}`);
  console.log(`  - Newly encrypted: ${stats.encryptedNIN}`);
  console.log('');
  console.log('BVN:');
  console.log(`  - Entries with BVN: ${stats.entriesWithBVN}`);
  console.log(`  - Already encrypted: ${stats.alreadyEncryptedBVN}`);
  console.log(`  - Newly encrypted: ${stats.encryptedBVN}`);
  console.log('');
  console.log('CAC:');
  console.log(`  - Entries with CAC: ${stats.entriesWithCAC}`);
  console.log(`  - Already encrypted: ${stats.alreadyEncryptedCAC}`);
  console.log(`  - Newly encrypted: ${stats.encryptedCAC}`);
  console.log('');
  console.log(`Errors: ${stats.errors}`);
  console.log('');
  
  if (isDryRun) {
    console.log('ℹ️  DRY RUN: No changes were made to the database');
    console.log('ℹ️  Run without --dry-run to apply changes');
  } else {
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify that encrypted data can be decrypted correctly');
    console.log('2. Test the verification flow with encrypted data');
    console.log('3. Monitor application logs for any decryption errors');
  }
  
  process.exit(0);
}

// Run migration
migrateIdentityData().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
