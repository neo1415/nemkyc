/**
 * Verification Data Matcher
 * 
 * Validates that user-entered data matches verification API responses.
 * This prevents fraud where users enter one company/person name but verify with a different identity.
 */

/**
 * Normalize text for comparison (case-insensitive, trim whitespace, remove extra spaces)
 * Also handles common company name variations
 */
const normalizeText = (text: string | undefined | null): string => {
  if (!text) return '';
  
  let normalized = text.toString().toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Replace common company suffixes with standardized versions
  // This helps match "Public Limited Company" with "PLC", "Limited" with "Ltd", etc.
  const replacements: Record<string, string> = {
    'public limited company': 'plc',
    'private limited company': 'ltd',
    'limited liability company': 'llc',
    'limited': 'ltd',
    'incorporated': 'inc',
    'corporation': 'corp',
    'company': 'co',
  };
  
  for (const [full, abbr] of Object.entries(replacements)) {
    // Replace at the end of the string (common for company names)
    const endPattern = new RegExp(`\\s+${full}$`, 'g');
    normalized = normalized.replace(endPattern, ` ${abbr}`);
    
    // Also replace in the middle if followed by space or end
    const middlePattern = new RegExp(`\\s+${full}\\s+`, 'g');
    normalized = normalized.replace(middlePattern, ` ${abbr} `);
  }
  
  return normalized;
};

/**
 * Calculate similarity score between two strings (0-1)
 * Uses word-based matching for company names with improved handling of abbreviations
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Word-based matching for company names
  const words1 = s1.split(' ').filter(w => w.length > 0);
  const words2 = s2.split(' ').filter(w => w.length > 0);
  
  let matchCount = 0;
  const matchedWords2 = new Set<number>();
  
  // Count matching words (including partial matches)
  for (const word1 of words1) {
    for (let i = 0; i < words2.length; i++) {
      if (matchedWords2.has(i)) continue;
      
      const word2 = words2[i];
      // Exact match or one word contains the other (for abbreviations)
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        matchedWords2.add(i);
        break;
      }
    }
  }
  
  // Calculate similarity based on the shorter word list
  // This helps when one name is abbreviated (e.g., "NEM INSURANCE PLC" vs "NEM INSURANCE Public Limited Company")
  const minLength = Math.min(words1.length, words2.length);
  const maxLength = Math.max(words1.length, words2.length);
  
  // If most of the shorter name matches, consider it a good match
  const shortSimilarity = matchCount / minLength;
  const longSimilarity = matchCount / maxLength;
  
  // Use weighted average favoring the shorter name
  return (shortSimilarity * 0.7) + (longSimilarity * 0.3);
};

/**
 * Parse date string in DD-MM-YYYY or DD/MM/YYYY format
 */
