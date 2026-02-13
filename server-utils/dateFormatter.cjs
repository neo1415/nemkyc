/**
 * Date Formatter Utility (Backend)
 * 
 * Provides consistent, validated date formatting across the application.
 * Always validates dates before formatting to prevent "Invalid Date" displays.
 */

const { validateDate } = require('./dateValidator.cjs');

/**
 * @typedef {Object} DateFormatOptions
 * @property {'short'|'medium'|'long'|'full'} [style='medium'] - Format style
 * @property {boolean} [includeTime=false] - Whether to include time
 * @property {string} [locale='en-US'] - Locale for formatting
 * @property {string} [fallback='Date unavailable'] - Fallback string for invalid dates
 */

/**
 * Formats a date value with validation
 * 
 * @param {unknown} value - The value to format (Date, string, number, Firestore Timestamp, etc.)
 * @param {DateFormatOptions} [options={}] - Formatting options
 * @returns {string} Formatted date string or fallback message
 */
function formatDate(value, options = {}) {
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
 * @param {unknown} value - The value to format
 * @returns {string} Formatted date string or fallback message
 */
function formatDateShort(value) {
  return formatDate(value, { style: 'short' });
}

/**
 * Formats a date in long format (e.g., "February 20, 2024")
 * 
 * @param {unknown} value - The value to format
 * @returns {string} Formatted date string or fallback message
 */
function formatDateLong(value) {
  return formatDate(value, { style: 'long' });
}

/**
 * Formats a date with time (e.g., "Feb 20, 2024, 3:45 PM")
 * 
 * @param {unknown} value - The value to format
 * @returns {string} Formatted date-time string or fallback message
 */
function formatDateTime(value) {
  return formatDate(value, { style: 'medium', includeTime: true });
}

/**
 * Gets Intl.DateTimeFormat options based on style
 * 
 * @param {'short'|'medium'|'long'|'full'} style - Format style
 * @param {boolean} includeTime - Whether to include time
 * @returns {Intl.DateTimeFormatOptions} Format options
 */
function getDateFormatOptions(style, includeTime) {
  const options = {};

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

module.exports = {
  formatDate,
  formatDateShort,
  formatDateLong,
  formatDateTime
};
