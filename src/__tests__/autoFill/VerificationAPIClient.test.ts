/**
 * Unit Tests: VerificationAPIClient
 * 
 * Tests for the VerificationAPIClient service that wraps NIN and CAC verification APIs.
 * 
 * Validates: Requirements 1.1, 2.1, 7.5, 7.6, 7.7, 9.1, 9.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VerificationAPIClient } from '../../services/autoFill/VerificationAPIClient';

describe('VerificationAPIClient', () => {
  let client: VerificationAPIClient;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    client = new VerificationAPIClient();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('verifyNIN', () => {
    it('should successfully verify a valid NIN', async () => {
      // Mock successful API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            firstName: 'John',
            middleName: 'Doe',
            lastName: 'Smith',
            gender: 'male',
            dateOfBirth: '1990-01-15',
            phoneNumber: '08012345678',
            birthstate: 'Lagos',
            birthlga: 'Ikeja',
            trackingId: 'TRK123'
          }
        })
      } as Response);

      const response = await client.verifyNIN('12345678901');

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.firstName).toBe('John');
      expect(response.data?.lastName).toBe('Smith');
      expect(response.data?.gender).toBe('male');
      expect(response.data?.dateOfBirth).toBe('1990-01-15');
    });

    it('should handle invalid NIN format', async () => {
      const response = await client.verifyNIN('123'); // Too short

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('INVALID_FORMAT');
      expect(response.error?.message).toContain('11 digits');
    });

    it('should handle empty NIN', async () => {
      const response = await client.verifyNIN('');

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('INVALID_INPUT');
    });

    it('should handle non-numeric NIN', async () => {
      const response = await client.verifyNIN('1234567890A');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('INVALID_FORMAT');
    });

    it('should handle 400 Bad Request error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          errorCode: 'BAD_REQUEST',
          error: 'Invalid NIN format'
        })
      } as Response);

      const response = await client.verifyNIN('12345678901');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('BAD_REQUEST');
      expect(response.error?.message).toBe('Invalid NIN format');
    });

    it('should handle 401 Unauthorized error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          errorCode: 'UNAUTHORIZED',
          error: 'Invalid API credentials'
        })
      } as Response);

      const response = await client.verifyNIN('12345678901');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('UNAUTHORIZED');
    });

    it('should handle 404 Not Found error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          errorCode: 'NOT_FOUND',
          error: 'NIN not found in database'
        })
      } as Response);

      const response = await client.verifyNIN('12345678901');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NOT_FOUND');
    });

    it('should handle 429 Too Many Requests error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          errorCode: 'RATE_LIMIT',
          error: 'Too many requests'
        })
      } as Response);

      const response = await client.verifyNIN('12345678901');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('RATE_LIMIT');
    });

    it('should handle 500 Internal Server Error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          errorCode: 'SERVER_ERROR',
          error: 'Internal server error'
        })
      } as Response);

      const response = await client.verifyNIN('12345678901');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('SERVER_ERROR');
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const response = await client.verifyNIN('12345678901');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NETWORK_ERROR');
      expect(response.error?.message).toContain('Network error');
    });

    it('should handle timeout scenarios', async () => {
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, data: {} })
            });
          }, 6000); // Exceeds 5 second timeout
        })
      );

      const response = await client.verifyNIN('12345678901');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('TIMEOUT');
    }, 10000); // 10 second test timeout

    it('should handle missing optional fields in response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            firstName: 'John',
            lastName: 'Smith',
            gender: 'male',
            dateOfBirth: '1990-01-15'
            // Missing optional fields: middleName, phoneNumber, birthstate, birthlga, trackingId
          }
        })
      } as Response);

      const response = await client.verifyNIN('12345678901');

      expect(response.success).toBe(true);
      expect(response.data?.firstName).toBe('John');
      expect(response.data?.middleName).toBeUndefined();
      expect(response.data?.phoneNumber).toBeUndefined();
    });
  });

  describe('verifyCAC', () => {
    it('should successfully verify a valid CAC number', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            name: 'Test Company Limited',
            registrationNumber: 'RC123456',
            companyStatus: 'Active',
            registrationDate: '2020-05-15',
            typeOfEntity: 'Private Limited Company'
          }
        })
      } as Response);

      const response = await client.verifyCAC('RC123456');

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data?.name).toBe('Test Company Limited');
      expect(response.data?.registrationNumber).toBe('RC123456');
      expect(response.data?.companyStatus).toBe('Active');
    });

    it('should handle empty RC number', async () => {
      const response = await client.verifyCAC('');

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe('INVALID_INPUT');
    });

    it('should handle API errors for CAC verification', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          errorCode: 'NOT_FOUND',
          error: 'Company not found'
        })
      } as Response);

      const response = await client.verifyCAC('RC999999');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NOT_FOUND');
    });

    it('should handle network errors for CAC verification', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const response = await client.verifyCAC('RC123456');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('NETWORK_ERROR');
    });

    it('should handle timeout for CAC verification', async () => {
      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, data: {} })
            });
          }, 6000);
        })
      );

      const response = await client.verifyCAC('RC123456');

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('TIMEOUT');
    }, 10000); // 10 second test timeout

    it('should handle missing optional fields in CAC response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            name: 'Test Company',
            registrationNumber: 'RC123456',
            companyStatus: 'Active',
            registrationDate: '2020-05-15'
            // Missing optional field: typeOfEntity
          }
        })
      } as Response);

      const response = await client.verifyCAC('RC123456');

      expect(response.success).toBe(true);
      expect(response.data?.name).toBe('Test Company');
      expect(response.data?.typeOfEntity).toBeUndefined();
    });
  });

  describe('request cancellation and tracking', () => {
    it('should track pending request status', async () => {
      expect(client.isRequestPending()).toBe(false);

      global.fetch = vi.fn().mockImplementation(() => 
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, data: { firstName: 'Test', lastName: 'User', gender: 'male', dateOfBirth: '1990-01-01' } })
            });
          }, 1000);
        })
      );

      const promise = client.verifyNIN('12345678901');
      expect(client.isRequestPending()).toBe(true);

      await promise;
      expect(client.isRequestPending()).toBe(false);
    });

    it('should allow calling cancelPendingRequest when no request is pending', () => {
      expect(client.isRequestPending()).toBe(false);
      
      // Should not throw error
      expect(() => client.cancelPendingRequest()).not.toThrow();
      
      expect(client.isRequestPending()).toBe(false);
    });
  });
});
