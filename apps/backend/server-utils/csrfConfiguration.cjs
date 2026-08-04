'use strict';

const { doubleCsrf } = require('csrf-csrf');

function createCsrfUtilities({ secret, isProduction = false } = {}) {
  if (!secret) {
    throw new Error('A CSRF secret is required');
  }

  return doubleCsrf({
    getSecret: () => secret,
    // Guests do not have a Firebase session yet. An empty identifier is stable for
    // them, while signed-in users get tokens bound to their session cookie.
    getSessionIdentifier: req => req.cookies?.__session || '',
    getCsrfTokenFromRequest: req =>
      req.headers?.['csrf-token'] || req.headers?.['x-csrf-token'],
    cookieName: '_csrf',
    cookieOptions: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'strict',
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  });
}

module.exports = { createCsrfUtilities };
