# Quick Start Guide - Security Improvements

## 🚀 Getting Started (5 Minutes)

### Step 1: Set Up Environment Variables
```bash
# Copy the example file
cp .env.example .env.local

# The .env.local file is already created with your values
# You can edit it if needed
```

### Step 2: Install Dependencies (if needed)
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Test the Changes
1. Open http://localhost:8080
2. Try signing in
3. Try submitting a form
4. Check that everything works

---

## ✅ What Changed?

### For You (Developer)
- **Environment variables** - No more hardcoded secrets
- **Better errors** - App won't crash, shows friendly messages
- **Secure storage** - Form drafts are encrypted
- **Better API calls** - Automatic retries and error handling

### For Users
- **More reliable** - Automatic retry on network failures
- **Better errors** - Clear, helpful error messages
- **More secure** - Data is encrypted in browser

---

## 📁 New Files Created

```
├── .env.example              # Template for environment variables
├── .env.local                # Your actual environment variables (gitignored)
├── src/
│   ├── api/
│   │   └── client.ts         # Centralized API client
│   ├── components/
│   │   └── common/
│   │       └── ErrorBoundary.tsx  # Error handling component
│   ├── config/
│   │   └── constants.ts      # App configuration
│   └── utils/
│       ├── secureStorage.ts  # Encrypted localStorage
│       └── inputValidation.ts # Input validation utilities
├── SECURITY_IMPROVEMENTS.md  # Detailed documentation
├── FIXES_SUMMARY.md          # Summary of changes
└── QUICK_START.md            # This file
```

---

## 🔧 Modified Files

```
├── .gitignore                # Added environment file patterns
├── src/
│   ├── App.tsx               # Added ErrorBoundary
│   ├── firebase/config.ts    # Uses environment variables
│   ├── contexts/AuthContext.tsx  # Uses secure storage
│   └── services/
│       ├── authService.ts    # Uses constants
│       ├── formsService.ts   # Uses constants
│       └── submissionService.ts  # Uses constants
```

---

## 🎯 How to Use New Features

### 1. Using the API Client
```typescript
import { api } from '@/api/client';

// Simple GET request
const data = await api.get('/api/forms/motor-claims');

// POST with data
const result = await api.post('/api/submit-form', {
  formData: myData,
  formType: 'Motor Claim'
});

// Automatic retries and error handling included!
```

### 2. Using Secure Storage
```typescript
import { secureStorageSet, secureStorageGet } from '@/utils/secureStorage';

// Save form draft (encrypted, expires in 7 days)
secureStorageSet('formDraft_motor', formData);

// Get form draft
const draft = secureStorageGet('formDraft_motor');

// Already integrated in AuthContext!
```

### 3. Using Input Validation
```typescript
import { validateFormData, ValidationRules } from '@/utils/inputValidation';

const errors = validateFormData(formData, {
  email: [ValidationRules.required(), ValidationRules.email()],
  phone: [ValidationRules.required(), ValidationRules.phone()],
  bvn: [ValidationRules.bvn()],
});

if (errors.length > 0) {
  // Show errors to user
  toast.error(errors[0]);
}
```

---

## 🐛 Troubleshooting

### Problem: "Cannot find module '@/api/client'"
**Solution:** TypeScript path alias issue. Use relative import:
```typescript
import { api } from '../api/client';
```

### Problem: "Environment variable is undefined"
**Solution:** 
1. Check `.env.local` exists
2. Check variable name starts with `VITE_`
3. Restart dev server (`npm run dev`)

### Problem: "CORS error"
**Solution:** Backend needs to allow your origin. Check `server.js` CORS configuration.

### Problem: "Request too old" error
**Solution:** Check your system clock is correct. The timestamp validation requires accurate time.

---

## 📊 Before vs After

### Before
```typescript
// Hardcoded URL
const response = await fetch('https://nem-server-rhdb.onrender.com/api/forms', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': await getCSRFToken(),
    'x-timestamp': Date.now().toString(),
  },
  credentials: 'include',
});

if (!response.ok) {
  throw new Error('Request failed');
}

const data = await response.json();
```

### After
```typescript
// Clean and simple
import { api } from '@/api/client';

const data = await api.get('/api/forms');
// Automatic CSRF, timestamp, retries, error handling!
```

---

## 🎓 Learn More

- **Detailed docs:** See `SECURITY_IMPROVEMENTS.md`
- **Summary:** See `FIXES_SUMMARY.md`
- **Environment setup:** See `.env.example`

---

## ⚠️ Important Reminders

1. **Never commit `.env.local`** - It's gitignored for a reason
2. **Backend changes needed** - See `FIXES_SUMMARY.md` for details
3. **Test thoroughly** - Especially authentication flows
4. **Update production env vars** - When deploying

---

## 🎉 You're All Set!

The frontend is now more secure and reliable. Next steps:

1. ✅ Test locally
2. ⏳ Implement backend changes (see `FIXES_SUMMARY.md`)
3. ⏳ Deploy to production
4. ⏳ Monitor for errors

**Questions?** Check the documentation files or ask for help!
