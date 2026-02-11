# Security Documentation - Identity Remediation System

**Version:** 1.0  
**Last Updated:** February 6, 2026  
**Classification:** Internal Use Only

## Table of Contents

1. [Overview](#overview)
2. [Encryption Approach](#encryption-approach)
3. [Key Management](#key-management)
4. [API Security](#api-security)
5. [NDPR Compliance](#ndpr-compliance)
6. [Audit Logging](#audit-logging)
7. [Security Best Practices](#security-best-practices)
8. [Incident Response](#incident-response)

---

## 1. Overview

The Identity Remediation System handles sensitive Personally Identifiable Information (PII) including:
- National Identification Numbers (NIN)
- Bank Verification Numbers (BVN)
- Corporate Affairs Commission (CAC) registration numbers
- Customer personal data (names, dates of birth, addresses)

This document outlines the security measures implemented to protect this sensitive data in compliance with the Nigeria Data Protection Regulation (NDPR) and industry best practices.

### Security Principles

1. **Encryption at Rest**: All PII is encrypted before storage
2. **Encryption in Transit**: All API communications use HTTPS/TLS
3. **Least Privilege**: Users only access data they need
4. **Defense in Depth**: Multiple layers of security controls
5. **Audit Trail**: All security-sensitive operations are logged
6. **Data Minimization**: Only necessary data is collected and stored

---

## 2. Encryption Approach

### Algorithm: AES-256-GCM

We use **AES-256-GCM** (Advanced Encryption Standard with 256-bit keys in Galois/Counter Mode) for encrypting sensitive data.

**Why AES-256-GCM?**
- Industry standard encryption algorithm
- 256-bit key provides strong security
- GCM mode provides both confidentiality and authenticity
- Authentication tags prevent tampering
- Efficient performance

### Implementation Details

**Location:** `server-utils/encryption.cjs`

```javascript
// Encryption parameters
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;        // 16 bytes for AES
const AUTH_TAG_LENGTH = 16;  // 16 bytes for GCM auth tag
const KEY_LENGTH = 32;       // 32 bytes for AES-256
```

### Encryption Process

1. **Generate Unique IV**: Each encryption operation generates a new random Initialization Vector (IV)
2. **Encrypt Data**: Data is encrypted using AES-256-GCM with the encryption key and IV
3. **Generate Auth Tag**: GCM mode generates an authentication tag for integrity verification
4. **Store Encrypted Data**: Both encrypted data and IV are stored (auth tag is included in encrypted data)

```javascript
// Example encryption
const { encrypted, iv } = encryptData('12345678901');
// Store both encrypted and iv in database
```

### Decryption Process

1. **Retrieve Encrypted Data**: Fetch encrypted data and IV from database
2. **Verify Auth Tag**: GCM mode verifies the authentication tag
3. **Decrypt Data**: Data is decrypted using the encryption key and IV
4. **Use and Clear**: Decrypted data is used immediately and cleared from memory

```javascript
// Example decryption
const plaintext = decryptData(encrypted, iv);
// Use plaintext for verification
clearSensitiveData(plaintext); // Clear from memory
```

### What is Encrypted?

The following fields are encrypted at rest:
- `nin` (National Identification Number)
- `bvn` (Bank Verification Number)
- `cac` (Corporate Affairs Commission number)

### What is NOT Encrypted?

The following fields are NOT encrypted (not considered PII or needed for queries):
- Names (firstName, lastName, displayName)
- Email addresses
- Phone numbers
- Policy numbers
- Verification status
- Timestamps

**Rationale:** These fields are needed for search, filtering, and display. They are protected by authentication, authorization, and HTTPS.

---

## 3. Key Management

### Encryption Key

**Storage:** Environment variable `ENCRYPTION_KEY`

**Generation:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This generates a 64-character hexadecimal string (32 bytes).

### Key Security Requirements

1. **Never commit to version control**: Encryption key must NEVER be in Git
2. **Environment variables only**: Store in `.env` file (local) or hosting platform secrets (production)
3. **Unique per environment**: Development, staging, and production must use different keys
4. **Secure transmission**: Share keys via secure channels only (never email, Slack, etc.)
5. **Access control**: Only authorized personnel can access encryption keys

### Key Rotation Strategy

**When to Rotate:**
- Annually (scheduled rotation)
- When key may have been compromised
- When authorized personnel leave the organization
- As part of security audit recommendations

**How to Rotate:**

1. **Generate New Key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update Environment Variable:**
   - Add new key as `ENCRYPTION_KEY_NEW`
   - Keep old key as `ENCRYPTION_KEY_OLD`

3. **Run Migration Script:**
   ```bash
   node scripts/rotate-encryption-key.js
   ```
   This script:
   - Decrypts all data with old key
   - Re-encrypts with new key
   - Updates database

4. **Verify Migration:**
   - Test decryption with new key
   - Verify all records migrated successfully

5. **Remove Old Key:**
   - After verification, remove `ENCRYPTION_KEY_OLD`
   - Update `ENCRYPTION_KEY` to new value

6. **Update Documentation:**
   - Document rotation date
   - Update key version number

### Key Backup

**DO:**
- Store backup in secure password manager (1Password, LastPass, etc.)
- Store backup in secure offline location (encrypted USB drive in safe)
- Document key version and rotation date

**DON'T:**
- Email keys
- Store in Slack/Teams
- Store in unencrypted files
- Share via insecure channels

---

## 4. API Security

### Datapro NIN Verification API

**Base URL:** `https://api.datapronigeria.com`  
**Endpoint:** `/verifynin/?regNo={NIN}`  
**Method:** GET  
**Authentication:** Header `SERVICEID`

#### Credential Management

**SERVICEID Storage:**
- Stored in environment variable `DATAPRO_SERVICE_ID`
- NEVER exposed to frontend
- NEVER logged in plaintext
- NEVER included in error messages

**Configuration Validation:**
```javascript
// Server startup validation
if (!process.env.DATAPRO_SERVICE_ID) {
  console.error('DATAPRO_SERVICE_ID not configured');
  // Prevent server start in production
}
```

#### API Security Features

1. **Rate Limiting**: Maximum 50 requests per minute
2. **Retry Logic**: Automatic retry with exponential backoff (max 3 retries)
3. **Timeout**: 30-second timeout per request
4. **Error Handling**: Comprehensive error handling for all response codes
5. **Data Masking**: NIN masked in all logs (shows only first 4 digits)

#### Request Flow

```
Client → Backend → Datapro API
         ↓
    Decrypt NIN
         ↓
    Call API with SERVICEID
         ↓
    Validate Response
         ↓
    Encrypt Result
         ↓
    Store in Database
```

**Security Notes:**
- NIN is decrypted only in memory on backend
- SERVICEID never sent to frontend
- API responses are sanitized (photos/signatures removed)
- All API calls are logged in audit trail

### Paystack Verification API

**Used for:** BVN and CAC verification (legacy/fallback)

**Security:**
- API key stored in environment variable `PAYSTACK_SECRET_KEY`
- Same security principles as Datapro API
- Rate limiting applied
- Data masking in logs

---

## 5. NDPR Compliance

The Nigeria Data Protection Regulation (NDPR) requires organizations to protect personal data. Our implementation ensures compliance through:

### Data Protection Principles

1. **Lawfulness, Fairness, and Transparency**
   - Clear privacy policy
   - Explicit consent for data collection
   - Transparent data usage

2. **Purpose Limitation**
   - Data collected only for identity verification
   - Not used for other purposes without consent

3. **Data Minimization**
   - Only necessary data collected
   - Photos and signatures from API responses are NOT stored

4. **Accuracy**
   - Data verified against authoritative sources (NIMC, CAC)
   - Customers can update incorrect information

5. **Storage Limitation**
   - Data retained only as long as necessary
   - Retention policy documented

6. **Integrity and Confidentiality**
   - **Encryption at rest** (AES-256-GCM)
   - **Encryption in transit** (HTTPS/TLS)
   - Access controls (role-based)
   - Audit logging

7. **Accountability**
   - Comprehensive audit trail
   - Security documentation
   - Regular security audits

### NDPR Compliance Checklist

- [x] Encryption at rest for PII
- [x] Encryption in transit (HTTPS)
- [x] Access control (role-based)
- [x] Audit logging
- [x] Data minimization (no photos/signatures stored)
- [x] Secure key management
- [x] Privacy policy
- [x] Consent mechanism
- [x] Data retention policy
- [x] Security documentation
- [x] Incident response plan

### Data Subject Rights

Under NDPR, data subjects have the right to:

1. **Access**: View their personal data
2. **Rectification**: Correct inaccurate data
3. **Erasure**: Request deletion of data
4. **Portability**: Export their data
5. **Object**: Object to data processing

**Implementation:**
- Admin portal allows viewing and updating customer data
- Export functionality provides data in CSV format
- Deletion requests handled through admin interface

---

## 6. Audit Logging

All security-sensitive operations are logged for audit trail and compliance.

### What is Logged?

1. **Verification Attempts**
   - Verification type (NIN, BVN, CAC)
   - Identity number (masked)
   - User ID and email
   - IP address
   - Result (success, failure, error)
   - Error code and message
   - Timestamp

2. **API Calls**
   - API name (Datapro, Paystack)
   - Endpoint
   - HTTP method
   - Request data (masked)
   - Response status code
   - Response data (masked)
   - Duration
   - User ID
   - IP address
   - Timestamp

3. **Encryption Operations**
   - Operation type (encrypt, decrypt)
   - Data type (NIN, BVN, CAC)
   - User ID
   - Result (success, failure)
   - Error message (if failed)
   - Timestamp

4. **Security Events**
   - Event type
   - Severity (low, medium, high, critical)
   - Description
   - User ID
   - IP address
   - Timestamp

5. **Bulk Operations**
   - Operation type
   - Total records
   - Success count
   - Failure count
   - User ID and email
   - Timestamp

### Log Storage

**Location:** Firestore collection `verification-audit-logs`

**Retention:** Logs retained for 2 years (configurable)

**Access:** Admin-only via `/api/audit/logs` endpoint

### Log Security

1. **Sensitive Data Masking**: All sensitive data masked before logging
2. **Access Control**: Only admins can view audit logs
3. **Immutable**: Logs cannot be modified or deleted (Firestore security rules)
4. **Encrypted**: Firestore data encrypted at rest by Google Cloud

### Querying Audit Logs

**Endpoint:** `GET /api/audit/logs`

**Query Parameters:**
- `eventType`: Filter by event type
- `userId`: Filter by user ID
- `startDate`: Filter by start date (ISO 8601)
- `endDate`: Filter by end date (ISO 8601)
- `limit`: Limit number of results (max 1000)

**Example:**
```bash
GET /api/audit/logs?eventType=verification_attempt&startDate=2026-02-01&limit=100
```

### Audit Log Statistics

**Endpoint:** `GET /api/audit/stats`

**Returns:**
- Total number of logs
- Count by event type
- Count by result (for verification attempts)
- Count by verification type

---

## 7. Security Best Practices

### For Developers

1. **Never Log Sensitive Data**
   - Always mask NIN, BVN, CAC before logging
   - Use `maskNIN()` function from `dataproClient.cjs`
   - Never log encryption keys or API credentials

2. **Use Encryption Utilities**
   - Always use `encryptData()` before storing PII
   - Always use `decryptData()` when retrieving PII
   - Clear decrypted data from memory after use

3. **Validate Input**
   - Validate all user input
   - Use express-validator for request validation
   - Sanitize input to prevent injection attacks

4. **Handle Errors Securely**
   - Don't expose sensitive data in error messages
   - Use generic error messages for users
   - Log detailed errors for debugging (with masking)

5. **Follow Least Privilege**
   - Use appropriate middleware (`requireAuth`, `requireAdmin`, etc.)
   - Check ownership for broker-created resources
   - Don't grant unnecessary permissions

### For Administrators

1. **Protect Encryption Keys**
   - Never share keys via insecure channels
   - Rotate keys annually
   - Store backups securely

2. **Monitor Audit Logs**
   - Review audit logs regularly
   - Investigate suspicious activity
   - Set up alerts for security events

3. **Keep Software Updated**
   - Update dependencies regularly
   - Apply security patches promptly
   - Monitor security advisories

4. **Conduct Security Audits**
   - Annual security audits
   - Penetration testing
   - Code reviews

5. **Train Staff**
   - Security awareness training
   - Phishing awareness
   - Incident response procedures

### For Brokers

1. **Protect Customer Data**
   - Don't share customer data with unauthorized parties
   - Use secure channels for communication
   - Report suspicious activity

2. **Use Strong Passwords**
   - Use unique, complex passwords
   - Enable multi-factor authentication (when available)
   - Don't share passwords

3. **Verify Customer Identity**
   - Ensure data accuracy before upload
   - Verify customer consent
   - Follow KYC procedures

---

## 8. Incident Response

### Security Incident Types

1. **Data Breach**: Unauthorized access to customer data
2. **Key Compromise**: Encryption key or API credential exposed
3. **System Compromise**: Server or database compromised
4. **Insider Threat**: Malicious or negligent employee action
5. **DDoS Attack**: Denial of service attack

### Incident Response Plan

#### Phase 1: Detection and Analysis

1. **Detect Incident**
   - Monitor audit logs for suspicious activity
   - Review security alerts
   - Investigate user reports

2. **Assess Severity**
   - Low: Minor security issue, no data exposure
   - Medium: Potential data exposure, limited scope
   - High: Confirmed data exposure, significant scope
   - Critical: Widespread data exposure, system compromise

3. **Assemble Response Team**
   - Security lead
   - System administrator
   - Legal counsel
   - Communications lead

#### Phase 2: Containment

1. **Immediate Actions**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IP addresses
   - Preserve evidence

2. **Short-term Containment**
   - Patch vulnerabilities
   - Reset passwords
   - Rotate encryption keys (if compromised)
   - Implement additional monitoring

#### Phase 3: Eradication

1. **Remove Threat**
   - Remove malware
   - Close security gaps
   - Update security controls

2. **Verify Removal**
   - Scan systems
   - Review logs
   - Test security controls

#### Phase 4: Recovery

1. **Restore Systems**
   - Restore from clean backups
   - Verify data integrity
   - Test functionality

2. **Monitor**
   - Enhanced monitoring for 30 days
   - Watch for recurrence
   - Review audit logs daily

#### Phase 5: Post-Incident

1. **Document Incident**
   - Timeline of events
   - Actions taken
   - Lessons learned

2. **Notify Stakeholders**
   - Affected customers (if required by NDPR)
   - Regulatory authorities (if required)
   - Management

3. **Improve Security**
   - Implement lessons learned
   - Update security controls
   - Update documentation
   - Conduct training

### Contact Information

**Security Team:**
- Email: security@nem-insurance.com
- Phone: [REDACTED]
- On-call: [REDACTED]

**Regulatory Authority:**
- Nigeria Data Protection Bureau (NDPB)
- Email: info@ndpb.gov.ng
- Website: https://ndpb.gov.ng

---

## Appendix A: Security Checklist

### Pre-Deployment

- [ ] Encryption keys generated and stored securely
- [ ] API credentials configured
- [ ] Environment variables set
- [ ] HTTPS/TLS configured
- [ ] Security headers configured
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Firestore security rules deployed
- [ ] Security testing completed
- [ ] Code review completed

### Post-Deployment

- [ ] Monitor audit logs
- [ ] Review security alerts
- [ ] Test encryption/decryption
- [ ] Verify API connectivity
- [ ] Check rate limiting
- [ ] Review error logs
- [ ] Conduct security audit

### Monthly

- [ ] Review audit logs
- [ ] Check for security updates
- [ ] Review access controls
- [ ] Test backup/restore
- [ ] Review incident response plan

### Annually

- [ ] Rotate encryption keys
- [ ] Conduct security audit
- [ ] Penetration testing
- [ ] Update security documentation
- [ ] Security awareness training
- [ ] Review and update policies

---

## Appendix B: Glossary

- **AES**: Advanced Encryption Standard
- **API**: Application Programming Interface
- **BVN**: Bank Verification Number
- **CAC**: Corporate Affairs Commission
- **GCM**: Galois/Counter Mode
- **HTTPS**: Hypertext Transfer Protocol Secure
- **IV**: Initialization Vector
- **KYC**: Know Your Customer
- **NDPR**: Nigeria Data Protection Regulation
- **NIN**: National Identification Number
- **PII**: Personally Identifiable Information
- **TLS**: Transport Layer Security

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-06 | Kiro AI | Initial version |

**Review Schedule:** Quarterly

**Next Review Date:** 2026-05-06

**Document Owner:** Security Team

**Classification:** Internal Use Only

---

**END OF DOCUMENT**
