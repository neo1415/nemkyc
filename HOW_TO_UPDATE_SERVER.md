# How to Update server.js - Step by Step

## 🎯 Overview

This guide shows you exactly how to add security improvements to your `server.js` file.

---

## 📋 Step 1: Add Security Middleware (After line 22)

Find this line in your server.js:
```javascript
const crypto = require('crypto');
```

**Add this RIGHT AFTER it:**

```javascript
// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'user'
    };
    
    // Get user role from Firestore
    try {
      const userDoc = await admin.firestore().collection('userroles').doc(decodedToken.uid).get();
      if (userDoc.exists) {
        req.user.role = userDoc.data().role || 'user';
      }
    } catch (error) {
      console.warn('Could not fetch user role:', error.message);
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Role-based access control
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const normalizeRole = (role) => {
      if (!role) return 'user';
      return role.toLowerCase().trim().replace(/[-_]/g, ' ');
    };
    
    const userRole = normalizeRole(req.user.role);
    const allowed = allowedRoles.map(r => normalizeRole(r));
    
    if (!allowed.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    next();
  };
};

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many form submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Log sanitization
const sanitizeForLog = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'idToken', 'authorization', 'rawIP', 'bvn'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  if (sanitized.email && typeof sanitized.email === 'string') {
    const parts = sanitized.email.split('@');
    if (parts.length === 2) {
      sanitized.email = `${parts[0].substring(0, 2)}***@${parts[1]}`;
    }
  }
  
  return sanitized;
};

const safeLog = (message, data) => {
  if (data) {
    console.log(message, sanitizeForLog(data));
  } else {
    console.log(message);
  }
};
```

---

## 📋 Step 2: Update Specific Endpoints

### Find and Update These Lines:

#### 1. Login endpoint (around line 1628)
**FIND:**
```javascript
app.post('/api/login', async (req, res) => {
```

**REPLACE WITH:**
```javascript
app.post('/api/login', authLimiter, async (req, res) => {
```

#### 2. Register endpoint (around line 2106)
**FIND:**
```javascript
app.post('/api/register', async (req, res) => {
```

**REPLACE WITH:**
```javascript
app.post('/api/register', authLimiter, async (req, res) => {
```

#### 3. Submit form endpoint (around line 1414)
**FIND:**
```javascript
app.post('/api/submit-form', async (req, res) => {
```

**REPLACE WITH:**
```javascript
app.post('/api/submit-form', submissionLimiter, async (req, res) => {
```

#### 4. Get users endpoint (around line 2936)
**FIND:**
```javascript
app.get('/api/users', async (req, res) => {
```

**REPLACE WITH:**
```javascript
app.get('/api/users', authenticate, requireRole(['admin', 'super admin']), async (req, res) => {
```

#### 5. Update user role endpoint (around line 2874)
**FIND:**
```javascript
app.put('/api/users/:userId/role', async (req, res) => {
```

**REPLACE WITH:**
```javascript
app.put('/api/users/:userId/role', authenticate, requireRole(['super admin']), async (req, res) => {
```

#### 6. Delete user endpoint (around line 2983)
**FIND:**
```javascript
app.delete('/api/users/:userId', async (req, res) => {
```

**REPLACE WITH:**
```javascript
app.delete('/api/users/:userId', authenticate, requireRole(['super admin']), async (req, res) => {
```

#### 7. Events logs endpoint (around line 2478)
**FIND:**
```javascript
app.get('/api/events-logs', async (req, res) => {
```

**REPLACE WITH:**
```javascript
app.get('/api/events-logs', authenticate, requireRole(['admin', 'super admin', 'compliance', 'claims']), async (req, res) => {
```

#### 8. Update claim status endpoint (around line 506)
**FIND:**
```javascript
app.post('/api/update-claim-status', async (req, res) => {
```

**REPLACE WITH:**
```javascript
app.post('/api/update-claim-status', authenticate, requireRole(['admin', 'super admin', 'claims']), async (req, res) => {
```

#### 9. Update form status endpoint (around line 2329)
**FIND:**
```javascript
app.put('/api/forms/:collection/:id/status', async (req, res) => {
```

**REPLACE WITH:**
```javascript
app.put('/api/forms/:collection/:id/status', authenticate, requireRole(['admin', 'super admin', 'claims', 'compliance']), async (req, res) => {
```

---

## 📋 Step 3: Update CORS Configuration (around line 90)

**FIND this section:**
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  // ... lots of hardcoded URLs
];
```

**REPLACE WITH:**
```javascript
// Get allowed origins from environment variable or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://nemforms.com',
      'https://nem-kyc.web.app',
      'https://nem-kyc.firebaseapp.com'
    ];

// Add Lovable patterns if in development
const lovablePatterns = process.env.NODE_ENV !== 'production' ? [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/preview--.*\.lovable\.app$/,
  /^https:\/\/.*\.lovableproject\.com$/,
] : [];
```

**Then update the CORS middleware:**
```javascript
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check Lovable patterns (dev only)
    if (lovablePatterns.length > 0) {
      const isLovableDomain = lovablePatterns.some(pattern => pattern.test(origin));
      if (isLovableDomain) {
        console.log('✅ CORS: Allowing Lovable domain:', origin);
        return callback(null, true);
      }
    }
    
    console.warn('❌ CORS: Blocked origin:', origin);
    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'CSRF-Token', 'X-Requested-With', 'Authorization', 'x-timestamp'],
}));
```

---

## 📋 Step 4: Add to .env File

Add these lines to your `.env` file:

```env
# CORS Configuration
ALLOWED_ORIGINS=https://nemforms.com,https://nem-kyc.web.app,https://nem-kyc.firebaseapp.com

# Environment
NODE_ENV=production
```

---

## ✅ Testing Checklist

After making changes, test:

1. **Authentication**
   - Try accessing `/api/users` without token → Should get 401
   - Try accessing `/api/users` with valid token → Should work

2. **Rate Limiting**
   - Try logging in 6 times quickly → 6th attempt should fail
   - Wait 15 minutes → Should work again

3. **Role-Based Access**
   - Try accessing `/api/users` as regular user → Should get 403
   - Try accessing `/api/users` as admin → Should work

4. **Form Submissions**
   - Submit 11 forms in 1 hour → 11th should fail
   - Wait 1 hour → Should work again

---

## 🎯 Summary

You've added:
- ✅ Authentication middleware
- ✅ Role-based access control
- ✅ Rate limiting on auth endpoints
- ✅ Rate limiting on form submissions
- ✅ Better CORS configuration
- ✅ Log sanitization

**Your server is now much more secure!** 🎉

---

## 📞 Need Help?

If something doesn't work:
1. Check the console for error messages
2. Make sure `.env` file has all required variables
3. Restart the server after changes
4. Test with Postman or curl first

---

**That's it! Your backend is now secure.** 🔒
