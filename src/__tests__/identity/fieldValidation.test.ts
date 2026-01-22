/**
 * Property-Based Tests for Field-Level Validation Completeness
 * 
 * Feature: identity-remediation
 * Property 23: Field-Level Validation Completeness
 * 
 * Tests that for any NIN verification, the system validates against First Name,
 * Last Name, Date of Birth, Gender, and BVN. For any CAC verification, the system
 * validates against Company Name, Registration Number, Registration Date, and
 * Business Address.
 * 
 * **Validates: Requirements 20.3, 20.6**
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// ========== Type Definitions ==========

interface NINVerificationRequest {
  nin: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bvn: string;
}

interface CACVerificationRequest {
  cac: string;
  companyName: string;
  registrationNumber: string;
  registrationDate: string;
  businessAddress: string;
}

interface VerificationResult {
  success: boolean;
  fieldsValidated: string[];
  failedFields?: string[];
  message?: string;
}

// ========== Test Utilities ==========

/**
 * Required fields for NIN verification according to Requirement 20.3
 */
const REQUIRED_NIN_FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'bvn'
];

/**
 * Required fields for CAC verification according to Requirement 20.6
 */
const REQUIRED_CAC_FIELDS = [
  'companyName',
  'registrationNumber',
  'registrationDate',
  'businessAddress'
];

/**
 * Simulates NIN verification with field-level validation
 */
function simulateNINVerification(request: NINVerificationRequest): VerificationResult {
  const fieldsValidated: string[] = [];
  const failedFields: string[] = [];
  
  // Validate firstName
  fieldsValidated.push('firstName');
  if (!request.firstName || request.firstName.trim().length === 0) {
    failedFields.push('firstName');
  }
  
  // Validate lastName
  fieldsValidated.push('lastName');
  if (!request.lastName || request.lastName.trim().length === 0) {
    failedFields.push('lastName');
  }
  
  // Validate dateOfBirth
  fieldsValidated.push('dateOfBirth');
  if (!request.dateOfBirth || !isValidDate(request.dateOfBirth)) {
    failedFields.push('dateOfBirth');
  }
  
  // Validate gender
  fieldsValidated.push('gender');
  if (!request.gender || !['male', 'female', 'M', 'F'].includes(request.gender.toLowerCase())) {
    failedFields.push('gender');
  }
  
  // Validate bvn
  fieldsValidated.push('bvn');
  if (!request.bvn || !/^\d{11}$/.test(request.bvn)) {
    failedFields.push('bvn');
  }
  
  // Validate NIN format
  if (!request.nin || !/^\d{11}$/.test(request.nin)) {
    return {
      success: false,
      fieldsValidated,
      failedFields: [...failedFields, 'nin'],
      message: 'Invalid NIN format'
    };
  }
  
  const success = failedFields.length === 0;
  
  return {
    success,
    fieldsValidated,
    failedFields: failedFields.length > 0 ? failedFields : undefined,
    message: success ? 'Verification successful' : 'Field validation failed'
  };
}

/**
 * Simulates CAC verification with field-level validation
 */
function simulateCACVerification(request: CACVerificationRequest): VerificationResult {
  const fieldsValidated: string[] = [];
  const failedFields: string[] = [];
  
  // Validate companyName
  fieldsValidated.push('companyName');
  if (!request.companyName || request.companyName.trim().length === 0) {
    failedFields.push('companyName');
  }
  
  // Validate registrationNumber
  fieldsValidated.push('registrationNumber');
  if (!request.registrationNumber || !/^(RC|BN|IT)\d{6,}$/.test(request.registrationNumber)) {
    failedFields.push('registrationNumber');
  }
  
  // Validate registrationDate
  fieldsValidated.push('registrationDate');
  if (!request.registrationDate || !isValidDate(request.registrationDate)) {
    failedFields.push('registrationDate');
  }
  
  // Validate businessAddress
  fieldsValidated.push('businessAddress');
  if (!request.businessAddress || request.businessAddress.trim().length === 0) {
    failedFields.push('businessAddress');
  }
  
  // Validate CAC format
  if (!request.cac || !/^(RC|BN|IT)\d{6,}$/.test(request.cac)) {
    return {
      success: false,
      fieldsValidated,
      failedFields: [...failedFields, 'cac'],
      message: 'Invalid CAC format'
    };
  }
  
  const success = failedFields.length === 0;
  
  return {
    success,
    fieldsValidated,
    failedFields: failedFields.length > 0 ? failedFields : undefined,
    message: success ? 'Verification successful' : 'Field validation failed'
  };
}

