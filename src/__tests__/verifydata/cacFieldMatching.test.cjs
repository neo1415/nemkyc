/**
 * Unit tests for CAC Field Matching Logic
 * 
 * Tests:
 * - Company name matching (case-insensitive, Ltd/Limited/PLC variations)
 * - RC number matching (with/without RC prefix)
 * - Registration date matching (multiple formats)
 * - Company status validation
 * - Partial matches
 */

const {
  normalizeCompanyName,
  normalizeRCNumber,
  parseDate,
  matchCACFields
} = require('../../../server-services/__mocks__/verifydataClient.cjs');

describe('CAC Field Matching', () => {
  describe('Company Name Matching', () => {
    test('should match identical company names', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.companyName.matched).toBe(true);
    });

    test('should match company names case-insensitively', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'acme corporation limited',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.companyName.matched).toBe(true);
    });

    test('should match Limited and Ltd variations', () => {
      expect(normalizeCompanyName('ACME LIMITED')).toBe(normalizeCompanyName('ACME LTD'));
      expect(normalizeCompanyName('ACME CORPORATION LIMITED')).toBe(normalizeCompanyName('ACME CORPORATION LTD'));
    });

    test('should match Public Limited Company and PLC variations', () => {
      expect(normalizeCompanyName('ACME PUBLIC LIMITED COMPANY')).toBe(normalizeCompanyName('ACME PLC'));
    });

    test('should match Private Limited Company and Ltd variations', () => {
      expect(normalizeCompanyName('ACME PRIVATE LIMITED COMPANY')).toBe(normalizeCompanyName('ACME LTD'));
    });

    test('should match Limited Liability Company and LLC variations', () => {
      expect(normalizeCompanyName('ACME LIMITED LIABILITY COMPANY')).toBe(normalizeCompanyName('ACME LLC'));
    });

    test('should match Incorporated and Inc variations', () => {
      expect(normalizeCompanyName('ACME INCORPORATED')).toBe(normalizeCompanyName('ACME INC'));
    });

    test('should handle extra whitespace in company names', () => {
      expect(normalizeCompanyName('  ACME   CORPORATION   LIMITED  ')).toBe(normalizeCompanyName('ACME CORPORATION LIMITED'));
    });

    test('should handle trailing punctuation in company names', () => {
      expect(normalizeCompanyName('ACME LTD.')).toBe(normalizeCompanyName('ACME LTD'));
      expect(normalizeCompanyName('ACME LTD,')).toBe(normalizeCompanyName('ACME LTD'));
      expect(normalizeCompanyName('ACME LTD;')).toBe(normalizeCompanyName('ACME LTD'));
    });

    test('should detect company name mismatch', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'DIFFERENT COMPANY LTD',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Company Name');
      expect(result.details.companyName.matched).toBe(false);
    });
  });

  describe('RC Number Matching', () => {
    test('should match RC numbers with RC prefix', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.registrationNumber.matched).toBe(true);
    });

    test('should match RC numbers without RC prefix', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': '123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.registrationNumber.matched).toBe(true);
    });

    test('should normalize RC prefix variations', () => {
      expect(normalizeRCNumber('RC123456')).toBe(normalizeRCNumber('123456'));
      expect(normalizeRCNumber('RC 123456')).toBe(normalizeRCNumber('123456'));
      expect(normalizeRCNumber('RC-123456')).toBe(normalizeRCNumber('123456'));
      expect(normalizeRCNumber('RC/123456')).toBe(normalizeRCNumber('123456'));
      expect(normalizeRCNumber('rc123456')).toBe(normalizeRCNumber('123456'));
    });

    test('should remove non-alphanumeric characters from RC numbers', () => {
      expect(normalizeRCNumber('RC-123-456')).toBe('123456');
      expect(normalizeRCNumber('RC 123 456')).toBe('123456');
      expect(normalizeRCNumber('RC/123/456')).toBe('123456');
    });

    test('should detect RC number mismatch', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC999999',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Registration Number');
      expect(result.details.registrationNumber.matched).toBe(false);
    });
  });

  describe('Registration Date Matching', () => {
    test('should match dates in DD/MM/YYYY format', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.registrationDate.matched).toBe(true);
    });

    test('should match dates in DD-MMM-YYYY format', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15-Mar-2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.registrationDate.matched).toBe(true);
    });

    test('should match dates in YYYY-MM-DD format', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '2010-03-15'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.registrationDate.matched).toBe(true);
    });

    test('should match dates in YYYY/MM/DD format', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '2010/03/15'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.registrationDate.matched).toBe(true);
    });

    test('should match dates with single-digit day/month', () => {
      expect(parseDate('1/3/2010')).toBe('2010-03-01');
      expect(parseDate('15/3/2010')).toBe('2010-03-15');
      expect(parseDate('1/12/2010')).toBe('2010-12-01');
    });

    test('should detect registration date mismatch', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '01/01/2020'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Registration Date');
      expect(result.details.registrationDate.matched).toBe(false);
    });
  });

  describe('Company Status Validation', () => {
    test('should accept Verified status', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.companyStatus.matched).toBe(true);
    });

    test('should accept Active status', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Active',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.companyStatus.matched).toBe(true);
    });

    test('should accept status case-insensitively', () => {
      const apiData1 = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'VERIFIED',
        registrationDate: '15/03/2010'
      };

      const apiData2 = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result1 = matchCACFields(apiData1, excelData);
      const result2 = matchCACFields(apiData2, excelData);

      expect(result1.matched).toBe(true);
      expect(result2.matched).toBe(true);
    });

    test('should reject Inactive status', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Inactive',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Company Status');
      expect(result.details.companyStatus.matched).toBe(false);
    });

    test('should reject Suspended status', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Suspended',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Company Status');
    });

    test('should reject Dissolved status', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Dissolved',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Company Status');
    });
  });

  describe('Partial Matches', () => {
    test('should report all failed fields when multiple fields mismatch', () => {
      const apiData = {
        name: 'WRONG COMPANY LIMITED',
        registrationNumber: 'RC999999',
        companyStatus: 'Inactive',
        registrationDate: '01/01/2020'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Company Name');
      expect(result.failedFields).toContain('Registration Number');
      expect(result.failedFields).toContain('Registration Date');
      expect(result.failedFields).toContain('Company Status');
      expect(result.failedFields.length).toBe(4);
    });

    test('should match when only company name and RC number match', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Inactive',
        registrationDate: '01/01/2020'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.details.companyName.matched).toBe(true);
      expect(result.details.registrationNumber.matched).toBe(true);
      expect(result.details.registrationDate.matched).toBe(false);
      expect(result.details.companyStatus.matched).toBe(false);
    });

    test('should provide detailed match information for each field', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LTD',
        'Registration Number': '123456',
        'Registration Date': '2010-03-15'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(true);
      expect(result.details.companyName).toHaveProperty('api');
      expect(result.details.companyName).toHaveProperty('excel');
      expect(result.details.companyName).toHaveProperty('matched');
      expect(result.details.registrationNumber).toHaveProperty('api');
      expect(result.details.registrationNumber).toHaveProperty('excel');
      expect(result.details.registrationNumber).toHaveProperty('matched');
      expect(result.details.registrationDate).toHaveProperty('api');
      expect(result.details.registrationDate).toHaveProperty('excel');
      expect(result.details.registrationDate).toHaveProperty('apiParsed');
      expect(result.details.registrationDate).toHaveProperty('excelParsed');
      expect(result.details.registrationDate).toHaveProperty('matched');
      expect(result.details.companyStatus).toHaveProperty('api');
      expect(result.details.companyStatus).toHaveProperty('excel');
      expect(result.details.companyStatus).toHaveProperty('matched');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing company name in Excel data', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Company Name');
    });

    test('should handle missing registration number in Excel data', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Registration Number');
    });

    test('should handle missing registration date in Excel data', () => {
      const apiData = {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010'
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
      expect(result.failedFields).toContain('Registration Date');
    });

    test('should handle null values in API data', () => {
      const apiData = {
        name: null,
        registrationNumber: null,
        companyStatus: null,
        registrationDate: null
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
    });

    test('should handle empty strings in API data', () => {
      const apiData = {
        name: '',
        registrationNumber: '',
        companyStatus: '',
        registrationDate: ''
      };

      const excelData = {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010'
      };

      const result = matchCACFields(apiData, excelData);
      expect(result.matched).toBe(false);
    });
  });
});
