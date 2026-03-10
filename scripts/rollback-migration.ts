/**
 * KYC Data Migration Rollback Script
 * 
 * This script rolls back the KYC data migration by removing formType metadata
 * from records that were marked as "legacy".
 * 
 * Usage:
 *   npm run rollback:kyc
 * 
 * Or with Node:
 *   npx ts-node scripts/rollback-migration.ts
 */

import { migrationService } from '../src/services/migrationService';
import * as readline from 'readline';

async function confirmRollback(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Are you sure you want to rollback the migration? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  console.log('='.repeat(60));
  console.log('KYC DATA MIGRATION ROLLBACK SCRIPT');
  console.log('='.repeat(60));
  console.log('');
  console.log('⚠️  WARNING: This script will remove formType metadata from legacy records.');
  console.log('This will restore the database to its pre-migration state.');
  console.log('');

  // Confirm rollback
  const confirmed = await confirmRollback();

  if (!confirmed) {
    console.log('');
    console.log('Rollback cancelled.');
    console.log('');
    process.exit(0);
  }

  console.log('');
  console.log('Starting rollback...');
  console.log('');

  try {
    // Verify current state before rollback
    console.log('='.repeat(60));
    console.log('CURRENT STATE (BEFORE ROLLBACK)');
    console.log('='.repeat(60));
    console.log('');

    const individualBefore = await migrationService.verifyMigration('Individual-kyc-form');
    console.log('Individual KYC Forms:');
    console.log(`  Total: ${individualBefore.total}`);
    console.log(`  Migrated: ${individualBefore.migrated}`);
    console.log(`  Legacy: ${individualBefore.legacy}`);
    console.log('');

    const corporateBefore = await migrationService.verifyMigration('corporate-kyc-form');
    console.log('Corporate KYC Forms:');
    console.log(`  Total: ${corporateBefore.total}`);
    console.log(`  Migrated: ${corporateBefore.migrated}`);
    console.log(`  Legacy: ${corporateBefore.legacy}`);
    console.log('');

    // Run rollback
    console.log('='.repeat(60));
    console.log('ROLLING BACK MIGRATION');
    console.log('='.repeat(60));
    console.log('');

    const individualResult = await migrationService.rollbackMigration('Individual-kyc-form');
    console.log('Individual KYC Forms:');
    console.log(`  Rolled Back: ${individualResult.rolledBackRecords}`);
    console.log(`  Success: ${individualResult.success ? '✅' : '❌'}`);
    if (individualResult.errors.length > 0) {
      console.log(`  Errors: ${individualResult.errors.join(', ')}`);
    }
    console.log('');

    const corporateResult = await migrationService.rollbackMigration('corporate-kyc-form');
    console.log('Corporate KYC Forms:');
    console.log(`  Rolled Back: ${corporateResult.rolledBackRecords}`);
    console.log(`  Success: ${corporateResult.success ? '✅' : '❌'}`);
    if (corporateResult.errors.length > 0) {
      console.log(`  Errors: ${corporateResult.errors.join(', ')}`);
    }
    console.log('');

    // Verify rollback
    console.log('='.repeat(60));
    console.log('VERIFICATION (AFTER ROLLBACK)');
    console.log('='.repeat(60));
    console.log('');

    const individualAfter = await migrationService.verifyMigration('Individual-kyc-form');
    console.log('Individual KYC Forms:');
    console.log(`  Total: ${individualAfter.total}`);
    console.log(`  Migrated: ${individualAfter.migrated}`);
    console.log(`  Unmigrated: ${individualAfter.unmigrated}`);
    console.log(`  Legacy: ${individualAfter.legacy}`);
    console.log('');

    const corporateAfter = await migrationService.verifyMigration('corporate-kyc-form');
    console.log('Corporate KYC Forms:');
    console.log(`  Total: ${corporateAfter.total}`);
    console.log(`  Migrated: ${corporateAfter.migrated}`);
    console.log(`  Unmigrated: ${corporateAfter.unmigrated}`);
    console.log(`  Legacy: ${corporateAfter.legacy}`);
    console.log('');

    // Summary
    const totalSuccess = individualResult.success && corporateResult.success;
    const totalRolledBack = individualResult.rolledBackRecords + corporateResult.rolledBackRecords;

    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log('');
    console.log(`Total Rolled Back: ${totalRolledBack}`);
    console.log(`Overall Status: ${totalSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('');

    if (totalSuccess) {
      console.log('✅ Rollback completed successfully!');
      console.log('');
      console.log('The database has been restored to its pre-migration state.');
      console.log('All formType metadata has been removed from legacy records.');
    } else {
      console.log('❌ Rollback completed with errors.');
      console.log('');
      console.log('Please review the errors above.');
      console.log('Some records may not have been rolled back correctly.');
    }

    console.log('');
    console.log('='.repeat(60));

    process.exit(totalSuccess ? 0 : 1);
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('ROLLBACK FAILED');
    console.error('='.repeat(60));
    console.error('');
    console.error('Error:', error);
    console.error('');
    console.error('The rollback has been aborted.');
    console.error('The database may be in an inconsistent state.');
    console.error('Please review the error and try again.');
    console.error('');
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run the rollback
main();

