/**
 * Unit tests for VerifyData API Client
 * 
 * Tests:
 * - Successful verification
 * - All status codes (FF, IB, BR, EE, 500)
 * - Network errors and retries
 * - Timeout handling
 * - Response parsing
 * - Field matching logic
 * 
 * Mirrors the structure of dataproClient tests for consistency
 */

// Import the mock implementation directly for testing
const {
  verifyCAC,
  maskRCNumber,
  normalizeCompanyName,
  normalizeRCNumber,
  parseDate,
  matchCACFields,
  getUserFriendlyError,
  getTechnicalError,
  setMockBehavior,
  resetMockBehavior,
  getMockSuccessRCNumbers,
  getMockMismatchRCNumbers,
  getMockErrorRCNumbers
} = require('../../../server-services/__mocks__/verifydataClient.cjs');

describe('VerifydataClient', () => {
  beforeEach(() => {
    resetMockBehavior();
  });

  describe('verifyCAC - Successful verification', () => {
    test('should verify valid RC number successfully', async () => {
      const [successRC] = getMockSuccessRCNumbers();
      const result = await verifyCAC(successRC);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBeDefined();
      expect(result.data.registrationNumber).toBeDefined();
      expect(result.data.companyStatus).toBeDefined();
      expect(result.data.registrationDate).toBeDefined();
      expect(result.responseInfo).toBeDefined();
      expect(result.responseInfo.statusCode).toBe('00');
    });

    test('should return all expected fields in successful response', async () => {
      const [successRC] = getMockSuccessRCNumbers();
      const result = await verifyCAC(successRC);

      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('registrationNumber');
      expect(result.data).toHaveProperty('companyStatus');
      expect(result.data).toHaveProperty('registrationDate');
      expect(result.data).toHaveProperty('typeOfEntity');
    });

    test('should verify RC number without RC prefix', async () => {
      const result = await verifyCAC('123456');

      expect(result.success).toBe(true);
      expect(result.data.registrationNumber).toBe('RC123456');
    });

    test('should verify RC number with RC prefix', async () => {
      const result = await verifyCAC('RC123456');

      expect(result.success).toBe(true);
      expect(result.data.registrationNumber).toBe('RC123456');
    });
  });

  describe('verifyCAC - Status codes', () => {
    test('should handle FF Invalid Secret Key error', async () => {
      const result = await verifyCAC('RCFF0000');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_SECRET_KEY');
      expect(result.error).toContain('Verification service unavailable');
      expect(result.details.statusCode).toBe(400);
      expect(result.details.responseStatusCode).toBe('FF');
    });

    test('should handle IB Insufficient Balance error', async () => {
      const result = await verifyCAC('RCIB0000');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INSUFFICIENT_BALANCE');
      expect(result.error).toContain('Verification service unavailable');
      expect(result.details.statusCode).toBe(400);
      expect(result.details.responseStatusCode).toBe('IB');
    });

    test('should handle BR Contact Administrator error', async () => {
      const result = await verifyCAC('RCBR0000');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CONTACT_ADMINISTRATOR');
      expect(result.error).toContain('Verification service unavailable');
      expect(result.details.statusCode).toBe(400);
      expect(result.details.responseStatusCode).toBe('BR');
    });

    test('should handle EE No Active Service error', async () => {
      const result = await verifyCAC('RCEE0000');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NO_ACTIVE_SERVICE');
      expect(result.error).toContain('Verification service unavailable');
      expect(result.details.statusCode).toBe(400);
      expect(result.details.responseStatusCode).toBe('EE');
    });

    test('should handle 500 Server Error', async () => {
      const result = await verifyCAC('RC500000');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('SERVER_ERROR');
      expect(result.error).toContain('Network error');
      expect(result.details.statusCode).toBe(500);
    });

    test('should handle RC number not found error', async () => {
      const result = await verifyCAC('RC999999');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CAC_NOT_FOUND');
      expect(result.error).toContain('RC number not found');
    });
  });

  describe('verifyCAC - Input validation', () => {
    test('should reject empty RC number', async () => {
      const result = await verifyCAC('');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INPUT');
      expect(result.error).toContain('RC number is required');
    });

    test('should reject null RC number', async () => {
      const result = await verifyCAC(null);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INPUT');
    });
  });

  describe('verifyCAC - Network errors and retries', () => {
    test('should handle timeout errors', async () => {
      setMockBehavior({ shouldTimeout: true });

      const result = await verifyCAC('RC123456');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NETWORK_ERROR');
      expect(result.error).toContain('Network error');
      expect(result.details.isTimeout).toBe(true);
    });

    test('should handle network connection errors', async () => {
      setMockBehavior({ shouldThrowNetworkError: true });

      const result = await verifyCAC('RC123456');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NETWORK_ERROR');
    });
  });

  describe('Utility Functions', () => {
    describe('maskRCNumber', () => {
      test('should mask RC number correctly', () => {
        expect(maskRCNumber('RC123456')).toBe('RC12****');
        expect(maskRCNumber('123456')).toBe('1234**');
        expect(maskRCNumber('RC12')).toBe('RC12');
        expect(maskRCNumber('123')).toBe('****');
        expect(maskRCNumber('')).toBe('****');
        expect(maskRCNumber(null)).toBe('****');
      });
    });

    describe('normalizeCompanyName', () => {
      test('should normalize company names correctly', () => {
        expect(normalizeCompanyName('ACME CORPORATION LIMITED')).toBe('acme corporation ltd');
        expect(normalizeCompanyName('Global Trading Company Ltd')).toBe('global trading company ltd');
        expect(normalizeCompanyName('  ACME  CORP  ')).toBe('acme corp');
        expect(normalizeCompanyName('')).toBe('');
        expect(normalizeCompanyName(null)).toBe('');
      });

      test('should normalize company suffixes', () => {
        expect(normalizeCompanyName('ACME Limited')).toBe('acme ltd');
        expect(normalizeCompanyName('ACME Public Limited Company')).toBe('acme plc');
        expect(normalizeCompanyName('ACME Private Limited Company')).toBe('acme ltd');
        expect(normalizeCompanyName('ACME Limited Liability Company')).toBe('acme llc');
        expect(normalizeCompanyName('ACME Incorporated')).toBe('acme inc');
      });

      test('should remove trailing punctuation', () => {
        expect(normalizeCompanyName('ACME Ltd.')).toBe('acme ltd');
        expect(normalizeCompanyName('ACME Ltd,')).toBe('acme ltd');
        expect(normalizeCompanyName('ACME Ltd;')).toBe('acme ltd');
      });
    });

    describe('normalizeRCNumber', () => {
      test('should normalize RC numbers correctly', () => {
        expect(normalizeRCNumber('RC123456')).toBe('123456');
        expect(normalizeRCNumber('RC 123456')).toBe('123456');
        expect(normalizeRCNumber('RC-123456')).toBe('123456');
        expect(normalizeRCNumber('RC/123456')).toBe('123456');
        expect(normalizeRCNumber('123456')).toBe('123456');
        expect(normalizeRCNumber('rc123456')).toBe('123456');
        expect(normalizeRCNumber('')).toBe('');
        expect(normalizeRCNumber(null)).toBe('');
      });

      test('should remove non-alphanumeric characters', () => {
        expect(normalizeRCNumber('RC-123-456')).toBe('123456');
        expect(normalizeRCNumber('RC 123 456')).toBe('123456');
        expect(normalizeRCNumber('RC/123/456')).toBe('123456');
      });
    });

    describe('parseDate', () => {
      test('should parse DD/MM/YYYY format', () => {
        expect(parseDate('15/03/2010')).toBe('2010-03-15');
        expect(parseDate('1/1/2000')).toBe('2000-01-01');
      });

      test('should parse DD-MMM-YYYY format', () => {
        expect(parseDate('15-Mar-2010')).toBe('2010-03-15');
        expect(parseDate('1-Jan-2000')).toBe('2000-01-01');
      });

      test('should parse YYYY-MM-DD format', () => {
        expect(parseDate('2010-03-15')).toBe('2010-03-15');
        expect(parseDate('2000-1-1')).toBe('2000-01-01');
      });

      test('should parse YYYY/MM/DD format', () => {
        expect(parseDate('2010/03/15')).toBe('2010-03-15');
        expect(parseDate('2000/1/1')).toBe('2000-01-01');
      });

      test('should return null for invalid dates', () => {
        expect(parseDate('invalid')).toBe(null);
        expect(parseDate('')).toBe(null);
        expect(parseDate(null)).toBe(null);
      });
    });

    describe('matchCACFields', () => {
      test('should match when all fields are identical', () => {
        const apiData = {
          name: 'ACME CORPORATION LIMITED',
          registrationNumber: 'RC123456',
          companyStatus: 'Verified',
          registrationDate: '15/03/2010'
        };

        const excelData = {
          'Company Name': 'Acme Corporation Ltd',
          'Registration Number': 'RC123456',
          'Registration Date': '15/03/2010'
        };

        const result = matchCACFields(apiData, excelData);
        expect(result.matched).toBe(true);
        expect(result.failedFields).toEqual([]);
      });

      test('should detect company name mismatch', () => {
        const apiData = {
          name: 'ACME CORPORATION LIMITED',
          registrationNumber: 'RC123456',
          companyStatus: 'Verified',
          registrationDate: '15/03/2010'
        };

        const excelData = {
          'Company Name': 'Wrong Company Ltd',
          'Registration Number': 'RC123456',
          'Registration Date': '15/03/2010'
        };

        const result = matchCACFields(apiData, excelData);
        expect(result.matched).toBe(false);
        expect(result.failedFields).toContain('Company Name');
      });

      test('should detect registration number mismatch', () => {
        const apiData = {
          name: 'ACME CORPORATION LIMITED',
          registrationNumber: 'RC123456',
          companyStatus: 'Verified',
          registrationDate: '15/03/2010'
        };

        const excelData = {
          'Company Name': 'Acme Corporation Ltd',
          'Registration Number': 'RC999999',
          'Registration Date': '15/03/2010'
        };

        const result = matchCACFields(apiData, excelData);
        expect(result.matched).toBe(false);
        expect(result.failedFields).toContain('Registration Number');
      });

      test('should detect registration date mismatch', () => {
        const apiData = {
          name: 'ACME CORPORATION LIMITED',
          registrationNumber: 'RC123456',
          companyStatus: 'Verified',
          registrationDate: '15/03/2010'
        };

        const excelData = {
          'Company Name': 'Acme Corporation Ltd',
          'Registration Number': 'RC123456',
          'Registration Date': '01/01/2020'
        };

        const result = matchCACFields(apiData, excelData);
        expect(result.matched).toBe(false);
        expect(result.failedFields).toContain('Registration Date');
      });

      test('should detect invalid company status', () => {
        const apiData = {
          name: 'ACME CORPORATION LIMITED',
          registrationNumber: 'RC123456',
          companyStatus: 'Inactive',
          registrationDate: '15/03/2010'
        };

        const excelData = {
          'Company Name': 'Acme Corporation Ltd',
          'Registration Number': 'RC123456',
          'Registration Date': '15/03/2010'
        };

        const result = matchCACFields(apiData, excelData);
        expect(result.matched).toBe(false);
        expect(result.failedFields).toContain('Company Status');
      });

      test('should accept Active company status', () => {
        const apiData = {
          name: 'ACME CORPORATION LIMITED',
          registrationNumber: 'RC123456',
          companyStatus: 'Active',
          registrationDate: '15/03/2010'
        };

        const excelData = {
          'Company Name': 'Acme Corporation Ltd',
          'Registration Number': 'RC123456',
          'Registration Date': '15/03/2010'
        };

        const result = matchCACFields(apiData, excelData);
        expect(result.matched).toBe(true);
      });

      test('should match RC numbers with and without prefix', () => {
        const apiData = {
          name: 'ACME CORPORATION LIMITED',
          registrationNumber: 'RC123456',
          companyStatus: 'Verified',
          registrationDate: '15/03/2010'
        };

        const excelData = {
          'Company Name': 'Acme Corporation Ltd',
          'Registration Number': '123456',
          'Registration Date': '15/03/2010'
        };

        const result = matchCACFields(apiData, excelData);
        expect(result.matched).toBe(true);
      });

      test('should match dates in different formats', () => {
        const apiData = {
          name: 'ACME CORPORATION LIMITED',
          registrationNumber: 'RC123456',
          companyStatus: 'Verified',
          registrationDate: '15/03/2010'
        };

        const excelData = {
          'Company Name': 'Acme Corporation Ltd',
          'Registration Number': 'RC123456',
          'Registration Date': '2010-03-15'
        };

        const result = matchCACFields(apiData, excelData);
        expect(result.matched).toBe(true);
      });
    });

    describe('getUserFriendlyError', () => {
      test('should return user-friendly error messages', () => {
        expect(getUserFriendlyError('INVALID_INPUT')).toBe('RC number is required. Please provide a valid RC number.');
        expect(getUserFriendlyError('CAC_NOT_FOUND')).toBe('RC number not found in CAC database. Please verify your RC number and try again.');
        expect(getUserFriendlyError('NETWORK_ERROR')).toBe('Network error. Please try again later.');
        expect(getUserFriendlyError('FIELD_MISMATCH')).toBe('The company information provided does not match CAC records. Please contact your broker.');
        expect(getUserFriendlyError('INVALID_SECRET_KEY')).toBe('Verification service unavailable. Please contact support.');
        expect(getUserFriendlyError('INSUFFICIENT_BALANCE')).toBe('Verification service unavailable. Please contact support.');
        expect(getUserFriendlyError('UNKNOWN_ERROR')).toBe('An error occurred during verification. Please contact support.');
      });
    });

    describe('getTechnicalError', () => {
      test('should return technical error messages', () => {
        const details = {
          statusCode: 400,
          responseStatusCode: 'FF',
          message: 'Invalid secret key',
          attempt: 2,
          failedFields: ['Company Name', 'Registration Date']
        };

        const error = getTechnicalError('INVALID_SECRET_KEY', details);
        expect(error).toContain('Error Code: INVALID_SECRET_KEY');
        expect(error).toContain('Status Code: 400');
        expect(error).toContain('Response Status Code: FF');
        expect(error).toContain('Message: Invalid secret key');
        expect(error).toContain('Attempt: 2');
        expect(error).toContain('Failed Fields: Company Name, Registration Date');
      });
    });
  });

  describe('Response parsing', () => {
    test('should parse successful response correctly', async () => {
      const result = await verifyCAC('RC123456');

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('ACME CORPORATION LIMITED');
      expect(result.data.registrationNumber).toBe('RC123456');
      expect(result.data.companyStatus).toBe('Verified');
      expect(result.data.registrationDate).toBe('15/03/2010');
      expect(result.data.typeOfEntity).toBe('Private Limited Company');
    });

    test('should handle custom response', async () => {
      const customResponse = {
        success: true,
        data: {
          name: 'CUSTOM COMPANY LTD',
          registrationNumber: 'RC999999',
          companyStatus: 'Verified',
          registrationDate: '01/01/2020',
          typeOfEntity: 'Private Limited Company'
        },
        responseInfo: {
          statusCode: '00',
          message: 'Custom response'
        }
      };

      setMockBehavior({ customResponse });

      const result = await verifyCAC('RC123456');

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('CUSTOM COMPANY LTD');
    });
  });
});
