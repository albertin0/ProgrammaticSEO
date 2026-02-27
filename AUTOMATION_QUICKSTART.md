# Daily Automation Quick Start Guide

## Generated Files Summary

✅ **Created 4 automation scripts + documentation:**

1. **`.github/workflows/daily-deploy.yml`** (GitHub Actions)
   - Cloud-based scheduling
   - Runs at 7:00 AM UTC every day
   - Recommended approach

2. **`daily_deploy.sh`** (Cron script)
   - Main deployment script with logging
   - Runs all pipeline steps
   - Creates logs in `logs/` directory

3. **`setup_cron.sh`** (Cron helper)
   - One-command setup for local automation
   - Registers cron job automatically

4. **`test_deployment.sh`** (Testing script)
   - Safely test workflow before production
   - Verifies all dependencies

5. **`AUTOMATION_SETUP.md`** (Full documentation)
   - Detailed instructions for both approaches
   - Troubleshooting guide
   - Environment variable setup

---

## ⭐ RECOMMENDED: Setup GitHub Actions (2 minutes)

### Step 1: Make scripts executable
```bash
chmod +x daily_deploy.sh setup_cron.sh test_deployment.sh
```

### Step 2: Commit and push
```bash
git add .github/workflows/daily-deploy.yml AUTOMATION_SETUP.md
git commit -m "Setup daily automated deployment"
git push origin main
```

### Step 3: Verify on GitHub
- Go to: https://github.com/albertin0/ProgrammaticSEO/actions
- You should see "Daily Deployment" workflow
- It will automatically run at 7:00 AM UTC every day

---

## Alternative: Setup Cron Job (3 minutes)

If your container runs 24/7 and you prefer local scheduling:

### Step 1: Make scripts executable
```bash
chmod +x daily_deploy.sh setup_cron.sh
```

### Step 2: Install cron job
```bash
./setup_cron.sh
```

### Step 3: Verify installation
```bash
crontab -l
# Should see: 0 7 * * * /workspaces/ProgrammaticSEO/daily_deploy.sh
```

---

## Testing & Monitoring

### Test the workflow (optional, before production):
```bash
./test_deployment.sh
```

### View logs after execution:
```bash
tail -f logs/daily_deploy_*.log
```

### Manual test run (runs deployment immediately):
```bash
./daily_deploy.sh
```

---

## What the Automation Does (Daily at 7:00 AM UTC)

```
1. Install dependencies
   python -m pip install -r requirements.txt

2. Generate content
   python factory.py

3. Fix MDX compatibility
   python fix_mdx.py --apply

4. Commit and push
   git add .
   git commit -m "[TIMESTAMP] deployment"
   git push origin main
```

---

## Environment Variables

The scripts use `python-dotenv`, so any required API keys should be in a `.env` file:

```bash
echo "GEMINI_API_KEY=your_key_here" > .env
echo "AMBEE_API_KEY=your_key_here" >> .env
```

For GitHub Actions, add secrets in repo settings instead of `.env`.

---

## Monitoring Options

**GitHub Actions Dashboard:**
- https://github.com/albertin0/ProgrammaticSEO/actions
- View logs, status, and execution time

**Email Notifications:**
- GitHub can email you on workflow failure

**Cron Logs (if using local cron):**
- Check: `logs/daily_deploy_*.log`
- View: `cat logs/daily_deploy_2024-*.log`

---

## Summary

✅ **GitHub Actions (Recommended)**
- Push `.github/workflows/daily-deploy.yml` to GitHub
- Runs automatically at 7 AM UTC
- No container required

✅ **Cron (Alternative)**
- Run `./setup_cron.sh`
- Runs if container is always on
- Local logging available

**Both methods include:**
- Error handling
- Timestamped logging
- Git change detection
- Safe error exits

---

## Need Help?

1. Read full docs: `AUTOMATION_SETUP.md`
2. Test manually: `./test_deployment.sh`
3. View logs: `tail logs/daily_deploy_*.log`
4. Check GitHub Actions dashboard for workflow status

---

**Status:** ✅ All automation files created and ready to deploy!
