# Backend Files Migration Guide

## 📋 Complete List of Backend Files

This document lists ALL backend files that need to be copied to your backend repository.

## 🗂️ File Structure

```
backend-repo/
├── server.js                                    # Main Express server (12,744 lines)
├── package.json                                 # Dependencies
├── .env.example                                 # Environment variables template
├── .gitignore                                   # Git ignore file
│
├── server-services/                             # External API clients
│   ├── dataproClient.cjs                       # Datapro NIN verification client
│   └── __mocks__/
│       └── dataproClient.cjs                   # Mock for testing
│
├── server-utils/                                # Utility modules
│   ├── encryption.cjs                          # AES-256-GCM encryption (NDPR compliance)
│   ├── auditLogger.cjs                         # Comprehensive audit logging
│   ├── rateLimiter.cjs                         # Rate limiting (50 req/min)
│   ├── apiUsageTracker.cjs                     # API usage tracking & cost monitoring
│   ├── verificationQueue.cjs                   # Queue management for verifications
│   ├── healthMonitor.cjs                       # Health monitoring & alerting
│   ├── securityMiddleware.cjs                  # Security middleware
│   └── __tests__/
│       ├── encryption.test.cjs                 # Encryption tests
│       └── verificationQueue.test.cjs          # Queue tests
│
├── scripts/                                     # Utility scripts
│   ├── encrypt-existing-identity-data.js       # Migration script for encryption
│   └── ENCRYPTION_MIGRATION_README.md          # Migration guide
│
├── load-tests/                                  # Load testing
│   ├── bulk-verification-test.js               # Bulk verification load test
│   ├── rate-limit-test.js                      # Rate limit testing
│   ├── test-data-generator.js                  # Test data generator
│   ├── package.json                            # Load test dependencies
│   └── README.md                               # Load testing guide
│
└── docs/                                        # Documentation
    ├── API_DOCUMENTATION.md                    # Complete API docs
    ├── PRODUCTION_DEPLOYMENT_CHECKLIST.md      # Deployment checklist
    ├── PRODUCTION_MONITORING_SETUP.md          # Monitoring setup
    ├── PRODUCTION_ROLLBACK_PLAN.md             # Rollback procedures
    ├── SECURITY_DOCUMENTATION.md               # Security documentation
    ├── LOAD_TESTING_GUIDE.md                   # Load testing guide
    ├── VERIFICATION_QUEUE_GUIDE.md             # Queue system guide
    ├── QUEUE_SYSTEM_DIAGRAM.md                 # Queue architecture
    ├── NDPR_ENCRYPTION_IMPLEMENTATION.md       # Encryption implementation
    ├── BROKER_TRAINING_GUIDE.md                # Broker training
    └── ADMIN_USER_GUIDE.md                     # Admin user guide
```

## 📦 Files to Copy

### 1. Core Server Files

**From current repo → To backend repo:**

```bash
# Main server
server.js → server.js

# Package configuration
package.json → package.json (merge dependencies)

# Environment template
.env.example → .env.example
```

### 2. Server Services (API Clients)

```bash
server-services/dataproClient.cjs → server-services/dataproClient.cjs
server-services/__mocks__/dataproClient.cjs → server-services/__mocks__/dataproClient.cjs
```

### 3. Server Utilities

```bash
server-utils/encryption.cjs → server-utils/encryption.cjs
server-utils/auditLogger.cjs → server-utils/auditLogger.cjs
server-utils/rateLimiter.cjs → server-utils/rateLimiter.cjs
server-utils/apiUsageTracker.cjs → server-utils/apiUsageTracker.cjs
server-utils/verificationQueue.cjs → server-utils/verificationQueue.cjs
server-utils/healthMonitor.cjs → server-utils/healthMonitor.cjs
server-utils/securityMiddleware.cjs → server-utils/securityMiddleware.cjs
server-utils/__tests__/encryption.test.cjs → server-utils/__tests__/encryption.test.cjs
server-utils/__tests__/verificationQueue.test.cjs → server-utils/__tests__/verificationQueue.test.cjs
```

### 4. Scripts

```bash
scripts/encrypt-existing-identity-data.js → scripts/encrypt-existing-identity-data.js
scripts/ENCRYPTION_MIGRATION_README.md → scripts/ENCRYPTION_MIGRATION_README.md
```

