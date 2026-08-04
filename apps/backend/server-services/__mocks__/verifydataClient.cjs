/**
 * Mock VerifyData API Client for Testing
 * 
 * Provides realistic mock responses for all CAC verification scenarios:
 * - Successful verification with matching fields
 * - Field mismatches (company name, RC number, registration date)
 * - Various status codes (FF, IB, BR, EE, 500)
 * - Network errors and timeouts
 * - Invalid response structures
 * 
 * Mirrors the structure of dataproClient mock for consistency
 */

// Mock data for successful verifications
const MOCK_SUCCESSFUL_RESPONSES = {
  'RC123456': {
    success: true,
    statusCode: '00',
    message: 'Results Found',
    data: {
      name: 'ACME CORPORATION LIMITED',
      registrationNumber: 'RC123456',
      companyStatus: 'Verified',
      registrationDate: '15/03/2010',
      typeOfEntity: 'Private Limited Company'
    }
  },
  'RC789012': {
    success: true,
    statusCode: '00',
    message: 'Results Found',
    data: {
      name: 'GLOBAL TRADING COMPANY LTD',
      registrationNumber: 'RC789012',
      companyStatus: 'Active',
      registrationDate: '22/08/2015',
      typeOfEntity: 'Private Limited Company'
    }
  },
  '123456': {
    // Without RC prefix
    success: true,
    statusCode: '00',
    message: 'Results Found',
    data: {
      name: 'ACME CORPORATION LIMITED',
      registrationNumber: 'RC123456',
      companyStatus: 'Verified',
      registrationDate: '15/03/2010',
      typeOfEntity: 'Private Limited Company'
    }
  }
};

// Mock data for field mismatches
const MOCK_MISMATCH_RESPONSES = {
  'RC111111': {
    // Company name mismatch
    success: true,
    statusCode: '00',
    message: 'Results Found',
    data: {
      name: 'WRONG COMPANY NAME LIMITED',
      registrationNumber: 'RC111111',
      companyStatus: 'Verified',
      registrationDate: '15/03/2010',
      typeOfEntity: 'Private Limited Company'
    }
  },
  'RC222222': {
    // Registration date mismatch
    success: true,
    statusCode: '00',
    message: 'Results Found',
    data: {
      name: 'ACME CORPORATION LIMITED',
      registrationNumber: 'RC222222',
      companyStatus: 'Verified',
      registrationDate: '01/01/2020',
      typeOfEntity: 'Private Limited Company'
    }
  },
  'RC333333': {
    // Company status invalid
    success: true,
    statusCode: '00',
    message: 'Results Found',
    data: {
      name: 'ACME CORPORATION LIMITED',
      registrationNumber: 'RC333333',
      companyStatus: 'Inactive',
      registrationDate: '15/03/2010',
      typeOfEntity: 'Private Limited Company'
    }
  }
};

// Mock error scenarios
const MOCK_ERROR_RC_NUMBERS = {
  'RCFF0000': { statusCode: 400, responseStatusCode: 'FF', error: 'INVALID_SECRET_KEY' },
  'RCIB0000': { statusCode: 400, responseStatusCode: 'IB', error: 'INSUFFICIENT_BALANCE' },
  'RCBR0000': { statusCode: 400, responseStatusCode: 'BR', error: 'CONTACT_ADMINISTRATOR' },
  'RCEE0000': { statusCode: 400, responseStatusCode: 'EE', error: 'NO_ACTIVE_SERVICE' },
  'RC500000': { statusCode: 500, error: 'SERVER_ERROR' },
  'RC999999': { success: false, statusCode: '99', error: 'CAC_NOT_FOUND' }
};

// Track mock behavior
let mockBehavior = {
  shouldTimeout: false,
  shouldThrowNetworkError: false,
  shouldReturnInvalidJson: false,
  shouldReturnInvalidStructure: false,
  customResponse: null
};

/**
 * Mock verifyCAC function
 * Simulates VerifyData API behavior based on RC number value
 */
