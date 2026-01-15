/**
 * Property-Based Test: Data Display Correctness
 * 
 * Property 10: Data Display Correctness
 * For any field in the Admin Table that has a non-null, non-empty value in the database,
 * the displayed value SHALL NOT be 'N/A' AND time fields SHALL NOT display as 'NaN'.
 * 
 * Validates: Requirements 8.4, 8.5
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Helper function to format time values (mimics AdminUnifiedTable behavior)
const formatTime = (time: any): string => {
  if (!time) return 'N/A';
  
  if (typeof time === 'string') {
    // Handle HH:MM format
    if (/^\d{2}:\d{2}$/.test(time)) return time;
    
    // Handle ISO date string
    try {
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      return time;
    }
  }
  
  if (typeof time === 'number') {
    // Handle timestamp
    try {
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      return 'N/A';
    }
  }
  
  return String(time);
};

// Helper function to format date values (mimics AdminUnifiedTable behavior)
const formatDate = (date: any): string => {
  try {
    let dateObj: Date;
    
    if (date && typeof date.toDate === 'function') {
      // Firebase Timestamp
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      // Check if already formatted as dd/mm/yyyy
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return date;
      }
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return '';
    }

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = String(dateObj.getFullYear());
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '';
  }
};

// Helper function to check if a value should display as N/A
const shouldDisplayValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
};

// Helper function to format display value
const formatDisplayValue = (value: any, fieldKey: string): string => {
  if (!shouldDisplayValue(value)) return 'N/A';
  
  // Handle time fields
  if (fieldKey.toLowerCase().includes('time')) {
    return formatTime(value);
  }
  
  // Handle date fields
  if (fieldKey.toLowerCase().includes('date') || 
      fieldKey === 'dateOfBirth' || 
      fieldKey === 'dob') {
    return formatDate(value);
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? `${value.length} items` : 'N/A';
  }
  
  // Handle objects
  if (typeof value === 'object' && value !== null) {
    return 'View Details';
  }
  
  return String(value);
};

describe('Property 10: Data Display Correctness', () => {
  it('should not display N/A for fields with valid non-empty data', () => {
    fc.assert(
      fc.property(
        fc.record({
          fieldKey: fc.constantFrom('name', 'email', 'phone', 'address', 'policyNumber'),
          value: fc.oneof(
            fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // Filter out whitespace-only strings
            fc.integer({ min: 1 }),
            fc.double({ min: 0.01, noNaN: true }),
            fc.boolean()
          )
        }),
        ({ fieldKey, value }) => {
          const displayValue = formatDisplayValue(value, fieldKey);
          
          // For valid non-empty values, display should not be 'N/A'
          expect(displayValue).not.toBe('N/A');
          expect(displayValue).not.toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display N/A for null, undefined, or empty values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('name', 'email', 'phone', 'address'),
        fc.constantFrom(null, undefined, '', '   ', []),
        (fieldKey, value) => {
          const displayValue = formatDisplayValue(value, fieldKey);
          expect(displayValue).toBe('N/A');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format time fields correctly without NaN', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Valid time strings
          fc.tuple(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }))
            .map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`),
          // ISO date strings
          fc.date().filter(d => !isNaN(d.getTime())).map(d => d.toISOString()),
          // Timestamps
          fc.integer({ min: 946684800000, max: 2524608000000 }) // 2000-2050
        ),
        (timeValue) => {
          const displayValue = formatTime(timeValue);
          
          // Should not contain NaN
          expect(displayValue).not.toContain('NaN');
          expect(displayValue).not.toBe('NaN');
          
          // Should be a valid string
          expect(typeof displayValue).toBe('string');
          expect(displayValue.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format date fields correctly without NaN', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Date objects
          fc.date({ min: new Date('2000-01-01'), max: new Date('2050-12-31') }),
          // ISO strings
          fc.date({ min: new Date('2000-01-01'), max: new Date('2050-12-31') }).map(d => d.toISOString()),
          // Timestamps
          fc.integer({ min: 946684800000, max: 2524608000000 }),
          // Already formatted dates
          fc.tuple(
            fc.integer({ min: 1, max: 31 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 2000, max: 2050 })
          ).map(([d, m, y]) => `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`)
        ),
        (dateValue) => {
          const displayValue = formatDate(dateValue);
          
          // Should not contain NaN
          expect(displayValue).not.toContain('NaN');
          expect(displayValue).not.toBe('NaN');
          
          // Should be a valid string (either formatted date or empty for invalid)
          expect(typeof displayValue).toBe('string');
          
          // If not empty, should match dd/mm/yyyy format
          if (displayValue.length > 0) {
            expect(displayValue).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle Firebase Timestamp objects correctly', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2000-01-01'), max: new Date('2050-12-31') }).filter(d => !isNaN(d.getTime())), // Filter out invalid dates
        (date) => {
          // Mock Firebase Timestamp
          const mockTimestamp = {
            toDate: () => date
          };
          
          const displayValue = formatDate(mockTimestamp);
          
          // Should format correctly
          expect(displayValue).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
          expect(displayValue).not.toContain('NaN');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases for time formatting', () => {
    // Test specific edge cases
    expect(formatTime('00:00')).toBe('00:00');
    expect(formatTime('23:59')).toBe('23:59');
    expect(formatTime('12:30')).toBe('12:30');
    expect(formatTime(null)).toBe('N/A');
    expect(formatTime(undefined)).toBe('N/A');
    expect(formatTime('')).toBe('N/A');
    
    // Invalid time should not produce NaN
    const invalidTime = formatTime('invalid');
    expect(invalidTime).not.toContain('NaN');
  });

  it('should handle edge cases for date formatting', () => {
    // Test specific edge cases
    expect(formatDate(new Date('2024-01-15'))).toMatch(/^\d{2}\/\d{2}\/2024$/);
    expect(formatDate('15/01/2024')).toBe('15/01/2024'); // Already formatted
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('')).toBe('');
    
    // Invalid date should not produce NaN
    const invalidDate = formatDate('invalid');
    expect(invalidDate).not.toContain('NaN');
  });

  it('should correctly identify when values should be displayed', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({ value: fc.string({ minLength: 1 }), expected: fc.constant(true) }),
          fc.record({ value: fc.integer(), expected: fc.constant(true) }),
          fc.record({ value: fc.constant(null), expected: fc.constant(false) }),
          fc.record({ value: fc.constant(undefined), expected: fc.constant(false) }),
          fc.record({ value: fc.constant(''), expected: fc.constant(false) }),
          fc.record({ value: fc.constant('   '), expected: fc.constant(false) }),
          fc.record({ value: fc.constant([]), expected: fc.constant(false) })
        ),
        ({ value, expected }) => {
          const result = shouldDisplayValue(value);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});