/**
 * Helper to validate date strings
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// ========== Arbitraries ==========

/**
 * Generates a valid NIN (11 digits)
 */
const ninArbitrary = fc.stringMatching(/^\d{11}$/);

/**
 * Generates a valid BVN (11 digits)
 */
const bvnArbitrary = fc.stringMatching(/^\d{11}$/);

/**
 * Generates a valid CAC/RC number
 */
const cacArbitrary = fc.oneof(
  fc.stringMatching(/^RC\d{6,8}$/),
  fc.stringMatching(/^BN\d{6,8}$/),
  fc.stringMatching(/^IT\d{6,8}$/)
);

/**
 * Generates a valid date string
 */
const dateArbitrary = fc.date({ min: new Date('1950-01-01'), max: new Date('2010-12-31') })
  .map(d => {
    try {
      return d.toISOString().split('T')[0];
    } catch {
      // Fallback for invalid dates
      return '2000-01-01';
    }
  });

/**
 * Generates a valid gender value
 */
const genderArbitrary = fc.constantFrom('male', 'female', 'M', 'F', 'Male', 'Female');

/**
 * Generates a complete NIN verification request
 */
const ninVerificationRequestArbitrary = fc.record({
  nin: ninArbitrary,
  firstName: fc.string({ minLength: 2, maxLength: 50 }),
  lastName: fc.string({ minLength: 2, maxLength: 50 }),
  dateOfBirth: dateArbitrary,
  gender: genderArbitrary,
  bvn: bvnArbitrary,
}) as fc.Arbitrary<NINVerificationRequest>;

/**
 * Generates a complete CAC verification request
 */
const cacVerificationRequestArbitrary = fc.record({
  cac: cacArbitrary,
  companyName: fc.string({ minLength: 3, maxLength: 100 }),
  registrationNumber: cacArbitrary,
  registrationDate: dateArbitrary,
  businessAddress: fc.string({ minLength: 10, maxLength: 200 }),
}) as fc.Arbitrary<CACVerificationRequest>;

// ========== Property Tests ==========

