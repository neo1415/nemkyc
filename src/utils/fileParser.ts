/**
 * File Parser Utility
 * 
 * Parses CSV and Excel files while preserving all original columns.
 * Auto-detects email columns by finding the first column containing "email" (case-insensitive).
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { FileParseResult } from '../types/remediation';

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

        resolve({
          columns,
          rows,
          detectedEmailColumn,
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

        resolve({
          columns,
          rows: jsonData,
          detectedEmailColumn,
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
