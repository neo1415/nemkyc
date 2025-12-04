# Backend Security Testing Checklist

## 🧪 Complete Testing Guide

Use this checklist to verify all security implementations are working correctly.

---

## 1. Authentication Testing

### Test 1.1: No Token (Should Fail)
```bash
curl http://localhost:3001/api/users
```
**Expected:** 401 Unauthorized
**Error Message:** "Unauthorized - No token provided"

### Test 1.2: Invalid Token (Should Fail)
```bash
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer invalid-token-here"
```
**Expected:** 401 Unauthorized
**Error Message:** "Unauthorized - Invalid token"

### Test 1.3: Valid Token (Should Work)
```bash
# First, get a valid Firebase token by logging in
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{"email":"admin@nem-insurance.com","password":"your-password"}'

# Then use the token
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```
**Expected:** 200 OK with user list

---

## 2. Authorization Testing (Role-Based Access)

### Test 2.1: Regular User Accessing Admin Endpoint (Should Fail)
```bash
# Login as regular user
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{"email":"user@example.com","password":"password"}'

# Try to access admin endpoint
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer USER_TOKEN"
```
**Expected:** 403 Forbidden
**Error Message:** "Forbidden - Insufficient permissions"

### Test 2.2: Admin Accessing Admin Endpoint (Should Work)
```bash
# Login as admin
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{"email":"admin@nem-insurance.com","password":"password"}'

# Access admin endpoint
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
**Expected:** 200 OK with user list

### Test 2.3: Admin Accessing Super Admin Endpoint (Should Fail)
```bash
# Try to delete user as admin
curl -X DELETE http://localhost:3001/api/users/some-user-id \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
**Expected:** 403 Forbidden

### Test 2.4: Super Admin Accessing Super Admin Endpoint (Should Work)
```bash
# Login as super admin
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{"email":"superadmin@nem-insurance.com","password":"password"}'

# Delete user
curl -X DELETE http://localhost:3001/api/users/some-user-id \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```
**Expected:** 200 OK

---

## 3. Rate Limiting Testing

### Test 3.1: Login Rate Limit (5 attempts per 15 minutes)
```bash
# Attempt 1-5 (should work)
for i in {1..5}; do
  curl -X POST http://localhost:3001/api/login \
    -H "Content-Type: application/json" \
    -H "x-timestamp: $(date +%s)000" \
    -d '{"email":"test@example.com","password":"wrong-password"}'
  echo "\nAttempt $i"
done

# Attempt 6 (should fail with rate limit)
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{"email":"test@example.com","password":"wrong-password"}'
```
**Expected (Attempt 6):** 429 Too Many Requests
**Error Message:** "Too many authentication attempts. Please try again in 15 minutes."

### Test 3.2: Form Submission Rate Limit (10 per hour)
```bash
# Submit 10 forms (should work)
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/submit-form \
    -H "Content-Type: application/json" \
    -H "x-timestamp: $(date +%s)000" \
    -d '{"formData":{"name":"Test"},"formType":"Individual KYC"}'
  echo "\nSubmission $i"
done

# Submission 11 (should fail)
curl -X POST http://localhost:3001/api/submit-form \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{"formData":{"name":"Test"},"formType":"Individual KYC"}'
```
**Expected (Submission 11):** 429 Too Many Requests
**Error Message:** "Too many form submissions. Please try again later."

### Test 3.3: Rate Limit Reset
```bash
# Wait 15 minutes for auth rate limit
# Or wait 1 hour for submission rate limit
# Then retry - should work again
```

---

## 4. CORS Testing

### Test 4.1: Allowed Origin (Should Work)
```bash
curl http://localhost:3001/api/users \
  -H "Origin: https://nemforms.com" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v
```
**Expected:** 200 OK
**Check Response Headers:** `Access-Control-Allow-Origin: https://nemforms.com`

### Test 4.2: Blocked Origin (Should Fail)
```bash
curl http://localhost:3001/api/users \
  -H "Origin: https://malicious-site.com" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v
```
**Expected:** CORS error
**Check Server Logs:** Should see "❌ CORS: Blocked origin: https://malicious-site.com"

### Test 4.3: Lovable Domain in Development (Should Work)
```bash
# Only works if NODE_ENV !== 'production'
curl http://localhost:3001/api/users \
  -H "Origin: https://preview--nem-forms-portal.lovable.app" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v
```
**Expected (Dev):** 200 OK
**Expected (Prod):** CORS error

---

## 5. Log Sanitization Testing

### Test 5.1: Check Logs for PII
```bash
# Make a request with sensitive data
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{"email":"test@example.com","password":"secret123"}'

# Check server logs
tail -n 50 access.log
```
**Expected:**
- ✅ Passwords should be `[REDACTED]`
- ✅ Emails should be masked: `te***@example.com`
- ✅ Tokens should be `[REDACTED]`
- ✅ Raw IPs should be masked: `192.168.1.***`

### Test 5.2: Verify safeLog Function
```bash
# Check server console output
# Look for any logs that use safeLog()
```
**Expected:** All sensitive fields automatically redacted

---

## 6. Event Logging Testing

### Test 6.1: Login Event Logged
```bash
# Login
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{"email":"test@example.com","password":"password"}'

# Check event logs
curl http://localhost:3001/api/events-logs \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
**Expected:** Event with action='login' should be present

### Test 6.2: Form Submission Event Logged
```bash
# Submit form
curl -X POST http://localhost:3001/api/submit-form \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{"formData":{"name":"Test"},"formType":"Individual KYC"}'

