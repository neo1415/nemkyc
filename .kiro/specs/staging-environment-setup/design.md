# Design Document: Staging Environment Infrastructure

## Overview

This design establishes a complete multi-environment infrastructure for the NEM Insurance platform, transitioning from a single production Firebase project to a robust three-tier architecture (development, staging, production). The design addresses critical issues including test data pollution, accidental real email notifications during testing, exposed credentials in version control, and lack of safe testing capabilities.

The solution implements complete environment isolation with separate Firebase projects, dedicated backend servers on Render, environment-specific configuration management through GitHub Secrets, automated CI/CD pipelines with branch-based deployments, email sandboxing for testing, and mock API modes for third-party services. This infrastructure enables safe development and testing workflows while maintaining production stability and security.

### Key Design Goals

1. **Complete Data Isolation**: Ensure test activities in development/staging never affect production data or users
2. **Safe Testing Environment**: Enable realistic testing without sending real emails or consuming paid API credits
3. **Security Hardening**: Remove all exposed credentials from version control and implement proper secrets management
4. **Automated Deployments**: Establish CI/CD pipelines that automatically deploy to the correct environment based on git branches
5. **Cost Optimization**: Minimize staging infrastructure costs while maintaining full functionality
6. **Developer Experience**: Provide clear workflows and documentation for testing and promoting code between environments

### Current State Analysis

**Existing Infrastructure:**
- Single Firebase project: `nem-customer-feedback-8d3fb`
- Single backend server on Render: `nem-server-rhdb.onrender.com`
- Production credentials mixed with development in `.env` files
- `.env.production` was tracked in git (security vulnerability)
- `firestore.rules` and `storage.rules` exposed in git history
- No staging environment for safe testing
- Test form submissions send real emails to administrators
- Third-party API calls (Datapro NIN, VerifyData CAC, Gemini OCR) consume production credits during testing

**Security Vulnerabilities Identified:**
- Firebase service account credentials potentially exposed in git history
- SMTP passwords in `.env.production` committed to repository
- Third-party API keys (Datapro, VerifyData, Gemini) in version control
- Firestore and Storage security rules exposed publicly

**Operational Pain Points:**
- Developers cannot test form submissions without spamming administrators with emails
- Testing identity verification consumes paid API credits
- No way to test changes safely before production deployment
- Risk of test data polluting production database
- Manual deployment process prone to errors

## Architecture

### High-Level Architecture

The system follows a three-tier environment architecture with complete isolation between tiers:

```mermaid
graph TB
    subgraph "Development Environment"
        DEV_FE[Frontend: localhost:3000]
        DEV_BE[Backend: localhost:3001]
        DEV_FB[Firebase: nem-insurance-dev]
        DEV_FE -->|API Calls| DEV_BE
        DEV_BE -->|Firebase Admin SDK| DEV_FB
        DEV_BE -->|Mock APIs| DEV_MOCK[Mock Services]
        DEV_BE -->|Email Sandbox| DEV_LOG[Console Logs]
    end
    
    subgraph "Staging Environment"
        STG_FE[Frontend: Firebase Hosting<br/>nem-insurance-staging]
        STG_BE[Backend: Render<br/>nem-server-staging]
        STG_FB[Firebase: nem-insurance-staging]
        STG_FE -->|API Calls| STG_BE
        STG_BE -->|Firebase Admin SDK| STG_FB
        STG_BE -->|Mock APIs| STG_MOCK[Mock Services]
        STG_BE -->|Email Sandbox| STG_EMAILS[sandbox-emails collection]
    end
    
    subgraph "Production Environment"
        PROD_FE[Frontend: Firebase Hosting<br/>nemforms.com]
        PROD_BE[Backend: Render<br/>nem-server-rhdb]
        PROD_FB[Firebase: nem-customer-feedback-8d3fb]
        PROD_FE -->|API Calls| PROD_BE
        PROD_BE -->|Firebase Admin SDK| PROD_FB
        PROD_BE -->|Real APIs| PROD_APIS[Datapro, VerifyData, Gemini]
        PROD_BE -->|Real Emails| PROD_SMTP[Office 365 SMTP]
    end
    
    subgraph "CI/CD Pipeline"
        GH_DEV[develop branch]
        GH_STG[staging branch]
        GH_PROD[main branch]
        GH_DEV -->|GitHub Actions| DEV_FE
        GH_STG -->|GitHub Actions| STG_FE
        GH_PROD -->|GitHub Actions| PROD_FE
    end
    
    subgraph "Secrets Management"
        GH_SECRETS[GitHub Secrets]
        GH_SECRETS -.->|Inject at build| GH_DEV
        GH_SECRETS -.->|Inject at build| GH_STG
        GH_SECRETS -.->|Inject at build| GH_PROD
    end
```

### Environment Isolation Strategy

Each environment maintains complete isolation across all infrastructure layers:

**Firebase Projects:**
- Development: `nem-insurance-dev` (Spark/free tier)
- Staging: `nem-insurance-staging` (Blaze with spending limits)
- Production: `nem-customer-feedback-8d3fb` (Blaze, existing project)

