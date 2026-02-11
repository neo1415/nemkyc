# CAC Verification: Step-by-Step Implementation Guide

**For**: Senior Developer implementing CAC verification  
**Time**: 1.5-2 days  
**Difficulty**: Low-Medium (90% code reuse)  

---

## Prerequisites

Before starting, ensure you have:
- ✅ Completed Datapro NIN implementation (Tasks 43-55)
- ✅ All NIN tests passing
- ✅ VerifyData API documentation reviewed
- ✅ Access to `.kiro/specs/identity-remediation/` folder
- ✅ Development environment set up

---

## Step 1: Create VerifyData Client (2-3 hours)

### 1.1 Copy Datapro Client as Template
```bash
cp server-services/dataproClient.cjs server-services/verifydataClient.cjs
```

### 1.2 Update File Header
```javascript
/**
 * VerifyData CAC Verification API Client
 * 
 * This module provides a secure, production-ready client for the VerifyData CAC verification API.
 * 
 * Features:
 * - Retry logic with exponential backoff (max 3 retries)
 * - 30-second timeout per request
 * - Comprehensive error handling for all response codes
 * - Structured logging with masked RC numbers
 * - Response parsing and validation
 * - Rate limiting (max 50 requests per minute)
 * 
 * Security:
 * - SECRET_KEY stored in environment variables
 * - RC number masked in logs (only first 4 digits shown)
 * - No sensitive data in error messages
 */
```

### 1.3 Update Configuration
```javascript
// OLD (Datapro)
const DATAPRO_API_URL = process.env.DATAPRO_API_URL || 'https://api.datapronigeria.com';
const DATAPRO_SERVICE_ID = process.env.DATAPRO_SERVICE_ID;

// NEW (VerifyData)
const VERIFYDATA_API_URL = process.env.VERIFYDATA_API_URL || 'https://vd.villextra.com';
const VERIFYDATA_SECRET_KEY = process.env.VERIFYDATA_SECRET_KEY;
```

### 1.4 Create httpsPost Function
```javascript
/**
 * Make HTTPS POST request with timeout
 * @param {string} url - Full URL to request
 * @param {object} body - Request body
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<{statusCode: number, data: string}>}
 */
function httpsPost(url, body, timeout) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const bodyString = JSON.stringify(body);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyString)
      },
      timeout: timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: data });
      });
    });

    req.on('error', (error) => { reject(error); });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(bodyString);
    req.end();
  });
}
```

### 1.5 Update maskNIN to maskRCNumber
```javascript
/**
 * Mask RC number for logging (show only first 4 chars)
 * @param {string} rcNumber - The RC number to mask
 * @returns {string} Masked RC number (e.g., "RC12*******")
 */
function maskRCNumber(rcNumber) {
  if (!rcNumber || rcNumber.length < 4) return '****';
  return rcNumber.substring(0, 4) + '*'.repeat(rcNumber.length - 4);
}
```