# Check event logs
curl http://localhost:3001/api/events-logs \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
**Expected:** Event with action='submit' should be present

---

## 7. Endpoint-Specific Testing

### Test 7.1: Update Claim Status (Admin/Claims Only)
```bash
# As regular user (should fail)
curl -X POST http://localhost:3001/api/update-claim-status \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"claims-motor","documentId":"123","status":"approved","approverUid":"uid","comment":"Approved"}'
```
**Expected:** 403 Forbidden

```bash
# As claims officer (should work)
curl -X POST http://localhost:3001/api/update-claim-status \
  -H "Authorization: Bearer CLAIMS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"claims-motor","documentId":"123","status":"approved","approverUid":"uid","comment":"Approved"}'
```
**Expected:** 200 OK

### Test 7.2: Get Forms (Admin/Claims/Compliance Only)
```bash
# As regular user (should fail)
curl http://localhost:3001/api/forms/kyc-individual \
  -H "Authorization: Bearer USER_TOKEN"
```
**Expected:** 403 Forbidden

```bash
# As compliance officer (should work)
curl http://localhost:3001/api/forms/kyc-individual \
  -H "Authorization: Bearer COMPLIANCE_TOKEN"
```
**Expected:** 200 OK with forms list

### Test 7.3: Delete User (Super Admin Only)
```bash
# As admin (should fail)
curl -X DELETE http://localhost:3001/api/users/test-user-id \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
**Expected:** 403 Forbidden

```bash
# As super admin (should work)
curl -X DELETE http://localhost:3001/api/users/test-user-id \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```
**Expected:** 200 OK

---

## 8. Integration Testing

### Test 8.1: Complete User Flow
1. Register new user
2. Login
3. Submit form
4. View own submissions
5. Logout

### Test 8.2: Complete Admin Flow
1. Login as admin
2. View all forms
3. Update form status
4. View event logs
5. Logout

### Test 8.3: Complete Claims Flow
1. Login as claims officer
2. View claims
3. Approve/reject claim
4. Send email notification
5. Logout

---

## 9. Performance Testing

### Test 9.1: Response Times
```bash
# Measure response time
time curl http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected:** < 500ms for most endpoints

### Test 9.2: Concurrent Requests
```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl http://localhost:3001/api/users \
    -H "Authorization: Bearer YOUR_TOKEN" &
done
wait
```
**Expected:** All requests succeed

---

## 10. Security Audit

### Test 10.1: SQL Injection (N/A - Using Firestore)
✅ Not applicable - using Firestore NoSQL database

### Test 10.2: XSS Protection
✅ Handled by React on frontend
✅ Input sanitization on backend

### Test 10.3: CSRF Protection
```bash
# Try request without CSRF token
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{"email":"test@example.com","password":"password"}'
```
**Expected:** Should work (CSRF exempted for login)

### Test 10.4: Token Expiration
```bash
# Use expired token
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```
**Expected:** 401 Unauthorized

---

## ✅ Testing Summary

### Critical Tests (Must Pass)
- [ ] Authentication with valid token works
- [ ] Authentication without token fails (401)
- [ ] Authorization with wrong role fails (403)
- [ ] Rate limiting blocks after limit
- [ ] CORS blocks unauthorized origins
- [ ] Logs don't contain PII

### Important Tests (Should Pass)
- [ ] All role combinations work correctly
- [ ] Event logging captures all actions
- [ ] Rate limits reset after time window
- [ ] Lovable domains work in development

### Nice to Have Tests
- [ ] Performance is acceptable
- [ ] Concurrent requests work
- [ ] Error messages are helpful

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Environment: [ ] Development [ ] Staging [ ] Production

Authentication Tests:
[ ] 1.1 No Token - PASS/FAIL
[ ] 1.2 Invalid Token - PASS/FAIL
[ ] 1.3 Valid Token - PASS/FAIL

Authorization Tests:
[ ] 2.1 User → Admin Endpoint - PASS/FAIL
[ ] 2.2 Admin → Admin Endpoint - PASS/FAIL
[ ] 2.3 Admin → Super Admin Endpoint - PASS/FAIL
[ ] 2.4 Super Admin → Super Admin Endpoint - PASS/FAIL

Rate Limiting Tests:
[ ] 3.1 Login Rate Limit - PASS/FAIL
[ ] 3.2 Form Submission Rate Limit - PASS/FAIL
[ ] 3.3 Rate Limit Reset - PASS/FAIL

CORS Tests:
[ ] 4.1 Allowed Origin - PASS/FAIL
[ ] 4.2 Blocked Origin - PASS/FAIL
[ ] 4.3 Lovable Domain (Dev) - PASS/FAIL

Log Sanitization Tests:
[ ] 5.1 PII Redacted - PASS/FAIL
[ ] 5.2 safeLog Working - PASS/FAIL

Event Logging Tests:
[ ] 6.1 Login Event - PASS/FAIL
[ ] 6.2 Form Submission Event - PASS/FAIL

Endpoint Tests:
[ ] 7.1 Update Claim Status - PASS/FAIL
[ ] 7.2 Get Forms - PASS/FAIL
[ ] 7.3 Delete User - PASS/FAIL

Notes:
_________________________________
_________________________________
_________________________________

Overall Status: [ ] PASS [ ] FAIL
```

---

**Testing Guide Version:** 1.0.0
**Last Updated:** 2024-01-XX
