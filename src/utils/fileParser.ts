/**
 * File Parser Utility
 * 
 * Parses CSV and Excel files while preserving all original columns.
 * Auto-detects email columns by finding the first column containing "email" (case-insensitive).
 * Auto-detects name columns by searching left to right for common name patterns.
 * Auto-detects file type (corporate vs individual) based on column patterns.
 * Supports template mode with structured validation for Individual and Corporate templates.
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { FileParseResult, NameColumns, FileType, TemplateValidationResult } from '../types/remediation';

// ========== Template Schemas ==========

/**
 * Individual Client Template Schema
 * Requirements: 15.1, 15.2, 18.1, 18.2, 18.3, 18.4
 */
export interface IndividualTemplateSchema {
  required: string[];
  optional: string[];
}

export const INDIVIDUAL_TEMPLATE: IndividualTemplateSchema = {
  required: [
    'policy number',    // Required for IES integration (Requirement 18.1) - FIRST COLUMN
    'title',
    'first name',
    'last name',
    'phone number',
    'email',
    'address',
    'gender',
    'bvn'              // Required for validation with NIN (Requirement 18.2)
  ],
  optional: [
    'date of birth',
    'occupation',
    'nationality',
    'nin'              // Optional - pre-filled if broker already has it (Requirement 18.3)
  ]
};

/**
 * Corporate Client Template Schema
 * Requirements: 15.3, 18.5, 18.6, 18.7, 18.8, 18.9
 */
export interface CorporateTemplateSchema {
  required: string[];
  optional: string[];
}

export const CORPORATE_TEMPLATE: CorporateTemplateSchema = {
  required: [
    'policy number',           // Required for IES integration (Requirement 18.5) - FIRST COLUMN
    'company name',
    'company address',
    'email address',
    'company type',
    'phone number',
    'registration number',     // Required for corporate verification (Requirement 18.6)
    'registration date',       // Required for corporate verification (Requirement 18.7)
    'business address'         // Required for corporate verification (Requirement 18.8)
  ],
  optional: [
    'cac'                      // Optional - pre-filled if broker already has it (Requirement 18.9)
  ]
};

// ========== Template Validation Functions ==========

/**
 * Normalize column name for comparison
 * Removes spaces, underscores, hyphens and converts to lowercase
 */
function normalizeColumnName(columnName: string): string {
  return columnName.toLowerCase().replace(/[_\s-]/g, '');
}

/**
 * Check if a column name matches a template field name
 * Handles variations like "First Name", "first_name", "firstName", etc.
 */
function columnMatchesField(columnName: string, fieldName: string): boolean {
  const normalizedColumn = normalizeColumnName(columnName);
  const normalizedField = normalizeColumnName(fieldName);
  return normalizedColumn === normalizedField;
}

/**
 * Find a matching column for a template field
 * Returns the actual column name from the file if found
 */
function findMatchingColumn(columns: string[], fieldName: string): string | null {
  for (const column of columns) {
    if (columnMatchesField(column, fieldName)) {
      return column;
    }
  }
  return null;
}

/**
 * Validate if file matches Individual template
 * Requirements: 15.5, 15.8, 15.9
 * 
 * @param columns - Column names from the uploaded file
 * @returns Validation result with missing columns if invalid
 */
export function validateIndividualTemplate(columns: string[]): TemplateValidationResult {
  const missingColumns: string[] = [];
  const errors: string[] = [];
  
  // Check each required field
  for (const requiredField of INDIVIDUAL_TEMPLATE.required) {
    const matchingColumn = findMatchingColumn(columns, requiredField);
    if (!matchingColumn) {
      missingColumns.push(requiredField);
    }
  }
  
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    return {
      valid: false,
      detectedType: 'individual',
      missingColumns,
      errors
    };
  }
  
  return {
    valid: true,
    detectedType: 'individual',
    missingColumns: [],
    errors: []
  };
}

/**
 * Validate if file matches Corporate template
 * Requirements: 15.6, 15.8, 15.9
 * 
 * @param columns - Column names from the uploaded file
 * @returns Validation result with missing columns if invalid
 */
