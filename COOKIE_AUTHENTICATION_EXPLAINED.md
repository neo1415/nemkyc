# Cookie Authentication - Why You're Getting 401 Errors

## The Core Issue

Your frontend is running on `localhost:8080` but trying to access the backend on `nem-server-rhdb.onrender.com`. This is a **cross-origin** request, and browsers have strict security rules about cookies in cross-origin scenarios.

## How Cookie Authentication Works

### 1. Login Flow
```
User logs in → Firebase Auth → Get ID token
                                    ↓
Frontend sends token → Backend /api/exchange-token
                                    ↓
Backend verifies token → Creates session → Sets __session cookie
                                    ↓
Cookie stored in browser (domain-specific!)
```

### 2. Subsequent Requests
```
User visits /admin/events-log
                ↓
Frontend makes request to /api/events-logs
                ↓
Browser automatically includes __session cookie
                ↓
Backend reads cookie → Verifies session → Returns data
```

## The Problem: Cross-Origin Cookies

### What's Happening Now

```
Frontend:  http://localhost:8080
Backend:   https://nem-server-rhdb.onrender.com

Login → Cookie set by: nem-server-rhdb.onrender.com
        Cookie domain:  .onrender.com

Later request from localhost:8080
        ↓
Browser: "This cookie is for .onrender.com, not localhost"
        ↓
Cookie NOT sent with request
        ↓
Backend: "No __session cookie found"
        ↓
401 Unauthorized ❌
```

### Why Browsers Block This

**Security Reason**: Prevent malicious sites from stealing cookies

Example attack scenario:
```
1. User logs into bank.com (cookie set)
2. User visits evil.com
3. evil.com tries to make request to bank.com
4. If browser sent bank.com cookie → evil.com could steal money!
```

So browsers enforce: **Cookies are only sent to the domain that set them**

## The Solution: Match Domains

### Option 1: Both Local (Development) ✅ RECOMMENDED

```
Frontend:  http://localhost:8080
Backend:   http://localhost:3001

Login → Cookie set by: localhost
        Cookie domain:  localhost

Request from localhost:8080 to localhost:3001
        ↓
Browser: "Both are localhost, same domain!"
        ↓
Cookie IS sent ✅
        ↓
Backend: "Valid __session cookie found"
        ↓
200 OK with data ✅
```

### Option 2: Both Production ✅ WORKS

```
Frontend:  https://nemforms.com
Backend:   https://nem-server-rhdb.onrender.com

With proper CORS configuration:
- Backend allows nemforms.com origin
- Backend sets cookie with SameSite=None; Secure
- Browser allows cross-site cookie

Login → Cookie set with SameSite=None; Secure
        ↓
Request from nemforms.com to nem-server-rhdb.onrender.com
        ↓
Browser: "CORS allows this, cookie has SameSite=None"
        ↓
Cookie IS sent ✅
```

### Option 3: Mixed ❌ DOESN'T WORK

```
Frontend:  http://localhost:8080
Backend:   https://nem-server-rhdb.onrender.com

Login → Cookie set by: nem-server-rhdb.onrender.com
        Cookie domain:  .onrender.com

Request from localhost:8080
        ↓
Browser: "localhost ≠ onrender.com"
        ↓
Cookie NOT sent ❌
        ↓
401 Unauthorized ❌
```

## Technical Details

### Cookie Attributes

```javascript
// Development (same domain)
res.cookie('__session', sessionId, {
  httpOnly: true,        // Can't be accessed by JavaScript
  secure: false,         // HTTP is OK for localhost
  sameSite: 'strict',    // Only send to same site
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

```javascript
// Production (cross-domain)
res.cookie('__session', sessionId, {
  httpOnly: true,        // Can't be accessed by JavaScript
  secure: true,          // HTTPS required
  sameSite: 'none',      // Allow cross-site (with CORS)
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

### CORS Configuration

Your backend already has this:

```javascript
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8080',  // ✅ Your frontend
      'https://nemforms.com',
      'https://nem-server-rhdb.onrender.com',
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // ...
  },
  credentials: true,  // ✅ Allow cookies
  // ...
}));
```

This is correct! The issue is not CORS, it's the cookie domain mismatch.

## Debugging Cookie Issues

### Check if Cookie Exists

**Browser DevTools**:
1. Open DevTools (F12)
2. Go to Application tab
3. Click Cookies in left sidebar
4. Look for your domain

You should see:
```
Name: __session
Value: <some-long-string>
Domain: localhost (or .onrender.com)
Path: /
Expires: <date>
HttpOnly: ✓
Secure: ✓ (production only)
SameSite: Strict (or None)
```

**Console Check**:
```javascript
// This won't show httpOnly cookies, but can check if any cookies exist
document.cookie

// Better: Check Network tab
// 1. Go to Network tab
// 2. Make a request to /api/events-logs
// 3. Click the request
// 4. Look at Request Headers
// 5. Check if "Cookie: __session=..." is present
```

### Common Issues

#### Issue 1: No Cookie at All
**Symptom**: No `__session` cookie in DevTools

**Cause**: User not logged in, or login failed

**Fix**: Log out and log in again

#### Issue 2: Cookie Exists but Not Sent
**Symptom**: Cookie in DevTools, but not in request headers

**Cause**: Domain mismatch (localhost vs production)

**Fix**: Use matching domains (both local or both production)

#### Issue 3: Cookie Expired
**Symptom**: Cookie exists but backend says invalid

**Cause**: Session expired (7 days default)

**Fix**: Log out and log in again

#### Issue 4: Wrong Domain
**Symptom**: Cookie domain is `.onrender.com` but frontend is `localhost`

**Cause**: Logged in to production, now testing locally

**Fix**: 
1. Clear cookies
2. Start local backend
3. Log in again (cookie will be set for localhost)

## Your Current Setup

### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:3001
```
✅ Configured for local backend

### Backend (server.js)
```javascript
const port = process.env.PORT || 3001;
```
✅ Runs on port 3001 by default

### What You Need to Do

1. **Start local backend**:
   ```bash
   node server.js
   ```

2. **Verify it's running**:
   ```bash
   curl http://localhost:3001/health
   ```

3. **Clear cookies** (if you logged in to production before):
   - DevTools → Application → Cookies → Delete all

4. **Log in again**:
   - This will set cookie for `localhost`

5. **Test events log**:
   - Navigate to `/admin/events-log`
   - Should work now! ✅

## Production Deployment

When deploying to production:

### Frontend
```env
# .env.production
VITE_API_BASE_URL=https://nem-server-rhdb.onrender.com
```

### Backend
Already configured! The backend checks `NODE_ENV` and sets cookie attributes accordingly:

```javascript
// In server.js (already there)
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
}
```

## Summary

### The Problem
- Frontend on `localhost:8080`
- Backend on `nem-server-rhdb.onrender.com`
- Cookie domain mismatch
- Browser blocks cookie
- 401 Unauthorized

### The Solution
- Run backend locally: `node server.js`
- Both on `localhost`
- Cookie domain matches
- Browser sends cookie
- Authentication works ✅

### For Production
- Deploy both frontend and backend
- Both on HTTPS
- Proper CORS configuration (already done)
- SameSite=None cookie (already configured)
- Works perfectly ✅

## Additional Resources

- `QUICK_FIX_GUIDE.md` - Step-by-step fix
- `SIEM_AUTHENTICATION_FIX.md` - Technical details
- `SIEM_IMPLEMENTATION_GUIDE.md` - Full SIEM guide
- `.env.example` - Environment variables reference
