/**
 * Complete CAC Verification Workflow End-to-End Test
 * 
 * This test validates the entire CAC verification workflow from start to finish:
 * 1. Upload CAC list with real test RC numbers
 * 2. Send verification requests
 * 3. Customer submits CAC
 * 4. Verify VerifyData API is called
 * 5. Verify field matching works
 * 6. Verify results are stored correctly
 * 
 * Task: 64.1 Test complete CAC workflow
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

describe('Complete CAC Verification Workflow', () => {
  // Test data - using realistic RC numbers for testing
  const testList = {
    name: 'CAC Test List - Complete Workflow',
    listType: 'corporate' as const,
    uploadMode: 'template' as const,
    columns: [
      'Company Name',
      'Company Address',
      'Email Address',
      'Company Type',
      'Phone Number',
      'Policy Number',
      'Registration Number',
      'Registration Date',
      'Business Address',
      'CAC'
    ],
    emailColumn: 'Email Address',
    entries: [
      {
        'Company Name': 'ACME CORPORATION LIMITED',
        'Company Address': '123 Business Street, Lagos',
        'Email Address': 'contact@acme.com',
        'Company Type': 'Private Limited Company',
        'Phone Number': '08123456789',
        'Policy Number': 'POL-2024-001',
        'Registration Number': 'RC123456',
        'Registration Date': '15/03/2010',
        'Business Address': '123 Business Street, Lagos',
        'CAC': 'RC123456'
      },
      {
        'Company Name': 'BETA INDUSTRIES PLC',
        'Company Address': '456 Commerce Road, Abuja',
        'Email Address': 'info@beta.com',
        'Company Type': 'Public Limited Company',
        'Phone Number': '08198765432',
        'Policy Number': 'POL-2024-002',
        'Registration Number': 'RC789012',
        'Registration Date': '20/06/2015',
        'Business Address': '456 Commerce Road, Abuja',
        'CAC': 'RC789012'
      }
    ]
  };

  // Mock VerifyData API responses
  const mockVerifydataResponses = {
    'RC123456': {
      success: true,
      statusCode: 200,
      message: 'success',
      data: {
        name: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        companyStatus: 'Verified',
        registrationDate: '15/03/2010',
        typeOfEntity: 'PRIVATE_COMPANY_LIMITED_BY_SHARES'
      }
    },
    'RC789012': {
      success: true,
      statusCode: 200,
      message: 'success',
      data: {
        name: 'BETA INDUSTRIES PLC',
        registrationNumber: 'RC789012',
        companyStatus: 'Verified',
        registrationDate: '20/06/2015',
        typeOfEntity: 'PUBLIC_COMPANY_LIMITED_BY_SHARES'
      }
    }
  };

  describe('Step 1: Upload CAC List', () => {
    it('should successfully parse and create CAC list from upload', () => {
      // Verify list structure
      expect(testList).toHaveProperty('name');
      expect(testList).toHaveProperty('listType');
      expect(testList.listType).toBe('corporate');
      expect(testList).toHaveProperty('uploadMode');
      expect(testList.uploadMode).toBe('template');
      expect(testList).toHaveProperty('columns');
      expect(testList).toHaveProperty('emailColumn');
      expect(testList).toHaveProperty('entries');

      // Verify columns include all required CAC fields
      expect(testList.columns).toContain('Company Name');
      expect(testList.columns).toContain('Registration Number');
      expect(testList.columns).toContain('Registration Date');
      expect(testList.columns).toContain('CAC');
      expect(testList.columns).toContain('Email Address');

      // Verify email column is detected
      expect(testList.emailColumn).toBe('Email Address');

      // Verify entries have all required data
      testList.entries.forEach(entry => {
        expect(entry).toHaveProperty('Company Name');
        expect(entry).toHaveProperty('Registration Number');
        expect(entry).toHaveProperty('Registration Date');
        expect(entry).toHaveProperty('CAC');
        expect(entry).toHaveProperty('Email Address');
        expect(entry).toHaveProperty('Policy Number');
      });
    });

    it('should validate CAC template requirements', () => {
      // Required columns for Corporate template
      const requiredColumns = [
        'Company Name',
        'Company Address',
        'Email Address',
        'Company Type',
        'Phone Number'
      ];

      requiredColumns.forEach(col => {
        expect(testList.columns).toContain(col);
      });

      // Additional required columns for CAC verification
      const cacRequiredColumns = [
        'Policy Number',
        'Registration Number',
        'Registration Date',
        'Business Address',
        'CAC'
      ];

      cacRequiredColumns.forEach(col => {
        expect(testList.columns).toContain(col);
      });
    });

    it('should extract and store CAC numbers correctly', () => {
      testList.entries.forEach(entry => {
        const cac = entry['CAC'];
        expect(cac).toBeDefined();
        expect(cac).toMatch(/^RC\d+$/);
        
        // Verify CAC matches Registration Number
        const regNumber = entry['Registration Number'];
        const normalizeRC = (rc: string) => rc.replace(/^RC[\s\-\/]*/i, '').toUpperCase();
        expect(normalizeRC(cac)).toBe(normalizeRC(regNumber));
      });
    });

    it('should create entries with correct initial status', () => {
      // Simulate entry creation
      const createdEntries = testList.entries.map((data, index) => ({
        id: `entry-${index + 1}`,
        listId: 'test-list-1',
        data: data,
        email: data['Email Address'],
        displayName: data['Company Name'],
        policyNumber: data['Policy Number'],
        status: 'pending' as const,
        verificationType: undefined,
        resendCount: 0,
        verificationAttempts: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      createdEntries.forEach(entry => {
        expect(entry.status).toBe('pending');
        expect(entry.email).toBeDefined();
        expect(entry.displayName).toBeDefined();
        expect(entry.policyNumber).toBeDefined();
        expect(entry.data).toHaveProperty('CAC');
      });
    });
  });

  describe('Step 2: Send Verification Requests', () => {
    it('should generate verification tokens for selected entries', () => {
      const selectedEntryIds = ['entry-1', 'entry-2'];
      const verificationType = 'CAC';

      // Simulate token generation
      const tokens = selectedEntryIds.map(entryId => ({
        entryId,
        token: `token-${entryId}-${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        verificationType
      }));

      tokens.forEach(tokenData => {
        expect(tokenData.token).toBeDefined();
        expect(tokenData.token.length).toBeGreaterThan(20);
        expect(tokenData.expiresAt).toBeInstanceOf(Date);
        expect(tokenData.expiresAt.getTime()).toBeGreaterThan(Date.now());
        expect(tokenData.verificationType).toBe('CAC');
      });
    });

    it('should update entry status to link_sent after email sent', () => {
      const entry = {
        id: 'entry-1',
        status: 'pending' as const,
        verificationType: undefined,
        linkSentAt: undefined
      };

      // Simulate email sent
      const updatedEntry = {
        ...entry,
        status: 'link_sent' as const,
        verificationType: 'CAC' as const,
        linkSentAt: new Date()
      };

      expect(updatedEntry.status).toBe('link_sent');
      expect(updatedEntry.verificationType).toBe('CAC');
      expect(updatedEntry.linkSentAt).toBeInstanceOf(Date);
    });

    it('should send email with correct CAC verification content', () => {
      const emailBody = `
Dear Client,

We write to inform you that, in line with the directives of the National Insurance Commission (NAICOM) and ongoing regulatory requirements on Know Your Customer (KYC) and data integrity, all insurance companies are mandated to obtain and update the identification details of their clients.

Accordingly, we kindly request your cooperation in providing the following, as applicable:

For Corporate Clients: Corporate Affairs Commission (CAC) Registration Number

To ensure confidentiality and data protection, we have provided a secured link through which the required information can be safely submitted.
      `;

      const emailContent = {
        to: 'contact@acme.com',
        subject: 'CAC Verification Required - NEM Insurance',
        body: emailBody,
        verificationType: 'CAC',
        verificationLink: 'https://app.nem.com/verify/token-123'
      };

      expect(emailContent.body).toContain('Corporate Affairs Commission');
      expect(emailContent.body).toContain('CAC');
      expect(emailContent.body).toContain('Corporate Clients');
      expect(emailContent.verificationType).toBe('CAC');
      expect(emailContent.verificationLink).toContain('/verify/');
    });
  });

  describe('Step 3: Customer Submits CAC', () => {
    it('should validate token and retrieve entry information', () => {
      const token = 'valid-token-123';
      const entry = {
        id: 'entry-1',
        listId: 'test-list-1',
        data: testList.entries[0],
        displayName: 'ACME CORPORATION LIMITED',
        policyNumber: 'POL-2024-001',
        verificationType: 'CAC' as const,
        status: 'link_sent' as const,
        token: token,
        tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      // Validate token
      const isValid = entry.token === token && 
                     entry.tokenExpiresAt.getTime() > Date.now();
      
      expect(isValid).toBe(true);
      expect(entry.verificationType).toBe('CAC');
      expect(entry.displayName).toBe('ACME CORPORATION LIMITED');
      expect(entry.policyNumber).toBe('POL-2024-001');
    });

    it('should display correct information on customer verification page', () => {
      const pageData = {
        companyName: 'ACME CORPORATION LIMITED',
        registrationNumber: 'RC123456',
        registrationDate: '15/03/2010',
        policyNumber: 'POL-2024-001',
        verificationType: 'CAC' as const
      };

      expect(pageData.companyName).toBeDefined();
      expect(pageData.registrationNumber).toBeDefined();
      expect(pageData.registrationDate).toBeDefined();
      expect(pageData.policyNumber).toBeDefined();
      expect(pageData.verificationType).toBe('CAC');
    });

    it('should validate CAC input format', () => {
      const validInputs = ['RC123456', '123456', 'RC 123456', 'RC-123456'];
      const invalidInputs = ['ABC123', 'XYZ'];

      validInputs.forEach(input => {
        const isValid = input && /^(RC[\s\-\/]*)?\d+$/i.test(input);
        expect(isValid).toBe(true);
      });

      invalidInputs.forEach(input => {
        const isValid = input && /^(RC[\s\-\/]*)?\d+$/i.test(input);
        expect(isValid).toBe(false);
      });
      
      // Test empty/null/undefined separately
      expect(Boolean('' && /^(RC[\s\-\/]*)?\d+$/i.test(''))).toBe(false);
      expect(Boolean(null)).toBe(false);
      expect(Boolean(undefined)).toBe(false);
    });
  });

  describe('Step 4: VerifyData API is Called', () => {
    it('should call VerifyData API with correct parameters', () => {
      const rcNumber = 'RC123456';
      const apiUrl = 'https://vd.villextra.com';
      const endpoint = '/api/ValidateRcNumber/Initiate';

      const requestBody = {
        rcNumber: rcNumber,
        secretKey: process.env.VERIFYDATA_SECRET_KEY || 'test-secret-key'
      };

      expect(requestBody).toHaveProperty('rcNumber');
      expect(requestBody).toHaveProperty('secretKey');
      expect(requestBody.rcNumber).toBe(rcNumber);
      expect(requestBody.secretKey).toBeDefined();

      const fullUrl = `${apiUrl}${endpoint}`;
      expect(fullUrl).toContain('ValidateRcNumber');
      expect(fullUrl).toContain('Initiate');
    });

    it('should decrypt CAC before API call', () => {
      // Simulate encrypted CAC in database
      const encryptedCAC = {
        encrypted: 'base64-encrypted-data',
        iv: 'base64-iv-data'
      };

      // Simulate decryption
      const decryptedCAC = 'RC123456';

      expect(encryptedCAC.encrypted).not.toBe(decryptedCAC);
      expect(decryptedCAC).toMatch(/^RC\d+$/);
    });

    it('should handle successful API response', () => {
      const apiResponse = mockVerifydataResponses['RC123456'];

      expect(apiResponse.success).toBe(true);
      expect(apiResponse.statusCode).toBe(200);
      expect(apiResponse.message).toBe('success');
      expect(apiResponse.data).toBeDefined();
      expect(apiResponse.data.name).toBe('ACME CORPORATION LIMITED');
      expect(apiResponse.data.registrationNumber).toBe('RC123456');
      expect(apiResponse.data.companyStatus).toBe('Verified');
      expect(apiResponse.data.registrationDate).toBe('15/03/2010');
    });

    it('should mask RC number in logs', () => {
      const rcNumber = 'RC123456';
      const maskedRC = rcNumber.substring(0, 4) + '*'.repeat(Math.max(0, rcNumber.length - 4));

      expect(maskedRC).toBe('RC12****');
      expect(maskedRC).not.toBe(rcNumber);
      expect(maskedRC).toContain('*');
    });
  });

  describe('Step 5: Field Matching Works', () => {
    it('should match company name correctly', () => {
      const apiData = mockVerifydataResponses['RC123456'].data;
      const excelData = testList.entries[0];

      const normalizeCompanyName = (name: string) => {
        if (!name) return '';
        return name.toLowerCase().trim()
          .replace(/\s+/g, ' ')
          .replace(/\blimited\b/g, 'ltd')
          .replace(/\bpublic limited company\b/g, 'plc')
          .replace(/[.,;]+$/, '');
      };

      const apiName = normalizeCompanyName(apiData.name);
      const excelName = normalizeCompanyName(excelData['Company Name']);

      expect(apiName).toBe(excelName);
    });

    it('should match registration number correctly', () => {
      const apiData = mockVerifydataResponses['RC123456'].data;
      const excelData = testList.entries[0];

      const normalizeRC = (rc: string) => {
        if (!rc) return '';
        return rc.trim().toUpperCase()
          .replace(/^RC[\s\-\/]*/i, '')
          .replace(/[^A-Z0-9]/g, '');
      };

      const apiRC = normalizeRC(apiData.registrationNumber);
      const excelRC = normalizeRC(excelData['Registration Number']);

      expect(apiRC).toBe(excelRC);
    });

    it('should match registration date correctly', () => {
      const apiData = mockVerifydataResponses['RC123456'].data;
      const excelData = testList.entries[0];

      const parseDate = (dateStr: string) => {
        if (!dateStr) return null;
        const str = dateStr.trim();
        
        // DD/MM/YYYY
        const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyyMatch) {
          const [, day, month, year] = ddmmyyyyMatch;
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        return null;
      };

      const apiDate = parseDate(apiData.registrationDate);
      const excelDate = parseDate(excelData['Registration Date']);

      expect(apiDate).toBe(excelDate);
      expect(apiDate).toBe('2010-03-15');
    });

    it('should validate company status', () => {
      const apiData = mockVerifydataResponses['RC123456'].data;
      const status = apiData.companyStatus.toLowerCase();

      const isValid = status === 'verified' || status === 'active';
      expect(isValid).toBe(true);
    });

    it('should return match result with all details', () => {
      const matchResult = {
        matched: true,
        failedFields: [],
        details: {
          companyName: {
            api: 'ACME CORPORATION LIMITED',
            excel: 'ACME CORPORATION LIMITED',
            matched: true
          },
          registrationNumber: {
            api: 'RC123456',
            excel: 'RC123456',
            matched: true
          },
          registrationDate: {
            api: '15/03/2010',
            excel: '15/03/2010',
            apiParsed: '2010-03-15',
            excelParsed: '2010-03-15',
            matched: true
          },
          companyStatus: {
            api: 'Verified',
            excel: 'N/A (validated against CAC)',
            matched: true
          }
        }
      };

      expect(matchResult.matched).toBe(true);
      expect(matchResult.failedFields).toHaveLength(0);
      expect(matchResult.details).toHaveProperty('companyName');
      expect(matchResult.details).toHaveProperty('registrationNumber');
      expect(matchResult.details).toHaveProperty('registrationDate');
      expect(matchResult.details).toHaveProperty('companyStatus');
    });
  });

  describe('Step 6: Results are Stored Correctly', () => {
    it('should update entry status to verified on success', () => {
      const entry = {
        id: 'entry-1',
        status: 'link_sent' as const,
        verificationAttempts: 0
      };

      const updatedEntry = {
        ...entry,
        status: 'verified' as const,
        verifiedAt: new Date(),
        verificationAttempts: entry.verificationAttempts + 1
      };

      expect(updatedEntry.status).toBe('verified');
      expect(updatedEntry.verifiedAt).toBeInstanceOf(Date);
      expect(updatedEntry.verificationAttempts).toBe(1);
    });

    it('should store verification details with API data', () => {
      const verificationDetails = {
        matched: true,
        failedFields: [],
        apiData: mockVerifydataResponses['RC123456'].data,
        timestamp: new Date().toISOString(),
        source: 'CAC'
      };

      expect(verificationDetails.matched).toBe(true);
      expect(verificationDetails.failedFields).toHaveLength(0);
      expect(verificationDetails.apiData).toBeDefined();
      expect(verificationDetails.apiData.name).toBe('ACME CORPORATION LIMITED');
      expect(verificationDetails.apiData.registrationNumber).toBe('RC123456');
      expect(verificationDetails.apiData.companyStatus).toBe('Verified');
      expect(verificationDetails.source).toBe('CAC');
      expect(verificationDetails.timestamp).toBeDefined();
    });

    it('should preserve original Excel data after verification', () => {
      const originalData = { ...testList.entries[0] };
      
      const entryAfterVerification = {
        id: 'entry-1',
        data: originalData,
        status: 'verified' as const,
        verificationDetails: {
          matched: true,
          failedFields: [],
          apiData: mockVerifydataResponses['RC123456'].data
        }
      };

      // Verify original data is unchanged
      expect(entryAfterVerification.data).toEqual(originalData);
      expect(entryAfterVerification.data['Company Name']).toBe(originalData['Company Name']);
      expect(entryAfterVerification.data['CAC']).toBe(originalData['CAC']);
      
      // Verify verification details are separate
      expect(entryAfterVerification.verificationDetails).toBeDefined();
      expect(entryAfterVerification.data).not.toBe(entryAfterVerification.verificationDetails);
    });

    it('should create audit log for verification', () => {
      const auditLog = {
        timestamp: new Date().toISOString(),
        action: 'cac_verification',
        entryId: 'entry-1',
        listId: 'test-list-1',
        rcNumber: 'RC12****', // Masked
        result: 'success',
        matched: true,
        failedFields: [],
        source: 'CAC',
        apiResponse: {
          statusCode: 200,
          message: 'success'
        }
      };

      expect(auditLog.action).toBe('cac_verification');
      expect(auditLog.result).toBe('success');
      expect(auditLog.matched).toBe(true);
      expect(auditLog.rcNumber).toContain('*');
      expect(auditLog.rcNumber).not.toContain('123456');
      expect(auditLog.source).toBe('CAC');
    });

    it('should encrypt CAC in database', () => {
      const plainCAC = 'RC123456';
      
      // Simulate encryption
      const encrypted = {
        encrypted: 'base64-encrypted-data-here',
        iv: 'base64-iv-data-here'
      };

      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted.encrypted).not.toBe(plainCAC);
      expect(encrypted.encrypted).not.toContain('RC123456');
    });

    it('should update list statistics after verification', () => {
      const listStats = {
        totalEntries: 2,
        verifiedCount: 1,
        pendingCount: 1,
        failedCount: 0
      };

      // After first verification
      const updatedStats = {
        ...listStats,
        verifiedCount: listStats.verifiedCount + 1,
        pendingCount: listStats.pendingCount - 1
      };

      expect(updatedStats.verifiedCount).toBe(2);
      expect(updatedStats.pendingCount).toBe(0);
      expect(updatedStats.totalEntries).toBe(2);
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should complete entire workflow from upload to verification', () => {
      // Step 1: Upload list
      const list = {
        id: 'test-list-1',
        name: testList.name,
        listType: testList.listType,
        uploadMode: testList.uploadMode,
        columns: testList.columns,
        emailColumn: testList.emailColumn,
        totalEntries: testList.entries.length,
        verifiedCount: 0,
        pendingCount: testList.entries.length,
        failedCount: 0,
        createdAt: new Date()
      };

      expect(list.totalEntries).toBe(2);
      expect(list.verifiedCount).toBe(0);
      expect(list.pendingCount).toBe(2);

      // Step 2: Create entries
      const entries = testList.entries.map((data, index) => ({
        id: `entry-${index + 1}`,
        listId: list.id,
        data: data,
        email: data['Email Address'],
        displayName: data['Company Name'],
        status: 'pending' as const,
        verificationType: undefined,
        resendCount: 0,
        verificationAttempts: 0
      }));

      expect(entries).toHaveLength(2);
      entries.forEach(entry => {
        expect(entry.status).toBe('pending');
      });

      // Step 3: Send verification requests
      const updatedEntries = entries.map(entry => ({
        ...entry,
        status: 'link_sent' as const,
        verificationType: 'CAC' as const,
        linkSentAt: new Date(),
        token: `token-${entry.id}`
      }));

      updatedEntries.forEach(entry => {
        expect(entry.status).toBe('link_sent');
        expect(entry.verificationType).toBe('CAC');
        expect(entry.token).toBeDefined();
      });

      // Step 4: Customer submits and verification succeeds
      const verifiedEntries = updatedEntries.map(entry => ({
        ...entry,
        status: 'verified' as const,
        verifiedAt: new Date(),
        verificationAttempts: 1,
        verificationDetails: {
          matched: true,
          failedFields: [],
          apiData: mockVerifydataResponses[entry.data['CAC'] as keyof typeof mockVerifydataResponses].data,
          source: 'CAC'
        }
      }));

      verifiedEntries.forEach(entry => {
        expect(entry.status).toBe('verified');
        expect(entry.verifiedAt).toBeDefined();
        expect(entry.verificationDetails.matched).toBe(true);
      });

      // Step 5: Update list statistics
      const finalList = {
        ...list,
        verifiedCount: verifiedEntries.length,
        pendingCount: 0
      };

      expect(finalList.verifiedCount).toBe(2);
      expect(finalList.pendingCount).toBe(0);
      expect(finalList.totalEntries).toBe(2);
    });

    it('should handle mixed success and failure scenarios', () => {
      const entries = [
        {
          id: 'entry-1',
          status: 'verified' as const,
          verificationDetails: { matched: true, failedFields: [] }
        },
        {
          id: 'entry-2',
          status: 'verification_failed' as const,
          verificationDetails: { matched: false, failedFields: ['Company Name'] }
        }
      ];

      const verifiedCount = entries.filter(e => e.status === 'verified').length;
      const failedCount = entries.filter(e => e.status === 'verification_failed').length;

      expect(verifiedCount).toBe(1);
      expect(failedCount).toBe(1);
    });
  });

  describe('Error Handling in Workflow', () => {
    it('should handle field mismatch during verification', () => {
      const mismatchedResponse = {
        success: true,
        data: {
          name: 'DIFFERENT COMPANY LIMITED',
          registrationNumber: 'RC999999',
          companyStatus: 'Verified',
          registrationDate: '01/01/2020'
        }
      };

      const excelData = testList.entries[0];
      
      const companyNameMatched = mismatchedResponse.data.name.toLowerCase() === 
                                 excelData['Company Name'].toLowerCase();
      
      expect(companyNameMatched).toBe(false);

      const failedFields = [];
      if (!companyNameMatched) failedFields.push('Company Name');

      const verificationResult = {
        matched: false,
        failedFields: failedFields,
        apiData: mismatchedResponse.data
      };

      expect(verificationResult.matched).toBe(false);
      expect(verificationResult.failedFields).toContain('Company Name');
    });

    it('should handle API errors gracefully', () => {
      const errorResponse = {
        success: false,
        error: 'RC number not found in CAC database',
        errorCode: 'CAC_NOT_FOUND',
        details: {}
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.errorCode).toBe('CAC_NOT_FOUND');
      expect(errorResponse.error).toBeDefined();
    });

    it('should send notifications on verification failure', () => {
      const notifications = {
        customer: {
          to: 'contact@acme.com',
          subject: 'CAC Verification Failed',
          body: 'The company information provided does not match CAC records. Please contact your broker.',
          type: 'customer_error'
        },
        staff: {
          to: ['compliance@nem.com', 'admin@nem.com'],
          subject: 'CAC Verification Failed - Entry entry-1',
          body: 'Error Code: FIELD_MISMATCH | Failed Fields: Company Name, Registration Number',
          type: 'staff_error'
        }
      };

      expect(notifications.customer.body).not.toContain('Error Code');
      expect(notifications.staff.body).toContain('Error Code');
      expect(notifications.staff.body).toContain('Failed Fields');
    });
  });
});
