/**
 * Verification Error Handling Utility
 * 
 * Provides structured error handling for identity verification failures,
 * including user-friendly and technical error messages.
 */

export interface VerificationError {
  success: false;
  errorType: 'field_mismatch' | 'api_error' | 'invalid_input' | 'max_attempts' | 'expired_token';
  failedFields?: string[];
  message: string;
  customerMessage: string;
  staffMessage: string;
  brokerEmail?: string;
  technicalDetails?: Record<string, any>;
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
  
  message += `Error Type: ${formatErrorType(errorType)}\n\n`;
  
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
      message += `\nAction Required:\nPlease verify that the data provided in the uploaded list is accurate and matches the customer's official documents. Contact the customer if necessary to confirm their information.`;
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
  } = {}
): VerificationError {
  const {
    failedFields,
    brokerEmail,
    customerName,
    policyNumber,
    verificationType,
    technicalDetails,
    message
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
    technicalDetails
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
    expired_token: 'Expired Token'
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
