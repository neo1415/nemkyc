/**
 * Migration Service
 * 
 * Handles data migration for adding formType metadata to existing KYC records.
 * This service ensures backward compatibility by marking existing records as "legacy".
 */

import { collection, getDocs, writeBatch, doc, Timestamp, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface MigrationResult {
  success: boolean;
  totalRecords: number;
  migratedRecords: number;
  errors: string[];
  timestamp: Date;
}

export interface MigrationLog {
  id: string;
  collectionName: string;
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  errors: string[];
  startedAt: Date;
  completedAt: Date;
  status: 'success' | 'partial' | 'failed';
}

class MigrationService {
  /**
   * Migrate existing records in a collection
   * Adds formType: 'legacy' to records that don't have formType
   */
  async migrateCollection(
    collectionName: string,
    formVariant: 'individual' | 'corporate'
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      totalRecords: 0,
      migratedRecords: 0,
      errors: [],
      timestamp: new Date()
    };

    try {
      console.log(`🔄 Starting migration for ${collectionName}...`);

      // Query records without formType field
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      result.totalRecords = snapshot.size;
      console.log(`📊 Found ${result.totalRecords} total records in ${collectionName}`);

      if (snapshot.empty) {
        console.log(`✅ No records to migrate in ${collectionName}`);
        result.success = true;
        return result;
      }

      // Process records in batches of 500 (Firestore limit)
      const batchSize = 500;
      let batch = writeBatch(db);
      let batchCount = 0;
      let recordsToMigrate = 0;

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();

        // Only migrate records that don't have formType
        if (!data.formType) {
          recordsToMigrate++;

          const docRef = doc(db, collectionName, docSnapshot.id);
          batch.update(docRef, {
            formType: 'legacy',
            formVariant: formVariant,
            migratedAt: Timestamp.now(),
            migrationVersion: '1.0.0'
          });

          batchCount++;

          // Commit batch when it reaches the limit
          if (batchCount === batchSize) {
            await batch.commit();
            console.log(`✅ Committed batch of ${batchCount} records`);
            batch = writeBatch(db);
            batchCount = 0;
          }
        }
      }

      // Commit remaining records
      if (batchCount > 0) {
        await batch.commit();
        console.log(`✅ Committed final batch of ${batchCount} records`);
      }

      result.migratedRecords = recordsToMigrate;
      result.success = true;

      console.log(`✅ Migration completed for ${collectionName}`);
      console.log(`📊 Migrated ${result.migratedRecords} out of ${result.totalRecords} records`);

      return result;
    } catch (error) {
      console.error(`❌ Migration failed for ${collectionName}:`, error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Migrate all existing KYC records
   */
  async migrateExistingRecords(): Promise<{
    individualKYC: MigrationResult;
    corporateKYC: MigrationResult;
  }> {
    console.log('🚀 Starting migration for all KYC collections...');

    const individualKYC = await this.migrateCollection('Individual-kyc-form', 'individual');
    const corporateKYC = await this.migrateCollection('corporate-kyc-form', 'corporate');

    console.log('✅ Migration completed for all collections');

    return {
      individualKYC,
      corporateKYC
    };
  }

  /**
   * Create migration log entry
   */
  async createMigrationLog(
    collectionName: string,
    result: MigrationResult
  ): Promise<void> {
    try {
      const logEntry: Omit<MigrationLog, 'id'> = {
        collectionName,
        totalRecords: result.totalRecords,
        migratedRecords: result.migratedRecords,
        failedRecords: result.totalRecords - result.migratedRecords,
        errors: result.errors,
        startedAt: result.timestamp,
        completedAt: new Date(),
        status: result.success ? 'success' : result.errors.length > 0 ? 'partial' : 'failed'
      };

      const logsRef = collection(db, 'migration-logs');
      await writeBatch(db).set(doc(logsRef), logEntry).commit();

      console.log(`📝 Migration log created for ${collectionName}`);
    } catch (error) {
      console.error('❌ Failed to create migration log:', error);
    }
  }

  /**
   * Verify migration integrity
   * Checks that all records have formType field
   */
  async verifyMigration(collectionName: string): Promise<{
    total: number;
    migrated: number;
    unmigrated: number;
    legacy: number;
    kyc: number;
    nfiu: number;
  }> {
    try {
      console.log(`🔍 Verifying migration for ${collectionName}...`);

      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);

      let migrated = 0;
      let unmigrated = 0;
      let legacy = 0;
      let kyc = 0;
      let nfiu = 0;

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();

        if (data.formType) {
          migrated++;
          if (data.formType === 'legacy') legacy++;
          else if (data.formType === 'kyc') kyc++;
          else if (data.formType === 'nfiu') nfiu++;
        } else {
          unmigrated++;
        }
      }

      const result = {
        total: snapshot.size,
        migrated,
        unmigrated,
        legacy,
        kyc,
        nfiu
      };

      console.log(`📊 Verification results for ${collectionName}:`, result);

      return result;
    } catch (error) {
      console.error(`❌ Verification failed for ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Rollback migration
   * Removes migration metadata from records
   */
  async rollbackMigration(collectionName: string): Promise<{
    success: boolean;
    rolledBackRecords: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      rolledBackRecords: 0,
      errors: [] as string[]
    };

    try {
      console.log(`🔄 Starting rollback for ${collectionName}...`);

      // Query records with formType: 'legacy'
      const collectionRef = collection(db, collectionName);
      const q = query(collectionRef, where('formType', '==', 'legacy'));
      const snapshot = await getDocs(q);

      console.log(`📊 Found ${snapshot.size} legacy records to rollback`);

      if (snapshot.empty) {
        console.log(`✅ No records to rollback in ${collectionName}`);
        result.success = true;
        return result;
      }

      // Process records in batches
      const batchSize = 500;
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const docSnapshot of snapshot.docs) {
        const docRef = doc(db, collectionName, docSnapshot.id);
        
        // Remove migration metadata
        batch.update(docRef, {
          formType: null,
          formVariant: null,
          migratedAt: null,
          migrationVersion: null
        });

        batchCount++;
        result.rolledBackRecords++;

        if (batchCount === batchSize) {
          await batch.commit();
          console.log(`✅ Rolled back batch of ${batchCount} records`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      // Commit remaining records
      if (batchCount > 0) {
        await batch.commit();
        console.log(`✅ Rolled back final batch of ${batchCount} records`);
      }

      result.success = true;
      console.log(`✅ Rollback completed for ${collectionName}`);
      console.log(`📊 Rolled back ${result.rolledBackRecords} records`);

      return result;
    } catch (error) {
      console.error(`❌ Rollback failed for ${collectionName}:`, error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }
}

export const migrationService = new MigrationService();

