# Production Readiness Checklist

## ✅ Code Review Complete

### Frontend (React/Vite)

#### ✅ Environment Configuration
- ✅ `.env.production` exists with production API URL
- ✅ `VITE_API_BASE_URL=https://nem-server-rhdb.onrender.com`
- ✅ All Firebase config variables set correctly
- ✅ No hardcoded localhost URLs in source code
- ✅ `src/config/constants.ts` uses environment variables

#### ✅ Code Quality
- ✅ No `console.log` or `console.debug` statements in source
- ✅ All API calls use `API_BASE_URL` from constants
- ✅ Proper error handling throughout
- ✅ No development-only code in production build

#### ✅ Security
- ✅ CSRF tokens implemented
- ✅ Secure storage for sensitive data
- ✅ No API keys or secrets in frontend code
- ✅ Proper authentication checks

### Backend (Node.js/Express)

#### ✅ Environment Configuration
- ✅ All required environment variables documented in `.env.example`
- ✅ `NODE_ENV=production` check throughout code
- ✅ CORS properly configured with production domains
- ✅ Session cookies secure in production

#### ✅ Security Features
- ✅ Helmet.js security headers enabled
- ✅ Rate limiting on all sensitive endpoints
- ✅ CSRF protection implemented
- ✅ Input validation on all endpoints
- ✅ SQL injection protection (mongoSanitize)
- ✅ XSS protection (xss-clean)
- ✅ HPP (HTTP Parameter Pollution) protection
- ✅ Trust proxy set to `1` (not `true`)

#### ✅ CORS Configuration
```javascript
allowedOrigins = [
  // Development (only allowed in dev mode)
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  
  // Production
  'https://nemforms.com',
  'https://www.nemforms.com',
  'https://nem-kyc.web.app',
  'https://nem-kyc.firebaseapp.com',
  'https://nem-server-rhdb.onrender.com',
]
```

#### ✅ Session Management
- ✅ Session timeout: 2 hours
- ✅ Secure cookies in production (HTTPS only)
- ✅ HttpOnly cookies
- ✅ SameSite policy configured
- ✅ Activity tracking for session expiry

#### ✅ Logging
- ✅ Debug logs disabled in production
- ✅ Error logging enabled
- ✅ Events logging system active
- ✅ IP masking for privacy
- ✅ Sensitive data not logged

## 🔧 Required Environment Variables

### Backend (.env on server)

**CRITICAL - Must be set:**
```bash
# Firebase Admin SDK
TYPE=service_account
PROJECT_ID=nem-customer-feedback-8d3fb
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_STORAGE_BUCKET=nem-customer-feedback-8d3fb.appspot.com
FIREBASE_DATABASE_URL=https://nem-customer-feedback-8d3fb.firebaseio.com

# Security (Generate new for production!)
EVENTS_IP_SALT=<generate-with-crypto>
VITE_STORAGE_SALT=<generate-with-crypto>
SERVER_API_KEY=<generate-with-crypto>

# Email Configuration
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=kyc@nem-insurance.com
EMAIL_PASS=<app-specific-password>

# Environment
NODE_ENV=production
PORT=3001

# Optional but recommended
SUPER_ADMIN_EMAIL=admin@nem-insurance.com
COOKIE_DOMAIN=.nemforms.com
ENABLE_EVENTS_LOGGING=true
ENABLE_IP_GEOLOCATION=false
RAW_IP_RETENTION_DAYS=30
```

### Frontend (Build-time variables)

**Set in Render.com or build environment:**
```bash
VITE_API_BASE_URL=https://nem-server-rhdb.onrender.com
VITE_NODE_ENV=production
VITE_FIREBASE_API_KEY=AIzaSyDTyrzbQ4xYV0IAvngwgCUBf6EPnflacSw
VITE_FIREBASE_AUTH_DOMAIN=nem-customer-feedback-8d3fb.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nem-customer-feedback-8d3fb
VITE_FIREBASE_STORAGE_BUCKET=nem-customer-feedback-8d3fb.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=524975485983
VITE_FIREBASE_APP_ID=1:524975485983:web:3a859424a3314d53ab112a
VITE_FIREBASE_MEASUREMENT_ID=G-8BH08J5X7G
```

## 🚀 Deployment Steps

### 1. Backend Deployment (Render.com)