### 5. Load Tests

```bash
load-tests/bulk-verification-test.js → load-tests/bulk-verification-test.js
load-tests/rate-limit-test.js → load-tests/rate-limit-test.js
load-tests/test-data-generator.js → load-tests/test-data-generator.js
load-tests/package.json → load-tests/package.json
load-tests/README.md → load-tests/README.md
```

### 6. Documentation

```bash
docs/API_DOCUMENTATION.md → docs/API_DOCUMENTATION.md
docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md → docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md
docs/PRODUCTION_MONITORING_SETUP.md → docs/PRODUCTION_MONITORING_SETUP.md
docs/PRODUCTION_ROLLBACK_PLAN.md → docs/PRODUCTION_ROLLBACK_PLAN.md
docs/SECURITY_DOCUMENTATION.md → docs/SECURITY_DOCUMENTATION.md (from .kiro/specs/identity-remediation/)
docs/LOAD_TESTING_GUIDE.md → docs/LOAD_TESTING_GUIDE.md
docs/VERIFICATION_QUEUE_GUIDE.md → docs/VERIFICATION_QUEUE_GUIDE.md
docs/QUEUE_SYSTEM_DIAGRAM.md → docs/QUEUE_SYSTEM_DIAGRAM.md
docs/NDPR_ENCRYPTION_IMPLEMENTATION.md → docs/NDPR_ENCRYPTION_IMPLEMENTATION.md
docs/BROKER_TRAINING_GUIDE.md → docs/BROKER_TRAINING_GUIDE.md
docs/ADMIN_USER_GUIDE.md → docs/ADMIN_USER_GUIDE.md
```

## 🚀 Quick Copy Commands

### Option 1: Manual Copy (Recommended for Review)

```bash
# Navigate to your current repo
cd /path/to/current/repo

# Create backend package directory
mkdir -p backend-package

# Copy server files
cp server.js backend-package/
cp package.json backend-package/
cp .env.example backend-package/

# Copy server-services
cp -r server-services backend-package/

# Copy server-utils
cp -r server-utils backend-package/

# Copy scripts
cp -r scripts backend-package/

# Copy load-tests
cp -r load-tests backend-package/

# Copy docs
mkdir -p backend-package/docs
cp docs/API_DOCUMENTATION.md backend-package/docs/
cp docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md backend-package/docs/
cp docs/PRODUCTION_MONITORING_SETUP.md backend-package/docs/
cp docs/PRODUCTION_ROLLBACK_PLAN.md backend-package/docs/
cp docs/LOAD_TESTING_GUIDE.md backend-package/docs/
cp docs/VERIFICATION_QUEUE_GUIDE.md backend-package/docs/
cp docs/QUEUE_SYSTEM_DIAGRAM.md backend-package/docs/
cp docs/NDPR_ENCRYPTION_IMPLEMENTATION.md backend-package/docs/
cp docs/BROKER_TRAINING_GUIDE.md backend-package/docs/
cp docs/ADMIN_USER_GUIDE.md backend-package/docs/
cp .kiro/specs/identity-remediation/SECURITY_DOCUMENTATION.md backend-package/docs/

# Now copy backend-package to your backend repo
cp -r backend-package/* /path/to/backend/repo/
```

### Option 2: Direct Copy to Backend Repo

```bash
# Set your backend repo path
BACKEND_REPO="/path/to/backend/repo"

# Copy all files
cp server.js $BACKEND_REPO/
cp package.json $BACKEND_REPO/package-backend.json  # Rename to merge later
cp .env.example $BACKEND_REPO/

# Copy directories
cp -r server-services $BACKEND_REPO/
cp -r server-utils $BACKEND_REPO/
cp -r scripts $BACKEND_REPO/
cp -r load-tests $BACKEND_REPO/

# Copy docs
mkdir -p $BACKEND_REPO/docs
cp docs/*.md $BACKEND_REPO/docs/
cp .kiro/specs/identity-remediation/SECURITY_DOCUMENTATION.md $BACKEND_REPO/docs/
```

## 📝 Dependencies to Add

