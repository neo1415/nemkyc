# SIEM Events Log Authentication Fix

## Issues Identified

### 1. Backend: Trust Proxy Not Configured ✅ FIXED
**Error**: 
```
ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
```

**Cause**: Render.com (and other reverse proxies) send the client IP in the `X-Forwarded-For` header, but Express doesn't trust it by default.

**Fix**: Added `app.set('trust proxy', true);` to server.js

**Location**: Line ~88 in server.js (after port declaration)

```javascript
// ✅ REQUIRED: Enable trust proxy for Render.com and other reverse proxies
app.set('trust proxy', true);
```

### 2. Backend: Timestamp Validation Failing on Root Path ✅ FIXED
**Error**:
```
❌ Timestamp validation failed: Timestamp is required for /
```

**Cause**: The root path `/` and `/health` were not exempted from timestamp validation.

**Fix**: Added `/` and `/health` to the timestamp validation exemption list

**Location**: Line ~1388 in server.js

```javascript
if (req.path === '/' ||
    req.path === '/health' ||
    req.path === '/csrf-token' || 
    // ... other exemptions
```

### 3. Backend: Missing Health Check Endpoints ✅ FIXED
**Issue**: No health check endpoint for monitoring services like Render.com

**Fix**: Added two endpoints:
- `GET /` - Root endpoint with API info
- `GET /health` - Health check endpoint with uptime and status

**Location**: Before `app.listen()` in server.js

```javascript
// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'NEM Server API is running',
    version: '2.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    eventsLogging: EVENTS_CONFIG.ENABLE_EVENTS_LOGGING,
    ipGeolocation: EVENTS_CONFIG.ENABLE_IP_GEOLOCATION
  });
});
```

### 4. Frontend: 401 Unauthorized Error ⚠️ ROOT CAUSE IDENTIFIED

**Error**:
```
GET https://nem-server-rhdb.onrender.com/api/events-logs?page=1&limit=25&advanced=false 401 (Unauthorized)
❌ Auth failed: No session token
```

**ROOT CAUSE**: Cross-origin cookie issue!

You're running:
- **Frontend**: `http://localhost:8080` (from `.env.local`)
- **Backend**: `https://nem-server-rhdb.onrender.com` (production)

**The Problem**:
Cookies set by `nem-server-rhdb.onrender.com` cannot be sent from `localhost:8080` due to browser security (different domains). The `__session` cookie is domain-specific.

**Solution Options**:

#### Option 1: Run Backend Locally (RECOMMENDED for development)
```bash
# In your project root, start the local backend:
node server.js

# This will start the backend on http://localhost:3001
# Your .env.local is already configured for this!
```

Then your frontend at `localhost:8080` can communicate with backend at `localhost:3001` and cookies will work.

#### Option 2: Use Production Frontend
Deploy your frontend to Firebase Hosting or another production domain, then:
- Frontend: `https://nemforms.com` or `https://nem-kyc.web.app`
- Backend: `https://nem-server-rhdb.onrender.com`

Both on HTTPS with proper CORS, cookies will work.

#### Option 3: Temporary Testing (NOT RECOMMENDED)
You could temporarily change `.env.local` to use localhost backend:
```env
VITE_API_BASE_URL=http://localhost:3001
```

But you'd need to run the backend locally.

**Why This Happens**:
1. Browser security prevents cookies from being sent cross-origin
2. `localhost:8080` → `nem-server-rhdb.onrender.com` is cross-origin
3. Even with `credentials: 'include'`, the cookie won't be sent if it was set by a different domain
4. The `__session` cookie was set by Render.com domain, so localhost can't access it

