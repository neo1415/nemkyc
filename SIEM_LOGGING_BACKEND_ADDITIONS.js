// ============= CENTRALIZED REQUEST LOGGING MIDDLEWARE =============
// Add this to server.js after the logAction function

/**
 * Parse user agent to extract device, browser, and OS information
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { deviceType: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  
  const ua = userAgent.toLowerCase();
  
  // Device type
  let deviceType = 'Desktop';
  if (ua.includes('mobile')) deviceType = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'Tablet';
  
  // Browser
  let browser = 'Unknown';
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // OS
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  return { deviceType, browser, os };
};

/**
 * Sanitize request body to remove sensitive data
 */
const sanitizeRequestBody = (body) => {
  if (!body) return null;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'privateKey'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  // Limit size
  const str = JSON.stringify(sanitized);
  if (str.length > 1000) {
    return { ...sanitized, _truncated: true, _originalSize: str.length };
  }
  
  return sanitized;
};

/**
 * Centralized request logging middleware
 * Automatically logs all API requests with comprehensive details
 */
const requestLoggingMiddleware = async (req, res, next) => {
  // Skip logging for certain paths
  const skipPaths = ['/health', '/csrf-token', '/favicon.ico'];
  if (skipPaths.includes(req.path)) {
    return next();
  }
  
  const startTime = Date.now();
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  const sessionId = req.cookies?.__session || null;
  
  // Attach correlation ID to request for use in route handlers
  req.correlationId = correlationId;
  req.startTime = startTime;
  
  // Parse user agent
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  
  // Capture original res.json to log response
  const originalJson = res.json.bind(res);
  let responseBody = null;
  
  res.json = function(body) {
    responseBody = body;
    return originalJson(body);
  };
  
  // Log after response is sent
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    // Get user details if authenticated
    let userDetails = { uid: null, email: null, role: null, displayName: null };
    if (req.user) {
      userDetails = {
        uid: req.user.uid,
        email: req.user.email,
        role: req.user.role,
        displayName: req.user.name
      };
    }
    
    // Determine action based on method and path
    let action = 'api-request';
    if (req.method === 'POST' && req.path.includes('/login')) action = 'login-attempt';
    else if (req.method === 'POST' && req.path.includes('/register')) action = 'register-attempt';
    else if (req.method === 'POST' && req.path.includes('/submit')) action = 'form-submission';
    else if (req.method === 'DELETE') action = 'delete-request';
    else if (req.method === 'PUT' || req.method === 'PATCH') action = 'update-request';
    else if (req.method === 'GET') action = 'data-access';
    
    // Determine severity based on status code
    let severity = 'info';
    if (res.statusCode >= 500) severity = 'error';
    else if (res.statusCode >= 400) severity = 'warning';
    
    // Get location
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    
    // Log the request
    await logAction({
      action: action,
      severity: severity,
      actorUid: userDetails.uid,
      actorDisplayName: userDetails.displayName,
      actorEmail: userDetails.email,
      actorRole: userDetails.role,
      targetType: 'api-endpoint',
      targetId: req.path,
      targetName: `${req.method} ${req.path}`,
      requestMethod: req.method,
      requestPath: req.path,
      requestBody: sanitizeRequestBody(req.body),
      responseStatus: res.statusCode,
      responseTime: duration,
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      deviceType: deviceType,
      browser: browser,
      os: os,
      sessionId: sessionId,
      correlationId: correlationId,
      details: {
        query: req.query,
        params: req.params,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        contentLength: res.get('content-length'),
        responseTime: `${duration}ms`
      },
      meta: {
        referer: req.headers.referer || null,
        origin: req.headers.origin || null,
        acceptLanguage: req.headers['accept-language'] || null
      }
    });
  });
  
  next();
};

// ============= SPECIFIC EVENT LOGGERS =============

/**
 * Log authentication events
 */
