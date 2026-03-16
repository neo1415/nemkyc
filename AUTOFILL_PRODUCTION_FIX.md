# Autofill Production API Connection Fix

## Problem
In production, the autofill feature (CAC and NIN verification) is trying to connect to `localhost:3000` instead of the production backend URL, causing `ERR_CONNECTION_REFUSED` errors.

## Root Cause
The production build is not properly reading the `VITE_API_BASE_URL` environment variable from `.env.production`. This can happen when:
1. The build was created without environment variables being injected
2. The `.env.production` file wasn't present during build
3. There's a cached build that doesn't include the environment variables

## Solution

### Step 1: Verify Environment Variables
The `.env.production` file has been updated with both variables:
```env
VITE_API_BASE_URL=https://nem-server-rhdb.onrender.com
VITE_API_URL=https://nem-server-rhdb.onrender.com
```

### Step 2: Rebuild the Production Bundle
You MUST rebuild the production bundle for the changes to take effect:

```bash
# Clean the dist folder
rm -rf dist

# Rebuild with production environment
npm run build
```

### Step 3: Verify the Build
After building, check that the environment variables are baked into the bundle:

```bash
# Search for the API URL in the built files
grep -r "nem-server-rhdb.onrender.com" dist/
```

You should see the production URL in the JavaScript bundles.

### Step 4: Deploy the New Build
Deploy the newly built `dist` folder to your hosting service (Firebase Hosting, Netlify, Vercel, etc.).

## How It Works

The `VerificationAPIClient.ts` file uses this code to determine the API URL:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                     import.meta.env.VITE_API_URL || 
                     'http://localhost:3001';
```

During the build process, Vite replaces `import.meta.env.VITE_API_BASE_URL` with the actual value from `.env.production`.

## Important Notes

1. **Environment variables are baked into the build** - You cannot change them after building. You must rebuild to update them.

2. **Only `VITE_` prefixed variables are exposed** - Vite only exposes environment variables that start with `VITE_` to the client-side code for security reasons.

3. **Development vs Production** - In development, the proxy in `vite.config.ts` redirects `/api` calls to `localhost:3001`. In production, the full URL from the environment variable is used.

## Verification Steps

After deploying the new build:

1. Open the production site
2. Open browser DevTools (F12)
3. Go to the Network tab
4. Try to use autofill on a KYC or NFIU form
5. Check the Network tab - you should see requests to `https://nem-server-rhdb.onrender.com/api/autofill/verify-nin` or `verify-cac`
6. The requests should NOT show `localhost:3000` anymore

## If the Problem Persists

If you still see `localhost:3000` after rebuilding and deploying:

1. **Clear browser cache** - Hard refresh with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Check the build output** - Verify the environment variable is in the bundle
3. **Check hosting configuration** - Some hosting services have their own environment variable configuration
4. **Verify .env.production exists** - Make sure the file is in the root directory during build

## Alternative: Hardcode for Emergency Fix

If you need an immediate fix and can't rebuild properly, you can temporarily hardcode the URL in `src/services/autoFill/VerificationAPIClient.ts`:

```typescript
// TEMPORARY FIX - Replace line 18 with:
const API_BASE_URL = 'https://nem-server-rhdb.onrender.com';
```

**WARNING**: This is NOT recommended for long-term use. Always use environment variables for configuration.

## Files Modified
- `.env.production` - Added `VITE_API_URL` as fallback
- This documentation file

## Files to Check
- `src/services/autoFill/VerificationAPIClient.ts` - API client implementation
- `vite.config.ts` - Build configuration
- `.env.production` - Production environment variables