async function verifyCAC(rcNumber) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Check for custom mock behavior
  if (mockBehavior.shouldTimeout) {
    return {
      success: false,
      error: 'Network error. Please try again later.',
      errorCode: 'NETWORK_ERROR',
      details: {
        message: 'Request timeout',
        isTimeout: true
      }
    };
  }

  if (mockBehavior.shouldThrowNetworkError) {
    return {
      success: false,
      error: 'Network error. Please try again later.',
      errorCode: 'NETWORK_ERROR',
      details: {
        message: 'Network error: ECONNREFUSED'
      }
    };
  }

  if (mockBehavior.customResponse) {
    return mockBehavior.customResponse;
  }

  // Validate input
  if (!rcNumber) {
    return {
      success: false,
      error: 'RC number is required',
      errorCode: 'INVALID_INPUT',
      details: {}
    };
  }

  // Normalize RC number for lookup (remove RC prefix, spaces, etc.)
  const normalizedRC = normalizeRCNumber(rcNumber);

  // Check for error scenarios
  if (MOCK_ERROR_RC_NUMBERS[rcNumber] || MOCK_ERROR_RC_NUMBERS[normalizedRC]) {
    const errorConfig = MOCK_ERROR_RC_NUMBERS[rcNumber] || MOCK_ERROR_RC_NUMBERS[normalizedRC];
    
    if (errorConfig.statusCode === 400) {
      const responseStatusCode = errorConfig.responseStatusCode;
      
      if (responseStatusCode === 'FF') {
        return {
          success: false,
          error: 'Verification service unavailable. Please contact support.',
          errorCode: 'INVALID_SECRET_KEY',
          details: { statusCode: 400, responseStatusCode: 'FF' }
        };
      }
      
      if (responseStatusCode === 'IB') {
        return {
          success: false,
          error: 'Verification service unavailable. Please contact support.',
          errorCode: 'INSUFFICIENT_BALANCE',
          details: { statusCode: 400, responseStatusCode: 'IB' }
        };
      }
      
      if (responseStatusCode === 'BR') {
        return {
          success: false,
          error: 'Verification service unavailable. Please contact support.',
          errorCode: 'CONTACT_ADMINISTRATOR',
          details: { statusCode: 400, responseStatusCode: 'BR' }
        };
      }
      
      if (responseStatusCode === 'EE') {
        return {
          success: false,
          error: 'Verification service unavailable. Please contact support.',
          errorCode: 'NO_ACTIVE_SERVICE',
          details: { statusCode: 400, responseStatusCode: 'EE' }
        };
      }
    }
    
    if (errorConfig.statusCode === 500) {
      return {
        success: false,
        error: 'Network error. Please try again later.',
        errorCode: 'SERVER_ERROR',
        details: { statusCode: 500, attempt: 1 }
      };
    }
    
    if (errorConfig.statusCode === '99') {
      return {
        success: false,
        error: 'RC number not found in CAC database',
        errorCode: 'CAC_NOT_FOUND',
        details: {
          statusCode: '99',
          message: 'RC number not found in CAC database'
        }
      };
    }
  }

  // Check for successful responses (with or without RC prefix)
  if (MOCK_SUCCESSFUL_RESPONSES[rcNumber] || MOCK_SUCCESSFUL_RESPONSES[normalizedRC]) {
    const response = MOCK_SUCCESSFUL_RESPONSES[rcNumber] || MOCK_SUCCESSFUL_RESPONSES[normalizedRC];
    return {
      success: true,
      data: {
        name: response.data.name,
        registrationNumber: response.data.registrationNumber,
        companyStatus: response.data.companyStatus,
        registrationDate: response.data.registrationDate,
        typeOfEntity: response.data.typeOfEntity
      },
      responseInfo: {
        statusCode: response.statusCode,
        message: response.message
      }
    };
  }

  // Check for mismatch responses
  if (MOCK_MISMATCH_RESPONSES[rcNumber] || MOCK_MISMATCH_RESPONSES[normalizedRC]) {
    const response = MOCK_MISMATCH_RESPONSES[rcNumber] || MOCK_MISMATCH_RESPONSES[normalizedRC];
    return {
      success: true,
      data: {
        name: response.data.name,
        registrationNumber: response.data.registrationNumber,
        companyStatus: response.data.companyStatus,
        registrationDate: response.data.registrationDate,
        typeOfEntity: response.data.typeOfEntity
      },
      responseInfo: {
        statusCode: response.statusCode,
        message: response.message
      }
    };
  }

  // Default: RC number not found
  return {
    success: false,
    error: 'RC number not found in CAC database. Please verify your RC number and try again.',
    errorCode: 'CAC_NOT_FOUND',
    details: {
      statusCode: '01',
      message: 'No results found'
    }
  };
}

