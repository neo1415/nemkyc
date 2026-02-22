/**
 * Data Normalization Utilities
 * 
 * This module provides functions to normalize data from API responses
 * before populating form fields. Each normalizer handles a specific data type
 * and ensures consistent formatting across different API providers.
 */

/**
 * Normalizes gender values to capitalized "Male" or "Female"
 * 
 * Handles variations: M/Male/MALE → Male, F/Female/FEMALE → Female
 * Returns empty string for invalid values
 * 
 * @param value - Raw gender value from API
 * @returns Normalized gender value ("Male", "Female", or "")
 */
export function normalizeGender(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toLowerCase();

  // Male variations
  if (normalized === 'm' || normalized === 'male') {
    return 'Male';
  }

  // Female variations
  if (normalized === 'f' || normalized === 'female') {
    return 'Female';
  }

  // Invalid value
  return '';
}

/**
 * Normalizes date values to ISO 8601 format (YYYY-MM-DD)
 * 
 * Parses multiple formats:
 * - DD/MM/YYYY
 * - DD-MMM-YYYY (e.g., 15-Jan-1990)
 * - YYYY-MM-DD (already normalized)
 * 
 * Returns empty string for invalid dates
 * 
 * @param value - Raw date value from API
 * @returns Normalized date in YYYY-MM-DD format or ""
 */
export function normalizeDate(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();

  // Try parsing DD/MM/YYYY format
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValidDate(date)) {
      return formatDateToISO(date);
    }
  }

  // Try parsing DD-MM-YYYY format (with dashes and numeric month)
  const ddmmyyyyDashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyyyDashMatch) {
    const [, day, month, year] = ddmmyyyyDashMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValidDate(date)) {
      return formatDateToISO(date);
    }
  }

  // Try parsing DD-MMM-YYYY format (e.g., 15-Jan-1990)
  const ddmmmyyyyMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (ddmmmyyyyMatch) {
    const [, day, monthStr, year] = ddmmmyyyyMatch;
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const month = monthMap[monthStr.toLowerCase()];
    if (month !== undefined) {
      const date = new Date(parseInt(year), month, parseInt(day));
      if (isValidDate(date)) {
        return formatDateToISO(date);
      }
    }
  }

  // Try parsing YYYY-MM-DD format (already normalized)
  const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (isValidDate(date)) {
      return formatDateToISO(date);
    }
  }

  // Invalid date format
  return '';
}

/**
 * Helper function to check if a Date object is valid
 */
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Helper function to format Date to ISO 8601 (YYYY-MM-DD)
 */
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes phone numbers to Nigerian 11-digit format
 * 
 * Handles:
 * - +234 prefix conversion to 0
 * - Removes non-digit characters
 * - Validates 11-digit format
 * 
 * Returns empty string for invalid phone numbers
 * 
 * @param value - Raw phone number from API
 * @returns Normalized 11-digit phone number or ""
 */
export function normalizePhone(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  let digits = value.replace(/\D/g, '');

  // Handle +234 prefix (country code for Nigeria)
  if (digits.startsWith('234') && digits.length === 13) {
    digits = '0' + digits.substring(3);
  }

  // Validate 11-digit Nigerian format
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits;
  }

  // Invalid phone number
  return '';
}

/**
 * Normalizes text fields by trimming whitespace and removing extra spaces
 * 
 * Applies:
 * - Trim leading/trailing whitespace
 * - Replace multiple consecutive spaces with single space
 * - Preserve original casing
 * 
 * @param value - Raw text value from API
 * @returns Normalized text
 */
export function normalizeString(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Trim and replace multiple spaces with single space
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Normalizes company names by standardizing suffixes
 * 
 * Standardizes:
 * - Ltd → Limited
 * - PLC → Public Limited Company
 * - Applies string normalization (trim, extra spaces)
 * 
 * @param value - Raw company name from API
 * @returns Normalized company name
 */
export function normalizeCompanyName(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  let normalized = normalizeString(value);

  // Standardize Ltd to Limited
  normalized = normalized.replace(/\bLtd\.?$/i, 'Limited');

  // Standardize PLC to Public Limited Company
  normalized = normalized.replace(/\bPLC$/i, 'Public Limited Company');

  return normalized;
}

/**
 * Normalizes RC (Registration Certificate) numbers by removing RC prefix
 * 
 * Removes "RC" prefix if present and normalizes the number
 * 
 * @param value - Raw RC number from API
 * @returns Normalized RC number without prefix
 */
export function normalizeRCNumber(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  let normalized = normalizeString(value);

  // Remove RC prefix (case-insensitive)
  normalized = normalized.replace(/^RC\s*/i, '');

  return normalized;
}
