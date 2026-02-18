/**
 * Date Validator Utility (Frontend)
 * 
 * Provides validation and normalization for date values from various sources.
 * Handles Date objects, ISO strings, Firestore Timestamps, numbers, null/undefined.
 */

/**
 * Options for date validation
 */
export interface DateValidatorOptions {
  /** Whether to allow null as a valid result */
  allowNull?: boolean;
  /** Default value to return for invalid dates */
  defaultValue?: Date | string | null;
}

/**
 * Result of date validation
 */
export interface DateValidationResult {
  /** Whether the date is valid */
  isValid: boolean;
  /** Parsed Date object or null */
  date: Date | null;
  /** Error message if invalid */
  error?: string;
}

/**
 * Validates and normalizes a date value from various input types
 * 
 * @param value - The value to validate (Date, string, number, Firestore Timestamp, etc.)
 * @param options - Validation options
 * @returns Validation result with parsed date or null
 */
export function validateDate(
  value: unknown,
  options: DateValidatorOptions = {}
): DateValidationResult {
  const { allowNull = true, defaultValue = null } = options;

  // Handle null/undefined
  if (value === null || value === undefined) {
    return {
      isValid: allowNull,
      date: defaultValue instanceof Date ? defaultValue : null,
      error: allowNull ? undefined : 'Date value is null or undefined'
    };
  }

  // Try to normalize the date
  const normalizedDate = normalizeDate(value);

  if (normalizedDate === null) {
    return {
      isValid: false,
      date: defaultValue instanceof Date ? defaultValue : null,
      error: `Unable to parse date from value: ${typeof value}`
    };
  }

  return {
    isValid: true,
    date: normalizedDate
  };
}

/**
 * Checks if a value is a valid date
 * 
 * @param value - The value to check
 * @returns True if the value is a valid date
 */
export function isValidDate(value: unknown): boolean {
  const normalized = normalizeDate(value);
  return normalized !== null;
}

/**
 * Normalizes a date value to a JavaScript Date object
 * Handles multiple input types and validates the result
 * 
 * @param value - The value to normalize
 * @returns Normalized Date object or null if invalid
 */
export function normalizeDate(value: unknown): Date | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return null;
  }

  let date: Date | null = null;

  // Handle Date objects
  if (value instanceof Date) {
    date = value;
  }
  // Handle Firestore Timestamp objects
  else if (value && typeof value === 'object') {
    // Check if it's an empty object (Firestore returns {} for null/undefined dates)
    if (Object.keys(value).length === 0) {
      return null;
    }
    
    // Check if it has toDate method (Firestore Timestamp)
    if ('toDate' in value && typeof (value as any).toDate === 'function') {
      try {
        date = (value as any).toDate();
      } catch (error) {
        return null;
      }
    } else {
      // Object without toDate method - not a valid date
      return null;
    }
  }
  // Handle ISO strings and other string formats
  else if (typeof value === 'string') {
    // Check for empty or whitespace-only strings
    if (value.trim() === '') {
      return null;
    }
    date = new Date(value);
  }
  // Handle epoch timestamps (numbers)
  else if (typeof value === 'number') {
    // Check for NaN or Infinity
    if (!isFinite(value)) {
      return null;
    }
    date = new Date(value);
  }
  // Handle other types
  else {
    return null;
  }

  // Validate the resulting Date object
  // Check for Invalid Date using isNaN(date.getTime())
  if (!date || isNaN(date.getTime())) {
    return null;
  }

  return date;
}
