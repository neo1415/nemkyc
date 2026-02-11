/**
 * Verification Error Handling Utility
 * 
 * Provides structured error handling for identity verification failures,
 * including user-friendly and technical error messages.
 */

export interface VerificationError {
  success: false;
  errorType: 'field_mismatch' | 'api_error' | 'invalid_input' | 'max_attempts' | 'expired_token' | 'nin_not_found' | 'network_error' | 'service_unavailable' | 'invalid_format';
  failedFields?: string[];
  message: string;
  customerMessage: string;
  staffMessage: string;
  brokerEmail?: string;
  technicalDetails?: Record<string, any>;
  dataproErrorCode?: string;
}

export interface VerificationSuccess {
  success: true;
  message: string;
  verifiedData: Record<string, any>;
}

export type VerificationResult = VerificationSuccess | VerificationError;

/**
 * Generate a user-friendly error message for customers
 */
export function generateCustomerMessage(
  errorType: VerificationError['errorType'],
  failedFields?: string[],
  brokerEmail?: string
): string {
  switch (errorType) {
    case 'field_mismatch':
      const fieldList = failedFields && failedFields.length > 0
        ? failedFields.map(field => formatFieldName(field)).join(', ')
        : 'some of your information';
      
      return `We were unable to verify your identity because ${fieldList} did not match our records. This could be due to a typo or outdated information in our system.\n\nNext Steps:\nPlease contact your broker${brokerEmail ? ` at ${brokerEmail}` : ''} to resolve this issue. They will help ensure your information is correct and matches your official documents.`;
    
    case 'nin_not_found':
      return `We could not find your NIN in the National Identity Management Commission (NIMC) database. This may occur if:\n\n• Your NIN was recently issued and not yet synchronized\n• There was a typo in the NIN you entered\n• Your NIN enrollment is still being processed\n\nNext Steps:\nPlease verify your NIN is correct and try again. If the problem persists, contact your broker${brokerEmail ? ` at ${brokerEmail}` : ''} for assistance.`;
    
    case 'network_error':
      return `We're experiencing temporary connectivity issues with the verification service. This is usually resolved quickly.\n\nNext Steps:\nPlease try again in a few minutes. If the problem persists after multiple attempts, contact your broker${brokerEmail ? ` at ${brokerEmail}` : ''} for assistance.`;
    
    case 'service_unavailable':
      return `The verification service is temporarily unavailable. This may be due to scheduled maintenance or technical issues.\n\nNext Steps:\nPlease try again later. If you need urgent assistance, contact your broker${brokerEmail ? ` at ${brokerEmail}` : ''}.`;
    
    case 'invalid_format':
      return `The NIN you entered appears to be in an invalid format. A valid NIN must be exactly 11 digits.\n\nNext Steps:\nPlease check your NIN and try again. Make sure you're entering only numbers without spaces or dashes. If you continue to experience issues, contact your broker${brokerEmail ? ` at ${brokerEmail}` : ''} for assistance.`;
    
    case 'api_error':
      return `We're experiencing technical difficulties with our verification service. Please try again in a few minutes.\n\nIf the problem persists, please contact your broker${brokerEmail ? ` at ${brokerEmail}` : ''} for assistance.`;
    
    case 'invalid_input':
      return `The information you provided appears to be invalid. Please check that you've entered your identification number correctly.\n\nIf you continue to experience issues, please contact your broker${brokerEmail ? ` at ${brokerEmail}` : ''} for assistance.`;
    
    case 'max_attempts':
      return `You have reached the maximum number of verification attempts. For security reasons, this verification link has been disabled.\n\nPlease contact your broker${brokerEmail ? ` at ${brokerEmail}` : ''} to request a new verification link.`;
    
    case 'expired_token':
      return `This verification link has expired. For security reasons, verification links are only valid for a limited time.\n\nPlease contact your broker${brokerEmail ? ` at ${brokerEmail}` : ''} to request a new verification link.`;
    
    default:
      return `An unexpected error occurred during verification. Please contact your broker${brokerEmail ? ` at ${brokerEmail}` : ''} for assistance.`;
  }
}

/**
 * Generate a technical error message for staff
 */
