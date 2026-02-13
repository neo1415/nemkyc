/**
 * Date Formatter Utility (Frontend)
 * 
 * Provides consistent, validated date formatting across the application.
 * Always validates dates before formatting to prevent "Invalid Date" displays.
 */

import { validateDate } from './dateValidator';

/**
 * Date format style options
 */
export type DateFormatStyle = 'short' | 'medium' | 'long' | 'full';

/**
 * Options for date formatting
 */
export interface DateFormatOptions {
  /** Format style (default: 'medium') */
  style?: DateFormatStyle;
  /** Whether to include time (default: false) */
  includeTime?: boolean;
  /** Locale for formatting (default: 'en-US') */
  locale?: string;
  /** Fallback string for invalid dates (default: 'Date unavailable') */
  fallback?: string;
}

/**
 * Formats a date value with validation
 * 
 * @param value - The value to format (Date, string, number, Firestore Timestamp, etc.)
 * @param options - Formatting options
 * @returns Formatted date string or fallback message
 */
export function formatDate(value: unknown, options: DateFormatOptions = {}): string {
  const {
    style = 'medium',
    includeTime = false,
    locale = 'en-US',
    fallback = 'Date unavailable'
  } = options;

  // Validate the date first
  const validationResult = validateDate(value, { allowNull: false });
  
  if (!validationResult.isValid || !validationResult.date) {
    return fallback;
  }

  const date = validationResult.date;

  try {
    // Configure date format options based on style
    const dateOptions = getDateFormatOptions(style, includeTime);
    
    return date.toLocaleDateString(locale, dateOptions);
  } catch (error) {
    console.error('[DateFormatter] Error formatting date:', error);
    return fallback;
  }
}

/**
 * Formats a date in short format (e.g., "2/20/24")
 * 
 * @param value - The value to format
 * @returns Formatted date string or fallback message
 */
export function formatDateShort(value: unknown): string {
  return formatDate(value, { style: 'short' });
}

/**
 * Formats a date in long format (e.g., "February 20, 2024")
 * 
 * @param value - The value to format
 * @returns Formatted date string or fallback message
 */
export function formatDateLong(value: unknown): string {
  return formatDate(value, { style: 'long' });
}

/**
 * Formats a date with time (e.g., "Feb 20, 2024, 3:45 PM")
 * 
 * @param value - The value to format
 * @returns Formatted date-time string or fallback message
 */
export function formatDateTime(value: unknown): string {
  return formatDate(value, { style: 'medium', includeTime: true });
}

/**
 * Gets Intl.DateTimeFormat options based on style
 * 
 * @param style - Format style
 * @param includeTime - Whether to include time
 * @returns Format options
 */
function getDateFormatOptions(style: DateFormatStyle, includeTime: boolean): Intl.DateTimeFormatOptions {
  const options: Intl.DateTimeFormatOptions = {};

  // Date format based on style
  switch (style) {
    case 'short':
      options.year = '2-digit';
      options.month = 'numeric';
      options.day = 'numeric';
      break;
    case 'medium':
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
      break;
    case 'long':
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      break;
    case 'full':
      options.weekday = 'long';
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      break;
    default:
      options.year = 'numeric';
      options.month = 'short';
      options.day = 'numeric';
  }

  // Add time if requested
  if (includeTime) {
    options.hour = 'numeric';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return options;
}
