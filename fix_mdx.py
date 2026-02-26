#!/usr/bin/env python3
"""
fix_mdx.py — Sanitize all vault MDX body content for JSX compatibility.

MDX treats < as JSX tag start. Raw text like (<10µm) or (<2.5µm) breaks the
MDX parser because <1 / <2 look like a malformed JSX opening tag.

This script walks every .mdx file and replaces bare < with &lt; everywhere
OUTSIDE the YAML frontmatter block (--- ... ---).

Usage:
    python fix_mdx.py          # dry-run (shows file list only)
    python fix_mdx.py --apply  # actually writes the fixes
"""

import re
import sys
from pathlib import Path

VAULT_DIR = Path(__file__).parent / "vault"
APPLY = "--apply" in sys.argv

# Matches a bare < that is NOT already part of an HTML entity (&lt;)
# and NOT part of a valid JSX tag (letter, underscore, $ after <)
# We replace <DIGIT and </ that looks like a raw numeric comparison.
# Broad rule: any < that is NOT followed by a letter, /, !, or whitespace
# that would make it a valid JSX/HTML tag → escape it.
# We specifically target: <DIGIT  (most common case from pollen µm strings)
PATTERNS = [
    # (<10µm), (<2.5µm), etc. — numeric comparisons in parentheses
    (re.compile(r'(<)(\d)'), r'&lt;\2'),
    # bare < N (space before digit) just in case
    (re.compile(r'(<)(\s*\d)'), r'&lt;\2'),
]


def fix_body(body: str) -> tuple[str, int]:
    """Apply all substitution patterns to the MDX body. Returns (fixed, count)."""
    total = 0
    for pattern, repl in PATTERNS:
        new_body, n = pattern.subn(repl, body)
        total += n
        body = new_body
        
    # Fix missing </BulletList>
    open_bullets = len(re.findall(r'<BulletList>', body))
    close_bullets = len(re.findall(r'</BulletList>', body))
    if open_bullets > close_bullets:
        missing = open_bullets - close_bullets
        body += "\n" + ("</BulletList>\n" * missing)
        total += missing

    # Fix missing </AlertBox>
    open_alerts = len(re.findall(r'<AlertBox[^>]*>', body))
    close_alerts = len(re.findall(r'</AlertBox>', body))
    if open_alerts > close_alerts:
        missing = open_alerts - close_alerts
        body += "\n" + ("</AlertBox>\n" * missing)
        total += missing
        
    return body, total


def process_file(path: Path, apply: bool) -> int:
    raw = path.read_text(encoding="utf-8")

    # Split on the closing --- of the frontmatter
    # Frontmatter is everything between the first two --- delimiters
    parts = raw.split("---", 2)
    if len(parts) < 3:
        # No valid frontmatter; treat entire file as body
        fixed_body, count = fix_body(raw)
        if count and apply:
            path.write_text(fixed_body, encoding="utf-8")
        return count

    frontmatter = parts[1]
    body = parts[2]

    fixed_body, count = fix_body(body)
    if count:
        if apply:
            path.write_text(f"---{frontmatter}---{fixed_body}", encoding="utf-8")
        print(f"  {'FIXED' if apply else 'WOULD FIX'} ({count} replacements): {path.relative_to(VAULT_DIR.parent)}")
    return count


def main():
    mdx_files = sorted(VAULT_DIR.rglob("*.mdx"))
    print(f"Scanning {len(mdx_files)} MDX files in vault/...\n")

    if not APPLY:
        print("DRY RUN — pass --apply to actually write fixes\n")

    total_files = 0
    total_replacements = 0
    for f in mdx_files:
        count = process_file(f, APPLY)
        if count:
            total_files += 1
            total_replacements += count

    print(f"\n{'Fixed' if APPLY else 'Would fix'} {total_replacements} occurrences across {total_files} files.")


if __name__ == "__main__":
    main()