const parseDate = (dateStr: string | Date): Date | null => {
  if (dateStr instanceof Date) return dateStr;
  if (!dateStr) return null;
  
  const str = dateStr.toString().trim();
  console.log('📅 Parsing date:', str);
  
  // Try to parse DD-MM-YYYY or DD/MM/YYYY format
  const parts = str.split(/[-\/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const year = parseInt(parts[2], 10);
    
    console.log('📅 Parsed parts:', { day, month: month + 1, year });
    
    // Validate the parsed values
    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
        day >= 1 && day <= 31 && 
        month >= 0 && month <= 11 && 
        year >= 1900 && year <= 2100) {
      const result = new Date(year, month, day);
      console.log('✅ Successfully parsed to:', result.toISOString());
      return result;
    }
  }
  
  // Fallback to native Date parsing
  console.log('⚠️ Using fallback Date parsing');
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Compare dates (ignoring time)
 */
const datesMatch = (date1: Date | string | undefined, date2: Date | string | undefined): boolean => {
  if (!date1 || !date2) return true; // Skip if either is missing
  
  const d1 = parseDate(date1 as string | Date);
  const d2 = parseDate(date2 as string | Date);
  
  if (!d1 || !d2) {
    console.log('⚠️ Date parsing failed, skipping comparison');
    return true; // Skip if parsing failed
  }
  
  const match = d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
  
  console.log('🔍 Date comparison:', {
    date1: { year: d1.getFullYear(), month: d1.getMonth() + 1, day: d1.getDate() },
    date2: { year: d2.getFullYear(), month: d2.getMonth() + 1, day: d2.getDate() },
    match
  });
  
  return match;
};

export interface CACMatchResult {
  matches: boolean;
  mismatches: string[];
  warnings: string[];
}

/**
 * Match CAC verification data against user-entered data
 * 
 * @param userEnteredData - Data entered by the user in the form
 * @param verificationData - Data returned from CAC verification API
 * @returns Match result with mismatches and warnings
 */
export const matchCACData = (
  userEnteredData: {
    insured?: string;
    dateOfIncorporationRegistration?: Date | string;
    officeAddress?: string;
  },
  verificationData: {
    name?: string;
    registrationDate?: string;
    address?: string;
  }
): CACMatchResult => {
  const mismatches: string[] = [];
  const warnings: string[] = [];
  
  // Match company name (critical field) - don't reveal actual verified name
  if (userEnteredData.insured && verificationData.name) {
    const similarity = calculateSimilarity(userEnteredData.insured, verificationData.name);
    
    if (similarity < 0.5) {
      mismatches.push(
        `The company name you entered does not match the CAC verification records. Please verify the company name is correct.`
      );
    } else if (similarity < 0.8) {
      warnings.push(
        `The company name you entered is similar but not an exact match with CAC records. Please verify this is correct.`
      );
    }
  }
  
  // Match incorporation date (critical field) - don't reveal actual verified date
  if (userEnteredData.dateOfIncorporationRegistration && verificationData.registrationDate) {
    if (!datesMatch(userEnteredData.dateOfIncorporationRegistration, verificationData.registrationDate)) {
      mismatches.push(
        `The incorporation date you entered does not match the CAC verification records. Please verify the date is correct.`
      );
    }
  }
  
  // Match address (warning only, as addresses can vary in format)
  if (userEnteredData.officeAddress && verificationData.address) {
    const similarity = calculateSimilarity(userEnteredData.officeAddress, verificationData.address);
    
    if (similarity < 0.3) {
      warnings.push(
        `The office address differs from CAC records. Please verify the address is correct.`
      );
    }
  }
  
  return {
    matches: mismatches.length === 0,
    mismatches,
    warnings
  };
};

export interface NINMatchResult {
  matches: boolean;
  mismatches: string[];
  warnings: string[];
}

/**
 * Match NIN verification data against user-entered data
 * 
 * @param userEnteredData - Data entered by the user in the form
 * @param verificationData - Data returned from NIN verification API
 * @returns Match result with mismatches and warnings
 */
export const matchNINData = (
  userEnteredData: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date | string;
    gender?: string;
  },
  verificationData: {
    firstName?: string;
    lastname?: string;
    surname?: string;
    birthdate?: string;
    dateOfBirth?: string;
    gender?: string;
  }
): NINMatchResult => {
  const mismatches: string[] = [];
  const warnings: string[] = [];
  
  // Match first name (critical field) - don't reveal actual verified name
  if (userEnteredData.firstName && verificationData.firstName) {
    const similarity = calculateSimilarity(userEnteredData.firstName, verificationData.firstName);
    
    console.log('🔍 First name comparison:', {
      userEntered: userEnteredData.firstName,
      verified: verificationData.firstName,
      similarity
    });
    
    if (similarity < 0.6) {
      mismatches.push(
        `The first name you entered does not match the NIN verification records. Please verify the first name is correct.`
      );
    }
  }
  
  // Match last name (critical field) - don't reveal actual verified name
  // Try both lastName and surname fields for compatibility
  const verifiedLastName = verificationData.lastName || verificationData.lastname || verificationData.surname;
  if (userEnteredData.lastName && verifiedLastName) {
    const similarity = calculateSimilarity(userEnteredData.lastName, verifiedLastName);
    
    console.log('🔍 Last name comparison:', {
      userEntered: userEnteredData.lastName,
      verified: verifiedLastName,
      similarity
    });
    
    if (similarity < 0.6) {
      mismatches.push(
        `The last name you entered does not match the NIN verification records. Please verify the last name is correct.`
      );
    }
  }
  
  // Match date of birth (critical field) - don't reveal actual verified date
  // Try both birthdate and dateOfBirth fields for compatibility
  const verifiedDOB = verificationData.birthdate || verificationData.dateOfBirth;
  if (userEnteredData.dateOfBirth && verifiedDOB) {
    console.log('🔍 Date matching debug:', {
      userEntered: userEnteredData.dateOfBirth,
      userEnteredType: typeof userEnteredData.dateOfBirth,
      verified: verifiedDOB,
      verifiedType: typeof verifiedDOB
    });
    
    if (!datesMatch(userEnteredData.dateOfBirth, verifiedDOB)) {
      mismatches.push(
        `The date of birth you entered does not match the NIN verification records. Please verify the date is correct.`
      );
    } else {
      console.log('✅ Dates match successfully');
    }
  }
  
  // Match gender (warning only)
  if (userEnteredData.gender && verificationData.gender) {
    const userGender = normalizeText(userEnteredData.gender);
    const verifiedGender = normalizeText(verificationData.gender);
    
    // Handle common variations
    const genderMap: Record<string, string[]> = {
      'male': ['male', 'm', 'man'],
      'female': ['female', 'f', 'woman']
    };
    
    let genderMatches = false;
    for (const [, variations] of Object.entries(genderMap)) {
      if (variations.includes(userGender) && variations.includes(verifiedGender)) {
        genderMatches = true;
        break;
      }
    }
    
    if (!genderMatches && userGender !== verifiedGender) {
      warnings.push(
        `The gender differs from NIN records. Please verify this is correct.`
      );
    }
  }
  
  return {
    matches: mismatches.length === 0,
    mismatches,
    warnings
  };
};
