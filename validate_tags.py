#!/usr/bin/env python3
import sys
import re
from pathlib import Path

VAULT_DIR = Path(__file__).parent / "vault"

def validate_tags(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    
    # Check BulletList
    open_bullets = len(re.findall(r'<BulletList>', text))
    close_bullets = len(re.findall(r'</BulletList>', text))
    
    errors = 0
    if open_bullets != close_bullets:
        print(f"❌ {path.relative_to(VAULT_DIR)}: <BulletList> count mismatch ({open_bullets} open, {close_bullets} close)")
        errors += 1
        
    # Check AlertBox
    open_alerts = len(re.findall(r'<AlertBox[^>]*>', text))
    close_alerts = len(re.findall(r'</AlertBox>', text))
    
    if open_alerts != close_alerts:
        print(f"❌ {path.relative_to(VAULT_DIR)}: <AlertBox> count mismatch ({open_alerts} open, {close_alerts} close)")
        errors += 1

    return errors

def main():
    mdx_files = list(VAULT_DIR.rglob("*.mdx"))
    print(f"Validating {len(mdx_files)} MDX files...")
    total_errors = sum(validate_tags(f) for f in mdx_files)
    print(f"Found {total_errors} tag closure errors.")

if __name__ == "__main__":
    main()
