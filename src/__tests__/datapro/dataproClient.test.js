/**
 * Unit tests for Datapro API Client
 * 
 * Tests:
 * - Successful verification
 * - All error codes (400, 401, 87, 88)
 * - Network errors and retries
 * - Timeout handling
 * - Response parsing
 * - Field matching logic
 */

// Import the mock implementation directly for testing
const {
  verifyNIN,
  maskNIN,
  normalizeString,
  normalizeGender,
  parseDate,
  normalizePhone,
  matchFields,
  getUserFriendlyError,
  getTechnicalError,
  setMockBehavior,
  resetMockBehavior,
  getMockSuccessNINs,
  getMockMismatchNINs,
  getMockErrorNINs
} = require('../../../server-services/__mocks__/dataproClient.cjs');

describe('DataproClient', () => {
  beforeEach(() => {
    resetMockBehavior();
  });

  describe('verifyNIN - Successful verification', () => {
    test('should verify valid NIN successfully', async () => {
      const [successNIN] = getMockSuccessNINs();
      const result = await verifyNIN(successNIN);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.firstName).toBeDefined();
      expect(result.data.lastName).toBeDefined();
      expect(result.data.gender).toBeDefined();
      expect(result.data.dateOfBirth).toBeDefined();
      expect(result.responseInfo).toBeDefined();
      expect(result.responseInfo.responseCode).toBe('00');
    });

    test('should return all expected fields in successful response', async () => {
      const [successNIN] = getMockSuccessNINs();
      const result = await verifyNIN(successNIN);

      expect(result.data).toHaveProperty('firstName');
      expect(result.data).toHaveProperty('middleName');
      expect(result.data).toHaveProperty('lastName');
      expect(result.data).toHaveProperty('gender');
      expect(result.data).toHaveProperty('dateOfBirth');
      expect(result.data).toHaveProperty('phoneNumber');
      expect(result.data).toHaveProperty('birthdate');
      expect(result.data).toHaveProperty('birthlga');
      expect(result.data).toHaveProperty('birthstate');
      expect(result.data).toHaveProperty('trackingId');
    });
  });

  describe('verifyNIN - Error codes', () => {
    test('should handle 400 Bad Request error', async () => {
      const errorNINs = getMockErrorNINs();
      const badRequestNIN = errorNINs.find(nin => nin.startsWith('400'));

      const result = await verifyNIN(badRequestNIN);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('BAD_REQUEST');
      expect(result.error).toContain('Invalid NIN format');
      expect(result.details.statusCode).toBe(400);
    });

    test('should handle 401 Unauthorized error', async () => {
      const errorNINs = getMockErrorNINs();
      const unauthorizedNIN = errorNINs.find(nin => nin.startsWith('401'));

      const result = await verifyNIN(unauthorizedNIN);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('UNAUTHORIZED');
      expect(result.error).toContain('Verification service unavailable');
      expect(result.details.statusCode).toBe(401);
    });

    test('should handle 87 Invalid Service ID error', async () => {
      const errorNINs = getMockErrorNINs();
      const invalidServiceIdNIN = errorNINs.find(nin => nin.startsWith('870'));

      const result = await verifyNIN(invalidServiceIdNIN);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_SERVICE_ID');
      expect(result.error).toContain('Verification service unavailable');
      expect(result.details.statusCode).toBe(87);
    });

    test('should handle 88 Network Error', async () => {
      const errorNINs = getMockErrorNINs();
      const networkErrorNIN = errorNINs.find(nin => nin.startsWith('880'));

      const result = await verifyNIN(networkErrorNIN);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NETWORK_ERROR');
      expect(result.error).toContain('Network error');
      expect(result.details.statusCode).toBe(88);
    });

    test('should handle NIN not found error', async () => {
      const errorNINs = getMockErrorNINs();
      const notFoundNIN = errorNINs.find(nin => nin.startsWith('999'));

      const result = await verifyNIN(notFoundNIN);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NIN_NOT_FOUND');
      expect(result.error).toContain('NIN not found');
    });
  });

  describe('verifyNIN - Input validation', () => {
    test('should reject empty NIN', async () => {
      const result = await verifyNIN('');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INPUT');
      expect(result.error).toContain('NIN is required');
    });

    test('should reject null NIN', async () => {
      const result = await verifyNIN(null);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INPUT');
    });

    test('should reject NIN with wrong length', async () => {
      const result = await verifyNIN('123456789'); // Only 9 digits

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
      expect(result.error).toContain('11 digits');
    });

    test('should reject NIN with non-numeric characters', async () => {
      const result = await verifyNIN('1234567890A');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });
  });

  describe('verifyNIN - Network errors and retries', () => {
    test('should handle timeout errors', async () => {
      setMockBehavior({ shouldTimeout: true });

      const result = await verifyNIN('12345678901');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NETWORK_ERROR');
      expect(result.error).toContain('Network error');
    });

    test('should handle network connection errors', async () => {
      setMockBehavior({ shouldThrowNetworkError: true });

      const result = await verifyNIN('12345678901');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NETWORK_ERROR');
    });
  });

  describe('Utility Functions', () => {
    describe('maskNIN', () => {
      test('should mask NIN correctly', () => {
        expect(maskNIN('12345678901')).toBe('1234*******');
        expect(maskNIN('1234')).toBe('1234');
        expect(maskNIN('123')).toBe('****');
        expect(maskNIN('')).toBe('****');
        expect(maskNIN(null)).toBe('****');
      });
    });

    describe('normalizeString', () => {
      test('should normalize strings correctly', () => {
        expect(normalizeString('  JOHN  DOE  ')).toBe('john doe');
        expect(normalizeString('John')).toBe('john');
        expect(normalizeString('')).toBe('');
        expect(normalizeString(null)).toBe('');
      });
    });

    describe('normalizeGender', () => {
      test('should normalize gender values', () => {
        expect(normalizeGender('M')).toBe('male');
        expect(normalizeGender('Male')).toBe('male');
        expect(normalizeGender('MALE')).toBe('male');
        expect(normalizeGender('F')).toBe('female');
        expect(normalizeGender('Female')).toBe('female');
        expect(normalizeGender('FEMALE')).toBe('female');
        expect(normalizeGender('')).toBe('');
        expect(normalizeGender(null)).toBe('');
      });
    });

    describe('parseDate', () => {
      test('should parse DD/MM/YYYY format', () => {
        expect(parseDate('04/01/1980')).toBe('1980-01-04');
        expect(parseDate('1/1/2000')).toBe('2000-01-01');
      });

      test('should parse DD-MMM-YYYY format', () => {
        expect(parseDate('12-May-1969')).toBe('1969-05-12');
        expect(parseDate('1-Jan-2000')).toBe('2000-01-01');
      });

      test('should parse YYYY-MM-DD format', () => {
        expect(parseDate('1980-01-04')).toBe('1980-01-04');
        expect(parseDate('2000-1-1')).toBe('2000-01-01');
      });

      test('should parse YYYY/MM/DD format', () => {
        expect(parseDate('1980/01/04')).toBe('1980-01-04');
        expect(parseDate('2000/1/1')).toBe('2000-01-01');
      });

      test('should return null for invalid dates', () => {
        expect(parseDate('invalid')).toBe(null);
        expect(parseDate('')).toBe(null);
        expect(parseDate(null)).toBe(null);
      });
    });

    describe('normalizePhone', () => {
      test('should normalize phone numbers', () => {
        expect(normalizePhone('08123456789')).toBe('08123456789');
        expect(normalizePhone('234 812 345 6789')).toBe('08123456789');
        expect(normalizePhone('+234-812-345-6789')).toBe('08123456789');
        expect(normalizePhone('(234) 812-345-6789')).toBe('08123456789');
        expect(normalizePhone('')).toBe('');
        expect(normalizePhone(null)).toBe('');
      });
    });

    describe('matchFields', () => {
      test('should match when all fields are identical', () => {
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
          'Phone Number': '08123456789'
        };

        const result = matchFields(apiData, excelData);
        expect(result.matched).toBe(true);
        expect(result.failedFields).toEqual([]);
      });

      test('should detect first name mismatch', () => {
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

      test('should detect last name mismatch', () => {
        const apiData = {
          firstName: 'JOHN',
          lastName: 'DOE',
          gender: 'Male',
          dateOfBirth: '12-May-1969'
        };

        const excelData = {
          'First Name': 'John',
          'Last Name': 'Smith',
          'Gender': 'M',
          'Date of Birth': '12/05/1969'
        };

        const result = matchFields(apiData, excelData);
        expect(result.matched).toBe(false);
        expect(result.failedFields).toContain('Last Name');
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
          'Gender': 'F',
          'Date of Birth': '12/05/1969'
        };

        const result = matchFields(apiData, excelData);
        expect(result.matched).toBe(false);
        expect(result.failedFields).toContain('Gender');
      });

      test('should detect date of birth mismatch', () => {
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
    });

    describe('getUserFriendlyError', () => {
      test('should return user-friendly error messages', () => {
        expect(getUserFriendlyError('INVALID_FORMAT')).toBe('Invalid NIN format. Please check and try again.');
        expect(getUserFriendlyError('NIN_NOT_FOUND')).toBe('NIN not found in NIMC database. Please verify your NIN and try again.');
        expect(getUserFriendlyError('NETWORK_ERROR')).toBe('Network error. Please try again later.');
        expect(getUserFriendlyError('FIELD_MISMATCH')).toBe('The information provided does not match our records. Please contact your broker.');
        expect(getUserFriendlyError('UNKNOWN_ERROR')).toBe('An error occurred during verification. Please contact support.');
      });
    });

    describe('getTechnicalError', () => {
      test('should return technical error messages', () => {
        const details = {
          statusCode: 400,
          message: 'Bad request',
          attempt: 2,
          failedFields: ['First Name', 'Last Name']
        };

        const error = getTechnicalError('BAD_REQUEST', details);
        expect(error).toContain('Error Code: BAD_REQUEST');
        expect(error).toContain('Status Code: 400');
        expect(error).toContain('Message: Bad request');
        expect(error).toContain('Attempt: 2');
        expect(error).toContain('Failed Fields: First Name, Last Name');
      });
    });
  });
});
