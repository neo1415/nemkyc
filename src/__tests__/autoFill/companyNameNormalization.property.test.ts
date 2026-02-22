/**
 * Property-Based Tests for Company Name Normalization
 * 
 * Feature: nin-cac-autofill
 * Property 8: Company Name Standardization
 * Validates: Requirements 2.4, 4.5
 * 
 * Tests that company name normalization standardizes Ltd/Limited/PLC variations
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { normalizeCompanyName } from '../../utils/autoFill/normalizers';

describe('Feature: nin-cac-autofill, Property 8: Company Name Standardization', () => {
  it('should standardize Ltd to Limited', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0 && !s.includes('Ltd')),
        (companyBase) => {
          const withLtd = `${companyBase} Ltd`;
          const withLtdDot = `${companyBase} Ltd.`;
          
          const normalized1 = normalizeCompanyName(withLtd);
          const normalized2 = normalizeCompanyName(withLtdDot);
          
          expect(normalized1).toContain('Limited');
          expect(normalized1).not.toMatch(/\bLtd\.?$/i);
          expect(normalized2).toContain('Limited');
          expect(normalized2).not.toMatch(/\bLtd\.?$/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should standardize PLC to Public Limited Company', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0 && !s.includes('PLC')),
        (companyBase) => {
          const withPLC = `${companyBase} PLC`;
          const normalized = normalizeCompanyName(withPLC);
          
          expect(normalized).toContain('Public Limited Company');
          expect(normalized).not.toMatch(/\bPLC$/i);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle Ltd/PLC in different cases', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        fc.constantFrom('ltd', 'Ltd', 'LTD', 'plc', 'Plc', 'PLC'),
        (companyBase, suffix) => {
          const companyName = `${companyBase} ${suffix}`;
          const normalized = normalizeCompanyName(companyName);
          
          if (suffix.toLowerCase() === 'ltd') {
            expect(normalized).toContain('Limited');
          } else {
            expect(normalized).toContain('Public Limited Company');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply string normalization (trim and remove extra spaces)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        fc.nat(5),
        fc.nat(5),
        (companyName, leadingSpaces, trailingSpaces) => {
          const paddedName = ' '.repeat(leadingSpaces) + companyName + ' '.repeat(trailingSpaces);
          const normalized = normalizeCompanyName(paddedName);
          
          expect(normalized).not.toMatch(/^\s/);
          expect(normalized).not.toMatch(/\s$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle company names with multiple spaces', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }).filter(s => s.trim().length > 0 && !s.includes(' ')), { minLength: 2, maxLength: 4 }),
        (words) => {
          const companyWithMultipleSpaces = words.join('   ') + ' Ltd';
          const normalized = normalizeCompanyName(companyWithMultipleSpaces);
          
          expect(normalized).not.toMatch(/\s{2,}/);
          expect(normalized).toBe(words.join(' ') + ' Limited');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty string for null, undefined, or empty values', () => {
    expect(normalizeCompanyName('')).toBe('');
    expect(normalizeCompanyName('   ')).toBe('');
    expect(normalizeCompanyName(null as any)).toBe('');
    expect(normalizeCompanyName(undefined as any)).toBe('');
  });

  it('should only replace Ltd/PLC at the end of the name', () => {
    const companyName = 'Ltd Holdings PLC';
    const normalized = normalizeCompanyName(companyName);
    
    // Should only replace the PLC at the end, not the Ltd in the middle
    expect(normalized).toBe('Ltd Holdings Public Limited Company');
  });

  it('should preserve casing of company name except for Ltd/PLC', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0 && !s.match(/\b(ltd|plc)\.?$/i)),
        (companyBase) => {
          const withLtd = `${companyBase} Ltd`;
          const normalized = normalizeCompanyName(withLtd);
          
          // The base company name should preserve its casing
          const basePart = normalized.replace(' Limited', '').trim();
          const expectedBase = companyBase.trim().replace(/\s+/g, ' ');
          expect(basePart).toBe(expectedBase);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be idempotent for already normalized names', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
        (companyBase) => {
          const withLimited = `${companyBase} Limited`;
          const normalized1 = normalizeCompanyName(withLimited);
          const normalized2 = normalizeCompanyName(normalized1);
          
          expect(normalized1).toBe(normalized2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
