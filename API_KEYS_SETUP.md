# 🔐 API Keys Setup - Complete Checklist

## Your API Keys

```
GEMINI_API_KEY=AIzaSyBj505mrGf6l6Esq0VHnRYV-ttl3GbfrRA
GOOGLE_MAPS_API_KEY=AIzaSyAqUR5tLI5JhGaD8gweLoPmL6UtvmH6VLQ
```

---

## ✅ Setup for GitHub Actions (Recommended)

### Step 1: Add Secrets to GitHub
1. Open: https://github.com/albertin0/ProgrammaticSEO/settings/secrets/actions
2. Click **"New repository secret"**
3. Add these two secrets:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | `AIzaSyBj505mrGf6l6Esq0VHnRYV-ttl3GbfrRA` |
| `GOOGLE_MAPS_API_KEY` | `AIzaSyAqUR5tLI5JhGaD8gweLoPmL6UtvmH6VLQ` |

### Step 2: Commit and Push
```bash
git add .github/workflows/daily-deploy.yml
git commit -m "Setup API keys for GitHub Actions"
git push origin main
```

### Step 3: Verify It Works
1. Go to: https://github.com/albertin0/ProgrammaticSEO/actions
2. Click "Daily Deployment" workflow
3. Click "Run workflow" → "Run workflow"
4. Check logs - should see content generation, NOT:
   ```
   ⚠️  No GEMINI_API_KEY — using mock MDX content
   ```

---

## ✅ Setup for Local Cron (Alternative)

### Step 1: Create .env File
```bash
cat > /workspaces/ProgrammaticSEO/.env << 'EOF'
GEMINI_API_KEY=AIzaSyBj505mrGf6l6Esq0VHnRYV-ttl3GbfrRA
GOOGLE_MAPS_API_KEY=AIzaSyAqUR5tLI5JhGaD8gweLoPmL6UtvmH6VLQ
EOF
```

### Step 2: Verify .env is Ignored
```bash
# Make sure .env is in .gitignore
echo ".env" >> /workspaces/ProgrammaticSEO/.gitignore
git add .gitignore
git commit -m "Ensure .env is not tracked"
git push origin main
```

### Step 3: Install Cron Job
```bash
cd /workspaces/ProgrammaticSEO
./setup_cron.sh
```

### Step 4: Test Locally
```bash
./daily_deploy.sh
```

---

## Files Updated for API Keys

✅ `.github/workflows/daily-deploy.yml`
- Moved API key step before factory.py/fix_mdx.py
- Sets GEMINI_API_KEY and GOOGLE_MAPS_API_KEY from secrets

✅ `daily_deploy.sh`
- Now loads .env file automatically
- Exports environment variables for Python scripts

✅ `.env.example`
- Added template for local development
- Use as reference: `cp .env.example .env`

✅ `GITHUB_SECRETS_SETUP.md`
- Complete guide for adding secrets to GitHub

---

## 🧪 Test Your Setup

### GitHub Actions Test:
```bash
git push origin main
# Go to https://github.com/albertin0/ProgrammaticSEO/actions
# Click "Run workflow" to test immediately (don't wait for 7 AM)
```

### Local Cron Test:
```bash
# Create .env
echo "GEMINI_API_KEY=AIzaSyBj505mrGf6l6Esq0VHnRYV-ttl3GbfrRA" > .env
echo "GOOGLE_MAPS_API_KEY=AIzaSyAqUR5tLI5JhGaD8gweLoPmL6UtvmH6VLQ" >> .env

# Test the script
./daily_deploy.sh
```

---

## 🔒 Security Reminders

⚠️ **DO NOT:**
- ❌ Commit `.env` to git
- ❌ Share API keys publicly
- ❌ Hardcode keys in code

✅ **DO:**
- ✅ Use GitHub Secrets for sensitive data
- ✅ Keep `.env` in `.gitignore`
- ✅ Rotate keys periodically
- ✅ Monitor API usage (check Google Cloud Console)

---

## 📋 Verification Checklist

### For GitHub Actions:
- [ ] Secrets added at: https://github.com/albertin0/ProgrammaticSEO/settings/secrets/actions
  - [ ] GEMINI_API_KEY ✓
  - [ ] GOOGLE_MAPS_API_KEY ✓
- [ ] Workflow file committed: `.github/workflows/daily-deploy.yml`
- [ ] Pushed to main: `git push origin main`
- [ ] Test run successful: Actions page shows completed workflow
- [ ] No more "No GEMINI_API_KEY" warnings

### For Cron:
- [ ] `.env` file created with both keys
- [ ] `.env` added to `.gitignore`
- [ ] `setup_cron.sh` executed successfully
- [ ] Cron job verified: `crontab -l`
- [ ] Test run successful: `./daily_deploy.sh`

---

## 🚀 You're All Set!

Your automation is now fully configured:
- ✅ API keys available for GitHub Actions
- ✅ API keys available for local cron (if using)
- ✅ Daily 7 AM UTC deployment with full functionality
- ✅ No more mock content generation

**Next steps:**
1. Commit any remaining changes: `git add . && git commit -m "Complete API key setup"`
2. Push to GitHub: `git push origin main`
3. Monitor first run at 7 AM UTC or test manually now

---

**Status:** 🟢 **API Key Integration Complete!**
