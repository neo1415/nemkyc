/**
 * Data Integrity Utilities for Identity Collection System
 * 
 * This module provides functions for appending verification data to identity entries
 * while preserving all original data fields.
 * 
 * Key principle: Original data in the `data` field must never be modified or lost
 * when verification results are appended.
 */

import { IdentityEntry, VerificationType } from '../types/remediation';

/**
 * Verification result data to be appended to an entry
 */
export interface VerificationResult {
  verificationType: VerificationType;
  identityNumber: string;
  companyName?: string;  // Required for CAC verification
  verifiedAt: Date;
}

/**
 * Appends verification data to an identity entry while preserving all original data.
 * 
 * This function ensures:
 * 1. All original columns in `data` are preserved exactly
 * 2. NIN or CAC is appended to dedicated fields (not mixed into `data`)
 * 3. Status is updated to 'verified'
 * 4. Verification timestamp is recorded
 * 
 * @param entry - The original identity entry
 * @param result - The verification result to append
 * @returns A new entry object with verification data appended
 */
export function appendVerificationData(
  entry: IdentityEntry,
  result: VerificationResult
): IdentityEntry {
  // Create a deep copy of the original data to ensure immutability
  const preservedData = JSON.parse(JSON.stringify(entry.data));
  
  // Build the updated entry
  const updatedEntry: IdentityEntry = {
    ...entry,
    // Preserve original data exactly
    data: preservedData,
    // Update verification fields
    status: 'verified',
    verifiedAt: result.verifiedAt,
    updatedAt: result.verifiedAt,
  };
  
  // Append NIN or CAC based on verification type
  if (result.verificationType === 'NIN') {
    updatedEntry.nin = result.identityNumber;
  } else if (result.verificationType === 'CAC') {
    updatedEntry.cac = result.identityNumber;
    if (result.companyName) {
      updatedEntry.cacCompanyName = result.companyName;
    }
  }
  
  return updatedEntry;
}

/**
 * Validates that all original data fields are preserved after verification.
 * 
 * @param originalEntry - The entry before verification
 * @param updatedEntry - The entry after verification
 * @returns true if all original data is preserved, false otherwise
 */
export function validateDataPreservation(
  originalEntry: IdentityEntry,
  updatedEntry: IdentityEntry
): boolean {
  // Check that all original data keys exist in updated entry
  const originalKeys = Object.keys(originalEntry.data);
  const updatedKeys = Object.keys(updatedEntry.data);
  
  // Must have same number of keys
  if (originalKeys.length !== updatedKeys.length) {
    return false;
  }
  
  // Each original key must exist with same value
  for (const key of originalKeys) {
    if (!(key in updatedEntry.data)) {
      return false;
    }
    // Deep equality check for values
    if (JSON.stringify(originalEntry.data[key]) !== JSON.stringify(updatedEntry.data[key])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates that verification data was correctly appended.
 * 
 * @param entry - The entry after verification
 * @param result - The verification result that was appended
 * @returns true if verification data is correctly appended, false otherwise
 */
export function validateVerificationAppend(
  entry: IdentityEntry,
  result: VerificationResult
): boolean {
  // Status must be 'verified'
  if (entry.status !== 'verified') {
    return false;
  }
  
  // Verified timestamp must be set
  if (!entry.verifiedAt) {
    return false;
  }
  
  // Check NIN or CAC based on verification type
  if (result.verificationType === 'NIN') {
    return entry.nin === result.identityNumber;
  } else if (result.verificationType === 'CAC') {
    if (entry.cac !== result.identityNumber) {
      return false;
    }
    // If company name was provided, it must be stored
    if (result.companyName && entry.cacCompanyName !== result.companyName) {
      return false;
    }
    return true;
  }
  
  return false;
}
