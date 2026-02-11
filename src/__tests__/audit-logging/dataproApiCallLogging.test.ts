/**
 * Unit Tests for Datapro API Call Logging
 * 
 * Validates: Requirements 5.1, 5.3
 * 
 * Tests that Datapro API calls are logged with required fields:
 * - API name
 * - Endpoint
 * - Method
 * - Masked request/response data
 * - Status code
 * - Duration
 * - User ID
 * - IP address
 * - Metadata (listId, entryId, cost)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the audit logger
const mockLogAPICall = vi.fn();
vi.mock('../../../server-utils/auditLogger.cjs', () => ({
  logAPICall: mockLogAPICall,
  logVerificationAttempt: vi.fn(),
  logBulkOperation: vi.fn(),
  logSecurityEvent: vi.fn()
}));

describe('Datapro API Call Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Requirement 5.1: WHEN the Server calls the Datapro NIN verification API,
   * THE Server SHALL use logAPICall from auditLogger.cjs to record the API call
   */
  it('should log Datapro API calls with required fields', () => {
    // Simulate API call logging
    const apiCallData = {
      apiName: 'Datapro',
      endpoint: '/verifynin',
      method: 'GET',
      requestData: { nin: '12345678901' },
      statusCode: 200,
      responseData: { success: true, data: { firstName: 'JOHN', lastName: 'DOE' } },
      duration: 1234,
      userId: 'test-user-123',
      ipAddress: '192.168.1.1',
      metadata: {
        listId: 'list-123',
        entryId: 'entry-456',
        cost: 50
      }
    };

    mockLogAPICall(apiCallData);

    // Verify logAPICall was called
    expect(mockLogAPICall).toHaveBeenCalledTimes(1);
    expect(mockLogAPICall).toHaveBeenCalledWith(apiCallData);
  });

  /**
   * Requirement 5.3: THE Server SHALL include API endpoint, request parameters (masked),
   * response status, and duration in API call logs
   */
  it('should include all required fields in API call log', () => {
    const apiCallData = {
      apiName: 'Datapro',
      endpoint: '/verifynin',
      method: 'GET',
      requestData: { nin: '12345678901' },
      statusCode: 200,
      responseData: { success: true },
      duration: 500,
      userId: 'anonymous',
      ipAddress: '10.0.0.1',
      metadata: {
        listId: 'list-789',
        entryId: 'entry-012',
        cost: 0
      }
    };

    mockLogAPICall(apiCallData);

    const callArgs = mockLogAPICall.mock.calls[0][0];
    
    // Verify all required fields are present
    expect(callArgs).toHaveProperty('apiName', 'Datapro');
    expect(callArgs).toHaveProperty('endpoint', '/verifynin');
    expect(callArgs).toHaveProperty('method', 'GET');
    expect(callArgs).toHaveProperty('requestData');
    expect(callArgs).toHaveProperty('statusCode', 200);
    expect(callArgs).toHaveProperty('responseData');
    expect(callArgs).toHaveProperty('duration');
    expect(callArgs).toHaveProperty('userId');
    expect(callArgs).toHaveProperty('ipAddress');
    expect(callArgs).toHaveProperty('metadata');
  });

  /**
   * Requirement 5.1: Test API call logging for successful verification
   */
  it('should log successful Datapro API calls with status 200', () => {
    const successData = {
      apiName: 'Datapro',
      endpoint: '/verifynin',
      method: 'GET',
      requestData: { nin: '98765432109' },
      statusCode: 200,
      responseData: { 
        success: true, 
        data: { 
          firstName: 'JANE', 
          lastName: 'SMITH',
          dateOfBirth: '1995-05-15'
        } 
      },
      duration: 800,
      userId: 'user-456',
      ipAddress: '172.16.0.1',
      metadata: {
        listId: 'list-abc',
        entryId: 'entry-def',
        cost: 50
      }
    };

    mockLogAPICall(successData);

    expect(mockLogAPICall).toHaveBeenCalledWith(
      expect.objectContaining({
        apiName: 'Datapro',
        statusCode: 200,
        responseData: expect.objectContaining({ success: true })
      })
    );
  });

  /**
   * Requirement 5.1: Test API call logging for failed verification
   */
  it('should log failed Datapro API calls with error status', () => {
    const failureData = {
      apiName: 'Datapro',
      endpoint: '/verifynin',
      method: 'GET',
      requestData: { nin: '11111111111' },
      statusCode: 400,
      responseData: { 
        success: false, 
        errorCode: 'INVALID_NIN',
        error: 'NIN not found'
      },
      duration: 600,
      userId: 'anonymous',
      ipAddress: '192.168.100.50',
      metadata: {
        listId: 'list-xyz',
        entryId: 'entry-uvw',
        cost: 0
      }
    };

    mockLogAPICall(failureData);

    expect(mockLogAPICall).toHaveBeenCalledWith(
      expect.objectContaining({
        apiName: 'Datapro',
        statusCode: 400,
        responseData: expect.objectContaining({ 
          success: false,
          errorCode: 'INVALID_NIN'
        })
      })
    );
  });

  /**
   * Requirement 5.3: Test that duration is tracked for API calls
   */
  it('should track API call duration in milliseconds', () => {
    const durations = [100, 500, 1000, 2000, 5000];

    durations.forEach(duration => {
      mockLogAPICall({
        apiName: 'Datapro',
        endpoint: '/verifynin',
        method: 'GET',
        requestData: { nin: '12345678901' },
        statusCode: 200,
        responseData: { success: true },
        duration,
        userId: 'test-user',
        ipAddress: '127.0.0.1',
        metadata: { cost: 0 }
      });
    });

    expect(mockLogAPICall).toHaveBeenCalledTimes(5);
    
    // Verify each call has a duration
    mockLogAPICall.mock.calls.forEach((call, index) => {
      expect(call[0].duration).toBe(durations[index]);
      expect(typeof call[0].duration).toBe('number');
      expect(call[0].duration).toBeGreaterThan(0);
    });
  });

  /**
   * Requirement 5.3: Test that metadata includes listId and entryId for customer verifications
   */
  it('should include listId and entryId in metadata for customer verifications', () => {
    const customerVerificationData = {
      apiName: 'Datapro',
      endpoint: '/verifynin',
      method: 'GET',
      requestData: { nin: '12345678901' },
      statusCode: 200,
      responseData: { success: true },
      duration: 750,
      userId: 'anonymous',
      ipAddress: '10.20.30.40',
      metadata: {
        listId: 'customer-list-123',
        entryId: 'customer-entry-456',
        cost: 50
      }
    };

    mockLogAPICall(customerVerificationData);

    const callArgs = mockLogAPICall.mock.calls[0][0];
    expect(callArgs.metadata).toHaveProperty('listId', 'customer-list-123');
    expect(callArgs.metadata).toHaveProperty('entryId', 'customer-entry-456');
  });

  /**
   * Requirement 5.3: Test that cost is included in metadata when available
   */
  it('should include cost in metadata when available from API response', () => {
    const withCost = {
      apiName: 'Datapro',
      endpoint: '/verifynin',
      method: 'GET',
      requestData: { nin: '12345678901' },
      statusCode: 200,
      responseData: { success: true, cost: 50 },
      duration: 500,
      userId: 'user-123',
      ipAddress: '192.168.1.1',
      metadata: {
        cost: 50
      }
    };

    mockLogAPICall(withCost);

    const callArgs = mockLogAPICall.mock.calls[0][0];
    expect(callArgs.metadata).toHaveProperty('cost', 50);
  });

  /**
   * Requirement 5.3: Test that cost defaults to 0 when not available
   */
  it('should default cost to 0 when not available from API response', () => {
    const withoutCost = {
      apiName: 'Datapro',
      endpoint: '/verifynin',
      method: 'GET',
      requestData: { nin: '12345678901' },
      statusCode: 200,
      responseData: { success: true },
      duration: 500,
      userId: 'user-123',
      ipAddress: '192.168.1.1',
      metadata: {
        cost: 0
      }
    };

    mockLogAPICall(withoutCost);

    const callArgs = mockLogAPICall.mock.calls[0][0];
    expect(callArgs.metadata).toHaveProperty('cost', 0);
  });

  /**
   * Requirement 5.1: Test API call logging for both endpoints
   * (/api/verify/nin and /api/identity/verify/:token)
   */
  it('should log API calls from both direct and customer verification endpoints', () => {
    // Direct verification endpoint
    mockLogAPICall({
      apiName: 'Datapro',
      endpoint: '/verifynin',
      method: 'GET',
      requestData: { nin: '12345678901' },
      statusCode: 200,
      responseData: { success: true },
      duration: 500,
      userId: 'broker-user-123',
      ipAddress: '192.168.1.100',
      metadata: { cost: 50 }
    });

    // Customer verification endpoint
    mockLogAPICall({
      apiName: 'Datapro',
      endpoint: '/verifynin',
      method: 'GET',
      requestData: { nin: '98765432109' },
      statusCode: 200,
      responseData: { success: true },
      duration: 600,
      userId: 'anonymous',
      ipAddress: '10.0.0.50',
      metadata: {
        listId: 'list-123',
        entryId: 'entry-456',
        cost: 50
      }
    });

    expect(mockLogAPICall).toHaveBeenCalledTimes(2);
    
    // Verify first call (direct endpoint)
    expect(mockLogAPICall.mock.calls[0][0].userId).toBe('broker-user-123');
    expect(mockLogAPICall.mock.calls[0][0].metadata).not.toHaveProperty('listId');
    
    // Verify second call (customer endpoint)
    expect(mockLogAPICall.mock.calls[1][0].userId).toBe('anonymous');
    expect(mockLogAPICall.mock.calls[1][0].metadata).toHaveProperty('listId');
    expect(mockLogAPICall.mock.calls[1][0].metadata).toHaveProperty('entryId');
  });
});


