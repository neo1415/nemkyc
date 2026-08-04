/**
 * Identity Upload Validation Engine (Server-Side)
 * 
 * Validates Date of Birth (DOB), National Identification Number (NIN), and 
 * Bank Verification Number (BVN) fields in uploaded identity data.
 * 
 * This is a server-side mirror of the client-side validation for security.
 * 
 * Validation Rules:
 * - DOB: Year must be 4 digits between 1900 and current year, age must be >= 18
 * - NIN: Exactly 11 digits, no letters or special characters
 * - BVN: Exactly 11 digits, no letters or special characters
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 7.1, 7.2
 */

const { excelSerialToDate } = require('./dateFormatter.cjs');

// ========== Error Type Constants ==========

const ERROR_TYPES = {
  DOB_INVALID_YEAR: 'DOB_INVALID_YEAR',
  DOB_UNDER_AGE: 'DOB_UNDER_AGE',
  NIN_INVALID: 'NIN_INVALID',
  BVN_INVALID: 'BVN_INVALID',
};

// ========== Helper Functions ==========

/**
 * Extract year from various date formats
 * Supports: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, Excel serial numbers, Date objects
 * 
 * Requirements: 1.1, 1.6
 * 
 * @param {*} value - Date value in any supported format
 * @returns {number|null} 4-digit year or null if invalid
 */
function extractYear(value) {
  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Handle Excel serial numbers
  if (typeof value === 'number' && value > 1000 && value < 100000) {
    try {
      const dateStr = excelSerialToDate(value);
      // dateStr is in DD/MM/YYYY format
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const year = parseInt(parts[2]);
        if (year >= 1000 && year <= 9999) {
          return year;
        }
      }
    } catch (err) {
      return null;
    }
  }

  // Handle string dates
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Try parsing various formats
    const datePatterns = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // DD/MM/YYYY or MM/DD/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,    // YYYY-MM-DD
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,  // YYYY/MM/DD
    ];

    for (const pattern of datePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        // Extract year (last group for DD/MM/YYYY, first group for YYYY-MM-DD)
        const year = pattern.source.startsWith('^(\\d{4})')
          ? parseInt(match[1])
          : parseInt(match[3]);

        // Validate it's a 4-digit year
        if (year >= 1000 && year <= 9999) {
          return year;
        }
      }
    }
  }

  // Handle Date objects
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.getFullYear();
  }

  return null;
}

/**
 * Validate Date of Birth
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 * 
 * @param {*} value - DOB value to validate
 * @param {number} rowIndex - 0-based row index
 * @param {string} column - Column name
 * @param {number} [currentYear] - Current year (for testing)
 * @returns {Object|null} ValidationError or null if valid
 */
function validateDOB(value, rowIndex, column, currentYear = new Date().getFullYear()) {
  // Extract year from value
  const year = extractYear(value);

  // Check if year is valid and in range
  if (!year || year < 1900 || year > currentYear) {
    return {
      rowIndex,
      rowNumber: rowIndex + 2, // +1 for 0-based, +1 for header row
      column,
      value,
      errorType: ERROR_TYPES.DOB_INVALID_YEAR,
      message: `Invalid DOB - Year must be 4 digits between 1900-${currentYear}`,
    };
  }

  // Calculate age
  const age = currentYear - year;

  // Check minimum age requirement
  if (age < 18) {
    return {
      rowIndex,
      rowNumber: rowIndex + 2,
      column,
      value,
      errorType: ERROR_TYPES.DOB_UNDER_AGE,
      message: 'DOB indicates age under 18',
    };
  }

  return null;
}

/**
 * Validate 11-digit identifier (NIN or BVN)
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4
 * 
 * @param {*} value - Identifier value to validate
 * @param {number} rowIndex - 0-based row index
 * @param {string} column - Column name
 * @param {'NIN'|'BVN'} identifierType - Type of identifier
 * @returns {Object|null} ValidationError or null if valid
 */
function validate11DigitIdentifier(value, rowIndex, column, identifierType) {
  // Handle null/undefined/empty (optional fields)
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Convert to string and trim whitespace
  const trimmed = String(value).trim();

  // Validate format: exactly 11 digits
  if (!/^\d{11}$/.test(trimmed)) {
    return {
      rowIndex,
      rowNumber: rowIndex + 2,
      column,
      value,
      errorType: identifierType === 'NIN' ? ERROR_TYPES.NIN_INVALID : ERROR_TYPES.BVN_INVALID,
      message: `${identifierType} must be exactly 11 digits`,
    };
  }

  return null;
}

