# Daily Automation Setup Guide

This document explains how to set up daily automated deployments for the ProgrammaticSEO project. The workflow runs:
1. `python -m pip install -r requirements.txt`
2. `python factory.py` (generates MDX files)
3. `python fix_mdx.py --apply` (fixes MDX compatibility)
4. `git add .` + `git commit` + `git push origin main`

**Every day at 7:00 AM UTC**

---

## **Option 1: GitHub Actions (Recommended) ✅**

GitHub Actions is **recommended** because:
- ✅ Runs on GitHub's infrastructure (no container requirements)
- ✅ Automatic retry on failure
- ✅ Built-in logging and monitoring
- ✅ Works even if your local container restarts
- ✅ Free tier includes plenty of usage

### Setup Steps:

1. **The workflow file is already created** at `.github/workflows/daily-deploy.yml`

2. **Verify it exists:**
   ```bash
   ls -la .github/workflows/daily-deploy.yml
   ```

3. **Push to GitHub:**
   ```bash
   git add .github/workflows/daily-deploy.yml
   git commit -m "Add daily deployment workflow"
   git push origin main
   ```

4. **Verify on GitHub:**
   - Go to: https://github.com/albertin0/ProgrammaticSEO/actions
   - You should see "Daily Deployment" workflow
   - It will run automatically every day at 7:00 AM UTC

5. **Test manually (optional):**
   - Go to Actions tab → Daily Deployment
   - Click "Run workflow" → "Run workflow"

### How to check logs:
- Visit GitHub Actions page → Click the workflow run → View logs

### How to disable later:
- Go to `.github/workflows/daily-deploy.yml` → delete the file or set `enabled: false`

---

## **Option 2: Cron Job (Local Container) ⚙️**

Use this if you want automation running on your local/container environment.

### Setup Steps:

1. **Make the scripts executable:**
   ```bash
   chmod +x daily_deploy.sh setup_cron.sh
   ```

2. **Install the cron job:**
   ```bash
   ./setup_cron.sh
   ```

3. **Verify installation:**
   ```bash
   crontab -l
   ```
   You should see a line like:
   ```
   0 7 * * * /workspaces/ProgrammaticSEO/daily_deploy.sh
   ```

4. **Check logs after execution:**
   ```bash
   ls -la logs/
   cat logs/daily_deploy_*.log
   ```

### Manual test (run the script now):
```bash
./daily_deploy.sh
```

### How to disable later:
```bash
crontab -e
# Remove the line with daily_deploy.sh
```

### Troubleshooting cron:
- Check if cron service is running: `service cron status`
- View cron logs: `sudo grep CRON /var/log/syslog` (if available)
- Test with: `./daily_deploy.sh 2>&1 | tee test.log`

---

## **Comparison Table**

| Feature | GitHub Actions | Cron Job |
|---------|---|---|
| Cloud-based | ✅ Yes | ❌ No (local) |
| Requires container to run | ❌ No | ✅ Yes |
| Easy to monitor | ✅ Great UI | ⚠️ Manual logs |
| Cost | ✅ Free tier | ✅ Free |
| Setup complexity | ⭐⭐ Easy | ⭐⭐⭐ Moderate |
| **Recommended** | ✅ **YES** | ⚠️ Fallback |

---

## **Environment Variables**

If any scripts require environment variables (e.g., API keys), ensure they're available:

### For GitHub Actions:
1. Go to GitHub repo settings → Secrets and variables → Actions
2. Add secrets like `GEMINI_API_KEY`, `AMBEE_API_KEY`, etc.
3. Update `.github/workflows/daily-deploy.yml` to reference them:
   ```yaml
   env:
     GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
   ```

### For Cron:
1. Create a `.env` file in the repo root
2. Cron will load it via `python-dotenv` in the scripts

---

## **Files Generated**

- `daily_deploy.sh` - Main deployment script with logging
- `setup_cron.sh` - Helper script to install cron job
- `.github/workflows/daily-deploy.yml` - GitHub Actions workflow
- `logs/` - Log files from cron executions (created automatically)

---

## **Quick Start**

**For GitHub Actions (Recommended):**
```bash
git add .github/workflows/daily-deploy.yml
git commit -m "Add daily deployment workflow"
git push origin main
# Done! Visit GitHub Actions to verify
```

**For Cron:**
```bash
chmod +x daily_deploy.sh setup_cron.sh
./setup_cron.sh
crontab -l  # Verify
```

---

## **Monitoring & Alerts**

### GitHub Actions:
- Enable notifications in GitHub settings
- Set up branch protection rules to monitor status checks

### Cron:
- Check logs regularly: `tail -f logs/daily_deploy_*.log`
- Set up email alerts if needed (configure in cron job)

---

**Questions?** Check the logs or run the script manually to debug!
