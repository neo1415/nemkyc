/**
 * Datapro NIN Verification API Client
 * 
 * This module provides a secure, production-ready client for the Datapro NIN verification API.
 * 
 * Features:
 * - Retry logic with exponential backoff (max 3 retries)
 * - 30-second timeout per request
 * - Comprehensive error handling for all response codes
 * - Structured logging with masked NIN data
 * - Response parsing and validation
 * - Rate limiting (max 50 requests per minute)
 * 
 * Security:
 * - SERVICEID stored in environment variables
 * - NIN masked in logs (only first 4 digits shown)
 * - No sensitive data in error messages
 */

const https = require('https');
const { URL } = require('url');

// Import rate limiter
const { applyDataproRateLimit } = require('../server-utils/rateLimiter.cjs');
const { safeJSONParse } = require('../server-utils/jsonParser.cjs');

// Note: API usage tracking is done in server.js to access Firestore db instance

// Configuration
const DATAPRO_API_URL = process.env.DATAPRO_API_URL || 'https://api.datapronigeria.com';
const DATAPRO_SERVICE_ID = process.env.DATAPRO_SERVICE_ID;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

/**
 * Mask NIN for logging (show only first 4 digits)
 * @param {string} nin - The NIN to mask
 * @returns {string} Masked NIN (e.g., "1234*******")
 */
function maskNIN(nin) {
  if (!nin || nin.length < 4) return '****';
  return nin.substring(0, 4) + '*'.repeat(nin.length - 4);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make HTTPS GET request with timeout
 * @param {string} url - Full URL to request
 * @param {object} headers - Request headers
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<{statusCode: number, data: string}>}
 */
function httpsGet(url, headers, timeout) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: headers,
      timeout: timeout
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

/**
 * Verify NIN using Datapro API
 * 
 * @param {string} nin - The 11-digit NIN to verify
 * @returns {Promise<object>} Verification result
 * 
 * Success response:
 * {
 *   success: true,
 *   data: {
 *     firstName: string,
 *     middleName: string | null,
 *     lastName: string,
 *     gender: string,
 *     dateOfBirth: string,
 *     phoneNumber: string,
 *     birthdate: string,
 *     birthlga: string,
 *     birthstate: string,
 *     trackingId: string
 *   },
 *   responseInfo: {
 *     responseCode: string,
 *     parameter: string,
 *     source: string,
 *     message: string,
 *     timestamp: string
 *   }
 * }
 * 
 * Error response:
 * {
 *   success: false,
 *   error: string,
 *   errorCode: string,
 *   details: object
 * }
 */
