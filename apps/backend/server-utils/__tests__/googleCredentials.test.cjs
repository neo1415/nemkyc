const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveGoogleCredentialsPath } = require('../googleCredentials.cjs');

test('resolves an existing absolute Google credentials path', () => {
  assert.equal(
    resolveGoogleCredentialsPath({ configuredPath: __filename }),
    __filename,
  );
});

test('fails before creating the Google client when credentials are missing', () => {
  assert.throws(
    () =>
      resolveGoogleCredentialsPath({
        configuredPath: 'definitely-missing-google-credentials.json',
        cwd: __dirname,
        backendDirectory: __dirname,
      }),
    (error) => error.code === 'GOOGLE_CREDENTIALS_NOT_FOUND',
  );
});

