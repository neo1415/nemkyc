const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
  encoding: 'utf8',
}).split('\0').filter(Boolean);

const forbiddenNames = new Set([
  'service.json',
  'google-cloud-credentials.json',
  'service-account.json',
  'serviceaccount.json',
]);
const findings = [];

for (const file of trackedFiles) {
  const normalized = file.replaceAll('\\', '/');
  const basename = path.posix.basename(normalized).toLowerCase();

  if (forbiddenNames.has(basename) || /^firebase-adminsdk.*\.json$/i.test(basename)) {
    findings.push(`${file}: forbidden credential filename`);
    continue;
  }

  let buffer;
  try {
    buffer = readFileSync(file);
  } catch {
    continue;
  }
  if (buffer.length > 2_000_000 || buffer.includes(0)) continue;

  const text = buffer.toString('utf8');
  const privateKeyBlock = /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----(?:\\n|\r?\n)[A-Za-z0-9+/=\\n\r]{100,}-----END (?:RSA |EC )?PRIVATE KEY-----/;
  if (privateKeyBlock.test(text)) {
    findings.push(`${file}: embedded private key`);
    continue;
  }

  if (basename.endsWith('.json')) {
    try {
      const value = JSON.parse(text);
      if (value?.type === 'service_account' && value?.private_key) {
        findings.push(`${file}: embedded GCP service-account credential`);
      }
    } catch {
      // Non-JSON content in a .json-named file is handled by other checks.
    }
  }
}

if (findings.length) {
  console.error('Secret check failed. Remove these tracked credentials:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Secret check passed (${trackedFiles.length} tracked files scanned).`);
