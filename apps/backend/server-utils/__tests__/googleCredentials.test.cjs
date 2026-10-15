const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveGoogleCredentialsPath } = require('../googleCredentials.cjs');

const fakeServiceAccount = {
  type: 'service_account',
  client_email: 'test@example.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
};

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'google-creds-test-'));
}

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
        inlineCredentials: '',
        cwd: __dirname,
        backendDirectory: __dirname,
      }),
    (error) => error.code === 'GOOGLE_CREDENTIALS_NOT_FOUND',
  );
});

test('prefers an existing credentials file over inline JSON', () => {
  assert.equal(
    resolveGoogleCredentialsPath({
      configuredPath: __filename,
      inlineCredentials: JSON.stringify(fakeServiceAccount),
    }),
    __filename,
  );
});

test('writes inline JSON credentials to a temp file when no file exists', () => {
  const tmpDirectory = makeTmpDir();
  const resolved = resolveGoogleCredentialsPath({
    configuredPath: '/etc/secrets/definitely-missing.json',
    inlineCredentials: JSON.stringify(fakeServiceAccount),
    tmpDirectory,
  });

  assert.equal(path.dirname(resolved), tmpDirectory);
  assert.deepEqual(JSON.parse(fs.readFileSync(resolved, 'utf8')), fakeServiceAccount);
});

test('accepts base64-encoded inline credentials', () => {
  const tmpDirectory = makeTmpDir();
  const resolved = resolveGoogleCredentialsPath({
    configuredPath: '/etc/secrets/definitely-missing.json',
    inlineCredentials: Buffer.from(JSON.stringify(fakeServiceAccount)).toString('base64'),
    tmpDirectory,
  });

  assert.deepEqual(JSON.parse(fs.readFileSync(resolved, 'utf8')), fakeServiceAccount);
});

test('rejects inline credentials that are not a service-account JSON', () => {
  assert.throws(
    () =>
      resolveGoogleCredentialsPath({
        configuredPath: '/etc/secrets/definitely-missing.json',
        inlineCredentials: '{"not":"a service account"}',
        tmpDirectory: makeTmpDir(),
      }),
    (error) => error.code === 'GOOGLE_CREDENTIALS_INVALID',
  );
});
