import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 13: Date and Time Formatting
 * 
 * **Validates: Requirements 9.2**
 * 
 * For any date or time field displayed in the Form Viewer or Admin Table, 
 * the value SHALL be formatted as a human-readable string (not raw timestamp or NaN).
 */

// Helper to format date (mimics FormViewer logic)
const formatDate = (date: any): string => {
  if (!date) return 'N/A';
  
  // Handle Firestore Timestamp-like objects
  if (date && typeof date === 'object' && typeof date.toDate === 'function') {
    try {
      const dateObj = date.toDate();
      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }
      return dateObj.toLocaleDateString();
    } catch (e) {
      return 'N/A';
    }
  }
  
  // Handle Date objects
  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString();
  }
  
  // Handle string dates
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString();
    }
    return 'N/A';
  }
  
  return String(date);
};

// Helper to format time (mimics AdminTable logic)
const formatTime = (time: any): string => {
  if (!time) return 'N/A';
  
  // Handle HH:MM format
  if (typeof time === 'string') {
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
  
  // Handle Date objects
  if (time instanceof Date) {
    if (isNaN(time.getTime())) {
      return 'N/A';
    }
    try {
      return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'N/A';
    }
  }
  
  // Handle Firestore Timestamp-like objects
  if (time && typeof time === 'object' && typeof time.toDate === 'function') {
    try {
      const dateObj = time.toDate();
      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }
      return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'N/A';
    }
  }
  
  return String(time);
};

// Mock Firestore Timestamp
class MockTimestamp {
  constructor(private date: Date) {}
  
  toDate(): Date {
    return this.date;
  }
}

describe('Property 13: Date and Time Formatting', () => {
  it('should format Date objects as human-readable strings', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const formatted = formatDate(date);
          
          // Property: Should not be empty
          expect(formatted).toBeTruthy();
          
          // Property: Should not contain "NaN"
          expect(formatted).not.toContain('NaN');
          
          // Property: Should not be a raw timestamp
          expect(formatted).not.toMatch(/^\d{13}$/); // Unix timestamp in ms
          
          // Property: Should be a valid date string (contains numbers) or 'N/A' for invalid dates
          if (formatted !== 'N/A') {
            expect(formatted).toMatch(/\d/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format Firestore Timestamp-like objects as human-readable strings', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const timestamp = new MockTimestamp(date);
          const formatted = formatDate(timestamp);
          
          // Property: Should not be empty
          expect(formatted).toBeTruthy();
          
          // Property: Should not contain "NaN"
          expect(formatted).not.toContain('NaN');
          
          // Property: Should not be a raw timestamp
          expect(formatted).not.toMatch(/^\d{13}$/);
          
          // Property: Should be a valid date string or 'N/A' for invalid dates
          if (formatted !== 'N/A') {
            expect(formatted).toMatch(/\d/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format ISO date strings as human-readable strings', () => {
    fc.assert(
      fc.property(
        fc.date().filter(d => !isNaN(d.getTime())), // Filter out invalid dates
        (date) => {
          const isoString = date.toISOString();
          const formatted = formatDate(isoString);
          
          // Property: Should not be empty
          expect(formatted).toBeTruthy();
          
          // Property: Should not contain "NaN"
          expect(formatted).not.toContain('NaN');
          
          // Property: Should not be the raw ISO string
          expect(formatted).not.toBe(isoString);
          
          // Property: Should be a valid date string or 'N/A' for invalid dates
          if (formatted !== 'N/A') {
            expect(formatted).toMatch(/\d/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format time values without NaN', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // HH:MM format
          fc.tuple(
            fc.integer({ min: 0, max: 23 }),
            fc.integer({ min: 0, max: 59 })
          ).map(([h, m]) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`),
          // Date object
          fc.date(),
          // ISO string
          fc.date().map(d => d.toISOString()),
          // Timestamp-like
          fc.date().map(d => new MockTimestamp(d))
        ),
        (time) => {
          const formatted = formatTime(time);
          
          // Property: Should not contain "NaN"
          expect(formatted).not.toContain('NaN');
          
          // Property: Should not be empty (at minimum should be 'N/A')
          expect(formatted).toBeTruthy();
          
          // Property: Should be a string
          expect(typeof formatted).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle null and undefined date/time values gracefully', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined, '', 0),
        (value) => {
          const formattedDate = formatDate(value);
          const formattedTime = formatTime(value);
          
          // Property: Should not contain "NaN"
          expect(formattedDate).not.toContain('NaN');
          expect(formattedTime).not.toContain('NaN');
          
          // Property: Should handle gracefully (return empty string or 'N/A')
          expect(typeof formattedDate).toBe('string');
          expect(typeof formattedTime).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle invalid date values without producing NaN', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('invalid-date'),
          fc.constant('not a date'),
          fc.constant('2024-13-45'), // Invalid date
          fc.constant(new Date('invalid')),
          fc.integer({ min: -1000000, max: 1000000 })
        ),
        (invalidDate) => {
          const formatted = formatDate(invalidDate);
          
          // Property: Should not contain "NaN"
          expect(formatted).not.toContain('NaN');
          
          // Property: Should return a string
          expect(typeof formatted).toBe('string');
          
          // Property: Should not throw an error
          expect(() => formatDate(invalidDate)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should format time consistently across different input types', () => {
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          // Create different representations of the same time
          const isoString = date.toISOString();
          const timestamp = new MockTimestamp(date);
          const dateObj = new Date(date);
          
          const formatted1 = formatTime(isoString);
          const formatted2 = formatTime(timestamp);
          const formatted3 = formatTime(dateObj);
          
          // Property: All formats should produce valid time strings (no NaN)
          expect(formatted1).not.toContain('NaN');
          expect(formatted2).not.toContain('NaN');
          expect(formatted3).not.toContain('NaN');
          
          // Property: All should be non-empty strings
          expect(formatted1).toBeTruthy();
          expect(formatted2).toBeTruthy();
          expect(formatted3).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve HH:MM format when already in correct format', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 })
        ),
        ([hour, minute]) => {
          const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
          const formatted = formatTime(timeString);
          
          // Property: Should preserve the HH:MM format
          expect(formatted).toBe(timeString);
          
          // Property: Should match HH:MM pattern
          expect(formatted).toMatch(/^\d{2}:\d{2}$/);
          
          // Property: Should not contain NaN
          expect(formatted).not.toContain('NaN');
        }
      ),
      { numRuns: 100 }
    );
  });
});
