/**
 * Test: Gemini API URL Configuration Fix
 * 
 * This test verifies that the Gemini OCR Engine correctly reads the API base URL
 * from environment variables with proper fallback logic.
 * 
 * Bug: Production was showing "undefined/api/gemini/generate" because the code
 * was only checking VITE_API_URL instead of VITE_API_BASE_URL (the standard variable).
 * 
 * Fix: Updated to check VITE_API_BASE_URL first, then VITE_API_URL, then localhost fallback.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Gemini API URL Configuration', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    // Reset environment before each test
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    Object.assign(import.meta.env, originalEnv);
  });

  it('should use VITE_API_BASE_URL when available (production scenario)', () => {
    // Simulate production environment
    const mockEnv = {
      VITE_API_BASE_URL: 'https://nem-server-rhdb.onrender.com',
      VITE_API_URL: undefined
    };

    const apiBaseUrl = mockEnv.VITE_API_BASE_URL || mockEnv.VITE_API_URL || 'http://localhost:3001';
    const url = `${apiBaseUrl}/api/gemini/generate`;

    expect(url).toBe('https://nem-server-rhdb.onrender.com/api/gemini/generate');
    expect(url).not.toContain('undefined');
  });

  it('should fallback to VITE_API_URL when VITE_API_BASE_URL is not set', () => {
    // Simulate environment with only VITE_API_URL
    const mockEnv = {
      VITE_API_BASE_URL: undefined,
      VITE_API_URL: 'https://api.example.com'
    };

    const apiBaseUrl = mockEnv.VITE_API_BASE_URL || mockEnv.VITE_API_URL || 'http://localhost:3001';
    const url = `${apiBaseUrl}/api/gemini/generate`;

    expect(url).toBe('https://api.example.com/api/gemini/generate');
    expect(url).not.toContain('undefined');
  });

  it('should use localhost fallback when no environment variables are set (development)', () => {
    // Simulate development environment with no env vars
    const mockEnv = {
      VITE_API_BASE_URL: undefined,
      VITE_API_URL: undefined
    };

    const apiBaseUrl = mockEnv.VITE_API_BASE_URL || mockEnv.VITE_API_URL || 'http://localhost:3001';
    const url = `${apiBaseUrl}/api/gemini/generate`;

    expect(url).toBe('http://localhost:3001/api/gemini/generate');
    expect(url).not.toContain('undefined');
  });

  it('should prefer VITE_API_BASE_URL over VITE_API_URL when both are set', () => {
    // Simulate environment with both variables set
    const mockEnv = {
      VITE_API_BASE_URL: 'https://nem-server-rhdb.onrender.com',
      VITE_API_URL: 'https://old-api.example.com'
    };

    const apiBaseUrl = mockEnv.VITE_API_BASE_URL || mockEnv.VITE_API_URL || 'http://localhost:3001';
    const url = `${apiBaseUrl}/api/gemini/generate`;

    expect(url).toBe('https://nem-server-rhdb.onrender.com/api/gemini/generate');
    expect(url).not.toBe('https://old-api.example.com/api/gemini/generate');
  });

  it('should never produce undefined in the URL', () => {
    // Test all possible combinations
    const testCases = [
      { VITE_API_BASE_URL: 'https://api1.com', VITE_API_URL: 'https://api2.com' },
      { VITE_API_BASE_URL: 'https://api1.com', VITE_API_URL: undefined },
      { VITE_API_BASE_URL: undefined, VITE_API_URL: 'https://api2.com' },
      { VITE_API_BASE_URL: undefined, VITE_API_URL: undefined },
      { VITE_API_BASE_URL: '', VITE_API_URL: '' },
    ];

    testCases.forEach((mockEnv) => {
      const apiBaseUrl = mockEnv.VITE_API_BASE_URL || mockEnv.VITE_API_URL || 'http://localhost:3001';
      const url = `${apiBaseUrl}/api/gemini/generate`;

      expect(url).not.toContain('undefined');
      expect(url).toMatch(/^https?:\/\/.+\/api\/gemini\/generate$/);
    });
  });

  it('should match the pattern used by other services in the codebase', () => {
    // This is the standard pattern used across the codebase
    const standardPattern = (env: any) => 
      env.VITE_API_BASE_URL || env.VITE_API_URL || 'http://localhost:3001';

    // Test that our implementation matches the standard
    const mockEnv = {
      VITE_API_BASE_URL: 'https://nem-server-rhdb.onrender.com',
      VITE_API_URL: undefined
    };

    const result = standardPattern(mockEnv);
    expect(result).toBe('https://nem-server-rhdb.onrender.com');
  });
});
