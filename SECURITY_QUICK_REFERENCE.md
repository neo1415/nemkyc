# Security Quick Reference Guide

## 🚀 Quick Start

### For Frontend Developers

```typescript
// ✅ Making authenticated API calls
import { api } from '@/api/client';

// GET request (token added automatically)
const data = await api.get('/api/users');

// POST request
const result = await api.post('/api/forms/submit', formData);

// The API client handles:
// - CSRF tokens
// - Timestamps
// - Retries
// - Error handling
```

### For Backend Developers

```javascript
// ✅ Protecting an endpoint

// Admin only
app.get('/api/endpoint', 
  authenticate, 
  requireRole(['admin', 'super admin']), 
  async (req, res) => {
    // req.user = { uid, email, role }
  }
);

// Multiple roles
app.post('/api/endpoint',
  authenticate,
  requireRole(['admin', 'claims', 'compliance']),
  async (req, res) => {
    // Handler code
  }
);

// Rate limited (no auth)
app.post('/api/public',
  submissionLimiter,
  async (req, res) => {
    // Handler code
  }
);
```

---

## 🔑 Available Middleware

### Authentication
```javascript
authenticate
```
- Verifies Firebase ID token
- Attaches `req.user` with `{ uid, email, role }`
- Returns 401 if token invalid

### Authorization
```javascript
requireRole(['admin', 'super admin'])
```
- Checks if user has required role
- Returns 403 if insufficient permissions
- Must be used AFTER `authenticate`

### Rate Limiting
```javascript
authLimiter        // 5 attempts per 15 minutes
submissionLimiter  // 10 submissions per hour
mfaAttemptLimit    // 5 attempts per 15 minutes
```

---

## 👥 User Roles

| Role | Access Level | Can Access |
|------|--------------|------------|
| `user` | Basic | Own data, form submissions |
| `claims` | Claims processing | Claims forms, approvals |
| `compliance` | Compliance review | KYC/CDD forms, event logs |
| `admin` | Administrative | All forms, users, logs |
| `super admin` | Full control | Everything + user management |

---

## 🔒 Endpoint Protection Patterns

### Pattern 1: Admin Only
```javascript
app.get('/api/admin-only',
  authenticate,
  requireRole(['admin', 'super admin']),
  async (req, res) => { /* ... */ }
);
```

### Pattern 2: Multiple Roles
```javascript
app.get('/api/multi-role',
  authenticate,
  requireRole(['admin', 'super admin', 'claims', 'compliance']),
  async (req, res) => { /* ... */ }
);
```

### Pattern 3: Authenticated Only
```javascript
app.get('/api/auth-only',
  authenticate,
  async (req, res) => { /* ... */ }
);
```

### Pattern 4: Rate Limited Public
```javascript
app.post('/api/public',
  submissionLimiter,
  async (req, res) => { /* ... */ }
);
```

---

## 📝 Logging Best Practices

### ✅ DO: Use Safe Logging
```javascript
// For sensitive data
safeLog('User data:', userData);
// Output: User data: { email: 'jo***@example.com', phone: '***1234' }

// For non-sensitive data
console.log('Server started on port', port);
```

### ❌ DON'T: Log Sensitive Data Directly
```javascript
// BAD - exposes PII
console.log('User data:', userData);

// BAD - exposes tokens
console.log('Token:', token);
```

---

## 🌐 CORS Configuration

### Environment Variables
```env
# Production
ALLOWED_ORIGINS=https://nemforms.com,https://nem-kyc.web.app

# Development (Lovable patterns auto-enabled)
NODE_ENV=development
```

### Adding New Origins
1. Add to `.env` file:
   ```env
   ALLOWED_ORIGINS=https://nemforms.com,https://new-domain.com
   ```
2. Restart server
3. Test from new origin

---

## 🧪 Testing Endpoints

### Using curl

```bash
# Get CSRF token
curl http://localhost:3001/csrf-token

# Login
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -H "x-timestamp: $(date +%s)000" \
  -H "CSRF-Token: YOUR_CSRF_TOKEN" \
  -d '{"email":"user@example.com","password":"password"}'

# Authenticated request
curl http://localhost:3001/api/users \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Using Postman

1. **Get CSRF Token:**
   - GET `http://localhost:3001/csrf-token`
   - Save `csrfToken` from response

2. **Login:**
   - POST `http://localhost:3001/api/login`
   - Headers:
     - `Content-Type: application/json`
     - `x-timestamp: 1234567890000`
     - `CSRF-Token: <token from step 1>`
   - Body: `{"email":"user@example.com","password":"password"}`

3. **Authenticated Request:**
   - GET `http://localhost:3001/api/users`
   - Headers:
     - `Authorization: Bearer <firebase-token>`

---

## ⚠️ Common Errors

### 401 Unauthorized
**Cause:** Missing or invalid token
**Fix:** Include valid Firebase ID token in Authorization header

### 403 Forbidden
**Cause:** User doesn't have required role
**Fix:** Check user role in Firestore, ensure correct role assigned

### 429 Too Many Requests
**Cause:** Rate limit exceeded
**Fix:** Wait for rate limit window to reset

### CORS Error
**Cause:** Origin not in whitelist
**Fix:** Add origin to `ALLOWED_ORIGINS` environment variable

---

## 🔧 Environment Variables

### Required
```env
# Firebase
TYPE=service_account
PROJECT_ID=nem-customer-feedback-8d3fb
PRIVATE_KEY_ID=...
PRIVATE_KEY=...
CLIENT_EMAIL=...
CLIENT_ID=...

# CORS
ALLOWED_ORIGINS=https://nemforms.com,https://nem-kyc.web.app
NODE_ENV=production

# Email
EMAIL_PASS=your-email-password
```

### Optional
```env
# Events Logging
EVENTS_IP_SALT=random-salt-here
ENABLE_IP_GEOLOCATION=true
RAW_IP_RETENTION_DAYS=30
ENABLE_EVENTS_LOGGING=true

# Server
PORT=3001
```

---

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/login` | 5 attempts | 15 minutes |
| `/api/register` | 5 attempts | 15 minutes |
| `/api/submit-form` | 10 submissions | 1 hour |
| `/api/auth/verify-mfa` | 5 attempts | 15 minutes |

---

## 🎯 Quick Checklist

### Adding a New Protected Endpoint

- [ ] Add `authenticate` middleware
- [ ] Add `requireRole([...])` if role-specific
- [ ] Add rate limiting if needed
- [ ] Use `safeLog()` for sensitive data
- [ ] Test with different roles
- [ ] Test without authentication
- [ ] Document in API docs

### Deploying to Production

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ALLOWED_ORIGINS`
- [ ] Set all Firebase env vars
- [ ] Test authentication
- [ ] Test rate limiting
- [ ] Verify CORS
- [ ] Check logs for PII leaks

---

## 📞 Need Help?

1. Check `BACKEND_SECURITY_COMPLETE.md` for detailed documentation
2. Check `SECURITY_IMPROVEMENTS.md` for implementation history
3. Check `HOW_TO_UPDATE_SERVER.md` for step-by-step guides
4. Contact the development team

---

**Quick Reference Version:** 1.0.0
**Last Updated:** 2024-01-XX
