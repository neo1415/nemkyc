# NEM Insurance Backend - Identity Verification System

This package contains all backend code for the NEM Insurance Identity Verification System with Datapro NIN verification integration.

## 📁 Directory Structure

```
backend-package/
├── server.js                    # Main Express server (copy to root)
├── package.json                 # Dependencies (merge with existing)
├── .env.example                 # Environment variables template
├── server-services/             # External API clients
│   ├── dataproClient.cjs       # Datapro NIN verification client
│   └── __mocks__/              # Mocks for testing
│       └── dataproClient.cjs
├── server-utils/                # Utility modules
│   ├── encryption.cjs          # AES-256-GCM encryption
│   ├── auditLogger.cjs         # Audit logging
│   ├── rateLimiter.cjs         # Rate limiting
│   ├── apiUsageTracker.cjs     # API usage tracking
│   ├── verificationQueue.cjs   # Queue management
│   ├── healthMonitor.cjs       # Health monitoring
│   ├── securityMiddleware.cjs  # Security middleware
│   └── __tests__/              # Unit tests
│       ├── encryption.test.cjs
│       └── verificationQueue.test.cjs
├── scripts/                     # Utility scripts
│   ├── encrypt-existing-identity-data.js
│   └── ENCRYPTION_MIGRATION_README.md
├── load-tests/                  # Load testing
│   ├── bulk-verification-test.js
│   ├── rate-limit-test.js
│   ├── test-data-generator.js
│   └── README.md
└── docs/                        # Documentation
    ├── API_DOCUMENTATION.md
    ├── DEPLOYMENT_CHECKLIST.md
    ├── SECURITY_DOCUMENTATION.md
    └── LOAD_TESTING_GUIDE.md
```

## 🚀 Quick Start

### 1. Copy Files to Backend Repo

```bash
# Copy all files maintaining structure
cp -r backend-package/* /path/to/your/backend-repo/
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 4. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add the output to `.env` as `ENCRYPTION_KEY`

### 5. Start Server

```bash
npm start
```

## 🔐 Environment Variables Required

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Datapro API
DATAPRO_SERVICE_ID=your-service-id
DATAPRO_API_URL=https://api.datapronigeria.com

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Server
PORT=5000
NODE_ENV=production
```

## 📦 Dependencies

All required dependencies are in `package.json`. Key packages:
- `express` - Web server
- `firebase-admin` - Firebase integration
- `axios` - HTTP client for Datapro API
- `nodemailer` - Email sending
- `cors` - CORS handling
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting

## 🔒 Security Features

- ✅ AES-256-GCM encryption for PII
- ✅ SERVICEID never exposed to frontend
- ✅ Comprehensive audit logging
- ✅ Rate limiting (50 req/min)
- ✅ Input validation
- ✅ CORS configuration
- ✅ Security headers (Helmet)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test server-utils/__tests__/encryption.test.cjs
```

## 📊 API Endpoints

### Identity Lists
- `POST /api/identity/lists` - Create list
- `GET /api/identity/lists` - Get all lists
- `GET /api/identity/lists/:listId` - Get single list
- `DELETE /api/identity/lists/:listId` - Delete list

### Verification
- `POST /api/identity/lists/:listId/send` - Send verification links
- `POST /api/identity/lists/:listId/bulk-verify` - Bulk verification
- `GET /api/identity/verify/:token` - Validate token
- `POST /api/identity/verify/:token` - Submit verification

### Monitoring
- `GET /api/health` - Health check
- `GET /api/identity/queue/status` - Queue status

## 🔄 Migration

If you have existing data, run the encryption migration:

```bash
node scripts/encrypt-existing-identity-data.js
```

See `scripts/ENCRYPTION_MIGRATION_README.md` for details.

## 📈 Load Testing

```bash
cd load-tests
npm install
node bulk-verification-test.js
```

## 🐛 Troubleshooting

### Common Issues

1. **SERVICEID not found**: Ensure `DATAPRO_SERVICE_ID` is set in `.env`
2. **Encryption errors**: Verify `ENCRYPTION_KEY` is 64 hex characters
3. **Firebase errors**: Check Firebase Admin SDK credentials
4. **Rate limit errors**: Adjust rate limits in `server-utils/rateLimiter.cjs`

## 📚 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md)
- [Security Documentation](docs/SECURITY_DOCUMENTATION.md)
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)
- [Load Testing Guide](docs/LOAD_TESTING_GUIDE.md)

## 🤝 Support

For issues or questions, contact the development team.

## 📝 License

Proprietary - NEM Insurance