async function verifyNIN(nin) {
  // Validate input
  if (!nin) {
    console.error('[DataproClient] NIN is required');
    return {
      success: false,
      error: 'NIN is required',
      errorCode: 'INVALID_INPUT',
      details: {}
    };
  }

  // Validate NIN format (11 digits)
  if (!/^\d{11}$/.test(nin)) {
    console.error(`[DataproClient] Invalid NIN format: ${maskNIN(nin)}`);
    return {
      success: false,
      error: 'Invalid NIN format. NIN must be 11 digits.',
      errorCode: 'INVALID_FORMAT',
      details: { nin: maskNIN(nin) }
    };
  }

  // Check if SERVICEID is configured
  if (!DATAPRO_SERVICE_ID) {
    console.error('[DataproClient] DATAPRO_SERVICE_ID not configured');
    return {
      success: false,
      error: 'Datapro API not configured. Please contact support.',
      errorCode: 'NOT_CONFIGURED',
      details: {}
    };
  }

  // Construct request URL
  const url = `${DATAPRO_API_URL}/verifynin/?regNo=${nin}`;
  const headers = {
    'SERVICEID': DATAPRO_SERVICE_ID,
    'Content-Type': 'application/json'
  };

  console.log(`[DataproClient] Verifying NIN: ${maskNIN(nin)}`);

  // Apply rate limiting
  try {
    await applyDataproRateLimit();
  } catch (rateLimitError) {
    console.error(`[DataproClient] Rate limit exceeded: ${rateLimitError.message}`);
    return {
      success: false,
      error: 'Too many verification requests. Please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      details: { message: rateLimitError.message }
    };
  }

  // Retry logic with exponential backoff
  let lastError = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[DataproClient] Attempt ${attempt}/${MAX_RETRIES} for NIN: ${maskNIN(nin)}`);

      const response = await httpsGet(url, headers, REQUEST_TIMEOUT);
      const { statusCode, data } = response;

      console.log(`[DataproClient] Response status: ${statusCode} for NIN: ${maskNIN(nin)}`);

      // Handle different status codes
      if (statusCode === 200) {
        // Parse response using safe JSON parser
        const parseResult = safeJSONParse(data, {
          source: 'DataproClient',
          nin: maskNIN(nin),
          statusCode,
          responseLength: data ? data.length : 0
        });

        if (!parseResult.success) {
          console.error(`[DataproClient] ${parseResult.error}`);
          return {
            success: false,
            error: 'Invalid response from verification service',
            errorCode: parseResult.errorCode,
            details: parseResult.details
          };
        }

        const parsedData = parseResult.data;

        // Validate response structure
        if (!parsedData.ResponseInfo || !parsedData.ResponseData) {
          console.error('[DataproClient] Invalid response structure');
          return {
            success: false,
            error: 'Invalid response structure from verification service',
            errorCode: 'INVALID_RESPONSE',
            details: {}
          };
        }

        // Check ResponseCode
        if (parsedData.ResponseInfo.ResponseCode !== '00') {
          console.warn(`[DataproClient] Verification failed with code: ${parsedData.ResponseInfo.ResponseCode}`);
          return {
            success: false,
            error: parsedData.ResponseInfo.Message || 'NIN not found in NIMC database',
            errorCode: 'NIN_NOT_FOUND',
            details: {
              responseCode: parsedData.ResponseInfo.ResponseCode,
              message: parsedData.ResponseInfo.Message
            }
          };
        }

        // Success - extract relevant fields
        console.log(`[DataproClient] Verification successful for NIN: ${maskNIN(nin)}`);
        return {
          success: true,
          data: {
            firstName: parsedData.ResponseData.FirstName || null,
            middleName: parsedData.ResponseData.MiddleName || null,
            lastName: parsedData.ResponseData.LastName || null,
            gender: parsedData.ResponseData.Gender || null,
            dateOfBirth: parsedData.ResponseData.DateOfBirth || parsedData.ResponseData.birthdate || null,
            phoneNumber: parsedData.ResponseData.PhoneNumber || null,
            birthdate: parsedData.ResponseData.birthdate || null,
            birthlga: parsedData.ResponseData.birthlga || null,
            birthstate: parsedData.ResponseData.birthstate || null,
            trackingId: parsedData.ResponseData.trackingId || null
          },
          responseInfo: {
            responseCode: parsedData.ResponseInfo.ResponseCode,
            parameter: parsedData.ResponseInfo.Parameter,
            source: parsedData.ResponseInfo.Source,
            message: parsedData.ResponseInfo.Message,
            timestamp: parsedData.ResponseInfo.Timestamp
          }
        };
      } else if (statusCode === 400) {
        console.error(`[DataproClient] Bad request (400) for NIN: ${maskNIN(nin)}`);
        return {
          success: false,
          error: 'Invalid NIN format. Please check and try again.',
          errorCode: 'BAD_REQUEST',
          details: { statusCode: 400 }
        };
      } else if (statusCode === 401) {
        console.error('[DataproClient] Authorization failed (401)');
        return {
          success: false,
          error: 'Verification service unavailable. Please contact support.',
          errorCode: 'UNAUTHORIZED',
          details: { statusCode: 401 }
        };
      } else if (statusCode === 87) {
        console.error('[DataproClient] Invalid service ID (87)');
        return {
          success: false,
          error: 'Verification service unavailable. Please contact support.',
          errorCode: 'INVALID_SERVICE_ID',
          details: { statusCode: 87 }
        };
      } else if (statusCode === 88) {
        console.error('[DataproClient] Network error (88)');
        // This is retryable
        lastError = {
          success: false,
          error: 'Network error. Please try again later.',
          errorCode: 'NETWORK_ERROR',
          details: { statusCode: 88, attempt }
        };
        
        // If not last attempt, retry with exponential backoff
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
          console.log(`[DataproClient] Retrying after ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        
        return lastError;
      } else {
        console.error(`[DataproClient] Unexpected status code: ${statusCode}`);
        return {
          success: false,
          error: 'Unexpected error from verification service',
          errorCode: 'UNEXPECTED_STATUS',
          details: { statusCode }
        };
      }
    } catch (error) {
      console.error(`[DataproClient] Request error on attempt ${attempt}: ${error.message}`);
      lastError = {
        success: false,
        error: 'Network error. Please try again later.',
        errorCode: 'NETWORK_ERROR',
        details: { 
          message: error.message,
          attempt,
          isTimeout: error.message.includes('timeout')
        }
      };

      // If not last attempt, retry with exponential backoff
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
        console.log(`[DataproClient] Retrying after ${delay}ms...`);
        await sleep(delay);
        continue;
      }
    }
  }

  // All retries exhausted
  console.error(`[DataproClient] All ${MAX_RETRIES} attempts failed for NIN: ${maskNIN(nin)}`);
  return lastError || {
    success: false,
    error: 'Network error. Please try again later.',
    errorCode: 'MAX_RETRIES_EXCEEDED',
    details: { maxRetries: MAX_RETRIES }
  };
}

