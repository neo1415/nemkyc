'use strict';

/**
 * Temporary recipient suppression, for testing without mailing real people.
 *
 * Controlled entirely by one environment variable, so turning it off is a config change and
 * never a code change:
 *
 *   EMAIL_SUPPRESS_PATTERN=nem-insurance      # drop every recipient containing "nem-insurance"
 *   EMAIL_SUPPRESS_PATTERN=nem-insurance,example.com   # comma-separated, any match drops
 *   (unset / empty)                           # normal delivery, this module does nothing
 *
 * Matching is a case-insensitive substring test on the address, so "nem-insurance" covers
 * kyc@nem-insurance.com, motorclaimunit@nem-insurance.com and anything else on that domain.
 *
 * It wraps the nodemailer transport itself rather than individual call sites, so every send in
 * the codebase is covered, including routes that use the transport directly.
 */

const ENV_VAR = 'EMAIL_SUPPRESS_PATTERN';

/** Parses the env var into a list of lowercase substrings. Empty list = suppression disabled. */
function parsePatterns(raw) {
  return String(raw || '')
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

/** Splits nodemailer's flexible recipient value (string, comma list, array, {address}) into addresses. */
function toAddressList(value) {
  if (!value) return [];
  const flatten = (entry) => {
    if (!entry) return [];
    if (Array.isArray(entry)) return entry.flatMap(flatten);
    if (typeof entry === 'object' && entry.address) return [String(entry.address)];
    return String(entry).split(',').map((part) => part.trim()).filter(Boolean);
  };
  return flatten(value);
}

function isSuppressed(address, patterns) {
  const lower = String(address || '').toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern));
}

/**
 * Wraps a nodemailer transport so suppressed recipients are removed before sending.
 * Returns the transport unchanged when no pattern is configured.
 */
function wrapTransport(transport, rawPattern = process.env[ENV_VAR]) {
  const patterns = parsePatterns(rawPattern);
  if (patterns.length === 0) return transport;

  const originalSendMail = transport.sendMail.bind(transport);

  return Object.assign(Object.create(transport), {
    sendMail: async (mailOptions, ...rest) => {
      const filtered = { ...mailOptions };
      const removed = [];

      for (const field of ['to', 'cc', 'bcc']) {
        const addresses = toAddressList(mailOptions[field]);
        if (addresses.length === 0) continue;
        const kept = addresses.filter((address) => {
          if (isSuppressed(address, patterns)) {
            removed.push(address);
            return false;
          }
          return true;
        });
        filtered[field] = kept.length ? kept.join(', ') : undefined;
      }

      if (removed.length > 0) {
        console.warn(`🔇 [EMAIL SUPPRESSED] ${ENV_VAR} blocked ${removed.length} recipient(s): ${removed.join(', ')} | subject: ${mailOptions.subject || '(none)'}`);
      }

      if (!filtered.to && !filtered.cc && !filtered.bcc) {
        console.warn(`🔇 [EMAIL SUPPRESSED] nothing left to send, message dropped | subject: ${mailOptions.subject || '(none)'}`);
        return { suppressed: true, removed, accepted: [], rejected: [], messageId: null };
      }

      return originalSendMail(filtered, ...rest);
    },
  });
}

/** Logs a loud banner at startup so an active suppression can never be forgotten in production. */
function announce(logger = console) {
  const patterns = parsePatterns(process.env[ENV_VAR]);
  if (patterns.length === 0) return false;
  logger.warn('='.repeat(80));
  logger.warn(`🔇 EMAIL SUPPRESSION IS ACTIVE — recipients matching [${patterns.join(', ')}] will NOT receive mail.`);
  logger.warn(`   This is a testing switch. Remove ${ENV_VAR} from the environment and restart to resume normal delivery.`);
  logger.warn('='.repeat(80));
  return true;
}

module.exports = { ENV_VAR, parsePatterns, toAddressList, isSuppressed, wrapTransport, announce };
