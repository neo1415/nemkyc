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

      // Extract names from document - use pre-parsed names from backend
      const extractedNames = {
        firstName: extractedData.firstName || '',
        middleName: extractedData.middleName || '',
        lastName: extractedData.lastName || ''
      };
      
      const formNames = {
        firstName: formData.firstName || formData.first_name || '',
        middleName: formData.middleName || formData.middle_name || '',
        lastName: formData.lastName || formData.last_name || formData.surname || ''
      };

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📝 NIN DOCUMENT VERIFICATION - NAME MATCHING');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📄 Extracted from Document AI:');
      console.log('   - Full Name:', extractedData.fullName);
      console.log('   - First Name:', extractedNames.firstName);
      console.log('   - Middle Name:', extractedNames.middleName);
      console.log('   - Last Name:', extractedNames.lastName);
      console.log('📋 From Form Data:');
      console.log('   - First Name:', formNames.firstName);
      console.log('   - Middle Name:', formNames.middleName);
      console.log('   - Last Name:', formNames.lastName);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
        const firstNameMatches = this.namesMatch(extractedNames.firstName, formNames.firstName);
        console.log('');
        console.log('🔍 First Name Match Result:', firstNameMatches ? '✅ MATCH' : '❌ NO MATCH');
        
        if (!firstNameMatches) {
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

      // 3. Match Middle Name (case-insensitive, optional)
      if (extractedNames.middleName && formNames.middleName) {
        const middleNameMatches = this.namesMatch(extractedNames.middleName, formNames.middleName);
        console.log('');
        console.log('🔍 Middle Name Match Result:', middleNameMatches ? '✅ MATCH' : '❌ NO MATCH');
        
        if (!middleNameMatches) {
          mismatches.push({
            field: 'middleName',
            extractedValue: extractedNames.middleName,
            expectedValue: formNames.middleName,
            similarity: 0,
            isCritical: false, // Middle name mismatch is not critical
            reason: 'Middle names do not match'
          });
          // Note: Middle name mismatch doesn't fail verification, just noted
        }
      }

      // 4. Match Last Name (case-insensitive)
      if (extractedNames.lastName && formNames.lastName) {
        const lastNameMatches = this.namesMatch(extractedNames.lastName, formNames.lastName);
        console.log('');
        console.log('🔍 Last Name Match Result:', lastNameMatches ? '✅ MATCH' : '❌ NO MATCH');
        
        if (!lastNameMatches) {
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

      // 5. Match Gender (case-insensitive)
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

      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 VERIFICATION SUMMARY');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Overall Match:', isMatch ? '✅ SUCCESS' : '❌ FAILED');
      console.log('Mismatches Found:', mismatches.length);
      if (mismatches.length > 0) {
        console.log('Mismatch Details:');
        mismatches.forEach(m => {
          console.log(`  - ${m.field}: "${m.expectedValue}" (form) vs "${m.extractedValue}" (document)`);
          console.log(`    Reason: ${m.reason}`);
        });
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

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
            extractedValue: extractedDate || String(extractedData.registrationDate || ''),
            expectedValue: formDate || String(formData.incorporationDate || ''),
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
   * Nigerian NIN format: "SURNAME FIRSTNAME MIDDLENAME"
   * Example: "OYENIYI DANIEL ADEMOLA" -> firstName: "DANIEL ADEMOLA", lastName: "OYENIYI"
   */
  private parseFullName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName) {
      console.log('⚠️ No full name provided for parsing');
      return { firstName: '', lastName: '' };
    }
    
    const nameParts = fullName.trim().split(/\s+/).filter(part => part.length > 0);
    console.log('📝 Parsing full name:', fullName, '-> parts:', nameParts);
    
    if (nameParts.length === 0) {
      return { firstName: '', lastName: '' };
    } else if (nameParts.length === 1) {
      // Only one name - treat as last name
      return { firstName: '', lastName: nameParts[0] };
    } else if (nameParts.length === 2) {
      // Two names: SURNAME FIRSTNAME
      const result = { 
        firstName: nameParts[1],  // Second part is first name
        lastName: nameParts[0]    // First part is surname (last name)
      };
      console.log('📝 Parsed name result (2 parts):', result);
      return result;
    } else {
      // Three or more names: SURNAME FIRSTNAME MIDDLENAME(S)
      // First part is surname, remaining parts are first name + middle name(s)
      const result = { 
        firstName: nameParts.slice(1).join(' '),  // All parts after surname
        lastName: nameParts[0]                     // First part is surname
      };
      console.log('📝 Parsed name result (3+ parts):', result);
      return result;
    }
  }

  /**
   * Check if two names match (case-insensitive, handles middle names)
   * 
   * Matching Rules:
   * 1. Exact match: "DANIEL" === "DANIEL" ✅
   * 2. Contains match: "DANIEL" is in "DANIEL ADEMOLA" ✅
   * 3. Word-level match: "DANIEL" matches first word of "DANIEL ADEMOLA" ✅
   * 
   * This handles Nigerian NIN documents where:
   * - Form may have: firstName = "DANIEL"
   * - Document AI extracts: firstName = "DANIEL ADEMOLA" (first + middle name)
   */
  private namesMatch(name1: string, name2: string): boolean {
    if (!name1 || !name2) {
      console.log('⚠️ Name matching skipped - missing name:', { name1, name2 });
      return false;
    }
    
    const normalize = (name: string) => name.toLowerCase().trim();
    
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    console.log('🔍 Comparing names:');
    console.log('  - Name 1 (extracted):', name1, '→', n1);
    console.log('  - Name 2 (form):', name2, '→', n2);
    
    // Exact match
    if (n1 === n2) {
      console.log('✅ MATCH: Exact match');
      return true;
    }
    
    // Check if one name is contained in the other (handles middle names)
    // e.g., "daniel" is contained in "daniel ademola"
    if (n1.includes(n2)) {
      console.log('✅ MATCH: Form name "' + n2 + '" is contained in extracted name "' + n1 + '"');
      return true;
    }
    
    if (n2.includes(n1)) {
      console.log('✅ MATCH: Extracted name "' + n1 + '" is contained in form name "' + n2 + '"');
      return true;
    }
    
    // Word-level matching: Check if shorter name matches first word(s) of longer name
    // This handles: "DANIEL" matching "DANIEL ADEMOLA"
    const words1 = n1.split(/\s+/);
    const words2 = n2.split(/\s+/);
    
    // If one name is a single word and matches the first word of the other
    if (words1.length === 1 && words2.length > 1 && words2[0] === words1[0]) {
      console.log('✅ MATCH: Single word "' + words1[0] + '" matches first word of "' + n2 + '"');
      return true;
    }
    
    if (words2.length === 1 && words1.length > 1 && words1[0] === words2[0]) {
      console.log('✅ MATCH: Single word "' + words2[0] + '" matches first word of "' + n1 + '"');
      return true;
    }
    
    // Check if all words from shorter name appear in longer name (in order)
    const shorterWords = words1.length <= words2.length ? words1 : words2;
    const longerWords = words1.length > words2.length ? words1 : words2;
    
    let matchIndex = 0;
    for (const word of shorterWords) {
      const foundIndex = longerWords.indexOf(word, matchIndex);
      if (foundIndex === -1) {
        console.log('❌ NO MATCH: Word "' + word + '" not found in longer name');
        return false;
      }
      matchIndex = foundIndex + 1;
    }
    
    console.log('✅ MATCH: All words from shorter name found in longer name (in order)');
    return true;
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
   * Handles Date objects, ISO strings, and DD/MM/YYYY format
   * Uses local time methods to preserve the date as entered
   */
  private normalizeDate(date: any): string {
    if (!date) return '';
    
    try {
      // If it's already a Date object
      if (date instanceof Date) {
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // If it's a string, try to parse it
      if (typeof date === 'string') {
        const trimmed = date.trim();
        if (!trimmed) return '';
        
        // Try DD/MM/YYYY format (common in OCR)
        const ddmmyyyyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (ddmmyyyyMatch) {
          const [, day, month, year] = ddmmyyyyMatch;
          return `${year}-${month}-${day}`;
        }
        
        // Try YYYY-MM-DD format
        const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (yyyymmddMatch) {
          return trimmed;
        }
        
        // Try parsing as Date (handles ISO strings and other formats)
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          const year = parsed.getFullYear();
          const month = String(parsed.getMonth() + 1).padStart(2, '0');
          const day = String(parsed.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }
      
      return '';
    } catch {
      return '';
    }
  }
}

export const simpleVerificationMatcher = new SimpleVerificationMatcher();