/**
 * Mock utility functions (same as real implementation)
 */
function maskRCNumber(rcNumber) {
  if (!rcNumber || rcNumber.length < 4) return '****';
  return rcNumber.substring(0, 4) + '*'.repeat(Math.max(0, rcNumber.length - 4));
}

function normalizeCompanyName(name) {
  if (!name) return '';
  
  let normalized = name.toString().toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Normalize common company suffixes (order matters - longer phrases first)
  normalized = normalized
    .replace(/\bpublic limited company\b/g, 'plc')
    .replace(/\bprivate limited company\b/g, 'ltd')
    .replace(/\blimited liability company\b/g, 'llc')
    .replace(/\blimited\b/g, 'ltd')
    .replace(/\bincorporated\b/g, 'inc');
  
  // Remove trailing punctuation
  normalized = normalized.replace(/[.,;]+$/, '');
  
  return normalized;
}

function normalizeRCNumber(rcNumber) {
  if (!rcNumber) return '';
  
  let normalized = rcNumber.toString().trim().toUpperCase();
  
  // Remove RC prefix (with or without space/dash)
  normalized = normalized.replace(/^RC[\s\-\/]*/i, '');
  
  // Remove all non-alphanumeric characters
  normalized = normalized.replace(/[^A-Z0-9]/g, '');
  
  return normalized;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  const str = dateStr.toString().trim();
  
  // Try DD/MM/YYYY format
  const ddmmyyyyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try DD-MMM-YYYY format
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
  
  // Try YYYY-MM-DD format
  const yyyymmddMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try YYYY/MM/DD format
  const yyyymmddSlashMatch = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (yyyymmddSlashMatch) {
    const [, year, month, day] = yyyymmddSlashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

function matchCACFields(apiData, excelData) {
  const failedFields = [];
  const details = {};
  
  // Match Company Name
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
  
  // Match Registration Number
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
  
  // Match Registration Date
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
  
  // Validate Company Status
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
  
  const matched = failedFields.length === 0;
  
  return {
    matched,
    failedFields,
    details
  };
}

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

/**
 * Test helper functions to control mock behavior
 */
function setMockBehavior(behavior) {
  mockBehavior = { ...mockBehavior, ...behavior };
}

function resetMockBehavior() {
  mockBehavior = {
    shouldTimeout: false,
    shouldThrowNetworkError: false,
    shouldReturnInvalidJson: false,
    shouldReturnInvalidStructure: false,
    customResponse: null
  };
}

function getMockSuccessRCNumbers() {
  return Object.keys(MOCK_SUCCESSFUL_RESPONSES);
}

function getMockMismatchRCNumbers() {
  return Object.keys(MOCK_MISMATCH_RESPONSES);
}

function getMockErrorRCNumbers() {
  return Object.keys(MOCK_ERROR_RC_NUMBERS);
}

module.exports = {
  verifyCAC,
  maskRCNumber,
  normalizeCompanyName,
  normalizeRCNumber,
  parseDate,
  matchCACFields,
  getUserFriendlyError,
  getTechnicalError,
  // Test helpers
  setMockBehavior,
  resetMockBehavior,
  getMockSuccessRCNumbers,
  getMockMismatchRCNumbers,
  getMockErrorRCNumbers
};
