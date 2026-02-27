# Automation Architecture Overview

## Daily Deployment Workflow

```
┌─────────────────────────────────────────┐
│   7:00 AM UTC (Every Day)               │
│   Scheduled Trigger                     │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────▼──────────┐
        │  GitHub Actions OR │
        │  Cron Job          │
        └─────────┬──────────┘
                  │
    ┌─────────────┼──────────────┐
    │             │              │
    ▼             ▼              ▼
┌────────┐   ┌────────┐   ┌─────────┐
│ Cron   │   │GitHub  │   │ Logs    │
│Script  │   │Actions │   │ Output  │
└────────┘   └────────┘   └─────────┘
    │             │            
    └─────────────┼────────────┘
                  │
         ┌────────▼────────┐
         │   Execute:      │
         │ daily_deploy.sh │
         └────────┬────────┘
                  │
    ┌─────────────┼──────────────┐
    │             │              │
    ▼             ▼              ▼
  Step 1        Step 2        Step 3       Step 4
┌──────────┐ ┌───────────┐ ┌─────────┐ ┌────────────┐
│Install   │ │Run        │ │Run      │ │Git Push    │
│Python    │ │factory.py │ │fix_mdx  │ │Commit &    │
│packages  │ │           │ │--apply  │ │Push        │
└──────────┘ └───────────┘ └─────────┘ └────────────┘
     │            │            │           │
     │            ▼            │           │
     │       Generate MDX      │           │
     │       Files in vault/   │           │
     │                         ▼           │
     │                   Sanitize for JSX  │
     │                         │           │
     └─────────────────────────┼───────────┘
                               │
                         ┌─────▼──────┐
                         │ Git Commit │
                         │ & Push     │
                         └─────┬──────┘
                               │
                    GitHub deployed ✅
```

---

## Implementation Options Comparison

### Option 1: GitHub Actions (Recommended)
```yaml
File: .github/workflows/daily-deploy.yml
Schedule: 0 7 * * * (7:00 AM UTC, every day)
Trigger: Automatic + Manual (workflow_dispatch)
Logs: GitHub Actions UI + Email notifications
Reliability: ⭐⭐⭐⭐⭐ (GitHub infrastructure)
```

### Option 2: Cron Job (Local)
```bash
File: daily_deploy.sh + setup_cron.sh
Schedule: 0 7 * * * /workspaces/ProgrammaticSEO/daily_deploy.sh
Trigger: Automatic via cron daemon
Logs: Local files in logs/ directory
Reliability: ⭐⭐⭐ (depends on container uptime)
```

---

## Execution Flow Diagram

```
START (7:00 AM UTC)
  │
  ├─► git checkout main
  │
  ├─► python -m pip install -r requirements.txt
  │   └─► Installs dependencies
  │       (pandas, requests, google-genai, python-dotenv)
  │
  ├─► python factory.py
  │   ├─► Reads cities.csv
  │   ├─► Fetches data from APIs (Ambee, Gemini)
  │   └─► Writes MDX files to vault/[country]/[state]/[city].mdx
  │
  ├─► python fix_mdx.py --apply
  │   ├─► Scans all .mdx files in vault/
  │   └─► Replaces bare < with &lt; (JSX compatibility)
  │
  ├─► git add .
  │   └─► Stages all changes (new/modified MDX files)
  │
  ├─► git commit -m "[TIMESTAMP] deployment"
  │   └─► Creates commit with UTC timestamp
  │       Format: "2024-02-27 07:00:00 UTC deployment"
  │
  └─► git push origin main
      └─► Pushes to GitHub repository
          END ✅ (or log error if it fails)
```

---

## File Structure Created

