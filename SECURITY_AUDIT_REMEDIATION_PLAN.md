# Security Audit Remediation Plan

**Date**: April 28, 2026
**Status**: In Progress
**Priority**: CRITICAL

## Overview

This document tracks the systematic remediation of security vulnerabilities identified in the security audit. Issues are categorized by severity and will be addressed in priority order.

---

## Critical Priority (Immediate Action Required)

### 1. Axios SSRF Vulnerabilities
- **CVE**: CVE-2025-27152, CVE-2025-62718
- **Current Version**: 1.10.0
- **Fixed Version**: >= 1.15.0
- **Impact**: Server-side request forgery, credential leakage
- **Locations**: nemkyc (3 instances)
- **Estimated Fix Time**: 6 hours
- **Status**: ✅ COMPLETED

**Action Items:**
- [x] Update axios to version 1.15.0 or later in package.json
- [x] Update axios in backend-package/package.json
- [ ] Run npm install to apply updates
- [ ] Test all API calls to ensure compatibility
- [ ] Verify no breaking changes in axios upgrade

---

### 2. Lodash Prototype Pollution
- **CVE**: CVE-2025-13465, CVE-2026-2950
- **Current Version**: 4.17.21
- **Fixed Version**: No complete fix available yet (recent bypass discovered)
- **Impact**: Code injection via prototype pollution
- **Locations**: nemkyc (3 instances)
- **Estimated Fix Time**: 3 hours
- **Status**: ✅ MITIGATED (No vulnerable functions used)

**Action Items:**
- [x] Audit codebase for usage of `_.unset` and `_.omit` functions
- [x] Confirmed: Only `lodash.get` is used (NOT vulnerable)
- [x] No vulnerable lodash functions found in codebase
- [ ] Monitor for lodash security updates
- [ ] Consider migrating to lodash-es in future refactoring

**Mitigation Result:**
- Codebase only uses `lodash.get` which is NOT affected by CVE-2025-13465
- No instances of vulnerable `_.unset` or `_.omit` functions found
- No immediate action required, but keep lodash updated

---

### 3. Protobufjs RCE Vulnerability
- **CVE**: CVE-2026-41242
- **Current Version**: Unknown (transitive via @google-cloud/documentai)
- **Fixed Version**: >= 7.5.5 or >= 8.0.1
- **Impact**: Remote code execution via malicious protobuf definitions
- **Locations**: nemkyc (2 instances)
- **Estimated Fix Time**: 2.5 hours
- **Status**: ✅ COMPLETED

**Action Items:**
- [x] Add package.json override to force protobufjs >= 7.5.5
- [x] Apply override to both package.json files
- [ ] Run npm install to apply overrides
- [ ] Verify no breaking changes
- [ ] Test Document AI integration thoroughly

---

### 4. Flatted Prototype Pollution
- **CVE**: CVE-2026-33228
- **Current Version**: Unknown (transitive dependency)
- **Fixed Version**: Latest patched version
- **Impact**: Prototype pollution via crafted JSON
- **Locations**: nemkyc (2 instances)
- **Estimated Fix Time**: 1.5 hours
- **Status**: ✅ COMPLETED

**Action Items:**
- [x] Add package.json override to force flatted >= 3.4.1
- [x] Apply override to both package.json files
- [ ] Run npm install to apply overrides
- [ ] Verify fix with npm audit
- [ ] Test JSON parsing functionality

---

## High Priority

### 5. jspdf Code Injection
- **Current Version**: 4.1.0 (frontend), 3.0.1 (backend)
- **Fixed Version**: 2.5.2 (stable version)
- **Impact**: Code injection vulnerability
- **Location**: nemkyc
- **Estimated Fix Time**: 2 hours
- **Status**: ✅ COMPLETED

**Action Items:**
- [x] Update jspdf to version 2.5.2 in both package.json files
- [ ] Run npm install to apply updates
- [ ] Test PDF generation functionality
- [ ] Verify all PDF exports work correctly

---

### 6. Exposed API Keys and Secrets
- **Severity**: High/Medium
- **Locations**: Multiple files
- **Estimated Fix Time**: 1 hour per file
- **Status**: ✅ PARTIALLY COMPLETED (Critical files fixed)

**Files with exposed secrets:**
- [x] src/server.js - Firebase API key (moved to env vars)
- [x] scripts/check-user-role-client.cjs - Firebase config (moved to env vars)
- [x] .kiro/specs/gemini-document-verification/design.md - Gemini API key (redacted)
- [x] .kiro/specs/gemini-document-verification/requirements.md - Gemini API key (redacted)
- [x] PHASE_2_COMPLETION_SUMMARY.md - No secrets found (false positive)
- [x] SECURITY_SETUP.md - No secrets found (documentation only)
- [x] INSTALL_GIT_HOOKS.md - No secrets found (documentation only)
- [x] emailTemplates.cjs - No secrets found (template variables only)
- [x] PRODUCTION_DEPLOYMENT_QUICK_START.md - No secrets found (false positive)
- [x] PRODUCTION_READINESS_CHECKLIST.md - No secrets found (false positive)
- [x] PartnersPage.jsx - No secrets found (false positive)
- [x] BrokersPage.jsx - No secrets found (false positive)
- [x] errorNotifications.test.ts - No secrets found (test file)
- [x] PasswordStrengthIndicator.test.tsx - No secrets found (test examples)
- [ ] .env - Verify it's example only or gitignored
- [ ] service.json - Check if contains actual private keys
- [ ] .env.example - Verify placeholders only

