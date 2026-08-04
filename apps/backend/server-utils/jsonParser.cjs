/**
 * JSON Parser Utility (Backend)
 * 
 * Provides safe JSON parsing with comprehensive error handling.
 * Handles empty responses, malformed JSON, and provides structured error responses.
 */

/**
 * @typedef {Object} JSONParseResult
 * @property {boolean} success - Whether parsing succeeded
 * @property {any} [data] - Parsed data if successful
 * @property {string} [error] - Error message if failed
 * @property {string} [errorCode] - Error code (e.g., 'PARSE_ERROR', 'EMPTY_RESPONSE')
 * @property {Object} [details] - Additional error context
 */

/**
 * Safely parses a JSON string with comprehensive error handling
 * 
 * @param {string} jsonString - The JSON string to parse
 * @param {Object} [context={}] - Context information for error logging
 * @returns {JSONParseResult} Parse result with data or error
 */
function safeJSONParse(jsonString, context = {}) {
  // Check if jsonString is null or undefined
  if (jsonString === null || jsonString === undefined) {
    const error = 'Response body is null or undefined';
    console.error(`[JSONParser] ${error}`, context);
    
    return {
      success: false,
      error,
      errorCode: 'EMPTY_RESPONSE',
      details: {
        responseLength: 0,
        ...context
      }
    };
  }

  // Check if jsonString is not a string
  if (typeof jsonString !== 'string') {
    const error = `Response body is not a string (type: ${typeof jsonString})`;
    console.error(`[JSONParser] ${error}`, context);
    
    return {
      success: false,
      error,
      errorCode: 'INVALID_TYPE',
      details: {
        type: typeof jsonString,
        ...context
      }
    };
  }

  // Check if string is empty or whitespace-only
  if (jsonString.trim() === '') {
    const error = 'Response body is empty or whitespace-only';
    console.error(`[JSONParser] ${error}`, context);
    
    return {
      success: false,
      error,
      errorCode: 'EMPTY_RESPONSE',
      details: {
        responseLength: jsonString.length,
        ...context
      }
    };
  }

  // Try to parse the JSON
  try {
    const data = JSON.parse(jsonString);
    
    return {
      success: true,
      data
    };
  } catch (parseError) {
    const error = 'Failed to parse JSON response';
    console.error(`[JSONParser] ${error}:`, parseError.message, context);
    
    return {
      success: false,
      error,
      errorCode: 'PARSE_ERROR',
      details: {
        parseError: parseError.message,
        responseLength: jsonString.length,
        responsePreview: jsonString.substring(0, 100), // First 100 chars for debugging
        ...context
      }
    };
  }
}

/**
 * Checks if a string is valid JSON
 * 
 * @param {string} jsonString - The string to check
 * @returns {boolean} True if the string is valid JSON
 */
function isValidJSON(jsonString) {
  if (typeof jsonString !== 'string' || jsonString.trim() === '') {
    return false;
  }

  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  safeJSONParse,
  isValidJSON
};
