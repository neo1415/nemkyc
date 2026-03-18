# Gemini Document Verification API - HTML Error Fix

## Problem Summary
The Gemini document verification API endpoint (`/api/gemini/generate`) was returning HTML instead of JSON in production, causing the error:
```
Gemini API call failed: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Root Causes Identified

### 1. **Missing Backend Environment Variable**
- **Issue**: The production environment had `VITE_GEMINI_API_KEY` (frontend variable) but was missing `GEMINI_API_KEY` (backend variable)
- **Impact**: The backend couldn't access the Gemini API key
- **Location**: `.env.production` file

### 2. **Placeholder API Key Value**
- **Issue**: The API key was set to `your_gemini_api_key_here` (placeholder)
- **Impact**: Even if the variable name was correct, the API key was invalid
- **Location**: `.env.production` file

### 3. **Endpoint Placement Issue**
- **Issue**: The Gemini endpoint was defined after the error handler middleware (line 19099)
- **Impact**: While this shouldn't prevent the endpoint from working, it's not best practice
- **Location**: `server.js` line 19099

### 4. **Insufficient Error Handling**
- **Issue**: The endpoint didn't explicitly set `Content-Type: application/json` header
- **Impact**: In some error scenarios, the response might not be properly formatted as JSON
- **Location**: `server.js` Gemini endpoint handler

## Fixes Applied

### Fix 1: Environment Variable Configuration
**File**: `.env.production`

Added proper backend environment variable with clear documentation:
```env
# Gemini API Configuration (Frontend - for display/config only)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Gemini API Configuration (Backend - REQUIRED for document verification)
# Get your API key from: https://makersuite.google.com/app/apikey
# IMPORTANT: This is a BACKEND-only variable and should NEVER be exposed to the frontend
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Action Required**: Replace `your_actual_gemini_api_key_here` with a real Gemini API key from https://makersuite.google.com/app/apikey

### Fix 2: Improved Endpoint Implementation
**File**: `server.js`

1. **Moved endpoint to proper location** (before error handlers, after other API endpoints)
2. **Added explicit Content-Type header**: `res.setHeader('Content-Type', 'application/json')`
3. **Enhanced error messages** with actionable guidance
4. **Added request validation** for the `contents` parameter
5. **Improved logging** for debugging

### Fix 3: Updated .env.example
**File**: `.env.example`

Added clearer documentation for the Gemini API key configuration:
```env
# Gemini Document Verification API (Backend - REQUIRED)
# Get your API key from: https://makersuite.google.com/app/apikey
# IMPORTANT: This is a BACKEND-only variable and should NEVER be exposed to the frontend
# The backend uses this to call the Gemini API for document OCR and verification
GEMINI_API_KEY=your_gemini_api_key_here
```

## Deployment Checklist

### Step 1: Get Gemini API Key
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Create a new API key or use an existing one
4. Copy the API key (it will look like: `AIzaSy...`)

### Step 2: Configure Production Environment
1. Open your production environment configuration (Render.com, Vercel, etc.)
2. Add/update the environment variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your actual Gemini API key from Step 1
3. Save the configuration

### Step 3: Deploy Updated Code
1. Commit the changes to `server.js`, `.env.production`, and `.env.example`
2. Push to your production branch
3. Wait for deployment to complete

### Step 4: Verify the Fix
1. Check server logs for the startup message showing Gemini configuration
2. Test the document verification feature in production
3. Verify that the API returns JSON (not HTML)
4. Check that OCR extraction works correctly

## Testing

### Test 1: Endpoint Accessibility
```bash
curl -X POST https://nem-server-rhdb.onrender.com/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

**Expected**: JSON response (not HTML)

### Test 2: API Key Validation
Check server logs for:
- ✅ `Gemini API key configured` (if key is set)
- ❌ `Gemini API key not configured` (if key is missing)

### Test 3: Document Verification
1. Upload a document in the frontend
2. Check browser console for API response
3. Verify no "Unexpected token '<'" errors
4. Confirm OCR data is extracted

## Monitoring

### Server Logs to Watch
```
🤖 [GEMINI] Endpoint hit! Method: POST Path: /api/gemini/generate
🤖 Making Gemini API call with X content parts
✅ Gemini API call successful
```

### Error Logs to Watch For
```
❌ Gemini API key not configured
❌ Invalid request: contents missing or empty
❌ Gemini API error: [details]
❌ Gemini endpoint error: [details]
```

## Troubleshooting

### Issue: Still Getting HTML Response
**Possible Causes**:
1. Environment variable not set in production
2. Server not restarted after environment variable change
3. Reverse proxy (Render.com) returning error page

**Solutions**:
1. Verify `GEMINI_API_KEY` is set in production environment
2. Restart the production server
3. Check Render.com logs for deployment errors
4. Verify the endpoint is accessible: `curl https://nem-server-rhdb.onrender.com/api/gemini/generate`

### Issue: "Gemini API key not configured" Error
**Cause**: The `GEMINI_API_KEY` environment variable is not set or is empty

**Solution**:
1. Set the environment variable in production
2. Restart the server
3. Verify with: `echo $GEMINI_API_KEY` (in server shell)

### Issue: "Invalid API key" Error from Gemini
**Cause**: The API key is invalid or has been revoked

**Solution**:
1. Generate a new API key from https://makersuite.google.com/app/apikey
2. Update the `GEMINI_API_KEY` environment variable
3. Restart the server

### Issue: CORS Error
**Cause**: The frontend origin is not in the allowed origins list

**Solution**:
1. Check `allowedOrigins` array in `server.js`
2. Add your frontend domain if missing
3. Redeploy the server

## Security Notes

### ⚠️ CRITICAL: Never Expose API Key to Frontend
- The `GEMINI_API_KEY` should ONLY be set on the backend
- Never use `VITE_GEMINI_API_KEY` for the actual API key (VITE_ variables are exposed to the frontend)
- The backend acts as a proxy to protect the API key

### Best Practices
1. **Use environment variables** for all API keys
2. **Rotate API keys** regularly
3. **Monitor API usage** to detect abuse
4. **Set up rate limiting** on the Gemini endpoint (already implemented)
5. **Log all API calls** for audit purposes (already implemented)

## Related Files
- `server.js` - Backend API endpoint
- `.env.production` - Production environment configuration
- `.env.example` - Environment variable template
- `src/services/geminiOCREngine.ts` - Frontend API client
- `src/services/geminiOrchestrator.ts` - Document verification orchestrator

## Additional Resources
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Get Gemini API Key](https://makersuite.google.com/app/apikey)
- [Render.com Environment Variables](https://render.com/docs/environment-variables)

## Summary
The issue was caused by a missing backend environment variable (`GEMINI_API_KEY`) and improper endpoint placement. The fix includes:
1. ✅ Added proper backend environment variable configuration
2. ✅ Moved endpoint to correct location in server.js
3. ✅ Enhanced error handling and logging
4. ✅ Added explicit JSON Content-Type header
5. ✅ Improved documentation and deployment instructions

**Next Steps**: Configure the `GEMINI_API_KEY` environment variable in production and redeploy.