/**
 * Normalize a string for comparison
 * - Convert to lowercase
 * - Trim whitespace
 * - Remove extra spaces
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeString(str) {
  if (!str) return '';
  return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Normalize gender value
 * - M, Male, MALE → male
 * - F, Female, FEMALE → female
 * @param {string} gender - Gender value to normalize
 * @returns {string} Normalized gender ('male' or 'female')
 */
function normalizeGender(gender) {
  if (!gender) return '';
  const normalized = normalizeString(gender);
  
  if (normalized === 'm' || normalized === 'male') return 'male';
  if (normalized === 'f' || normalized === 'female') return 'female';
  
  return normalized;
}

/**
 * Parse date from various formats to a comparable format
 * Supports: DD/MM/YYYY, DD-MMM-YYYY, YYYY-MM-DD
 * @param {string} dateStr - Date string to parse
 * @returns {string|null} Normalized date in YYYY-MM-DD format or null if invalid
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const str = dateStr.toString().trim();
  
  // Try DD/MM/YYYY format (e.g., "04/01/1980")
  const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try DD-MMM-YYYY format (e.g., "12-May-1969")
  const ddmmmyyyyMatch = str.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (ddmmmyyyyMatch) {
    const [, day, monthName, year] = ddmmmyyyyMatch;
    const monthMap = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
    };
    const month = monthMap[monthName.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }
  
  // Try YYYY-MM-DD format (e.g., "1980-01-04")
  const yyyymmddMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try YYYY/MM/DD format (e.g., "1980/01/04")
  const yyyymmddSlashMatch = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (yyyymmddSlashMatch) {
    const [, year, month, day] = yyyymmddSlashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

/**
 * Normalize phone number for comparison
 * - Remove spaces, dashes, parentheses
 * - Handle +234 vs 0 prefix
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone number
 */
function normalizePhone(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let normalized = phone.toString().replace(/\D/g, '');
  
  // Handle +234 prefix (Nigeria country code)
  if (normalized.startsWith('234')) {
    normalized = '0' + normalized.substring(3);
  }
  
  return normalized;
}

/**
 * Match fields between Datapro API response and Excel data
 * 
 * @param {object} apiData - Data from Datapro API
 * @param {object} excelData - Data from Excel upload
 * @returns {object} Match result
 * 
 * Result format:
 * {
 *   matched: boolean,
 *   failedFields: string[],
 *   details: {
 *     firstName: { api: string, excel: string, matched: boolean },
 *     lastName: { api: string, excel: string, matched: boolean },
 *     gender: { api: string, excel: string, matched: boolean },
 *     dateOfBirth: { api: string, excel: string, matched: boolean },
 *     phoneNumber: { api: string, excel: string, matched: boolean, optional: true }
 *   }
 * }
 */
