# TODO Checklist - Security Improvements

## ✅ Completed (By AI)

- [x] Create `.env.example` template
- [x] Create `.env.local` with actual values
- [x] Update `src/firebase/config.ts` to use environment variables
- [x] Create `src/config/constants.ts` for centralized configuration
- [x] Update all service files to use constants
- [x] Create centralized API client (`src/api/client.ts`)
- [x] Create Error Boundary component
- [x] Integrate Error Boundary in App.tsx
- [x] Create secure storage utility
- [x] Update AuthContext to use secure storage
- [x] Enhance `.gitignore`
- [x] Create input validation utilities
- [x] Create comprehensive documentation

## 🔄 Your Turn (Frontend - Optional)

### Low Priority
- [ ] Add loading skeletons to more components
- [ ] Add input validation layer to form submissions
- [ ] Add toast notifications for all API errors
- [ ] Add performance monitoring (e.g., Web Vitals)
- [ ] Add error monitoring service (e.g., Sentry)

### Testing
- [ ] Test environment variables work correctly
- [ ] Test error boundary catches errors
- [ ] Test secure storage encryption/decryption
- [ ] Test API client retry logic
- [ ] Test form draft save/restore

## ⚠️ Your Turn (Backend - Critical)

### High Priority (Do First)
- [ ] **Add authentication middleware**
  - Create `middleware/auth.js`
  - Add to all protected routes
  - Test with valid/invalid tokens

- [ ] **Add rate limiting to auth endpoints**
  - Login endpoint (5 attempts per 15 min)
  - Registration endpoint (3 attempts per hour)
  - Password reset endpoint (3 attempts per hour)

- [ ] **Tighten CORS policy**
  - Move allowed origins to environment variables
  - Remove wildcard patterns
  - Test with different origins

### Medium Priority (Do Soon)
- [ ] **Sanitize logs**
  - Remove PII from console.log
  - Remove tokens from logs
  - Remove passwords from logs
  - Add log levels (debug, info, warn, error)

- [ ] **Add rate limiting to form submissions**
  - 10 submissions per hour per IP
  - 50 submissions per day per user

- [ ] **Remove unused code**
  - Remove commented-out MFA logic (or re-enable it)
  - Remove `getFormData` legacy function
  - Remove `setSuperAdminOnStartup` if not used
  - Remove undefined function references

### Low Priority (Do Later)
- [ ] **Split server.js into modules**
  - Create `routes/` directory
  - Create `middleware/` directory
  - Create `services/` directory
  - Create `utils/` directory

- [ ] **Convert backend to TypeScript**
  - Rename `server.js` to `server.ts`
  - Add type definitions
  - Configure TypeScript

- [ ] **Add comprehensive testing**
  - Unit tests for utilities
  - Integration tests for API endpoints
  - E2E tests for critical flows

- [ ] **Set up CI/CD**
  - GitHub Actions for tests
  - Automatic deployment
  - Environment-specific builds

## 📋 Deployment Checklist

### Before Deployment
- [ ] Test all changes locally
- [ ] Update environment variables in hosting platform
- [ ] Test with production API URL
- [ ] Check all API endpoints work
- [ ] Test authentication flows
- [ ] Test form submissions
- [ ] Test error handling

### During Deployment
- [ ] Deploy frontend
- [ ] Deploy backend (if changes made)
- [ ] Update environment variables
- [ ] Test production deployment
- [ ] Monitor for errors

### After Deployment
- [ ] Monitor error logs
- [ ] Monitor API performance
- [ ] Check user feedback
- [ ] Fix any issues quickly

## 🎯 Priority Matrix

### Do Immediately (Critical)
1. Test local changes
2. Add backend authentication middleware
3. Add rate limiting to auth endpoints

### Do This Week (High)
4. Tighten CORS policy
5. Sanitize logs
6. Deploy to production

### Do This Month (Medium)
7. Add rate limiting to form submissions
8. Remove unused code
9. Add error monitoring

### Do This Quarter (Low)
10. Split backend into modules
11. Convert backend to TypeScript
12. Add comprehensive testing
13. Set up CI/CD

## 📝 Notes

### Authentication Middleware Example
```javascript
// backend/middleware/auth.js
const admin = require('firebase-admin');

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
```

### Rate Limiting Example
```javascript
// Add to server.js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts'
});

app.post('/api/login', loginLimiter, async (req, res) => {
  // ... existing code
});
```

### CORS Example
```javascript
// Add to .env
ALLOWED_ORIGINS=https://nemforms.com,https://app.nemforms.com

// In server.js
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));
```

## 🔍 Testing Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend (if you add tests)
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 📞 Need Help?

### Documentation
- `QUICK_START.md` - Quick setup guide
- `SECURITY_IMPROVEMENTS.md` - Detailed documentation
- `FIXES_SUMMARY.md` - Summary of changes

### Common Issues
- Environment variables not working? Restart dev server
- CORS errors? Check backend CORS configuration
- Authentication errors? Check token is being sent
- Rate limiting errors? Wait and try again

## ✨ Success Criteria

You'll know you're done when:
- [ ] All tests pass
- [ ] No hardcoded secrets in code
- [ ] All protected endpoints require authentication
- [ ] Rate limiting works on auth endpoints
- [ ] CORS only allows approved origins
- [ ] Logs don't contain sensitive data
- [ ] Production deployment works
- [ ] No errors in production logs

---

**Last Updated:** 2024-01-XX
**Status:** Frontend complete, backend pending