**Backend Servers:**
- Development: `localhost:3001` (local development)
- Staging: `nem-server-staging.onrender.com` (Render free/starter tier)
- Production: `nem-server-rhdb.onrender.com` (Render paid tier, existing)

**Data Isolation:**
- Each Firebase project has completely separate Firestore databases
- Each Firebase project has separate Authentication user pools
- Each Firebase project has separate Storage buckets
- No cross-environment data access or sharing
- Security rules configured independently per environment

**Configuration Isolation:**
- Separate `.env.development`, `.env.staging`, `.env.production` files
- Environment-specific Firebase configuration (API keys, project IDs)
- Environment-specific backend URLs
- Environment-specific third-party API credentials (or mocks)

### Branch-Based Deployment Strategy

Git branches map directly to deployment environments:

```mermaid
graph LR
    DEV[develop branch] -->|Auto-deploy| DEV_ENV[Development Environment]
    STG[staging branch] -->|Auto-deploy| STG_ENV[Staging Environment]
    MAIN[main branch] -->|Auto-deploy| PROD_ENV[Production Environment]
    
    DEV -->|Merge when ready| STG
    STG -->|Merge after testing| MAIN
    
    PR[Pull Requests] -->|Preview deploy| PREVIEW[Firebase Preview Channels]
```

**Workflow:**
1. Developers work on feature branches
2. Feature branches merge to `develop` → auto-deploys to development
3. When ready for testing, `develop` merges to `staging` → auto-deploys to staging
4. After staging validation, `staging` merges to `main` → auto-deploys to production

### Backend Server Architecture

The backend server architecture supports environment-specific behavior through configuration:

```mermaid
graph TB
    REQ[HTTP Request] --> CORS[CORS Validation]
    CORS --> AUTH[Authentication Middleware]
    AUTH --> ROUTE[Route Handler]
    
    ROUTE --> ENV_CHECK{Environment Mode}
    
    ENV_CHECK -->|Development/Staging| MOCK_EMAIL[Email Sandbox]
    ENV_CHECK -->|Development/Staging| MOCK_API[Mock API Responses]
    ENV_CHECK -->|Production| REAL_EMAIL[Real SMTP]
    ENV_CHECK -->|Production| REAL_API[Real API Calls]
    
    MOCK_EMAIL --> LOG[Console Log]
    MOCK_EMAIL --> FIRESTORE[sandbox-emails collection]
    
    MOCK_API --> MOCK_NIN[Mock NIN Verification]
    MOCK_API --> MOCK_CAC[Mock CAC Verification]
    MOCK_API --> MOCK_OCR[Mock Gemini OCR]
    
    REAL_EMAIL --> SMTP[Office 365 SMTP]
    REAL_API --> DATAPRO[Datapro API]
    REAL_API --> VERIFYDATA[VerifyData API]
    REAL_API --> GEMINI[Gemini API]
```

**Environment-Specific Behavior:**

Development/Staging:
- `EMAIL_RECIPIENTS_MODE=sandbox`: Emails logged to console and Firestore, not sent
- `VERIFICATION_MODE=mock`: Third-party APIs return simulated responses
- Verbose logging enabled for debugging
- CORS allows localhost origins
- Lower rate limits for testing

Production:
- `EMAIL_RECIPIENTS_MODE=production`: Emails sent to real recipients via SMTP
- `VERIFICATION_MODE=production`: Real API calls to Datapro, VerifyData, Gemini
- Production logging (errors and important events only)
- CORS restricted to production domains
- Production rate limits enforced

## Components and Interfaces

### Firebase Projects Configuration

Each Firebase project requires configuration across multiple services:

**Firestore Database:**
- Collections: Same schema across all environments
- Security rules: Deployed from `firestore.rules` file
- Indexes: Deployed from `firestore.indexes.json` file
- Data: Completely isolated per environment

**Firebase Authentication:**
- Providers: Email/Password (same across environments)
- Users: Separate user pools per environment
- Test users created manually in staging for testing
- Production users are real customers

**Firebase Storage:**
- Buckets: `{project-id}.appspot.com`
- Security rules: Deployed from `storage.rules` file
- Uploaded files: Isolated per environment
- Staging bucket can be periodically cleaned to save costs

**Firebase Hosting:**
- Development: `nem-insurance-dev.web.app`
- Staging: `nem-insurance-staging.web.app` (custom domain: `staging.nemforms.com`)
- Production: `nem-customer-feedback-8d3fb.web.app` (custom domain: `nemforms.com`)
- Rewrites: All routes to `/index.html` for SPA
- Headers: Security headers (CSP, HSTS) configured in `firebase.json`

### Frontend Configuration Interface

The frontend uses Vite environment variables to configure Firebase and API connections:

**Environment Variables (injected at build time):**
```typescript
interface FrontendConfig {
  // Firebase Configuration
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
  VITE_FIREBASE_MEASUREMENT_ID: string;
  
  // Backend API Configuration
  VITE_API_BASE_URL: string; // Points to correct backend server
  
  // Environment Identification
  VITE_NODE_ENV: 'development' | 'staging' | 'production';
  
  // Frontend Security
  VITE_STORAGE_SALT: string; // For client-side encryption
}
```

