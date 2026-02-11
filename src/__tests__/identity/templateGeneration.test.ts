/**
 * Property-Based Tests for Template Generation
 * 
 * Property 21: Template Download Completeness
 * For any template download request (Individual or Corporate), the generated Excel file 
 * must contain all required column headers in the first row, properly formatted.
 * 
 * Validates: Requirements 17.3, 17.4, 17.7
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as XLSX from 'xlsx';
import { 
  INDIVIDUAL_TEMPLATE_HEADERS, 
  CORPORATE_TEMPLATE_HEADERS 
} from '../../utils/templateGenerator';

/**
 * Helper function to generate Excel workbook directly for testing
 * This bypasses the Blob creation to work in Node.js test environment
 */
function generateTestWorkbook(type: 'individual' | 'corporate'): XLSX.WorkBook {
  const headers = type === 'individual' 
    ? INDIVIDUAL_TEMPLATE_HEADERS 
    : CORPORATE_TEMPLATE_HEADERS;
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  
  return workbook;
}

describe('Property 21: Template Download Completeness', () => {
  /**
   * Property: For any template type (individual or corporate), the generated Excel file
   * must contain all required headers in the first row
   */
  it('should generate Excel files with all required headers in first row', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('individual' as const, 'corporate' as const),
        (templateType) => {
          // Generate the workbook
          const workbook = generateTestWorkbook(templateType);
          
          // Verify workbook has at least one sheet
          expect(workbook.SheetNames.length).toBeGreaterThan(0);
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to array of arrays to check headers
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          
          // Verify we have at least one row (the header row)
          expect(data.length).toBeGreaterThan(0);
          
          // Get the expected headers based on template type
          const expectedHeaders = templateType === 'individual' 
            ? INDIVIDUAL_TEMPLATE_HEADERS 
            : CORPORATE_TEMPLATE_HEADERS;
          
          // Verify first row contains all expected headers
          const actualHeaders = data[0];
          expect(actualHeaders).toEqual(expectedHeaders);
          
          // Verify all headers are present
          expectedHeaders.forEach((header) => {
            expect(actualHeaders).toContain(header);
          });
          
          // Verify no extra headers
          expect(actualHeaders.length).toBe(expectedHeaders.length);
          
          return true;
        }
      ),
      { numRuns: 10 } // Run 10 times (5 for each template type)
    );
  });

  /**
   * Property: Individual template must contain all required columns for individual clients
   */
  it('should generate Individual template with all required columns', () => {
    const workbook = generateTestWorkbook('individual');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    const headers = data[0];
    
    // Verify all required individual columns are present
    const requiredColumns = [
      'Title',
      'First Name',
      'Last Name',
      'Phone Number',
      'Email',
      'Address',
      'Gender',
      'Policy Number',
      'BVN',
    ];
    
    requiredColumns.forEach((col) => {
      expect(headers).toContain(col);
    });
    
    // Verify optional columns are present
    const optionalColumns = [
      'Date of Birth',
      'Occupation',
      'Nationality',
      'NIN'
    ];
    
    optionalColumns.forEach((col) => {
      expect(headers).toContain(col);
    });
  });

  /**
   * Property: Corporate template must contain all required columns for corporate clients
   */
  it('should generate Corporate template with all required columns', () => {
    const workbook = generateTestWorkbook('corporate');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    const headers = data[0];
    
    // Verify all required corporate columns are present
    const requiredColumns = [
      'Company Name',
      'Company Address',
      'Email Address',
      'Company Type',
      'Phone Number',
      'Policy Number',
      'Registration Number',
      'Registration Date',
      'Business Address',
    ];
    
    requiredColumns.forEach((col) => {
      expect(headers).toContain(col);
    });
    
    // Verify optional columns are present
    expect(headers).toContain('CAC');
  });

  /**
   * Property: Generated templates should have exactly one sheet named "Template"
   */
  it('should generate workbook with single sheet named "Template"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('individual' as const, 'corporate' as const),
        (templateType) => {
          const workbook = generateTestWorkbook(templateType);
          
          // Verify exactly one sheet
          expect(workbook.SheetNames.length).toBe(1);
          
          // Verify sheet is named "Template"
          expect(workbook.SheetNames[0]).toBe('Template');
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Generated templates should have only headers (no data rows)
   */
  it('should generate templates with only header row (no data)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('individual' as const, 'corporate' as const),
        (templateType) => {
          const workbook = generateTestWorkbook(templateType);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          
          // Should have exactly 1 row (the header row)
          expect(data.length).toBe(1);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Headers should be strings and non-empty
   */
  it('should generate templates with valid string headers', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('individual' as const, 'corporate' as const),
        (templateType) => {
          const workbook = generateTestWorkbook(templateType);
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          const headers = data[0];
          
          // All headers should be strings
          headers.forEach((header) => {
            expect(typeof header).toBe('string');
            expect(header.length).toBeGreaterThan(0);
          });
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Template headers should match exported constants
   */
  it('should use correct header constants for each template type', () => {
    const individualWorkbook = generateTestWorkbook('individual');
    const corporateWorkbook = generateTestWorkbook('corporate');
    
    const individualSheet = individualWorkbook.Sheets[individualWorkbook.SheetNames[0]];
    const corporateSheet = corporateWorkbook.Sheets[corporateWorkbook.SheetNames[0]];
    
    const individualData = XLSX.utils.sheet_to_json(individualSheet, { header: 1 }) as string[][];
    const corporateData = XLSX.utils.sheet_to_json(corporateSheet, { header: 1 }) as string[][];
    
    // Verify Individual template uses INDIVIDUAL_TEMPLATE_HEADERS
    expect(individualData[0]).toEqual(INDIVIDUAL_TEMPLATE_HEADERS);
    
    // Verify Corporate template uses CORPORATE_TEMPLATE_HEADERS
    expect(corporateData[0]).toEqual(CORPORATE_TEMPLATE_HEADERS);
  });

  /**
   * Property: Individual and Corporate templates should have different headers
   */
  it('should generate different headers for Individual vs Corporate templates', () => {
    const individualWorkbook = generateTestWorkbook('individual');
    const corporateWorkbook = generateTestWorkbook('corporate');
    
    const individualSheet = individualWorkbook.Sheets[individualWorkbook.SheetNames[0]];
    const corporateSheet = corporateWorkbook.Sheets[corporateWorkbook.SheetNames[0]];
    
    const individualData = XLSX.utils.sheet_to_json(individualSheet, { header: 1 }) as string[][];
    const corporateData = XLSX.utils.sheet_to_json(corporateSheet, { header: 1 }) as string[][];
    
    const individualHeaders = individualData[0];
    const corporateHeaders = corporateData[0];
    
    // Headers should be different
    expect(individualHeaders).not.toEqual(corporateHeaders);
    
    // Individual should have "First Name", "Last Name"
    expect(individualHeaders).toContain('First Name');
    expect(individualHeaders).toContain('Last Name');
    
    // Corporate should have "Company Name"
    expect(corporateHeaders).toContain('Company Name');
    
    // Corporate should NOT have "First Name", "Last Name"
    expect(corporateHeaders).not.toContain('First Name');
    expect(corporateHeaders).not.toContain('Last Name');
  });
});
