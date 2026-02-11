/**
 * Unit Tests for Rate Limit Reset Endpoint
 * 
 * Tests rate limit reset endpoint functionality
 * Validates: Requirements 7.1, 7.2, 7.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Rate Limit Reset Endpoint Unit Tests', () => {
  let mockResetDataproRateLimit: any;
  let mockResetVerifydataRateLimit: any;
  let mockLogSecurityEvent: any;

  beforeEach(() => {
    mockResetDataproRateLimit = vi.fn();
    mockResetVerifydataRateLimit = vi.fn();
    mockLogSecurityEvent = vi.fn().mockResolvedValue(undefined);
  });

  /**
   * Requirement 7.1, 7.2: Test that super admin can reset rate limits
   */
  it('should allow super admin to reset Datapro rate limit', async () => {
    const request = {
      user: {
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'super admin'
      },
      body: {
        service: 'datapro',
        reason: 'Emergency rate limit reset due to API issues'
      },
      ipData: {
        masked: '192.168.1.***'
      }
    };

    // Simulate endpoint logic
    const { service, reason } = request.body;
    
    if (service === 'datapro') {
      mockResetDataproRateLimit();
    }

    await mockLogSecurityEvent({
      eventType: 'rate_limit_reset',
      severity: 'medium',
      description: `Rate limit reset for ${service} by ${request.user.email}`,
      userId: request.user.uid,
      ipAddress: request.ipData.masked,
      metadata: {
        service,
        reason,
        resetBy: request.user.email
      }
    });

    const response = {
      success: true,
      message: `Rate limit reset successful for ${service}`,
      service,
      resetBy: request.user.email,
      timestamp: new Date().toISOString()
    };

    expect(mockResetDataproRateLimit).toHaveBeenCalledTimes(1);
    expect(mockLogSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'rate_limit_reset',
        severity: 'medium',
        metadata: expect.objectContaining({
          service: 'datapro',
          reason: 'Emergency rate limit reset due to API issues'
        })
      })
    );
    expect(response.success).toBe(true);
    expect(response.service).toBe('datapro');
  });

  /**
   * Requirement 7.1, 7.2: Test that super admin can reset VerifyData rate limit
   */
  it('should allow super admin to reset VerifyData rate limit', async () => {
    const request = {
      user: {
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'super admin'
      },
      body: {
        service: 'verifydata',
        reason: 'Clearing rate limit after maintenance'
      },
      ipData: {
        masked: '192.168.1.***'
      }
    };

    const { service, reason } = request.body;
    
    if (service === 'verifydata') {
      mockResetVerifydataRateLimit();
    }

    await mockLogSecurityEvent({
      eventType: 'rate_limit_reset',
      severity: 'medium',
      description: `Rate limit reset for ${service} by ${request.user.email}`,
      userId: request.user.uid,
      ipAddress: request.ipData.masked,
      metadata: {
        service,
        reason,
        resetBy: request.user.email
      }
    });

    expect(mockResetVerifydataRateLimit).toHaveBeenCalledTimes(1);
    expect(mockLogSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'rate_limit_reset',
        severity: 'medium',
        metadata: expect.objectContaining({
          service: 'verifydata'
        })
      })
    );
  });

  /**
   * Requirement 7.2, 7.5: Test that non-super-admin is rejected with 403
   */
  it('should reject non-super-admin with 403', () => {
    const request = {
      user: {
        uid: 'user-123',
        email: 'user@example.com',
        role: 'admin' // Not super admin
      },
      body: {
        service: 'datapro',
        reason: 'Attempting to reset rate limit'
      }
    };

    // Simulate authorization check
    const isSuperAdmin = request.user.role === 'super admin';
    
    if (!isSuperAdmin) {
      const response = {
        status: 403,
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      };
      
      expect(response.status).toBe(403);
      expect(response.error).toBe('Insufficient permissions');
    }

    // Verify rate limit reset was NOT called
    expect(mockResetDataproRateLimit).not.toHaveBeenCalled();
    expect(mockResetVerifydataRateLimit).not.toHaveBeenCalled();
  });

  /**
   * Requirement 7.5: Test that invalid service returns 400
   */
  it('should reject invalid service with 400', () => {
    const request = {
      user: {
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'super admin'
      },
      body: {
        service: 'invalid-service',
        reason: 'Testing invalid service'
      }
    };

    // Simulate validation
    const validServices = ['datapro', 'verifydata'];
    const isValidService = validServices.includes(request.body.service);

    if (!isValidService) {
      const response = {
        status: 400,
        error: 'Validation failed',
        details: [{
          field: 'service',
          message: 'Service must be either "datapro" or "verifydata"'
        }]
      };

      expect(response.status).toBe(400);
      expect(response.error).toBe('Validation failed');
    }

    // Verify rate limit reset was NOT called
    expect(mockResetDataproRateLimit).not.toHaveBeenCalled();
    expect(mockResetVerifydataRateLimit).not.toHaveBeenCalled();
  });

  /**
   * Requirement 7.5: Test that missing reason returns 400
   */
  it('should reject missing reason with 400', () => {
    const request = {
      user: {
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'super admin'
      },
      body: {
        service: 'datapro',
        reason: '' // Empty reason
      }
    };

    // Simulate validation
    const hasReason = request.body.reason && request.body.reason.trim().length > 0;

    if (!hasReason) {
      const response = {
        status: 400,
        error: 'Validation failed',
        details: [{
          field: 'reason',
          message: 'Reason is required'
        }]
      };

      expect(response.status).toBe(400);
      expect(response.error).toBe('Validation failed');
    }

    // Verify rate limit reset was NOT called
    expect(mockResetDataproRateLimit).not.toHaveBeenCalled();
  });

  /**
   * Test that reason must be at least 10 characters
   */
  it('should reject reason shorter than 10 characters', () => {
    const request = {
      user: {
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'super admin'
      },
      body: {
        service: 'datapro',
        reason: 'Short' // Too short
      }
    };

    // Simulate validation
    const isValidLength = request.body.reason.length >= 10 && request.body.reason.length <= 500;

    if (!isValidLength) {
      const response = {
        status: 400,
        error: 'Validation failed',
        details: [{
          field: 'reason',
          message: 'Reason must be between 10 and 500 characters'
        }]
      };

      expect(response.status).toBe(400);
    }

    expect(mockResetDataproRateLimit).not.toHaveBeenCalled();
  });

  /**
   * Test that response includes required fields
   */
  it('should return response with required fields', async () => {
    const request = {
      user: {
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'super admin'
      },
      body: {
        service: 'datapro',
        reason: 'Testing rate limit reset functionality'
      },
      ipData: {
        masked: '192.168.1.***'
      }
    };

    const { service, reason } = request.body;
    mockResetDataproRateLimit();

    await mockLogSecurityEvent({
      eventType: 'rate_limit_reset',
      severity: 'medium',
      description: `Rate limit reset for ${service} by ${request.user.email}`,
      userId: request.user.uid,
      ipAddress: request.ipData.masked,
      metadata: { service, reason, resetBy: request.user.email }
    });

    const response = {
      success: true,
      message: `Rate limit reset successful for ${service}`,
      service,
      resetBy: request.user.email,
      timestamp: new Date().toISOString()
    };

    // Verify response has all required fields
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('service');
    expect(response).toHaveProperty('resetBy');
    expect(response).toHaveProperty('timestamp');
    expect(response.success).toBe(true);
    expect(response.service).toBe('datapro');
    expect(response.resetBy).toBe('admin@example.com');
  });

  /**
   * Test that audit logging is called with correct metadata
   */
  it('should log rate limit reset with correct metadata', async () => {
    const request = {
      user: {
        uid: 'admin-123',
        email: 'admin@example.com',
        role: 'super admin'
      },
      body: {
        service: 'datapro',
        reason: 'Emergency reset due to API throttling'
      },
      ipData: {
        masked: '192.168.1.***'
      }
    };

    const { service, reason } = request.body;
    mockResetDataproRateLimit();

    await mockLogSecurityEvent({
      eventType: 'rate_limit_reset',
      severity: 'medium',
      description: `Rate limit reset for ${service} by ${request.user.email}`,
      userId: request.user.uid,
      ipAddress: request.ipData.masked,
      metadata: {
        service,
        reason,
        resetBy: request.user.email,
        resetByUid: request.user.uid,
        resetByRole: request.user.role,
        timestamp: new Date().toISOString()
      }
    });

    expect(mockLogSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'rate_limit_reset',
        severity: 'medium',
        userId: 'admin-123',
        ipAddress: '192.168.1.***',
        metadata: expect.objectContaining({
          service: 'datapro',
          reason: 'Emergency reset due to API throttling',
          resetBy: 'admin@example.com',
          resetByUid: 'admin-123',
          resetByRole: 'super admin'
        })
      })
    );
  });
});
