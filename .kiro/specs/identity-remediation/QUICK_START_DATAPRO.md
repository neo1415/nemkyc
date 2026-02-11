# Quick Start: Datapro NIN Verification

## 🚀 Get Started in 3 Steps

### Step 1: Get Your SERVICEID

Contact Datapro Nigeria to register as a merchant:
- **Email:** devops@datapronigeria.net
- **Website:** https://datapronigeria.com
- **Portal:** https://api.datapronigeria.com

They'll send you a **SERVICEID** (also called MERCHANT ID).

### Step 2: Configure Environment

Edit `.env.local` (for development):

```env
VERIFICATION_MODE=datapro
DATAPRO_SERVICE_ID=your_serviceid_here
DATAPRO_API_URL=https://api.datapronigeria.com
```

### Step 3: Test It

```bash
# Start server
npm run dev

# Look for this in logs:
# 🔍 Verification mode: datapro
# ✅ Datapro credentials configured
```

## 🧪 Quick Test

**Test NIN:** `92957425574`

**Expected Result:**
- Name: JOHN BULL
- Gender: Male
- DOB: 12-May-1969

## 📋 Verification Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `mock` | Simulated (no API calls) | Development, testing |
| `datapro` | Real Datapro API | Production, integration testing |

## 🔒 Security Checklist

- [ ] SERVICEID stored in environment variables (not in code)
- [ ] `.env.local` added to `.gitignore`
- [ ] SERVICEID never logged or exposed to frontend
- [ ] Encryption key configured (`ENCRYPTION_KEY`)

## 🐛 Troubleshooting

**"SERVICEID not configured"**
→ Check environment variable is set and server restarted

**"Authorization failed (87)"**
→ Verify SERVICEID is correct, contact Datapro

**"Network error (88)"**
→ Check internet connection and API URL

## 📚 Full Documentation

See `DATAPRO_TESTING_GUIDE.md` for complete testing instructions.

## 🆘 Support

- **Datapro:** devops@datapronigeria.net
- **Documentation:** `.kiro/specs/identity-remediation/`
