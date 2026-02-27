#!/bin/bash
# daily_deploy.sh - Daily automation script for ProgrammaticSEO
# Runs at 7:00 AM UTC every day via cron
# Usage: ./daily_deploy.sh

set -e  # Exit on any error

# Configuration
REPO_DIR="/workspaces/ProgrammaticSEO"
LOG_FILE="${REPO_DIR}/logs/daily_deploy_$(date +%Y-%m-%d_%H-%M-%S).log"
mkdir -p "${REPO_DIR}/logs"

# Start logging
{
    echo "=========================================="
    echo "Daily Deployment Started: $(date -u)"
    echo "=========================================="
    
    cd "${REPO_DIR}"
    
    # Step 1: Install dependencies
    echo "[1/4] Installing Python dependencies..."
    python -m pip install -r requirements.txt --quiet
    echo "✓ Dependencies installed"
    
    # Step 2: Run factory.py to generate content
    echo "[2/4] Running factory.py (generating MDX files)..."
    python factory.py
    if [ $? -eq 0 ]; then
        echo "✓ factory.py completed successfully"
    else
        echo "✗ factory.py failed with exit code $?"
        exit 1
    fi
    
    # Step 3: Fix MDX files
    echo "[3/4] Running fix_mdx.py (fixing MDX compatibility)..."
    python fix_mdx.py --apply
    if [ $? -eq 0 ]; then
        echo "✓ fix_mdx.py completed successfully"
    else
        echo "✗ fix_mdx.py failed with exit code $?"
        exit 1
    fi
    
    # Step 4: Git operations
    echo "[4/4] Committing and pushing to Git..."
    
    # Check if there are changes
    if [ -n "$(git status --porcelain)" ]; then
        TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
        git add .
        git commit -m "${TIMESTAMP} deployment"
        git push origin main
        echo "✓ Git operations completed successfully"
    else
        echo "No changes to commit"
    fi
    
    echo "=========================================="
    echo "Daily Deployment Completed: $(date -u)"
    echo "=========================================="
    
} | tee -a "${LOG_FILE}"

echo "Log saved to: ${LOG_FILE}"
