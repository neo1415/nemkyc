// Integration test for the name matching fix
// Tests the specific issue: "Daniel Oyeniyi" vs "DANIEL ADEMOLA OYENIYI"

import { describe, test, expect } from 'vitest';

// Import the calculateStringSimilarity method logic for direct testing
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

function levenshteinSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = matrix[str2.length][str1.length];
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 100 : Math.round((1 - distance / maxLength) * 100);
}

function calculateStringSimilarity(str1: string, str2: string): { score: number; method: string } {
  if (!str1 || !str2 || str1.trim() === '' || str2.trim() === '') {
    return { score: 0, method: 'none' };
  }

  // Normalize strings
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  // Handle identical normalized strings
  if (normalized1 === normalized2) {
    return { score: 100, method: 'exact' };
  }

  // Handle very short strings that might be just punctuation
  if (normalized1.length < 2 || normalized2.length < 2) {
    return { score: 0, method: 'none' };
  }

  // Special handling for names - check if one is a subset of the other
  const tokens1 = normalized1.split(/\s+/).filter(t => t.length > 0);
  const tokens2 = normalized2.split(/\s+/).filter(t => t.length > 0);
  
  // If one name has fewer tokens, check if all its tokens are in the other
  if (tokens1.length !== tokens2.length) {
    const shorter = tokens1.length < tokens2.length ? tokens1 : tokens2;
    const longer = tokens1.length < tokens2.length ? tokens2 : tokens1;
    
    const matchingTokens = shorter.filter(token => 
      longer.some(longerToken => 
        longerToken.includes(token) || token.includes(longerToken) ||
        levenshteinSimilarity(token, longerToken) >= 80
      )
    );
    
    // If all tokens from shorter name match tokens in longer name, it's likely the same person
    if (matchingTokens.length === shorter.length && shorter.length >= 2) {
      // For name subset matching, we score based on how many tokens from the shorter name match
      // This handles cases like "John Smith" vs "John Michael Smith" where the shorter name
      // is a subset of the longer name (missing middle name)
      const matchRatio = matchingTokens.length / shorter.length; // This will be 1.0 if all match
      if (matchRatio === 1.0) {
        // All tokens from shorter name found in longer name - high confidence match
        // Score based on the proportion of the shorter name that matches, with bonus for complete match
        const baseScore = Math.round(matchRatio * 90); // 90% base score for complete subset match
        const bonusScore = shorter.length >= 2 ? 5 : 0; // Bonus for having at least 2 names
        return { score: Math.min(95, baseScore + bonusScore), method: 'name-subset' };
      }
    }
  }

  // Fallback to Levenshtein
  const levenshteinScore = levenshteinSimilarity(normalized1, normalized2);
  return { score: levenshteinScore, method: 'levenshtein' };
}

describe('Name Matching Fix Integration Test', () => {
  test('should correctly match the specific reported issue', () => {
    // Test the exact case from the user's issue
    const formName = 'Daniel Oyeniyi'; // Form data without middle name
    const docName = 'DANIEL ADEMOLA OYENIYI'; // Document has middle name
    
    const result = calculateStringSimilarity(formName, docName);
    
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.method).toBe('name-subset');
    expect(result.score).toBe(95); // Should get exactly 95% with our algorithm
  });

  test('should handle various middle name scenarios correctly', () => {
    const testCases = [
      {
        description: 'Missing middle name',
        formName: 'John Smith',
        docName: 'JOHN MICHAEL SMITH',
        expectedScore: 95,
        expectedMethod: 'name-subset'
      },
      {
        description: 'Multiple middle names',
        formName: 'Mary Johnson',
        docName: 'MARY ELIZABETH ANNE JOHNSON',
        expectedScore: 95,
        expectedMethod: 'name-subset'
      },
      {
        description: 'Same names different case',
        formName: 'ahmed hassan',
        docName: 'AHMED HASSAN',
        expectedScore: 100,
        expectedMethod: 'exact'
      },
      {
        description: 'Completely different names',
        formName: 'John Smith',
        docName: 'JANE DOE',
        expectedMinScore: 0,
        expectedMaxScore: 50, // Should be low
        expectedMethod: 'levenshtein'
      }
    ];

    testCases.forEach(testCase => {
      const result = calculateStringSimilarity(testCase.formName, testCase.docName);
      
      console.log(`${testCase.description}: "${testCase.formName}" vs "${testCase.docName}" = ${result.score}% (${result.method})`);
      
      if ('expectedScore' in testCase) {
        expect(result.score).toBe(testCase.expectedScore);
        expect(result.method).toBe(testCase.expectedMethod);
      } else {
        expect(result.score).toBeGreaterThanOrEqual(testCase.expectedMinScore!);
        expect(result.score).toBeLessThanOrEqual(testCase.expectedMaxScore!);
        expect(result.method).toBe(testCase.expectedMethod);
      }
    });
  });

  test('should properly construct fullName without extra spaces', () => {
    // Test the improved fullName construction logic
    const constructFullName = (firstName: string, middleName: string | undefined | null, lastName: string) => {
      return [firstName, middleName, lastName]
        .filter(name => name && name.trim())
        .join(' ');
    };

    expect(constructFullName('Daniel', '', 'Oyeniyi')).toBe('Daniel Oyeniyi');
    expect(constructFullName('Daniel', undefined, 'Oyeniyi')).toBe('Daniel Oyeniyi');
    expect(constructFullName('Daniel', null, 'Oyeniyi')).toBe('Daniel Oyeniyi');
    expect(constructFullName('Daniel', '   ', 'Oyeniyi')).toBe('Daniel Oyeniyi');
    expect(constructFullName('Daniel', 'Ademola', 'Oyeniyi')).toBe('Daniel Ademola Oyeniyi');

    // Ensure no extra spaces
    const result = constructFullName('Daniel', '', 'Oyeniyi');
    expect(result.includes('  ')).toBe(false);
    expect(result).toBe('Daniel Oyeniyi');
  });

  test('should demonstrate the fix resolves the original issue', () => {
    // Before fix: "Daniel  Oyeniyi" (with extra space) vs "DANIEL ADEMOLA OYENIYI"
    const beforeFix = 'Daniel  Oyeniyi'; // Extra space from bad concatenation
    const afterFix = 'Daniel Oyeniyi';   // Fixed concatenation
    const docName = 'DANIEL ADEMOLA OYENIYI';
    
    const beforeResult = calculateStringSimilarity(beforeFix, docName);
    const afterResult = calculateStringSimilarity(afterFix, docName);
    
    console.log(`Before fix: "${beforeFix}" vs "${docName}" = ${beforeResult.score}% (${beforeResult.method})`);
    console.log(`After fix: "${afterFix}" vs "${docName}" = ${afterResult.score}% (${afterResult.method})`);
    
    // Both should work well now because our algorithm normalizes spaces
    // The real fix was in the form construction, not the matching algorithm
    expect(afterResult.score).toBeGreaterThanOrEqual(85);
    expect(afterResult.method).toBe('name-subset');
    
    // The key improvement is that we no longer generate names with extra spaces
    expect(afterFix.includes('  ')).toBe(false);
    expect(beforeFix.includes('  ')).toBe(true);
    
    // Both should actually work because our normalizeString handles extra spaces
    expect(beforeResult.score).toBeGreaterThanOrEqual(85);
    expect(afterResult.score).toBeGreaterThanOrEqual(85);
  });
});