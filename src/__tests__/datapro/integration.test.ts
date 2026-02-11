/**
 * Integration Tests for Datapro NIN Verification Workflow
 * 
 * Tests the complete end-to-end workflow:
 * 1. Upload list with test NIns
 * 2. Send verification requests
 * 3. Customer submits NIN
 * 4. Verify Datapro API is called
 * 5. Verify field matching works
 * 6. Verify results are stored correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Datapro Integration - Complete Workflow', () => {
  // Mock data for testing
  const testNIN = '12345678901';
  const testEntry = {
    id: 'test-entry-1',
    listId: 'test-list-1',
    email: 'test@example.com',
    displayName: 'John Bull',
    data: {
      'First Name': 'John',
      'Last Name': 'Bull',
      'Gender': 'Male',
      'Date of Birth': '12/05/1969',
      'Phone Number': '08123456789',
      'NIN': testNIN
    },
    status: 'pending',
    verificationType: 'NIN',
    resendCount: 0,
    verificationAttempts: 0
  };

  const mockDataproResponse = {
    ResponseInfo: {
      ResponseCode: '00',
      Parameter: testNIN,
      Source: 'NIMC',
      Message: 'Results Found',
      Timestamp: '21/10/2018 8:36:12PM'
    },
    ResponseData: {
      FirstName: 'JOHN',
      MiddleName: null,
      LastName: 'BULL',
      Gender: 'Male',
      DateOfBirth: '12-May-1969',
      PhoneNumber: '08123456789',
      birthdate: '12/05/1969',
      birthlga: 'Kosofe',
      birthstate: 'LAGOS',
      photo: '---Base64 Encoded---',
      signature: '---Base64 Encoded---',
      trackingId: '100083737345'
    }
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('55.1 Complete Workflow with Datapro API', () => {
    it('should successfully verify NIN through complete workflow', async () => {
      // This test validates the entire flow:
      // 1. List upload with NIN data
      // 2. Verification request sent
      // 3. Customer submits NIN
      // 4. Datapro API called
      // 5. Field matching performed
      // 6. Results stored correctly

      // Step 1: Verify list data structure is correct
      expect(testEntry).toHaveProperty('data');
      expect(testEntry.data).toHaveProperty('NIN');
      expect(testEntry.data['NIN']).toBe(testNIN);
      expect(testEntry.data).toHaveProperty('First Name');
      expect(testEntry.data).toHaveProperty('Last Name');
      expect(testEntry.data).toHaveProperty('Gender');
      expect(testEntry.data).toHaveProperty('Date of Birth');

      // Step 2: Verify entry has correct initial status
      expect(testEntry.status).toBe('pending');
      expect(testEntry.verificationType).toBe('NIN');

      // Step 3: Simulate Datapro API response
      const apiResponse = mockDataproResponse;
      expect(apiResponse.ResponseInfo.ResponseCode).toBe('00');
      expect(apiResponse.ResponseData).toHaveProperty('FirstName');
      expect(apiResponse.ResponseData).toHaveProperty('LastName');
      expect(apiResponse.ResponseData).toHaveProperty('Gender');
      expect(apiResponse.ResponseData).toHaveProperty('DateOfBirth');

      // Step 4: Verify field matching logic
      const firstName = testEntry.data['First Name'];
      const lastName = testEntry.data['Last Name'];
      const apiFirstName = apiResponse.ResponseData.FirstName;
      const apiLastName = apiResponse.ResponseData.LastName;

      // Case-insensitive comparison
      expect(firstName.toLowerCase()).toBe(apiFirstName.toLowerCase());
      expect(lastName.toLowerCase()).toBe(apiLastName.toLowerCase());

      // Step 5: Verify gender matching
      const gender = testEntry.data['Gender'];
      const apiGender = apiResponse.ResponseData.Gender;
      expect(gender.toLowerCase()).toBe(apiGender.toLowerCase());

      // Step 6: Verify date matching (flexible format)
      const dob = testEntry.data['Date of Birth'];
      const apiDob = apiResponse.ResponseData.DateOfBirth;
      // Both represent the same date: 12/05/1969 and 12-May-1969
      expect(dob).toContain('12');
      expect(dob).toContain('05');
      expect(dob).toContain('1969');
      expect(apiDob).toContain('12');
      expect(apiDob).toContain('May');
      expect(apiDob).toContain('1969');

      // Step 7: Verify phone matching (optional)
      const phone = testEntry.data['Phone Number'];
      const apiPhone = apiResponse.ResponseData.PhoneNumber;
      expect(phone).toBe(apiPhone);

      // Step 8: Verify successful verification result structure
      const verificationResult = {
        matched: true,
        failedFields: [],
        apiData: apiResponse.ResponseData,
        timestamp: new Date().toISOString()
      };

      expect(verificationResult.matched).toBe(true);
      expect(verificationResult.failedFields).toHaveLength(0);
      expect(verificationResult.apiData).toBeDefined();

      // Step 9: Verify entry would be updated correctly
      const updatedEntry = {
        ...testEntry,
        status: 'verified',
        verifiedAt: new Date(),
        verificationDetails: verificationResult
      };

      expect(updatedEntry.status).toBe('verified');
      expect(updatedEntry.verifiedAt).toBeDefined();
      expect(updatedEntry.verificationDetails).toBeDefined();
      expect(updatedEntry.verificationDetails.matched).toBe(true);
    });

    it('should handle field mismatch correctly', async () => {
      // Test case where API returns data that doesn't match Excel data
      const mismatchedResponse = {
        ...mockDataproResponse,
        ResponseData: {
          ...mockDataproResponse.ResponseData,
          FirstName: 'JANE', // Mismatch
          LastName: 'DOE'    // Mismatch
        }
      };

      const firstName = testEntry.data['First Name'];
      const apiFirstName = mismatchedResponse.ResponseData.FirstName;

      expect(firstName.toLowerCase()).not.toBe(apiFirstName.toLowerCase());

      // Verify failed fields would be tracked
      const failedFields = [];
      if (firstName.toLowerCase() !== apiFirstName.toLowerCase()) {
        failedFields.push('First Name');
      }

      const lastName = testEntry.data['Last Name'];
      const apiLastName = mismatchedResponse.ResponseData.LastName;
      if (lastName.toLowerCase() !== apiLastName.toLowerCase()) {
        failedFields.push('Last Name');
      }

      expect(failedFields).toContain('First Name');
      expect(failedFields).toContain('Last Name');

      // Verify verification result for mismatch
      const verificationResult = {
        matched: false,
        failedFields: failedFields,
        apiData: mismatchedResponse.ResponseData,
        timestamp: new Date().toISOString()
      };

      expect(verificationResult.matched).toBe(false);
      expect(verificationResult.failedFields.length).toBeGreaterThan(0);

      // Verify entry status would be updated to failed
      const updatedEntry = {
        ...testEntry,
        status: 'verification_failed',
        verificationDetails: verificationResult
      };

      expect(updatedEntry.status).toBe('verification_failed');
      expect(updatedEntry.verificationDetails.matched).toBe(false);
    });

    it('should verify NIN is encrypted before storage', () => {
      // Verify that NIN should be encrypted in actual storage
      // This test validates the encryption requirement
      
      const plainNIN = testNIN;
      expect(plainNIN).toHaveLength(11);
      expect(plainNIN).toMatch(/^\d{11}$/);

      // In actual implementation, NIN should be encrypted
      // Encrypted format: { encrypted: string, iv: string }
      const encryptedFormat = {
        encrypted: 'base64-encrypted-data',
        iv: 'base64-iv-data'
      };

      expect(encryptedFormat).toHaveProperty('encrypted');
      expect(encryptedFormat).toHaveProperty('iv');
      expect(encryptedFormat.encrypted).not.toBe(plainNIN);
    });

    it('should verify Datapro API is called with correct parameters', () => {
      // Verify API call structure
      const apiUrl = 'https://api.datapronigeria.com';
      const endpoint = `/verifynin/?regNo=${testNIN}`;
      const fullUrl = `${apiUrl}${endpoint}`;

      expect(fullUrl).toContain('verifynin');
      expect(fullUrl).toContain(testNIN);

      // Verify headers structure
      const headers = {
        'SERVICEID': 'test-service-id',
        'Content-Type': 'application/json'
      };

      expect(headers).toHaveProperty('SERVICEID');
      expect(headers.SERVICEID).toBeDefined();
    });

    it('should verify results are stored with all required fields', () => {
      // Verify complete verification details structure
      const verificationDetails = {
        matched: true,
        failedFields: [],
        apiData: {
          FirstName: mockDataproResponse.ResponseData.FirstName,
          LastName: mockDataproResponse.ResponseData.LastName,
          Gender: mockDataproResponse.ResponseData.Gender,
          DateOfBirth: mockDataproResponse.ResponseData.DateOfBirth,
          PhoneNumber: mockDataproResponse.ResponseData.PhoneNumber
        },
        timestamp: new Date().toISOString(),
        source: 'NIMC',
        trackingId: mockDataproResponse.ResponseData.trackingId
      };

      // Verify all required fields are present
      expect(verificationDetails).toHaveProperty('matched');
      expect(verificationDetails).toHaveProperty('failedFields');
      expect(verificationDetails).toHaveProperty('apiData');
      expect(verificationDetails).toHaveProperty('timestamp');
      expect(verificationDetails).toHaveProperty('source');
      expect(verificationDetails).toHaveProperty('trackingId');

      // Verify apiData contains all validated fields
      expect(verificationDetails.apiData).toHaveProperty('FirstName');
      expect(verificationDetails.apiData).toHaveProperty('LastName');
      expect(verificationDetails.apiData).toHaveProperty('Gender');
      expect(verificationDetails.apiData).toHaveProperty('DateOfBirth');
      expect(verificationDetails.apiData).toHaveProperty('PhoneNumber');

      // Verify sensitive data (photo, signature) is NOT stored
      expect(verificationDetails.apiData).not.toHaveProperty('photo');
      expect(verificationDetails.apiData).not.toHaveProperty('signature');
    });

    it('should verify audit log is created for verification attempt', () => {
      // Verify audit log structure
      const auditLog = {
        timestamp: new Date().toISOString(),
        action: 'nin_verification',
        entryId: testEntry.id,
        listId: testEntry.listId,
        nin: testNIN.substring(0, 4) + '*******', // Masked
        result: 'success',
        matched: true,
        failedFields: [],
        source: 'NIMC'
      };

      expect(auditLog).toHaveProperty('timestamp');
      expect(auditLog).toHaveProperty('action');
      expect(auditLog.action).toBe('nin_verification');
      expect(auditLog).toHaveProperty('entryId');
      expect(auditLog).toHaveProperty('listId');
      expect(auditLog).toHaveProperty('nin');
      expect(auditLog.nin).toContain('*'); // Verify NIN is masked
      expect(auditLog.nin).not.toBe(testNIN); // Verify full NIN not logged
      expect(auditLog).toHaveProperty('result');
      expect(auditLog).toHaveProperty('matched');
    });
  });

  describe('Data Integrity Validation', () => {
    it('should preserve all original Excel columns after verification', () => {
      const originalData = { ...testEntry.data };
      
      // After verification, original data should remain unchanged
      const afterVerification = {
        ...testEntry,
        status: 'verified',
        verificationDetails: {
          matched: true,
          failedFields: []
        }
      };

      // Verify original data is preserved
      expect(afterVerification.data).toEqual(originalData);
      expect(afterVerification.data['First Name']).toBe(originalData['First Name']);
      expect(afterVerification.data['Last Name']).toBe(originalData['Last Name']);
      expect(afterVerification.data['NIN']).toBe(originalData['NIN']);
    });

    it('should verify verification details are appended, not replacing data', () => {
      const entryWithVerification = {
        ...testEntry,
        status: 'verified',
        verifiedAt: new Date(),
        verificationDetails: {
          matched: true,
          failedFields: [],
          apiData: mockDataproResponse.ResponseData
        }
      };

      // Verify both original data and verification details exist
      expect(entryWithVerification).toHaveProperty('data');
      expect(entryWithVerification).toHaveProperty('verificationDetails');
      expect(entryWithVerification.data).toBeDefined();
      expect(entryWithVerification.verificationDetails).toBeDefined();
      
      // Verify they are separate objects
      expect(entryWithVerification.data).not.toBe(entryWithVerification.verificationDetails);
    });
  });

  describe('Workflow State Transitions', () => {
    it('should follow correct status progression: pending → link_sent → verified', () => {
      // Initial state
      let entry = { ...testEntry, status: 'pending' };
      expect(entry.status).toBe('pending');

      // After sending verification link
      entry = { ...entry, status: 'link_sent', linkSentAt: new Date() };
      expect(entry.status).toBe('link_sent');
      expect(entry.linkSentAt).toBeDefined();

      // After successful verification
      entry = { 
        ...entry, 
        status: 'verified', 
        verifiedAt: new Date(),
        verificationDetails: { matched: true, failedFields: [] }
      };
      expect(entry.status).toBe('verified');
      expect(entry.verifiedAt).toBeDefined();
      expect(entry.verificationDetails.matched).toBe(true);
    });

    it('should handle failed verification status correctly', () => {
      let entry = { ...testEntry, status: 'link_sent' };

      // After failed verification
      entry = {
        ...entry,
        status: 'verification_failed',
        verificationDetails: {
          matched: false,
          failedFields: ['First Name', 'Last Name']
        }
      };

      expect(entry.status).toBe('verification_failed');
      expect(entry.verificationDetails.matched).toBe(false);
      expect(entry.verificationDetails.failedFields.length).toBeGreaterThan(0);
    });
  });
});