export function generateStaffMessage(
  errorType: VerificationError['errorType'],
  failedFields?: string[],
  customerName?: string,
  policyNumber?: string,
  verificationType?: 'NIN' | 'CAC',
  technicalDetails?: Record<string, any>
): string {
  let message = `Verification Failure Alert\n\n`;
  
  if (customerName) {
    message += `Customer: ${customerName}\n`;
  }
  
  if (policyNumber) {
    message += `Policy Number: ${policyNumber}\n`;
  }
  
  if (verificationType) {
    message += `Verification Type: ${verificationType}\n`;
  }
  
  message += `Error Type: ${formatErrorType(errorType)}\n`;
  
  if (technicalDetails?.dataproErrorCode) {
    message += `Datapro Error Code: ${technicalDetails.dataproErrorCode}\n`;
  }
  
  message += `\n`;
  
  switch (errorType) {
    case 'field_mismatch':
      message += `Failed Fields:\n`;
      if (failedFields && failedFields.length > 0) {
        failedFields.forEach(field => {
          message += `  - ${formatFieldName(field)}\n`;
        });
      } else {
        message += `  - Multiple fields did not match\n`;
      }
      
      if (technicalDetails?.matchDetails) {
        message += `\nField Comparison Details:\n`;
        const details = technicalDetails.matchDetails;
        Object.keys(details).forEach(field => {
          const fieldDetail = details[field];
          if (!fieldDetail.matched && !fieldDetail.optional) {
            message += `  ${formatFieldName(field)}:\n`;
            message += `    - API Value: ${fieldDetail.api || 'N/A'}\n`;
            message += `    - Excel Value: ${fieldDetail.excel || 'N/A'}\n`;
          }
        });
      }
      
      message += `\nAction Required:\nPlease verify that the data provided in the uploaded list is accurate and matches the customer's official documents. Contact the customer if necessary to confirm their information.`;
      break;
    
    case 'nin_not_found':
      message += `The NIN was not found in the NIMC database.\n\n`;
      message += `Possible Causes:\n`;
      message += `  - NIN recently issued and not yet synchronized\n`;
      message += `  - Incorrect NIN provided by customer\n`;
      message += `  - NIN enrollment still being processed\n\n`;
      if (technicalDetails) {
        message += `Technical Details:\n${JSON.stringify(technicalDetails, null, 2)}\n\n`;
      }
      message += `Action Required:\nContact the customer to verify their NIN is correct. If the NIN is confirmed correct, advise the customer to contact NIMC to check their enrollment status.`;
      break;
    
    case 'network_error':
      message += `A network error occurred while attempting to verify the identity.\n\n`;
      if (technicalDetails) {
        message += `Technical Details:\n`;
        message += `  - Error: ${technicalDetails.message || 'Network timeout or connection failure'}\n`;
        message += `  - Attempts: ${technicalDetails.attempt || 'Unknown'}\n`;
        message += `  - Is Timeout: ${technicalDetails.isTimeout ? 'Yes' : 'No'}\n\n`;
      }
      message += `Action Required:\nThis is typically a temporary issue. The system will automatically retry. If the issue persists, check the Datapro API status or contact IT support.`;
      break;
    
    case 'service_unavailable':
      message += `The Datapro verification service is unavailable.\n\n`;
      if (technicalDetails) {
        message += `Technical Details:\n`;
        message += `  - Status Code: ${technicalDetails.statusCode || 'Unknown'}\n`;
        message += `  - Error Code: ${technicalDetails.dataproErrorCode || 'Unknown'}\n\n`;
      }
      message += `Action Required:\nCheck the Datapro API status. This may be due to scheduled maintenance or service outage. Contact Datapro support if the issue persists.`;
      break;
    
    case 'invalid_format':
      message += `The NIN provided is in an invalid format.\n\n`;
      message += `Expected Format: 11 digits\n`;
      if (technicalDetails?.nin) {
        message += `Provided: ${technicalDetails.nin}\n\n`;
      }
      message += `Action Required:\nVerify the NIN in the uploaded Excel file is correct and contains exactly 11 digits with no spaces or special characters.`;
      break;
    
    case 'api_error':
      message += `The verification API returned an error. This may be a temporary service issue.\n\n`;
      if (technicalDetails) {
        message += `Technical Details:\n${JSON.stringify(technicalDetails, null, 2)}\n\n`;
      }
      message += `Action Required:\nMonitor the situation. If the issue persists, contact the API provider or IT support.`;
      break;
    
    case 'invalid_input':
      message += `The customer provided invalid input that could not be processed.\n\nAction Required:\nContact the customer to verify they have the correct identification number.`;
      break;
    
    case 'max_attempts':
      message += `The customer has exceeded the maximum number of verification attempts.\n\nAction Required:\nReview the customer's information and resend a new verification link if appropriate.`;
      break;
    
    case 'expired_token':
      message += `The customer attempted to use an expired verification link.\n\nAction Required:\nResend a new verification link to the customer.`;
      break;
    
    default:
      message += `An unexpected error occurred.\n\nAction Required:\nInvestigate the issue and contact technical support if necessary.`;
  }
  
  return message;
}