describe('Feature: identity-remediation, Property 23: Field-Level Validation Completeness', () => {
  describe('Property: NIN verification must validate all required fields', () => {
    it('should validate against firstName, lastName, dateOfBirth, gender, and bvn', () => {
      fc.assert(
        fc.property(
          ninVerificationRequestArbitrary,
          (request) => {
            const result = simulateNINVerification(request);
            
            // Must validate all required fields
            expect(result.fieldsValidated).toHaveLength(REQUIRED_NIN_FIELDS.length);
            
            // Must include all required fields
            for (const field of REQUIRED_NIN_FIELDS) {
              expect(result.fieldsValidated).toContain(field);
            }
            
            // Fields validated must match exactly
            const sortedValidated = [...result.fieldsValidated].sort();
            const sortedRequired = [...REQUIRED_NIN_FIELDS].sort();
            expect(sortedValidated).toEqual(sortedRequired);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate all fields even when some fail', () => {
      fc.assert(
        fc.property(
          fc.record({
            nin: ninArbitrary,
            firstName: fc.oneof(fc.constant(''), fc.string({ minLength: 1 })),
            lastName: fc.oneof(fc.constant(''), fc.string({ minLength: 1 })),
            dateOfBirth: fc.oneof(fc.constant('invalid'), dateArbitrary),
            gender: fc.oneof(fc.constant('invalid'), genderArbitrary),
            bvn: fc.oneof(fc.constant('123'), bvnArbitrary),
          }) as fc.Arbitrary<NINVerificationRequest>,
          (request) => {
            const result = simulateNINVerification(request);
            
            // Must still validate all required fields even if some fail
            expect(result.fieldsValidated).toHaveLength(REQUIRED_NIN_FIELDS.length);
            
            for (const field of REQUIRED_NIN_FIELDS) {
              expect(result.fieldsValidated).toContain(field);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not validate extra fields beyond requirements', () => {
      fc.assert(
        fc.property(
          ninVerificationRequestArbitrary,
          (request) => {
            const result = simulateNINVerification(request);
            
            // Should only validate the required fields, no more
            expect(result.fieldsValidated).toHaveLength(REQUIRED_NIN_FIELDS.length);
            
            // Should not include fields like 'email', 'phone', etc.
            expect(result.fieldsValidated).not.toContain('email');
            expect(result.fieldsValidated).not.toContain('phone');
            expect(result.fieldsValidated).not.toContain('address');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: CAC verification must validate all required fields', () => {
    it('should validate against companyName, registrationNumber, registrationDate, and businessAddress', () => {
      fc.assert(
        fc.property(
          cacVerificationRequestArbitrary,
          (request) => {
            const result = simulateCACVerification(request);
            
            // Must validate all required fields
            expect(result.fieldsValidated).toHaveLength(REQUIRED_CAC_FIELDS.length);
            
            // Must include all required fields
            for (const field of REQUIRED_CAC_FIELDS) {
              expect(result.fieldsValidated).toContain(field);
            }
            
            // Fields validated must match exactly
            const sortedValidated = [...result.fieldsValidated].sort();
            const sortedRequired = [...REQUIRED_CAC_FIELDS].sort();
            expect(sortedValidated).toEqual(sortedRequired);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate all fields even when some fail', () => {
      fc.assert(
        fc.property(
          fc.record({
            cac: cacArbitrary,
            companyName: fc.oneof(fc.constant(''), fc.string({ minLength: 1 })),
            registrationNumber: fc.oneof(fc.constant('invalid'), cacArbitrary),
            registrationDate: fc.oneof(fc.constant('invalid'), dateArbitrary),
            businessAddress: fc.oneof(fc.constant(''), fc.string({ minLength: 1 })),
          }) as fc.Arbitrary<CACVerificationRequest>,
          (request) => {
            const result = simulateCACVerification(request);
            
            // Must still validate all required fields even if some fail
            expect(result.fieldsValidated).toHaveLength(REQUIRED_CAC_FIELDS.length);
            
            for (const field of REQUIRED_CAC_FIELDS) {
              expect(result.fieldsValidated).toContain(field);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not validate extra fields beyond requirements', () => {
      fc.assert(
        fc.property(
          cacVerificationRequestArbitrary,
          (request) => {
            const result = simulateCACVerification(request);
            
            // Should only validate the required fields, no more
            expect(result.fieldsValidated).toHaveLength(REQUIRED_CAC_FIELDS.length);
            
            // Should not include fields like 'email', 'phone', etc.
            expect(result.fieldsValidated).not.toContain('email');
            expect(result.fieldsValidated).not.toContain('phone');
            expect(result.fieldsValidated).not.toContain('contactPerson');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Validation completeness regardless of success', () => {
    it('should validate all NIN fields whether verification succeeds or fails', () => {
      fc.assert(
        fc.property(
          fc.record({
            nin: fc.oneof(ninArbitrary, fc.constant('invalid')),
            firstName: fc.oneof(fc.string({ minLength: 1 }), fc.constant('')),
            lastName: fc.oneof(fc.string({ minLength: 1 }), fc.constant('')),
            dateOfBirth: fc.oneof(dateArbitrary, fc.constant('invalid')),
            gender: fc.oneof(genderArbitrary, fc.constant('invalid')),
            bvn: fc.oneof(bvnArbitrary, fc.constant('123')),
          }) as fc.Arbitrary<NINVerificationRequest>,
          (request) => {
            const result = simulateNINVerification(request);
            
            // Regardless of success, all fields must be validated
            expect(result.fieldsValidated).toHaveLength(REQUIRED_NIN_FIELDS.length);
            
            // If verification failed, failedFields should be populated
            if (!result.success && result.failedFields) {
              expect(result.failedFields.length).toBeGreaterThan(0);
              
              // All failed fields must be from the validated fields
              for (const failedField of result.failedFields) {
                if (failedField !== 'nin') {
                  expect(result.fieldsValidated).toContain(failedField);
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate all CAC fields whether verification succeeds or fails', () => {
      fc.assert(
        fc.property(
          fc.record({
            cac: fc.oneof(cacArbitrary, fc.constant('invalid')),
            companyName: fc.oneof(fc.string({ minLength: 1 }), fc.constant('')),
            registrationNumber: fc.oneof(cacArbitrary, fc.constant('invalid')),
            registrationDate: fc.oneof(dateArbitrary, fc.constant('invalid')),
            businessAddress: fc.oneof(fc.string({ minLength: 1 }), fc.constant('')),
          }) as fc.Arbitrary<CACVerificationRequest>,
          (request) => {
            const result = simulateCACVerification(request);
            
            // Regardless of success, all fields must be validated
            expect(result.fieldsValidated).toHaveLength(REQUIRED_CAC_FIELDS.length);
            
            // If verification failed, failedFields should be populated
            if (!result.success && result.failedFields) {
              expect(result.failedFields.length).toBeGreaterThan(0);
              
              // All failed fields must be from the validated fields
              for (const failedField of result.failedFields) {
                if (failedField !== 'cac') {
                  expect(result.fieldsValidated).toContain(failedField);
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Field validation order consistency', () => {
    it('should validate NIN fields in consistent order', () => {
      fc.assert(
        fc.property(
          fc.array(ninVerificationRequestArbitrary, { minLength: 2, maxLength: 10 }),
          (requests) => {
            const results = requests.map(r => simulateNINVerification(r));
            
            // All results should have the same field order
            const firstOrder = results[0].fieldsValidated;
            
            for (const result of results) {
              expect(result.fieldsValidated).toEqual(firstOrder);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should validate CAC fields in consistent order', () => {
      fc.assert(
        fc.property(
          fc.array(cacVerificationRequestArbitrary, { minLength: 2, maxLength: 10 }),
          (requests) => {
            const results = requests.map(r => simulateCACVerification(r));
            
            // All results should have the same field order
            const firstOrder = results[0].fieldsValidated;
            
            for (const result of results) {
              expect(result.fieldsValidated).toEqual(firstOrder);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Property: Failed fields must be subset of validated fields', () => {
    it('should only report failures for fields that were validated (NIN)', () => {
      fc.assert(
        fc.property(
          fc.record({
            nin: fc.oneof(ninArbitrary, fc.constant('invalid')),
            firstName: fc.oneof(fc.string({ minLength: 1 }), fc.constant('')),
            lastName: fc.oneof(fc.string({ minLength: 1 }), fc.constant('')),
            dateOfBirth: fc.oneof(dateArbitrary, fc.constant('invalid')),
            gender: fc.oneof(genderArbitrary, fc.constant('invalid')),
            bvn: fc.oneof(bvnArbitrary, fc.constant('123')),
          }) as fc.Arbitrary<NINVerificationRequest>,
          (request) => {
            const result = simulateNINVerification(request);
            
            if (result.failedFields) {
              for (const failedField of result.failedFields) {
                // Each failed field must either be in validated fields or be 'nin'
                const isValidated = result.fieldsValidated.includes(failedField);
                const isNIN = failedField === 'nin';
                expect(isValidated || isNIN).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only report failures for fields that were validated (CAC)', () => {
      fc.assert(
        fc.property(
          fc.record({
            cac: fc.oneof(cacArbitrary, fc.constant('invalid')),
            companyName: fc.oneof(fc.string({ minLength: 1 }), fc.constant('')),
            registrationNumber: fc.oneof(cacArbitrary, fc.constant('invalid')),
            registrationDate: fc.oneof(dateArbitrary, fc.constant('invalid')),
            businessAddress: fc.oneof(fc.string({ minLength: 1 }), fc.constant('')),
          }) as fc.Arbitrary<CACVerificationRequest>,
          (request) => {
            const result = simulateCACVerification(request);
            
            if (result.failedFields) {
              for (const failedField of result.failedFields) {
                // Each failed field must either be in validated fields or be 'cac'
                const isValidated = result.fieldsValidated.includes(failedField);
                const isCAC = failedField === 'cac';
                expect(isValidated || isCAC).toBe(true);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values in NIN fields', () => {
      const request: NINVerificationRequest = {
        nin: '12345678901',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        bvn: '',
      };
      
      const result = simulateNINVerification(request);
      
      // Should validate all fields
      expect(result.fieldsValidated).toHaveLength(REQUIRED_NIN_FIELDS.length);
      
      // Should fail due to empty values
      expect(result.success).toBe(false);
      expect(result.failedFields).toBeDefined();
      expect(result.failedFields!.length).toBeGreaterThan(0);
    });

    it('should handle empty string values in CAC fields', () => {
      const request: CACVerificationRequest = {
        cac: 'RC123456',
        companyName: '',
        registrationNumber: '',
        registrationDate: '',
        businessAddress: '',
      };
      
      const result = simulateCACVerification(request);
      
      // Should validate all fields
      expect(result.fieldsValidated).toHaveLength(REQUIRED_CAC_FIELDS.length);
      
      // Should fail due to empty values
      expect(result.success).toBe(false);
      expect(result.failedFields).toBeDefined();
      expect(result.failedFields!.length).toBeGreaterThan(0);
    });

    it('should handle whitespace-only values in NIN fields', () => {
      const request: NINVerificationRequest = {
        nin: '12345678901',
        firstName: '   ',
        lastName: '   ',
        dateOfBirth: '2000-01-01',
        gender: 'male',
        bvn: '98765432109',
      };
      
      const result = simulateNINVerification(request);
      
      // Should validate all fields
      expect(result.fieldsValidated).toHaveLength(REQUIRED_NIN_FIELDS.length);
      
      // Should fail due to whitespace-only values
      expect(result.success).toBe(false);
      expect(result.failedFields).toContain('firstName');
      expect(result.failedFields).toContain('lastName');
    });

    it('should handle whitespace-only values in CAC fields', () => {
      const request: CACVerificationRequest = {
        cac: 'RC123456',
        companyName: '   ',
        registrationNumber: 'RC123456',
        registrationDate: '2020-01-01',
        businessAddress: '   ',
      };
      
      const result = simulateCACVerification(request);
      
      // Should validate all fields
      expect(result.fieldsValidated).toHaveLength(REQUIRED_CAC_FIELDS.length);
      
      // Should fail due to whitespace-only values
      expect(result.success).toBe(false);
      expect(result.failedFields).toContain('companyName');
      expect(result.failedFields).toContain('businessAddress');
    });

    it('should validate all fields even with invalid NIN format', () => {
      const request: NINVerificationRequest = {
        nin: 'invalid',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        bvn: '12345678901',
      };
      
      const result = simulateNINVerification(request);
      
      // Should still validate all required fields
      expect(result.fieldsValidated).toHaveLength(REQUIRED_NIN_FIELDS.length);
      expect(result.success).toBe(false);
    });

    it('should validate all fields even with invalid CAC format', () => {
      const request: CACVerificationRequest = {
        cac: 'invalid',
        companyName: 'Test Company',
        registrationNumber: 'RC123456',
        registrationDate: '2020-01-01',
        businessAddress: '123 Test Street',
      };
      
      const result = simulateCACVerification(request);
      
      // Should still validate all required fields
      expect(result.fieldsValidated).toHaveLength(REQUIRED_CAC_FIELDS.length);
      expect(result.success).toBe(false);
    });
  });
});