function matchFields(apiData, excelData) {
  const failedFields = [];
  const details = {};
  
  // Match First Name (required)
  const apiFirstName = normalizeString(apiData.firstName);
  const excelFirstName = normalizeString(excelData.firstName || excelData['First Name'] || excelData['first name']);
  const firstNameMatched = apiFirstName === excelFirstName;
  
  details.firstName = {
    api: apiData.firstName,
    excel: excelData.firstName || excelData['First Name'] || excelData['first name'],
    matched: firstNameMatched
  };
  
  if (!firstNameMatched) {
    failedFields.push('First Name');
  }
  
  // Match Last Name (required)
  const apiLastName = normalizeString(apiData.lastName);
  const excelLastName = normalizeString(excelData.lastName || excelData['Last Name'] || excelData['last name']);
  const lastNameMatched = apiLastName === excelLastName;
  
  details.lastName = {
    api: apiData.lastName,
    excel: excelData.lastName || excelData['Last Name'] || excelData['last name'],
    matched: lastNameMatched
  };
  
  if (!lastNameMatched) {
    failedFields.push('Last Name');
  }
  
  // Match Gender (required)
  const apiGender = normalizeGender(apiData.gender);
  const excelGender = normalizeGender(excelData.gender || excelData['Gender']);
  const genderMatched = apiGender === excelGender;
  
  details.gender = {
    api: apiData.gender,
    excel: excelData.gender || excelData['Gender'],
    matched: genderMatched
  };
  
  if (!genderMatched) {
    failedFields.push('Gender');
  }
  
  // Match Date of Birth (required)
  const apiDOB = parseDate(apiData.dateOfBirth);
  const excelDOB = parseDate(excelData.dateOfBirth || excelData['Date of Birth'] || excelData['date of birth'] || excelData['DOB']);
  const dobMatched = apiDOB && excelDOB && apiDOB === excelDOB;
  
  details.dateOfBirth = {
    api: apiData.dateOfBirth,
    excel: excelData.dateOfBirth || excelData['Date of Birth'] || excelData['date of birth'] || excelData['DOB'],
    apiParsed: apiDOB,
    excelParsed: excelDOB,
    matched: dobMatched
  };
  
  if (!dobMatched) {
    failedFields.push('Date of Birth');
  }
  
  // Match Phone Number (optional - loose matching)
  // People change phone numbers, so this is not a hard requirement
  const apiPhone = normalizePhone(apiData.phoneNumber);
  const excelPhone = normalizePhone(excelData.phoneNumber || excelData['Phone Number'] || excelData['phone number']);
  const phoneMatched = apiPhone === excelPhone;
  
  details.phoneNumber = {
    api: apiData.phoneNumber,
    excel: excelData.phoneNumber || excelData['Phone Number'] || excelData['phone number'],
    matched: phoneMatched,
    optional: true
  };
  
  // Phone number mismatch is logged but not considered a failure
  if (!phoneMatched && apiPhone && excelPhone) {
    console.warn('[DataproClient] Phone number mismatch (optional field)');
  }
  
  // Overall match result
  const matched = failedFields.length === 0;
  
  console.log(`[DataproClient] Field matching result: ${matched ? 'MATCHED' : 'FAILED'}`);
  if (!matched) {
    console.log(`[DataproClient] Failed fields: ${failedFields.join(', ')}`);
  }
  
  return {
    matched,
    failedFields,
    details
  };
}

/**
 * Get user-friendly error message based on error code
 * @param {string} errorCode - Error code from verification
 * @param {object} details - Additional error details
 * @returns {string} User-friendly error message
 */
function getUserFriendlyError(errorCode, details = {}) {
  const errorMessages = {
    'INVALID_INPUT': 'NIN is required. Please provide a valid NIN.',
    'INVALID_FORMAT': 'Invalid NIN format. Please check and try again.',
    'NOT_CONFIGURED': 'Verification service is not configured. Please contact support.',
    'BAD_REQUEST': 'Invalid NIN format. Please check and try again.',
    'UNAUTHORIZED': 'Verification service unavailable. Please contact support.',
    'INVALID_SERVICE_ID': 'Verification service unavailable. Please contact support.',
    'NETWORK_ERROR': 'Network error. Please try again later.',
    'UNEXPECTED_STATUS': 'Unexpected error from verification service. Please contact support.',
    'PARSE_ERROR': 'Invalid response from verification service. Please contact support.',
    'INVALID_RESPONSE': 'Invalid response from verification service. Please contact support.',
    'NIN_NOT_FOUND': 'NIN not found in NIMC database. Please verify your NIN and try again.',
    'MAX_RETRIES_EXCEEDED': 'Network error. Please try again later.',
    'FIELD_MISMATCH': 'The information provided does not match our records. Please contact your broker.'
  };
  
  return errorMessages[errorCode] || 'An error occurred during verification. Please contact support.';
}

/**
 * Get technical error message for staff
 * @param {string} errorCode - Error code from verification
 * @param {object} details - Additional error details
 * @returns {string} Technical error message
 */
function getTechnicalError(errorCode, details = {}) {
  let message = `Error Code: ${errorCode}`;
  
  if (details.statusCode) {
    message += ` | Status Code: ${details.statusCode}`;
  }
  
  if (details.message) {
    message += ` | Message: ${details.message}`;
  }
  
  if (details.attempt) {
    message += ` | Attempt: ${details.attempt}`;
  }
  
  if (details.failedFields && details.failedFields.length > 0) {
    message += ` | Failed Fields: ${details.failedFields.join(', ')}`;
  }
  
  return message;
}

module.exports = {
  verifyNIN,
  maskNIN,
  matchFields,
  getUserFriendlyError,
  getTechnicalError,
  // Export utility functions for testing
  normalizeString,
  normalizeGender,
  parseDate,
  normalizePhone
};
