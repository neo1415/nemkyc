/**
 * VerifyData CAC Verification API Client
 * 
 * This module provides a secure, production-ready client for the VerifyData CAC verification API.
 * Mirrors the structure of dataproClient.cjs for consistency and maintainability.
 * 
 * Features:
 * - Retry logic with exponential backoff (max 3 retries)
 * - 30-second timeout per request
 * - Comprehensive error handling for all response codes
 * - Structured logging with masked RC number data
 * - Response parsing and validation
 * - Rate limiting (max 50 requests per minute)
 * 
 * Security:
 * - SECRET_KEY stored in environment variables
 * - RC number masked in logs (only first 4 chars shown)
 * - No sensitive data in error messages
 */

const https = require('https');
const { URL } = require('url');

// Import rate limiter
const { applyVerifydataRateLimit } = require('../server-utils/rateLimiter.cjs');
const { safeJSONParse } = require('../server-utils/jsonParser.cjs');

// Note: API usage tracking is done in server.js to access Firestore db instance

// Configuration
const VERIFYDATA_API_URL = process.env.VERIFYDATA_API_URL || 'https://vd.villextra.com';
const VERIFYDATA_SECRET_KEY = process.env.VERIFYDATA_SECRET_KEY;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

/**
 * Mask RC number for logging (show only first 4 chars)
 * @param {string} rcNumber - The RC number to mask
 * @returns {string} Masked RC number (e.g., "RC12*******")
 */
function maskRCNumber(rcNumber) {
  if (!rcNumber || rcNumber.length < 4) return '****';
  return rcNumber.substring(0, 4) + '*'.repeat(Math.max(0, rcNumber.length - 4));
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
 * Make HTTPS POST request with timeout
 * @param {string} url - Full URL to request
 * @param {object} body - Request body
 * @param {object} headers - Request headers
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<{statusCode: number, data: string}>}
 */
function httpsPost(url, body, headers, timeout) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
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

    req.write(postData);
    req.end();
  });
}