### 1.6 Create verifyCAC Function
```javascript
/**
 * Verify CAC using VerifyData API
 * 
 * @param {string} rcNumber - The RC number to verify
 * @returns {Promise<object>} Verification result
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

  // Construct request
  const url = `${VERIFYDATA_API_URL}/api/ValidateRcNumber/Initiate`;
  const body = {
    rcNumber: rcNumber,
    secretKey: VERIFYDATA_SECRET_KEY
  };

  console.log(`[VerifydataClient] Verifying CAC: ${maskRCNumber(rcNumber)}`);

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
      console.log(`[VerifydataClient] Attempt ${attempt}/${MAX_RETRIES} for CAC: ${maskRCNumber(rcNumber)}`);

      const response = await httpsPost(url, body, REQUEST_TIMEOUT);
      const { statusCode, data } = response;

      console.log(`[VerifydataClient] Response status: ${statusCode} for CAC: ${maskRCNumber(rcNumber)}`);

      // Handle different status codes
      if (statusCode === 200) {
        // Parse response
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (parseError) {
          console.error(`[VerifydataClient] Failed to parse response: ${parseError.message}`);
          return {
            success: false,
            error: 'Invalid response from verification service',
            errorCode: 'PARSE_ERROR',
            details: { parseError: parseError.message }
          };
        }

        // Check if success
        if (!parsedData.success) {
          console.warn(`[VerifydataClient] Verification failed: ${parsedData.message}`);
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

        // Success - extract relevant fields
        console.log(`[VerifydataClient] Verification successful for CAC: ${maskRCNumber(rcNumber)}`);
        return {
          success: true,
          data: {
            companyName: parsedData.data.name || null,
            registrationNumber: parsedData.data.registrationNumber || null,
            companyStatus: parsedData.data.companyStatus || null,
            registrationDate: parsedData.data.registrationDate || null,
            typeOfEntity: parsedData.data.typeOfEntity || null,
            country: parsedData.data.country || null
          },
          responseInfo: {
            statusCode: parsedData.statusCode,
            message: parsedData.message
          }
        };
      } else if (statusCode === 400) {
        // Parse error response
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (parseError) {
          console.error(`[VerifydataClient] Failed to parse error response`);
          return {
            success: false,
            error: 'Verification service error. Please contact support.',
            errorCode: 'BAD_REQUEST',
            details: { statusCode: 400 }
          };
        }

        // Handle specific error codes
        const errorCode = parsedData.statusCode;
        if (errorCode === 'FF') {
          console.error('[VerifydataClient] Invalid secret key (FF)');
          return {
            success: false,
            error: 'Verification service unavailable. Please contact support.',
            errorCode: 'INVALID_SECRET_KEY',
            details: { statusCode: 'FF' }
          };
        } else if (errorCode === 'IB') {
          console.error('[VerifydataClient] Insufficient balance (IB)');
          return {
            success: false,
            error: 'Verification service unavailable. Please contact support.',
            errorCode: 'INSUFFICIENT_BALANCE',
            details: { statusCode: 'IB' }
          };
        } else {
          console.error(`[VerifydataClient] Error: ${errorCode}`);
          return {
            success: false,
            error: 'Verification service unavailable. Please contact support.',
            errorCode: 'VERIFYDATA_ERROR',
            details: { statusCode: errorCode, message: parsedData.message }
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
  console.error(`[VerifydataClient] All ${MAX_RETRIES} attempts failed for CAC: ${maskRCNumber(rcNumber)}`);
  return lastError || {
    success: false,
    error: 'Network error. Please try again later.',
    errorCode: 'MAX_RETRIES_EXCEEDED',
    details: { maxRetries: MAX_RETRIES }
  };
}
```

### 1.7 Create Normalization Functions
```javascript
/**
 * Normalize company name for comparison
 * - Convert to lowercase
 * - Trim whitespace
 * - Handle Ltd/Limited/PLC variations
 * @param {string} name - Company name to normalize
 * @returns {string} Normalized company name
 */
function normalizeCompanyName(name) {
  if (!name) return '';
  let normalized = name.toString().toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Handle Ltd/Limited variations
  normalized = normalized.replace(/\blimited\b/g, 'ltd');
  normalized = normalized.replace(/\bplc\b/g, 'ltd');
  
  return normalized;
}

/**
 * Normalize RC number for comparison
 * - Remove RC prefix
 * - Convert to uppercase
 * - Remove spaces and dashes
 * @param {string} rcNumber - RC number to normalize
 * @returns {string} Normalized RC number
 */
function normalizeRCNumber(rcNumber) {
  if (!rcNumber) return '';
  
  let normalized = rcNumber.toString().toUpperCase().trim();
  
  // Remove RC prefix if present
  normalized = normalized.replace(/^RC/, '');
  
  // Remove spaces and dashes
  normalized = normalized.replace(/[\s-]/g, '');
  
  return normalized;
}
```

