# Quick Fix Guide - Events Log 401 Error

## TL;DR - The Problem

You're trying to access production backend from local frontend. Cookies don't work cross-domain.

```
❌ localhost:8080 → nem-server-rhdb.onrender.com (cookies blocked by browser)
✅ localhost:8080 → localhost:3001 (cookies work!)
```

## Quick Solution (2 minutes)

### Step 1: Start Local Backend
```bash
# In your project root:
node server.js
```

You should see:
```
================================================================================
� SERVER STARTED - UPDATED VERSION WITH COLLECTION MAPPING FIX
Server running on port 3001
📝 Events logging: ENABLED
🌐 IP geolocation: DISABLED
================================================================================
```

### Step 2: Verify Backend is Running
Open a new terminal and test:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 12.345,
  "timestamp": "2025-12-10T...",
  "eventsLogging": true,
  "ipGeolocation": false
}
```

### Step 3: Verify Frontend Configuration
Check your `.env.local` file:
```bash
cat .env.local | grep VITE_API_BASE_URL
```

Should show:
```
VITE_API_BASE_URL=http://localhost:3001
```

✅ If it shows this, you're good!
❌ If it shows `https://nem-server-rhdb.onrender.com`, change it to `http://localhost:3001`

### Step 4: Restart Frontend (if needed)
If you changed `.env.local`:
```bash
# Stop your dev server (Ctrl+C)
# Start it again:
npm run dev
```

### Step 5: Test Events Log
1. Go to `http://localhost:8080`
2. Log in to your app
3. Navigate to `/admin/events-log`
4. You should now see events!

## What Was Fixed in Backend

### 1. Trust Proxy (for Render.com)
```javascript
app.set('trust proxy', true);
```

### 2. Health Check Endpoints
```javascript
app.get('/', (req, res) => { ... });
app.get('/health', (req, res) => { ... });
```

### 3. Timestamp Validation Exemptions
```javascript
if (req.path === '/' || req.path === '/health' || ...) {
  return next();
}
```

## Troubleshooting

### Backend won't start?
```bash
# Check if port 3001 is already in use:
netstat -ano | findstr :3001

# Kill the process if needed (Windows):
taskkill /PID <PID> /F

# Or use a different port:
PORT=3002 node server.js
```

### Still getting 401?
1. **Clear cookies**: DevTools → Application → Cookies → Delete all
2. **Log out and log in again**: This will create a new session
3. **Check console**: Look for authentication errors
4. **Verify cookie**: DevTools → Application → Cookies → Look for `__session`

### Frontend can't connect to backend?
```bash
# Test backend directly:
curl http://localhost:3001/health

# If this fails, backend isn't running
# If this works, check VITE_API_BASE_URL in .env.local
```

### Email warnings?
These are safe to ignore for now. Email functionality is separate from events logging.

```
❌ EMAIL_USER environment variable is required
```

To fix (optional):
```env
# Add to .env.local:
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-app-password
```

## Production Deployment

When you're ready to deploy:

### Backend (Render.com)
```bash
git add server.js
git commit -m "Fix: Add trust proxy and health checks"
git push
```

Render will auto-deploy. The fixes include:
- ✅ Trust proxy for correct IP detection
- ✅ Health check endpoint for monitoring
- ✅ Timestamp validation fixes

### Frontend (Firebase Hosting)
Make sure `.env.production` has:
```env
VITE_API_BASE_URL=https://nem-server-rhdb.onrender.com
```

Then deploy:
```bash
npm run build
firebase deploy --only hosting
```

## Summary

**For Development**:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3001`
- Both running locally = cookies work ✅

**For Production**:
- Frontend: `https://nemforms.com` or `https://nem-kyc.web.app`
- Backend: `https://nem-server-rhdb.onrender.com`
- Both on HTTPS = cookies work ✅

**Don't Mix**:
- ❌ Local frontend + Production backend = cookies blocked
- ❌ Production frontend + Local backend = won't work (backend not accessible)

## Files Modified

- ✅ `server.js` - Added trust proxy, health checks, timestamp exemptions
- ✅ `SIEM_AUTHENTICATION_FIX.md` - Detailed explanation
- ✅ `QUICK_FIX_GUIDE.md` - This file

## Next Steps

1. ✅ Start local backend: `node server.js`
2. ✅ Verify it's running: `curl http://localhost:3001/health`
3. ✅ Check frontend config: `.env.local` should use `localhost:3001`
4. ✅ Test events log page
5. ✅ Deploy backend changes to Render when ready

## Need Help?

Check these files:
- `SIEM_AUTHENTICATION_FIX.md` - Detailed technical explanation
- `SIEM_IMPLEMENTATION_GUIDE.md` - Full SIEM setup guide
- `.env.example` - Environment variable reference
