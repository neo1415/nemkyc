# Datapro API Configuration - Implementation Summary

## Task 44: Configure Datapro API Credentials

**Status:** ✅ Completed

### Overview
Implemented comprehensive configuration management for the Datapro NIN verification API, including environment variables, verification mode switching, and server startup validation.

---

## Subtask 44.1: Update Environment Variables ✅

### Changes Made

**File:** `.env.example`

Added the following environment variables:

```bash
# ============= DATAPRO API CONFIGURATION =============

# Verification Mode
# Options: 'mock' (development/testing), 'datapro' (production NIN verification), 
#          'paystack' (legacy), 'production' (all APIs)
# Default: 'mock'
VERIFICATION_MODE=mock

# Datapro NIN Verification API
# Base URL for Datapro API
DATAPRO_API_URL=https://api.datapronigeria.com

# Datapro Service ID (Merchant ID)
# How to obtain: Contact Datapro Nigeria (https://datapronigeria.com) to register as a merchant
# They will provide you with a SERVICEID after account setup and verification
# This ID is used in the SERVICEID header for all API requests
DATAPRO_SERVICE_ID=your_datapro_service_id_here
```

### Documentation Added

- **VERIFICATION_MODE**: Controls which verification service to use
  - `mock`: Development/testing mode (no real API calls)
  - `datapro`: Production NIN verification via Datapro API
  - `paystack`: Legacy verification via Paystack
  - `production`: All APIs enabled

