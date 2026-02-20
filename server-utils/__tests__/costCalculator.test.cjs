/**
 * Unit Tests for Cost Calculator
 * 
 * Tests the cost calculation functionality for bulk verification operations.
 */

const { calculateCost, formatCurrency, loadCostConfig } = require('../costCalculator.cjs');

describe('Cost Calculator', () => {
  // Store original env vars
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadCostConfig', () => {
    it('should load costs from environment variables', () => {
      process.env.NIN_VERIFICATION_COST = '100';
      process.env.BVN_VERIFICATION_COST = '75';
      process.env.CAC_VERIFICATION_COST = '150';
      process.env.COST_CURRENCY = 'USD';

      const config = loadCostConfig();

      expect(config.NIN).toBe(100);
      expect(config.BVN).toBe(75);
      expect(config.CAC).toBe(150);
      expect(config.currency).toBe('USD');
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.NIN_VERIFICATION_COST;
      delete process.env.BVN_VERIFICATION_COST;
      delete process.env.CAC_VERIFICATION_COST;
      delete process.env.COST_CURRENCY;

      const config = loadCostConfig();

      expect(config.NIN).toBe(50);
      expect(config.BVN).toBe(50);
      expect(config.CAC).toBe(100);
      expect(config.currency).toBe('NGN');
    });

    it('should handle partial environment variable configuration', () => {
      process.env.NIN_VERIFICATION_COST = '200';
      delete process.env.BVN_VERIFICATION_COST;
      delete process.env.CAC_VERIFICATION_COST;
      process.env.COST_CURRENCY = 'EUR';

      const config = loadCostConfig();

      expect(config.NIN).toBe(200);
      expect(config.BVN).toBe(50); // default
      expect(config.CAC).toBe(100); // default
      expect(config.currency).toBe('EUR');
    });
  });

  describe('formatCurrency', () => {
    it('should format NGN currency correctly', () => {
      const formatted = formatCurrency(1000, 'NGN');
      expect(formatted).toContain('₦');
      expect(formatted).toContain('1,000.00');
    });

    it('should format USD currency correctly', () => {
      const formatted = formatCurrency(1000, 'USD');
      expect(formatted).toContain('$');
      expect(formatted).toContain('1,000.00');
    });

    it('should format EUR currency correctly', () => {
      const formatted = formatCurrency(1000, 'EUR');
      expect(formatted).toContain('€');
      expect(formatted).toContain('1,000.00');
    });

    it('should format GBP currency correctly', () => {
      const formatted = formatCurrency(1000, 'GBP');
      expect(formatted).toContain('£');
      expect(formatted).toContain('1,000.00');
    });

    it('should handle unknown currency codes', () => {
      const formatted = formatCurrency(1000, 'XYZ');
      expect(formatted).toContain('XYZ');
      expect(formatted).toContain('1,000.00');
    });

    it('should round to 2 decimal places', () => {
      const formatted = formatCurrency(1234.567, 'NGN');
      expect(formatted).toContain('1,234.57');
    });

    it('should handle zero amount', () => {
      const formatted = formatCurrency(0, 'NGN');
      expect(formatted).toContain('0.00');
    });

    it('should handle invalid amounts gracefully', () => {
      expect(formatCurrency(NaN, 'NGN')).toContain('0.00');
      expect(formatCurrency(undefined, 'NGN')).toContain('0.00');
      expect(formatCurrency(null, 'NGN')).toContain('0.00');
    });
  });

  describe('calculateCost', () => {
    beforeEach(() => {
      // Set standard test costs
      process.env.NIN_VERIFICATION_COST = '50';
      process.env.BVN_VERIFICATION_COST = '50';
      process.env.CAC_VERIFICATION_COST = '100';
      process.env.COST_CURRENCY = 'NGN';
    });

    it('should calculate cost for NIN verifications only', () => {
      const result = calculateCost({ nin: 10, bvn: 0, cac: 0 });

      expect(result.totalCost).toBe(500);
      expect(result.currency).toBe('NGN');
      expect(result.breakdown.nin).toBe(500);
      expect(result.breakdown.bvn).toBe(0);
      expect(result.breakdown.cac).toBe(0);
    });

    it('should calculate cost for BVN verifications only', () => {
      const result = calculateCost({ nin: 0, bvn: 20, cac: 0 });

      expect(result.totalCost).toBe(1000);
      expect(result.currency).toBe('NGN');
      expect(result.breakdown.nin).toBe(0);
      expect(result.breakdown.bvn).toBe(1000);
      expect(result.breakdown.cac).toBe(0);
    });

    it('should calculate cost for CAC verifications only', () => {
      const result = calculateCost({ nin: 0, bvn: 0, cac: 5 });

      expect(result.totalCost).toBe(500);
      expect(result.currency).toBe('NGN');
      expect(result.breakdown.nin).toBe(0);
      expect(result.breakdown.bvn).toBe(0);
      expect(result.breakdown.cac).toBe(500);
    });

    it('should calculate cost for mixed identity types', () => {
      const result = calculateCost({ nin: 100, bvn: 10, cac: 10 });

      expect(result.totalCost).toBe(6500);
      expect(result.currency).toBe('NGN');
      expect(result.breakdown.nin).toBe(5000);
      expect(result.breakdown.bvn).toBe(500);
      expect(result.breakdown.cac).toBe(1000);
    });

    it('should handle zero counts', () => {
      const result = calculateCost({ nin: 0, bvn: 0, cac: 0 });

      expect(result.totalCost).toBe(0);
      expect(result.breakdown.nin).toBe(0);
      expect(result.breakdown.bvn).toBe(0);
      expect(result.breakdown.cac).toBe(0);
    });

    it('should handle empty counts object', () => {
      const result = calculateCost({});

      expect(result.totalCost).toBe(0);
      expect(result.breakdown.nin).toBe(0);
      expect(result.breakdown.bvn).toBe(0);
      expect(result.breakdown.cac).toBe(0);
    });

    it('should handle undefined counts parameter', () => {
      const result = calculateCost();

      expect(result.totalCost).toBe(0);
      expect(result.breakdown.nin).toBe(0);
      expect(result.breakdown.bvn).toBe(0);
      expect(result.breakdown.cac).toBe(0);
    });

    it('should handle missing count properties', () => {
      const result = calculateCost({ nin: 10 });

      expect(result.totalCost).toBe(500);
      expect(result.breakdown.nin).toBe(500);
      expect(result.breakdown.bvn).toBe(0);
      expect(result.breakdown.cac).toBe(0);
    });

    it('should include formatted total cost', () => {
      const result = calculateCost({ nin: 10, bvn: 10, cac: 10 });

      expect(result.formattedTotal).toBeDefined();
      expect(result.formattedTotal).toContain('₦');
      expect(result.formattedTotal).toContain('2,000.00');
    });

    it('should include formatted breakdown', () => {
      const result = calculateCost({ nin: 10, bvn: 10, cac: 10 });

      expect(result.formattedBreakdown).toBeDefined();
      expect(result.formattedBreakdown.nin).toContain('₦');
      expect(result.formattedBreakdown.bvn).toContain('₦');
      expect(result.formattedBreakdown.cac).toContain('₦');
    });

    it('should handle string counts by parsing to integers', () => {
      const result = calculateCost({ nin: '10', bvn: '5', cac: '2' });

      expect(result.totalCost).toBe(950);
      expect(result.breakdown.nin).toBe(500);
      expect(result.breakdown.bvn).toBe(250);
      expect(result.breakdown.cac).toBe(200);
    });

    it('should throw error for negative counts', () => {
      expect(() => calculateCost({ nin: -5, bvn: 0, cac: 0 })).toThrow('Identity counts must be non-negative');
      expect(() => calculateCost({ nin: 0, bvn: -10, cac: 0 })).toThrow('Identity counts must be non-negative');
      expect(() => calculateCost({ nin: 0, bvn: 0, cac: -1 })).toThrow('Identity counts must be non-negative');
    });

    it('should use current API pricing from environment', () => {
      process.env.NIN_VERIFICATION_COST = '75';
      process.env.BVN_VERIFICATION_COST = '80';
      process.env.CAC_VERIFICATION_COST = '150';

      const result = calculateCost({ nin: 10, bvn: 10, cac: 10 });

      expect(result.totalCost).toBe(3050);
      expect(result.breakdown.nin).toBe(750);
      expect(result.breakdown.bvn).toBe(800);
      expect(result.breakdown.cac).toBe(1500);
    });

    it('should reflect currency changes in formatted output', () => {
      process.env.COST_CURRENCY = 'USD';

      const result = calculateCost({ nin: 10, bvn: 0, cac: 0 });

      expect(result.currency).toBe('USD');
      expect(result.formattedTotal).toContain('$');
    });

    it('should handle large verification counts', () => {
      const result = calculateCost({ nin: 1000, bvn: 500, cac: 250 });

      expect(result.totalCost).toBe(100000);
      expect(result.breakdown.nin).toBe(50000);
      expect(result.breakdown.bvn).toBe(25000);
      expect(result.breakdown.cac).toBe(25000);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      process.env.NIN_VERIFICATION_COST = '50';
      process.env.BVN_VERIFICATION_COST = '50';
      process.env.CAC_VERIFICATION_COST = '100';
      process.env.COST_CURRENCY = 'NGN';
    });

    it('should handle decimal counts by truncating to integers', () => {
      const result = calculateCost({ nin: 10.7, bvn: 5.3, cac: 2.9 });

      // parseInt truncates: 10.7 -> 10, 5.3 -> 5, 2.9 -> 2
      expect(result.totalCost).toBe(950); // (10*50) + (5*50) + (2*100)
      expect(result.breakdown.nin).toBe(500);
      expect(result.breakdown.bvn).toBe(250);
      expect(result.breakdown.cac).toBe(200);
    });

    it('should handle invalid string counts as zero', () => {
      const result = calculateCost({ nin: 'abc', bvn: 'xyz', cac: 'invalid' });

      expect(result.totalCost).toBe(0);
      expect(result.breakdown.nin).toBe(0);
      expect(result.breakdown.bvn).toBe(0);
      expect(result.breakdown.cac).toBe(0);
    });

    it('should handle null counts as zero', () => {
      const result = calculateCost({ nin: null, bvn: null, cac: null });

      expect(result.totalCost).toBe(0);
    });
  });
});
