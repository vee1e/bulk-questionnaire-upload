#!/usr/bin/env python3
"""
Measure API performance against the live Render deployment.
Outputs perf_results.json in the repo root.
"""

import json
import os
import sys
import time

import httpx
import pandas as pd

BASE_URL = os.getenv("BACKEND_URL", "https://bulk-questionnaire-upload.onrender.com")
TEST_FILE = os.path.join(os.path.dirname(__file__), "../tests/test_xlsforms_valid/valid_form_1.xlsx")
RUNS = 3


def timed_runs(fn, runs=RUNS):
    times = []
    last_result = None
    for _ in range(runs):
        t0 = time.perf_counter()
        last_result = fn()
        times.append((time.perf_counter() - t0) * 1000)
    return {
        "min_ms": round(min(times), 1),
        "max_ms": round(max(times), 1),
        "avg_ms": round(sum(times) / len(times), 1),
    }, last_result


def log(msg):
    print(msg, flush=True)


def main():
    results = {}

    # ── Warmup (wake Render free tier if sleeping) ──────────────────────────
    log("Warming up server (may take up to 60s on free tier)...")
    for attempt in range(3):
        try:
            r = httpx.get(f"{BASE_URL}/api/forms", timeout=90)
            log(f"  Warmup response: {r.status_code}")
            break
        except Exception as e:
            log(f"  Warmup attempt {attempt + 1} failed: {e}")
            if attempt == 2:
                log("Server unreachable – aborting perf run.")
                sys.exit(1)
            time.sleep(10)

    # ── Cold-start latency (first real request after warmup) ─────────────────
    t0 = time.perf_counter()
    httpx.get(f"{BASE_URL}/api/forms", timeout=30)
    results["cold_start_ms"] = round((time.perf_counter() - t0) * 1000, 1)
    log(f"Cold-start: {results['cold_start_ms']}ms")

    # ── File Validation ───────────────────────────────────────────────────────
    def do_validate():
        with open(TEST_FILE, "rb") as f:
            return httpx.post(
                f"{BASE_URL}/api/validate",
                files={"file": ("valid_form_1.xlsx", f,
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
                timeout=30,
            )

    try:
        m, _ = timed_runs(do_validate)
        results["validation"] = m
        log(f"Validation:  {m}")
    except Exception as e:
        log(f"Validation failed: {e}")
        results["validation"] = None

    # ── Form Parsing ──────────────────────────────────────────────────────────
    def do_parse():
        with open(TEST_FILE, "rb") as f:
            return httpx.post(
                f"{BASE_URL}/api/forms/parse",
                files={"file": ("valid_form_1.xlsx", f,
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
                timeout=60,
            )

    try:
        m, _ = timed_runs(do_parse)
        results["parsing"] = m
        log(f"Parsing:     {m}")
    except Exception as e:
        log(f"Parsing failed: {e}")
        results["parsing"] = None

    # ── Form Upload (requires MongoDB) ────────────────────────────────────────
    uploaded_id = None

    def do_upload():
        with open(TEST_FILE, "rb") as f:
            return httpx.post(
                f"{BASE_URL}/api/upload",
                files=[("files", ("valid_form_1.xlsx", f,
                                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))],
                timeout=90,
            )

    try:
        m, resp = timed_runs(do_upload, runs=1)
        if resp.status_code == 200:
            results["upload"] = m
            log(f"Upload:      {m}")
            data = resp.json()
            for item in (data if isinstance(data, list) else [data]):
                if isinstance(item, dict):
                    uploaded_id = item.get("id") or item.get("_id")
                    if uploaded_id:
                        break
        else:
            log(f"Upload returned {resp.status_code} – skipping (MongoDB not connected?)")
            results["upload"] = None
    except Exception as e:
        log(f"Upload skipped: {e}")
        results["upload"] = None

    # ── Per-question / per-option (derived from upload) ───────────────────────
    df = pd.read_excel(TEST_FILE, sheet_name=None)
    question_count = len(df.get("Questions Info", pd.DataFrame()))
    option_count = len(df.get("Answer Options", pd.DataFrame()))

    if results.get("upload") and question_count:
        avg = results["upload"]["avg_ms"]
        results["per_question_ms"] = round(avg / question_count, 3)
        results["per_option_ms"] = round(avg / option_count, 3) if option_count else None
    else:
        results["per_question_ms"] = None
        results["per_option_ms"] = None

    # ── Delete (requires MongoDB) ─────────────────────────────────────────────
    if uploaded_id:
        def do_delete():
            return httpx.delete(f"{BASE_URL}/api/forms/{uploaded_id}", timeout=30)

        try:
            m, _ = timed_runs(do_delete, runs=1)
            results["delete"] = m
            log(f"Delete:      {m}")
        except Exception as e:
            log(f"Delete failed: {e}")
            results["delete"] = None
    else:
        log("Delete skipped (no uploaded form to delete)")
        results["delete"] = None

    # ── Save results ──────────────────────────────────────────────────────────
    out_path = os.path.join(os.path.dirname(__file__), "../perf_results.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    log(f"\nResults saved to perf_results.json")
    log(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
