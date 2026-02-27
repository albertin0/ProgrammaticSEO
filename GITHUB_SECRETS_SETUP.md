# GitHub Secrets Setup Guide

## Add API Keys to GitHub Actions

Follow these steps to add the required API keys as secrets in your GitHub repository:

### Step 1: Go to Repository Settings
1. Navigate to: https://github.com/albertin0/ProgrammaticSEO/settings
2. In the left sidebar, click **"Secrets and variables"** → **"Actions"**

### Step 2: Create Secret #1 - GEMINI_API_KEY
1. Click **"New repository secret"** button
2. **Name:** `GEMINI_API_KEY`
3. **Value:** `AIzaSyBj505mrGf6l6Esq0VHnRYV-ttl3GbfrRA`
4. Click **"Add secret"**

### Step 3: Create Secret #2 - GOOGLE_MAPS_API_KEY
1. Click **"New repository secret"** button
2. **Name:** `GOOGLE_MAPS_API_KEY`
3. **Value:** `AIzaSyAqUR5tLI5JhGaD8gweLoPmL6UtvmH6VLQ`
4. Click **"Add secret"**

### Verification
After adding, you should see both secrets listed:
- ✅ GEMINI_API_KEY
- ✅ GOOGLE_MAPS_API_KEY

---

## How to Access Secrets in GitHub Actions

The workflow file (`.github/workflows/daily-deploy.yml`) automatically references these:

```yaml
- name: Set environment variables
  run: |
    echo "GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }}" >> $GITHUB_ENV
    echo "GOOGLE_MAPS_API_KEY=${{ secrets.GOOGLE_MAPS_API_KEY }}" >> $GITHUB_ENV
```

When the workflow runs:
1. GitHub securely injects the secret values
2. Sets them as environment variables
3. `factory.py` and other scripts can access them via `os.getenv()`
4. Secrets are masked in logs (never exposed in output)

---

## For Local Development (Cron)

If using the cron approach, create a `.env` file:

```bash
# .env file (add to .gitignore!)
GEMINI_API_KEY=AIzaSyBj505mrGf6l6Esq0VHnRYV-ttl3GbfrRA
GOOGLE_MAPS_API_KEY=AIzaSyAqUR5tLI5JhGaD8gweLoPmL6UtvmH6VLQ
```

The `python-dotenv` library in `requirements.txt` will load these automatically.

---

## Security Best Practices ⚠️

✅ **Do NOT:**
- Commit API keys to git
- Expose secrets in logs
- Share keys publicly

✅ **Do:**
- Use GitHub Secrets for sensitive data
- Rotate keys periodically
- Use `.env` with `.gitignore` for local development
- Monitor API usage and set spending limits

---

## Verify Secrets Are Working

After adding secrets and pushing:
1. Go to: https://github.com/albertin0/ProgrammaticSEO/actions
2. Click the "Daily Deployment" workflow
3. Click the latest run
4. Check the "Run factory.py" step - it should no longer show:
   ```
   ⚠️  No GEMINI_API_KEY — using mock MDX content
   ```

---

## If You Get "No GEMINI_API_KEY" Error

1. **Verify secrets were added:**
   - Settings → Secrets and variables → Actions
   - Both secrets should be listed ✅

2. **Rebuild workflow:**
   - Push a commit: `git push origin main`
   - Manually trigger: Actions → Daily Deployment → Run workflow
   - Check the logs

3. **Check for typos:**
   - Secret names must be exact: `GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`
   - No spaces or extra characters

---

## Done! ✅

Your GitHub Actions workflow will now properly authenticate with:
- ✅ Gemini API
- ✅ Google Maps API

The daily 7 AM UTC deployment will have full access to these services.
