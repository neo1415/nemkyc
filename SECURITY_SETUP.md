# Security Setup - Preventing Credential Leaks

## 🎯 Problem
You're concerned about accidentally committing credentials in tests and documentation files.

## ✅ Solution: Multi-Layer Protection

### Layer 1: .gitignore (Passive Protection)

**What's ignored:**
```
# Credentials
google-cloud-credentials.json
*-credentials.json
service-account*.json

# Environment files
.env*

# Private files (use these for sensitive content)
/docs-private/
/tests-private/
/notes-private/
*.private.md
*.private.test.ts
*.private.test.js
```

**How to use:**
- Put sensitive docs in `docs-private/` folder
- Put tests with real data in `tests-private/` folder
- Name sensitive files with `.private.` suffix

### Layer 2: Pre-commit Hook (Active Protection)

**What it does:**
- Scans ALL staged files before commit
- Blocks commits containing:
  - Google Cloud private keys
  - API keys (Google, AWS, OpenAI, GitHub)
  - Service account emails
  - Other secret patterns

**Installation:**

**Linux/Mac:**
```bash
chmod +x setup-git-hooks.sh
./setup-git-hooks.sh
```

**Windows:**
```bash
setup-git-hooks.bat
```

**Manual:**
```bash
cp .git-hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit  # Linux/Mac only
```

### Layer 3: Best Practices

#### ✅ DO:

1. **Use placeholders in committed files:**
   ```javascript
   // In committed test file
   const mockApiKey = 'mock-api-key-for-testing';
   const mockProjectId = 'test-project-id';
   ```

2. **Use environment variables:**
   ```javascript
   // In code
   const apiKey = process.env.GOOGLE_API_KEY;
   
   // In .env (gitignored)
   GOOGLE_API_KEY=your_real_key_here
   ```

3. **Document without exposing:**
   ```markdown
   ✅ Good:
   Set your API key in `.env`:
   ```
   GOOGLE_API_KEY=your_key_here
   ```
   
   ❌ Bad:
   Use this API key: AIzaSyD1234567890
   ```

4. **Use separate directories:**
   ```
   /docs/                    ← Committed (public docs)
   /docs-private/            ← Gitignored (internal notes with credentials)
   /src/__tests__/           ← Committed (tests with mock data)
   /tests-private/           ← Gitignored (tests with real data)
   ```

#### ❌ DON'T:

1. **Don't commit real credentials:**
   ```javascript
   // ❌ Bad
   const apiKey = 'AIzaSyD1234567890abcdefghijklmnop';
   ```

2. **Don't use --no-verify unless absolutely necessary:**
   ```bash
   # ❌ Dangerous
   git commit --no-verify -m "quick fix"
   ```

3. **Don't ignore ALL tests/docs:**
   ```
   # ❌ Bad - you'll lose important files
   *.test.ts
   *.md
   ```

## 🧪 Testing the Setup

1. **Test the pre-commit hook:**
   ```bash
   echo "private_key: test123" > test-secret.txt
   git add test-secret.txt
   git commit -m "test"
   # Should be BLOCKED!
   rm test-secret.txt
   ```

2. **Test gitignore:**
   ```bash
   mkdir docs-private
   echo "API_KEY=secret123" > docs-private/notes.md
   git status
   # Should NOT show docs-private/notes.md
   ```

## 🚨 What to Do If You Already Committed Secrets

1. **Remove from history:**
   ```bash
   # Use BFG Repo-Cleaner or git-filter-repo
   git filter-repo --path google-cloud-credentials.json --invert-paths
   ```

2. **Rotate the credentials:**
   - Generate new API keys
   - Delete old credentials from Google Cloud Console
   - Update your `.env` file

3. **Force push (if needed):**
   ```bash
   git push --force
   ```

## 📊 Security Checklist

Before committing:
- [ ] No real API keys in code
- [ ] No credentials in test files
- [ ] No secrets in documentation
- [ ] Environment variables used for sensitive data
- [ ] Pre-commit hook installed and working
- [ ] Sensitive files in gitignored directories

## 🔧 Maintenance

**Update patterns in pre-commit hook:**
Edit `.git-hooks/pre-commit` and add new patterns to the `PATTERNS` array.

**Reinstall hook after updates:**
```bash
./setup-git-hooks.sh  # or setup-git-hooks.bat on Windows
```

## 🛠️ Additional Tools (Optional)

For extra security, consider:
- **gitleaks**: https://github.com/gitleaks/gitleaks
- **git-secrets**: https://github.com/awslabs/git-secrets
- **truffleHog**: https://github.com/trufflesecurity/trufflehog

---

**Remember: The pre-commit hook is your last line of defense!** 🛡️

Install it now:
```bash
./setup-git-hooks.sh  # Linux/Mac
setup-git-hooks.bat   # Windows
```