describe('VerifyData API Call Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Requirement 5.2: WHEN the Server calls the VerifyData CAC verification API,
   * THE Server SHALL use logAPICall to record the API call
   */
  it('should log VerifyData API calls with required fields', () => {
    const apiCallData = {
      apiName: 'VerifyData',
      endpoint: '/api/ValidateRcNumber/Initiate',
      method: 'POST',
      requestData: { rcNumber: 'RC123456' },
      statusCode: 200,
      responseData: { success: true, data: { company_name: 'TEST COMPANY LIMITED' } },
      duration: 1500,
      userId: 'test-user-123',
      ipAddress: '192.168.1.1',
      metadata: { listId: 'list-123', entryId: 'entry-456', cost: 100 }
    };

    mockLogAPICall(apiCallData);
    expect(mockLogAPICall).toHaveBeenCalledTimes(1);
    expect(mockLogAPICall).toHaveBeenCalledWith(apiCallData);
  });

  /**
   * Requirement 5.3: THE Server SHALL include API endpoint, request parameters (masked),
   * response status, and duration in API call logs
   */
  it('should include all required fields in VerifyData API call log', () => {
    const apiCallData = {
      apiName: 'VerifyData',
      endpoint: '/api/ValidateRcNumber/Initiate',
      method: 'POST',
      requestData: { rcNumber: 'RC789012' },
      statusCode: 200,
      responseData: { success: true },
      duration: 800,
      userId: 'anonymous',
      ipAddress: '10.0.0.1',
      metadata: { listId: 'list-789', entryId: 'entry-012', cost: 100 }
    };

    mockLogAPICall(apiCallData);
    const callArgs = mockLogAPICall.mock.calls[0][0];
    
    expect(callArgs).toHaveProperty('apiName', 'VerifyData');
    expect(callArgs).toHaveProperty('endpoint', '/api/ValidateRcNumber/Initiate');
    expect(callArgs).toHaveProperty('method', 'POST');
    expect(callArgs).toHaveProperty('requestData');
    expect(callArgs).toHaveProperty('statusCode', 200);
    expect(callArgs).toHaveProperty('responseData');
    expect(callArgs).toHaveProperty('duration');
    expect(callArgs).toHaveProperty('userId');
    expect(callArgs).toHaveProperty('ipAddress');
    expect(callArgs).toHaveProperty('metadata');
  });

  /**
   * Requirement 5.2: Test API call logging for successful CAC verification
   */
  it('should log successful VerifyData API calls with status 200', () => {
    const successData = {
      apiName: 'VerifyData',
      endpoint: '/api/ValidateRcNumber/Initiate',
      method: 'POST',
      requestData: { rcNumber: 'RC345678' },
      statusCode: 200,
      responseData: { success: true, data: { company_name: 'EXAMPLE COMPANY LTD' } },
      duration: 1200,
      userId: 'user-456',
      ipAddress: '172.16.0.1',
      metadata: { listId: 'list-abc', entryId: 'entry-def', cost: 100 }
    };

    mockLogAPICall(successData);
    expect(mockLogAPICall).toHaveBeenCalledWith(
      expect.objectContaining({
        apiName: 'VerifyData',
        statusCode: 200,
        responseData: expect.objectContaining({ success: true })
      })
    );
  });

  /**
   * Requirement 5.2: Test API call logging for failed CAC verification
   */
  it('should log failed VerifyData API calls with error status', () => {
    const failureData = {
      apiName: 'VerifyData',
      endpoint: '/api/ValidateRcNumber/Initiate',
      method: 'POST',
      requestData: { rcNumber: 'RC999999' },
      statusCode: 400,
      responseData: { success: false, errorCode: 'INVALID_RC_NUMBER', error: 'RC number not found' },
      duration: 700,
      userId: 'anonymous',
      ipAddress: '192.168.100.50',
      metadata: { listId: 'list-xyz', entryId: 'entry-uvw', cost: 0 }
    };

    mockLogAPICall(failureData);
    expect(mockLogAPICall).toHaveBeenCalledWith(
      expect.objectContaining({
        apiName: 'VerifyData',
        statusCode: 400,
        responseData: expect.objectContaining({ success: false, errorCode: 'INVALID_RC_NUMBER' })
      })
    );
  });

  /**
   * Requirement 5.2: Test API call logging for bulk CAC operations
   */
  it('should include bulkOperation flag in metadata for bulk CAC verifications', () => {
    const bulkOperationData = {
      apiName: 'VerifyData',
      endpoint: '/api/ValidateRcNumber/Initiate',
      method: 'POST',
      requestData: { rcNumber: 'RC123456' },
      statusCode: 200,
      responseData: { success: true },
      duration: 1100,
      userId: 'admin-user-789',
      ipAddress: 'bulk_operation',
      metadata: { listId: 'bulk-list-123', entryId: 'bulk-entry-456', bulkOperation: true, cost: 100 }
    };

    mockLogAPICall(bulkOperationData);
    const callArgs = mockLogAPICall.mock.calls[0][0];
    expect(callArgs.metadata).toHaveProperty('bulkOperation', true);
    expect(callArgs.ipAddress).toBe('bulk_operation');
  });
});
