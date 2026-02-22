/**
 * Field Matching Utilities
 * 
 * This module provides functions to match API response fields to form fields
 * using flexible name matching algorithms. It handles different naming conventions
 * (camelCase, snake_case, Title Case, etc.) and common abbreviations.
 */

/**
 * Generates all possible variations of a field name
 * 
 * Creates variations in different naming conventions:
 * - camelCase: firstName
 * - snake_case: first_name
 * - Title Case: First Name
 * - space-separated: first name
 * - no separator: firstname
 * - PascalCase: FirstName
 * - Common abbreviations: dateOfBirth → dob
 * 
 * @param fieldName - Original field name (typically camelCase)
 * @returns Array of field name variations
 */
export function generateFieldVariations(fieldName: string): string[] {
  if (!fieldName || typeof fieldName !== 'string') {
    return [];
  }

  const variations: string[] = [];

  // Add original field name
  variations.push(fieldName);

  // Convert camelCase to words
  const words = fieldName
    .replace(/([A-Z])/g, ' $1') // Insert space before capital letters
    .trim()
    .toLowerCase()
    .split(/\s+/);

  // Generate variations
  // 1. snake_case
  variations.push(words.join('_'));

  // 2. Title Case
  const titleCase = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  variations.push(titleCase);

  // 3. space-separated lowercase
  variations.push(words.join(' '));

  // 4. no separator (all lowercase)
  variations.push(words.join(''));

  // 5. PascalCase
  const pascalCase = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  variations.push(pascalCase);

  // 6. Common abbreviations
  const abbreviations = getCommonAbbreviations(fieldName);
  variations.push(...abbreviations);

  // Remove duplicates and return
  return Array.from(new Set(variations));
}

/**
 * Returns common abbreviations for specific field names
 * 
 * @param fieldName - Original field name
 * @returns Array of common abbreviations
 */
function getCommonAbbreviations(fieldName: string): string[] {
  const abbreviationMap: Record<string, string[]> = {
    dateOfBirth: ['dob', 'DOB', 'date_of_birth', 'Date Of Birth', 'birthDate', 'birth_date', 'Date of Birth'],
    phoneNumber: ['phone', 'Phone', 'mobile', 'Mobile', 'phone_number', 'Phone Number', 'Mobile Number', 'mobile_number', 'mobileNumber', 'GSMno', 'gsmno', 'GSM', 'gsm'],
    firstName: ['first_name', 'First Name', 'firstname', 'FirstName'],
    middleName: ['middle_name', 'Middle Name', 'middlename', 'MiddleName'],
    lastName: ['last_name', 'Last Name', 'lastname', 'LastName', 'surname', 'Surname'],
    gender: ['sex', 'Sex', 'Gender'],
    companyName: ['company_name', 'Company Name', 'name', 'Name', 'businessName', 'business_name'],
    registrationNumber: ['registration_number', 'Registration Number', 'rcNumber', 'rc_number', 'RC Number', 'cacNumber', 'cac_number'],
    registrationDate: ['registration_date', 'Registration Date', 'dateRegistered', 'date_registered'],
    companyStatus: ['company_status', 'Company Status', 'status', 'Status']
  };

  return abbreviationMap[fieldName] || [];
}

/**
 * Finds a form field by flexible name matching
 * 
 * Search strategy:
 * 1. Try exact match first
 * 2. Try case-insensitive match
 * 3. Try all field name variations
 * 4. Try fuzzy matching with Levenshtein distance (threshold: 2 edits)
 * 5. Handle nested form structures
 * 
 * @param formElement - The form element to search within
 * @param fieldName - The field name to search for
 * @returns The matching input element or null if not found
 */
export function findFormField(
  formElement: HTMLFormElement,
  fieldName: string
): HTMLInputElement | null {
  if (!formElement || !fieldName) {
    return null;
  }

  // Get all input, select, and textarea elements
  const formFields = Array.from(formElement.querySelectorAll('input, select, textarea'));

  // 1. Try exact match on name attribute
  let match = formFields.find(field => field.getAttribute('name') === fieldName);
  if (match) {
    return match as HTMLInputElement;
  }

  // 2. Try exact match on id attribute
  match = formFields.find(field => field.getAttribute('id') === fieldName);
  if (match) {
    return match as HTMLInputElement;
  }

  // 3. Try case-insensitive match
  const lowerFieldName = fieldName.toLowerCase();
  match = formFields.find(field => {
    const name = field.getAttribute('name')?.toLowerCase();
    const id = field.getAttribute('id')?.toLowerCase();
    return name === lowerFieldName || id === lowerFieldName;
  });
  if (match) {
    return match as HTMLInputElement;
  }

  // 4. Try all field name variations
  const variations = generateFieldVariations(fieldName);
  for (const variation of variations) {
    const lowerVariation = variation.toLowerCase();
    match = formFields.find(field => {
      const name = field.getAttribute('name')?.toLowerCase();
      const id = field.getAttribute('id')?.toLowerCase();
      return name === lowerVariation || id === lowerVariation;
    });
    if (match) {
      return match as HTMLInputElement;
    }
  }

  // 5. Try fuzzy matching with Levenshtein distance
  let bestMatch: Element | null = null;
  let bestDistance = Infinity;
  const threshold = 2; // Maximum edit distance

  for (const field of formFields) {
    const name = field.getAttribute('name') || '';
    const id = field.getAttribute('id') || '';

    const nameDistance = levenshteinDistance(fieldName.toLowerCase(), name.toLowerCase());
    const idDistance = levenshteinDistance(fieldName.toLowerCase(), id.toLowerCase());

    const minDistance = Math.min(nameDistance, idDistance);

    if (minDistance < bestDistance && minDistance <= threshold) {
      bestDistance = minDistance;
      bestMatch = field;
    }
  }

  if (bestMatch) {
    return bestMatch as HTMLInputElement;
  }

  // 6. For React Hook Form custom components (like Shadcn Select), create a virtual input
  // This allows the mapping to proceed even if there's no actual input element
  // The React Hook Form setValue will handle the actual value setting
  console.log(`[findFormField] No DOM element found for "${fieldName}", creating virtual input for React Hook Form`);
  const virtualInput = document.createElement('input');
  virtualInput.setAttribute('name', fieldName);
  virtualInput.setAttribute('id', fieldName);
  virtualInput.type = 'hidden';
  virtualInput.setAttribute('data-virtual', 'true');
  return virtualInput as HTMLInputElement;
}

/**
 * Calculates Levenshtein distance between two strings
 * 
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string into another.
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns The Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}
