/**
 * Mock Datapro API Client for Testing
 * 
 * Provides realistic mock responses for all scenarios:
 * - Successful verification with matching fields
 * - Field mismatches (name, gender, DOB)
 * - Various error codes (400, 401, 87, 88)
 * - Network errors and timeouts
 * - Invalid response structures
 */

// Mock data for successful verifications
const MOCK_SUCCESSFUL_RESPONSES = {
  '12345678901': {
    ResponseInfo: {
      ResponseCode: '00',
      Parameter: '12345678901',
      Source: 'NIMC',
      Message: 'Results Found',
      Timestamp: '21/10/2018 8:36:12PM'
    },
    ResponseData: {
      FirstName: 'JOHN',
      MiddleName: 'MIDDLE',
      LastName: 'DOE',
      Gender: 'Male',
      DateOfBirth: '12-May-1969',
      PhoneNumber: '08123456789',
      birthdate: '12/05/1969',
      birthlga: 'Ikeja',
      birthstate: 'LAGOS',
      trackingId: '100083737345'
    }
  },
  '98765432109': {
    ResponseInfo: {
      ResponseCode: '00',
      Parameter: '98765432109',
      Source: 'NIMC',
      Message: 'Results Found',
      Timestamp: '21/10/2018 8:36:12PM'
    },
    ResponseData: {
      FirstName: 'JANE',
      MiddleName: null,
      LastName: 'SMITH',
      Gender: 'Female',
      DateOfBirth: '04-Jan-1980',
      PhoneNumber: '08199999999',
      birthdate: '04/01/1980',
      birthlga: 'Kosofe',
      birthstate: 'LAGOS',
      trackingId: '100083737346'
    }
  }
};

// Mock data for field mismatches
const MOCK_MISMATCH_RESPONSES = {
  '11111111111': {
    // First name mismatch
    ResponseInfo: {
      ResponseCode: '00',
      Parameter: '11111111111',
      Source: 'NIMC',
      Message: 'Results Found',
      Timestamp: '21/10/2018 8:36:12PM'
    },
    ResponseData: {
      FirstName: 'WRONG',
      MiddleName: null,
      LastName: 'DOE',
      Gender: 'Male',
      DateOfBirth: '12-May-1969',
      PhoneNumber: '08123456789',
      birthdate: '12/05/1969',
      birthlga: 'Ikeja',
      birthstate: 'LAGOS',
      trackingId: '100083737347'
    }
  },
  '22222222222': {
    // Gender mismatch
    ResponseInfo: {
      ResponseCode: '00',
      Parameter: '22222222222',
      Source: 'NIMC',
      Message: 'Results Found',
      Timestamp: '21/10/2018 8:36:12PM'
    },
    ResponseData: {
      FirstName: 'JOHN',
      MiddleName: null,
      LastName: 'DOE',
      Gender: 'Female',
      DateOfBirth: '12-May-1969',
      PhoneNumber: '08123456789',
      birthdate: '12/05/1969',
      birthlga: 'Ikeja',
      birthstate: 'LAGOS',
      trackingId: '100083737348'
    }
  },
  '33333333333': {
    // Date of birth mismatch
    ResponseInfo: {
      ResponseCode: '00',
      Parameter: '33333333333',
      Source: 'NIMC',
      Message: 'Results Found',
      Timestamp: '21/10/2018 8:36:12PM'
    },
    ResponseData: {
      FirstName: 'JOHN',
      MiddleName: null,
      LastName: 'DOE',
      Gender: 'Male',
      DateOfBirth: '01-Jan-2000',
      PhoneNumber: '08123456789',
      birthdate: '01/01/2000',
      birthlga: 'Ikeja',
      birthstate: 'LAGOS',
      trackingId: '100083737349'
    }
  }
};

