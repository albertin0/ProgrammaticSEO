#!/bin/bash
# setup_cron.sh - Set up daily automation via cron
# This script registers the daily_deploy.sh to run at 7:00 AM UTC every day

REPO_DIR="/workspaces/ProgrammaticSEO"
SCRIPT_PATH="${REPO_DIR}/daily_deploy.sh"
CRON_SCHEDULE="0 7 * * * ${SCRIPT_PATH}"

# Make the script executable
chmod +x "${SCRIPT_PATH}"

# Check current cron jobs
echo "Current cron jobs for this user:"
crontab -l 2>/dev/null || echo "No existing cron jobs"

echo ""
echo "Adding daily deployment cron job..."
echo "Time: 7:00 AM UTC (every day)"
echo "Script: ${SCRIPT_PATH}"
echo ""

# Add the cron job (avoiding duplicates)
(crontab -l 2>/dev/null | grep -v "${SCRIPT_PATH}"; echo "${CRON_SCHEDULE}") | crontab -

echo "✓ Cron job installed successfully!"
echo ""
echo "To verify installation, run:"
echo "  crontab -l"
echo ""
echo "To remove the cron job later, run:"
echo "  crontab -e"
echo "  and remove the line containing daily_deploy.sh"
