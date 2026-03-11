/**
 * Simple Document Verification Matcher
 * 
 * This service provides straightforward document verification:
 * - For NIN: Extract NIN, first name, last name, gender -> Match exactly
 * - For CAC: Extract company name, CAC number, incorporation date -> Match exactly
 * 
 * No confidence scores, no complex similarity algorithms - just simple matching.
 */

import { IndividualData, CACData, VerificationResult, FieldMismatch } from '../types/geminiDocumentVerification';

export class SimpleVerificationMatcher {
  
  /**
   * Verify Individual (NIN) Document
   * Extracts: NIN, firstName, lastName, gender
   * Matches against form data exactly
   */
  async verifyIndividualDocument(
    extractedData: IndividualData,
    formData: any
  ): Promise<VerificationResult> {
    try {
      const mismatches: FieldMismatch[] = [];
      let isMatch = true;

      // Validate input data
      if (!extractedData) {
        throw new Error('No document data was extracted. Please ensure the document is clear and readable.');
      }

      if (!formData) {
        // If no form data provided, just return success with extracted data
        return {
          success: true,
          isMatch: true,
          confidence: 100,
          mismatches: [],
          officialData: extractedData,
          processingTime: 0
        };
      }

      // Extract names from full name
      const extractedNames = this.parseFullName(extractedData.fullName);
      const formNames = {
        firstName: formData.firstName || formData.first_name || '',
        lastName: formData.lastName || formData.last_name || formData.surname || ''
      };

      // 1. Match NIN (exact)
      if (extractedData.nin && formData.nin) {
        if (extractedData.nin !== formData.nin) {
          mismatches.push({
            field: 'nin',
            extractedValue: extractedData.nin,
            expectedValue: formData.nin,
            similarity: 0,
            isCritical: true,
            reason: 'NIN numbers do not match'
          });
          isMatch = false;
        }
      }

      // 2. Match First Name (case-insensitive)
      if (extractedNames.firstName && formNames.firstName) {
        if (!this.namesMatch(extractedNames.firstName, formNames.firstName)) {
          mismatches.push({
            field: 'firstName',
            extractedValue: extractedNames.firstName,
            expectedValue: formNames.firstName,
            similarity: 0,
            isCritical: true,
            reason: 'First names do not match'
          });
          isMatch = false;
        }
      }

      // 3. Match Last Name (case-insensitive)
      if (extractedNames.lastName && formNames.lastName) {
        if (!this.namesMatch(extractedNames.lastName, formNames.lastName)) {
          mismatches.push({
            field: 'lastName',
            extractedValue: extractedNames.lastName,
            expectedValue: formNames.lastName,
            similarity: 0,
            isCritical: true,
            reason: 'Last names do not match'
          });
          isMatch = false;
        }
      }

      // 4. Match Gender (case-insensitive)
      if (extractedData.gender && formData.gender) {
        if (!this.genderMatch(extractedData.gender, formData.gender)) {
          mismatches.push({
            field: 'gender',
            extractedValue: extractedData.gender,
            expectedValue: formData.gender,
            similarity: 0,
            isCritical: false,
            reason: 'Gender does not match'
          });
          // Note: Gender mismatch doesn't fail verification, just noted
        }
      }

      return {
        success: true,
        isMatch,
        confidence: isMatch ? 100 : 0,
        mismatches,
        officialData: extractedData,
        processingTime: 0
      };

    } catch (error) {
      console.error('Individual document verification error:', error);
      
      return {
        success: false,
        isMatch: false,
        confidence: 0,
        mismatches: [],
        officialData: extractedData,
        processingTime: 0,
        error: error instanceof Error ? error.message : 'Document verification failed'
      };
    }
  }

