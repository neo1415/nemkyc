# Gemini API - Quick Deployment Guide

## 🚀 Quick Fix for Production

### Problem
Gemini document verification returns HTML instead of JSON with error:
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### Solution (3 Steps)

#### Step 1: Get Gemini API Key (2 minutes)
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key" or "Get API Key"
4. Copy the key (starts with `AIzaSy...`)

#### Step 2: Set Environment Variable in Production (1 minute)

**For Render.com:**
1. Go to your service dashboard
2. Click "Environment" tab
3. Add new environment variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Paste your API key from Step 1
4. Click "Save Changes"

**For Vercel:**
1. Go to Project Settings → Environment Variables
2. Add new variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Paste your API key from Step 1
3. Select "Production" environment
4. Click "Save"

**For Other Platforms:**
Set environment variable `GEMINI_API_KEY` with your API key value.

#### Step 3: Deploy Updated Code (2 minutes)
```bash
git add .
git commit -m "Fix: Gemini API endpoint - add proper error handling and environment config"
git push origin main
```

Wait for deployment to complete (usually 2-5 minutes).

### ✅ Verification

Test the endpoint:
```bash
curl -X POST https://your-server-url.com/api/gemini/generate \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

**Expected**: JSON response (not HTML)

### 🔍 Check Server Logs

Look for these messages after deployment:
```
✅ Gemini API key configured
🤖 [GEMINI] Endpoint hit!
✅ Gemini API call successful
```

### ⚠️ Common Issues

**Issue**: Still getting HTML response
- **Fix**: Make sure you set `GEMINI_API_KEY` (not `VITE_GEMINI_API_KEY`)
- **Fix**: Restart the server after setting environment variable

**Issue**: "Gemini API key not configured"
- **Fix**: The environment variable is not set or is empty
- **Fix**: Check spelling: `GEMINI_API_KEY` (exact case)

**Issue**: "Invalid API key"
- **Fix**: Generate a new key from https://makersuite.google.com/app/apikey
- **Fix**: Make sure you copied the entire key

### 📝 What Was Fixed

1. ✅ Added missing `GEMINI_API_KEY` backend environment variable
2. ✅ Moved endpoint to proper location in server.js
3. ✅ Added explicit `Content-Type: application/json` header
4. ✅ Enhanced error messages and logging
5. ✅ Added request validation

### 🔒 Security Note

**IMPORTANT**: The `GEMINI_API_KEY` is a backend-only variable. Never expose it to the frontend or commit it to version control.

### 📞 Need Help?

If you're still experiencing issues:
1. Check server logs for error messages
2. Verify the environment variable is set correctly
3. Ensure the server restarted after setting the variable
4. Test the endpoint directly with curl (see Verification section)

---

**Estimated Total Time**: 5-10 minutes
**Difficulty**: Easy
**Impact**: Fixes critical production issue with document verification