/**
 * Verify CAC using VerifyData API
 * 
 * @param {string} rcNumber - The RC number to verify
 * @returns {Promise<object>} Verification result
 * 
 * Success response:
 * {
 *   success: true,
 *   data: {
 *     name: string,
 *     registrationNumber: string,
 *     companyStatus: string,
 *     registrationDate: string,
 *     typeOfEntity: string
 *   },
 *   responseInfo: {
 *     statusCode: number,
 *     message: string
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
async function verifyCAC(rcNumber) {
  // Validate input
  if (!rcNumber) {
    console.error('[VerifydataClient] RC number is required');
    return {
      success: false,
      error: 'RC number is required',
      errorCode: 'INVALID_INPUT',
      details: {}
    };
  }

  // Check if SECRET_KEY is configured
  if (!VERIFYDATA_SECRET_KEY) {
    console.error('[VerifydataClient] VERIFYDATA_SECRET_KEY not configured');
    return {
      success: false,
      error: 'VerifyData API not configured. Please contact support.',
      errorCode: 'NOT_CONFIGURED',
      details: {}
    };
  }

  // Construct request URL and body
  const url = `${VERIFYDATA_API_URL}/api/ValidateRcNumber/Initiate`;
  const requestBody = {
    rcNumber: rcNumber,
    secretKey: VERIFYDATA_SECRET_KEY
  };

  console.log(`[VerifydataClient] Verifying RC number: ${maskRCNumber(rcNumber)}`);

  // Apply rate limiting
  try {
    await applyVerifydataRateLimit();
  } catch (rateLimitError) {
    console.error(`[VerifydataClient] Rate limit exceeded: ${rateLimitError.message}`);
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
      console.log(`[VerifydataClient] Attempt ${attempt}/${MAX_RETRIES} for RC: ${maskRCNumber(rcNumber)}`);

      const response = await httpsPost(url, requestBody, {}, REQUEST_TIMEOUT);
      const { statusCode, data } = response;

      console.log(`[VerifydataClient] Response status: ${statusCode} for RC: ${maskRCNumber(rcNumber)}`);

      // Handle different status codes
      if (statusCode === 200) {
        // Parse response using safe JSON parser
        const parseResult = safeJSONParse(data, {
          source: 'VerifydataClient',
          rcNumber: maskRCNumber(rcNumber),
          statusCode,
          responseLength: data ? data.length : 0
        });

        if (!parseResult.success) {
          console.error(`[VerifydataClient] ${parseResult.error}`);
          return {
            success: false,
            error: 'Invalid response from verification service',
            errorCode: parseResult.errorCode,
            details: parseResult.details
          };
        }

        const parsedData = parseResult.data;

        // Check if success is true
        if (parsedData.success === true && parsedData.data) {
          // Success - extract relevant fields
          console.log(`[VerifydataClient] Verification successful for RC: ${maskRCNumber(rcNumber)}`);
          return {
            success: true,
            data: {
              name: parsedData.data.name || null,
              registrationNumber: parsedData.data.registrationNumber || null,
              companyStatus: parsedData.data.companyStatus || null,
              registrationDate: parsedData.data.registrationDate || null,
              typeOfEntity: parsedData.data.typeOfEntity || null
            },
            responseInfo: {
              statusCode: parsedData.statusCode,
              message: parsedData.message
            }
          };
        } else {
          // Success is false or data is missing
          console.warn(`[VerifydataClient] Verification failed: ${parsedData.message || 'Unknown error'}`);
          return {
            success: false,
            error: parsedData.message || 'RC number not found in CAC database',
            errorCode: 'CAC_NOT_FOUND',
            details: {
              statusCode: parsedData.statusCode,
              message: parsedData.message
            }
          };
        }
      } else if (statusCode === 400) {
        // Parse response to check statusCode using safe JSON parser
        const parseResult = safeJSONParse(data, {
          source: 'VerifydataClient',
          rcNumber: maskRCNumber(rcNumber),
          statusCode,
          responseLength: data ? data.length : 0
        });

        if (!parseResult.success) {
          console.error(`[VerifydataClient] Failed to parse 400 response: ${parseResult.error}`);
          return {
            success: false,
            error: 'Invalid RC number format. Please check and try again.',
            errorCode: 'BAD_REQUEST',
            details: { statusCode: 400, ...parseResult.details }
          };
        }

        const parsedData = parseResult.data;

        // Check statusCode in response
        const responseStatusCode = parsedData.statusCode;
        
        if (responseStatusCode === 'FF') {
          console.error('[VerifydataClient] Invalid secret key (FF)');
          return {
            success: false,
            error: 'Verification service unavailable. Please contact support.',
            errorCode: 'INVALID_SECRET_KEY',
            details: { statusCode: 400, responseStatusCode: 'FF' }
          };
        } else if (responseStatusCode === 'IB') {
          console.error('[VerifydataClient] Insufficient balance (IB)');
          return {
            success: false,
            error: 'Verification service unavailable. Please contact support.',
            errorCode: 'INSUFFICIENT_BALANCE',
            details: { statusCode: 400, responseStatusCode: 'IB' }
          };
        } else if (responseStatusCode === 'BR') {
          console.error('[VerifydataClient] Contact administrator (BR)');
          return {
            success: false,
            error: 'Verification service unavailable. Please contact support.',
            errorCode: 'CONTACT_ADMINISTRATOR',
            details: { statusCode: 400, responseStatusCode: 'BR' }
          };
        } else if (responseStatusCode === 'EE') {
          console.error('[VerifydataClient] No active service (EE)');
          return {
            success: false,
            error: 'Verification service unavailable. Please contact support.',
            errorCode: 'NO_ACTIVE_SERVICE',
            details: { statusCode: 400, responseStatusCode: 'EE' }
          };
        } else {
          console.error(`[VerifydataClient] Bad request (400) with unknown statusCode: ${responseStatusCode}`);
          return {
            success: false,
            error: 'Invalid RC number format. Please check and try again.',
            errorCode: 'BAD_REQUEST',
            details: { statusCode: 400, responseStatusCode }
          };
        }
      } else if (statusCode === 500) {
        console.error('[VerifydataClient] Server error (500)');
        // This is retryable
        lastError = {
          success: false,
          error: 'Network error. Please try again later.',
          errorCode: 'SERVER_ERROR',
          details: { statusCode: 500, attempt }
        };
        
        // If not last attempt, retry with exponential backoff
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt - 1);
          console.log(`[VerifydataClient] Retrying after ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        
        return lastError;
      } else {
        console.error(`[VerifydataClient] Unexpected status code: ${statusCode}`);
        return {
          success: false,
          error: 'Unexpected error from verification service',
          errorCode: 'UNEXPECTED_STATUS',
          details: { statusCode }
        };
      }
    } catch (error) {
      console.error(`[VerifydataClient] Request error on attempt ${attempt}: ${error.message}`);
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
        console.log(`[VerifydataClient] Retrying after ${delay}ms...`);
        await sleep(delay);
        continue;
      }
    }
  }

  // All retries exhausted
  console.error(`[VerifydataClient] All ${MAX_RETRIES} attempts failed for RC: ${maskRCNumber(rcNumber)}`);
  return lastError || {
    success: false,
    error: 'Network error. Please try again later.',
    errorCode: 'MAX_RETRIES_EXCEEDED',
    details: { maxRetries: MAX_RETRIES }
  };
}

/**
 * Normalize company name for comparison
 * - Convert to lowercase
 * - Trim whitespace
 * - Remove extra spaces
 * - Handle Ltd/Limited/PLC variations
 * @param {string} name - Company name to normalize
 * @returns {string} Normalized company name
 */
