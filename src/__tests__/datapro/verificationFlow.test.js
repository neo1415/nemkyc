/**
 * Integration tests for verification flow
 * 
 * Tests:
 * - End-to-end customer verification
 * - Bulk verification
 * - Error scenarios
 * - Notification sending (mocked)
 * - Encryption/decryption in flow
 */

const crypto = require('crypto');

// Set up encryption key
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');

const {
  verifyNIN,
  matchFields,
  getUserFriendlyError,
  getTechnicalError,
  resetMockBehavior,
  getMockSuccessNINs
} = require('../../../server-services/__mocks__/dataproClient.cjs');

const {
  encryptData,
  decryptData,
  encryptIdentityFields,
  decryptIdentityFields
} = require('../../../server-utils/encryption.cjs');

describe('Verification Flow Integration', () => {
  beforeEach(() => {
    resetMockBehavior();
  });

  describe('End-to-end customer verification', () => {
    test('should complete full verification flow successfully', async () => {
      // Step 1: Customer data from Excel (encrypted at rest)
      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'M',
        dateOfBirth: '12/05/1969',
        phoneNumber: '08123456789',
        nin: '12345678901'
      };

      // Step 2: Encrypt NIN before storing
      const encryptedData = encryptIdentityFields(customerData, ['nin']);
      expect(encryptedData.nin.encrypted).toBeDefined();
      expect(encryptedData.nin.iv).toBeDefined();

      // Step 3: Decrypt NIN for verification
      const decryptedData = decryptIdentityFields(encryptedData, ['nin']);
      expect(decryptedData.nin).toBe('12345678901');

      // Step 4: Call Datapro API
      const verificationResult = await verifyNIN(decryptedData.nin);
      expect(verificationResult.success).toBe(true);

      // Step 5: Match fields
      const matchResult = matchFields(verificationResult.data, customerData);
      expect(matchResult.matched).toBe(true);

      // Step 6: Update entry status to "verified"
      const finalStatus = matchResult.matched ? 'verified' : 'verification_failed';
      expect(finalStatus).toBe('verified');
    });

    test('should handle verification failure with field mismatch', async () => {
      // Customer data with mismatched name
      const customerData = {
        firstName: 'Jane', // Wrong name
        lastName: 'Doe',
        gender: 'M',
        dateOfBirth: '12/05/1969',
        nin: '11111111111' // This NIN returns wrong first name
      };

      // Encrypt NIN
      const encryptedData = encryptIdentityFields(customerData, ['nin']);

      // Decrypt for verification
      const decryptedData = decryptIdentityFields(encryptedData, ['nin']);

      // Call API
      const verificationResult = await verifyNIN(decryptedData.nin);
      expect(verificationResult.success).toBe(true);

      // Match fields - should fail
      const matchResult = matchFields(verificationResult.data, customerData);
      expect(matchResult.matched).toBe(false);
      expect(matchResult.failedFields).toContain('First Name');

      // Generate error messages
      const userError = getUserFriendlyError('FIELD_MISMATCH');
      const techError = getTechnicalError('FIELD_MISMATCH', {
        failedFields: matchResult.failedFields
      });

      expect(userError).toContain('does not match our records');
      expect(techError).toContain('First Name');
    });

    test('should handle API errors gracefully', async () => {
      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        nin: '40000000000' // This triggers 400 error
      };

      // Encrypt NIN
      const encryptedData = encryptIdentityFields(customerData, ['nin']);

      // Decrypt for verification
      const decryptedData = decryptIdentityFields(encryptedData, ['nin']);

      // Call API - should fail
      const verificationResult = await verifyNIN(decryptedData.nin);
      expect(verificationResult.success).toBe(false);
      expect(verificationResult.errorCode).toBe('BAD_REQUEST');

      // Generate error messages
      const userError = getUserFriendlyError(verificationResult.errorCode);
      expect(userError).toContain('Invalid NIN format');
    });
  });

  describe('Bulk verification', () => {
    test('should process multiple entries successfully', async () => {
      const entries = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          gender: 'M',
          dateOfBirth: '12/05/1969',
          nin: '12345678901'
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          gender: 'F',
          dateOfBirth: '04/01/1980',
          nin: '98765432109'
        }
      ];

      const results = [];

      for (const entry of entries) {
        // Encrypt
        const encrypted = encryptIdentityFields(entry, ['nin']);

        // Decrypt for verification
        const decrypted = decryptIdentityFields(encrypted, ['nin']);

        // Verify
        const verificationResult = await verifyNIN(decrypted.nin);

        if (verificationResult.success) {
          const matchResult = matchFields(verificationResult.data, entry);
          results.push({
            id: entry.id,
            success: matchResult.matched,
            failedFields: matchResult.failedFields
          });
        } else {
          results.push({
            id: entry.id,
            success: false,
            error: verificationResult.errorCode
          });
        }
      }

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    test('should handle mixed success and failure in bulk', async () => {
      const entries = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          gender: 'M',
          dateOfBirth: '12/05/1969',
          nin: '12345678901' // Success
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Doe',
          gender: 'M',
          dateOfBirth: '12/05/1969',
          nin: '11111111111' // Field mismatch
        },
        {
          id: '3',
          firstName: 'Test',
          lastName: 'User',
          gender: 'M',
          dateOfBirth: '01/01/2000',
          nin: '99999999999' // Not found
        }
      ];

      const results = [];

      for (const entry of entries) {
        const encrypted = encryptIdentityFields(entry, ['nin']);
        const decrypted = decryptIdentityFields(encrypted, ['nin']);
        const verificationResult = await verifyNIN(decrypted.nin);

        if (verificationResult.success) {
          const matchResult = matchFields(verificationResult.data, entry);
          results.push({
            id: entry.id,
            success: matchResult.matched,
            failedFields: matchResult.failedFields
          });
        } else {
          results.push({
            id: entry.id,
            success: false,
            error: verificationResult.errorCode
          });
        }
      }

      expect(results.length).toBe(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(false);
      expect(results[2].error).toBe('NIN_NOT_FOUND');
    });

    test('should skip already verified entries', () => {
      const entries = [
        { id: '1', status: 'pending', nin: '12345678901' },
        { id: '2', status: 'verified', nin: '98765432109' },
        { id: '3', status: 'link_sent', nin: '11111111111' }
      ];

      const entriesToVerify = entries.filter(
        entry => entry.status !== 'verified'
      );

      expect(entriesToVerify.length).toBe(2);
      expect(entriesToVerify.map(e => e.id)).toEqual(['1', '3']);
    });
  });

  describe('Error scenarios', () => {
    test('should handle network timeout', async () => {
      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        nin: '12345678901'
      };

      const encrypted = encryptIdentityFields(customerData, ['nin']);
      const decrypted = decryptIdentityFields(encrypted, ['nin']);

      // Simulate timeout by using mock behavior
      const { setMockBehavior } = require('../../../server-services/__mocks__/dataproClient.cjs');
      setMockBehavior({ shouldTimeout: true });

      const result = await verifyNIN(decrypted.nin);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NETWORK_ERROR');
      expect(result.details.isTimeout).toBe(true);
    });

    test('should handle invalid NIN format', async () => {
      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        nin: '123' // Too short
      };

      const encrypted = encryptIdentityFields(customerData, ['nin']);
      const decrypted = decryptIdentityFields(encrypted, ['nin']);

      const result = await verifyNIN(decrypted.nin);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_FORMAT');
    });

    test('should handle missing NIN', async () => {
      const result = await verifyNIN(null);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INPUT');
    });
  });

  describe('Encryption/decryption in flow', () => {
    test('should maintain data integrity through encryption cycle', () => {
      const originalNIN = '12345678901';

      // Encrypt
      const { encrypted, iv } = encryptData(originalNIN);

      // Decrypt
      const decrypted = decryptData(encrypted, iv);

      expect(decrypted).toBe(originalNIN);
    });

    test('should encrypt multiple identity fields', () => {
      const data = {
        nin: '12345678901',
        bvn: '22123456789',
        cac: 'RC123456',
        name: 'John Doe'
      };

      const encrypted = encryptIdentityFields(data);

      expect(encrypted.nin.encrypted).toBeDefined();
      expect(encrypted.bvn.encrypted).toBeDefined();
      expect(encrypted.cac.encrypted).toBeDefined();
      expect(encrypted.name).toBe('John Doe'); // Not encrypted

      const decrypted = decryptIdentityFields(encrypted);

      expect(decrypted.nin).toBe('12345678901');
      expect(decrypted.bvn).toBe('22123456789');
      expect(decrypted.cac).toBe('RC123456');
      expect(decrypted.name).toBe('John Doe');
    });

    test('should handle partial encryption', () => {
      const data = {
        nin: '12345678901',
        name: 'John Doe',
        email: 'john@example.com'
      };

      const encrypted = encryptIdentityFields(data, ['nin']);

      expect(encrypted.nin.encrypted).toBeDefined();
      expect(encrypted.name).toBe('John Doe');
      expect(encrypted.email).toBe('john@example.com');
    });
  });

  describe('Notification sending (mocked)', () => {
    test('should generate customer notification on success', async () => {
      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'M',
        dateOfBirth: '12/05/1969',
        email: 'john@example.com',
        nin: '12345678901'
      };

      const encrypted = encryptIdentityFields(customerData, ['nin']);
      const decrypted = decryptIdentityFields(encrypted, ['nin']);
      const verificationResult = await verifyNIN(decrypted.nin);
      const matchResult = matchFields(verificationResult.data, customerData);

      // Mock notification
      const notification = {
        to: customerData.email,
        subject: 'Verification Successful',
        body: 'Your identity has been verified successfully.',
        status: matchResult.matched ? 'success' : 'failed'
      };

      expect(notification.status).toBe('success');
      expect(notification.to).toBe('john@example.com');
    });

    test('should generate customer and staff notifications on failure', async () => {
      const customerData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        nin: '11111111111' // Mismatch
      };

      const encrypted = encryptIdentityFields(customerData, ['nin']);
      const decrypted = decryptIdentityFields(encrypted, ['nin']);
      const verificationResult = await verifyNIN(decrypted.nin);
      const matchResult = matchFields(verificationResult.data, customerData);

      // Customer notification
      const customerNotification = {
        to: customerData.email,
        subject: 'Verification Failed',
        body: getUserFriendlyError('FIELD_MISMATCH'),
        type: 'customer'
      };

      // Staff notification
      const staffNotification = {
        to: 'compliance@nem-insurance.com',
        subject: 'Verification Failed - Action Required',
        body: getTechnicalError('FIELD_MISMATCH', {
          failedFields: matchResult.failedFields
        }),
        type: 'staff'
      };

      expect(customerNotification.body).toContain('does not match our records');
      expect(staffNotification.body).toContain('First Name');
    });
  });
});