```bash
# 1. Ensure all environment variables are set in Render dashboard
# 2. Push to main branch (auto-deploys)
git push origin main

# 3. Monitor deployment logs
# 4. Verify health endpoint
curl https://nem-server-rhdb.onrender.com/health

# 5. Test authentication
curl https://nem-server-rhdb.onrender.com/csrf-token
```

### 2. Frontend Deployment (Firebase Hosting)

```bash
# 1. Build with production environment
npm run build

# 2. Preview build locally (optional)
npm run preview

# 3. Deploy to Firebase
firebase deploy --only hosting

# 4. Verify deployment
# Visit https://nemforms.com or https://nem-kyc.web.app
```

### 3. Firebase Rules Deployment

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# Deploy all Firebase configs
firebase deploy --only firestore:indexes,firestore:rules,storage
```

## ✅ Post-Deployment Verification

### Backend Health Checks
- [ ] Health endpoint responds: `https://nem-server-rhdb.onrender.com/health`
- [ ] CSRF token endpoint works: `https://nem-server-rhdb.onrender.com/csrf-token`
- [ ] CORS allows production domains
- [ ] Rate limiting is active
- [ ] Session cookies are secure (check DevTools)

### Frontend Checks
- [ ] Site loads at production URL
- [ ] Login works correctly
- [ ] Forms can be submitted
- [ ] Admin dashboard accessible
- [ ] PDF downloads work
- [ ] CSV exports work
- [ ] No console errors in browser
- [ ] All images/assets load

### Security Checks
- [ ] HTTPS enforced (no HTTP access)
- [ ] Security headers present (check with securityheaders.com)
- [ ] Cookies are Secure and HttpOnly
- [ ] CSRF protection working
- [ ] Rate limiting prevents abuse
- [ ] Authentication required for protected routes

### Functionality Checks
- [ ] User registration works
- [ ] User login works
- [ ] Form submission works
- [ ] Email notifications sent
- [ ] Admin can view submissions
- [ ] Status updates work
- [ ] Events logging works
- [ ] File uploads work
- [ ] PDF generation works
- [ ] CSV export works

## 🔍 Monitoring

### What to Monitor
1. **Server Logs** - Check Render.com logs for errors
2. **Error Rate** - Monitor 4xx and 5xx responses
3. **Response Times** - Should be < 1 second for most requests
4. **Rate Limit Hits** - Check if legitimate users are being blocked
5. **Session Expiry** - Monitor session timeout complaints
6. **Email Delivery** - Verify emails are being sent

### Key Metrics
- **Uptime**: Should be > 99%
- **Response Time**: < 1s for 95th percentile
- **Error Rate**: < 1%
- **Rate Limit Blocks**: < 0.1% of requests

## 🚨 Rollback Plan

If issues occur in production:

```bash
# 1. Revert frontend to previous version
firebase hosting:rollback

# 2. Revert backend (Render.com)
# Use Render dashboard to rollback to previous deployment

# 3. Check Firebase rules
# Ensure rules haven't been changed incorrectly

# 4. Notify users if needed
# Use admin panel to send notifications
```

## 📝 Known Production Considerations

### Session Management
- Sessions expire after 2 hours of inactivity
- Users will need to re-login after expiry
- Session cookie works across subdomains with `COOKIE_DOMAIN=.nemforms.com`

### Rate Limiting
- Login: 10 attempts per 15 minutes
- Form submission: 15 per hour
- API calls: 200 per 15 minutes
- Adjust if legitimate users are blocked

### CORS
- Only whitelisted domains can access API
- Localhost only allowed in development
- Add new domains to `allowedOrigins` array if needed

### File Uploads
- Max size: 5MB per file
- Max files: 5 per request
- Allowed types: JPG, PNG, PDF, DOCX
- Stored in Firebase Storage

## ✅ Final Checklist Before Deploy

- [ ] All environment variables set correctly
- [ ] `.env.production` file has correct API URL
- [ ] Firebase rules deployed
- [ ] Backend deployed and healthy
- [ ] Frontend built with production config
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Backup of current production taken
- [ ] Rollback plan ready
- [ ] Team notified of deployment
- [ ] Monitoring dashboard ready

## 🎉 Ready to Deploy!

Everything looks good! No hardcoded localhost URLs, proper environment configuration, and all security measures in place.

**Deployment Command:**
```bash
# Backend (auto-deploys on git push)
git push origin main

# Frontend
npm run build && firebase deploy --only hosting

# Firebase rules (if changed)
firebase deploy --only firestore:rules,storage
```