function normalizeCompanyName(name) {
  if (!name) return '';
  
  let normalized = name.toString().toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Normalize common company suffixes
  normalized = normalized
    .replace(/\blimited\b/g, 'ltd')
    .replace(/\bpublic limited company\b/g, 'plc')
    .replace(/\bprivate limited company\b/g, 'ltd')
    .replace(/\blimited liability company\b/g, 'llc')
    .replace(/\bincorporated\b/g, 'inc');
  
  // Remove trailing punctuation
  normalized = normalized.replace(/[.,;]+$/, '');
  
  return normalized;
}

/**
 * Normalize RC number for comparison
 * - Remove RC prefix (case-insensitive)
 * - Remove spaces, dashes, slashes
 * - Convert to uppercase
 * @param {string} rcNumber - RC number to normalize
 * @returns {string} Normalized RC number
 */
function normalizeRCNumber(rcNumber) {
  if (!rcNumber) return '';
  
  let normalized = rcNumber.toString().trim().toUpperCase();
  
  // Remove RC prefix (with or without space/dash)
  normalized = normalized.replace(/^RC[\s\-\/]*/i, '');
  
  // Remove all non-alphanumeric characters
  normalized = normalized.replace(/[^A-Z0-9]/g, '');
  
  return normalized;
}

/**
 * Parse date from various formats to a comparable format
 * Supports: DD/MM/YYYY, DD-MMM-YYYY, YYYY-MM-DD
 * Reused from dataproClient for consistency
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
 * Match CAC fields between VerifyData API response and Excel data
 * 
 * @param {object} apiData - Data from VerifyData API
 * @param {object} excelData - Data from Excel upload
 * @returns {object} Match result
 * 
 * Result format:
 * {
 *   matched: boolean,
 *   failedFields: string[],
 *   details: {
 *     companyName: { api: string, excel: string, matched: boolean },
 *     registrationNumber: { api: string, excel: string, matched: boolean },
 *     registrationDate: { api: string, excel: string, matched: boolean },
 *     companyStatus: { api: string, excel: string, matched: boolean }
 *   }
 * }
 */
