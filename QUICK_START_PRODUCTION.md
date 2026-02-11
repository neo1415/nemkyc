# 🚀 Quick Start: Production Mode

## ⚡ 3-Step Launch

### Step 1: Generate Encryption Key (One-Time)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and add to `.env.local`:
```bash
ENCRYPTION_KEY=paste_your_key_here
```

### Step 2: Switch to Production Mode
In `.env.local`, change:
```bash
VERIFICATION_MODE=mock
```
To:
```bash
VERIFICATION_MODE=production
```

### Step 3: Restart Server
```bash
npm run dev
```

## ✅ You're Live!

The system will now use:
- **Datapro API** for NIN verification (NOybSD_old)
- **VerifyData API** for CAC verification (TkVNSU5TVVJBTkNFbmVtQG5lbS1pbnN1cmFuY2UuY29t)

## 🔄 Switch Back to Testing
Change `VERIFICATION_MODE=production` to `VERIFICATION_MODE=mock` and restart.

## 🛡️ Security Features Active
✅ All credentials backend-only  
✅ Duplicate NIN/CAC detection  
✅ AES-256-GCM encryption  
✅ Audit logging  
✅ No data leaks  

## 📋 Current Configuration

| Feature | Status | Location |
|---------|--------|----------|
| Datapro NIN API | ✅ Configured | Backend only |
| VerifyData CAC API | ✅ Configured | Backend only |
| Encryption | ⚠️ Need key | Generate above |
| Duplicate Detection | ✅ Active | Automatic |
| Mode Switching | ✅ Ready | `.env.local` |

## 🧪 Quick Test
1. Upload a list
2. Send verification request
3. Submit a NIN/CAC
4. Check Firestore - should see encrypted data
5. Try same NIN/CAC again - should reject as duplicate

## 📖 Full Documentation
See `docs/PRODUCTION_READY_SUMMARY.md` for complete details.

---
**Ready to launch? Just follow the 3 steps above! 🎉**