/**
 * Create a structured verification error
 */
export function createVerificationError(
  errorType: VerificationError['errorType'],
  options: {
    failedFields?: string[];
    brokerEmail?: string;
    customerName?: string;
    policyNumber?: string;
    verificationType?: 'NIN' | 'CAC';
    technicalDetails?: Record<string, any>;
    message?: string;
    dataproErrorCode?: string;
  } = {}
): VerificationError {
  const {
    failedFields,
    brokerEmail,
    customerName,
    policyNumber,
    verificationType,
    technicalDetails,
    message,
    dataproErrorCode
  } = options;
  
  return {
    success: false,
    errorType,
    failedFields,
    message: message || formatErrorType(errorType),
    customerMessage: generateCustomerMessage(errorType, failedFields, brokerEmail),
    staffMessage: generateStaffMessage(
      errorType,
      failedFields,
      customerName,
      policyNumber,
      verificationType,
      technicalDetails
    ),
    brokerEmail,
    technicalDetails,
    dataproErrorCode
  };
}

/**
 * Format field names for display
 */
function formatFieldName(field: string): string {
  const fieldMap: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    middleName: 'Middle Name',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    bvn: 'BVN',
    nin: 'NIN',
    companyName: 'Company Name',
    registrationNumber: 'Registration Number',
    registrationDate: 'Registration Date',
    businessAddress: 'Business Address',
    cac: 'CAC Number'
  };
  
  return fieldMap[field] || field.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Format error type for display
 */
function formatErrorType(errorType: VerificationError['errorType']): string {
  const typeMap: Record<string, string> = {
    field_mismatch: 'Field Mismatch',
    api_error: 'API Error',
    invalid_input: 'Invalid Input',
    max_attempts: 'Maximum Attempts Exceeded',
    expired_token: 'Expired Token',
    nin_not_found: 'NIN Not Found',
    network_error: 'Network Error',
    service_unavailable: 'Service Unavailable',
    invalid_format: 'Invalid Format'
  };
  
  return typeMap[errorType] || errorType;
}

/**
 * Check if a result is an error
 */
export function isVerificationError(result: VerificationResult): result is VerificationError {
  return result.success === false;
}

/**
 * Check if a result is successful
 */
export function isVerificationSuccess(result: VerificationResult): result is VerificationSuccess {
  return result.success === true;
}

/**
 * Map Datapro error codes to verification error types
 */
export function mapDataproErrorToType(dataproErrorCode: string): VerificationError['errorType'] {
  const errorMap: Record<string, VerificationError['errorType']> = {
    'INVALID_INPUT': 'invalid_input',
    'INVALID_FORMAT': 'invalid_format',
    'NOT_CONFIGURED': 'service_unavailable',
    'BAD_REQUEST': 'invalid_format',
    'UNAUTHORIZED': 'service_unavailable',
    'INVALID_SERVICE_ID': 'service_unavailable',
    'NETWORK_ERROR': 'network_error',
    'UNEXPECTED_STATUS': 'api_error',
    'PARSE_ERROR': 'api_error',
    'INVALID_RESPONSE': 'api_error',
    'NIN_NOT_FOUND': 'nin_not_found',
    'MAX_RETRIES_EXCEEDED': 'network_error',
    'FIELD_MISMATCH': 'field_mismatch',
    'RATE_LIMIT_EXCEEDED': 'service_unavailable'
  };
  
  return errorMap[dataproErrorCode] || 'api_error';
}

/**
 * Create a verification error from Datapro API response
 */
export function createDataproVerificationError(
  dataproErrorCode: string,
  dataproError: string,
  options: {
    failedFields?: string[];
    brokerEmail?: string;
    customerName?: string;
    policyNumber?: string;
    verificationType?: 'NIN' | 'CAC';
    technicalDetails?: Record<string, any>;
  } = {}
): VerificationError {
  const errorType = mapDataproErrorToType(dataproErrorCode);
  
  return createVerificationError(errorType, {
    ...options,
    message: dataproError,
    technicalDetails: {
      ...options.technicalDetails,
      dataproErrorCode,
      dataproError
    }
  });
}
