# Git Hooks Installation Guide

## Purpose
Prevent accidentally committing sensitive data (API keys, credentials, secrets) to the repository.

## Installation

### Option 1: Automatic (Recommended)

Run this command in your terminal:

```bash
# Make the hook executable and install it
chmod +x .git-hooks/pre-commit
cp .git-hooks/pre-commit .git/hooks/pre-commit
```

### Option 2: Manual

1. Navigate to your project root
2. Copy the pre-commit hook:
   ```bash
   cp .git-hooks/pre-commit .git/hooks/pre-commit
   ```
3. Make it executable:
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

## What It Does

The pre-commit hook scans staged files for:
- ✅ Google Cloud private keys
- ✅ API keys (Google, AWS, OpenAI, GitHub, GitLab)
- ✅ Service account emails
- ✅ Other common secret patterns

If secrets are detected, the commit is **BLOCKED** automatically.

## Testing

Try committing a file with a fake API key:
```bash
echo "private_key: test123" > test.txt
git add test.txt
git commit -m "test"
# Should be blocked!
```

## Bypassing (NOT RECOMMENDED)

If you're absolutely sure there are no secrets:
```bash
git commit --no-verify -m "your message"
```

**⚠️ WARNING: Only use --no-verify if you're 100% certain!**

## Alternative: Use .gitignore for Sensitive Directories

Instead of ignoring all tests/docs, create a separate directory for sensitive files:

```
/docs-private/          # Gitignored - for internal notes with credentials
/tests-private/         # Gitignored - for tests with real data
/docs/                  # Committed - public documentation
/src/__tests__/         # Committed - unit tests with mock data
```

Add to `.gitignore`:
```
/docs-private/
/tests-private/
```

## Best Practices

1. **Use placeholder values in committed files:**
   ```javascript
   // ✅ Good
   const apiKey = process.env.API_KEY || 'YOUR_API_KEY_HERE';
   
   // ❌ Bad
   const apiKey = 'AIzaSyD1234567890abcdefghijklmnop';
   ```

2. **Use environment variables:**
   - Store secrets in `.env` (gitignored)
   - Reference them in code: `process.env.SECRET_KEY`

3. **Use mock data in tests:**
   ```javascript
   // ✅ Good
   const mockCredentials = {
     apiKey: 'mock-api-key-for-testing',
     projectId: 'test-project'
   };
   ```

4. **Document without exposing:**
   ```markdown
   ✅ Good:
   Set your API key in `.env`:
   ```
   API_KEY=your_key_here
   ```
   
   ❌ Bad:
   Use this API key: AIzaSyD1234567890abcdefghijklmnop
   ```

## Troubleshooting

**Hook not running?**
- Check if `.git/hooks/pre-commit` exists
- Check if it's executable: `ls -la .git/hooks/pre-commit`
- Reinstall: `cp .git-hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`

**False positives?**
- Edit `.git-hooks/pre-commit` to adjust patterns
- Or use `git commit --no-verify` (carefully!)

## Additional Security Tools

Consider using:
- **git-secrets**: https://github.com/awslabs/git-secrets
- **gitleaks**: https://github.com/gitleaks/gitleaks
- **truffleHog**: https://github.com/trufflesecurity/trufflehog

---

**Remember: Prevention is better than cleanup!** 🔒