Add these to your backend `package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "firebase-admin": "^11.11.0",
    "axios": "^1.6.0",
    "nodemailer": "^6.9.7",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "express-mongo-sanitize": "^2.2.0",
    "xss-clean": "^0.1.4",
    "hpp": "^0.2.3",
    "morgan": "^1.10.0",
    "cookie-parser": "^1.4.6",
    "csurf": "^1.11.0",
    "express-validator": "^7.0.1",
    "compression": "^1.7.4",
    "bcrypt": "^5.1.1",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "vitest": "^4.0.16",
    "artillery": "^2.0.0"
  }
}
```

## 🔐 Environment Variables

Create `.env` file with these variables:

```env
# Firebase Admin SDK
TYPE=service_account
PROJECT_ID=your-project-id
PRIVATE_KEY_ID=your-private-key-id
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
CLIENT_ID=your-client-id
AUTH_URI=https://accounts.google.com/o/oauth2/auth
TOKEN_URI=https://oauth2.googleapis.com/token
AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
CLIENT_X509_CERT_URL=your-cert-url
UNIVERSE_DOMAIN=googleapis.com
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Datapro API
DATAPRO_SERVICE_ID=your-datapro-service-id
DATAPRO_API_URL=https://api.datapronigeria.com

# Encryption (NDPR Compliance)
ENCRYPTION_KEY=your-64-character-hex-key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=NEM Insurance <noreply@nem-insurance.com>

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS (Optional - add additional origins)
ADDITIONAL_ALLOWED_ORIGINS=https://your-custom-domain.com

# Firebase Client (for frontend reference)
REACT_APP_FIREBASE_KEY=your-api-key
REACT_APP_AUTH_DOMAIN=your-project.firebaseapp.com
```

## ✅ Post-Copy Checklist

After copying files:

1. **Install Dependencies**
   ```bash
   cd /path/to/backend/repo
   npm install
   ```

2. **Generate Encryption Key**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Add output to `.env` as `ENCRYPTION_KEY`

3. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Fill in all required values
   - Verify Firebase credentials
   - Add Datapro SERVICEID

4. **Test Server Startup**
   ```bash
   npm start
   ```
   Should see: "✅ Server running on port 5000"

5. **Run Tests**
   ```bash
   npm test
   ```

6. **Test Health Endpoint**
   ```bash
   curl http://localhost:5000/api/health
   ```

7. **Verify Datapro Integration**
   - Check logs for "Datapro API client initialized"
   - Verify SERVICEID is not exposed in responses

8. **Test Encryption**
   ```bash
   node -e "const {encryptData, decryptData} = require('./server-utils/encryption.cjs'); const encrypted = encryptData('test'); console.log('Encrypted:', encrypted); console.log('Decrypted:', decryptData(encrypted));"
   ```

## 🔍 Verification Steps

1. **Check File Structure**
   ```bash
   ls -la server-services/
   ls -la server-utils/
   ls -la scripts/
   ls -la load-tests/
   ls -la docs/
   ```

2. **Verify Imports**
   ```bash
   grep -r "require.*server-utils" server.js
   grep -r "require.*server-services" server.js
   ```

3. **Check Dependencies**
   ```bash
   npm list | grep -E "(express|firebase-admin|axios|nodemailer)"
   ```

## 🚨 Important Notes

1. **server.js is 12,744 lines** - It contains ALL backend logic including:
   - Identity verification endpoints
   - Datapro integration
   - Encryption/decryption
   - Rate limiting
   - Queue management
   - Health monitoring
   - All other API endpoints

2. **Don't modify file structure** - The imports in server.js expect exact paths

3. **Merge package.json carefully** - Don't overwrite existing dependencies

4. **Test thoroughly** - Run all tests before deploying

5. **Security** - Never commit `.env` file to git

## 📞 Support

If you encounter issues:
1. Check logs in `access.log`
2. Verify all environment variables are set
3. Ensure Firebase credentials are correct
4. Test Datapro API connectivity
5. Review error messages in console

## 🎯 Next Steps

After successful copy:
1. Deploy to staging environment
2. Run load tests
3. Monitor health endpoints
4. Test Datapro integration with real NIns
5. Verify encryption is working
6. Check audit logs
7. Deploy to production
