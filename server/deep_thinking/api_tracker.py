"""
API Request Quota Tracker
Tracks usage of rate-limited external APIs with daily/minute counters.
Thread-safe for use in the multi-threaded graph execution.
"""
import threading
from datetime import datetime, timezone
from typing import Dict


# Provider definitions: name → { limit, window }
PROVIDERS = {
    "alpha_vantage": {"limit": 25, "window": "day", "label": "Alpha Vantage"},
    "finnhub":       {"limit": 60, "window": "minute", "label": "Finnhub"},
    "tavily":        {"limit": None, "window": "day", "label": "Tavily"},
    "financial_datasets": {"limit": None, "window": "day", "label": "Financial Datasets"},
    "yfinance":      {"limit": None, "window": "day", "label": "Yahoo Finance"},
}


class ApiTracker:
    def __init__(self):
        self._lock = threading.Lock()
        # { provider: { "count": int, "reset_key": str } }
        self._counters: Dict[str, dict] = {}

    def _reset_key(self, window: str) -> str:
        """Generate a key that changes when the window rolls over."""
        now = datetime.now(timezone.utc)
        if window == "minute":
            return now.strftime("%Y-%m-%d-%H-%M")
        return now.strftime("%Y-%m-%d")  # day

    def record(self, provider: str) -> None:
        """Record one API call for the given provider."""
        if provider not in PROVIDERS:
            return
        window = PROVIDERS[provider]["window"]
        key = self._reset_key(window)
        with self._lock:
            entry = self._counters.get(provider)
            if not entry or entry["reset_key"] != key:
                self._counters[provider] = {"count": 1, "reset_key": key}
            else:
                entry["count"] += 1

    def get_usage(self) -> list:
        """Return current usage for all tracked providers."""
        result = []
        for name, info in PROVIDERS.items():
            key = self._reset_key(info["window"])
            with self._lock:
                entry = self._counters.get(name)
                count = entry["count"] if entry and entry["reset_key"] == key else 0
            result.append({
                "provider": name,
                "label": info["label"],
                "used": count,
                "limit": info["limit"],  # None = unlimited
                "window": info["window"],
            })
        return result


# Singleton instance
tracker = ApiTracker()
