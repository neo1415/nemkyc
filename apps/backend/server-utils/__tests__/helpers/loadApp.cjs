'use strict';

/**
 * Loads the Express app from server.js with a throwaway environment so tests can inspect the
 * live route table (authorization middleware, rate limiters, ordering) without real credentials.
 * Firebase Admin only parses the service-account key at initialisation; it never contacts Google
 * until a request is made, and nothing in this helper makes one.
 */
const crypto = require('node:crypto');
const path = require('node:path');

let cached = null;

function loadApp() {
  if (cached) return cached;

  const { privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  const env = {
    NODE_ENV: 'test',
    PORT: '0',
    TYPE: 'service_account',
    PROJECT_ID: 'test-project',
    PRIVATE_KEY_ID: 'test-key-id',
    PRIVATE_KEY: privateKey,
    CLIENT_EMAIL: 'firebase-adminsdk@test-project.iam.gserviceaccount.com',
    CLIENT_ID: '0',
    AUTH_URI: 'https://accounts.google.com/o/oauth2/auth',
    TOKEN_URI: 'https://oauth2.googleapis.com/token',
    AUTH_PROVIDER_X509_CERT_URL: 'https://www.googleapis.com/oauth2/v1/certs',
    CLIENT_X509_CERT_URL: 'https://www.googleapis.com/robot/v1/metadata/x509/test',
    UNIVERSE_DOMAIN: 'googleapis.com',
    FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
    FIREBASE_DATABASE_URL: 'https://test-project.firebaseio.com',
    REACT_APP_FIREBASE_KEY: 'test-api-key',
    ENCRYPTION_KEY: 'a'.repeat(64),
    CSRF_SECRET: 'b'.repeat(64),
    EVENTS_IP_SALT: 'c'.repeat(64),
    ENABLE_EVENTS_LOGGING: 'false',
    ENABLE_IP_GEOLOCATION: 'false',
    VERIFICATION_MODE: 'mock',
    EMAIL_USER: 'test@example.com',
    EMAIL_PASS: 'not-a-real-password',
    EMAIL_HOST: '127.0.0.1',
    EMAIL_PORT: '1',
    SKIP_EMAIL_VERIFY: 'true',
  };
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }

  const silenced = ['log', 'info', 'debug', 'warn', 'error'];
  const original = Object.fromEntries(silenced.map((k) => [k, console[k]]));
  for (const k of silenced) console[k] = () => {};
  let app;
  try {
    ({ app } = require(path.resolve(__dirname, '../../../server.js')));
  } finally {
    for (const k of silenced) console[k] = original[k];
  }

  const routes = [];
  for (const layer of app._router.stack) {
    if (!layer.route) continue;
    routes.push({
      methods: Object.keys(layer.route.methods).filter((m) => layer.route.methods[m]).map((m) => m.toUpperCase()),
      path: layer.route.path,
      handlers: layer.route.stack.map((l) => l.handle),
      names: layer.route.stack.map((l) => l.handle.displayName || l.handle.name || '<anonymous>'),
      roles: layer.route.stack.flatMap((l) => l.handle.requiredRoles || []),
    });
  }

  function find(method, routePath) {
    return routes.find((r) => r.methods.includes(method) && r.path === routePath) || null;
  }

  cached = { app, routes, find };
  return cached;
}

module.exports = { loadApp };