const logAuthEvent = async (req, eventType, success, userId = null, email = null, reason = null) => {
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
  
  await logAction({
    action: eventType,
    severity: success ? 'info' : 'warning',
    actorUid: userId,
    actorEmail: email,
    targetType: 'authentication',
    targetId: email || 'unknown',
    requestMethod: req.method,
    requestPath: req.path,
    responseStatus: success ? 200 : 401,
    ipMasked: req.ipData?.masked,
    ipHash: req.ipData?.hash,
    rawIP: req.ipData?.raw,
    location: location,
    userAgent: req.headers['user-agent'],
    deviceType: deviceType,
    browser: browser,
    os: os,
    sessionId: req.cookies?.__session,
    correlationId: req.correlationId || uuidv4(),
    details: {
      success: success,
      reason: reason,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log authorization failures
 */
const logAuthorizationFailure = async (req, requiredRole, userRole) => {
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
  
  await logAction({
    action: 'authorization-failure',
    severity: 'warning',
    actorUid: req.user?.uid,
    actorEmail: req.user?.email,
    actorRole: userRole,
    targetType: 'api-endpoint',
    targetId: req.path,
    requestMethod: req.method,
    requestPath: req.path,
    responseStatus: 403,
    ipMasked: req.ipData?.masked,
    ipHash: req.ipData?.hash,
    rawIP: req.ipData?.raw,
    location: location,
    userAgent: req.headers['user-agent'],
    deviceType: deviceType,
    browser: browser,
    os: os,
    sessionId: req.cookies?.__session,
    correlationId: req.correlationId || uuidv4(),
    details: {
      requiredRole: requiredRole,
      userRole: userRole,
      endpoint: req.path
    }
  });
};

/**
 * Log validation failures
 */
const logValidationFailure = async (req, errors) => {
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
  
  await logAction({
    action: 'validation-failure',
    severity: 'warning',
    actorUid: req.user?.uid,
    actorEmail: req.user?.email,
    actorRole: req.user?.role,
    targetType: 'api-endpoint',
    targetId: req.path,
    requestMethod: req.method,
    requestPath: req.path,
    responseStatus: 400,
    ipMasked: req.ipData?.masked,
    ipHash: req.ipData?.hash,
    rawIP: req.ipData?.raw,
    location: location,
    userAgent: req.headers['user-agent'],
    deviceType: deviceType,
    browser: browser,
    os: os,
    sessionId: req.cookies?.__session,
    correlationId: req.correlationId || uuidv4(),
    details: {
      errors: errors,
      requestBody: sanitizeRequestBody(req.body)
    }
  });
};

/**
 * Log rate limit hits
 */
const logRateLimitHit = async (req) => {
  const { deviceType, browser, os } = parseUserAgent(req.headers['user-agent']);
  const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
  
  await logAction({
    action: 'rate-limit-hit',
    severity: 'warning',
    actorUid: req.user?.uid,
    actorEmail: req.user?.email,
    actorRole: req.user?.role,
    targetType: 'api-endpoint',
    targetId: req.path,
    requestMethod: req.method,
    requestPath: req.path,
    responseStatus: 429,
    ipMasked: req.ipData?.masked,
    ipHash: req.ipData?.hash,
    rawIP: req.ipData?.raw,
    location: location,
    userAgent: req.headers['user-agent'],
    deviceType: deviceType,
    browser: browser,
    os: os,
    isAnomaly: true,
    details: {
      endpoint: req.path,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Log CORS blocks
 */
const logCORSBlock = async (origin, req) => {
  await logAction({
    action: 'cors-block',
    severity: 'warning',
    targetType: 'security',
    targetId: origin,
    requestMethod: req?.method || 'OPTIONS',
    requestPath: req?.path || 'unknown',
    responseStatus: 403,
    ipMasked: req?.ipData?.masked,
    ipHash: req?.ipData?.hash,
    rawIP: req?.ipData?.raw,
    userAgent: req?.headers?.['user-agent'],
    isAnomaly: true,
    details: {
      blockedOrigin: origin,
      timestamp: new Date().toISOString()
    }
  });
};

// ============= INTEGRATION INSTRUCTIONS =============
// 
// 1. Add requestLoggingMiddleware after authentication middleware:
//    app.use(requestLoggingMiddleware);
//
// 2. Update requireAuth middleware to log authorization failures
// 3. Update validation middleware to log validation failures
// 4. Update rate limiters to log rate limit hits
// 5. Update CORS to log blocks
//