```
ProgrammaticSEO/
├── .github/
│   └── workflows/
│       └── daily-deploy.yml          ← GitHub Actions workflow
├── daily_deploy.sh                   ← Main deployment script
├── setup_cron.sh                     ← Cron setup helper
├── test_deployment.sh                ← Testing script
├── AUTOMATION_SETUP.md               ← Full documentation
├── AUTOMATION_QUICKSTART.md          ← Quick start guide
├── AUTOMATION_ARCHITECTURE.md        ← This file
├── logs/                             ← Auto-created log directory
│   └── daily_deploy_YYYY-MM-DD_HH-MM-SS.log
├── factory.py                        ← Existing: Generate MDX
├── fix_mdx.py                        ← Existing: Fix MDX
├── requirements.txt                  ← Existing: Python deps
├── cities.csv                        ← Existing: City list
└── vault/                            ← Existing: Generated content
    ├── ca/
    │   ├── alberta/
    │   ├── british-columbia/
    │   └── ...
    └── us/
        ├── alabama/
        └── ...
```

---

## Error Handling & Recovery

All scripts include:

```bash
set -e  # Exit on any error

# Step verification
if [ $? -eq 0 ]; then
    echo "✓ Step completed"
else
    echo "✗ Step failed with exit code"
    exit 1
fi
```

### Failure scenarios:

1. **pip install fails** → Stop immediately, log error
2. **factory.py fails** → Stop, skip git operations
3. **fix_mdx.py fails** → Stop, skip git operations
4. **git operations fail** → Log error, don't retry automatically

### GitHub Actions recovery:
- Displays failed step clearly
- Can be re-run manually
- Email notification sent on failure

### Cron recovery:
- Log file shows exact error
- Manual re-run: `./daily_deploy.sh`
- No automatic retry (intentional safety)

---

## Environment Setup

### For GitHub Actions:
```yaml
# Automatically available:
- Python 3.11
- pip
- Git
- GitHub CLI (gh)

# Add secrets in GitHub:
Settings → Secrets and variables → Actions
- GEMINI_API_KEY
- AMBEE_API_KEY
```

### For Cron:
```bash
# Create .env file:
GEMINI_API_KEY=your_key
AMBEE_API_KEY=your_key

# python-dotenv loads these automatically
```

---

## Monitoring & Alerting

### GitHub Actions:
```
Dashboard: https://github.com/albertin0/ProgrammaticSEO/actions
├── View past runs with timestamps
├── See detailed logs for each step
├── Get email on failure
└── Manual trigger available
```

### Cron:
```
Local logs: logs/daily_deploy_*.log
├── One log file per execution
├── Timestamped start/end
├── Shows each step status
└── All output captured (stdout + stderr)
```

---

## Performance Metrics

**Time to execute (estimated):**
- pip install: 10-30 seconds
- factory.py: 2-10 minutes (depends on city count & API response)
- fix_mdx.py: 5-20 seconds (depends on file count)
- git operations: 2-5 seconds
- **Total: 2-12 minutes** ⏱️

**Storage:**
- Logs: ~1-2 KB per execution
- ~30 days of logs: ~30-60 KB
- No cleanup needed (logs are small)

---

## Security Considerations

✅ **Already secure:**
- API keys in .env or GitHub secrets (not in code)
- git user is configured
- Scripts validate step completion before next step
- No hardcoded credentials

⚠️ **Best practices:**
- Keep GEMINI_API_KEY secure
- Keep AMBEE_API_KEY secure
- Review generated MDX files before push
- Monitor GitHub Actions logs

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Cron not running | Check: `crontab -l`, `service cron status` |
| GitHub Actions not triggering | Check: `.github/workflows/daily-deploy.yml` exists, repo is public or has Actions enabled |
| API key errors | Verify .env file or GitHub Secrets configured |
| Git push fails | Check: git user configured, SSH/HTTPS auth working |
| No logs created | Check: `logs/` directory exists, script has write permissions |

---

## Next Steps

1. **Choose your automation method:**
   - GitHub Actions (recommended) → See AUTOMATION_QUICKSTART.md
   - Cron (local) → See AUTOMATION_SETUP.md (Option 2)

2. **Set up environment variables** (if needed by scripts)

3. **Test the workflow:**
   ```bash
   ./test_deployment.sh
   ```

4. **Deploy:**
   - GitHub Actions: `git push` the workflow file
   - Cron: `./setup_cron.sh`

5. **Monitor on schedule:**
   - GitHub: https://github.com/albertin0/ProgrammaticSEO/actions
   - Cron: `tail logs/daily_deploy_*.log`

---

**All set! Your automation infrastructure is ready to use.** 🚀
