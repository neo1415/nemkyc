/**
 * DataNormalizer Service
 * 
 * This service applies normalization transformations to API response data
 * before populating form fields. It uses individual normalizer functions
 * and handles errors gracefully by skipping problematic fields.
 */

import {
  normalizeGender,
  normalizeDate,
  normalizePhone,
  normalizeString,
  normalizeCompanyName,
  normalizeRCNumber
} from '../../utils/autoFill/normalizers';

/**
 * Normalized NIN data structure
 */
export interface NormalizedNINData {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'male' | 'female' | '';
  dateOfBirth: string; // YYYY-MM-DD format
  phoneNumber?: string;
  birthstate?: string;
  birthlga?: string;
}

/**
 * Normalized CAC data structure
 */
export interface NormalizedCACData {
  companyName: string;
  registrationNumber: string;
  registrationDate: string; // YYYY-MM-DD format
  companyStatus: string;
  typeOfEntity?: string;
}

/**
 * DataNormalizer class
 * 
 * Provides methods to normalize NIN and CAC API response data
 */
export class DataNormalizer {
  /**
   * Normalizes NIN verification response data
   * 
   * Applies normalization to each field:
   * - firstName, middleName, lastName: string normalization
   * - gender: gender normalization (M/F → male/female)
   * - dateOfBirth: date normalization (various formats → YYYY-MM-DD)
   * - phoneNumber: phone normalization (+234 → 0, 11 digits)
   * - birthstate, birthlga: string normalization
   * 
   * Handles errors gracefully: if normalization fails for a field,
   * logs the error and skips that field without blocking others
   * 
   * @param rawData - Raw data from NIN verification API
   * @returns Normalized NIN data
   */
  normalizeNINData(rawData: any): NormalizedNINData {
    const normalized: NormalizedNINData = {
      firstName: '',
      lastName: '',
      gender: '',
      dateOfBirth: ''
    };

    try {
      // Normalize firstName (required)
      if (rawData.firstName) {
        normalized.firstName = normalizeString(rawData.firstName);
      }
    } catch (error) {
      console.error('Error normalizing firstName:', error);
    }

    try {
      // Normalize middleName (optional)
      if (rawData.middleName) {
        normalized.middleName = normalizeString(rawData.middleName);
      }
    } catch (error) {
      console.error('Error normalizing middleName:', error);
    }

    try {
      // Normalize lastName (required)
      if (rawData.lastName) {
        normalized.lastName = normalizeString(rawData.lastName);
      }
    } catch (error) {
      console.error('Error normalizing lastName:', error);
    }

    try {
      // Normalize gender (required)
      if (rawData.gender) {
        const normalizedGender = normalizeGender(rawData.gender);
        normalized.gender = normalizedGender as 'male' | 'female' | '';
      }
    } catch (error) {
      console.error('Error normalizing gender:', error);
    }

    try {
      // Normalize dateOfBirth (required)
      if (rawData.dateOfBirth) {
        normalized.dateOfBirth = normalizeDate(rawData.dateOfBirth);
      }
    } catch (error) {
      console.error('Error normalizing dateOfBirth:', error);
    }

    try {
      // Normalize phoneNumber (optional)
      if (rawData.phoneNumber) {
        normalized.phoneNumber = normalizePhone(rawData.phoneNumber);
      }
    } catch (error) {
      console.error('Error normalizing phoneNumber:', error);
    }

    try {
      // Normalize birthstate (optional)
      if (rawData.birthstate) {
        normalized.birthstate = normalizeString(rawData.birthstate);
      }
    } catch (error) {
      console.error('Error normalizing birthstate:', error);
    }

    try {
      // Normalize birthlga (optional)
      if (rawData.birthlga) {
        normalized.birthlga = normalizeString(rawData.birthlga);
      }
    } catch (error) {
      console.error('Error normalizing birthlga:', error);
    }

    return normalized;
  }

  /**
   * Normalizes CAC verification response data
   * 
   * Applies normalization to each field:
   * - name: company name normalization (Ltd → Limited, PLC → Public Limited Company)
   * - registrationNumber: RC number normalization (removes RC prefix)
   * - registrationDate: date normalization (various formats → YYYY-MM-DD)
   * - companyStatus: string normalization
   * - typeOfEntity: string normalization
   * 
   * Handles errors gracefully: if normalization fails for a field,
   * logs the error and skips that field without blocking others
   * 
   * @param rawData - Raw data from CAC verification API
   * @returns Normalized CAC data
   */
  normalizeCACData(rawData: any): NormalizedCACData {
    const normalized: NormalizedCACData = {
      companyName: '',
      registrationNumber: '',
      registrationDate: '',
      companyStatus: ''
    };

    try {
      // Normalize company name (required)
      if (rawData.name) {
        normalized.companyName = normalizeCompanyName(rawData.name);
      }
    } catch (error) {
      console.error('Error normalizing company name:', error);
    }

    try {
      // Normalize registration number (required)
      if (rawData.registrationNumber) {
        normalized.registrationNumber = normalizeRCNumber(rawData.registrationNumber);
      }
    } catch (error) {
      console.error('Error normalizing registrationNumber:', error);
    }

    try {
      // Normalize registration date (required)
      if (rawData.registrationDate) {
        normalized.registrationDate = normalizeDate(rawData.registrationDate);
      }
    } catch (error) {
      console.error('Error normalizing registrationDate:', error);
    }

    try {
      // Normalize company status (required)
      if (rawData.companyStatus) {
        normalized.companyStatus = normalizeString(rawData.companyStatus);
      }
    } catch (error) {
      console.error('Error normalizing companyStatus:', error);
    }

    try {
      // Normalize type of entity (optional)
      if (rawData.typeOfEntity) {
        normalized.typeOfEntity = normalizeString(rawData.typeOfEntity);
      }
    } catch (error) {
      console.error('Error normalizing typeOfEntity:', error);
    }

    return normalized;
  }
}
