# Security Policy

This document outlines security practices and policies for the Tråkke project.

## Table of Contents

- [Reporting Security Issues](#reporting-security-issues)
- [Credential and Secret Management](#credential-and-secret-management)
- [Automated Security Safeguards](#automated-security-safeguards)
- [Managing Temporary Files](#managing-temporary-files)
- [Best Practices](#best-practices)
- [Security Checklist](#security-checklist)

## Reporting Security Issues

If you discover a security vulnerability, please report it privately:

1. **Do NOT** open a public GitHub issue
2. Email the repository owner or use GitHub's private security reporting
3. Include detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

## Credential and Secret Management

### What Gets Protected

The project has comprehensive safeguards to prevent accidental commit of:

- **API Keys and Tokens**: Any API keys, access tokens, or authentication credentials
- **Environment Variables**: `.env` files containing sensitive configuration
- **Certificates and Keys**: SSL certificates, private keys, PEM files
- **Service Credentials**: Firebase, AWS, Google Cloud service account files
- **Passwords**: Any hardcoded passwords or authentication data

### .gitignore Coverage

The `.gitignore` file is configured to automatically exclude:

```
# Environment variables
.env
.env.local
.env.development
.env.production
.env.staging
*.env (except .env.example)

# Credentials
credentials.json
secrets.json
*-credentials.json
*-secrets.json
*.pem
*.key
*.cert
*.p12
*.pfx
service-account*.json
firebase-adminsdk*.json

# API keys and tokens
*api-key*
*apikey*
*api_key*
*.token
auth-token*
access-token*
```

### Using Environment Variables

**Never hardcode secrets in source code!** Use environment variables instead:

1. **Copy the template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your secrets to `.env.local`:**
   ```env
   VITE_API_KEY=your_actual_api_key_here
   ```

3. **Reference in code:**
   ```typescript
   const apiKey = import.meta.env.VITE_API_KEY
   ```

4. **For production:** Use GitHub Secrets or your hosting platform's environment variable management

**Important:**
- `.env.local` is automatically ignored by git
- All Vite environment variables must start with `VITE_` to be exposed to the frontend
- Never commit `.env.local` or any file with actual secrets

## Automated Security Safeguards

### 1. Pre-Commit Secret Scanning

Every commit is automatically scanned for potential secrets using `secretlint`:

```bash
# Manual check before committing
npm run secrets:check
```

**How it works:**
- Runs automatically via Husky pre-commit hook
- Scans all staged files for patterns matching API keys, tokens, passwords
- Blocks commit if potential secrets are detected
- You must remove the secret or mark as false positive in `.secretlintignore`

### 2. GitHub Actions Security Workflow

The `.github/workflows/security-scan.yml` workflow runs:

- **On every push/PR:** Secret scanning with secretlint
- **Weekly:** Scheduled security audit
- **Dependency audit:** Checks for vulnerable dependencies
- **File verification:** Ensures no common secret files are committed

### 3. Lint-Staged Integration

Secret scanning is integrated into the commit workflow:

```json
{
  "lint-staged": {
    "*": ["secretlint"],
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

### 4. GitHub Built-in Secret Scanning

GitHub automatically scans public repositories for:
- Known API key patterns (AWS, Google, Stripe, etc.)
- Notifies repository owners if secrets are detected
- This is separate from our custom secretlint setup

## Managing Temporary Files

### Types of Temporary Files

Development often creates personal/temporary files that shouldn't be committed:

- **Personal notes:** `CLAUDE.md`, `TODO.md`, `NOTES.md`, `*.local.md`
- **Screenshots:** `*.png`, `*.jpg`, `*.gif` (except in `public/` or `src/assets/`)
- **Debug files:** `*.log`, `*.dump`, `*.trace`, `*.har`
- **Development directories:** `notes/`, `debug/`, `scratch/`, `personal/`

### Automated Protection

These files are automatically ignored by `.gitignore`:

```
# Personal/temporary files
CLAUDE.md
TODO.md
NOTES.md
*.local.md
notes/
debug/
scratch/
personal/

# Screenshots and media (except in specific directories)
*.png
*.jpg
*.jpeg
*.gif
!public/**/*.{png,jpg,jpeg,gif}
!src/assets/**/*

# Debug files
*.log
*.dump
*.trace
*.har
```

### Cleanup Script

Use the provided script to manage temporary files:

```bash
# Scan for temporary files
./scripts/cleanup-temp-files.sh
```

**Options:**
1. **Delete all** - Remove all temporary files immediately
2. **Archive then delete** - Create a `temp-files-backup-[date].tar.gz` archive, then delete originals
3. **List only** - Just show what temporary files exist
4. **Exit** - No changes

**Example workflow:**

```bash
# Before archiving your development session
./scripts/cleanup-temp-files.sh

# Choose option 2 to archive
# This creates: temp-files-backup-20250126-143052.tar.gz

# Later, to extract archived files:
tar -xzf temp-files-backup-20250126-143052.tar.gz
```

### What to Archive vs. Delete

**Archive (keep as backup):**
- Personal notes with valuable information
- Screenshots documenting bugs or features
- Debug logs that might be needed later
- Temporary analysis or research

**Delete (no backup needed):**
- Obsolete notes and TODOs
- Generic test screenshots
- Old debug logs
- Duplicate or redundant files

**Always Delete (never archive):**
- Any files containing API keys or secrets
- Credentials or authentication files
- Production data or PII (Personal Identifiable Information)

## Best Practices

### For Development

1. **Use `.env.local` for all secrets**
   - Copy from `.env.example`
   - Never commit this file
   - Keep production and development secrets separate

2. **Run security checks before committing**
   ```bash
   npm run secrets:check
   ```

3. **Regularly clean up temporary files**
   ```bash
   ./scripts/cleanup-temp-files.sh
   ```

4. **Review what you're committing**
   ```bash
   git diff --staged
   ```

5. **Use descriptive commit messages**
   - Follow conventional commits format
   - Reference what was changed and why

### For API Keys

1. **Never hardcode API keys** in source code
2. **Use environment variables** for all configuration
3. **Rotate keys immediately** if accidentally committed
4. **Use restricted keys** (limit permissions to only what's needed)
5. **Monitor API usage** for unexpected spikes

### For Production

1. **Use GitHub Secrets** for CI/CD environment variables
2. **Use your hosting provider's** environment variable management
3. **Enable two-factor authentication** on all accounts
4. **Regularly audit dependencies** (`npm audit`)
5. **Keep dependencies updated** (Dependabot helps with this)

## Security Checklist

Before committing code, verify:

- [ ] No hardcoded API keys or secrets
- [ ] All secrets in `.env.local` (not committed)
- [ ] No temporary/personal files included
- [ ] No debug or log files
- [ ] No screenshots (except in `public/` or `assets/`)
- [ ] Pre-commit hooks passed (secretlint, eslint, prettier)
- [ ] Dependencies are up to date and audited

Before deploying to production:

- [ ] All secrets configured in GitHub Secrets or hosting environment
- [ ] `.env.example` is up to date with latest variables
- [ ] Security scan workflow passing
- [ ] No vulnerable dependencies (`npm audit`)
- [ ] CORS and security headers configured
- [ ] HTTPS enabled
- [ ] Error messages don't expose sensitive information

## Accidental Commit of Secrets

If you accidentally commit a secret:

1. **Immediately rotate the secret** (generate new API key/token)
2. **Remove from git history:**
   ```bash
   # For recent commits
   git reset --soft HEAD~1
   git reset HEAD path/to/file
   # Edit file to remove secret
   git add .
   git commit -m "fix: remove accidentally committed secrets"

   # For older commits, use BFG Repo-Cleaner or git filter-branch
   ```

3. **Force push** (if already pushed):
   ```bash
   git push --force-with-lease
   ```

4. **Notify team members** to update their local copies
5. **Monitor for unauthorized usage** of the exposed secret

## Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [npm security best practices](https://docs.npmjs.com/security-best-practices)
- [Secretlint Documentation](https://github.com/secretlint/secretlint)

## Questions or Concerns?

If you have questions about security practices or concerns about potential vulnerabilities, please reach out to the repository maintainer.

---

**Remember:** Security is everyone's responsibility. When in doubt, ask before committing!
