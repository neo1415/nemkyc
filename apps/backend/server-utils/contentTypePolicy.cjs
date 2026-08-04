'use strict';

const BODYLESS_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CONTENT_TYPE_EXEMPT_PATHS = new Set(['/health', '/csrf-token']);

function isMultipartUploadPath(requestPath) {
  return requestPath === '/api/public/upload' ||
    /^\/api\/identity\/verify\/[^/]+\/upload-document$/.test(requestPath);
}

function validateRequestContentType({ method, path, contentType }) {
  if (BODYLESS_METHODS.has(String(method || '').toUpperCase()) || CONTENT_TYPE_EXEMPT_PATHS.has(path)) {
    return null;
  }

  const normalizedContentType = String(contentType || '').toLowerCase();

  if (isMultipartUploadPath(path)) {
    if (!normalizedContentType.startsWith('multipart/form-data;') || !normalizedContentType.includes('boundary=')) {
      return {
        error: 'Unsupported Media Type',
        message: 'This document upload must use multipart/form-data.'
      };
    }
    return null;
  }

  if (!normalizedContentType) {
    return {
      error: 'Unsupported Media Type',
      message: 'Content-Type header is required. Please set Content-Type to application/json.'
    };
  }

  if (!normalizedContentType.includes('application/json')) {
    return {
      error: 'Unsupported Media Type',
      message: `Content-Type must be application/json. Received: ${contentType}`
    };
  }

  return null;
}

module.exports = { isMultipartUploadPath, validateRequestContentType };
