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
    """Format a min/max/avg dict into a readable string."""
    if m is None:
        return "N/A (MongoDB not connected)"
    lo, hi = m["min_ms"], m["max_ms"]
    return f"{lo:.0f}–{hi:.0f}ms ({lo/1000:.3f}–{hi/1000:.3f}s)"


def fmt_per(ms):
    if ms is None:
        return "N/A (MongoDB not connected)"
    return f"{ms:.3f}ms per item"


def build_table(r, updated_at):
    v = r.get("validation")
    p = r.get("parsing")
    u = r.get("upload")
    d = r.get("delete")
    pq = r.get("per_question_ms")
    po = r.get("per_option_ms")
    cs = r.get("cold_start_ms")

    cold_str = f"{cs:.0f}ms" if cs is not None else "N/A"

    rows = [
        ("**File Validation**",      fmt_range(v)),
        ("**Form Parsing**",         fmt_range(p)),
        ("**Form Upload**",          fmt_range(u)),
        ("**Question Processing**",  fmt_per(pq)),
        ("**Option Processing**",    fmt_per(po)),
        ("**Batch Processing**",     fmt_range(u)),
        ("**Delete Operations**",    fmt_range(d)),
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
    new_table = build_table(results, updated_at)

    with open(README_FILE) as f:
        content = f.read()

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
