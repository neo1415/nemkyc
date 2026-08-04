# Security Vulnerability Fixes - April 2026

## Summary
All npm vulnerabilities have been resolved (from 48 vulnerabilities down to 0).

## Root Cause
The main offender was `@google-cloud/documentai` v9.6.0, which had multiple vulnerable transitive dependencies:
- `@tootallnate/once` <3.0.1 (control flow scoping vulnerability)
- `http-proxy-agent` 4.0.1-5.0.0 (depends on vulnerable @tootallnate/once)
- `tar` ≤7.5.10 (6 high-severity path traversal vulnerabilities)
- `base64-url` <2.0.0 (out-of-bounds read vulnerability)

These vulnerabilities existed deep in the dependency tree through:
```
@google-cloud/documentai → google-gax → retry-request → teeny-request → http-proxy-agent → @tootallnate/once
firebase-admin → @google-cloud/storage → teeny-request → http-proxy-agent
bcrypt → @mapbox/node-pre-gyp → tar
```

## Changes Made

### 1. CSRF Protection Update
- **Removed**: `csurf` v1.2.2 (deprecated, archived package with security vulnerabilities)
- **Added**: `csrf-csrf` v4.0.3 (modern, actively maintained replacement)
- **Migration**: Updated server.js to use the new Double Submit Cookie pattern
- **Configuration**: Added CSRF_SECRET to .env.example

### 2. Transitive Dependency Overrides
Added npm overrides in package.json to force update vulnerable dependencies:
- `tar`: Updated to ^7.5.11 (fixes 6 high-severity path traversal vulnerabilities)
  - CVE-2026-26960: Hardlink escape vulnerability
  - CVE-2026-23745: Path traversal vulnerability
  - CVE-2026-31802: Drive-relative path traversal
  - Multiple symlink poisoning and arbitrary file overwrite issues
- `@tootallnate/once`: Updated to ^3.0.1 (fixes control flow scoping vulnerability)
- `http-proxy-agent`: Updated to ^7.0.0 (removes dependency on vulnerable @tootallnate/once)

**Why overrides were necessary**: Google Cloud packages (@google-cloud/documentai, firebase-admin) are on their latest versions but haven't updated their transitive dependencies yet. npm overrides force all packages in the dependency tree to use safe versions.

### 3. Code Changes
**server.js**:
- Changed from `const csurf = require('csurf')` to `const { doubleCsrf } = require('csrf-csrf')`
- Updated CSRF middleware configuration to use doubleCsrf pattern with explicit configuration:
  - Cookie name: `_csrf`
  - Cookie options: httpOnly, secure (production only), sameSite
  - Token size: 64 bytes
  - Ignored methods: GET, HEAD, OPTIONS
- Updated `/csrf-token` endpoint to use `generateToken(req, res)` instead of `req.csrfToken()`

**.env.example**:
- Added `CSRF_SECRET` configuration variable with generation instructions

**package.json**:
- Removed `csurf` dependency
- Added `csrf-csrf` v4.0.3
- Added `overrides` section to force safe versions of transitive dependencies

## Verification

Run these commands to verify the fixes:

```bash
# Check for vulnerabilities (should show 0)
npm audit

# Verify overridden packages are at safe versions
npm ls tar http-proxy-agent @tootallnate/once

# Expected output:
# tar@7.5.13 (or higher)
# http-proxy-agent@7.0.2 (or higher)
# @tootallnate/once should not appear (removed)
```

## Action Required

### For Development
Generate a CSRF secret and add to your `.env` file:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:
```
CSRF_SECRET=<generated_secret_here>
```

### For Production
1. Generate a new CSRF_SECRET for production environment
2. Update production .env file with the new secret
3. Restart the server
4. Monitor logs for any CSRF-related errors

## Testing Checklist
After deployment, verify:
- [ ] CSRF token generation: `GET /csrf-token` returns a valid token
- [ ] Protected routes still validate CSRF tokens correctly
- [ ] Document AI processing still works (uses @google-cloud/documentai)
- [ ] Firebase operations work correctly (uses firebase-admin)
- [ ] File uploads work (uses bcrypt with tar dependency)
- [ ] No breaking changes in existing functionality

## References
- [csrf-csrf documentation](https://www.npmjs.com/package/csrf-csrf) - Modern CSRF protection
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) - Security best practices
- [npm overrides documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides) - Forcing dependency versions
- [tar vulnerability CVE-2026-26960](https://github.com/advisories/GHSA-34x7-hfp2-rc4v) - Hardlink path traversal
- [@tootallnate/once vulnerability](https://github.com/advisories/GHSA-vpq2-c234-7xj6) - Control flow scoping issue

## Notes
- The overrides will remain necessary until Google updates their packages (@google-cloud/documentai, firebase-admin) to use safe dependency versions
- Monitor npm audit regularly for new vulnerabilities
- Consider setting up automated dependency updates with Dependabot or Renovate
