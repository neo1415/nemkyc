/**
 * Test: Date Format Helper Function
 * 
 * Tests the formatValueForDisplay helper function that converts
 * Date objects and various date string formats to YYYY-MM-DD format.
 * 
 * This is a unit test for the helper function used in DocumentUploadSection
 * to fix the date format display issue.
 */

import { describe, it, expect } from 'vitest';

/**
 * Format value for display (handles Date objects and strings)
 * This is the same function used in DocumentUploadSection
 */
function formatValueForDisplay(value: any): string {
  if (!value) return 'N/A';
  
  // If it's a Date object, format it as YYYY-MM-DD
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return 'Invalid Date';
    const year = value.getUTCFullYear();
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // If it's a string that looks like a date in YYYY-MM-DD format, keep it as is
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  
  // If it's a string that looks like DD/MM/YYYY, convert to YYYY-MM-DD
  if (typeof value === 'string') {
    const ddmmyyyyMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      return `${year}-${month}-${day}`;
    }
  }
  
  // For everything else, convert to string
  return String(value);
}

describe('Date Format Helper Function', () => {
  describe('Date object handling', () => {
    it('should convert Date object to YYYY-MM-DD format', () => {
      const date = new Date('1970-04-01T00:00:00.000Z');
      const result = formatValueForDisplay(date);
      expect(result).toBe('1970-04-01');
    });

    it('should handle Date objects with different months', () => {
      const date = new Date('2024-12-25T00:00:00.000Z');
      const result = formatValueForDisplay(date);
      expect(result).toBe('2024-12-25');
    });

    it('should handle Date objects with single-digit months and days', () => {
      const date = new Date('2024-01-05T00:00:00.000Z');
      const result = formatValueForDisplay(date);
      expect(result).toBe('2024-01-05');
    });

    it('should return "Invalid Date" for invalid Date objects', () => {
      const date = new Date('invalid');
      const result = formatValueForDisplay(date);
      expect(result).toBe('Invalid Date');
    });

    it('should NOT return GMT string format', () => {
      const date = new Date('1970-04-01T00:00:00.000Z');
      const result = formatValueForDisplay(date);
      
      // Ensure it doesn't contain GMT
      expect(result).not.toContain('GMT');
      expect(result).not.toContain('Wed');
      expect(result).not.toContain('Apr');
      
      // Ensure it's in YYYY-MM-DD format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('String date handling', () => {
    it('should preserve YYYY-MM-DD format strings', () => {
      const result = formatValueForDisplay('1970-04-01');
      expect(result).toBe('1970-04-01');
    });

    it('should convert DD/MM/YYYY to YYYY-MM-DD', () => {
      const result = formatValueForDisplay('01/04/1970');
      expect(result).toBe('1970-04-01');
    });

    it('should convert DD/MM/YYYY with different dates', () => {
      const result = formatValueForDisplay('25/12/2024');
      expect(result).toBe('2024-12-25');
    });

    it('should handle non-date strings as-is', () => {
      const result = formatValueForDisplay('Test Company');
      expect(result).toBe('Test Company');
    });
  });

  describe('Edge cases', () => {
    it('should return "N/A" for null', () => {
      const result = formatValueForDisplay(null);
      expect(result).toBe('N/A');
    });

    it('should return "N/A" for undefined', () => {
      const result = formatValueForDisplay(undefined);
      expect(result).toBe('N/A');
    });

    it('should return "N/A" for empty string', () => {
      const result = formatValueForDisplay('');
      expect(result).toBe('N/A');
    });

    it('should convert numbers to strings', () => {
      const result = formatValueForDisplay(12345);
      expect(result).toBe('12345');
    });

    it('should convert booleans to strings', () => {
      const result = formatValueForDisplay(true);
      expect(result).toBe('true');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle the exact scenario from the bug report', () => {
      // The bug: Date object was being converted to GMT string
      const formDate = new Date('1970-04-01T00:00:00.000Z');
      const ocrDate = '01/04/1970';
      
      const formattedFormDate = formatValueForDisplay(formDate);
      const formattedOcrDate = formatValueForDisplay(ocrDate);
      
      // Both should be in YYYY-MM-DD format
      expect(formattedFormDate).toBe('1970-04-01');
      expect(formattedOcrDate).toBe('1970-04-01');
      
      // Neither should contain GMT
      expect(formattedFormDate).not.toContain('GMT');
      expect(formattedOcrDate).not.toContain('GMT');
    });

    it('should make dates comparable when they represent the same date', () => {
      const date1 = new Date('1970-04-01T00:00:00.000Z');
      const date2 = '01/04/1970';
      const date3 = '1970-04-01';
      
      const formatted1 = formatValueForDisplay(date1);
      const formatted2 = formatValueForDisplay(date2);
      const formatted3 = formatValueForDisplay(date3);
      
      // All should be equal
      expect(formatted1).toBe(formatted2);
      expect(formatted2).toBe(formatted3);
      expect(formatted1).toBe('1970-04-01');
    });
  });
});
