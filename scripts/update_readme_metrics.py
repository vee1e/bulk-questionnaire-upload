#!/usr/bin/env python3
"""
Read perf_results.json and update the Performance Metrics Table in README.md.
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

ROOT = os.path.join(os.path.dirname(__file__), "..")
RESULTS_FILE = os.path.join(ROOT, "perf_results.json")
README_FILE = os.path.join(ROOT, "README.md")


def fmt_range(m):
    """Format a min/max/avg dict into a readable string, or None if unavailable."""
    if m is None:
        return None
    lo, hi = m["min_ms"], m["max_ms"]
    return f"{lo:.0f}–{hi:.0f}ms ({lo/1000:.3f}–{hi/1000:.3f}s)"


def fmt_per(ms):
    if ms is None:
        return None
    return f"{ms:.3f}ms per item"


def parse_existing_table(content):
    """Extract previous metric values from the README table by label."""
    existing = {}
    marker_pattern = re.compile(
        r"<!-- PERF_TABLE_START -->.*?<!-- PERF_TABLE_END -->",
        re.DOTALL,
    )
    match = marker_pattern.search(content)
    if not match:
        return existing
    row_pattern = re.compile(r"\|\s*(\*\*[^|]+\*\*)\s*\|\s*([^|]+)\s*\|")
    for m in row_pattern.finditer(match.group(0)):
        label = m.group(1).strip()
        value = m.group(2).strip()
        existing[label] = value
    return existing


def build_table(r, updated_at, existing=None):
    v = r.get("validation")
    p = r.get("parsing")
    u = r.get("upload")
    d = r.get("delete")
    pq = r.get("per_question_ms")
    po = r.get("per_option_ms")
    cs = r.get("cold_start_ms")

    cold_str = f"{cs:.0f}ms" if cs is not None else "N/A"

    def keep_prev(label, value):
        """Return value if measured, otherwise the previous README value."""
        if value is not None:
            return value
        if existing:
            prev = existing.get(label, "")
            if prev and "MongoDB not connected" not in prev and prev != "N/A":
                return prev
        return "N/A"

    rows = [
        ("**File Validation**",      keep_prev("**File Validation**",     fmt_range(v))),
        ("**Form Parsing**",         keep_prev("**Form Parsing**",         fmt_range(p))),
        ("**Form Upload**",          keep_prev("**Form Upload**",          fmt_range(u))),
        ("**Question Processing**",  keep_prev("**Question Processing**",  fmt_per(pq))),
        ("**Option Processing**",    keep_prev("**Option Processing**",    fmt_per(po))),
        ("**Batch Processing**",     keep_prev("**Batch Processing**",     fmt_range(u))),
        ("**Delete Operations**",    keep_prev("**Delete Operations**",    fmt_range(d))),
        ("**Cold Start Time**",      cold_str),
    ]

    lines = [
        f"<!-- PERF_TABLE_START -->",
        f"",
        f"*Last measured: {updated_at} UTC against the live Render deployment.*",
        f"",
        f"| Metric Type | Recent Performance |",
        f"|-------------|-------------------|",
    ]
    for label, value in rows:
        lines.append(f"| {label} | {value} |")
    lines.append("")
    lines.append("<!-- PERF_TABLE_END -->")
    return "\n".join(lines)


def main():
    if not os.path.exists(RESULTS_FILE):
        print("perf_results.json not found – nothing to update.")
        sys.exit(1)

    with open(RESULTS_FILE) as f:
        results = json.load(f)

    updated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

    with open(README_FILE) as f:
        content = f.read()

    existing = parse_existing_table(content)
    new_table = build_table(results, updated_at, existing=existing)

    # Replace between markers if they exist, otherwise replace the whole table
    marker_pattern = re.compile(
        r"<!-- PERF_TABLE_START -->.*?<!-- PERF_TABLE_END -->",
        re.DOTALL,
    )
    if marker_pattern.search(content):
        updated = marker_pattern.sub(new_table, content)
    else:
        # First run: inject markers around the existing table
        table_pattern = re.compile(
            r"(\| Metric Type \| Recent Performance \|.*?\n(?:\|.*?\n)+)",
            re.DOTALL,
        )
        if table_pattern.search(content):
            updated = table_pattern.sub(new_table + "\n", content)
        else:
            print("Could not find metrics table in README – aborting.")
            sys.exit(1)

    with open(README_FILE, "w") as f:
        f.write(updated)

    print(f"README updated with metrics from {updated_at}")


if __name__ == "__main__":
    main()