**Build Modes:**
- `npm run dev`: Uses `.env.development` (localhost backend)
- `npm run build`: Uses `.env.production` (production backend)
- `npm run build:staging`: Uses `.env.staging` (staging backend) - NEW
- `npm run build:dev`: Uses `.env.development` (dev backend) - NEW

**Environment Indicator UI:**
Staging and development builds display a visible banner:
```tsx
{import.meta.env.VITE_NODE_ENV !== 'production' && (
  <div className="bg-yellow-500 text-black px-4 py-2 text-center font-bold">
    {import.meta.env.VITE_NODE_ENV.toUpperCase()} ENVIRONMENT
  </div>
)}
```

### Backend Configuration Interface

The backend server uses Node.js environment variables loaded from `.env` files or Render environment settings:

**Environment Variables:**
```typescript
interface BackendConfig {
  // Server Configuration
  PORT: number;
  NODE_ENV: 'development' | 'staging' | 'production';
  FRONTEND_URL: string;
  
  // Firebase Admin SDK
  TYPE: 'service_account';
  PROJECT_ID: string;
  PRIVATE_KEY_ID: string;
  PRIVATE_KEY: string; // Multi-line, requires newline handling
  CLIENT_EMAIL: string;
  CLIENT_ID: string;
  AUTH_URI: string;
  TOKEN_URI: string;
  AUTH_PROVIDER_X509_CERT_URL: string;
  CLIENT_X509_CERT_URL: string;
  UNIVERSE_DOMAIN: string;
  FIREBASE_DATABASE_URL: string;
  FIREBASE_STORAGE_BUCKET: string;
  
  // Email Configuration
  EMAIL_HOST: string; // smtp.office365.com
  EMAIL_PORT: number; // 587
  EMAIL_SECURE: boolean; // false
  EMAIL_USER: string; // kyc@nem-insurance.com
  EMAIL_PASS: string; // App-specific password
  EMAIL_RECIPIENTS_MODE: 'sandbox' | 'production';
  SANDBOX_ALLOWED_RECIPIENTS?: string; // Comma-separated emails
  
  // Third-Party APIs
  VERIFICATION_MODE: 'mock' | 'production';
  DATAPRO_API_URL: string;
  DATAPRO_SERVICE_ID: string;
  VERIFYDATA_API_URL: string;
  VERIFYDATA_SECRET_KEY: string;
  GEMINI_API_KEY: string;
  
  // Security
  ENCRYPTION_KEY: string; // 64-char hex for AES-256
  EVENTS_IP_SALT: string; // 64-char hex
  SERVER_API_KEY: string; // For server-to-server auth
  COOKIE_DOMAIN?: string; // .nemforms.com for production
  
  // CORS
  ADDITIONAL_ALLOWED_ORIGINS?: string; // Comma-separated
  
  // Cost Configuration
  NIN_VERIFICATION_COST: number;
  BVN_VERIFICATION_COST: number;
  CAC_VERIFICATION_COST: number;
  COST_CURRENCY: string; // NGN
}
```

**Environment-Specific Values:**

Development:
- `NODE_ENV=development`
- `EMAIL_RECIPIENTS_MODE=sandbox`
- `VERIFICATION_MODE=mock`
- `FRONTEND_URL=http://localhost:3000`
- Mock/placeholder API keys (can be committed)

Staging:
- `NODE_ENV=staging`
- `EMAIL_RECIPIENTS_MODE=sandbox`
- `VERIFICATION_MODE=mock`
- `FRONTEND_URL=https://staging.nemforms.com`
- Real Firebase credentials (from GitHub Secrets)
- Real SMTP credentials (from GitHub Secrets)
- Mock third-party API keys (no real charges)

Production:
- `NODE_ENV=production`
- `EMAIL_RECIPIENTS_MODE=production`
- `VERIFICATION_MODE=production`
- `FRONTEND_URL=https://nemforms.com`
- All real credentials (from GitHub Secrets or Render env vars)

### Email Sandboxing System

The email sandboxing system intercepts outgoing emails in non-production environments:

**Implementation:**
```typescript
interface EmailSandboxConfig {
  mode: 'sandbox' | 'production';
  allowedRecipients?: string[]; // Whitelist for sandbox mode
}

interface SandboxEmail {
  id: string;
  timestamp: number;
  to: string | string[];
  from: string;
  subject: string;
  body: string; // HTML content
  environment: 'development' | 'staging';
  formType?: string;
  ticketId?: string;
}

// Firestore collection: sandbox-emails
// Used to store intercepted emails for review
```

**Behavior:**
1. When `EMAIL_RECIPIENTS_MODE=sandbox`:
   - Email content is logged to console with full details
   - Email is saved to `sandbox-emails` Firestore collection
   - If recipient is in `SANDBOX_ALLOWED_RECIPIENTS`, email is actually sent
   - Otherwise, email is only logged/stored, not sent
2. When `EMAIL_RECIPIENTS_MODE=production`:
   - All emails sent normally via SMTP
   - No interception or logging