### 1.8 Create matchCACFields Function
```javascript
/**
 * Match fields between VerifyData API response and Excel data
 * 
 * @param {object} apiData - Data from VerifyData API
 * @param {object} excelData - Data from Excel upload
 * @returns {object} Match result
 */
function matchCACFields(apiData, excelData) {
  const failedFields = [];
  const details = {};
  
  // Match Company Name (required)
  const apiCompanyName = normalizeCompanyName(apiData.companyName);
  const excelCompanyName = normalizeCompanyName(
    excelData.companyName || 
    excelData['Company Name'] || 
    excelData['company name']
  );
  const companyNameMatched = apiCompanyName === excelCompanyName;
  
  details.companyName = {
    api: apiData.companyName,
    excel: excelData.companyName || excelData['Company Name'] || excelData['company name'],
    matched: companyNameMatched
  };
  
  if (!companyNameMatched) {
    failedFields.push('Company Name');
  }
  
  // Match Registration Number (required)
  const apiRCNumber = normalizeRCNumber(apiData.registrationNumber);
  const excelRCNumber = normalizeRCNumber(
    excelData.registrationNumber || 
    excelData['Registration Number'] || 
    excelData['RC Number'] ||
    excelData['rc number']
  );
  const rcNumberMatched = apiRCNumber === excelRCNumber;
  
  details.registrationNumber = {
    api: apiData.registrationNumber,
    excel: excelData.registrationNumber || excelData['Registration Number'] || excelData['RC Number'],
    matched: rcNumberMatched
  };
  
  if (!rcNumberMatched) {
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
    excel: excelData.registrationDate || excelData['Registration Date'],
    apiParsed: apiRegDate,
    excelParsed: excelRegDate,
    matched: regDateMatched
  };
  
  if (!regDateMatched) {
    failedFields.push('Registration Date');
  }
  
  // Validate Company Status (must be active)
  const companyStatus = apiData.companyStatus || '';
  const isActive = companyStatus.toLowerCase().includes('verified') || 
                   companyStatus.toLowerCase().includes('active');
  
  details.companyStatus = {
    api: apiData.companyStatus,
    isActive: isActive
  };
  
  if (!isActive) {
    failedFields.push('Company Status (not active)');
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
```

### 1.9 Update Error Message Functions
```javascript
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
    'VERIFYDATA_ERROR': 'Verification service unavailable. Please contact support.',
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
```

### 1.10 Update Module Exports
```javascript
module.exports = {
  verifyCAC,
  maskRCNumber,
  matchCACFields,
  getUserFriendlyError,
  getTechnicalError,
  // Export utility functions for testing
  normalizeCompanyName,
  normalizeRCNumber,
  parseDate  // Reuse from Datapro
};
```

---

## Step 2: Create Mock and Tests (1-2 hours)

### 2.1 Create Mock
```bash
cp server-services/__mocks__/dataproClient.cjs server-services/__mocks__/verifydataClient.cjs
```

Update mock to return CAC data instead of NIN data.

### 2.2 Create Tests
```bash
cp server-services/__tests__/dataproClient.test.cjs server-services/__tests__/verifydataClient.test.cjs
```

Update tests for CAC verification.

---

## Step 3: Update Configuration (30 minutes)

### 3.1 Update verificationConfig.ts
```typescript
export interface VerificationConfig {
  mode: VerificationMode;
  
  // ... existing fields
  
  // VerifyData API Configuration (CAC verification)
  verifydataApiUrl?: string;
  verifydataSecretKey?: string;
}

export const verificationConfig: VerificationConfig = {
  mode: (process.env.VERIFICATION_MODE as VerificationMode) || 'mock',
  
  // ... existing config
  
  // VerifyData API Configuration (CAC verification)
  verifydataApiUrl: process.env.VERIFYDATA_API_URL || 'https://vd.villextra.com',
  verifydataSecretKey: process.env.VERIFYDATA_SECRET_KEY || '',
};
```

### 3.2 Update .env.local
```bash
# VerifyData CAC Verification
VERIFYDATA_API_URL=https://vd.villextra.com
VERIFYDATA_SECRET_KEY=your_secret_key_here
```

---

## Step 4: Update Rate Limiter (30 minutes)

