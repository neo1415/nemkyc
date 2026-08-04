'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { validateRequestContentType } = require('../contentTypePolicy.cjs');

test('accepts browser-generated multipart bodies on the shared public upload route', () => {
  assert.equal(validateRequestContentType({
    method: 'POST',
    path: '/api/public/upload',
    contentType: 'multipart/form-data; boundary=----WebKitFormBoundary123'
  }), null);
});

test('accepts multipart bodies on the identity verification upload route', () => {
  assert.equal(validateRequestContentType({
    method: 'POST',
    path: '/api/identity/verify/secure-token/upload-document',
    contentType: 'multipart/form-data; boundary=test-boundary'
  }), null);
});

test('requires multipart content on upload routes', () => {
  assert.match(validateRequestContentType({
    method: 'POST', path: '/api/public/upload', contentType: 'application/json'
  }).message, /multipart\/form-data/);
});

test('continues to reject multipart bodies on JSON submission routes', () => {
  assert.match(validateRequestContentType({
    method: 'POST',
    path: '/api/submit-form',
    contentType: 'multipart/form-data; boundary=not-allowed'
  }).message, /application\/json/);
});

test('accepts JSON requests and bodyless methods', () => {
  assert.equal(validateRequestContentType({
    method: 'POST', path: '/api/submit-form', contentType: 'application/json; charset=utf-8'
  }), null);
  assert.equal(validateRequestContentType({ method: 'GET', path: '/health' }), null);
});