  /**
   * Verify Corporate (CAC) Document
   * Extracts: companyName, cacNumber, incorporationDate
   * Matches against form data exactly
   */
  async verifyCACDocument(
    extractedData: CACData,
    formData: any
  ): Promise<VerificationResult> {
    try {
      const mismatches: FieldMismatch[] = [];
      let isMatch = true;

      // Validate input data
      if (!extractedData) {
        throw new Error('No document data was extracted. Please ensure the document is clear and readable.');
      }

      if (!formData) {
        // If no form data provided, just return success with extracted data
        return {
          success: true,
          isMatch: true,
          confidence: 100,
          mismatches: [],
          officialData: extractedData,
          processingTime: 0
        };
      }

      // 1. Match Company Name (case-insensitive, normalized)
      if (extractedData.companyName && formData.insured) {
        if (!this.companyNamesMatch(extractedData.companyName, formData.insured)) {
          mismatches.push({
            field: 'companyName',
            extractedValue: extractedData.companyName,
            expectedValue: formData.insured,
            similarity: 0,
            isCritical: true,
            reason: 'Company names do not match'
          });
          isMatch = false;
        }
      }

      // 2. Match CAC Number (exact)
      if (extractedData.rcNumber && formData.cacNumber) {
        if (extractedData.rcNumber !== formData.cacNumber) {
          mismatches.push({
            field: 'cacNumber',
            extractedValue: extractedData.rcNumber,
            expectedValue: formData.cacNumber,
            similarity: 0,
            isCritical: true,
            reason: 'CAC numbers do not match'
          });
          isMatch = false;
        }
      }

      // 3. Match Registration Date (normalized date comparison)
      if (extractedData.registrationDate && formData.incorporationDate) {
        const extractedDate = this.normalizeDate(extractedData.registrationDate);
        const formDate = this.normalizeDate(formData.incorporationDate);
        
        if (extractedDate !== formDate) {
          mismatches.push({
            field: 'registrationDate',
            extractedValue: extractedData.registrationDate,
            expectedValue: formData.incorporationDate,
            similarity: 0,
            isCritical: true,
            reason: 'Registration dates do not match'
          });
          isMatch = false;
        }
      }

      return {
        success: true,
        isMatch,
        confidence: isMatch ? 100 : 0,
        mismatches,
        officialData: extractedData,
        processingTime: 0
      };

    } catch (error) {
      console.error('CAC document verification error:', error);
      
      return {
        success: false,
        isMatch: false,
        confidence: 0,
        mismatches: [],
        officialData: extractedData,
        processingTime: 0,
        error: error instanceof Error ? error.message : 'Document verification failed'
      };
    }
  }

  /**
   * Parse full name into first and last name
   * Handles cases like "DANIEL ADEMOLA OYENIYI" -> firstName: "DANIEL", lastName: "OYENIYI"
   */
  private parseFullName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName) {
      console.log('⚠️ No full name provided for parsing');
      return { firstName: '', lastName: '' };
    }
    
    const nameParts = fullName.trim().split(/\s+/);
    console.log('📝 Parsing full name:', fullName, '-> parts:', nameParts);
    
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: '' };
    } else if (nameParts.length === 2) {
      return { firstName: nameParts[0], lastName: nameParts[1] };
    } else {
      // For names with middle names, take first and last
      const result = { 
        firstName: nameParts[0], 
        lastName: nameParts[nameParts.length - 1] 
      };
      console.log('📝 Parsed name result:', result);
      return result;
    }
  }

  /**
   * Check if two names match (case-insensitive, handles middle names)
   */
  private namesMatch(name1: string, name2: string): boolean {
    if (!name1 || !name2) {
      console.log('⚠️ Name matching skipped - missing name:', { name1, name2 });
      return false;
    }
    
    const normalize = (name: string) => name.toLowerCase().trim();
    
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    console.log('🔍 Comparing names:', { n1, n2 });
    
    // Exact match
    if (n1 === n2) {
      console.log('✅ Exact name match');
      return true;
    }
    
    // Check if one name is contained in the other (handles middle names)
    // e.g., "Daniel" matches "Daniel Ademola" 
    const containsMatch = n1.includes(n2) || n2.includes(n1);
    console.log('🔍 Contains match:', containsMatch);
    
    return containsMatch;
  }

  /**
   * Check if company names match (case-insensitive, normalized)
   */
  private companyNamesMatch(name1: string, name2: string): boolean {
    if (!name1 || !name2) return false;
    
    const normalize = (name: string) => 
      name.toLowerCase()
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, ''); // Remove special characters
    
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    return n1 === n2;
  }

  /**
   * Check if genders match (case-insensitive)
   */
  private genderMatch(gender1: string, gender2: string): boolean {
    if (!gender1 || !gender2) return true; // If either is missing, don't fail
    
    const normalize = (gender: string) => {
      const g = gender.toLowerCase().trim();
      if (g.startsWith('m')) return 'male';
      if (g.startsWith('f')) return 'female';
      return g;
    };
    
    return normalize(gender1) === normalize(gender2);
  }

  /**
   * Normalize date for comparison (YYYY-MM-DD format)
   */
  private normalizeDate(dateStr: string): string {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr; // Return original if invalid
      
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return dateStr; // Return original if parsing fails
    }
  }
}

export const simpleVerificationMatcher = new SimpleVerificationMatcher();