**Admin Interface:**
Staging environment includes an admin page to view sandbox emails:
- List all intercepted emails with filters (date, form type, recipient)
- View full email content (HTML rendered)
- Search by ticket ID or recipient
- Delete old sandbox emails to clean up

### Mock API System

The mock API system simulates third-party service responses without making real API calls:

**Mock NIN Verification (Datapro):**
```typescript
interface MockNINResponse {
  success: boolean;
  data?: {
    nin: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    photo?: string; // Base64 image
  };
  error?: string;
}

// Returns realistic success responses for valid NIN formats
// Returns error responses for invalid formats
// Simulates API latency (500-1500ms delay)
```

**Mock CAC Verification (VerifyData):**
```typescript
interface MockCACResponse {
  success: boolean;
  data?: {
    rcNumber: string;
    companyName: string;
    registrationDate: string;
    companyType: string;
    status: 'Active' | 'Inactive';
    address: string;
  };
  error?: string;
}

// Returns realistic company data for valid RC numbers
// Returns "not found" for invalid RC numbers
// Simulates API latency
```

**Mock Gemini OCR:**
```typescript
interface MockGeminiResponse {
  success: boolean;
  extractedData?: {
    documentType: string;
    fields: Record<string, string>;
    confidence: number;
  };
  error?: string;
}

// Returns extracted data based on document type
// Simulates OCR confidence scores
// Simulates processing time
```

**Implementation Strategy:**
- Mock implementations in `backend-package/server-services/__mocks__/`
- Existing mock for Datapro: `dataproClient.cjs`
- Need to create mocks for VerifyData and Gemini
- Environment variable `VERIFICATION_MODE` controls which implementation is used
- Mock responses include both success and error scenarios for comprehensive testing

### CI/CD Pipeline Architecture

GitHub Actions workflows automate building and deploying to each environment:

**Workflow Files:**
1. `.github/workflows/deploy-development.yml` - Deploys on push to `develop`
2. `.github/workflows/deploy-staging.yml` - Deploys on push to `staging`
3. `.github/workflows/deploy-production.yml` - Deploys on push to `main`
4. `.github/workflows/preview-deploy.yml` - Deploys PR previews

**Deployment Flow:**
```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git Repository
    participant GHA as GitHub Actions
    participant Secrets as GitHub Secrets
    participant Firebase as Firebase Hosting
    
    Dev->>Git: Push to staging branch
    Git->>GHA: Trigger workflow
    GHA->>Secrets: Fetch staging secrets
    Secrets->>GHA: Return environment variables
    GHA->>GHA: npm ci (install dependencies)
    GHA->>GHA: npm run build:staging (build with staging env)
    GHA->>Firebase: Deploy to staging project
    Firebase->>GHA: Deployment success
    GHA->>Git: Update commit status
```

**Secrets Required in GitHub:**

Development:
- `DEV_FIREBASE_SERVICE_ACCOUNT` - Service account JSON for deployment
- `DEV_VITE_FIREBASE_*` - Firebase config for frontend (8 variables)
- `DEV_VITE_API_BASE_URL` - Development backend URL

Staging:
- `STAGING_FIREBASE_SERVICE_ACCOUNT` - Service account JSON for deployment
- `STAGING_VITE_FIREBASE_*` - Firebase config for frontend (8 variables)
- `STAGING_VITE_API_BASE_URL` - Staging backend URL

Production:
- `FIREBASE_SERVICE_ACCOUNT_NEM_CUSTOMER_FEEDBACK_8D3FB` - Existing
- `VITE_FIREBASE_*` - Existing production config (8 variables)
- `VITE_API_BASE_URL` - Existing production backend URL

### Render Backend Deployment

Render hosts the backend servers with environment-specific configuration:

**Services:**
1. `nem-server-staging` (NEW) - Staging backend
   - Free tier or Starter ($7/month)
   - Auto-deploy from `staging` branch
   - Environment variables configured in Render dashboard
   - Can spin down when idle to save costs

2. `nem-server-rhdb` (EXISTING) - Production backend
   - Paid tier for reliability
   - Auto-deploy from `main` branch
   - Environment variables already configured
   - Always running

**Render Environment Variables:**
All backend environment variables listed in Backend Configuration Interface must be configured in Render dashboard for each service. Sensitive values (Firebase service account, SMTP password, API keys) should be marked as "secret" in Render.

**Auto-Deploy Configuration:**
- Connect Render service to GitHub repository
- Set branch to `staging` for staging service
- Set branch to `main` for production service
- Enable auto-deploy on push
- Configure build command: `npm install` (if needed)
- Configure start command: `node server.js`

## Data Models

### Environment Configuration Model

**File: `.env.{environment}`**
```
# Firebase Configuration (Frontend)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

# API Configuration
VITE_API_BASE_URL=...

# Environment
VITE_NODE_ENV=...

# Frontend Security
VITE_STORAGE_SALT=...
```