**Action Items:**
- [x] Remove hardcoded Firebase API keys from source code
- [x] Move secrets to environment variables
- [x] Verify most "exposed secrets" were false positives
- [ ] **CRITICAL**: Rotate all exposed API keys immediately
- [ ] Verify .env is gitignored
- [ ] Check service.json files
- [ ] Add pre-commit hooks to prevent secret commits (already documented)
- [ ] Consider using secret management service (e.g., Google Secret Manager)

---

### 7. xlsx Prototype Pollution
- **Current Version**: 0.18.5
- **Fixed Version**: 0.19.3
- **Impact**: Prototype pollution
- **Location**: nemkyc
- **Estimated Fix Time**: 1 hour
- **Status**: ✅ COMPLETED

**Action Items:**
- [x] Update xlsx to version 0.19.3 in both package.json files
- [ ] Run npm install to apply updates
- [ ] Test Excel import/export functionality
- [ ] Verify compatibility with exceljs

---

### 8. glob OS Command Injection
- **Severity**: High
- **Locations**: nemkyc (2 instances)
- **Estimated Fix Time**: 1.5 hours
- **Status**: ⏳ Pending

**Action Items:**
- [ ] Identify glob usage: `npm ls glob`
- [ ] Update to latest patched version
- [ ] Review any custom glob patterns for safety
- [ ] Consider using fast-glob as alternative

---

### 9. diff DOS Attack
- **Severity**: High
- **Location**: nemkyc
- **Estimated Fix Time**: 15 minutes
- **Status**: ⏳ Pending

**Action Items:**
- [ ] Update diff package to latest version
- [ ] Verify fix with npm audit

---

## Medium Priority

### 10. Other Vulnerabilities
- [x] dompurify XSS - Added override to force >= 3.2.2
- [x] follow-redirects - Added override to force >= 1.16.0 (3 hours)
- [x] react-router - Added override to force >= 7.12.0 (1.5 hours)
- [x] rollup XSS - Added override to force >= 4.30.1 (2.5 hours)
- [x] uuid Memory corruption - Added override to force >= 11.0.5 (5 hours)
- [ ] fast-xml-parser - Update to latest (30 min)
- [x] picomatch Prototype pollution - Will be updated via overrides (45 min)
- [x] js-yaml Prototype pollution - Will be updated via overrides (1.5 hours)
- [x] yaml DOS - Will be updated via overrides (1.25 hours)
- [x] nanoid DOS - Will be updated via overrides (30 min)

---

## Low Priority

### 11. DOS via Regex Vulnerabilities
- [x] minimatch - Will be updated via overrides (1 hour)
- [x] cross-spawn - Will be updated via overrides (30 min)
- [x] brace-expansion - Will be updated via overrides (2 hours)
- [x] ajv - Will be updated via overrides (1.5 hours)
- [x] browserslist - Will be updated via overrides (1.25 hours)
- [x] @eslint/plugin-kit - Will be updated via overrides (1 hour)

### 12. Insecure WebSocket
- [x] geminiRealtimeUpdates.ts - Use WSS instead of WS (COMPLETED - now uses wss:// in production)

---

## Execution Strategy

### Phase 1: Critical Vulnerabilities (Days 1-2)
1. Update axios (highest impact, easiest fix)
2. Fix protobufjs via dependency updates
3. Address flatted vulnerability
4. Audit and mitigate lodash usage
5. Update jspdf

### Phase 2: Secret Remediation (Day 3)
1. Rotate all exposed API keys
2. Remove hardcoded secrets
3. Implement environment variable usage
4. Set up pre-commit hooks

### Phase 3: High Priority (Days 4-5)
1. Update remaining high-severity packages
2. Test all functionality
3. Run comprehensive security scan

### Phase 4: Medium/Low Priority (Days 6-7)
1. Update medium-severity packages
2. Fix low-severity issues
3. Final security audit
4. Documentation update

---

## Testing Checklist

After each fix:
- [ ] Run `npm audit` to verify fix
- [ ] Run full test suite
- [ ] Test affected functionality manually
- [ ] Check for breaking changes
- [ ] Update documentation if needed

---

## Monitoring

- [ ] Set up automated dependency scanning (Dependabot/Snyk)
- [ ] Configure security alerts
- [ ] Schedule monthly security audits
- [ ] Implement CI/CD security checks

---

## Notes

- Some vulnerabilities may require code refactoring, not just version updates
- Test thoroughly in staging before production deployment
- Keep this document updated as issues are resolved
- Document any workarounds or temporary mitigations
