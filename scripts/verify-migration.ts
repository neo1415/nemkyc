/**
 * KYC Data Migration Verification Script
 * 
 * This script verifies the integrity of the KYC data migration.
 * It checks that all records have the formType field and reports any inconsistencies.
 * 
 * Usage:
 *   npm run verify:kyc
 * 
 * Or with Node:
 *   npx ts-node scripts/verify-migration.ts
 */

import { migrationService } from '../src/services/migrationService';

async function main() {
  console.log('='.repeat(60));
  console.log('KYC DATA MIGRATION VERIFICATION SCRIPT');
  console.log('='.repeat(60));
  console.log('');
  console.log('Verifying migration integrity...');
  console.log('');

  try {
    // Verify Individual KYC Forms
    console.log('='.repeat(60));
    console.log('INDIVIDUAL KYC FORMS');
    console.log('='.repeat(60));
    console.log('');

    const individualVerification = await migrationService.verifyMigration('Individual-kyc-form');
    
    console.log('Record Counts:');
    console.log(`  Total Records: ${individualVerification.total}`);
    console.log(`  Migrated Records: ${individualVerification.migrated}`);
    console.log(`  Unmigrated Records: ${individualVerification.unmigrated}`);
    console.log('');

    console.log('Form Type Breakdown:');
    console.log(`  Legacy: ${individualVerification.legacy}`);
    console.log(`  KYC: ${individualVerification.kyc}`);
    console.log(`  NFIU: ${individualVerification.nfiu}`);
    console.log('');

    const individualPercentage = individualVerification.total > 0
      ? ((individualVerification.migrated / individualVerification.total) * 100).toFixed(2)
      : '0.00';
    console.log(`Migration Coverage: ${individualPercentage}%`);
    console.log('');

    if (individualVerification.unmigrated > 0) {
      console.log(`⚠️  WARNING: ${individualVerification.unmigrated} records are not migrated!`);
      console.log('');
    } else {
      console.log('✅ All records have been migrated.');
      console.log('');
    }

    // Verify Corporate KYC Forms
    console.log('='.repeat(60));
    console.log('CORPORATE KYC FORMS');
    console.log('='.repeat(60));
    console.log('');

    const corporateVerification = await migrationService.verifyMigration('corporate-kyc-form');
    
    console.log('Record Counts:');
    console.log(`  Total Records: ${corporateVerification.total}`);
    console.log(`  Migrated Records: ${corporateVerification.migrated}`);
    console.log(`  Unmigrated Records: ${corporateVerification.unmigrated}`);
    console.log('');

    console.log('Form Type Breakdown:');
    console.log(`  Legacy: ${corporateVerification.legacy}`);
    console.log(`  KYC: ${corporateVerification.kyc}`);
    console.log(`  NFIU: ${corporateVerification.nfiu}`);
    console.log('');

    const corporatePercentage = corporateVerification.total > 0
      ? ((corporateVerification.migrated / corporateVerification.total) * 100).toFixed(2)
      : '0.00';
    console.log(`Migration Coverage: ${corporatePercentage}%`);
    console.log('');

    if (corporateVerification.unmigrated > 0) {
      console.log(`⚠️  WARNING: ${corporateVerification.unmigrated} records are not migrated!`);
      console.log('');
    } else {
      console.log('✅ All records have been migrated.');
      console.log('');
    }

    // Overall Summary
    console.log('='.repeat(60));
    console.log('OVERALL SUMMARY');
    console.log('='.repeat(60));
    console.log('');

    const totalRecords = individualVerification.total + corporateVerification.total;
    const totalMigrated = individualVerification.migrated + corporateVerification.migrated;
    const totalUnmigrated = individualVerification.unmigrated + corporateVerification.unmigrated;
    const totalLegacy = individualVerification.legacy + corporateVerification.legacy;
    const totalKYC = individualVerification.kyc + corporateVerification.kyc;
    const totalNFIU = individualVerification.nfiu + corporateVerification.nfiu;

    console.log('Total Across All Collections:');
    console.log(`  Total Records: ${totalRecords}`);
    console.log(`  Migrated Records: ${totalMigrated}`);
    console.log(`  Unmigrated Records: ${totalUnmigrated}`);
    console.log('');

    console.log('Form Type Distribution:');
    console.log(`  Legacy: ${totalLegacy}`);
    console.log(`  KYC: ${totalKYC}`);
    console.log(`  NFIU: ${totalNFIU}`);
    console.log('');

    const overallPercentage = totalRecords > 0
      ? ((totalMigrated / totalRecords) * 100).toFixed(2)
      : '0.00';
    console.log(`Overall Migration Coverage: ${overallPercentage}%`);
    console.log('');

    // Status
    const allMigrated = totalUnmigrated === 0;
    
    if (allMigrated) {
      console.log('✅ VERIFICATION PASSED');
      console.log('');
      console.log('All records have been successfully migrated.');
      console.log('The migration is complete and the database is ready for use.');
    } else {
      console.log('⚠️  VERIFICATION WARNING');
      console.log('');
      console.log(`${totalUnmigrated} records are not migrated.`);
      console.log('');
      console.log('Recommended actions:');
      console.log('  1. Run the migration script again: npm run migrate:kyc');
      console.log('  2. Check for errors in the migration logs');
      console.log('  3. Manually inspect unmigrated records in Firestore');
    }

    console.log('');
    console.log('='.repeat(60));

    process.exit(allMigrated ? 0 : 1);
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('VERIFICATION FAILED');
    console.error('='.repeat(60));
    console.error('');
    console.error('Error:', error);
    console.error('');
    console.error('Unable to verify migration integrity.');
    console.error('Please check the error above and try again.');
    console.error('');
    console.error('='.repeat(60));
    process.exit(1);
  }
}

// Run the verification
main();