// Mock error scenarios
const MOCK_ERROR_NINS = {
  '40000000000': { statusCode: 400, error: 'BAD_REQUEST' },
  '40100000000': { statusCode: 401, error: 'UNAUTHORIZED' },
  '87000000000': { statusCode: 87, error: 'INVALID_SERVICE_ID' },
  '88000000000': { statusCode: 88, error: 'NETWORK_ERROR' },
  '99999999999': { responseCode: '99', error: 'NIN_NOT_FOUND' }
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
 * Mock verifyNIN function
 * Simulates Datapro API behavior based on NIN value
 */
async function verifyNIN(nin) {
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
  if (!nin) {
    return {
      success: false,
      error: 'NIN is required',
      errorCode: 'INVALID_INPUT',
      details: {}
    };
  }

  if (!/^\d{11}$/.test(nin)) {
    return {
      success: false,
      error: 'Invalid NIN format. NIN must be 11 digits.',
      errorCode: 'INVALID_FORMAT',
      details: { nin: nin.substring(0, 4) + '*******' }
    };
  }

  // Check for error scenarios
  if (MOCK_ERROR_NINS[nin]) {
    const errorConfig = MOCK_ERROR_NINS[nin];
    
    if (errorConfig.statusCode === 400) {
      return {
        success: false,
        error: 'Invalid NIN format. Please check and try again.',
        errorCode: 'BAD_REQUEST',
        details: { statusCode: 400 }
      };
    }
    
    if (errorConfig.statusCode === 401) {
      return {
        success: false,
        error: 'Verification service unavailable. Please contact support.',
        errorCode: 'UNAUTHORIZED',
        details: { statusCode: 401 }
      };
    }
    
    if (errorConfig.statusCode === 87) {
      return {
        success: false,
        error: 'Verification service unavailable. Please contact support.',
        errorCode: 'INVALID_SERVICE_ID',
        details: { statusCode: 87 }
      };
    }
    
    if (errorConfig.statusCode === 88) {
      return {
        success: false,
        error: 'Network error. Please try again later.',
        errorCode: 'NETWORK_ERROR',
        details: { statusCode: 88, attempt: 1 }
      };
    }
    
    if (errorConfig.responseCode === '99') {
      return {
        success: false,
        error: 'NIN not found in NIMC database',
        errorCode: 'NIN_NOT_FOUND',
        details: {
          responseCode: '99',
          message: 'NIN not found in NIMC database'
        }
      };
    }
  }

  // Check for successful responses
  if (MOCK_SUCCESSFUL_RESPONSES[nin]) {
    const response = MOCK_SUCCESSFUL_RESPONSES[nin];
    return {
      success: true,
      data: {
        firstName: response.ResponseData.FirstName,
        middleName: response.ResponseData.MiddleName,
        lastName: response.ResponseData.LastName,
        gender: response.ResponseData.Gender,
        dateOfBirth: response.ResponseData.DateOfBirth,
        phoneNumber: response.ResponseData.PhoneNumber,
        birthdate: response.ResponseData.birthdate,
        birthlga: response.ResponseData.birthlga,
        birthstate: response.ResponseData.birthstate,
        trackingId: response.ResponseData.trackingId
      },
      responseInfo: {
        responseCode: response.ResponseInfo.ResponseCode,
        parameter: response.ResponseInfo.Parameter,
        source: response.ResponseInfo.Source,
        message: response.ResponseInfo.Message,
        timestamp: response.ResponseInfo.Timestamp
      }
    };
  }

  // Check for mismatch responses
  if (MOCK_MISMATCH_RESPONSES[nin]) {
    const response = MOCK_MISMATCH_RESPONSES[nin];
    return {
      success: true,
      data: {
        firstName: response.ResponseData.FirstName,
        middleName: response.ResponseData.MiddleName,
        lastName: response.ResponseData.LastName,
        gender: response.ResponseData.Gender,
        dateOfBirth: response.ResponseData.DateOfBirth,
        phoneNumber: response.ResponseData.PhoneNumber,
        birthdate: response.ResponseData.birthdate,
        birthlga: response.ResponseData.birthlga,
        birthstate: response.ResponseData.birthstate,
        trackingId: response.ResponseData.trackingId
      },
      responseInfo: {
        responseCode: response.ResponseInfo.ResponseCode,
        parameter: response.ResponseInfo.Parameter,
        source: response.ResponseInfo.Source,
        message: response.ResponseInfo.Message,
        timestamp: response.ResponseInfo.Timestamp
      }
    };
  }

  // Default: NIN not found
  return {
    success: false,
    error: 'NIN not found in NIMC database. Please verify your NIN and try again.',
    errorCode: 'NIN_NOT_FOUND',
    details: {
      responseCode: '01',
      message: 'No results found'
    }
  };
}

/**
 * Mock utility functions (same as real implementation)
 */
function maskNIN(nin) {
  if (!nin || nin.length < 4) return '****';
  return nin.substring(0, 4) + '*'.repeat(nin.length - 4);
}

function normalizeString(str) {
  if (!str) return '';
  return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeGender(gender) {
  if (!gender) return '';
  const normalized = normalizeString(gender);
  
  if (normalized === 'm' || normalized === 'male') return 'male';
  if (normalized === 'f' || normalized === 'female') return 'female';
  
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

function normalizePhone(phone) {
  if (!phone) return '';
  
  let normalized = phone.toString().replace(/\D/g, '');
  
  if (normalized.startsWith('234')) {
    normalized = '0' + normalized.substring(3);
  }
  
  return normalized;
}

function matchFields(apiData, excelData) {
  const failedFields = [];
  const details = {};
  
  // Match First Name
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
  
  // Match Last Name
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
  
  // Match Gender
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
  
  // Match Date of Birth
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
  
  // Match Phone Number (optional)
  const apiPhone = normalizePhone(apiData.phoneNumber);
  const excelPhone = normalizePhone(excelData.phoneNumber || excelData['Phone Number'] || excelData['phone number']);
  const phoneMatched = apiPhone === excelPhone;
  
  details.phoneNumber = {
    api: apiData.phoneNumber,
    excel: excelData.phoneNumber || excelData['Phone Number'] || excelData['phone number'],
    matched: phoneMatched,
    optional: true
  };
  
  const matched = failedFields.length === 0;
  
  return {
    matched,
    failedFields,
    details
  };
}

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

function getMockSuccessNINs() {
  return Object.keys(MOCK_SUCCESSFUL_RESPONSES);
}

function getMockMismatchNINs() {
  return Object.keys(MOCK_MISMATCH_RESPONSES);
}

function getMockErrorNINs() {
  return Object.keys(MOCK_ERROR_NINS);
}

module.exports = {
  verifyNIN,
  maskNIN,
  matchFields,
  getUserFriendlyError,
  getTechnicalError,
  normalizeString,
  normalizeGender,
  parseDate,
  normalizePhone,
  // Test helpers
  setMockBehavior,
  resetMockBehavior,
  getMockSuccessNINs,
  getMockMismatchNINs,
  getMockErrorNINs
};