export function validateCorporateTemplate(columns: string[]): TemplateValidationResult {
  const missingColumns: string[] = [];
  const errors: string[] = [];
  
  // Check each required field
  for (const requiredField of CORPORATE_TEMPLATE.required) {
    const matchingColumn = findMatchingColumn(columns, requiredField);
    if (!matchingColumn) {
      missingColumns.push(requiredField);
    }
  }
  
  if (missingColumns.length > 0) {
    errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    return {
      valid: false,
      detectedType: 'corporate',
      missingColumns,
      errors
    };
  }
  
  return {
    valid: true,
    detectedType: 'corporate',
    missingColumns: [],
    errors: []
  };
}

/**
 * Detect which template the file matches (if any)
 * Requirements: 15.5, 15.6, 15.7
 * 
 * Checks if the file has columns matching Individual or Corporate template.
 * Returns the detected type and validation result.
 * 
 * @param columns - Column names from the uploaded file
 * @returns Template validation result with detected type
 */
export function detectTemplateType(columns: string[]): TemplateValidationResult {
  // First, check if it looks like an Individual template
  // by checking for key individual indicators
  const hasFirstName = findMatchingColumn(columns, 'first name') !== null;
  const hasLastName = findMatchingColumn(columns, 'last name') !== null;
  const hasGender = findMatchingColumn(columns, 'gender') !== null;
  
  // Check if it looks like a Corporate template
  const hasCompanyName = findMatchingColumn(columns, 'company name') !== null;
  const hasCompanyType = findMatchingColumn(columns, 'company type') !== null;
  
  // Determine which template to validate against
  if ((hasFirstName || hasLastName || hasGender) && !hasCompanyName) {
    // Looks like Individual template
    return validateIndividualTemplate(columns);
  } else if (hasCompanyName || hasCompanyType) {
    // Looks like Corporate template
    return validateCorporateTemplate(columns);
  }
  
  // Ambiguous - try both and return the one with fewer missing columns
  const individualResult = validateIndividualTemplate(columns);
  const corporateResult = validateCorporateTemplate(columns);
  
  if (individualResult.valid) {
    return individualResult;
  }
  
  if (corporateResult.valid) {
    return corporateResult;
  }
  
  // Neither is valid - return the one with fewer missing columns
  if (individualResult.missingColumns.length <= corporateResult.missingColumns.length) {
    return individualResult;
  } else {
    return corporateResult;
  }
}

/**
 * Validate file against template requirements
 * Requirements: 15.5, 15.6, 15.7, 15.8, 15.9
 * 
 * This is the main validation function that should be called when in template mode.
 * It detects the template type and validates required columns.
 * 
 * @param columns - Column names from the uploaded file
 * @returns Validation result with detected type and any errors
 */
export function validateTemplate(columns: string[]): TemplateValidationResult {
  return detectTemplateType(columns);
}

/**
 * Parse a CSV file and return all columns and rows
 */
