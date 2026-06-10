import time
import os

METRICS_FILE = os.path.join(os.path.dirname(__file__), "metrics.txt")


def log_metric(metric_name: str, value) -> None:
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(METRICS_FILE, "a") as f:
        f.write(f"[{timestamp}] {metric_name}: {value}\n")