**File: `backend-package/.env.{environment}`**
```
# Server Configuration
PORT=3001
NODE_ENV=...
FRONTEND_URL=...

# Firebase Admin SDK (15 variables)
TYPE=service_account
PROJECT_ID=...
PRIVATE_KEY_ID=...
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
CLIENT_EMAIL=...
CLIENT_ID=...
AUTH_URI=...
TOKEN_URI=...
AUTH_PROVIDER_X509_CERT_URL=...
CLIENT_X509_CERT_URL=...
UNIVERSE_DOMAIN=googleapis.com
FIREBASE_DATABASE_URL=...
FIREBASE_STORAGE_BUCKET=...

# Email Configuration
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=kyc@nem-insurance.com
EMAIL_PASS=...
EMAIL_RECIPIENTS_MODE=...
SANDBOX_ALLOWED_RECIPIENTS=...

# Third-Party APIs
VERIFICATION_MODE=...
DATAPRO_API_URL=https://api.datapronigeria.com
DATAPRO_SERVICE_ID=...
VERIFYDATA_API_URL=https://vd.villextra.com
VERIFYDATA_SECRET_KEY=...
GEMINI_API_KEY=...

# Security
ENCRYPTION_KEY=...
EVENTS_IP_SALT=...
SERVER_API_KEY=...
COOKIE_DOMAIN=...

# CORS
ADDITIONAL_ALLOWED_ORIGINS=...

# Cost Configuration
NIN_VERIFICATION_COST=50
BVN_VERIFICATION_COST=50
CAC_VERIFICATION_COST=100
COST_CURRENCY=NGN
```

### Sandbox Email Model

**Firestore Collection: `sandbox-emails`**
```typescript
interface SandboxEmail {
  id: string; // Auto-generated document ID
  timestamp: number; // Unix timestamp
  environment: 'development' | 'staging';
  
  // Email metadata
  to: string | string[]; // Original recipient(s)
  from: string; // Sender email
  subject: string;
  
  // Email content
  htmlBody: string; // Full HTML content
  textBody?: string; // Plain text version
  
  // Context
  formType?: string; // e.g., "Motor Claim", "Individual KYC"
  ticketId?: string; // Associated ticket ID
  userId?: string; // User who triggered the email
  
  // Status
  viewed: boolean; // Has admin viewed this email?
  viewedAt?: number; // When was it viewed?
  viewedBy?: string; // Who viewed it?
}
```

**Indexes:**
- `timestamp` (descending) - For chronological listing
- `formType` + `timestamp` - For filtering by form type
- `ticketId` - For looking up emails by ticket

### Firebase Project Configuration Model

**File: `.firebaserc`**
```json
{
  "projects": {
    "default": "nem-customer-feedback-8d3fb",
    "development": "nem-insurance-dev",
    "staging": "nem-insurance-staging",
    "production": "nem-customer-feedback-8d3fb"
  },
  "targets": {},
  "etags": {}
}
```

