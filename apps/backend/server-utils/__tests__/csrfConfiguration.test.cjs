'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createCsrfUtilities } = require('../csrfConfiguration.cjs');

test('issues and validates a csrf-csrf v4 token using the frontend header', () => {
  const { generateCsrfToken, validateRequest } = createCsrfUtilities({
    secret: 'test-secret-that-is-not-used-in-production'
  });
  const issuedCookies = {};
  const req = { cookies: {}, headers: {}, method: 'GET' };
  const res = {
    cookie(name, value, options) {
      issuedCookies[name] = { value, options };
    }
  };

  const token = generateCsrfToken(req, res);

  assert.equal(typeof token, 'string');
  assert.ok(token.length > 64);
  assert.equal(issuedCookies._csrf.value, token);
  assert.equal(issuedCookies._csrf.options.httpOnly, true);

  const submissionRequest = {
    cookies: { _csrf: token },
    headers: { 'csrf-token': token },
    method: 'POST'
  };
  assert.equal(validateRequest(submissionRequest), true);
});

test('rejects a token when the cookie and request header do not match', () => {
  const { validateRequest } = createCsrfUtilities({ secret: 'test-secret' });
  assert.equal(validateRequest({
    cookies: { _csrf: 'cookie-token' },
    headers: { 'csrf-token': 'different-token' },
    method: 'POST'
  }), false);
});
