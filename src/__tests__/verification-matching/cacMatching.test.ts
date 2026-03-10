/**
 * CAC Verification Data Matching Tests
 * 
 * Tests that CAC verification data matches user-entered data
 */

import { describe, it, expect } from 'vitest';
import { matchCACData } from '../../utils/verificationMatcher';

describe('CAC Verification Matching', () => {
  it('should match when company names are identical', () => {
    const result = matchCACData(
      {
        insured: 'NEM Insurance PLC',
        dateOfIncorporationRegistration: new Date('2020-01-15'),
        officeAddress: '123 Main Street, Lagos'
      },
      {
        name: 'NEM Insurance PLC',
        registrationDate: '2020-01-15',
        address: '123 Main Street, Lagos'
      }
    );

    expect(result.matches).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  it('should fail when company names are completely different', () => {
    const result = matchCACData(
      {
        insured: 'City Covenant Brokers',
        dateOfIncorporationRegistration: new Date('2020-01-15')
      },
      {
        name: 'NEM Insurance PLC',
        registrationDate: '2020-01-15'
      }
    );

    expect(result.matches).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
    expect(result.mismatches[0]).toContain('company name');
  });

  it('should fail when incorporation dates differ', () => {
    const result = matchCACData(
      {
        insured: 'NEM Insurance PLC',
        dateOfIncorporationRegistration: new Date('2020-01-15')
      },
      {
        name: 'NEM Insurance PLC',
        registrationDate: '2019-06-20'
      }
    );

    expect(result.matches).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
    expect(result.mismatches[0]).toContain('incorporation date');
  });

  it('should warn when company names are similar but not exact', () => {
    const result = matchCACData(
      {
        insured: 'NEM Insurance Company',
        dateOfIncorporationRegistration: new Date('2020-01-15')
      },
      {
        name: 'NEM Insurance PLC',
        registrationDate: '2020-01-15'
      }
    );

    // Should match but with warnings
    expect(result.matches).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should handle case-insensitive matching', () => {
    const result = matchCACData(
      {
        insured: 'nem insurance plc',
        dateOfIncorporationRegistration: new Date('2020-01-15')
      },
      {
        name: 'NEM INSURANCE PLC',
        registrationDate: '2020-01-15'
      }
    );

    expect(result.matches).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });

  it('should handle missing optional fields gracefully', () => {
    const result = matchCACData(
      {
        insured: 'NEM Insurance PLC'
      },
      {
        name: 'NEM Insurance PLC'
      }
    );

    expect(result.matches).toBe(true);
    expect(result.mismatches).toHaveLength(0);
  });
});
