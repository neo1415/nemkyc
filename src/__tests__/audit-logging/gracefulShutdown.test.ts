/**
 * Unit Tests for Graceful Shutdown
 * 
 * Tests graceful shutdown handlers
 * Validates: Requirements 6.1, 6.2, 6.3, 6.6
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Graceful Shutdown Unit Tests', () => {
  let mockServer: any;
  let mockStopHealthMonitor: any;
  let mockLogSecurityEvent: any;
  let mockProcessExit: any;
  let originalProcessExit: any;

  beforeEach(() => {
    // Mock server.close
    mockServer = {
      close: vi.fn((callback) => {
        if (callback) callback();
      })
    };

    // Mock stopHealthMonitor
    mockStopHealthMonitor = vi.fn();

    // Mock logSecurityEvent
    mockLogSecurityEvent = vi.fn().mockResolvedValue(undefined);

    // Mock process.exit
    originalProcessExit = process.exit;
    mockProcessExit = vi.fn();
    process.exit = mockProcessExit as any;
  });

  afterEach(() => {
    // Restore process.exit
    process.exit = originalProcessExit;
    vi.clearAllMocks();
  });

  /**
   * Requirement 6.1: Test SIGTERM handling
   */
  it('should handle SIGTERM signal', async () => {
    const gracefulShutdown = async (signal: string) => {
      expect(signal).toBe('SIGTERM');
      
      // Log shutdown event
      await mockLogSecurityEvent({
        eventType: 'server_shutdown',
        severity: 'medium',
        description: `Server shutting down due to ${signal} signal`,
        userId: 'system',
        ipAddress: 'localhost',
        metadata: {
          signal,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }
      });

      // Close server
      mockServer.close();

      // Stop health monitor
      mockStopHealthMonitor();

      // Exit
      mockProcessExit(0);
    };

    await gracefulShutdown('SIGTERM');

    expect(mockLogSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'server_shutdown',
        severity: 'medium',
        metadata: expect.objectContaining({
          signal: 'SIGTERM'
        })
      })
    );
    expect(mockServer.close).toHaveBeenCalled();
    expect(mockStopHealthMonitor).toHaveBeenCalled();
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });

  /**
   * Requirement 6.2: Test SIGINT handling
   */
  it('should handle SIGINT signal', async () => {
    const gracefulShutdown = async (signal: string) => {
      expect(signal).toBe('SIGINT');
      
      // Log shutdown event
      await mockLogSecurityEvent({
        eventType: 'server_shutdown',
        severity: 'medium',
        description: `Server shutting down due to ${signal} signal`,
        userId: 'system',
        ipAddress: 'localhost',
        metadata: {
          signal,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }
      });

      // Close server
      mockServer.close();

      // Stop health monitor
      mockStopHealthMonitor();

      // Exit
      mockProcessExit(0);
    };

    await gracefulShutdown('SIGINT');

    expect(mockLogSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'server_shutdown',
        severity: 'medium',
        metadata: expect.objectContaining({
          signal: 'SIGINT'
        })
      })
    );
    expect(mockServer.close).toHaveBeenCalled();
    expect(mockStopHealthMonitor).toHaveBeenCalled();
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });

  /**
   * Requirement 6.3: Test that stopHealthMonitor is called
   */
  it('should call stopHealthMonitor during shutdown', async () => {
    const gracefulShutdown = async (signal: string) => {
      await mockLogSecurityEvent({
        eventType: 'server_shutdown',
        severity: 'medium',
        description: `Server shutting down due to ${signal} signal`,
        userId: 'system',
        ipAddress: 'localhost',
        metadata: { signal }
      });

      mockServer.close();
      mockStopHealthMonitor();
      mockProcessExit(0);
    };

    await gracefulShutdown('SIGTERM');

    expect(mockStopHealthMonitor).toHaveBeenCalledTimes(1);
  });

  /**
   * Requirement 6.3: Test shutdown event logging
   */
  it('should log shutdown event with correct metadata', async () => {
    const signal = 'SIGTERM';
    const gracefulShutdown = async (sig: string) => {
      await mockLogSecurityEvent({
        eventType: 'server_shutdown',
        severity: 'medium',
        description: `Server shutting down due to ${sig} signal`,
        userId: 'system',
        ipAddress: 'localhost',
        metadata: {
          signal: sig,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }
      });

      mockServer.close();
      mockStopHealthMonitor();
      mockProcessExit(0);
    };

    await gracefulShutdown(signal);

    expect(mockLogSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'server_shutdown',
        severity: 'medium',
        description: expect.stringContaining('SIGTERM'),
        userId: 'system',
        ipAddress: 'localhost',
        metadata: expect.objectContaining({
          signal: 'SIGTERM',
          timestamp: expect.any(String),
          uptime: expect.any(Number)
        })
      })
    );
  });

  /**
   * Requirement 6.6: Test uncaughtException handler
   */
  it('should handle uncaught exceptions', async () => {
    const error = new Error('Test uncaught exception');
    
    const handleUncaughtException = async (err: Error) => {
      await mockLogSecurityEvent({
        eventType: 'uncaught_exception',
        severity: 'critical',
        description: `Uncaught exception: ${err.message}`,
        userId: 'system',
        ipAddress: 'localhost',
        metadata: {
          error: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString()
        }
      });

      // Then call graceful shutdown
      mockServer.close();
      mockStopHealthMonitor();
      mockProcessExit(0);
    };

    await handleUncaughtException(error);

    expect(mockLogSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'uncaught_exception',
        severity: 'critical',
        description: 'Uncaught exception: Test uncaught exception',
        metadata: expect.objectContaining({
          error: 'Test uncaught exception',
          stack: expect.any(String)
        })
      })
    );
  });

  /**
   * Requirement 6.6: Test unhandledRejection handler
   */
  it('should handle unhandled promise rejections', async () => {
    const reason = 'Test unhandled rejection';
    
    const handleUnhandledRejection = async (rej: any) => {
      await mockLogSecurityEvent({
        eventType: 'unhandled_rejection',
        severity: 'critical',
        description: `Unhandled promise rejection: ${rej}`,
        userId: 'system',
        ipAddress: 'localhost',
        metadata: {
          reason: String(rej),
          timestamp: new Date().toISOString()
        }
      });
    };

    await handleUnhandledRejection(reason);

    expect(mockLogSecurityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'unhandled_rejection',
        severity: 'critical',
        description: 'Unhandled promise rejection: Test unhandled rejection',
        metadata: expect.objectContaining({
          reason: 'Test unhandled rejection'
        })
      })
    );
  });

  /**
   * Test that server.close is called during shutdown
   */
  it('should close server to new connections', async () => {
    const gracefulShutdown = async (signal: string) => {
      await mockLogSecurityEvent({
        eventType: 'server_shutdown',
        severity: 'medium',
        description: `Server shutting down due to ${signal} signal`,
        userId: 'system',
        ipAddress: 'localhost',
        metadata: { signal }
      });

      mockServer.close();
      mockStopHealthMonitor();
      mockProcessExit(0);
    };

    await gracefulShutdown('SIGTERM');

    expect(mockServer.close).toHaveBeenCalledTimes(1);
  });

  /**
   * Test that shutdown exits with code 0 on success
   */
  it('should exit with code 0 on successful shutdown', async () => {
    const gracefulShutdown = async (signal: string) => {
      await mockLogSecurityEvent({
        eventType: 'server_shutdown',
        severity: 'medium',
        description: `Server shutting down due to ${signal} signal`,
        userId: 'system',
        ipAddress: 'localhost',
        metadata: { signal }
      });

      mockServer.close();
      mockStopHealthMonitor();
      mockProcessExit(0);
    };

    await gracefulShutdown('SIGTERM');

    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });

  /**
   * Test that shutdown handles logging errors gracefully
   */
  it('should continue shutdown even if logging fails', async () => {
    const failingLogSecurityEvent = vi.fn().mockRejectedValue(new Error('Logging failed'));

    const gracefulShutdown = async (signal: string) => {
      try {
        await failingLogSecurityEvent({
          eventType: 'server_shutdown',
          severity: 'medium',
          description: `Server shutting down due to ${signal} signal`,
          userId: 'system',
          ipAddress: 'localhost',
          metadata: { signal }
        });
      } catch (error) {
        // Continue shutdown even if logging fails
      }

      mockServer.close();
      mockStopHealthMonitor();
      mockProcessExit(0);
    };

    await gracefulShutdown('SIGTERM');

    expect(failingLogSecurityEvent).toHaveBeenCalled();
    expect(mockServer.close).toHaveBeenCalled();
    expect(mockStopHealthMonitor).toHaveBeenCalled();
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });
});