/**
 * Validate National Identification Number (NIN)
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * 
 * @param {*} value - NIN value to validate
 * @param {number} rowIndex - 0-based row index
 * @param {string} column - Column name
 * @returns {Object|null} ValidationError or null if valid
 */
function validateNIN(value, rowIndex, column) {
  return validate11DigitIdentifier(value, rowIndex, column, 'NIN');
}

/**
 * Validate Bank Verification Number (BVN)
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 * 
 * @param {*} value - BVN value to validate
 * @param {number} rowIndex - 0-based row index
 * @param {string} column - Column name
 * @returns {Object|null} ValidationError or null if valid
 */
function validateBVN(value, rowIndex, column) {
  return validate11DigitIdentifier(value, rowIndex, column, 'BVN');
}

// ========== Column Detection Functions ==========

/**
 * Normalize column name for comparison
 * 
 * @param {string} columnName - Column name to normalize
 * @returns {string} Normalized column name
 */
function normalizeColumnName(columnName) {
  return columnName.toLowerCase().replace(/[_\s-]/g, '');
}

/**
 * Find DOB column from column names
 * 
 * Requirements: 1.1
 * 
 * @param {string[]} columns - Array of column names
 * @returns {string|null} DOB column name or null
 */
function findDOBColumn(columns) {
  for (const column of columns) {
    const normalized = normalizeColumnName(column);
    if (
      normalized === 'dateofbirth' ||
      normalized === 'dob' ||
      normalized === 'birthdate' ||
      normalized === 'birthday'
    ) {
      return column;
    }
  }
  return null;
}

/**
 * Find NIN column from column names
 * 
 * Requirements: 2.1
 * 
 * @param {string[]} columns - Array of column names
 * @returns {string|null} NIN column name or null
 */
function findNINColumn(columns) {
  for (const column of columns) {
    const normalized = normalizeColumnName(column);
    if (
      normalized === 'nin' ||
      normalized === 'nationalidentificationnumber' ||
      normalized === 'nationalidnumber'
    ) {
      return column;
    }
  }
  return null;
}

/**
 * Find BVN column from column names
 * 
 * Requirements: 3.1
 * 
 * @param {string[]} columns - Array of column names
 * @returns {string|null} BVN column name or null
 */
function findBVNColumn(columns) {
  for (const column of columns) {
    const normalized = normalizeColumnName(column);
    if (
      normalized === 'bvn' ||
      normalized === 'bankverificationnumber' ||
      normalized === 'bvnumber'
    ) {
      return column;
    }
  }
  return null;
}

// ========== Main Validation Function ==========

/**
 * Validate identity data from uploaded file
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 6.3, 7.1, 7.2, 8.1, 8.2, 8.3
 * 
 * @param {Object[]} rows - Data rows from uploaded file
 * @param {string[]} columns - Column names
 * @param {Object} options - Validation options
 * @param {'individual'|'corporate'|'flexible'} options.templateType - Template type
 * @param {number} [options.currentYear] - Current year (for testing)
 * @returns {Object} Validation result with errors
 */
function validateIdentityData(rows, columns, options) {
  const errors = [];
  const currentYear = options.currentYear || new Date().getFullYear();

  // Detect relevant columns
  const dobColumn = findDOBColumn(columns);
  const ninColumn = findNINColumn(columns);
  const bvnColumn = findBVNColumn(columns);

  // Validate each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Validate DOB (all templates)
    if (dobColumn && row[dobColumn]) {
      const error = validateDOB(row[dobColumn], i, dobColumn, currentYear);
      if (error) errors.push(error);
    }

    // Validate NIN (Individual template only)
    if (options.templateType === 'individual' && ninColumn && row[ninColumn]) {
      const error = validateNIN(row[ninColumn], i, ninColumn);
      if (error) errors.push(error);
    }

    // Validate BVN (all templates)
    if (bvnColumn && row[bvnColumn]) {
      const error = validateBVN(row[bvnColumn], i, bvnColumn);
      if (error) errors.push(error);
    }
  }

  // Calculate summary
  const affectedRows = new Set(errors.map((e) => e.rowIndex)).size;

  return {
    valid: errors.length === 0,
    errors,
    errorSummary: {
      totalErrors: errors.length,
      affectedRows,
    },
  };
}

module.exports = {
  ERROR_TYPES,
  extractYear,
  validateDOB,
  validateNIN,
  validateBVN,
  findDOBColumn,
  findNINColumn,
  findBVNColumn,
  validateIdentityData,
};