**File: `firebase.json`**
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          },
          {
            "key": "X-Frame-Options",
            "value": "DENY"
          },
          {
            "key": "X-XSS-Protection",
            "value": "1; mode=block"
          },
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains"
          }
        ]
      }
    ]
  },
  "emulators": {
    "auth": { "port": 8000 },
    "functions": { "port": 8001 },
    "firestore": { "port": 8002 },
    "database": { "port": 8003 },
    "pubsub": { "port": 8004 },
    "storage": { "port": 8005 },
    "eventarc": { "port": 8006 },
    "ui": { "enabled": true, "port": 8008 },
    "singleProjectMode": false
  }
}
```

### GitHub Secrets Structure

**Naming Convention:**
- Development: `DEV_{VARIABLE_NAME}`
- Staging: `STAGING_{VARIABLE_NAME}`
- Production: `{VARIABLE_NAME}` (no prefix for backward compatibility)

**Required Secrets:**

Frontend Build Secrets (per environment):
- `{ENV}_VITE_FIREBASE_API_KEY`
- `{ENV}_VITE_FIREBASE_AUTH_DOMAIN`
- `{ENV}_VITE_FIREBASE_PROJECT_ID`
- `{ENV}_VITE_FIREBASE_STORAGE_BUCKET`
- `{ENV}_VITE_FIREBASE_MESSAGING_SENDER_ID`
- `{ENV}_VITE_FIREBASE_APP_ID`
- `{ENV}_VITE_FIREBASE_MEASUREMENT_ID`
- `{ENV}_VITE_API_BASE_URL`
- `{ENV}_VITE_STORAGE_SALT`

Deployment Secrets (per environment):
- `{ENV}_FIREBASE_SERVICE_ACCOUNT` - JSON service account for Firebase deployment

Backend secrets are configured directly in Render dashboard, not in GitHub Secrets (except for any CI/CD that needs to deploy backend).


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing all acceptance criteria, many requirements are infrastructure setup tasks (creating Firebase projects, configuring Render services, rotating credentials) or documentation tasks that cannot be automatically tested. The testable properties focus on configuration validation, runtime behavior of email sandboxing and mock APIs, and environment isolation.

### Property Reflection

Reviewing the prework analysis, several properties can be combined or are redundant:

- Properties about data isolation (7.1, 7.2, 7.3) can be combined into one property about environment isolation
- Properties about email sandboxing (4.1, 4.2, 4.3) are related but test different aspects - keep separate
- Properties about mock API modes (5.1, 5.2, 5.3) can be combined into one property about mock mode behavior
- Properties about frontend environment configuration (9.1, 9.2, 9.3) are examples, not properties
- Properties about backend server connections (7.10, 3.4) can be combined
- Properties about CORS (3.8, 9.10) test the same underlying behavior

### Property 1: Environment Configuration Completeness

*For any* environment configuration file (.env.development, .env.staging, .env.production), it must contain all required Firebase configuration variables (API key, auth domain, project ID, storage bucket, messaging sender ID, app ID, measurement ID), backend API URL, and environment-specific mode settings.

**Validates: Requirements 2.4, 2.5, 2.6, 2.7, 11.3, 11.4, 11.5, 11.6**

### Property 2: Placeholder Values in Example Configuration

*For any* variable in .env.example, its value must be a placeholder string (containing "your_", "example", or similar patterns) and must not match any production credential patterns (valid API keys, real email addresses, actual project IDs).

**Validates: Requirements 2.3, 8.3**

### Property 3: Development Environment Safety

*For any* credential or API key in development environment configuration, it must be either a mock/placeholder value or explicitly marked as safe for version control (not matching production credential patterns).

**Validates: Requirements 2.10**

### Property 4: Email Sandbox Interception

*For any* email sent when EMAIL_RECIPIENTS_MODE is set to 'sandbox', the email must be intercepted (not sent via SMTP), logged to console with full details (recipient, subject, body), and stored in the 'sandbox-emails' Firestore collection.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: Sandbox Allowed Recipients

*For any* email sent in sandbox mode, it should only be actually sent via SMTP if the recipient email address is present in the SANDBOX_ALLOWED_RECIPIENTS environment variable; otherwise it should only be logged and stored.

**Validates: Requirements 4.4**

### Property 6: Production Email Delivery

*For any* email sent when EMAIL_RECIPIENTS_MODE is set to 'production', the email must be sent via SMTP to the actual recipient without interception or sandbox storage.

**Validates: Requirements 4.5**

### Property 7: Mock API Response Structure

*For any* API verification request (NIN, CAC, or OCR) when VERIFICATION_MODE is set to 'mock', the returned response must have the same data structure (fields, types, nesting) as the corresponding real API response, and must include a log entry indicating a mock response was used.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.8**

### Property 8: Production API Calls

*For any* API verification request when VERIFICATION_MODE is set to 'production', the system must make an actual HTTP request to the corresponding third-party API service (Datapro, VerifyData, or Gemini) rather than returning a mock response.

**Validates: Requirements 5.5**

### Property 9: Environment-Specific API URL

*For any* environment build (development, staging, production), the VITE_API_BASE_URL in the built frontend must match the backend server URL designated for that environment.

**Validates: Requirements 9.4**

### Property 10: Non-Production Environment Indicator

*For any* frontend build where VITE_NODE_ENV is not 'production', the rendered UI must display a visible environment indicator banner showing the current environment name.

**Validates: Requirements 9.6**

### Property 11: Frontend-Backend Environment Matching

*For any* API call made from a frontend deployed to a specific environment, the request must be sent to the backend server designated for that same environment (staging frontend → staging backend, production frontend → production backend).

**Validates: Requirements 9.8, 9.9**

### Property 12: CORS Origin Validation

*For any* HTTP request to a backend server from an origin not in the allowed origins list for that environment, the server must reject the request with a CORS error.

**Validates: Requirements 9.10, 3.8**

### Property 13: Backend Environment Variable Validation

*For any* backend server startup, if any required environment variable (Firebase credentials, SMTP config, API keys, security keys) is missing or empty, the server must log a specific error message identifying the missing variable and refuse to start (exit with non-zero code).

**Validates: Requirements 11.1, 11.2**

### Property 14: Environment-Specific Backend Configuration

*For any* backend server instance, the environment variables must be consistent with the designated environment: development/staging must have EMAIL_RECIPIENTS_MODE='sandbox' and VERIFICATION_MODE='mock', while production must have EMAIL_RECIPIENTS_MODE='production' and VERIFICATION_MODE='production'.

**Validates: Requirements 3.6, 3.7, 4.6, 4.7, 5.6, 5.7**

### Property 15: Backend Server Firebase Connection

*For any* backend server instance, all Firebase Admin SDK operations (Firestore reads/writes, Storage operations, Auth operations) must connect only to the Firebase project specified in that server's PROJECT_ID environment variable.

**Validates: Requirements 3.4, 7.10**

### Property 16: Request Logging in Staging

*For any* HTTP request processed by the staging backend server, there must be a log entry containing the request method, path, authenticated user (if any), and timestamp.

**Validates: Requirements 13.1**

### Property 17: Error Logging in Staging

*For any* error encountered by the staging backend server, there must be a log entry containing the full error message and stack trace.

**Validates: Requirements 13.2**

### Property 18: Mock API Logging

*For any* mock API response returned in staging or development, there must be a log entry explicitly indicating which API was mocked (NIN/CAC/OCR) and the response data returned.

**Validates: Requirements 13.3**

### Property 19: Intercepted Email Logging

*For any* email intercepted in sandbox mode, there must be a log entry containing the recipient, subject, and body content.

**Validates: Requirements 13.4**

### Property 20: Production Log Sanitization

*For any* log entry generated in production environment, the log message must not contain sensitive values including API keys, passwords, private keys, encryption keys, or full email addresses.

**Validates: Requirements 8.10**

### Property 21: CI/CD Environment Variable Injection

*For any* CI/CD workflow build step, the environment variables injected into the build process must come from GitHub Secrets with the correct environment prefix (DEV_, STAGING_, or no prefix for production).

**Validates: Requirements 6.4**

### Property 22: CI/CD Test Execution

*For any* CI/CD deployment workflow (development, staging, production), there must be a test execution step that runs before the deployment step, and deployment must not proceed if tests fail.

**Validates: Requirements 6.9**

## Error Handling

### Configuration Errors

**Missing Environment Variables:**
- Backend server validates all required environment variables on startup
- If any required variable is missing, server logs specific error and exits with code 1
- Error message format: `FATAL: Missing required environment variable: {VARIABLE_NAME}`
- Prevents server from starting in misconfigured state

**Invalid Environment Variable Values:**
- Validate format of critical variables (URLs, email addresses, project IDs)
- If validation fails, log error and exit with code 1
- Example: `FATAL: Invalid VITE_API_BASE_URL format: must be a valid HTTP/HTTPS URL`

**Firebase Connection Errors:**
- If Firebase Admin SDK fails to initialize (invalid credentials, network issues)
- Log detailed error including project ID and credential type
- Exit with code 1 to prevent operating with wrong Firebase project
- Example: `FATAL: Failed to initialize Firebase Admin SDK for project {PROJECT_ID}: {error details}`

### Email Sandboxing Errors

**Sandbox Email Storage Failure:**
- If saving to 'sandbox-emails' collection fails
- Log error but don't fail the request (email already logged to console)
- Return success to caller (form submission succeeded)
- Example: `ERROR: Failed to store sandbox email in Firestore: {error}, email was logged to console`

**SMTP Connection Failure in Production:**
- If SMTP connection fails when EMAIL_RECIPIENTS_MODE='production'
- Log detailed error including SMTP host and port
- Return error to caller (form submission failed)
- Store failed email in 'failed-emails' collection for retry
- Example: `ERROR: Failed to send email via SMTP: {error}, stored for retry`

**Invalid Recipient in Sandbox Mode:**
- If recipient format is invalid
- Log warning and store in sandbox-emails anyway
- Don't attempt to send even if in allowed recipients
- Example: `WARN: Invalid email recipient format in sandbox mode: {recipient}`

### Mock API Errors

**Mock Response Generation Failure:**
- If mock response generator encounters unexpected input
- Log error with input details
- Return generic error response matching real API error format
- Example: `ERROR: Mock API generator failed for NIN {nin}: {error}, returning generic error response`

**Mock Mode in Production:**
- If VERIFICATION_MODE='mock' detected in production environment
- Log critical warning on every API call
- Still return mock responses (don't fail)
- Alert monitoring system
- Example: `CRITICAL: Mock API mode enabled in production environment! This should never happen.`

### CI/CD Pipeline Errors

**Build Failure:**
- If `npm run build` fails
- GitHub Actions workflow fails and stops
- No deployment occurs
- Commit status marked as failed
- Notification sent to developers

**Test Failure:**
- If `npm test` fails
- GitHub Actions workflow fails and stops
- No deployment occurs
- Commit status marked as failed
- Test results logged in workflow output

**Deployment Failure:**
- If Firebase deployment fails
- GitHub Actions workflow fails
- Previous deployment remains active (no downtime)
- Commit status marked as failed
- Rollback not needed (deployment never completed)

**Missing Secrets:**
- If required GitHub Secret is not configured
- Workflow fails immediately with clear error
- Example: `Error: Secret STAGING_VITE_FIREBASE_API_KEY not found`
- Prevents deployment with incomplete configuration

### Environment Isolation Errors

**Cross-Environment Data Access:**
- If backend server attempts to access wrong Firebase project
- Firebase Admin SDK will fail with authentication error
- Log error with both expected and actual project IDs
- Return 500 error to client
- Example: `ERROR: Firebase operation failed - server configured for {expected_project} but credentials are for {actual_project}`

**CORS Violation:**
- If frontend from one environment tries to call backend from different environment
- CORS middleware rejects request
- Log blocked origin and target environment
- Return 403 error with CORS headers
- Example: `CORS: Blocked request from {origin} to {environment} backend`

### Security Errors

**Exposed Credentials Detection:**
- If .env.production or other sensitive files detected in git staging area
- Pre-commit hook (if implemented) blocks commit
- Warning message displayed to developer
- Example: `ERROR: Attempting to commit sensitive file .env.production - commit blocked`

**Invalid Service Account:**
- If Firebase service account JSON is malformed or invalid
- Server fails to start with detailed error
- Example: `FATAL: Invalid Firebase service account credentials: {validation error}`

**Encryption Key Issues:**
- If ENCRYPTION_KEY is missing or wrong length
- Server fails to start
- Example: `FATAL: ENCRYPTION_KEY must be 64 hexadecimal characters`

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests:**
- Specific configuration file validation examples
- Mock API response structure verification
- Email sandboxing behavior for specific scenarios
- CI/CD workflow file syntax validation
- Environment variable parsing edge cases

**Property-Based Tests:**
- Configuration completeness across all environments
- Email interception for all email types
- Mock API responses for all verification types
- CORS validation for all origin combinations
- Log sanitization for all sensitive value patterns

### Testing Framework

**Property-Based Testing Library:**
- Use `fast-check` (already in devDependencies)
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: staging-environment-setup, Property {number}: {property_text}`

