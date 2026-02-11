/**
 * Unit tests for field matching logic
 * 
 * Tests:
 * - Name matching (case-insensitive, whitespace)
 * - Gender matching (normalization)
 * - Date matching (multiple formats)
 * - Phone matching (optional, normalization)
 * - Partial matches
 */

const {
  normalizeString,
  normalizeGender,
  parseDate,
  normalizePhone,
  matchFields
} = require('../../../server-services/__mocks__/dataproClient.cjs');

describe('Field Matching Logic', () => {
  describe('Name matching (case-insensitive, whitespace)', () => {
    test('should match names with different cases', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969'
      };

      const excelData = {
        'First Name': 'john',
        'Last Name': 'doe',
        'Gender': 'M',
        'Date of Birth': '12/05/1969'
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(true);
    });

    test('should match names with extra whitespace', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969'
      };

      const excelData = {
        'First Name': '  John  ',
        'Last Name': '  Doe  ',
        'Gender': 'M',
        'Date of Birth': '12/05/1969'
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(true);
    });

    test('should match names with multiple spaces', () => {
      expect(normalizeString('JOHN    DOE')).toBe('john doe');
      expect(normalizeString('john    doe')).toBe('john doe');
    });

    test('should handle names with special characters', () => {
      const apiData = {
        firstName: "O'BRIEN",
        lastName: 'MC-DONALD',
        gender: 'Male',
        dateOfBirth: '12-May-1969'
      };

      const excelData = {
        'First Name': "o'brien",
        'Last Name': 'mc-donald',
        'Gender': 'M',
        'Date of Birth': '12/05/1969'
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(true);
    });

    test('should detect name mismatch', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969'
      };

      const excelData = {
        'First Name': 'Jane',
        'Last Name': 'Doe',
        'Gender': 'M',
        'Date of Birth': '12/05/1969'
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('First Name');
    });
  });

  describe('Gender matching (normalization)', () => {
    test('should match M with Male', () => {
      expect(normalizeGender('M')).toBe('male');
      expect(normalizeGender('Male')).toBe('male');
      expect(normalizeGender('MALE')).toBe('male');
    });

    test('should match F with Female', () => {
      expect(normalizeGender('F')).toBe('female');
      expect(normalizeGender('Female')).toBe('female');
      expect(normalizeGender('FEMALE')).toBe('female');
    });

    test('should match gender with different cases', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969'
      };

      const excelData = {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Gender': 'm',
        'Date of Birth': '12/05/1969'
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(true);
    });

    test('should detect gender mismatch', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969'
      };

      const excelData = {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Gender': 'Female',
        'Date of Birth': '12/05/1969'
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Gender');
    });
  });

  describe('Date matching (multiple formats)', () => {
    test('should match DD/MM/YYYY format', () => {
      expect(parseDate('04/01/1980')).toBe('1980-01-04');
      expect(parseDate('4/1/1980')).toBe('1980-01-04');
      expect(parseDate('04/1/1980')).toBe('1980-01-04');
    });

    test('should match DD-MMM-YYYY format', () => {
      expect(parseDate('12-May-1969')).toBe('1969-05-12');
      expect(parseDate('1-Jan-2000')).toBe('2000-01-01');
      expect(parseDate('31-Dec-1999')).toBe('1999-12-31');
    });

    test('should match YYYY-MM-DD format', () => {
      expect(parseDate('1980-01-04')).toBe('1980-01-04');
      expect(parseDate('1980-1-4')).toBe('1980-01-04');
    });

    test('should match YYYY/MM/DD format', () => {
      expect(parseDate('1980/01/04')).toBe('1980-01-04');
      expect(parseDate('1980/1/4')).toBe('1980-01-04');
    });

    test('should match dates in different formats representing same date', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969'
      };

      const testCases = [
        '12/05/1969',
        '12/5/1969',
        '1969-05-12',
        '1969/05/12'
      ];

      testCases.forEach(dateFormat => {
        const excelData = {
          'First Name': 'John',
          'Last Name': 'Doe',
          'Gender': 'M',
          'Date of Birth': dateFormat
        };

        const result = matchFields(apiData, excelData);
        expect(result.matched).toBe(true);
      });
    });

    test('should detect date mismatch', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969'
      };

      const excelData = {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Gender': 'M',
        'Date of Birth': '01/01/1970'
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Date of Birth');
    });
  });

  describe('Phone matching (optional, normalization)', () => {
    test('should normalize phone numbers with spaces', () => {
      expect(normalizePhone('081 234 567 89')).toBe('08123456789');
    });

    test('should normalize phone numbers with dashes', () => {
      expect(normalizePhone('081-234-567-89')).toBe('08123456789');
    });

    test('should normalize phone numbers with +234 prefix', () => {
      expect(normalizePhone('+234 812 345 6789')).toBe('08123456789');
      expect(normalizePhone('234 812 345 6789')).toBe('08123456789');
    });

    test('should normalize phone numbers with parentheses', () => {
      expect(normalizePhone('(234) 812-345-6789')).toBe('08123456789');
    });

    test('should not fail on phone number mismatch (optional field)', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969',
        phoneNumber: '08123456789'
      };

      const excelData = {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Gender': 'M',
        'Date of Birth': '12/05/1969',
        'Phone Number': '08199999999'
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.phoneNumber.matched).toBe(false);
      expect(result.details.phoneNumber.optional).toBe(true);
    });

    test('should match phone numbers in different formats', () => {
      const phone1 = normalizePhone('08123456789');
      const phone2 = normalizePhone('+234 812 345 6789');
      const phone3 = normalizePhone('234-812-345-6789');

      expect(phone1).toBe(phone2);
      expect(phone2).toBe(phone3);
    });
  });

  describe('Partial matches', () => {
    test('should report all failed fields', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969'
      };

      const excelData = {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Gender': 'F',
        'Date of Birth': '01/01/1970'
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('First Name');
      expect(result.failedFields).toContain('Last Name');
      expect(result.failedFields).toContain('Gender');
      expect(result.failedFields).toContain('Date of Birth');
      expect(result.failedFields.length).toBe(4);
    });

    test('should match when only one field differs (phone - optional)', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969',
        phoneNumber: '08123456789'
      };

      const excelData = {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Gender': 'M',
        'Date of Birth': '12/05/1969',
        'Phone Number': '08199999999'
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(true);
    });

    test('should provide detailed match information', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969'
      };

      const excelData = {
        'First Name': 'Jane',
        'Last Name': 'Doe',
        'Gender': 'M',
        'Date of Birth': '12/05/1969'
      };

      const result = matchFields(apiData, excelData);
      expect(result.details.firstName.matched).toBe(false);
      expect(result.details.lastName.matched).toBe(true);
      expect(result.details.gender.matched).toBe(true);
      expect(result.details.dateOfBirth.matched).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('should handle null values', () => {
      const apiData = {
        firstName: 'JOHN',
        lastName: 'DOE',
        gender: 'Male',
        dateOfBirth: '12-May-1969',
        phoneNumber: null
      };

      const excelData = {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Gender': 'M',
        'Date of Birth': '12/05/1969',
        'Phone Number': null
      };

      const result = matchFields(apiData, excelData);
      expect(result.matched).toBe(true);
    });

    test('should handle empty strings', () => {
      expect(normalizeString('')).toBe('');
      expect(normalizeGender('')).toBe('');
      expect(parseDate('')).toBe(null);
      expect(normalizePhone('')).toBe('');
    });

    test('should handle undefined values', () => {
      expect(normalizeString(undefined)).toBe('');
      expect(normalizeGender(undefined)).toBe('');
      expect(parseDate(undefined)).toBe(null);
      expect(normalizePhone(undefined)).toBe('');
    });
  });
});
