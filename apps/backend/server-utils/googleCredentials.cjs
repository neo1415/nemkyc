const fs = require('node:fs');
const path = require('node:path');

function resolveGoogleCredentialsPath({
  configuredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS,
  cwd = process.cwd(),
  backendDirectory = path.resolve(__dirname, '..'),
} = {}) {
  const requestedPath = configuredPath || 'google-cloud-credentials.json';
  const candidates = path.isAbsolute(requestedPath)
    ? [requestedPath]
    : [
        path.resolve(cwd, requestedPath),
        path.resolve(backendDirectory, requestedPath),
        path.resolve(backendDirectory, '..', '..', requestedPath),
        path.resolve(backendDirectory, '..', '..', '..', 'n-server', requestedPath),
      ];

  const resolved = candidates.find((candidate) => fs.existsSync(candidate));

  if (!resolved) {
    const error = new Error(
      'Google Document AI credentials are not configured on this server.',
    );
    error.code = 'GOOGLE_CREDENTIALS_NOT_FOUND';
    throw error;
  }

  return resolved;
}

module.exports = { resolveGoogleCredentialsPath };

