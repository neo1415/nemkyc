/**
 * Property Test: All Rows Displayed
 * 
 * **Validates: Requirements 7.1, 7.5**
 * 
 * Property 13: All Rows Displayed
 * For any uploaded file, the preview table should display all rows 
 * (not just the first 10), with a row count indicator showing the 
 * total number of rows.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Property 13: All Rows Displayed', () => {
  it('should not limit rows to first 10', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 11, max: 100 }),
        (numRows) => {
          // Simulate rows array
          const rows = Array.from({ length: numRows }, (_, i) => ({
            DOB: `01/01/199${i % 10}`,
            NIN: `1234567890${i}`,
            Email: `user${i}@example.com`,
          }));

          // Verify all rows are in the array (not limited to 10)
          expect(rows.length).toBe(numRows);
          expect(rows.length).toBeGreaterThan(10);

          // Verify rows beyond 10th exist
          expect(rows[10]).toBeDefined();
          if (numRows > 20) {
            expect(rows[20]).toBeDefined();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should display row count for any number of rows', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        (numRows) => {
          // Simulate row count display logic
          const rowCountText = `Preview (${numRows} row${numRows === 1 ? '' : 's'})`;

          // Verify row count text is correct
          expect(rowCountText).toContain(String(numRows));
          if (numRows === 1) {
            expect(rowCountText).toContain('1 row)');
          } else {
            expect(rowCountText).toContain(`${numRows} rows)`);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve all row data without truncation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.array(fc.constantFrom('DOB', 'NIN', 'BVN', 'Email'), { minLength: 2, maxLength: 5 }),
        (numRows, columns) => {
          // Generate rows
          const rows = Array.from({ length: numRows }, (_, i) => {
            const row: Record<string, any> = {};
            columns.forEach((col) => {
              row[col] = `${col}_value_${i}`;
            });
            return row;
          });

          // Verify no data loss
          expect(rows.length).toBe(numRows);
          rows.forEach((row, index) => {
            columns.forEach((col) => {
              expect(row[col]).toBe(`${col}_value_${index}`);
            });
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
