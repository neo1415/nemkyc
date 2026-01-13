/**
 * Property-Based Tests for Token Generation
 * 
 * Feature: identity-remediation
 * Property 1: Token Generation Security and Uniqueness
 * 
 * Tests:
 * - Token uniqueness across 1000 generated tokens
 * - Token length and character set (URL-safe)
 * - URL format matches pattern
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateSecureToken,
  generateVerificationUrl,
  isTokenExpired,
  calculateExpirationDate,
  isValidTokenFormat,
  generateTokenWithExpiration,
  DEFAULT_EXPIRATION_DAYS,
} from '../../utils/tokenUtils';

describe('Feature: identity-remediation, Property 1: Token Generation Security and Uniqueness', () => {
  /**
   * Property: Token Uniqueness
   * For any batch of generated tokens, all tokens must be unique.
   * Testing with 1000 tokens as specified in requirements.
   */
  it('should generate unique tokens across 1000 generations', () => {
    const tokens = new Set<string>();
    const tokenCount = 1000;

    for (let i = 0; i < tokenCount; i++) {
      const token = generateSecureToken();
      tokens.add(token);
    }

    // All 1000 tokens should be unique
    expect(tokens.size).toBe(tokenCount);
  });

  /**
   * Property: Token Length
   * For any generated token, it must have at least 43 characters
   * (32 bytes in URL-safe base64 = ceil(32 * 8 / 6) = 43 characters without padding)
   */
  it('should generate tokens with correct minimum length (32 bytes encoded)', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const token = generateSecureToken();
        // 32 bytes in base64 without padding = 43 characters
        expect(token.length).toBeGreaterThanOrEqual(43);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: URL-Safe Character Set
   * For any generated token, it must only contain URL-safe base64 characters:
   * A-Z, a-z, 0-9, -, _
   */
  it('should generate tokens with only URL-safe characters', () => {
    const urlSafePattern = /^[A-Za-z0-9_-]+$/;

    fc.assert(
      fc.property(fc.constant(null), () => {
        const token = generateSecureToken();
        expect(urlSafePattern.test(token)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: No Padding Characters
   * For any generated token, it must not contain base64 padding character '='
   */
  it('should generate tokens without base64 padding characters', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const token = generateSecureToken();
        expect(token).not.toContain('=');
        expect(token).not.toContain('+');
        expect(token).not.toContain('/');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Token Format Validation
   * For any generated token, isValidTokenFormat should return true
   */
  it('should generate tokens that pass format validation', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const token = generateSecureToken();
        expect(isValidTokenFormat(token)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Verification URL Format
   * For any token and base URL, the generated URL must match pattern: {base_url}/verify/{token}
   */
  it('should generate verification URLs matching the required pattern', () => {
    fc.assert(
      fc.property(
        fc.webUrl({ withFragments: false, withQueryParameters: false }),
        (baseUrl) => {
          const token = generateSecureToken();
          const url = generateVerificationUrl(token, baseUrl);
          
          // URL should end with /verify/{token}
          const expectedSuffix = `/verify/${token}`;
          expect(url.endsWith(expectedSuffix)).toBe(true);
          
          // URL should start with the base URL (normalized without trailing slash)
          const normalizedBase = baseUrl.replace(/\/$/, '');
          expect(url.startsWith(normalizedBase)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: URL Format with Default Base
   * For any generated token, the URL should be properly formatted
   */
  it('should generate valid verification URLs with default base', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const token = generateSecureToken();
        const url = generateVerificationUrl(token);
        
        // URL should contain /verify/ followed by the token
        expect(url).toContain('/verify/');
        expect(url.endsWith(token)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Expiration Date Calculation
   * For any positive number of days, the expiration date should be in the future
   */
  it('should calculate expiration dates correctly for any positive days', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (days) => {
          const now = new Date();
          const expirationDate = calculateExpirationDate(days);
          
          // Expiration should be in the future
          expect(expirationDate.getTime()).toBeGreaterThan(now.getTime());
          
          // Expiration should be approximately 'days' days from now
          const expectedMs = days * 24 * 60 * 60 * 1000;
          const actualMs = expirationDate.getTime() - now.getTime();
          // Allow 1 second tolerance for test execution time
          expect(Math.abs(actualMs - expectedMs)).toBeLessThan(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Token Expiration Check
   * For any date in the past, isTokenExpired should return true
   * For any date in the future, isTokenExpired should return false
   */
  it('should correctly identify expired tokens', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (daysAgo) => {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - daysAgo);
          
          expect(isTokenExpired(pastDate)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify non-expired tokens', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (daysFromNow) => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + daysFromNow);
          
          expect(isTokenExpired(futureDate)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Token With Expiration Generation
   * For any expiration days, generateTokenWithExpiration should return
   * a valid token and a future expiration date
   */
  it('should generate token with valid expiration', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 365 }),
        (days) => {
          const { token, expiresAt } = generateTokenWithExpiration(days);
          
          // Token should be valid
          expect(isValidTokenFormat(token)).toBe(true);
          
          // Expiration should be in the future
          expect(isTokenExpired(expiresAt)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default Expiration Days
   * When no days specified, should use DEFAULT_EXPIRATION_DAYS
   */
  it('should use default expiration days when not specified', () => {
    const { expiresAt } = generateTokenWithExpiration();
    const now = new Date();
    
    const expectedMs = DEFAULT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    const actualMs = expiresAt.getTime() - now.getTime();
    
    // Allow 1 second tolerance
    expect(Math.abs(actualMs - expectedMs)).toBeLessThan(1000);
  });
});