function matchCACFields(apiData, excelData) {
  const failedFields = [];
  const details = {};
  
  // Match Company Name (required)
  const apiCompanyName = normalizeCompanyName(apiData.name);
  const excelCompanyName = normalizeCompanyName(
    excelData.companyName || 
    excelData['Company Name'] || 
    excelData['company name'] ||
    excelData.name ||
    excelData['Name']
  );
  const companyNameMatched = apiCompanyName === excelCompanyName;
  
  details.companyName = {
    api: apiData.name,
    excel: excelData.companyName || excelData['Company Name'] || excelData['company name'] || excelData.name || excelData['Name'],
    matched: companyNameMatched
  };
  
  if (!companyNameMatched) {
    failedFields.push('Company Name');
  }
  
  // Match Registration Number (required)
  const apiRegNumber = normalizeRCNumber(apiData.registrationNumber);
  const excelRegNumber = normalizeRCNumber(
    excelData.registrationNumber || 
    excelData['Registration Number'] || 
    excelData['registration number'] ||
    excelData.rcNumber ||
    excelData['RC Number'] ||
    excelData['rc number'] ||
    excelData.cac ||
    excelData['CAC']
  );
  const regNumberMatched = apiRegNumber === excelRegNumber;
  
  details.registrationNumber = {
    api: apiData.registrationNumber,
    excel: excelData.registrationNumber || excelData['Registration Number'] || excelData['registration number'] || excelData.rcNumber || excelData['RC Number'] || excelData['rc number'] || excelData.cac || excelData['CAC'],
    matched: regNumberMatched
  };
  
  if (!regNumberMatched) {
    failedFields.push('Registration Number');
  }
  
  // Match Registration Date (required)
  const apiRegDate = parseDate(apiData.registrationDate);
  const excelRegDate = parseDate(
    excelData.registrationDate || 
    excelData['Registration Date'] || 
    excelData['registration date']
  );
  const regDateMatched = apiRegDate && excelRegDate && apiRegDate === excelRegDate;
  
  details.registrationDate = {
    api: apiData.registrationDate,
    excel: excelData.registrationDate || excelData['Registration Date'] || excelData['registration date'],
    apiParsed: apiRegDate,
    excelParsed: excelRegDate,
    matched: regDateMatched
  };
  
  if (!regDateMatched) {
    failedFields.push('Registration Date');
  }
  
  // Validate Company Status (must be "Verified" or active)
  const apiStatus = (apiData.companyStatus || '').toLowerCase().trim();
  const statusValid = apiStatus === 'verified' || apiStatus === 'active';
  
  details.companyStatus = {
    api: apiData.companyStatus,
    excel: 'N/A (validated against CAC)',
    matched: statusValid
  };
  
  if (!statusValid) {
    failedFields.push('Company Status');
  }
  
  // Overall match result
  const matched = failedFields.length === 0;
  
  console.log(`[VerifydataClient] Field matching result: ${matched ? 'MATCHED' : 'FAILED'}`);
  if (!matched) {
    console.log(`[VerifydataClient] Failed fields: ${failedFields.join(', ')}`);
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
    'INVALID_INPUT': 'RC number is required. Please provide a valid RC number.',
    'NOT_CONFIGURED': 'Verification service is not configured. Please contact support.',
    'INVALID_SECRET_KEY': 'Verification service unavailable. Please contact support.',
    'INSUFFICIENT_BALANCE': 'Verification service unavailable. Please contact support.',
    'CONTACT_ADMINISTRATOR': 'Verification service unavailable. Please contact support.',
    'NO_ACTIVE_SERVICE': 'Verification service unavailable. Please contact support.',
    'BAD_REQUEST': 'Invalid RC number format. Please check and try again.',
    'SERVER_ERROR': 'Network error. Please try again later.',
    'NETWORK_ERROR': 'Network error. Please try again later.',
    'UNEXPECTED_STATUS': 'Unexpected error from verification service. Please contact support.',
    'PARSE_ERROR': 'Invalid response from verification service. Please contact support.',
    'CAC_NOT_FOUND': 'RC number not found in CAC database. Please verify your RC number and try again.',
    'MAX_RETRIES_EXCEEDED': 'Network error. Please try again later.',
    'FIELD_MISMATCH': 'The company information provided does not match CAC records. Please contact your broker.',
    'RATE_LIMIT_EXCEEDED': 'Too many verification requests. Please try again later.'
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
  
  if (details.responseStatusCode) {
    message += ` | Response Status Code: ${details.responseStatusCode}`;
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
  verifyCAC,
  maskRCNumber,
  normalizeCompanyName,
  normalizeRCNumber,
  parseDate,
  matchCACFields,
  getUserFriendlyError,
  getTechnicalError
};