**Current Frontend Code** (EnhancedEventsLogPage.tsx):
```typescript
const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/api/events-logs?${params}`,
  {
    credentials: 'include',  // ✅ This is correct
    headers: { 'x-timestamp': Date.now().toString() }  // ✅ This is correct
  }
);
```

**Verification Steps**:

1. **Check your current setup**:
   ```bash
   # Check which API URL your frontend is using:
   cat .env.local | grep VITE_API_BASE_URL
   ```

2. **Check if backend is running locally**:
   ```bash
   curl http://localhost:3001/health
   ```

3. **If backend is NOT running locally, start it**:
   ```bash
   node server.js
   ```

4. **Verify cookies in browser**:
   - Open DevTools → Application → Cookies
   - Look for `__session` cookie
   - Check the domain - it should match your API URL domain

**Recommended Development Setup**:

```
Frontend (Vite dev server):  http://localhost:8080
Backend (Node.js):           http://localhost:3001
Database:                    Firebase (cloud)
```

This way:
- Both frontend and backend are on `localhost`
- Cookies work perfectly
- You can develop and test locally
- Use production backend only for production frontend

## Email Configuration Warning ⚠️

**Warning**:
```
❌ EMAIL_USER environment variable is required
❌ Failed to initialize email transporter: Email configuration missing: EMAIL_USER
📧 Email functionality will not work until configuration is fixed
```

**Fix**: Add email configuration to your `.env.production` file:

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=kyc@nem-insurance.com
EMAIL_PASS=your_app_specific_password_here
```

**Note**: This doesn't affect the events log functionality, only email notifications.

## Testing the Fixes

### 1. Test Backend Health
```bash
curl https://nem-server-rhdb.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "timestamp": "2025-12-10T...",
  "eventsLogging": true,
  "ipGeolocation": false
}
```

### 2. Test Root Endpoint
```bash
curl https://nem-server-rhdb.onrender.com/
```

Expected response:
```json
{
  "status": "ok",
  "message": "NEM Server API is running",
  "version": "2.0",
  "timestamp": "2025-12-10T..."
}
```

### 3. Test Events Log (After Login)
1. Log in to your app at `http://localhost:8080`
2. Navigate to `/admin/events-log`
3. Check browser DevTools → Network tab
4. Look for the `/api/events-logs` request
5. Check if the `__session` cookie is being sent in the request headers

## Deployment Steps

1. **Commit the changes**:
   ```bash
   git add server.js
   git commit -m "Fix: Add trust proxy, health checks, and timestamp validation exemptions"
   git push
   ```

2. **Render will auto-deploy** (if auto-deploy is enabled)

3. **Verify deployment**:
   - Check Render logs for successful startup
   - Test health endpoint
   - Test events log after logging in

## Summary of Changes

### Files Modified:
- ✅ `server.js` - Added trust proxy, health checks, timestamp exemptions

### Changes Made:
1. ✅ Added `app.set('trust proxy', true)` for Render.com compatibility
2. ✅ Added `/` and `/health` to timestamp validation exemptions
3. ✅ Created `GET /` root endpoint
4. ✅ Created `GET /health` health check endpoint

### Issues Resolved:
- ✅ Trust proxy validation error
- ✅ Timestamp validation error on root path
- ✅ Missing health check endpoint

### Issues Remaining:
- ⚠️ Frontend 401 error - Needs user authentication verification
- ⚠️ Email configuration warning - Needs environment variables

## Next Steps

1. **Deploy the backend changes** to Render.com
2. **Verify the health endpoint** works
3. **Check user authentication**:
   - Ensure user is logged in
   - Verify `__session` cookie is set
   - Test events log page again
4. **Add email configuration** if email notifications are needed
5. **Monitor Render logs** for any remaining errors

## Additional Notes

### Trust Proxy Setting
The `trust proxy` setting is crucial for apps behind reverse proxies like:
- Render.com
- Heroku
- AWS ELB/ALB
- Nginx
- Cloudflare

Without it, Express can't correctly identify:
- Client IP addresses
- Protocol (HTTP/HTTPS)
- Hostname

### Rate Limiting
With `trust proxy` enabled, rate limiting will now work correctly based on the actual client IP, not the proxy IP.

### Security
The trust proxy setting is safe because:
1. We're on a trusted platform (Render.com)
2. We're using IP hashing for privacy
3. We're masking IPs in logs
4. We're not exposing raw IPs to the frontend