### 4.1 Add to rateLimiter.cjs
```javascript
// Add after applyDataproRateLimit function
async function applyVerifydataRateLimit() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Remove old requests
  verifydataRequestTimestamps = verifydataRequestTimestamps.filter(
    timestamp => timestamp > windowStart
  );
  
  // Check if limit exceeded
  if (verifydataRequestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestRequest = verifydataRequestTimestamps[0];
    const waitTime = RATE_LIMIT_WINDOW - (now - oldestRequest);
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
  }
  
  // Add current request
  verifydataRequestTimestamps.push(now);
}

module.exports = {
  applyDataproRateLimit,
  applyVerifydataRateLimit  // Add this
};
```

---

## Step 5: Update Server Endpoints (2-3 hours)

### 5.1 Import VerifyData Client in server.js
```javascript
const dataproClient = require('./server-services/dataproClient.cjs');
const verifydataClient = require('./server-services/verifydataClient.cjs');  // Add this
```

### 5.2 Update Verification Endpoint
Find the `POST /api/identity/verify/:token` endpoint and add CAC routing:

```javascript
// After NIN verification logic, add:
} else if (verificationType === 'CAC') {
  // Decrypt CAC number
  const decryptedCAC = decrypt(entry.cac);
  
  // Call VerifyData API
  const verificationResult = await verifydataClient.verifyCAC(decryptedCAC);
  
  if (verificationResult.success) {
    // Perform field matching
    const matchResult = verifydataClient.matchCACFields(
      verificationResult.data,
      entry.data
    );
    
    if (matchResult.matched) {
      // Success - update entry
      await entryRef.update({
        status: 'verified',
        verificationDetails: {
          ...verificationResult.data,
          matchDetails: matchResult.details,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
      
      // Send success notification
      // ... (same as NIN)
    } else {
      // Field mismatch
      // ... (same as NIN)
    }
  } else {
    // Verification failed
    // ... (same as NIN)
  }
}
```

### 5.3 Update Bulk Verification Endpoint
Similar changes to `POST /api/identity/lists/:listId/bulk-verify`

---

## Step 6: Test Everything (2-3 hours)

### 6.1 Run Unit Tests
```bash
npm test server-services/__tests__/verifydataClient.test.cjs
```

### 6.2 Run Integration Tests
```bash
npm test src/__tests__/cac/
```

### 6.3 Manual Testing
1. Upload CAC list
2. Send verification requests
3. Submit CAC
4. Verify results

---

## Step 7: Documentation (1 hour)

Update all documentation files as specified in tasks 63.1-63.4.

---

## Checklist

### Before Starting
- [ ] Read all planning documents
- [ ] Review Datapro implementation
- [ ] Understand VerifyData API

### During Implementation
- [ ] Create verifydataClient.cjs
- [ ] Create mock and tests
- [ ] Update configuration
- [ ] Update rate limiter
- [ ] Update server endpoints
- [ ] Run all tests
- [ ] Update documentation

### Before Deployment
- [ ] All tests passing
- [ ] Code review complete
- [ ] Security audit complete
- [ ] Documentation updated
- [ ] Credentials obtained
- [ ] Backup database

---

## Common Pitfalls to Avoid

1. ❌ **Don't** copy-paste without updating function names
2. ❌ **Don't** forget to change GET to POST
3. ❌ **Don't** forget to move auth from header to body
4. ❌ **Don't** forget to update error codes
5. ❌ **Don't** forget to update field matching logic
6. ❌ **Don't** log secret key (even masked)
7. ❌ **Don't** expose secret key to frontend

---

## Need Help?

- **Planning Docs**: `.kiro/specs/identity-remediation/CAC_*.md`
- **Tasks**: `.kiro/specs/identity-remediation/tasks.md` (Tasks 56-65)
- **Comparison**: `CAC_VS_NIN_COMPARISON.md`
- **Summary**: `CAC_IMPLEMENTATION_SUMMARY.md`

---

**Good luck! You've got this! 🚀**
