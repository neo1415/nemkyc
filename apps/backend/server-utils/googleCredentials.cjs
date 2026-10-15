const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Hosts without secret files (e.g. Railway) can supply the service-account JSON
// through GOOGLE_CREDENTIALS_JSON instead, either raw or base64-encoded. It is
// written once to a private temp file because the Google client wants a path.
const materializedPaths = new Map();

function parseInlineCredentials(inlineCredentials) {
  const trimmed = inlineCredentials.trim();
  const text = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.client_email || !parsed.private_key) {
    const error = new Error(
      'GOOGLE_CREDENTIALS_JSON is set but is not a valid service-account JSON.',
    );
    error.code = 'GOOGLE_CREDENTIALS_INVALID';
    throw error;
  }

  return JSON.stringify(parsed);
}

function materializeInlineCredentials(inlineCredentials, tmpDirectory) {
  const json = parseInlineCredentials(inlineCredentials);
  const cacheKey = `${tmpDirectory}\u0000${json}`;
  const cached = materializedPaths.get(cacheKey);
  if (cached && fs.existsSync(cached)) {
    return cached;
  }

  const target = path.join(tmpDirectory, `google-cloud-credentials-${process.pid}.json`);
  fs.writeFileSync(target, json, { mode: 0o600 });
  materializedPaths.set(cacheKey, target);
  return target;
}

function resolveGoogleCredentialsPath({
  configuredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS,
  inlineCredentials = process.env.GOOGLE_CREDENTIALS_JSON,
  cwd = process.cwd(),
  backendDirectory = path.resolve(__dirname, '..'),
  tmpDirectory = os.tmpdir(),
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

  if (resolved) {
    return resolved;
  }

  if (inlineCredentials && inlineCredentials.trim()) {
    return materializeInlineCredentials(inlineCredentials, tmpDirectory);
  }

  const error = new Error(
    'Google Document AI credentials are not configured on this server.',
  );
  error.code = 'GOOGLE_CREDENTIALS_NOT_FOUND';
  throw error;
}

module.exports = { resolveGoogleCredentialsPath };
