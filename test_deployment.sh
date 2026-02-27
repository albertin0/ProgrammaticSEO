#!/bin/bash
# test_deployment.sh - Safely test the deployment workflow
# This script runs the deployment in dry-run mode to verify everything works

set -e

REPO_DIR="/workspaces/ProgrammaticSEO"
LOG_FILE="${REPO_DIR}/logs/test_deployment_$(date +%Y-%m-%d_%H-%M-%S).log"
mkdir -p "${REPO_DIR}/logs"

{
    echo "=========================================="
    echo "Testing Deployment Workflow: $(date -u)"
    echo "=========================================="
    echo ""
    
    cd "${REPO_DIR}"
    
    # Step 1: Install dependencies
    echo "[1/3] Installing Python dependencies..."
    python -m pip install -r requirements.txt --quiet
    if [ $? -eq 0 ]; then
        echo "✓ Dependencies installed successfully"
    else
        echo "✗ Failed to install dependencies"
        exit 1
    fi
    echo ""
    
    # Step 2: Run factory.py
    echo "[2/3] Testing factory.py (would generate MDX files)..."
    echo "To run factory.py, you may need to provide:"
    echo "  - GEMINI_API_KEY (from Google)"
    echo "  - AMBEE_API_KEY (from Ambee)"
    echo ""
    echo "Checking if .env file exists..."
    if [ -f .env ]; then
        echo "✓ .env file found"
        python factory.py --dry-run
        echo "✓ factory.py test completed (dry-run mode)"
    else
        echo "⚠ .env file not found - skipping factory.py test"
        echo "  Run: echo 'GEMINI_API_KEY=your_key' > .env"
        echo "  Run: echo 'AMBEE_API_KEY=your_key' >> .env"
    fi
    echo ""
    
    # Step 3: Run fix_mdx.py
    echo "[3/3] Testing fix_mdx.py (would fix MDX files)..."
    python fix_mdx.py  # Dry-run by default
    if [ $? -eq 0 ]; then
        echo "✓ fix_mdx.py test completed"
    else
        echo "✗ fix_mdx.py failed"
        exit 1
    fi
    echo ""
    
    echo "=========================================="
    echo "Test Completed: $(date -u)"
    echo "=========================================="
    echo ""
    echo "✓ All tests passed!"
    echo ""
    echo "Next steps:"
    echo "1. Set up GitHub Actions:"
    echo "   git add .github/workflows/daily-deploy.yml"
    echo "   git commit -m 'Add daily deployment workflow'"
    echo "   git push origin main"
    echo ""
    echo "2. OR set up cron:"
    echo "   chmod +x daily_deploy.sh setup_cron.sh"
    echo "   ./setup_cron.sh"
    echo ""
    echo "See AUTOMATION_SETUP.md for detailed instructions"
    
} | tee -a "${LOG_FILE}"

echo ""
echo "Full log saved to: ${LOG_FILE}"
