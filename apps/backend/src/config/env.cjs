'use strict';

/**
 * Startup configuration validation, moved verbatim from server.js. It reads process.env directly
 * (this is the one place that should) and reports through the server's logger.
 */
function createConfigValidation({ logger }) {
/**
 * Validate server configuration on startup
 * Checks for required environment variables and API credentials
 */
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
    
    // Check VerifyData credentials for CAC verification
    if (!process.env.VERIFYDATA_SECRET_KEY) {
      errors.push('VERIFYDATA_SECRET_KEY is not set but verification mode is "datapro".');
      errors.push('CAC verification requires VerifyData API credentials.');
      errors.push('Visit https://vd.villextra.com to create an account and obtain a secret key.');
    }
    
    if (!process.env.VERIFYDATA_API_URL) {
      warnings.push('VERIFYDATA_API_URL is not set. Using default: https://vd.villextra.com');
    }
    
    if (process.env.DATAPRO_SERVICE_ID && process.env.VERIFYDATA_SECRET_KEY) {
      logger.success('Datapro API configuration validated');
      logger.success('VerifyData API configuration validated');
    }
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
    
    if (verificationMode === 'datapro' && !process.env.VERIFYDATA_SECRET_KEY) {
      errors.push('VERIFYDATA_SECRET_KEY must be set in production when using datapro mode for CAC verification.');
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

  return { validateServerConfiguration };
}

module.exports = { createConfigValidation };