**Unit Testing Library:**
- Use `vitest` (already configured)
- Test specific examples and edge cases
- Integration tests for environment isolation

### Test Categories

**1. Configuration Validation Tests**

Unit tests:
- Verify .env.example contains all required variables
- Verify .env.example has no real credentials
- Verify .firebaserc contains all three projects
- Verify firebase.json has correct hosting configuration
- Verify .gitignore includes sensitive files

Property tests:
- Property 1: Environment configuration completeness
- Property 2: Placeholder values in example configuration
- Property 3: Development environment safety

**2. Email Sandboxing Tests**

Unit tests:
- Test email interception with specific form submission
- Test sandbox email storage in Firestore
- Test allowed recipient whitelist with specific emails
- Test production mode sends real emails

Property tests:
- Property 4: Email sandbox interception
- Property 5: Sandbox allowed recipients
- Property 6: Production email delivery
- Property 19: Intercepted email logging

**3. Mock API Tests**

Unit tests:
- Test mock NIN verification with specific NIN
- Test mock CAC verification with specific RC number
- Test mock Gemini OCR with specific document
- Test mock error responses
- Test production mode makes real API calls (integration test)

Property tests:
- Property 7: Mock API response structure
- Property 8: Production API calls
- Property 18: Mock API logging

**4. Environment Isolation Tests**