- **DATAPRO_API_URL**: Base URL for Datapro API (default: https://api.datapronigeria.com)

- **DATAPRO_SERVICE_ID**: Merchant ID provided by Datapro
  - Includes instructions on how to obtain from Datapro Nigeria
  - Used in SERVICEID header for all API requests

- **ENCRYPTION_KEY**: Already existed, confirmed it's documented for NDPR compliance

---

## Subtask 44.2: Update Verification Config ✅

### Changes Made

**File:** `src/config/verificationConfig.ts`

#### 1. Extended VerificationMode Type
```typescript
export type VerificationMode = 'mock' | 'datapro' | 'paystack' | 'production';
```

#### 2. Enhanced VerificationConfig Interface
Added Datapro-specific fields:
```typescript
export interface VerificationConfig {
  mode: VerificationMode;
  
  // Datapro API Configuration (NIN verification)
  dataproApiUrl?: string;
  dataproServiceId?: string;
  
  // ... existing fields ...
}
```

#### 3. Updated Configuration Object
```typescript
export const verificationConfig: VerificationConfig = {
  mode: (process.env.VERIFICATION_MODE as VerificationMode) || 'mock',
  
  // Datapro API Configuration
  dataproApiUrl: process.env.DATAPRO_API_URL || 'https://api.datapronigeria.com',
  dataproServiceId: process.env.DATAPRO_SERVICE_ID || '',
  
  // ... existing configurations ...
};
```

#### 4. New Helper Functions

**`isDataproMode()`**
```typescript
export function isDataproMode(): boolean {
  return verificationConfig.mode === 'datapro';
}
```

**`isPaystackMode()`**
```typescript
export function isPaystackMode(): boolean {
  return verificationConfig.mode === 'paystack';
}
```

**`isMockMode()`**
```typescript
export function isMockMode(): boolean {
  return verificationConfig.mode === 'mock';
}
```

#### 5. Enhanced Credential Validation

Updated `hasRequiredCredentials()` to check mode-specific requirements:
```typescript
export function hasRequiredCredentials(): boolean {
  if (verificationConfig.mode === 'mock') {
    return true; // Mock mode doesn't need credentials
  }
  
  if (verificationConfig.mode === 'datapro') {
    return !!(
      verificationConfig.dataproApiUrl &&
      verificationConfig.dataproServiceId
    );
  }
  
  if (verificationConfig.mode === 'paystack') {
    return !!(
      verificationConfig.ninBvnApiKey &&
      verificationConfig.cacApiKey
    );
  }
  
  // Production mode requires all credentials
  return !!(
    verificationConfig.dataproServiceId &&
    verificationConfig.ninBvnApiKey &&
    verificationConfig.cacApiKey
  );
}
```

---

## Subtask 44.3: Validate Configuration on Server Startup ✅

### Changes Made

**File:** `server.js`

#### 1. Configuration Validation Function

Added comprehensive validation function before server startup:

```javascript
function validateServerConfiguration() {
  logger.info('Validating server configuration...');
  
  const errors = [];
  const warnings = [];
  
  // Check ENCRYPTION_KEY (required for NDPR compliance)
  if (!process.env.ENCRYPTION_KEY) {
    errors.push('ENCRYPTION_KEY is not set. This is required for NDPR compliance.');
    errors.push('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  } else if (process.env.ENCRYPTION_KEY.length !== 64) {
    warnings.push('ENCRYPTION_KEY should be 64 characters (32 bytes hex). Current length: ' + process.env.ENCRYPTION_KEY.length);
  }
  
  // Check verification mode
  const verificationMode = process.env.VERIFICATION_MODE || 'mock';
  logger.info(`Verification mode: ${verificationMode}`);
  
  // Check Datapro credentials if in datapro mode
  if (verificationMode === 'datapro') {
    if (!process.env.DATAPRO_SERVICE_ID) {
      errors.push('DATAPRO_SERVICE_ID is not set but verification mode is "datapro".');
      errors.push('Contact Datapro Nigeria (https://datapronigeria.com) to obtain a SERVICEID.');
    }
    
    if (!process.env.DATAPRO_API_URL) {
      warnings.push('DATAPRO_API_URL is not set. Using default: https://api.datapronigeria.com');
    }
    
    logger.success('Datapro API configuration validated');
  }
  
  // Check if in production environment without proper credentials
  if (process.env.NODE_ENV === 'production') {
    if (verificationMode === 'mock') {
      warnings.push('Running in production with mock verification mode. This should only be used for testing.');
    }
    
    if (!process.env.ENCRYPTION_KEY) {
      errors.push('ENCRYPTION_KEY must be set in production for NDPR compliance.');
    }
    
    if (verificationMode === 'datapro' && !process.env.DATAPRO_SERVICE_ID) {
      errors.push('DATAPRO_SERVICE_ID must be set in production when using datapro mode.');
    }
  }
  
  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Configuration warnings:');
    warnings.forEach(warning => logger.warn(`  - ${warning}`));
  }
  
  // Log errors and exit if critical
  if (errors.length > 0) {
    logger.error('Configuration errors:');
    errors.forEach(error => logger.error(`  - ${error}`));
    
    if (process.env.NODE_ENV === 'production') {
      logger.error('Cannot start server in production with configuration errors. Exiting...');
      process.exit(1);
    } else {
      logger.warn('Configuration errors detected but continuing in development mode.');
      logger.warn('Please fix these issues before deploying to production.');
    }
  } else {
    logger.success('Server configuration validated successfully');
  }
  
  return { errors, warnings };
}

// Run configuration validation
const configValidation = validateServerConfiguration();
```

#### 2. Enhanced Server Startup Logging

Updated server startup logs to display configuration status:

```javascript
app.listen(port, async () => {
  console.log('='.repeat(80));
  console.log(`🚀 SERVER STARTED - UPDATED VERSION WITH COLLECTION MAPPING FIX`);
  console.log(`Server running on port ${port}`);
  console.log(`📝 Events logging: ${EVENTS_CONFIG.ENABLE_EVENTS_LOGGING ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🌐 IP geolocation: ${EVENTS_CONFIG.ENABLE_IP_GEOLOCATION ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔐 Encryption: ${process.env.ENCRYPTION_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log(`🔍 Verification mode: ${process.env.VERIFICATION_MODE || 'mock'}`);
  if (configValidation.warnings.length > 0) {
    console.log(`⚠️  Configuration warnings: ${configValidation.warnings.length}`);
  }
  if (configValidation.errors.length > 0) {
    console.log(`❌ Configuration errors: ${configValidation.errors.length}`);
  }
  console.log('='.repeat(80));
  // ... rest of startup code
});
```

### Validation Features

#### ✅ ENCRYPTION_KEY Validation
- Checks if ENCRYPTION_KEY is set (required for NDPR compliance)
- Validates key length (should be 64 characters = 32 bytes hex)
- Provides generation command if missing

#### ✅ Verification Mode Validation
- Logs current verification mode
- Validates mode-specific requirements

#### ✅ Datapro Credentials Validation
- When mode is 'datapro':
  - Checks if DATAPRO_SERVICE_ID is set
  - Warns if DATAPRO_API_URL is missing (uses default)
  - Provides instructions on obtaining SERVICEID

#### ✅ Production Environment Checks
- Prevents production deployment with mock mode (warning)
- Requires ENCRYPTION_KEY in production
- Requires DATAPRO_SERVICE_ID in production when using datapro mode
- **Exits server if critical errors in production**

#### ✅ Development Mode Behavior
- Logs warnings but continues server startup
- Allows testing without all credentials
- Reminds developer to fix issues before production

---

## Security Features

### 1. Credential Protection
- All API credentials stored in environment variables
- Never exposed to frontend
- Validated on server startup

### 2. NDPR Compliance
- ENCRYPTION_KEY validation ensures PII encryption capability
- Prevents server start in production without encryption

### 3. Production Safety
- Server exits if critical configuration missing in production
- Warnings for insecure configurations
- Clear error messages with remediation steps

---

## Usage Instructions

### For Development

1. Copy `.env.example` to `.env.local`
2. Set `VERIFICATION_MODE=mock` (default)
3. Generate ENCRYPTION_KEY:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Start server - it will run with mock verification

### For Production with Datapro

1. Set `VERIFICATION_MODE=datapro`
2. Set `DATAPRO_SERVICE_ID` (obtain from Datapro Nigeria)
3. Set `DATAPRO_API_URL=https://api.datapronigeria.com`
4. Set `ENCRYPTION_KEY` (32-byte hex)
5. Set `NODE_ENV=production`
6. Start server - validation will ensure all required credentials are present

### Obtaining Datapro Credentials

1. Visit https://datapronigeria.com
2. Register as a merchant
3. Complete account verification
4. Receive SERVICEID from Datapro
5. Add SERVICEID to environment variables

---

## Testing

### Configuration Validation Tests

The validation function checks:
- ✅ ENCRYPTION_KEY presence and length
- ✅ Verification mode setting
- ✅ Mode-specific credential requirements
- ✅ Production environment safety
- ✅ Appropriate warnings and errors

### Server Startup Logs

When server starts, you'll see:
```
================================================================================
🚀 SERVER STARTED - UPDATED VERSION WITH COLLECTION MAPPING FIX
Server running on port 3001
📝 Events logging: ENABLED
🌐 IP geolocation: DISABLED
🔐 Encryption: CONFIGURED
🔍 Verification mode: mock
================================================================================
```

If there are issues:
```
⚠️  Configuration warnings: 1
❌ Configuration errors: 2
```

---

## Next Steps

This task prepares the system for Datapro API integration. The next tasks will:

1. **Task 45**: Implement Datapro NIN verification service
   - Create API client
   - Implement response parsing
   - Add field-level matching logic

2. **Task 46**: Update verification endpoints
   - Replace mock verification with Datapro
   - Implement bulk verification
   - Add rate limiting

3. **Task 47**: Implement error notifications
   - Customer-friendly error messages
   - Staff technical notifications

---

## Files Modified

1. `.env.example` - Added Datapro configuration variables
2. `src/config/verificationConfig.ts` - Enhanced with Datapro support
3. `server.js` - Added configuration validation on startup

---

## Compliance & Security

✅ **NDPR Compliance**: ENCRYPTION_KEY validation ensures PII protection  
✅ **API Security**: Credentials stored in environment variables only  
✅ **Production Safety**: Server exits if critical config missing  
✅ **Clear Documentation**: Instructions for obtaining and configuring credentials  
✅ **Development Friendly**: Allows testing without production credentials  

---

**Implementation Date:** February 5, 2026  
**Status:** Ready for Datapro API integration (Task 45)