export function parseCSV(file: File): Promise<FileParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          // Filter out minor errors, only reject on critical ones
          const criticalErrors = results.errors.filter(e => e.type === 'Quotes' || e.type === 'FieldMismatch');
          if (criticalErrors.length > 0) {
            reject(new Error(`CSV parsing error: ${criticalErrors[0].message}`));
            return;
          }
        }

        const columns = results.meta.fields || [];
        const rows = results.data as Record<string, any>[];
        const detectedEmailColumn = detectEmailColumn(columns);
        const detectedFileType = detectFileType(columns);
        const detectedNameColumns = detectNameColumns(columns, detectedFileType);
        const detectedPolicyColumn = detectPolicyColumn(columns);
        const detectedBVNColumn = detectBVNColumn(columns);
        const detectedRegistrationNumberColumn = detectRegistrationNumberColumn(columns);
        const detectedRegistrationDateColumn = detectRegistrationDateColumn(columns);
        const detectedBusinessAddressColumn = detectBusinessAddressColumn(columns);

        resolve({
          columns,
          rows,
          detectedEmailColumn,
          detectedNameColumns,
          detectedPolicyColumn,
          detectedBVNColumn,
          detectedRegistrationNumberColumn,
          detectedRegistrationDateColumn,
          detectedBusinessAddressColumn,
          detectedFileType,
          totalRows: rows.length
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

/**
 * Parse an Excel file and return all columns and rows
 */
export function parseExcel(file: File): Promise<FileParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          reject(new Error('Excel file contains no sheets'));
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '' // Default value for empty cells
        });

        if (jsonData.length === 0) {
          reject(new Error('Excel file contains no data'));
          return;
        }

        // Extract columns from the first row's keys
        const columns = Object.keys(jsonData[0]);
        const detectedEmailColumn = detectEmailColumn(columns);
        const detectedFileType = detectFileType(columns);
        const detectedNameColumns = detectNameColumns(columns, detectedFileType);
        const detectedPolicyColumn = detectPolicyColumn(columns);
        const detectedBVNColumn = detectBVNColumn(columns);
        const detectedRegistrationNumberColumn = detectRegistrationNumberColumn(columns);
        const detectedRegistrationDateColumn = detectRegistrationDateColumn(columns);
        const detectedBusinessAddressColumn = detectBusinessAddressColumn(columns);

        resolve({
          columns,
          rows: jsonData,
          detectedEmailColumn,
          detectedNameColumns,
          detectedPolicyColumn,
          detectedBVNColumn,
          detectedRegistrationNumberColumn,
          detectedRegistrationDateColumn,
          detectedBusinessAddressColumn,
          detectedFileType,
          totalRows: jsonData.length
        });
      } catch (error) {
        reject(new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Auto-detect the email column by finding the first column containing "email" (case-insensitive)
 * Searches from left to right (first column to last)
 */
export function detectEmailColumn(columns: string[]): string | null {
  // First pass: look for exact "email" match (case-insensitive)
  for (const column of columns) {
    if (column.toLowerCase() === 'email') {
      return column;
    }
  }

  // Second pass: look for columns containing "email" (case-insensitive)
  // Prioritize columns that start with "email" or end with "email"
  for (const column of columns) {
    const lowerColumn = column.toLowerCase();
    if (lowerColumn.startsWith('email') || lowerColumn.endsWith('email')) {
      return column;
    }
  }

  // Third pass: any column containing "email"
  for (const column of columns) {
    if (column.toLowerCase().includes('email')) {
      return column;
    }
  }

  // No email column found
  return null;
}

/**
 * Auto-detect file type (corporate vs individual) based on column patterns
 * 
 * Corporate indicators:
 * - "director" (director 1, director name, etc.)
 * - "company" (company name, company)
 * - "rc number", "cac", "registration"
 * - Absence of firstName/lastName columns
 * 
 * Individual indicators:
 * - "first name", "last name", "surname"
 * - "middle name", "other name"
 * - Personal identifiers without corporate markers
 */
export function detectFileType(columns: string[]): FileType {
  let corporateScore = 0;
  let individualScore = 0;
  
  for (const column of columns) {
    const lowerColumn = column.toLowerCase().replace(/[_\s-]/g, '');
    
    // Corporate indicators
    if (lowerColumn.includes('director')) {
      corporateScore += 3; // Strong indicator
    }
    if (lowerColumn.includes('company') && lowerColumn.includes('name')) {
      corporateScore += 3;
    }
    if (lowerColumn === 'company' || lowerColumn === 'companyname') {
      corporateScore += 3;
    }
    if (lowerColumn.includes('rcnumber') || lowerColumn.includes('rc') && lowerColumn.includes('number')) {
      corporateScore += 2;
    }
    if (lowerColumn.includes('cac') && !lowerColumn.includes('cacnumber')) {
      corporateScore += 2;
    }
    if (lowerColumn.includes('registration') && lowerColumn.includes('number')) {
      corporateScore += 2;
    }
    if (lowerColumn.includes('corporate') || lowerColumn.includes('business')) {
      corporateScore += 1;
    }
    
    // Individual indicators
    if (lowerColumn === 'firstname' || lowerColumn === 'first' || 
        (lowerColumn.includes('first') && lowerColumn.includes('name'))) {
      individualScore += 3;
    }
    if (lowerColumn === 'lastname' || lowerColumn === 'surname' || lowerColumn === 'last' ||
        (lowerColumn.includes('last') && lowerColumn.includes('name'))) {
      individualScore += 3;
    }
    if (lowerColumn === 'middlename' || lowerColumn === 'middle' || 
        lowerColumn === 'othername' || lowerColumn === 'othernames') {
      individualScore += 2;
    }
    if (lowerColumn === 'nin' || lowerColumn.includes('nationalid')) {
      individualScore += 1;
    }
  }
  
  // Determine file type based on scores
  if (corporateScore > individualScore && corporateScore >= 2) {
    return 'corporate';
  } else if (individualScore > corporateScore && individualScore >= 2) {
    return 'individual';
  }
  
  return 'unknown';
}

/**
 * Auto-detect name columns by searching left to right for common name patterns
 * Detects: firstName, lastName, middleName, insured, fullName, name, companyName
 * Behavior changes based on detected file type (corporate vs individual)
 * 
 * Requirements: 1.5, 1.6
 */
export function detectNameColumns(columns: string[], fileType: FileType = 'unknown'): NameColumns {
  const nameColumns: NameColumns = {};
  
  // For corporate files, prioritize company name detection
  if (fileType === 'corporate') {
    for (const column of columns) {
      const lowerColumn = column.toLowerCase().replace(/[_\s-]/g, '');
      
      // Check for company name
      if (!nameColumns.companyName) {
        if (lowerColumn === 'companyname' || 
            lowerColumn === 'company' ||
            (lowerColumn.includes('company') && lowerColumn.includes('name'))) {
          nameColumns.companyName = column;
          continue;
        }
        // Also check for "insured" in corporate context - it's likely the company name
        if (lowerColumn === 'insured' || lowerColumn === 'insuredname') {
          nameColumns.companyName = column;
          continue;
        }
      }
    }
    
    // If we found a company name, return early for corporate files
    if (nameColumns.companyName) {
      return nameColumns;
    }
  }
  
  // Search for each name type from left to right (for individual files or fallback)
  for (const column of columns) {
    const lowerColumn = column.toLowerCase().replace(/[_\s-]/g, '');
    
    // Check for firstName (first + name)
    if (!nameColumns.firstName) {
      if (lowerColumn === 'firstname' || 
          lowerColumn === 'first' ||
          (lowerColumn.includes('first') && lowerColumn.includes('name'))) {
        nameColumns.firstName = column;
        continue;
      }
    }
    
    // Check for lastName (last + name)
    if (!nameColumns.lastName) {
      if (lowerColumn === 'lastname' || 
          lowerColumn === 'surname' ||
          lowerColumn === 'last' ||
          (lowerColumn.includes('last') && lowerColumn.includes('name'))) {
        nameColumns.lastName = column;
        continue;
      }
    }
    
    // Check for middleName (middle + name)
    if (!nameColumns.middleName) {
      if (lowerColumn === 'middlename' || 
          lowerColumn === 'middle' ||
          lowerColumn === 'othername' ||
          lowerColumn === 'othernames' ||
          (lowerColumn.includes('middle') && lowerColumn.includes('name'))) {
        nameColumns.middleName = column;
        continue;
      }
    }
    
    // Check for insured
    if (!nameColumns.insured) {
      if (lowerColumn === 'insured' || 
          lowerColumn === 'insuredname' ||
          lowerColumn.includes('insured')) {
        nameColumns.insured = column;
        continue;
      }
    }
    
    // Check for fullName (full + name)
    if (!nameColumns.fullName) {
      if (lowerColumn === 'fullname' || 
          (lowerColumn.includes('full') && lowerColumn.includes('name'))) {
        nameColumns.fullName = column;
        continue;
      }
    }
    
    // Check for generic "name" column (only if no other name columns found yet)
    // This is a fallback - only use if it's exactly "name" or "customer name"
    if (!nameColumns.fullName && !nameColumns.firstName && !nameColumns.insured) {
      if (lowerColumn === 'name' || 
          lowerColumn === 'customername' ||
          lowerColumn === 'customer') {
        nameColumns.fullName = column;
        continue;
      }
    }
  }
  
  return nameColumns;
}

/**
 * Auto-detect policy number column by searching for columns containing "policy"
 * Searches from left to right
 */
export function detectPolicyColumn(columns: string[]): string | null {
  // First pass: look for exact matches
  for (const column of columns) {
    const lowerColumn = column.toLowerCase().replace(/[_\s-]/g, '');
    if (lowerColumn === 'policynumber' || 
        lowerColumn === 'policyno' || 
        lowerColumn === 'policy') {
      return column;
    }
  }
  
  // Second pass: any column containing "policy"
  for (const column of columns) {
    if (column.toLowerCase().includes('policy')) {
      return column;
    }
  }
  
  return null;
}

/**
 * Auto-detect BVN column by searching for columns containing "bvn"
 * Searches from left to right
 * Requirements: 18.10, 18.11
 */
export function detectBVNColumn(columns: string[]): string | null {
  // First pass: look for exact matches
  for (const column of columns) {
    const lowerColumn = column.toLowerCase().replace(/[_\s-]/g, '');
    if (lowerColumn === 'bvn' || 
        lowerColumn === 'bvnumber' || 
        lowerColumn === 'bankverificationnumber') {
      return column;
    }
  }
  
  // Second pass: any column containing "bvn"
  for (const column of columns) {
    if (column.toLowerCase().includes('bvn')) {
      return column;
    }
  }
  
  return null;
}

/**
 * Auto-detect registration number column for corporate entities
 * Searches for RC number, registration number, CAC number patterns
 * Requirements: 18.10, 18.11
 */
export function detectRegistrationNumberColumn(columns: string[]): string | null {
  // First pass: look for exact matches
  for (const column of columns) {
    const lowerColumn = column.toLowerCase().replace(/[_\s-]/g, '');
    if (lowerColumn === 'registrationnumber' || 
        lowerColumn === 'rcnumber' || 
        lowerColumn === 'rc' ||
        lowerColumn === 'cacnumber' ||
        lowerColumn === 'regno') {
      return column;
    }
  }
  
  // Second pass: columns containing registration or rc
  for (const column of columns) {
    const lowerColumn = column.toLowerCase();
    if ((lowerColumn.includes('registration') && lowerColumn.includes('number')) ||
        (lowerColumn.includes('rc') && lowerColumn.includes('number'))) {
      return column;
    }
  }
  
  return null;
}

/**
 * Auto-detect registration date column for corporate entities
 * Searches for registration date, incorporation date patterns
 * Requirements: 18.10, 18.11
 */
export function detectRegistrationDateColumn(columns: string[]): string | null {
  // First pass: look for exact matches
  for (const column of columns) {
    const lowerColumn = column.toLowerCase().replace(/[_\s-]/g, '');
    if (lowerColumn === 'registrationdate' || 
        lowerColumn === 'dateofregistration' ||
        lowerColumn === 'incorporationdate' ||
        lowerColumn === 'dateofincorporation') {
      return column;
    }
  }
  
  // Second pass: columns containing registration/incorporation and date
  for (const column of columns) {
    const lowerColumn = column.toLowerCase();
    if ((lowerColumn.includes('registration') && lowerColumn.includes('date')) ||
        (lowerColumn.includes('incorporation') && lowerColumn.includes('date'))) {
      return column;
    }
  }
  
  return null;
}

/**
 * Auto-detect business address column for corporate entities
 * Searches for business address, company address patterns
 * Requirements: 18.10, 18.11
 */
export function detectBusinessAddressColumn(columns: string[]): string | null {
  // First pass: look for exact matches
  for (const column of columns) {
    const lowerColumn = column.toLowerCase().replace(/[_\s-]/g, '');
    if (lowerColumn === 'businessaddress' || 
        lowerColumn === 'companyaddress' ||
        lowerColumn === 'officeaddress' ||
        lowerColumn === 'registeredaddress') {
      return column;
    }
  }
  
  // Second pass: columns containing business/company and address
  for (const column of columns) {
    const lowerColumn = column.toLowerCase();
    if ((lowerColumn.includes('business') && lowerColumn.includes('address')) ||
        (lowerColumn.includes('company') && lowerColumn.includes('address')) ||
        (lowerColumn.includes('office') && lowerColumn.includes('address'))) {
      return column;
    }
  }
  
  return null;
}

/**
 * Helper to check if a value is effectively empty (N/A, blank, etc.)
 */
export function isEmptyValue(val: any): boolean {
  if (!val) return true;
  const str = String(val).trim().toLowerCase();
  return str === '' || str === 'n/a' || str === 'na' || str === '-' || str === 'nil' || str === 'none';
}

/**
 * Helper to get clean value (returns null if empty)
 */
export function getCleanValue(val: any): string | null {
  if (isEmptyValue(val)) return null;
  return String(val).trim();
}

/**
 * Build a display name from detected name columns and entry data
 * Combines firstName + middleName + lastName, or uses fullName/insured
 * Handles N/A and empty values properly
 */
export function buildDisplayName(entry: Record<string, any>, nameColumns: NameColumns): string | undefined {
  // If we have firstName/lastName, combine them
  if (nameColumns.firstName || nameColumns.lastName) {
    const parts: string[] = [];
    
    if (nameColumns.firstName) {
      const val = getCleanValue(entry[nameColumns.firstName]);
      if (val) parts.push(val);
    }
    if (nameColumns.middleName) {
      const val = getCleanValue(entry[nameColumns.middleName]);
      if (val) parts.push(val); // Only add if not N/A or empty
    }
    if (nameColumns.lastName) {
      const val = getCleanValue(entry[nameColumns.lastName]);
      if (val) parts.push(val);
    }
    
    if (parts.length > 0) {
      return parts.join(' ');
    }
  }
  
  // Try fullName
  if (nameColumns.fullName) {
    const val = getCleanValue(entry[nameColumns.fullName]);
    if (val) return val;
  }
  
  // Try insured
  if (nameColumns.insured) {
    const val = getCleanValue(entry[nameColumns.insured]);
    if (val) return val;
  }
  
  // Try companyName (for corporate entries)
  if (nameColumns.companyName) {
    const val = getCleanValue(entry[nameColumns.companyName]);
    if (val) return val;
  }
  
  return undefined;
}

/**
 * Parse a file based on its extension
 */
export async function parseFile(file: File): Promise<FileParseResult> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    return parseCSV(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV or Excel (.xlsx) file.');
  }
}

/**
 * Validate that a file is a supported format
 */
export function isValidFileType(file: File): boolean {
  const fileName = file.name.toLowerCase();
  return fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if file size is within limit (default 10MB)
 */
export function isFileSizeValid(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Extract email from an entry using the specified email column
 */
export function extractEmail(entry: Record<string, any>, emailColumn: string): string {
  const email = entry[emailColumn];
  return typeof email === 'string' ? email.trim() : '';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get a display name from entry data (tries common name columns)
 */
export function extractDisplayName(entry: Record<string, any>): string | undefined {
  const nameColumns = ['name', 'Name', 'NAME', 'full_name', 'Full Name', 'fullName', 
                       'customer_name', 'Customer Name', 'customerName',
                       'first_name', 'First Name', 'firstName'];
  
  for (const col of nameColumns) {
    if (entry[col] && typeof entry[col] === 'string' && entry[col].trim()) {
      return entry[col].trim();
    }
  }
  
  return undefined;
}

/**
 * Get a policy number from entry data (tries common policy columns)
 */
export function extractPolicyNumber(entry: Record<string, any>): string | undefined {
  const policyColumns = ['policy', 'Policy', 'POLICY', 'policy_number', 'Policy Number', 
                         'policyNumber', 'policy_no', 'Policy No', 'policyNo'];
  
  for (const col of policyColumns) {
    if (entry[col] && typeof entry[col] === 'string' && entry[col].trim()) {
      return entry[col].trim();
    }
  }
  
  return undefined;
}

/**
 * Extract BVN from entry data using detected column
 * Requirements: 18.10, 18.11
 */
export function extractBVN(entry: Record<string, any>, bvnColumn: string | null): string | undefined {
  if (!bvnColumn) return undefined;
  const value = getCleanValue(entry[bvnColumn]);
  return value || undefined;
}

/**
 * Extract registration number from entry data using detected column
 * Requirements: 18.10, 18.11
 */
export function extractRegistrationNumber(entry: Record<string, any>, regNumberColumn: string | null): string | undefined {
  if (!regNumberColumn) return undefined;
  const value = getCleanValue(entry[regNumberColumn]);
  return value || undefined;
}

/**
 * Extract registration date from entry data using detected column
 * Requirements: 18.10, 18.11
 */
export function extractRegistrationDate(entry: Record<string, any>, regDateColumn: string | null): string | undefined {
  if (!regDateColumn) return undefined;
  const value = getCleanValue(entry[regDateColumn]);
  return value || undefined;
}

/**
 * Extract business address from entry data using detected column
 * Requirements: 18.10, 18.11
 */
export function extractBusinessAddress(entry: Record<string, any>, businessAddressColumn: string | null): string | undefined {
  if (!businessAddressColumn) return undefined;
  const value = getCleanValue(entry[businessAddressColumn]);
  return value || undefined;
}