Unit tests:
- Test staging frontend connects to staging backend
- Test production frontend connects to production backend
- Test CORS blocks cross-environment requests
- Test Firebase Admin SDK connects to correct project

Property tests:
- Property 11: Frontend-backend environment matching
- Property 12: CORS origin validation
- Property 15: Backend server Firebase connection

**5. CI/CD Workflow Tests**

Unit tests:
- Validate workflow YAML syntax
- Verify workflow triggers on correct branches
- Verify workflow uses correct secrets
- Verify workflow includes test step

Property tests:
- Property 21: CI/CD environment variable injection
- Property 22: CI/CD test execution

**6. Backend Configuration Tests**

Unit tests:
- Test server startup with missing env var
- Test server startup with invalid env var
- Test environment mode validation

Property tests:
- Property 13: Backend environment variable validation
- Property 14: Environment-specific backend configuration

**7. Logging Tests**

Unit tests:
- Test request logging format
- Test error logging includes stack trace
- Test production logs don't contain API keys

Property tests:
- Property 16: Request logging in staging
- Property 17: Error logging in staging
- Property 20: Production log sanitization

### Integration Tests

Some requirements require integration testing with actual infrastructure:

**Firebase Integration Tests:**
- Deploy to development Firebase project
- Write test data to Firestore
- Verify data doesn't appear in staging/production
- Clean up test data

**Backend Integration Tests:**
- Start staging backend server
- Make API calls from staging frontend
- Verify emails are intercepted
- Verify mock APIs return simulated responses
- Verify logs contain expected entries

**CI/CD Integration Tests:**
- Create test branch
- Push commit
- Verify GitHub Actions workflow runs
- Verify deployment succeeds
- Verify deployed app uses correct environment

### Test Execution

**Local Development:**
```bash
# Run all tests
npm test

# Run property-based tests only
npm test -- --grep "Property"

# Run with coverage
npm run test:coverage

# Run backend tests
cd backend-package
npm test
```

**CI/CD Pipeline:**
- All tests run automatically on every push
- Tests must pass before deployment proceeds
- Test results visible in GitHub Actions logs
- Coverage reports generated and stored

### Test Data Management

**Development Environment:**
- Use mock data generators for testing
- Safe to create/delete test data freely
- No real user data

**Staging Environment:**
- Create test user accounts manually
- Use realistic but fake data
- Periodically clean up old test data
- Document test accounts in team wiki

**Production Environment:**
- No test data creation
- Only real user data
- Tests run against production use mocks/stubs

### Monitoring and Validation

**Post-Deployment Validation:**
After deploying to any environment, verify:
1. Health check endpoint returns 200
2. Frontend loads and displays correct environment indicator
3. Firebase connection successful
4. Email sandboxing mode correct for environment
5. Mock API mode correct for environment
6. CORS allows correct origins
7. Logs show expected format and content

**Continuous Monitoring:**
- Set up alerts for backend server downtime
- Monitor error rates in logs
- Track API usage and costs
- Review sandbox emails periodically
- Check for any cross-environment data leaks

