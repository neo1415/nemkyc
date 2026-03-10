/**
 * KYC Data Migration Script
 * 
 * This script migrates existing KYC records by adding formType metadata.
 * Records without formType will be marked as "legacy" for backward compatibility.
 * 
 * Usage:
 *   npm run migrate:kyc
 * 
 * Or with Node:
 *   npx ts-node scripts/migrate-kyc-data.ts
 */

import { migrationService } from '../src/services/migrationService';

async function main() {
  console.log('='.repeat(60));
  console.log('KYC DATA MIGRATION SCRIPT');
  console.log('='.repeat(60));
  console.log('');
  console.log('This script will add formType metadata to existing KYC records.');
  console.log('Records without formType will be marked as "legacy".');
  console.log('');
  console.log('Starting migration...');
  console.log('');

  try {
    // Run migration
    const results = await migrationService.migrateExistingRecords();

    // Display results
    console.log('');
    console.log('='.repeat(60));
    console.log('MIGRATION RESULTS');
    console.log('='.repeat(60));
    console.log('');

    console.log('Individual KYC Forms:');
    console.log(`  Total Records: ${results.individualKYC.totalRecords}`);
    console.log(`  Migrated: ${results.individualKYC.migratedRecords}`);
    console.log(`  Success: ${results.individualKYC.success ? '✅' : '❌'}`);
    if (results.individualKYC.errors.length > 0) {
      console.log(`  Errors: ${results.individualKYC.errors.join(', ')}`);
    }
    console.log('');

    console.log('Corporate KYC Forms:');
    console.log(`  Total Records: ${results.corporateKYC.totalRecords}`);
    console.log(`  Migrated: ${results.corporateKYC.migratedRecords}`);
    console.log(`  Success: ${results.corporateKYC.success ? '✅' : '❌'}`);
    if (results.corporateKYC.errors.length > 0) {
      console.log(`  Errors: ${results.corporateKYC.errors.join(', ')}`);
    }
    console.log('');

    // Create migration logs
    await migrationService.createMigrationLog('Individual-kyc-form', results.individualKYC);
    await migrationService.createMigrationLog('corporate-kyc-form', results.corporateKYC);

    // Verify migration
    console.log('='.repeat(60));
    console.log('VERIFICATION');
    console.log('='.repeat(60));
    console.log('');

    const individualVerification = await migrationService.verifyMigration('Individual-kyc-form');
    console.log('Individual KYC Forms:');
    console.log(`  Total: ${individualVerification.total}`);
    console.log(`  Migrated: ${individualVerification.migrated}`);
    console.log(`  Unmigrated: ${individualVerification.unmigrated}`);
    console.log(`  Legacy: ${individualVerification.legacy}`);
    console.log(`  KYC: ${individualVerification.kyc}`);
    console.log(`  NFIU: ${individualVerification.nfiu}`);
    console.log('');

    const corporateVerification = await migrationService.verifyMigration('corporate-kyc-form');
    console.log('Corporate KYC Forms:');
    console.log(`  Total: ${corporateVerification.total}`);
    console.log(`  Migrated: ${corporateVerification.migrated}`);
    console.log(`  Unmigrated: ${corporateVerification.unmigrated}`);
    console.log(`  Legacy: ${corporateVerification.legacy}`);
    console.log(`  KYC: ${corporateVerification.kyc}`);
    console.log(`  NFIU: ${corporateVerification.nfiu}`);
    console.log('');

    // Summary
    const totalSuccess = results.individualKYC.success && results.corporateKYC.success;
    const totalMigrated = results.individualKYC.migratedRecords + results.corporateKYC.migratedRecords;
    const totalRecords = results.individualKYC.totalRecords + results.corporateKYC.totalRecords;

    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Total Records: ${totalRecords}`);
    console.log(`Total Migrated: ${totalMigrated}`);
    console.log(`Overall Status: ${totalSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('');

    if (totalSuccess) {
      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Review the migration logs in Firestore (migration-logs collection)');
      console.log('  2. Test the application to ensure everything works correctly');
      console.log('  3. If issues arise, run the rollback script: npm run rollback:kyc');
    } else {
      console.log('❌ Migration completed with errors.');
      console.log('');
      console.log('Please review the errors above and try again.');
      console.log('If needed, run the rollback script: npm run rollback:kyc');
    }

    console.log('');
    console.log('='.repeat(60));

    process.exit(totalSuccess ? 0 : 1);
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('MIGRATION FAILED');
    console.error('='.repeat(60));
    console.error('');
    console.error('Error:', error);
    console.error('');
    console.error('The migration has been aborted.');
    console.error('No changes have been committed to the database.');
    console.error('');
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run the migration
main();

